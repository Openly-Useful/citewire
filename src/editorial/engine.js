import { sha256 } from './idempotency.js';
import {
  evaluateClassifierGate,
  evaluatePublishabilityGate,
  evaluateRightsGate,
  evaluateSummaryGate,
  evaluateVerificationGate,
} from './gates.js';
import { nextHappyState } from './states.js';

function unavailable(code) {
  return async () => ({ allowed: false, decision: 'hold', reasons: [code] });
}

export function createEditorialEngine({
  store,
  pauseController,
  rightsEvaluator = unavailable('RIGHTS_EVALUATOR_UNAVAILABLE'),
  classifier = async () => ({ mode: 'shadow', abstained: true, inclusion_reasons: ['CLASSIFIER_UNAVAILABLE'] }),
  summarizer = async () => ({ ok: false }),
  verifier = async () => ({ verified: false }),
  policyVersion = 'citewire-editorial-shadow-1.0.0',
  now = () => new Date().toISOString(),
} = {}) {
  if (!store || !pauseController) throw new TypeError('Editorial engine requires an injected store and pause controller.');

  async function process({ accountId, itemId, expectedVersion, runId, context = {} }) {
    pauseController.assertUnpaused();
    const item = store.getItem(accountId, itemId);
    if (!item) throw new TypeError(`Unknown editorial item: ${String(itemId)}`);
    let gate;
    let target = nextHappyState(item.state);

    if (item.state === 'fetched') {
      gate = evaluateRightsGate(await rightsEvaluator({ ...context, operation: 'metadata' }));
    } else if (item.state === 'rights_checked') {
      gate = evaluateClassifierGate(await classifier(context.classifier_input ?? context));
    } else if (item.state === 'classified') {
      const summaryRights = await rightsEvaluator({ ...context, operation: 'summary' });
      gate = evaluateSummaryGate({ rightsDecision: summaryRights, summaryResult: await summarizer(context) });
    } else if (item.state === 'summarized') {
      gate = evaluateVerificationGate(await verifier(context));
    } else if (item.state === 'verified') {
      gate = evaluatePublishabilityGate({ pauseState: pauseController.get(), calibration: context.calibration });
    } else if (item.state === 'publishable') {
      gate = { allowed: false, verdict: 'hold', reason_codes: ['OUTPUT_ADAPTER_DISABLED'], evidence: {} };
    } else {
      throw new TypeError(`Editorial item cannot be processed from ${item.state}.`);
    }

    if (!gate.allowed) target = 'held';
    const createdAt = now();
    const inputHash = sha256({ item_id: item.id, revision: item.revision, state: item.state, gate });
    const eventId = `evt:${sha256({ item_id: item.id, version: item.version, run_id: runId, input_hash: inputHash })}`;
    return store.advance({
      accountId,
      itemId,
      expectedVersion,
      nextState: target,
      decisionEvent: {
        event_id: eventId,
        item_id: item.id,
        from_state: item.state,
        to_state: target,
        stage: item.state,
        verdict: gate.verdict,
        reason_codes: gate.reason_codes,
        policy_version: policyVersion,
        model_version: gate.evidence?.classifier_version ?? gate.evidence?.verifier_version ?? null,
        input_hash: inputHash,
        actor: 'system:editorial-shadow',
        run_id: runId,
        created_at: createdAt,
      },
    });
  }

  function replay({ accountId, itemId, expectedVersion, fromState, replayId, reasonCode = 'EXPLICIT_REPLAY' }) {
    pauseController.assertUnpaused();
    const item = store.getItem(accountId, itemId);
    if (!item) throw new TypeError(`Unknown editorial item: ${String(itemId)}`);
    if (item.state !== 'held') throw new TypeError('Only held items may be replayed.');
    const createdAt = now();
    const inputHash = sha256({ item_id: item.id, revision: item.revision, from_state: fromState, replay_id: replayId });
    return store.advance({
      accountId,
      itemId,
      expectedVersion,
      nextState: fromState,
      decisionEvent: {
        event_id: `evt:${sha256({ replay_id: replayId, input_hash: inputHash })}`,
        item_id: item.id,
        from_state: 'held',
        to_state: fromState,
        stage: 'replay',
        verdict: 'allow',
        reason_codes: [reasonCode],
        policy_version: policyVersion,
        model_version: null,
        input_hash: inputHash,
        actor: 'system:editorial-shadow',
        run_id: replayId,
        created_at: createdAt,
      },
    });
  }

  return Object.freeze({ process, replay });
}

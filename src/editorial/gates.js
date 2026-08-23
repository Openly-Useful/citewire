function verdict(allowed, reasonCodes, evidence = {}) {
  return Object.freeze({ allowed, verdict: allowed ? 'allow' : 'hold', reason_codes: [...reasonCodes], evidence: structuredClone(evidence) });
}

export function evaluateRightsGate(decision) {
  if (decision?.allowed === true && decision?.decision === 'allow') return verdict(true, [], { policy_notice: decision.policy_notice ?? null });
  return verdict(false, decision?.reasons?.length ? decision.reasons : ['RIGHTS_UNKNOWN']);
}

export function evaluateClassifierGate(decision) {
  if (!decision || decision.mode !== 'shadow') return verdict(false, ['CLASSIFIER_NOT_SHADOW']);
  if (decision.abstained) return verdict(false, decision.inclusion_reasons?.length ? decision.inclusion_reasons : ['CLASSIFIER_ABSTAINED']);
  if (!['adjacent', 'standard'].includes(decision.inclusion_tier)) {
    return verdict(false, decision.inclusion_reasons?.length ? decision.inclusion_reasons : ['BELOW_INCLUSION_THRESHOLD']);
  }
  return verdict(true, decision.inclusion_reasons ?? [], {
    score: decision.score,
    inclusion_tier: decision.inclusion_tier,
    classifier_version: decision.classifier_version,
  });
}

export function evaluateSummaryGate({ rightsDecision, summaryResult }) {
  const rights = evaluateRightsGate(rightsDecision);
  if (!rights.allowed) return rights;
  if (summaryResult?.ok !== true || typeof summaryResult.summary !== 'string') {
    return verdict(false, ['SUMMARY_UNAVAILABLE']);
  }
  return verdict(true, [], { summary_hash: summaryResult.summary_hash ?? null });
}

export function evaluateVerificationGate(result) {
  if (result?.verified === true) return verdict(true, result.reason_codes ?? [], { verifier_version: result.verifier_version ?? null });
  return verdict(false, result?.reason_codes?.length ? result.reason_codes : ['VERIFICATION_INCOMPLETE']);
}

export function evaluatePublishabilityGate({ pauseState, calibration }) {
  const reasons = [];
  if (pauseState?.paused !== false) reasons.push('GLOBAL_PAUSE_ACTIVE');
  if (calibration?.status !== 'passed') reasons.push('CALIBRATION_NOT_APPROVED');
  reasons.push('AUTOMATED_PUBLICATION_DISABLED');
  return verdict(false, reasons, { calibration_status: calibration?.status ?? 'missing' });
}

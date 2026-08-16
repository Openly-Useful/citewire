import { verifyDecisionTrace } from './trace.js';

function hold(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

export function assertProjectionEligible({ item, trace, pauseState, rightsDecision, unresolvedExceptions = [] }) {
  if (!item || !['publishable', 'published'].includes(item.state)) hold('EDITORIAL_STATE_NOT_ELIGIBLE');
  if (pauseState?.paused !== false) hold('GLOBAL_PAUSE_ACTIVE');
  verifyDecisionTrace(trace);
  if (trace.events.length === 0) hold('DECISION_TRACE_MISSING');
  if (rightsDecision?.decision !== 'allow' || rightsDecision?.allowed !== true) hold('RIGHTS_NOT_CLEARED');
  if (unresolvedExceptions.length) hold('UNRESOLVED_EXCEPTION');
  return true;
}

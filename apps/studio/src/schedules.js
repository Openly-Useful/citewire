export const DEFAULT_ASSESSMENTS = Object.freeze([
  Object.freeze({ id: 'source-health-daily', cadence: 'P1D', purpose: 'Assess source freshness and transport health.', action: 'assess_only', execution: 'disabled' }),
  Object.freeze({ id: 'rights-review-weekly', cadence: 'P7D', purpose: 'Surface rights records that require review.', action: 'exceptions_only', execution: 'disabled' }),
  Object.freeze({ id: 'registry-review-quarterly', cadence: 'P90D', purpose: 'Assess each default source registry entry.', action: 'hold_until_reviewed', execution: 'disabled' }),
]);

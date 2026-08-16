export const ASSESSMENT_SCHEDULES = Object.freeze([
  Object.freeze({ id: 'source-poll-15m', cadence: 'PT15M', action: 'assess_only', purpose: 'Assess acquisition eligibility and source freshness.' }),
  Object.freeze({ id: 'retry-sweep-hourly', cadence: 'PT1H', action: 'exceptions_only', purpose: 'Assess eligible retries, expired leases, and dead-letter counts.' }),
  Object.freeze({ id: 'source-health-daily', cadence: 'P1D', action: 'exceptions_only', purpose: 'Assess source freshness, transport health, and open exceptions.' }),
  Object.freeze({ id: 'rights-and-drift-weekly', cadence: 'P7D', action: 'exceptions_only', purpose: 'Assess due rights reviews and shadow-classifier drift.' }),
  Object.freeze({ id: 'registry-and-calibration-monthly', cadence: 'P1M', action: 'assess_only', purpose: 'Assess the full registry and produce calibration evidence.' }),
]);

export function listAssessmentSchedules() {
  return structuredClone(ASSESSMENT_SCHEDULES);
}

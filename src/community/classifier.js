export const CLASSIFIER_VERSION = 'citewire-linear-1.0.0';
export const POLICY_VERSION = 'citewire-community-shadow-1.0.0';
export const DEFAULT_THRESHOLDS = Object.freeze({ adjacent_min: 0.5, standard_min: 0.6 });
const ISO_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|([+-])(\d{2}):(\d{2}))$/;

const FEATURES = Object.freeze({
  source_quality: 0.25,
  topical_relevance: 0.3,
  freshness: 0.15,
  rights_confidence: 0.2,
  evidence_density: 0.1,
});

function finiteUnit(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

function validHttpUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') return false;
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol) && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

function validDateTime(value) {
  if (typeof value !== 'string') return false;
  const match = ISO_DATE_TIME.exec(value);
  if (!match) return false;
  const [, year, month, day, hour, minute, second, , offsetHour = '00', offsetMinute = '00'] = match;
  const calendar = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return (
    calendar.getUTCFullYear() === Number(year) &&
    calendar.getUTCMonth() === Number(month) - 1 &&
    calendar.getUTCDate() === Number(day) &&
    Number(hour) <= 23 &&
    Number(minute) <= 59 &&
    Number(second) <= 59 &&
    Number(offsetHour) <= 23 &&
    Number(offsetMinute) <= 59 &&
    !Number.isNaN(Date.parse(value))
  );
}

export function validateThresholds(value = DEFAULT_THRESHOLDS) {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))
  ) {
    throw new TypeError('Community thresholds must be an object.');
  }
  const keys = Object.keys(value);
  if (keys.some((key) => !['adjacent_min', 'standard_min'].includes(key))) {
    throw new TypeError('Community thresholds contain an unsupported field.');
  }
  const adjacentMin = value.adjacent_min ?? DEFAULT_THRESHOLDS.adjacent_min;
  const standardMin = value.standard_min ?? DEFAULT_THRESHOLDS.standard_min;
  if (!finiteUnit(adjacentMin) || !finiteUnit(standardMin) || adjacentMin >= standardMin) {
    throw new TypeError('Community thresholds must satisfy 0 <= adjacent_min < standard_min <= 1.');
  }
  return Object.freeze({ adjacent_min: adjacentMin, standard_min: standardMin });
}

export function classifyInclusion(input, options = {}) {
  if (options.mode !== undefined && options.mode !== 'shadow') {
    throw new TypeError('Community classifier mode must remain shadow.');
  }
  const thresholds = validateThresholds(options.thresholds);
  const reasons = [];
  const missingFeatures = Object.keys(FEATURES).filter((key) => !finiteUnit(input?.[key]));
  if (missingFeatures.length) reasons.push('FEATURES_INCOMPLETE');
  if (input?.rights_decision !== 'allow') reasons.push('RIGHTS_NOT_CLEARED');
  if (typeof input?.title !== 'string' || input.title.trim() === '') reasons.push('TITLE_MISSING');
  if (typeof input?.publisher !== 'string' || input.publisher.trim() === '') reasons.push('PUBLISHER_MISSING');
  if (!validDateTime(input?.published_at)) reasons.push('PUBLISHED_AT_INVALID');
  if (!validHttpUrl(input?.canonical_url)) reasons.push('CANONICAL_URL_INVALID');

  const abstained = reasons.length > 0;
  const rawScore = abstained
    ? null
    : Object.entries(FEATURES).reduce((sum, [key, weight]) => sum + input[key] * weight, 0);
  const score = rawScore === null ? null : Math.round(rawScore * 10000) / 10000;
  let inclusionTier = 'held';
  if (!abstained && score >= thresholds.standard_min) inclusionTier = 'standard';
  else if (!abstained && score >= thresholds.adjacent_min) inclusionTier = 'adjacent';

  if (!abstained) {
    if (input.topical_relevance >= 0.8) reasons.push('HIGH_TOPIC_MATCH');
    if (input.source_quality >= 0.8) reasons.push('ESTABLISHED_SOURCE');
    if (input.freshness < 0.4) reasons.push('LOW_RECENCY');
    if (inclusionTier === 'adjacent') reasons.push('ADJACENT_BAND');
    if (inclusionTier === 'standard') reasons.push('STANDARD_BAND');
    if (inclusionTier === 'held') reasons.push('BELOW_INCLUSION_THRESHOLD');
  }

  const evaluatedAt = options.now ?? new Date().toISOString();
  if (!validDateTime(evaluatedAt)) throw new TypeError('Classifier now must be an ISO date-time.');

  return {
    classifier_version: CLASSIFIER_VERSION,
    policy_version: POLICY_VERSION,
    mode: 'shadow',
    score,
    inclusion_tier: inclusionTier,
    inclusion_reasons: reasons,
    abstained,
    evaluated_at: new Date(evaluatedAt).toISOString(),
    thresholds,
    decision_trace: {
      evidence_complete: missingFeatures.length === 0,
      rights_cleared: input?.rights_decision === 'allow',
      output_effect: 'observe_only',
      calibration_status: 'not_evaluated',
    },
  };
}

export const CLASSIFIER_MODEL_CARD = Object.freeze({
  name: 'CiteWire deterministic inclusion classifier',
  version: CLASSIFIER_VERSION,
  policy_version: POLICY_VERSION,
  status: 'experimental',
  default_mode: 'shadow',
  purpose: 'Prioritize normalized, rights-cleared metadata for auditable evaluation.',
  non_goals: ['rights clearance', 'fact verification', 'paywall access', 'full-text analysis', 'autonomous publication'],
  features: FEATURES,
  default_thresholds: DEFAULT_THRESHOLDS,
  limitations: [
    'Weights are a transparent baseline and are not calibrated against a representative labeled corpus.',
    'Inputs must come from a separate, documented normalization process.',
    'Missing rights, attribution, publication time, canonical URL, or feature values causes abstention.',
  ],
  evaluation_requirement: 'Compare against a versioned, maintainer-approved corpus. Passing evidence never activates a workflow.',
});

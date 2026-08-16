import { sha256 } from '../editorial/idempotency.js';
import { CLASSIFIER_VERSION, classifyInclusion, validateThresholds } from './classifier.js';

export const DEFAULT_CALIBRATION_CRITERIA = Object.freeze({
  min_records: 50,
  min_agreement: 0.8,
  max_abstention_rate: 0.2,
});

function rate(value, total) {
  return total === 0 ? 0 : Math.round((value / total) * 10_000) / 10_000;
}

function result(status, details = {}) {
  return Object.freeze({ status, activation_effect: 'none', ...details });
}

function assertContentFree(value, path = 'input') {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertContentFree(entry, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (/password|token|secret|api[_-]?key|credential[_-]?ref|full[_-]?text|raw[_-]?text/i.test(key) || ['body', 'content'].includes(key.toLowerCase())) {
      throw new TypeError(`${path} contains a prohibited content or credential field.`);
    }
    assertContentFree(child, `${path}.${key}`);
  }
}

export function assertCalibrationCorpus(corpus) {
  if (!corpus || typeof corpus !== 'object' || Array.isArray(corpus)) throw new TypeError('Calibration corpus must be an object.');
  if (corpus.schema_version !== '1.0.0') throw new TypeError('Calibration corpus schema_version must be 1.0.0.');
  for (const key of ['corpus_id', 'revision', 'reviewed_at']) {
    if (typeof corpus[key] !== 'string' || !corpus[key]) throw new TypeError(`Calibration corpus ${key} is required.`);
  }
  if (Number.isNaN(Date.parse(corpus.reviewed_at))) throw new TypeError('Calibration corpus reviewed_at must be an ISO date-time.');
  if (!Array.isArray(corpus.records)) throw new TypeError('Calibration corpus records must be an array.');
  const ids = new Set();
  for (const record of corpus.records) {
    if (typeof record?.id !== 'string' || !record.id || ids.has(record.id)) throw new TypeError('Calibration record ids must be non-empty and unique.');
    ids.add(record.id);
    if (!['held', 'adjacent', 'standard'].includes(record.expected_tier)) throw new TypeError('Calibration expected_tier is invalid.');
    if (!record.input || typeof record.input !== 'object') throw new TypeError('Calibration record input is required.');
    assertContentFree(record.input);
  }
  return corpus;
}

export function evaluateCalibration({
  corpus,
  classifier = classifyInclusion,
  thresholds,
  modelVersion = CLASSIFIER_VERSION,
  criteria = DEFAULT_CALIBRATION_CRITERIA,
  evaluatedAt = '2000-01-01T00:00:00.000Z',
} = {}) {
  if (!corpus) return result('missing', { reason_codes: ['CORPUS_MISSING'] });
  assertCalibrationCorpus(corpus);
  const normalizedThresholds = validateThresholds(thresholds);
  if (corpus.model_version !== modelVersion) {
    return result('stale', { reason_codes: ['MODEL_VERSION_MISMATCH'], corpus_hash: sha256(corpus) });
  }
  if (sha256(corpus.thresholds) !== sha256(normalizedThresholds)) {
    return result('stale', { reason_codes: ['THRESHOLD_VERSION_MISMATCH'], corpus_hash: sha256(corpus) });
  }

  let agreed = 0;
  let abstained = 0;
  const confusion = { held: { held: 0, adjacent: 0, standard: 0 }, adjacent: { held: 0, adjacent: 0, standard: 0 }, standard: { held: 0, adjacent: 0, standard: 0 } };
  for (const record of corpus.records) {
    const decision = classifier(record.input, { thresholds: normalizedThresholds, now: evaluatedAt });
    confusion[record.expected_tier][decision.inclusion_tier] += 1;
    if (decision.inclusion_tier === record.expected_tier) agreed += 1;
    if (decision.abstained) abstained += 1;
  }
  const size = corpus.records.length;
  const metrics = Object.freeze({
    size,
    agreement: rate(agreed, size),
    abstention_rate: rate(abstained, size),
    confusion,
  });
  const passed = size >= criteria.min_records
    && metrics.agreement >= criteria.min_agreement
    && metrics.abstention_rate <= criteria.max_abstention_rate;
  return result(passed ? 'passed' : 'failed', {
    reason_codes: passed ? [] : ['CALIBRATION_CRITERIA_NOT_MET'],
    corpus_id: corpus.corpus_id,
    corpus_revision: corpus.revision,
    corpus_hash: sha256(corpus),
    model_version: modelVersion,
    thresholds: normalizedThresholds,
    criteria: structuredClone(criteria),
    metrics,
    evaluated_at: evaluatedAt,
  });
}

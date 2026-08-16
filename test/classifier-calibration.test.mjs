import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { CLASSIFIER_VERSION, DEFAULT_THRESHOLDS } from '../src/community/classifier.js';
import { evaluateCalibration } from '../src/community/calibration.js';

function input(value) {
  return {
    title: 'Calibrated record',
    publisher: 'Example',
    published_at: '2026-08-16T10:00:00.000Z',
    canonical_url: 'https://example.test/item',
    rights_decision: 'allow',
    source_quality: value,
    topical_relevance: value,
    freshness: value,
    rights_confidence: value,
    evidence_density: value,
  };
}

function corpus() {
  return {
    schema_version: '1.0.0',
    corpus_id: 'fixture-corpus',
    revision: 'rev-1',
    reviewed_at: '2026-08-16T11:00:00.000Z',
    model_version: CLASSIFIER_VERSION,
    thresholds: { ...DEFAULT_THRESHOLDS },
    records: [
      { id: 'held', expected_tier: 'held', review_basis: 'regression_fixture', input: input(0.4) },
      { id: 'adjacent', expected_tier: 'adjacent', review_basis: 'regression_fixture', input: input(0.55) },
      { id: 'standard', expected_tier: 'standard', review_basis: 'regression_fixture', input: input(0.9) },
    ],
  };
}

test('calibration is evidence only across missing, stale, failed, and passed states', () => {
  assert.equal(evaluateCalibration().status, 'missing');
  const staleCorpus = corpus();
  staleCorpus.model_version = 'old-model';
  assert.equal(evaluateCalibration({ corpus: staleCorpus }).status, 'stale');

  const failed = evaluateCalibration({
    corpus: corpus(),
    criteria: { min_records: 10, min_agreement: 1, max_abstention_rate: 0 },
    evaluatedAt: '2026-08-16T12:00:00.000Z',
  });
  assert.equal(failed.status, 'failed');
  assert.equal(failed.activation_effect, 'none');

  const passed = evaluateCalibration({
    corpus: corpus(),
    criteria: { min_records: 3, min_agreement: 1, max_abstention_rate: 0 },
    evaluatedAt: '2026-08-16T12:00:00.000Z',
  });
  assert.equal(passed.status, 'passed');
  assert.equal(passed.metrics.agreement, 1);
  assert.equal(passed.activation_effect, 'none');
});

test('calibration corpus schema is committed and content-free by contract', () => {
  const schema = JSON.parse(readFileSync(new URL('../src/community/calibration-corpus.schema.json', import.meta.url), 'utf8'));
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.deepEqual(schema.properties.records.items.required, ['id', 'expected_tier', 'review_basis', 'input']);
  assert.equal('body' in schema.properties.records.items.properties, false);
});

import { redactCredentialRef } from './credential-references.js';

const SENSITIVE_KEY = /(?:password|passphrase|secret|token|api[_-]?key|authorization|cookie|private[_-]?key|client[_-]?secret)/i;

export function redactForOutput(value, seen = new Map()) {
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return '[circular]';
  const output = Array.isArray(value) ? [] : {};
  seen.set(value, output);

  for (const [key, nested] of Object.entries(value)) {
    if (key === 'credential_ref') {
      output[key] = typeof nested === 'string' && nested.endsWith('://[redacted]')
        ? nested
        : redactCredentialRef(nested);
    } else if (SENSITIVE_KEY.test(key)) {
      output[key] = '[redacted]';
    } else {
      output[key] = redactForOutput(nested, seen);
    }
  }
  return output;
}

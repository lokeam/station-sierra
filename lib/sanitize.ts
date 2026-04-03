/**
 * Brief field sanitization for prompt injection defense.
 *
 * Applied once on attempt 1 of the concept generation route before the brief
 * is interpolated into the LLM prompt. Results are logged to Phoenix spans
 * via `security.brief_sanitized` and `security.patterns_matched` attributes.
 */

const INJECTION_PATTERNS = [
  /ignore (all |previous |above )?instructions?/gi,
  /forget (everything|all|previous)/gi,
  /you are now/gi,
  /new (role|persona|identity|instructions?)/gi,
  /system prompt/gi,
  /\[INST\]/gi,
];

/** Truncates to 500 chars, replaces known injection patterns with `[removed]`. */
export function sanitizeBrief(brief: string): {
  sanitized: string;
  wasSanitized: boolean;
  matched: number;
} {
  const trimmed = brief.trim().slice(0, 500);

  let sanitized = trimmed;
  let matched = 0;

  for (const pattern of INJECTION_PATTERNS) {
    // Reset lastIndex since patterns use /g flag
    pattern.lastIndex = 0;
    if (pattern.test(sanitized)) matched++;
    pattern.lastIndex = 0;
    sanitized = sanitized.replace(pattern, '[removed]');
  }

  return { sanitized, wasSanitized: matched > 0, matched };
}

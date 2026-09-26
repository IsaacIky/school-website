/**
 * Validate a `?redirect=` value before navigating to it after login.
 * Only same-origin absolute paths are allowed; anything else (full URLs,
 * protocol-relative `//host`, backslash tricks, `javascript:`) returns null.
 */
export function safeRedirectPath(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return null;
  return raw;
}

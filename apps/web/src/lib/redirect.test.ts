import { describe, expect, it } from 'vitest';
import { safeRedirectPath } from './redirect';

describe('safeRedirectPath', () => {
  it('allows same-site paths', () => {
    expect(safeRedirectPath('/bursar/cash-office')).toBe('/bursar/cash-office');
    expect(safeRedirectPath('/student?tab=results')).toBe('/student?tab=results');
  });

  it.each([
    ['missing', null],
    ['empty', ''],
    ['absolute URL', 'https://evil.example/phish'],
    ['protocol-relative URL', '//evil.example'],
    ['backslash trick', '/\\evil.example'],
    ['javascript URL', 'javascript:alert(1)'],
    ['relative path', 'admin'],
  ])('rejects %s', (_label, value) => {
    expect(safeRedirectPath(value)).toBeNull();
  });
});

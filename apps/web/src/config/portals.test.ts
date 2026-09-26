import { describe, expect, it } from 'vitest';
import { getAccessiblePortalKeys, getLandingPathForRole, resolveLandingPath } from './portals';

describe('getLandingPathForRole', () => {
  it('maps a known role to its landing path', () => {
    expect(getLandingPathForRole('BURSAR_CASH_OFFICE')).toBe('/bursar/cash-office');
  });

  it('returns null for an unmapped role instead of a fallback page', () => {
    expect(getLandingPathForRole('Lecturer')).toBeNull();
  });
});

describe('resolveLandingPath', () => {
  it('prefers the landing path returned by the API', () => {
    expect(resolveLandingPath('/vc/icts', ['BURSAR_ADMIN'])).toBe('/vc/icts');
  });

  it('falls back to the first role that maps to a portal', () => {
    expect(resolveLandingPath(null, ['Lecturer', 'REGISTRY_HR', 'BURSAR_ADMIN'])).toBe(
      '/registry/human-resources',
    );
  });

  it('returns null when no role maps to a portal', () => {
    expect(resolveLandingPath(undefined, ['Lecturer', 'Applicant'])).toBeNull();
    expect(resolveLandingPath(null, [])).toBeNull();
  });
});

describe('getAccessiblePortalKeys', () => {
  it('returns each portal once across multiple roles', () => {
    expect(getAccessiblePortalKeys(['VC_ICTS', 'VC_QAU', 'BURSAR_ADMIN']).sort()).toEqual([
      'bursar',
      'vc',
    ]);
  });
});

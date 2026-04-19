/**
 * Role → Portal mapping configuration.
 * This is the single source of truth for which role lands on which portal.
 * Can be extended to be DB-driven in future.
 */

export interface PortalDefinition {
  /** Portal key / route segment */
  key: string;
  /** Base path for this portal */
  basePath: string;
  /** Display name shown in portal switcher */
  displayName: string;
  /** Short label for nav items */
  shortLabel: string;
  /** Emoji/icon for the portal */
  icon: string;
  /** Sub-pages within this portal */
  subPages?: { path: string; label: string }[];
}

export interface RolePortalMapping {
  /** Role name as stored in the DB */
  roleName: string;
  /** Portal key this role maps to */
  portalKey: string;
  /** Computed landing path (could be portal root or a specific sub-page) */
  landingPath: string;
}

export const portals: PortalDefinition[] = [
  {
    key: 'admin',
    basePath: '/admin',
    displayName: 'Super Admin',
    shortLabel: 'Admin',
    icon: '🛡️',
  },
  {
    key: 'vc',
    basePath: '/vc',
    displayName: "Vice-Chancellor's Office",
    shortLabel: 'VC Office',
    icon: '🏛️',
    subPages: [
      { path: '/vc/impr', label: 'Information, Marketing & PR' },
      { path: '/vc/procurement', label: 'Procurement Management' },
      { path: '/vc/icts', label: 'ICT Services' },
      { path: '/vc/qau', label: 'Quality Assurance Unit' },
      { path: '/vc/internal-audit', label: 'Internal Audit' },
      { path: '/vc/agro-innovation-hub', label: 'Agro Innovation Hub' },
      { path: '/vc/research-innovation', label: 'Research & Innovation' },
      { path: '/vc/monitoring-evaluation', label: 'Monitoring & Evaluation' },
      { path: '/vc/clothing', label: 'Clothing Division' },
      { path: '/vc/security', label: 'Security' },
      { path: '/vc/wildlife-centre', label: 'Wildlife Centre' },
      { path: '/vc/business-development', label: 'Business Development' },
      { path: '/vc/works-estates', label: 'Works & Estates' },
      { path: '/vc/furniture', label: 'Furniture Division' },
    ],
  },
  {
    key: 'bursar',
    basePath: '/bursar',
    displayName: 'Bursar Department',
    shortLabel: 'Bursar',
    icon: '💰',
    subPages: [
      { path: '/bursar/finance-investments', label: 'Finance & Investments' },
      { path: '/bursar/creditors-control', label: 'Creditors Control' },
      { path: '/bursar/student-accounts', label: 'Student Accounts' },
      { path: '/bursar/cash-office', label: 'Cash Office' },
      { path: '/bursar/planning-projects', label: 'Planning & Projects' },
    ],
  },
  {
    key: 'registry',
    basePath: '/registry',
    displayName: 'Registry Department',
    shortLabel: 'Registry',
    icon: '📋',
    subPages: [
      { path: '/registry/admissions-records', label: 'Admissions & Records' },
      { path: '/registry/human-resources', label: 'Human Resources' },
      { path: '/registry/central-services', label: 'Central Services' },
      { path: '/registry/student-affairs', label: 'Student Affairs' },
      { path: '/registry/examinations', label: 'Examinations' },
    ],
  },
  {
    key: 'student',
    basePath: '/student',
    displayName: 'Student Portal',
    shortLabel: 'Student',
    icon: '🎓',
  },
];

/**
 * Default role → portal mapping.
 * API /auth/me should return landingPath; this is a client-side fallback.
 */
export const rolePortalMap: RolePortalMapping[] = [
  { roleName: 'SUPER_ADMIN', portalKey: 'admin', landingPath: '/admin' },
  { roleName: 'VICE_CHANCELLOR', portalKey: 'vc', landingPath: '/vc' },
  // VC unit roles
  { roleName: 'VC_IMPR', portalKey: 'vc', landingPath: '/vc/impr' },
  { roleName: 'VC_PROCUREMENT', portalKey: 'vc', landingPath: '/vc/procurement' },
  { roleName: 'VC_ICTS', portalKey: 'vc', landingPath: '/vc/icts' },
  { roleName: 'VC_QAU', portalKey: 'vc', landingPath: '/vc/qau' },
  { roleName: 'VC_INTERNAL_AUDIT', portalKey: 'vc', landingPath: '/vc/internal-audit' },
  { roleName: 'VC_AGRO_HUB', portalKey: 'vc', landingPath: '/vc/agro-innovation-hub' },
  {
    roleName: 'VC_RESEARCH_INNOVATION',
    portalKey: 'vc',
    landingPath: '/vc/research-innovation',
  },
  {
    roleName: 'VC_M_E_PERFORMANCE',
    portalKey: 'vc',
    landingPath: '/vc/monitoring-evaluation',
  },
  { roleName: 'VC_CLOTHING_DIVISION', portalKey: 'vc', landingPath: '/vc/clothing' },
  { roleName: 'VC_SECURITY', portalKey: 'vc', landingPath: '/vc/security' },
  { roleName: 'VC_WILDLIFE_CENTRE', portalKey: 'vc', landingPath: '/vc/wildlife-centre' },
  { roleName: 'VC_BUSINESS_DEV', portalKey: 'vc', landingPath: '/vc/business-development' },
  { roleName: 'VC_WORKS_ESTATE', portalKey: 'vc', landingPath: '/vc/works-estates' },
  { roleName: 'VC_FURNITURE_DIVISION', portalKey: 'vc', landingPath: '/vc/furniture' },
  // Bursar roles
  { roleName: 'BURSAR_ADMIN', portalKey: 'bursar', landingPath: '/bursar' },
  {
    roleName: 'BURSAR_FINANCE',
    portalKey: 'bursar',
    landingPath: '/bursar/finance-investments',
  },
  {
    roleName: 'BURSAR_CREDITORS',
    portalKey: 'bursar',
    landingPath: '/bursar/creditors-control',
  },
  {
    roleName: 'BURSAR_STUDENT_ACCOUNTS',
    portalKey: 'bursar',
    landingPath: '/bursar/student-accounts',
  },
  { roleName: 'BURSAR_CASH_OFFICE', portalKey: 'bursar', landingPath: '/bursar/cash-office' },
  {
    roleName: 'BURSAR_PLANNING_PROJECTS',
    portalKey: 'bursar',
    landingPath: '/bursar/planning-projects',
  },
  // Registry roles
  { roleName: 'REGISTRY_ADMIN', portalKey: 'registry', landingPath: '/registry' },
  {
    roleName: 'REGISTRY_ADMISSIONS',
    portalKey: 'registry',
    landingPath: '/registry/admissions-records',
  },
  { roleName: 'REGISTRY_HR', portalKey: 'registry', landingPath: '/registry/human-resources' },
  {
    roleName: 'REGISTRY_CENTRAL_SERVICES',
    portalKey: 'registry',
    landingPath: '/registry/central-services',
  },
  {
    roleName: 'REGISTRY_STUDENT_AFFAIRS',
    portalKey: 'registry',
    landingPath: '/registry/student-affairs',
  },
  {
    roleName: 'REGISTRY_EXAMINATIONS',
    portalKey: 'registry',
    landingPath: '/registry/examinations',
  },
  // Student
  { roleName: 'STUDENT', portalKey: 'student', landingPath: '/student' },
];

/**
 * Get portal definition by key.
 */
export function getPortalByKey(key: string): PortalDefinition | undefined {
  return portals.find((p) => p.key === key);
}

/**
 * Get landing path for a given role name (client-side fallback).
 * The API /auth/me should be the primary source.
 */
export function getLandingPathForRole(roleName: string): string {
  return rolePortalMap.find((r) => r.roleName === roleName)?.landingPath ?? '/login';
}

/**
 * Get all portal keys a user has access to based on their roles.
 */
export function getAccessiblePortalKeys(roleNames: string[]): string[] {
  const keys = new Set<string>();
  for (const role of roleNames) {
    const mapping = rolePortalMap.find((r) => r.roleName === role);
    if (mapping) keys.add(mapping.portalKey);
  }
  return Array.from(keys);
}

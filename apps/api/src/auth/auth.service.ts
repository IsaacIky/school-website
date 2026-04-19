import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
}

/** Role → portal key mapping (mirrors apps/web/src/config/portals.ts) */
const ROLE_PORTAL_MAP: Record<string, { portalKey: string; landingPath: string }> = {
  SUPER_ADMIN: { portalKey: 'admin', landingPath: '/admin' },
  VICE_CHANCELLOR: { portalKey: 'vc', landingPath: '/vc' },
  VC_IMPR: { portalKey: 'vc', landingPath: '/vc/impr' },
  VC_PROCUREMENT: { portalKey: 'vc', landingPath: '/vc/procurement' },
  VC_ICTS: { portalKey: 'vc', landingPath: '/vc/icts' },
  VC_QAU: { portalKey: 'vc', landingPath: '/vc/qau' },
  VC_INTERNAL_AUDIT: { portalKey: 'vc', landingPath: '/vc/internal-audit' },
  VC_AGRO_HUB: { portalKey: 'vc', landingPath: '/vc/agro-innovation-hub' },
  VC_RESEARCH_INNOVATION: { portalKey: 'vc', landingPath: '/vc/research-innovation' },
  VC_M_E_PERFORMANCE: { portalKey: 'vc', landingPath: '/vc/monitoring-evaluation' },
  VC_CLOTHING_DIVISION: { portalKey: 'vc', landingPath: '/vc/clothing' },
  VC_SECURITY: { portalKey: 'vc', landingPath: '/vc/security' },
  VC_WILDLIFE_CENTRE: { portalKey: 'vc', landingPath: '/vc/wildlife-centre' },
  VC_BUSINESS_DEV: { portalKey: 'vc', landingPath: '/vc/business-development' },
  VC_WORKS_ESTATE: { portalKey: 'vc', landingPath: '/vc/works-estates' },
  VC_FURNITURE_DIVISION: { portalKey: 'vc', landingPath: '/vc/furniture' },
  BURSAR_ADMIN: { portalKey: 'bursar', landingPath: '/bursar' },
  BURSAR_FINANCE: { portalKey: 'bursar', landingPath: '/bursar/finance-investments' },
  BURSAR_CREDITORS: { portalKey: 'bursar', landingPath: '/bursar/creditors-control' },
  BURSAR_STUDENT_ACCOUNTS: { portalKey: 'bursar', landingPath: '/bursar/student-accounts' },
  BURSAR_CASH_OFFICE: { portalKey: 'bursar', landingPath: '/bursar/cash-office' },
  BURSAR_PLANNING_PROJECTS: { portalKey: 'bursar', landingPath: '/bursar/planning-projects' },
  REGISTRY_ADMIN: { portalKey: 'registry', landingPath: '/registry' },
  REGISTRY_ADMISSIONS: { portalKey: 'registry', landingPath: '/registry/admissions-records' },
  REGISTRY_HR: { portalKey: 'registry', landingPath: '/registry/human-resources' },
  REGISTRY_CENTRAL_SERVICES: { portalKey: 'registry', landingPath: '/registry/central-services' },
  REGISTRY_STUDENT_AFFAIRS: { portalKey: 'registry', landingPath: '/registry/student-affairs' },
  REGISTRY_EXAMINATIONS: { portalKey: 'registry', landingPath: '/registry/examinations' },
  STUDENT: { portalKey: 'student', landingPath: '/student' },
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        roleAssignments: {
          include: {
            role: {
              include: { rolePermissions: { include: { permission: true } } },
            },
          },
        },
      },
    });

    const { passwordHash: _pw, ...profile } = user;

    // Compute portal routing fields from the user's assigned roles
    const roleNames = profile.roleAssignments.map((ra) => ra.role.name);

    // Primary landing path: use the first matched role
    let landingPath: string | undefined;
    const portalKeys = new Set<string>();
    for (const roleName of roleNames) {
      const mapping = ROLE_PORTAL_MAP[roleName];
      if (mapping) {
        if (!landingPath) landingPath = mapping.landingPath;
        portalKeys.add(mapping.portalKey);
      }
    }

    return {
      ...profile,
      landingPath: landingPath ?? '/login',
      portalOptions: Array.from(portalKeys),
    };
  }
}

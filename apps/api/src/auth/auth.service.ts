import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';

const OTP_TTL_MS = 5 * 60 * 1000;
/** How long after verifying a code the student has to set their password */
const SET_PASSWORD_WINDOW_MS = 15 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_PER_HOUR = 5;
const INVALID_OTP_MESSAGE = 'Invalid or expired code. Please request a new one.';

/** Student numbers are matched case-insensitively and ignoring surrounding spaces. */
export function normalizeStudentNumber(studentId: string): string {
  return studentId.trim().toUpperCase();
}

export interface JwtPayload {
  sub: string;
  email: string;
}

/** Role → portal key mapping (mirrors apps/web/src/config/portals.ts) */
const ROLE_PORTAL_MAP: Record<string, { portalKey: string; landingPath: string }> = {
  'Super Admin': { portalKey: 'admin', landingPath: '/admin' },
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
  Student: { portalKey: 'student', landingPath: '/student' },
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

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

  // ── Student Auth ───────────────────────────────────────────────────────────
  // Students sign in with their student number. Their User row starts with no
  // password; they set one via an emailed OTP (first-time setup or reset).
  // Responses never reveal whether a student number exists.

  async studentRequestOtp(studentId: string): Promise<{ message: string }> {
    const generic = {
      message:
        'If this student ID is registered, a verification code has been sent to the email address on file.',
    };

    const student = await this.findStudent(studentId);
    if (!student || !student.user.isActive) return generic;

    // Rate limit silently so the response looks the same as for unknown IDs.
    const now = Date.now();
    const recent = await this.prisma.studentOtp.findMany({
      where: { studentId: student.id, createdAt: { gte: new Date(now - 60 * 60 * 1000) } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    if (
      recent.length >= OTP_MAX_PER_HOUR ||
      (recent[0] && now - recent[0].createdAt.getTime() < OTP_RESEND_COOLDOWN_MS)
    ) {
      return generic;
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.prisma.$transaction([
      // Only the newest code is ever valid.
      this.prisma.studentOtp.updateMany({
        where: { studentId: student.id, consumedAt: null },
        data: { consumedAt: new Date(now) },
      }),
      this.prisma.studentOtp.create({
        data: {
          studentId: student.id,
          codeHash: await bcrypt.hash(code, 10),
          expiresAt: new Date(now + OTP_TTL_MS),
        },
      }),
    ]);

    await this.mail.send(
      student.user.email,
      'Your student portal verification code',
      `Hello ${student.user.firstName},\n\n` +
        `Your verification code is ${code}. It expires in ${OTP_TTL_MS / 60_000} minutes.\n\n` +
        `If you did not request this, you can ignore this email.`,
    );
    return generic;
  }

  async studentVerifyOtp(studentId: string, code: string): Promise<{ message: string }> {
    const otp = await this.checkOtp(studentId, code);
    if (otp.expiresAt.getTime() < Date.now()) throw new BadRequestException(INVALID_OTP_MESSAGE);
    if (!otp.verifiedAt) {
      await this.prisma.studentOtp.update({
        where: { id: otp.id },
        data: { verifiedAt: new Date() },
      });
    }
    return { message: 'Code verified. You can now set your password.' };
  }

  async studentSetPassword(studentId: string, code: string, newPassword: string) {
    const otp = await this.checkOtp(studentId, code);
    if (!otp.verifiedAt || otp.verifiedAt.getTime() + SET_PASSWORD_WINDOW_MS < Date.now()) {
      throw new BadRequestException(INVALID_OTP_MESSAGE);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const student = otp.student;
    await this.prisma.$transaction(async (tx) => {
      // Conditional update guards against the same code being used twice.
      const consumed = await tx.studentOtp.updateMany({
        where: { id: otp.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      if (consumed.count !== 1) throw new BadRequestException(INVALID_OTP_MESSAGE);
      await tx.user.update({
        where: { id: student.userId },
        data: { passwordHash, emailVerified: true },
      });
    });

    return this.issueStudentToken(student);
  }

  async studentLogin(studentId: string, password: string) {
    const student = await this.findStudent(studentId);
    const hash = student?.user.isActive ? student.user.passwordHash : null;
    if (!student || !hash || !(await bcrypt.compare(password, hash))) {
      throw new UnauthorizedException(
        'Invalid student ID or password. First time signing in? Use "First time / Forgot password".',
      );
    }
    return this.issueStudentToken(student);
  }

  private findStudent(studentId: string) {
    return this.prisma.student.findUnique({
      where: { studentNumber: normalizeStudentNumber(studentId) },
      include: { user: true },
    });
  }

  /**
   * Load the student's current OTP and check the submitted code against it.
   * Every check counts as an attempt; the attempt is claimed before comparing
   * so concurrent guesses cannot exceed the limit.
   */
  private async checkOtp(studentId: string, code: string) {
    const student = await this.findStudent(studentId);
    const otp = student
      ? await this.prisma.studentOtp.findFirst({
          where: { studentId: student.id, consumedAt: null },
          orderBy: { createdAt: 'desc' },
        })
      : null;
    if (!student || !otp) throw new BadRequestException(INVALID_OTP_MESSAGE);

    const claimed = await this.prisma.studentOtp.updateMany({
      where: { id: otp.id, attempts: { lt: OTP_MAX_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
    });
    if (claimed.count !== 1 || !(await bcrypt.compare(code, otp.codeHash))) {
      throw new BadRequestException(INVALID_OTP_MESSAGE);
    }
    return { ...otp, student };
  }

  private issueStudentToken(student: {
    studentNumber: string;
    user: { id: string; email: string; firstName: string; lastName: string };
  }) {
    const payload: JwtPayload = { sub: student.user.id, email: student.user.email };
    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: student.user.id,
        studentId: student.studentNumber,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
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

    // null means none of the user's roles map to a portal; the client must
    // treat that as "no portal assigned" rather than redirecting anywhere.
    return {
      ...profile,
      landingPath: landingPath ?? null,
      portalOptions: Array.from(portalKeys),
    };
  }
}

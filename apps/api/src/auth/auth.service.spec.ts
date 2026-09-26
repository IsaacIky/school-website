import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';

// ── In-memory stand-in for the Prisma calls AuthService makes ────────────────

interface FakeUser {
  id: string;
  email: string;
  passwordHash: string | null;
  firstName: string;
  lastName: string;
  isActive: boolean;
  emailVerified: boolean;
  roleAssignments: { role: { name: string } }[];
}

interface FakeOtp {
  id: string;
  studentId: string;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  verifiedAt: Date | null;
  consumedAt: Date | null;
  createdAt: Date;
}

function createFakePrisma() {
  const users: FakeUser[] = [];
  const students: { id: string; studentNumber: string; userId: string }[] = [];
  const otps: FakeOtp[] = [];
  let seq = 0;

  const matchesOtp = (o: FakeOtp, where: Record<string, any>) =>
    (where.id === undefined || o.id === where.id) &&
    (where.studentId === undefined || o.studentId === where.studentId) &&
    (where.consumedAt !== null || o.consumedAt === null) &&
    (where.attempts?.lt === undefined || o.attempts < where.attempts.lt);

  const prisma = {
    user: {
      findUnique: async ({ where }) => users.find((u) => u.email === where.email) ?? null,
      findUniqueOrThrow: async ({ where }) => {
        const user = users.find((u) => u.id === where.id);
        if (!user) throw new Error('not found');
        return { ...user };
      },
      update: async ({ where, data }) => Object.assign(users.find((u) => u.id === where.id)!, data),
    },
    student: {
      findUnique: async ({ where }) => {
        const s = students.find((st) => st.studentNumber === where.studentNumber);
        return s ? { ...s, user: users.find((u) => u.id === s.userId)! } : null;
      },
    },
    studentOtp: {
      findMany: async ({ where }) =>
        otps
          .filter((o) => o.studentId === where.studentId && o.createdAt >= where.createdAt.gte)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      findFirst: async ({ where }) =>
        otps
          .filter((o) => matchesOtp(o, where))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null,
      create: async ({ data }) => {
        const otp: FakeOtp = {
          id: `otp-${++seq}`,
          attempts: 0,
          verifiedAt: null,
          consumedAt: null,
          createdAt: new Date(Date.now() + seq), // keep creation order stable
          ...data,
        };
        otps.push(otp);
        return otp;
      },
      update: async ({ where, data }) => Object.assign(otps.find((o) => o.id === where.id)!, data),
      updateMany: async ({ where, data }) => {
        const hits = otps.filter((o) => matchesOtp(o, where));
        for (const o of hits) {
          if (data.attempts?.increment) o.attempts += data.attempts.increment;
          if (data.consumedAt) o.consumedAt = data.consumedAt;
        }
        return { count: hits.length };
      },
    },
    $transaction: async (arg: any) => (Array.isArray(arg) ? Promise.all(arg) : arg(prisma)),
  };

  function addUser(user: Partial<FakeUser> & { email: string }) {
    const full: FakeUser = {
      id: `user-${++seq}`,
      passwordHash: null,
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      emailVerified: false,
      roleAssignments: [],
      ...user,
    };
    users.push(full);
    return full;
  }

  function addStudent(studentNumber: string, user: Partial<FakeUser> = {}) {
    const u = addUser({ email: `${studentNumber.toLowerCase()}@test.ac.zw`, ...user });
    students.push({ id: `student-${++seq}`, studentNumber, userId: u.id });
    return u;
  }

  return { prisma, otps, addUser, addStudent };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let db: ReturnType<typeof createFakePrisma>;
  let mail: { send: jest.Mock };
  let service: AuthService;

  const GENERIC_OTP_MESSAGE =
    'If this student ID is registered, a verification code has been sent to the email address on file.';

  /** Pull the 6-digit code out of the most recent email sent. */
  const lastCode = () => {
    const text: string = mail.send.mock.calls.at(-1)[2];
    return text.match(/code is (\d{6})/)![1];
  };

  beforeEach(() => {
    db = createFakePrisma();
    mail = { send: jest.fn().mockResolvedValue(undefined) };
    service = new AuthService(
      db.prisma as unknown as PrismaService,
      new JwtService({ secret: 'test-secret' }),
      mail as unknown as MailService,
    );
  });

  describe('getProfile', () => {
    const profileFor = async (roles: string[]) => {
      const user = db.addUser({
        email: 'staff@test.ac.zw',
        passwordHash: 'hash',
        roleAssignments: roles.map((name) => ({ role: { name } })),
      });
      return service.getProfile(user.id);
    };

    it('returns the landing path of the first role that maps to a portal', async () => {
      const profile = await profileFor(['Lecturer', 'BURSAR_CASH_OFFICE', 'VC_ICTS']);
      expect(profile.landingPath).toBe('/bursar/cash-office');
      expect(profile.portalOptions.sort()).toEqual(['bursar', 'vc']);
    });

    it('returns a null landing path when no role maps to a portal', async () => {
      const profile = await profileFor(['Lecturer']);
      expect(profile.landingPath).toBeNull();
      expect(profile.portalOptions).toEqual([]);
    });

    it('never exposes the password hash', async () => {
      const profile = await profileFor(['Super Admin']);
      expect(profile).not.toHaveProperty('passwordHash');
    });
  });

  describe('staff login', () => {
    it('rejects accounts that have no password set yet', async () => {
      db.addUser({ email: 'new@test.ac.zw', passwordHash: null });
      await expect(service.login('new@test.ac.zw', 'anything')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('studentRequestOtp', () => {
    it('gives the same response for unknown student IDs and sends nothing', async () => {
      await expect(service.studentRequestOtp('UNKNOWN1')).resolves.toEqual({
        message: GENERIC_OTP_MESSAGE,
      });
      expect(mail.send).not.toHaveBeenCalled();
    });

    it('emails a 6-digit code, matching the student ID case-insensitively', async () => {
      const user = db.addStudent('S2024001');
      await expect(service.studentRequestOtp('  s2024001 ')).resolves.toEqual({
        message: GENERIC_OTP_MESSAGE,
      });
      expect(mail.send).toHaveBeenCalledTimes(1);
      expect(mail.send.mock.calls[0][0]).toBe(user.email);
      expect(lastCode()).toMatch(/^\d{6}$/);
      expect(db.otps[0].codeHash).not.toBe(lastCode());
    });

    it('does not send to inactive students', async () => {
      db.addStudent('S2024001', { isActive: false });
      await service.studentRequestOtp('S2024001');
      expect(mail.send).not.toHaveBeenCalled();
    });

    it('does not resend within the cooldown period', async () => {
      db.addStudent('S2024001');
      await service.studentRequestOtp('S2024001');
      await service.studentRequestOtp('S2024001');
      expect(mail.send).toHaveBeenCalledTimes(1);
    });

    it('invalidates the previous code when a new one is issued', async () => {
      db.addStudent('S2024001');
      await service.studentRequestOtp('S2024001');
      const firstCode = lastCode();
      db.otps[0].createdAt = new Date(Date.now() - 2 * 60 * 1000); // past the cooldown
      await service.studentRequestOtp('S2024001');

      await expect(service.studentVerifyOtp('S2024001', firstCode)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.studentVerifyOtp('S2024001', lastCode())).resolves.toBeDefined();
    });
  });

  describe('studentVerifyOtp', () => {
    beforeEach(async () => {
      db.addStudent('S2024001');
      await service.studentRequestOtp('S2024001');
    });

    it('accepts the correct code', async () => {
      await expect(service.studentVerifyOtp('S2024001', lastCode())).resolves.toEqual({
        message: expect.any(String),
      });
      expect(db.otps[0].verifiedAt).toBeInstanceOf(Date);
    });

    it('rejects a wrong code', async () => {
      const wrong = lastCode() === '000000' ? '111111' : '000000';
      await expect(service.studentVerifyOtp('S2024001', wrong)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects an expired code', async () => {
      db.otps[0].expiresAt = new Date(Date.now() - 1000);
      await expect(service.studentVerifyOtp('S2024001', lastCode())).rejects.toThrow(
        BadRequestException,
      );
    });

    it('locks the code after 5 failed attempts', async () => {
      const code = lastCode();
      const wrong = code === '000000' ? '111111' : '000000';
      for (let i = 0; i < 5; i++) {
        await expect(service.studentVerifyOtp('S2024001', wrong)).rejects.toThrow();
      }
      await expect(service.studentVerifyOtp('S2024001', code)).rejects.toThrow(BadRequestException);
    });
  });

  describe('studentSetPassword', () => {
    let user: FakeUser;
    let code: string;

    beforeEach(async () => {
      user = db.addStudent('S2024001');
      await service.studentRequestOtp('S2024001');
      code = lastCode();
    });

    it('requires the code to be verified first', async () => {
      await expect(service.studentSetPassword('S2024001', code, 'Student@123')).rejects.toThrow(
        BadRequestException,
      );
      expect(user.passwordHash).toBeNull();
    });

    it('sets the password, marks the email verified, and returns a token', async () => {
      await service.studentVerifyOtp('S2024001', code);
      const result = await service.studentSetPassword('S2024001', code, 'Student@123');

      expect(result.accessToken).toEqual(expect.any(String));
      expect(result.user).toMatchObject({ id: user.id, studentId: 'S2024001' });
      expect(await bcrypt.compare('Student@123', user.passwordHash!)).toBe(true);
      expect(user.emailVerified).toBe(true);
    });

    it('cannot be used twice with the same code', async () => {
      await service.studentVerifyOtp('S2024001', code);
      await service.studentSetPassword('S2024001', code, 'Student@123');
      await expect(service.studentSetPassword('S2024001', code, 'Hijack@123')).rejects.toThrow(
        BadRequestException,
      );
      expect(await bcrypt.compare('Student@123', user.passwordHash!)).toBe(true);
    });

    it('rejects when the set-password window after verification has passed', async () => {
      await service.studentVerifyOtp('S2024001', code);
      db.otps[0].verifiedAt = new Date(Date.now() - 16 * 60 * 1000);
      await expect(service.studentSetPassword('S2024001', code, 'Student@123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('studentLogin', () => {
    it('rejects a student who has not set a password yet', async () => {
      db.addStudent('S2024001');
      await expect(service.studentLogin('S2024001', 'Student@123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects a wrong password and unknown IDs with the same error', async () => {
      db.addStudent('S2024001', { passwordHash: await bcrypt.hash('Student@123', 4) });
      const wrongPassword = service.studentLogin('S2024001', 'Wrong@1234').catch((e) => e);
      const unknownId = service.studentLogin('NOPE', 'Student@123').catch((e) => e);
      const [a, b] = await Promise.all([wrongPassword, unknownId]);
      expect(a).toBeInstanceOf(UnauthorizedException);
      expect(a.message).toBe(b.message);
    });

    it('rejects inactive students even with the right password', async () => {
      db.addStudent('S2024001', {
        passwordHash: await bcrypt.hash('Student@123', 4),
        isActive: false,
      });
      await expect(service.studentLogin('S2024001', 'Student@123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns a token for the right password', async () => {
      db.addStudent('S2024001', { passwordHash: await bcrypt.hash('Student@123', 4) });
      const result = await service.studentLogin('s2024001', 'Student@123');
      expect(result.accessToken).toEqual(expect.any(String));
      expect(result.user.studentId).toBe('S2024001');
    });
  });
});

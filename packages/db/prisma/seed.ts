/**
 * Seed script: creates initial campus, permissions, roles, and admin user.
 *
 * Run with:
 *   pnpm db:seed          (from repo root)
 *   pnpm --filter @school/db db:seed
 */

import { PrismaClient, RoleScopeType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱  Starting seed...');

  // ── Campus ──────────────────────────────────────────────────────────────────
  const campus = await prisma.campus.upsert({
    where: { code: 'MAIN' },
    update: {},
    create: {
      name: 'Main Campus',
      code: 'MAIN',
      address: '1 University Drive',
      email: 'main@university.ac.zw',
      phone: '+263 242 000 000',
    },
  });
  console.log(`✅  Campus: ${campus.name} (${campus.id})`);

  // ── Faculty ──────────────────────────────────────────────────────────────────
  const faculty = await prisma.faculty.upsert({
    where: { code: 'FCA' },
    update: {},
    create: {
      name: 'Faculty of Computing & Artificial Intelligence',
      code: 'FCA',
      campusId: campus.id,
    },
  });
  console.log(`✅  Faculty: ${faculty.name}`);

  // ── Department ───────────────────────────────────────────────────────────────
  const department = await prisma.department.upsert({
    where: { code: 'CS' },
    update: {},
    create: {
      name: 'Department of Computer Science',
      code: 'CS',
      facultyId: faculty.id,
    },
  });
  console.log(`✅  Department: ${department.name}`);

  // ── Program ───────────────────────────────────────────────────────────────────
  const program = await prisma.program.upsert({
    where: { code: 'BSC-CS' },
    update: {},
    create: {
      name: 'BSc Computer Science',
      code: 'BSC-CS',
      durationYears: 4,
      level: 'UNDERGRADUATE',
      departmentId: department.id,
    },
  });
  console.log(`✅  Program: ${program.name}`);

  // ── Permissions ──────────────────────────────────────────────────────────────
  const resources = ['campus', 'faculty', 'department', 'program', 'user', 'role', 'permission', 'audit_log'];
  const actions = ['create', 'read', 'update', 'delete'];

  const permissionData = resources.flatMap((resource) =>
    actions.map((action) => ({
      name: `${resource}:${action}`,
      resource,
      action,
      description: `Can ${action} ${resource}`,
    })),
  );

  for (const perm of permissionData) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }
  console.log(`✅  ${permissionData.length} permissions seeded`);

  // ── Admin Role ───────────────────────────────────────────────────────────────
  const adminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: {
      name: 'Super Admin',
      description: 'Full access to all resources',
      isSystem: true,
    },
  });

  // Assign all permissions to admin role
  const allPerms = await prisma.permission.findMany();
  for (const perm of allPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }
  console.log(`✅  Role: ${adminRole.name} with ${allPerms.length} permissions`);

  // Additional roles
  const rolesToCreate = [
    { name: 'Faculty Admin', description: 'Manages faculty resources', isSystem: true },
    { name: 'Department Admin', description: 'Manages department resources', isSystem: true },
    { name: 'Lecturer', description: 'Academic staff - teaching', isSystem: true },
    { name: 'Student', description: 'Enrolled student', isSystem: true },
    { name: 'Applicant', description: 'Prospective student in admissions', isSystem: true },
    { name: 'Admissions Officer', description: 'Processes applications', isSystem: true },
  ];
  for (const r of rolesToCreate) {
    await prisma.role.upsert({ where: { name: r.name }, update: {}, create: r });
  }
  console.log(`✅  ${rolesToCreate.length} additional roles seeded`);

  // ── Admin User ───────────────────────────────────────────────────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@university.ac.zw';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123!';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      firstName: 'System',
      lastName: 'Admin',
      emailVerified: true,
    },
  });
  console.log(`✅  Admin user: ${adminUser.email}`);
// Assign Super Admin role (GLOBAL within the seeded campus)
await prisma.userRoleAssignment.createMany({
  data: [
    {
      userId: adminUser.id,
      roleId: adminRole.id,
      scopeType: RoleScopeType.GLOBAL,
      campusId: campus.id,
    },
  ],
  skipDuplicates: true,
});
console.log(`✅  Admin user assigned Super Admin role (global)`);

  console.log('\n🎉  Seed complete!');
  if (adminPassword === 'Admin@123!') {
    console.log(`\n⚠️   Default admin credentials: ${adminEmail} / ${adminPassword}`);
    console.log('    Change this in production via SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD env vars.\n');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

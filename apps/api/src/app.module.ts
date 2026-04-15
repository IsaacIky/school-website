import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CampusModule } from './campus/campus.module';
import { FacultyModule } from './faculty/faculty.module';
import { DepartmentModule } from './department/department.module';
import { ProgramModule } from './program/program.module';
import { RbacModule } from './rbac/rbac.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    CampusModule,
    FacultyModule,
    DepartmentModule,
    ProgramModule,
    RbacModule,
    AuditModule,
  ],
})
export class AppModule {}

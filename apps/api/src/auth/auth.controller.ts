import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

// ── Student auth DTOs ────────────────────────────────────────────────────────
// TODO: These endpoints require a Student model in the Prisma schema.
// Once the Student entity is added to packages/db/prisma/schema.prisma,
// implement the corresponding service methods in auth.service.ts.

class StudentRequestOtpDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;
}

class StudentVerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}

class StudentSetPasswordDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}

class StudentLoginDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @MinLength(8)
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Staff / admin login: email + password → JWT */
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  /** Get current authenticated user profile (includes roles + landingPath) */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    return this.auth.getProfile(req.user.sub);
  }

  // ── Student Auth ────────────────────────────────────────────────────────
  // These endpoints implement the student OTP flow:
  //   1. request-otp  → look up student email from DB, generate + email OTP (TTL 5 min)
  //   2. verify-otp   → validate OTP
  //   3. set-password → set password after OTP verification (first-time / reset)
  //   4. login        → regular login with studentId + password

  /** Step 1: Request OTP — used for first-time login and forgot/reset password */
  @Post('student/request-otp')
  studentRequestOtp(@Body() dto: StudentRequestOtpDto) {
    return this.auth.studentRequestOtp(dto.studentId);
  }

  /** Step 2: Verify OTP (5-minute TTL) */
  @Post('student/verify-otp')
  studentVerifyOtp(@Body() dto: StudentVerifyOtpDto) {
    return this.auth.studentVerifyOtp(dto.studentId, dto.otp);
  }

  /** Step 3: Set/reset password after OTP verification */
  @Post('student/set-password')
  studentSetPassword(@Body() dto: StudentSetPasswordDto) {
    return this.auth.studentSetPassword(dto.studentId, dto.otp, dto.newPassword);
  }

  /** Regular student login with studentId + password */
  @Post('student/login')
  studentLogin(@Body() dto: StudentLoginDto) {
    return this.auth.studentLogin(dto.studentId, dto.password);
  }
}

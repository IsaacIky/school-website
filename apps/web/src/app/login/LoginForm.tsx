'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getLandingPathForRole } from '@/config/portals';
import { siteConfig } from '@/config/site';

type Tab = 'staff' | 'student';

/**
 * studentMode controls which student sub-flow is active:
 *  'login'     – Default: Student ID + password sign-in (no OTP involvement).
 *  'otp-reset' – Explicitly chosen by the user via "First time / Forgot password?".
 *                Shows a 3-step OTP flow: request → verify → set-password.
 */
type StudentMode = 'login' | 'otp-reset';
type OtpStep = 'request' | 'verify' | 'set-password';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [tab, setTab] = useState<Tab>('staff');

  // Staff form
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffError, setStaffError] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);

  // Student form
  const [studentMode, setStudentMode] = useState<StudentMode>('login');
  const [otpStep, setOtpStep] = useState<OtpStep>('request');
  const [studentId, setStudentId] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentError, setStudentError] = useState('');
  const [studentLoading, setStudentLoading] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');

  /** Switch to the OTP reset/first-time flow (only on explicit user action). */
  function enterOtpFlow() {
    setStudentMode('otp-reset');
    setOtpStep('request');
    setStudentError('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
  }

  /** Return to normal Student ID + password sign-in. */
  function exitOtpFlow() {
    setStudentMode('login');
    setStudentError('');
  }

  async function handleStaffLogin(e: React.FormEvent) {
    e.preventDefault();
    setStaffError('');
    setStaffLoading(true);
    try {
      await api.staffLogin(staffEmail, staffPassword);
      // Use landingPath from /auth/me as the primary source; fall back to local mapping.
      const profile = await api.getMe();
      const roles = profile.roleAssignments.map((ra) => ra.role.name);
      const landing =
        profile.landingPath ??
        (roles.length > 0 ? getLandingPathForRole(roles[0]) : '/admin');
      router.push(redirect ?? landing);
    } catch (err: unknown) {
      setStaffError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setStaffLoading(false);
    }
  }

  /**
   * Regular student sign-in: Student ID + password.
   * On failure the error from the API is shown directly — we do NOT auto-trigger
   * the OTP flow. The user must explicitly choose "First time / Forgot password?".
   */
  async function handleStudentLogin(e: React.FormEvent) {
    e.preventDefault();
    setStudentError('');
    setStudentLoading(true);
    try {
      await api.studentLogin(studentId, studentPassword);
      // Use landingPath from /auth/me as the primary source; fall back to '/student'.
      const profile = await api.getMe();
      router.push(redirect ?? profile.landingPath ?? '/student');
    } catch (err: unknown) {
      // Show the actual API error — wrong password stays "wrong password".
      setStudentError(err instanceof Error ? err.message : 'Invalid student ID or password');
    } finally {
      setStudentLoading(false);
    }
  }

  /** OTP flow – Step 1: send OTP to the student's registered email address. */
  async function handleOtpRequest(e: React.FormEvent) {
    e.preventDefault();
    setStudentError('');
    setStudentLoading(true);
    try {
      const res = await api.studentRequestOtp(studentId);
      if (res.maskedEmail) setMaskedEmail(res.maskedEmail);
      setOtpStep('verify');
    } catch (err: unknown) {
      setStudentError(
        err instanceof Error ? err.message : 'Could not send OTP. Please check your student ID.',
      );
    } finally {
      setStudentLoading(false);
    }
  }

  /** OTP flow – Step 2: verify the code entered by the student. */
  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault();
    setStudentError('');
    setStudentLoading(true);
    try {
      await api.studentVerifyOtp(studentId, otp);
      setOtpStep('set-password');
    } catch (err: unknown) {
      setStudentError(err instanceof Error ? err.message : 'Invalid or expired OTP');
    } finally {
      setStudentLoading(false);
    }
  }

  /** OTP flow – Step 3: set a new password, then auto-login and redirect. */
  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setStudentError('');
    if (newPassword !== confirmPassword) {
      setStudentError('Passwords do not match');
      return;
    }
    setStudentLoading(true);
    try {
      // studentSetPassword stores the returned JWT via setToken internally.
      await api.studentSetPassword(studentId, otp, newPassword);
      // Use landingPath from /auth/me as the primary source; fall back to '/student'.
      const profile = await api.getMe();
      router.push(redirect ?? profile.landingPath ?? '/student');
    } catch (err: unknown) {
      setStudentError(err instanceof Error ? err.message : 'Failed to set password');
    } finally {
      setStudentLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4B2E83] via-[#3a2268] to-[#0B1020] flex flex-col items-center justify-center p-4">
      {/* Back to home */}
      <Link
        href="/"
        className="text-purple-300 hover:text-white text-sm mb-8 flex items-center gap-2 transition-colors"
      >
        ← Back to {siteConfig.shortName}
      </Link>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎓</div>
          <h1 className="text-2xl font-bold text-white">{siteConfig.name}</h1>
          <p className="text-purple-300 text-sm mt-1">Sign in to access your portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setTab('staff')}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                tab === 'staff'
                  ? 'text-[#4B2E83] border-b-2 border-[#4B2E83] bg-purple-50/50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              👤 Staff / Admin
            </button>
            <button
              onClick={() => {
                setTab('student');
                setStudentMode('login');
                setStudentError('');
              }}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                tab === 'student'
                  ? 'text-[#4B2E83] border-b-2 border-[#4B2E83] bg-purple-50/50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🎓 Student
            </button>
          </div>

          <div className="p-8">
            {/* ── Staff Login ── */}
            {tab === 'staff' && (
              <form onSubmit={handleStaffLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    required
                    placeholder="you@university.ac.zw"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2E83]/30 focus:border-[#4B2E83] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2E83]/30 focus:border-[#4B2E83] transition-colors"
                  />
                </div>
                {staffError && (
                  <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
                    {staffError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={staffLoading}
                  className="w-full bg-[#4B2E83] hover:bg-[#3a2268] text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {staffLoading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>
            )}

            {/* ── Student Login ── */}
            {tab === 'student' && (
              <div>
                {/* ── Default: Student ID + Password sign-in ── */}
                {studentMode === 'login' && (
                  <form onSubmit={handleStudentLogin} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Student ID
                      </label>
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        required
                        placeholder="e.g. R123456Y"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2E83]/30 focus:border-[#4B2E83] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Password
                      </label>
                      <input
                        type="password"
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2E83]/30 focus:border-[#4B2E83] transition-colors"
                      />
                    </div>
                    {studentError && (
                      <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
                        {studentError}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={studentLoading}
                      className="w-full bg-[#4B2E83] hover:bg-[#3a2268] text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60"
                    >
                      {studentLoading ? 'Signing in…' : 'Sign In'}
                    </button>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={enterOtpFlow}
                        className="text-[#4B2E83] hover:text-[#3a2268] text-sm underline transition-colors"
                      >
                        First time or forgot password?
                      </button>
                    </div>
                  </form>
                )}

                {/* ── OTP Reset Flow (only when explicitly chosen by user) ── */}
                {studentMode === 'otp-reset' && (
                  <div>
                    {/* Step 1: Enter Student ID and request OTP */}
                    {otpStep === 'request' && (
                      <form onSubmit={handleOtpRequest} className="space-y-5">
                        <div className="text-center">
                          <div className="text-3xl mb-2">🔑</div>
                          <p className="text-sm text-gray-600">
                            Enter your Student ID and we&apos;ll send a one-time PIN to your
                            registered email address.
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Student ID
                          </label>
                          <input
                            type="text"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            required
                            placeholder="e.g. R123456Y"
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2E83]/30 focus:border-[#4B2E83] transition-colors"
                          />
                        </div>
                        {studentError && (
                          <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
                            {studentError}
                          </p>
                        )}
                        <button
                          type="submit"
                          disabled={studentLoading}
                          className="w-full bg-[#4B2E83] hover:bg-[#3a2268] text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60"
                        >
                          {studentLoading ? 'Sending…' : 'Send One-Time PIN'}
                        </button>
                        <button
                          type="button"
                          onClick={exitOtpFlow}
                          className="w-full text-gray-500 text-sm hover:text-gray-700 transition-colors"
                        >
                          ← Back to sign in
                        </button>
                      </form>
                    )}

                    {/* Step 2: Verify OTP */}
                    {otpStep === 'verify' && (
                      <form onSubmit={handleOtpVerify} className="space-y-5">
                        <div className="text-center">
                          <div className="text-3xl mb-2">📧</div>
                          <p className="text-sm text-gray-600">
                            We sent a one-time PIN to{' '}
                            <strong>{maskedEmail || 'your registered email'}</strong>. It expires
                            in 5 minutes.
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            One-Time PIN
                          </label>
                          <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                            placeholder="6-digit code"
                            maxLength={6}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-[#4B2E83]/30 focus:border-[#4B2E83] transition-colors"
                          />
                        </div>
                        {studentError && (
                          <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
                            {studentError}
                          </p>
                        )}
                        <button
                          type="submit"
                          disabled={studentLoading}
                          className="w-full bg-[#4B2E83] hover:bg-[#3a2268] text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60"
                        >
                          {studentLoading ? 'Verifying…' : 'Verify PIN'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOtpStep('request');
                            setStudentError('');
                          }}
                          className="w-full text-gray-500 text-sm hover:text-gray-700 transition-colors"
                        >
                          ← Back
                        </button>
                      </form>
                    )}

                    {/* Step 3: Set new password */}
                    {otpStep === 'set-password' && (
                      <form onSubmit={handleSetPassword} className="space-y-5">
                        <div className="text-center">
                          <div className="text-3xl mb-2">🔒</div>
                          <p className="text-sm text-gray-600">Set or reset your password.</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            New Password
                          </label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={8}
                            placeholder="Min. 8 characters"
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2E83]/30 focus:border-[#4B2E83] transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Confirm Password
                          </label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Repeat password"
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B2E83]/30 focus:border-[#4B2E83] transition-colors"
                          />
                        </div>
                        {studentError && (
                          <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
                            {studentError}
                          </p>
                        )}
                        <button
                          type="submit"
                          disabled={studentLoading}
                          className="w-full bg-[#4B2E83] hover:bg-[#3a2268] text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60"
                        >
                          {studentLoading ? 'Setting password…' : 'Set Password & Sign In'}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-purple-300 text-xs mt-6">
          Having trouble? Contact{' '}
          <a href={`mailto:${siteConfig.contact.email}`} className="underline hover:text-white">
            {siteConfig.contact.email}
          </a>
        </p>
      </div>
    </div>
  );
}

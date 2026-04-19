/**
 * Lightweight API client for the school platform.
 * All requests automatically include the JWT stored in localStorage.
 * NOTE: Storing tokens in localStorage is convenient for a scaffold but
 * is vulnerable to XSS. In production, prefer httpOnly cookies.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', token);
    // Set a lightweight cookie so middleware can detect auth state server-side.
    // This is NOT the JWT itself — just a hint flag.
    document.cookie = 'auth_hint=1; path=/; SameSite=Lax';
  }
}

export function clearToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    document.cookie = 'auth_hint=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? 'Request failed');
  }

  return res.json();
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  /** Roles assigned to this user */
  roleAssignments: { role: { name: string; description?: string } }[];
  /** Computed primary landing path (returned by API) */
  landingPath?: string;
  /** All portal keys this user can access */
  portalOptions?: string[];
}

export interface StaffLoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface StudentOtpRequestResponse {
  message: string;
  /** Masked email address for display */
  maskedEmail?: string;
}

export interface StudentOtpVerifyResponse {
  message: string;
  /** Temporary token to use for set-password */
  tempToken?: string;
}

export interface StudentLoginResponse {
  accessToken: string;
  user: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
  };
}

// ─── API Client ──────────────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

  // ── Staff/Admin Auth ────────────────────────────────────────────────────

  /** Login with email + password (staff/lecturers/admin) */
  staffLogin: async (email: string, password: string): Promise<StaffLoginResponse> => {
    const data = await request<StaffLoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.accessToken);
    return data;
  },

  /** Get current authenticated user profile (includes roles + landingPath) */
  getMe: (): Promise<UserProfile> => request<UserProfile>('/auth/me'),

  /** Logout - clears local token */
  logout: () => {
    clearToken();
  },

  // ── Student Auth ────────────────────────────────────────────────────────
  // TODO: These endpoints need to be implemented in apps/api when student
  // OTP flow is built. The API should:
  //   POST /auth/student/request-otp  { studentId } → looks up email in DB, sends OTP
  //   POST /auth/student/verify-otp   { studentId, otp } → validates OTP (TTL 5 min)
  //   POST /auth/student/set-password { studentId, otp, newPassword } → sets password after OTP
  //   POST /auth/student/login        { studentId, password } → regular login after first-time setup

  /** Step 1: Student requests OTP (first-time login or forgot/reset password) */
  studentRequestOtp: (studentId: string): Promise<StudentOtpRequestResponse> =>
    request<StudentOtpRequestResponse>('/auth/student/request-otp', {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    }),

  /** Step 2: Student verifies OTP (5-minute TTL) */
  studentVerifyOtp: (
    studentId: string,
    otp: string,
  ): Promise<StudentOtpVerifyResponse> =>
    request<StudentOtpVerifyResponse>('/auth/student/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ studentId, otp }),
    }),

  /** Step 3: Student sets password after OTP verification */
  studentSetPassword: (
    studentId: string,
    otp: string,
    newPassword: string,
  ): Promise<StudentLoginResponse> =>
    request<StudentLoginResponse>('/auth/student/set-password', {
      method: 'POST',
      body: JSON.stringify({ studentId, otp, newPassword }),
    }),

  /** Regular student login (after first-time setup) */
  studentLogin: async (studentId: string, password: string): Promise<StudentLoginResponse> => {
    const data = await request<StudentLoginResponse>('/auth/student/login', {
      method: 'POST',
      body: JSON.stringify({ studentId, password }),
    });
    setToken(data.accessToken);
    return data;
  },

  // ── Legacy alias (backwards compat) ────────────────────────────────────
  login: async (email: string, password: string) => {
    return api.staffLogin(email, password);
  },
};

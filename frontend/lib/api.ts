export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  is_active: boolean;
};

export type Worker = {
  id: string;
  full_name: string;
  bio?: string;
  city: string;
  state: string;
  hourly_rate: number;
  rating_avg: number;
  rating_count: number;
  is_available: boolean;
  is_approved: boolean;
  categories?: any[];
  avatar_url?: string;
};

export type Booking = {
  id: string;
  customer: string;
  worker: string;
  status: string;
  payment_status: string;
  job_description: string;
  address: string;
  scheduled_for: string;
  quoted_amount: number;
  worker_name: string;
  customer_name: string;
  created_at?: string | null;
  updated_at?: string | null;
  // Payment ledger (populated once payment is processed)
  paystack_reference?: string | null;
  payment_amount?: number | null;
  worker_amount?: number | null;
  platform_commission?: number | null;
  escrow_released?: boolean;
};

export type User = {
  id: string;
  phone: string;
  full_name: string;
  role: string;
  is_onboarded: boolean;
};

type ApiList<T> = {
  results: T[];
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    next: init?.method ? undefined : { revalidate: 30 },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getCategories() {
  return apiFetch<ApiList<Category>>("/api/v1/categories/");
}

export async function getWorkers() {
  return apiFetch<ApiList<Worker>>("/api/v1/workers/");
}

export async function requestOtp(phone: string) {
  return apiFetch<{ detail: string; dev_otp?: string }>("/api/v1/auth/request-otp/", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

export async function verifyOtp(phone: string, code: string, fullName?: string, role?: string) {
  return apiFetch<{ user: User }>("/api/v1/auth/verify-otp/", {
    method: "POST",
    body: JSON.stringify({ phone, code, full_name: fullName, role }),
  });
}

export async function createBooking(input: {
  workerId: string;
  scheduledFor: string;
  quotedAmount: string;
  jobDescription: string;
  address: string;
}) {
  return apiFetch<{ booking: Booking }>("/api/v1/bookings/", {
    method: "POST",
    body: JSON.stringify({
      worker_id: input.workerId,
      scheduled_for: input.scheduledFor,
      quoted_amount: input.quotedAmount,
      job_description: input.jobDescription,
      address: input.address,
    }),
  });
}

export async function getMe() {
  return apiFetch<{ user: User }>("/api/v1/auth/me/");
}

export async function updateMyProfile(data: { full_name?: string; email?: string; is_onboarded?: boolean }) {
  return apiFetch<{ user: User }>("/api/v1/auth/me/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function createWorkerProfile(data: {
  bio: string;
  city: string;
  state: string;
  hourly_rate: number;
  category_slugs: string[];
  portfolio_urls?: string[];
}) {
  return apiFetch<{ detail: string; profile_id: string; is_approved: boolean }>("/api/v1/workers/profile/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMyWorkerProfile() {
  return apiFetch<{ profile: Worker }>("/api/v1/workers/my-profile/");
}

export async function updateMyWorkerProfile(data: {
  bio?: string;
  city?: string;
  state?: string;
  hourly_rate?: number;
  is_available?: boolean;
  categories?: string[];
}) {
  return apiFetch<{ detail: string }>("/api/v1/workers/my-profile/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function toggleWorkerAvailability(isAvailable: boolean) {
  return apiFetch<{ is_available: boolean }>("/api/v1/workers/availability/", {
    method: "PATCH",
    body: JSON.stringify({ is_available: isAvailable }),
  });
}

export async function logoutUser() {
  return apiFetch<{ detail: string }>("/api/v1/auth/logout/", {
    method: "POST",
  });
}

export async function adminLogin(phone: string, password: string) {
  return apiFetch<{ user: User }>("/api/v1/auth/admin-login/", {
    method: "POST",
    body: JSON.stringify({ phone, password }),
  });
}

export async function initiatePayment(bookingId: string, callbackUrl?: string) {
  return apiFetch<{ authorization_url: string; paystack_reference: string; is_mock: boolean }>("/api/v1/payments/initiate/", {
    method: "POST",
    body: JSON.stringify({ booking_id: bookingId, callback_url: callbackUrl }),
  });
}

export async function simulatePaymentSuccess(bookingId: string, paystackReference?: string) {
  return apiFetch<{ status: string; booking_status: string; payment_status: string }>("/api/v1/payments/simulate-success/", {
    method: "POST",
    body: JSON.stringify({ booking_id: bookingId, paystack_reference: paystackReference }),
  });
}

export async function uploadWorkerAvatar(file: File) {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await fetch(`${API_BASE_URL}/api/v1/workers/my-profile/avatar/`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Avatar upload failed: ${response.status}`);
  }

  return response.json() as Promise<{ detail: string; avatar_url: string }>;
}

export async function requestAdminPasswordReset(phone: string) {
  return apiFetch<{ detail: string; dev_otp?: string }>("/api/v1/auth/admin-reset-password/request/", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

export async function confirmAdminPasswordReset(phone: string, code: string, newPassword: string) {
  return apiFetch<{ detail: string }>("/api/v1/auth/admin-reset-password/confirm/", {
    method: "POST",
    body: JSON.stringify({ phone, code, new_password: newPassword }),
  });
}






import { supabase } from "./supabase";
import { isAdminEmail } from "./admin";

// Supabase's error shape isn't always what supabase-js expects (e.g. a
// backend/SMTP failure can come back with a body it doesn't parse into a
// proper .message), which can otherwise surface as a blank or "{}" error to
// the customer. Fall back to a readable message whenever that happens.
export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const message = error.message?.trim();

    if (message && message !== "{}" && message !== "[object Object]") {
      return message;
    }
  }

  return fallback;
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function ensureUserProfile(metadata?: { full_name?: string; phone?: string }) {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw userError ?? new Error("No logged-in user found.");
  }

  const user = userData.user;
  const fullName =
    metadata?.full_name ?? String(user.user_metadata.full_name ?? user.email ?? "User");
  const phone = metadata?.phone ?? String(user.user_metadata.phone ?? "");

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      full_name: fullName,
      phone,
      role: isAdminEmail(user.email) ? "admin" : "user",
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    throw error;
  }
}

export async function signUp(
  email: string,
  password: string,
  metadata: { full_name: string; phone: string },
) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
}

export async function verifySignupOtp(email: string, token: string) {
  return supabase.auth.verifyOtp({ email, token, type: "signup" });
}

export async function resendSignupOtp(email: string) {
  return supabase.auth.resend({ type: "signup", email });
}

export async function signInWithProvider(provider: "google" | "facebook", nextPath: string) {
  const callbackUrl = new URL("/auth/callback", window.location.origin);
  callbackUrl.searchParams.set("next", nextPath);

  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl.toString(),
      skipBrowserRedirect: true,
    },
  });
}

export async function sendPasswordReset(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
}

export async function updatePassword(password: string) {
  return supabase.auth.updateUser({ password });
}

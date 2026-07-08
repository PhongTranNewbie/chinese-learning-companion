"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { isGoogleAuthConfigured, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import {
  hashPassword,
  isValidEmail,
  normalizeEmail,
  validatePassword,
} from "@/lib/passwords";

export type EmailAuthState = {
  error?: string;
  fields?: {
    email?: string;
    name?: string;
  };
};

function readString(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function readPassword(formData: FormData) {
  const value = formData.get("password");
  return typeof value === "string" ? value : "";
}

function getAuthFields(formData: FormData) {
  const email = normalizeEmail(readString(formData, "email"));
  const password = readPassword(formData);
  const name = readString(formData, "name");

  return { email, password, name };
}

export async function signInWithGoogle() {
  if (!isGoogleAuthConfigured) {
    redirect("/login?error=missing-google-config");
  }

  await signIn("google", {
    redirectTo: "/",
  });
}

export async function signInWithEmailPassword(
  _previousState: EmailAuthState,
  formData: FormData,
): Promise<EmailAuthState> {
  const { email, password } = getAuthFields(formData);

  if (!isValidEmail(email) || !password) {
    return {
      error: "Enter a valid email and password.",
      fields: { email },
    };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: "Email or password is incorrect.",
        fields: { email },
      };
    }

    throw error;
  }

  return {};
}

export async function createEmailPasswordAccount(
  _previousState: EmailAuthState,
  formData: FormData,
): Promise<EmailAuthState> {
  const { email, password, name } = getAuthFields(formData);
  const passwordError = validatePassword(password);

  if (!isValidEmail(email)) {
    return {
      error: "Enter a valid email address.",
      fields: { email, name },
    };
  }

  if (passwordError) {
    return {
      error: passwordError,
      fields: { email, name },
    };
  }

  try {
    await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash: await hashPassword(password),
      },
      select: {
        id: true,
      },
    });
  } catch {
    return {
      error:
        "We could not create that account. Try signing in, or use another email.",
      fields: { email, name },
    };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error:
          "Your account was created. Please sign in with your email and password.",
        fields: { email, name },
      };
    }

    throw error;
  }

  return {};
}

export async function signOutCurrentUser() {
  await signOut({
    redirectTo: "/",
  });
}

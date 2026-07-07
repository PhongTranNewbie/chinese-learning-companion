"use server";

import { redirect } from "next/navigation";
import { isGoogleAuthConfigured, signIn, signOut } from "@/auth";

export async function signInWithGoogle() {
  if (!isGoogleAuthConfigured) {
    redirect("/login?error=missing-google-config");
  }

  await signIn("google", {
    redirectTo: "/",
  });
}

export async function signOutCurrentUser() {
  await signOut({
    redirectTo: "/",
  });
}

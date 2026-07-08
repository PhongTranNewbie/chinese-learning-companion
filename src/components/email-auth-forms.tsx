"use client";

import { useActionState } from "react";
import {
  createEmailPasswordAccount,
  signInWithEmailPassword,
  type EmailAuthState,
} from "@/lib/auth-actions";

const initialState: EmailAuthState = {};
const fieldClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
const primaryButtonClass =
  "inline-flex min-h-11 w-full items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400";
const secondaryButtonClass =
  "inline-flex min-h-11 w-full items-center justify-center rounded-md border border-teal-200 bg-white px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60";

export function EmailAuthForms() {
  const [signInState, signInAction, isSignInPending] = useActionState(
    signInWithEmailPassword,
    initialState,
  );
  const [registerState, registerAction, isRegisterPending] = useActionState(
    createEmailPasswordAccount,
    initialState,
  );

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <form
        action={signInAction}
        className="rounded-md bg-slate-50 p-4 ring-1 ring-slate-100"
      >
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Sign in with email
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Continue with a password account and keep your private study data.
          </p>
        </div>

        {signInState.error ? (
          <p
            className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-100"
            role="alert"
          >
            {signInState.error}
          </p>
        ) : null}

        <div className="mt-4 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={signInState.fields?.email ?? ""}
              className={fieldClass}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={fieldClass}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={isSignInPending}
          className={`${primaryButtonClass} mt-5`}
        >
          {isSignInPending ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <form
        action={registerAction}
        className="rounded-md bg-white p-4 ring-1 ring-slate-200"
      >
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Create an account
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Start saving your own vocabulary, decks, and review history.
          </p>
        </div>

        {registerState.error ? (
          <p
            className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-100"
            role="alert"
          >
            {registerState.error}
          </p>
        ) : null}

        <div className="mt-4 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Name</span>
            <input
              name="name"
              type="text"
              autoComplete="name"
              defaultValue={registerState.fields?.name ?? ""}
              className={fieldClass}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={registerState.fields?.email ?? ""}
              className={fieldClass}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              className={fieldClass}
            />
            <span className="text-xs text-slate-500">
              Use at least 8 characters.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isRegisterPending}
          className={`${secondaryButtonClass} mt-5`}
        >
          {isRegisterPending ? "Creating account..." : "Create account"}
        </button>
      </form>
    </div>
  );
}

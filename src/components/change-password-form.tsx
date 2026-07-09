"use client";

import { useActionState } from "react";
import {
  changePassword,
  type ChangePasswordState,
} from "@/lib/settings";

const initialState: ChangePasswordState = {};

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changePassword,
    initialState,
  );

  return (
    <form action={formAction} className="mt-5 grid gap-4">
      {state.error ? (
        <div className="rounded-md bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950 ring-1 ring-amber-100">
          {state.error}
        </div>
      ) : null}
      {state.success ? (
        <div className="rounded-md bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-950 ring-1 ring-teal-100">
          {state.success}
        </div>
      ) : null}

      <PasswordField
        label="Current password"
        name="currentPassword"
        autoComplete="current-password"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <PasswordField
          label="New password"
          name="newPassword"
          autoComplete="new-password"
        />
        <PasswordField
          label="Confirm new password"
          name="confirmPassword"
          autoComplete="new-password"
        />
      </div>
      <p className="text-sm leading-6 text-slate-600">
        Use at least 8 characters. Your password is updated securely and is not
        shown again.
      </p>
      <div>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isPending ? "Updating..." : "Change password"}
        </button>
      </div>
    </form>
  );
}

function PasswordField({
  label,
  name,
  autoComplete,
}: {
  label: string;
  name: string;
  autoComplete: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        type="password"
        name={name}
        autoComplete={autoComplete}
        required
        className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
      />
    </label>
  );
}
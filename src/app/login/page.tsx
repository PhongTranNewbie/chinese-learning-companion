import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, isGoogleAuthConfigured } from "@/auth";
import { signInWithGoogle } from "@/lib/auth-actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [session, params] = await Promise.all([auth(), searchParams]);

  if (session?.user) {
    redirect("/");
  }

  const missingGoogleConfig =
    params.error === "missing-google-config" || !isGoogleAuthConfigured;

  return (
    <main className="bg-slate-50">
      <div className="mx-auto flex min-h-[calc(100vh-96px)] max-w-3xl items-center px-5 py-10 sm:px-6">
        <section className="w-full overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-100">
          <div className="bg-gradient-to-br from-teal-50 to-white px-6 py-8 sm:px-8">
            <p className="text-sm font-semibold text-teal-700">Member access</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
              Log in to save your study progress
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Guests can keep browsing the demo library. Logging in will support
              private vocabulary, saved review history, and owned study decks in
              the next auth phases.
            </p>
          </div>

          <div className="px-6 py-6 sm:px-8">
            {missingGoogleConfig ? (
              <div className="mb-5 rounded-md bg-amber-50 p-4 text-sm leading-6 text-amber-900 ring-1 ring-amber-100">
                Google login is wired but not configured in this environment.
                Add AUTH_SECRET, AUTH_GOOGLE_ID, and AUTH_GOOGLE_SECRET to enable
                the OAuth flow locally.
              </div>
            ) : null}

            <form action={signInWithGoogle}>
              <button
                type="submit"
                disabled={!isGoogleAuthConfigured}
                className="inline-flex w-full items-center justify-center rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 sm:w-auto"
              >
                Continue with Google
              </button>
            </form>

            <div className="mt-5 border-t border-slate-100 pt-5">
              <Link
                href="/"
                className="text-sm font-semibold text-teal-700 transition hover:text-teal-800"
              >
                Continue as guest
              </Link>
              <p className="mt-2 text-sm text-slate-500">
                Guest mode remains read-only for the public demo catalog.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

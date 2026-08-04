import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, isFacebookAuthConfigured, isGoogleAuthConfigured } from "@/auth";
import { EmailAuthForms } from "@/components/email-auth-forms";
import { signInWithFacebook, signInWithGoogle } from "@/lib/auth-actions";

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
  const missingFacebookConfig = params.error === "missing-facebook-config";

  return (
    <main className="bg-slate-100 dark:bg-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-96px)] max-w-5xl items-center px-5 py-10 sm:px-6">
        <section className="w-full overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <div className="bg-gradient-to-br from-teal-50 to-white px-6 py-8 sm:px-8 dark:from-teal-950 dark:to-slate-800">
            <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">Member access</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl dark:text-slate-50">
              Log in to save your study progress
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
              Guests can keep browsing the demo library. Logging in saves
              private vocabulary, review history, copied starter decks, and
              owned study decks.
            </p>
          </div>

          <div className="px-6 py-6 sm:px-8">
            {missingGoogleConfig ? (
              <div className="mb-5 rounded-md bg-amber-50 p-4 text-sm leading-6 text-amber-900 ring-1 ring-amber-100 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-900">
                Google login is wired but not configured in this environment.
                Add AUTH_SECRET, AUTH_GOOGLE_ID, and AUTH_GOOGLE_SECRET to enable
                the OAuth flow locally.
              </div>
            ) : null}

            {missingFacebookConfig ? (
              <div className="mb-5 rounded-md bg-amber-50 p-4 text-sm leading-6 text-amber-900 ring-1 ring-amber-100 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-900">
                Facebook login is wired but not configured in this environment.
                Add AUTH_FACEBOOK_ID and AUTH_FACEBOOK_SECRET to enable it
                locally.
              </div>
            ) : null}

            <div className="rounded-md bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-700 dark:ring-slate-600">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Quick sign in
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <form action={signInWithGoogle}>
                  <button
                    type="submit"
                    disabled={!isGoogleAuthConfigured}
                    className="inline-flex w-full items-center justify-center rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 sm:w-auto"
                  >
                    Continue with Google
                  </button>
                </form>
                {isFacebookAuthConfigured ? (
                  <form action={signInWithFacebook}>
                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center rounded-md border border-teal-200 bg-white px-4 py-3 text-sm font-semibold text-teal-700 shadow-sm transition hover:bg-teal-50 sm:w-auto"
                    >
                      Continue with Facebook
                    </button>
                  </form>
                ) : null}
              </div>
            </div>

            <div className="mt-5">
              <EmailAuthForms />
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5 dark:border-slate-700">
              <Link
                href="/"
                className="text-sm font-semibold text-teal-700 transition hover:text-teal-800 dark:text-teal-200 dark:hover:text-teal-100"
              >
                Continue as guest
              </Link>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Guest mode remains read-only for the public demo catalog.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

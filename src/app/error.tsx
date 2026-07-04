"use client";

import Link from "next/link";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-6">
        <section className="rounded-md bg-white px-6 py-12 text-center shadow-sm ring-1 ring-red-100">
          <p className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-2xl font-semibold text-red-700 ring-1 ring-red-100">
            !
          </p>
          <h1 className="mt-5 text-2xl font-semibold text-slate-950">
            Something interrupted this study page
          </h1>
          <p className="mx-auto mt-2 max-w-md text-slate-600">
            Try again, or return home and continue from a different place.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
            >
              Try again
            </button>
            <Link
              href="/"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Go home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

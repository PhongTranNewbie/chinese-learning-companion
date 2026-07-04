import Link from "next/link";

export default function NotFound() {
  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-6">
        <section className="rounded-md bg-white px-6 py-12 text-center shadow-sm ring-1 ring-slate-100">
          <p className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-2xl font-semibold text-teal-700 ring-1 ring-teal-100">
            学
          </p>
          <h1 className="mt-5 text-2xl font-semibold text-slate-950">
            We could not find that study page
          </h1>
          <p className="mx-auto mt-2 max-w-md text-slate-600">
            It may have been archived, moved, or opened from an old link.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
            >
              Go home
            </Link>
            <Link
              href="/vocabulary"
              className="inline-flex rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View vocabulary
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

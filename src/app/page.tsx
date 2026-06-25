import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-red-700">
        Chinese Learning Companion
      </p>
      <h1 className="mt-4 text-4xl font-semibold text-slate-950">
        Project foundation is ready.
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-700">
        Start building your personal Mandarin vocabulary bank. Each new word
        automatically receives an initial review card for later spaced
        repetition work.
      </p>
      <div className="mt-8">
        <Link
          href="/vocabulary"
          className="inline-flex items-center justify-center rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800"
        >
          Open vocabulary
        </Link>
      </div>
    </main>
  );
}

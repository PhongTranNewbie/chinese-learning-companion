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
        Phase 1 establishes the Next.js, TypeScript, Tailwind, Prisma, and
        PostgreSQL foundation for the learning app. Product features will be
        added in later phases.
      </p>
    </main>
  );
}

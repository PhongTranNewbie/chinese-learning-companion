export default function Loading() {
  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-5xl px-5 py-6 sm:px-6 sm:py-8">
        <section className="rounded-md bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <p className="text-sm font-semibold text-teal-700">Loading</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            Getting your study space ready
          </h1>
          <div className="mt-6 space-y-3">
            <div className="h-4 w-2/3 rounded-full bg-slate-100" />
            <div className="h-4 w-1/2 rounded-full bg-slate-100" />
            <div className="h-24 rounded-md bg-teal-50/60 ring-1 ring-teal-100" />
          </div>
        </section>
      </div>
    </main>
  );
}

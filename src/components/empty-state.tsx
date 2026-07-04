import Link from "next/link";

type EmptyStateProps = {
  icon: string;
  title: string;
  children: React.ReactNode;
  actionHref?: string;
  actionLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function EmptyState({
  icon,
  title,
  children,
  actionHref,
  actionLabel,
  secondaryHref,
  secondaryLabel,
}: EmptyStateProps) {
  return (
    <section className="rounded-md bg-white px-6 py-12 text-center shadow-sm ring-1 ring-slate-100">
      <p className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-2xl font-semibold text-teal-700 ring-1 ring-teal-100">
        {icon}
      </p>
      <h2 className="mt-5 text-xl font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-slate-600">{children}</p>
      {actionHref && actionLabel ? (
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link
            href={actionHref}
            className="inline-flex items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
          >
            {actionLabel}
          </Link>
          {secondaryHref && secondaryLabel ? (
            <Link
              href={secondaryHref}
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

type CharacterNoteDisplayItem = {
  id: string;
  character: string;
  components: string | null;
  componentMeanings: string | null;
  mnemonicStory: string | null;
};

export function CharacterNotesDisplay({
  notes,
  className = "",
}: {
  notes: CharacterNoteDisplayItem[];
  className?: string;
}) {
  if (notes.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid gap-3">
        {notes.map((note) => {
          const pictureText = note.mnemonicStory
            ? cleanMemoryText(note.mnemonicStory)
            : null;
          const rememberText = getRememberText(
            note.componentMeanings,
            pictureText,
          );

          return (
            <article
              key={note.id}
              className="rounded-md bg-white p-4 ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-sm sm:p-5"
            >
              <div className="grid gap-5 sm:grid-cols-[112px_1fr] sm:items-start">
                <div>
                  <div className="flex h-24 w-24 items-center justify-center rounded-md bg-teal-50 text-6xl font-semibold leading-none text-teal-700 ring-1 ring-teal-100">
                    {note.character}
                  </div>
                  <p className="mt-2 text-center text-xs font-medium text-slate-500">
                    Character
                  </p>
                </div>

                <div className="space-y-3">
                  {note.components ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Break it down
                      </p>
                      <p className="mt-1 text-base font-semibold text-slate-900">
                        <span className="text-teal-700">{note.character}</span>{" "}
                        = {note.components}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {splitComponents(note.components).map((component) => (
                          <span
                            key={component}
                            className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100"
                          >
                            {component}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {pictureText ? (
                    <div className="rounded-md bg-amber-50 px-4 py-3 ring-1 ring-amber-100">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                        Picture it
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-amber-950">
                        {pictureText}
                      </p>
                    </div>
                  ) : null}

                  {rememberText ? (
                    <div className="rounded-md bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Remember it
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {rememberText}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <p className="text-xs text-slate-500">
        Mnemonic aid, not guaranteed historical etymology.
      </p>
    </div>
  );
}

function splitComponents(value: string) {
  return value
    .split("+")
    .map((component) => component.trim())
    .filter(Boolean);
}

function cleanMemoryText(value: string) {
  return value
    .replace(/^(updated\s+)?memory (aid|story):\s*/i, "")
    .replace(/\s*[.;]\s*this is (a )?[^.]*mnemonic[^.]*\./gi, "")
    .replace(/\s*[.;]\s*this is (a )?[^.]*origin[^.]*\./gi, "")
    .replace(/\s*[.;,]\s*mnemonic only[^.]*\./gi, "")
    .replace(/\s*[.;,]\s*not (a )?(true )?origin[^.]*\./gi, "")
    .trim();
}

function getRememberText(
  componentMeanings: string | null,
  pictureText: string | null,
) {
  if (!componentMeanings?.trim()) {
    return null;
  }

  if (
    pictureText &&
    normalizeForComparison(componentMeanings) === normalizeForComparison(pictureText)
  ) {
    return null;
  }

  return componentMeanings;
}

function normalizeForComparison(value: string) {
  return value.toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

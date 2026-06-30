export type ArchiveState = {
  isArchived: boolean;
};

export function isActiveRecord(record: ArchiveState | null | undefined) {
  return Boolean(record && !record.isArchived);
}

export function shouldShowActiveLesson({
  course,
  lesson,
}: {
  course: ArchiveState | null | undefined;
  lesson: ArchiveState | null | undefined;
}) {
  return isActiveRecord(course) && isActiveRecord(lesson);
}

export function shouldShowDeckStudyActions(deck: ArchiveState | null | undefined) {
  return isActiveRecord(deck);
}

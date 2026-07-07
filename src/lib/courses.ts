"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export type CourseFormState = {
  errors?: Record<string, string>;
};

export type LessonFormState = {
  errors?: Record<string, string>;
};

function readString(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(formData: FormData, field: string) {
  const value = readString(formData, field);
  return value.length > 0 ? value : null;
}

function readSortOrder(formData: FormData) {
  const value = readString(formData, "sortOrder");
  if (!value) {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

async function getOwnedDeckId(deckId: string | null, userId: string) {
  if (!deckId) {
    return null;
  }

  const deck = await prisma.deck.findFirst({
    where: {
      id: deckId,
      userId,
      isArchived: false,
    },
    select: {
      id: true,
    },
  });

  return deck?.id ?? null;
}

export async function createCourse(
  _previousState: CourseFormState,
  formData: FormData,
): Promise<CourseFormState> {
  const user = await requireCurrentUser();
  const title = readString(formData, "title");
  const description = readOptionalString(formData, "description");

  if (!title) {
    return { errors: { title: "Course title is required." } };
  }

  const course = await prisma.course.create({
    data: {
      userId: user.id,
      title,
      description,
    },
  });

  revalidatePath("/courses");
  redirect(`/courses/${course.id}`);
}

export async function updateCourse(
  courseId: string,
  _previousState: CourseFormState,
  formData: FormData,
): Promise<CourseFormState> {
  const user = await requireCurrentUser();
  const title = readString(formData, "title");
  const description = readOptionalString(formData, "description");

  if (!title) {
    return { errors: { title: "Course title is required." } };
  }

  const result = await prisma.course.updateMany({
    where: {
      id: courseId,
      userId: user.id,
    },
    data: {
      title,
      description,
    },
  });

  if (result.count === 0) {
    redirect("/courses");
  }

  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
  redirect(`/courses/${courseId}`);
}

export async function archiveCourse(courseId: string) {
  const user = await requireCurrentUser();

  await prisma.course.updateMany({
    where: {
      id: courseId,
      userId: user.id,
    },
    data: {
      isArchived: true,
    },
  });

  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
  redirect("/courses");
}

export async function createLesson(
  courseId: string,
  _previousState: LessonFormState,
  formData: FormData,
): Promise<LessonFormState> {
  return saveLesson({ courseId, formData });
}

export async function updateLesson(
  courseId: string,
  lessonId: string,
  _previousState: LessonFormState,
  formData: FormData,
): Promise<LessonFormState> {
  return saveLesson({ courseId, lessonId, formData });
}

async function saveLesson({
  courseId,
  lessonId,
  formData,
}: {
  courseId: string;
  lessonId?: string;
  formData: FormData;
}): Promise<LessonFormState> {
  const user = await requireCurrentUser();
  const title = readString(formData, "title");
  const description = readOptionalString(formData, "description");
  const requestedDeckId = readOptionalString(formData, "deckId");
  const sortOrder = readSortOrder(formData);
  const errors: Record<string, string> = {};

  if (!title) {
    errors.title = "Lesson title is required.";
  }

  if (Number.isNaN(sortOrder)) {
    errors.sortOrder = "Order must be a whole number.";
  }

  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      userId: user.id,
      isArchived: false,
    },
    select: {
      id: true,
    },
  });

  if (!course) {
    redirect("/courses");
  }

  const deckId = await getOwnedDeckId(requestedDeckId, user.id);

  if (requestedDeckId && !deckId) {
    errors.deckId = "Choose one of your active decks.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  if (lessonId) {
    const result = await prisma.lesson.updateMany({
      where: {
        id: lessonId,
        courseId,
        course: {
          userId: user.id,
        },
      },
      data: {
        title,
        description,
        deckId,
        sortOrder,
      },
    });

    if (result.count === 0) {
      redirect(`/courses/${courseId}`);
    }
  } else {
    await prisma.lesson.create({
      data: {
        courseId,
        title,
        description,
        deckId,
        sortOrder,
      },
    });
  }

  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
  redirect(`/courses/${courseId}`);
}

export async function archiveLesson(courseId: string, lessonId: string) {
  const user = await requireCurrentUser();

  await prisma.lesson.updateMany({
    where: {
      id: lessonId,
      courseId,
      course: {
        userId: user.id,
      },
    },
    data: {
      isArchived: true,
    },
  });

  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
  redirect(`/courses/${courseId}`);
}

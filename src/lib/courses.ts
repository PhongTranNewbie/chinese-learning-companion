"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

export async function createCourse(
  _previousState: CourseFormState,
  formData: FormData,
): Promise<CourseFormState> {
  const title = readString(formData, "title");
  const description = readOptionalString(formData, "description");

  if (!title) {
    return { errors: { title: "Course title is required." } };
  }

  const course = await prisma.course.create({
    data: {
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
  const title = readString(formData, "title");
  const description = readOptionalString(formData, "description");

  if (!title) {
    return { errors: { title: "Course title is required." } };
  }

  await prisma.course.update({
    where: {
      id: courseId,
    },
    data: {
      title,
      description,
    },
  });

  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
  redirect(`/courses/${courseId}`);
}

export async function archiveCourse(courseId: string) {
  await prisma.course.update({
    where: {
      id: courseId,
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
  const title = readString(formData, "title");
  const description = readOptionalString(formData, "description");
  const deckId = readOptionalString(formData, "deckId");
  const sortOrder = readSortOrder(formData);
  const errors: Record<string, string> = {};

  if (!title) {
    errors.title = "Lesson title is required.";
  }

  if (Number.isNaN(sortOrder)) {
    errors.sortOrder = "Order must be a whole number.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  if (lessonId) {
    await prisma.lesson.updateMany({
      where: {
        id: lessonId,
        courseId,
      },
      data: {
        title,
        description,
        deckId,
        sortOrder,
      },
    });
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
  await prisma.lesson.updateMany({
    where: {
      id: lessonId,
      courseId,
    },
    data: {
      isArchived: true,
    },
  });

  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
  redirect(`/courses/${courseId}`);
}

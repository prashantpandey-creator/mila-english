export type AssessmentLesson = {
  id: number;
  title: string;
};

function positiveSafeInteger(value: unknown) {
  if (typeof value === 'string' && !/^[1-9]\d*$/.test(value)) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Select only the lesson ID returned by the assessment that just completed.
 * With no expected ID, an invalid ID, or a missing lesson, fail closed rather
 * than presenting an older generated lesson as a fresh recommendation.
 */
export function selectCurrentAssessmentLesson(items: unknown, expectedId: unknown): AssessmentLesson | null {
  const id = positiveSafeInteger(expectedId);
  if (!id || !Array.isArray(items)) return null;

  const lesson = items.find((item) => {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as { id?: unknown; createdByUserId?: unknown };
    return candidate.id === id && candidate.createdByUserId != null;
  }) as { id: number; title?: unknown } | undefined;

  if (!lesson) return null;
  return { id: lesson.id, title: typeof lesson.title === 'string' ? lesson.title : '' };
}

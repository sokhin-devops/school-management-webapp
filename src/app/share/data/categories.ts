/**
 * Starting categories for fees and expenses, so a school's first record has
 * something to choose from. The fields stay editable: a school types its own,
 * and those join the list once used.
 */

/** 41-fees.md: "tuition, registration, transportation, laboratory, materials, or course fees". */
export const FEE_CATEGORIES: readonly string[] = [
  'Tuition',
  'Registration',
  'Transportation',
  'Laboratory',
  'Materials',
  'Course',
];

export const EXPENSE_CATEGORIES: readonly string[] = [
  'Salaries',
  'Utilities',
  'Rent',
  'Supplies',
  'Maintenance',
  'Transport',
  'Events',
  'Other',
];

/** Where a teacher sits; a school types its own when these do not fit. */
export const TEACHER_DEPARTMENTS: readonly string[] = [
  'Administration',
  'Arts',
  'Languages',
  'Mathematics',
  'Physical Education',
  'Science',
  'Social Studies',
  'Technology',
];

/** What a room is for; the field also takes a school's own. */
export const ROOM_KINDS: readonly string[] = [
  'Classroom',
  'Computer lab',
  'Hall',
  'Laboratory',
  'Library',
  'Office',
  'Studio',
];

/** The defaults and whatever the school has used, once each, in order. */
export function categoryChoices(
  defaults: readonly string[],
  used: readonly { label: string; value: string }[],
): { label: string; value: string }[] {
  const seen = new Set<string>();
  const choices: { label: string; value: string }[] = [];
  for (const category of [...defaults, ...used.map((choice) => choice.value)]) {
    const key = category.trim().toLowerCase();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    choices.push({ label: category.trim(), value: category.trim() });
  }
  return choices.sort((a, b) => a.label.localeCompare(b.label));
}

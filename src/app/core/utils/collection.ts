/** Anything the record lists hold: an entity identified by a stable id. */
export interface Identified {
  readonly id: string;
}

/**
 * Returns a new array with `next` replacing the entry that shares its id, or
 * appended when there is none.
 *
 * Every mock service saves the same way, and a signal only notifies on a new
 * reference, so this is the one place that rule is written down.
 */
export function upsertById<T extends Identified>(items: readonly T[], next: T): T[] {
  const index = items.findIndex((item) => item.id === next.id);
  if (index === -1) {
    return [...items, next];
  }

  const updated = [...items];
  updated[index] = next;
  return updated;
}

export function removeById<T extends Identified>(items: readonly T[], id: string): T[] {
  return items.filter((item) => item.id !== id);
}

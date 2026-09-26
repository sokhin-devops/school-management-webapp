import { HttpErrorResponse } from '@angular/common/http';

/**
 * Turns whatever failed into the one sentence a person can act on.
 *
 * In a module of its own because both resources and BranchContextService need
 * it, and BranchContextService is itself what the branch resource depends on —
 * keeping it in either of those made the two import each other in a cycle.
 */
export function describeFailure(failure: unknown): string {
  if (failure instanceof HttpErrorResponse) {
    if (failure.status === 0) {
      return 'Cannot reach the server. Check that the API is running.';
    }
    const body = failure.error as { message?: string; fieldErrors?: Record<string, string> | null } | null;
    // "Validation failed" alone tells nobody what to fix; the field messages do.
    const fields = Object.values(body?.fieldErrors ?? {});
    if (fields.length) {
      return fields.map((message) => message.charAt(0).toUpperCase() + message.slice(1)).join('. ') + '.';
    }
    if (body?.message) {
      return body.message;
    }
    return `The server returned ${failure.status}.`;
  }
  return 'Something went wrong.';
}

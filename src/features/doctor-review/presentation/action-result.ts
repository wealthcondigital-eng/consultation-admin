/// What every decision action answers with.
///
/// A returned result rather than a thrown error: these are called from forms,
/// and a rejected promise inside a server action reaches the user as a blank
/// error page instead of a message next to the button they pressed.
///
/// Lives beside `actions.ts` rather than in it because a `'use server'` module
/// may only export async functions.
export type ActionResult =
  | { readonly ok: true; readonly message: string | null }
  | { readonly ok: false; readonly error: string };

export const idleResult: ActionResult = { ok: true, message: null };

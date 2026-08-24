'use server';

import { revalidatePath } from 'next/cache';

import { reviewGraph } from '@/core/di/injector';
import { Failure, messageFor } from '@/core/error/failure';

import type { ActionResult } from './action-result';

async function run(
  doctorId: string,
  message: string,
  work: (graph: Awaited<ReturnType<typeof reviewGraph>>) => Promise<unknown>,
): Promise<ActionResult> {
  if (!doctorId) return { ok: false, error: 'That application could not be identified.' };

  try {
    const graph = await reviewGraph();
    await work(graph);
  } catch (error) {
    return { ok: false, error: messageFor(error) };
  }

  // Every surface that shows this application or counts it. The sidebar badge
  // lives in the console layout, which the queue path refresh also covers.
  for (const path of ['/queue', '/overview', '/decided', '/audit', `/queue/${doctorId}`]) {
    revalidatePath(path);
  }

  return { ok: true, message };
}

/// Accepts or rejects one uploaded file.
///
/// One action for both outcomes, chosen by the submit button's `intent`, so the
/// note the reviewer typed belongs to a single form rather than being mirrored
/// into two.
export async function decideDocumentAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const doctorId = String(formData.get('doctorId') ?? '');
  const documentId = String(formData.get('documentId') ?? '');
  const note = String(formData.get('note') ?? '');
  const intent = String(formData.get('intent') ?? '');

  if (intent === 'accept') {
    return run(doctorId, 'Document accepted.', ({ decide }) =>
      decide.acceptDocument(doctorId, documentId, note),
    );
  }

  if (intent === 'reject') {
    return run(doctorId, 'Document rejected.', ({ decide }) =>
      decide.rejectDocument(doctorId, documentId, note),
    );
  }

  return { ok: false, error: 'Choose whether to accept or reject the document.' };
}

/// Approves, rejects or returns the whole registration.
export async function decideApplicationAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const doctorId = String(formData.get('doctorId') ?? '');
  const reason = String(formData.get('reason') ?? '');
  const intent = String(formData.get('intent') ?? '');

  switch (intent) {
    case 'approve':
      return run(doctorId, 'Registration approved.', ({ decide }) =>
        decide.approve(doctorId),
      );
    case 'reject':
      return run(doctorId, 'Registration rejected.', ({ decide }) =>
        decide.reject(doctorId, reason),
      );
    case 'request_changes':
      return run(doctorId, 'Sent back to the doctor.', ({ decide }) =>
        decide.requestChanges(doctorId, reason),
      );
    default:
      return { ok: false, error: messageFor(new Failure('Choose a decision first.')) };
  }
}

/// Resolves the viewer's source for one document.
///
/// Always this app's own `/api/documents/...` route, never the API's URL or a
/// presigned link directly. The browser holds no API token — it is in an
/// httpOnly cookie by design — and the API sends no CORS headers, so a link
/// pointing anywhere but same-origin would arrive unauthenticated. That route
/// does the authenticated work and redirects to the bucket when there is one.
///
/// The API is still called here, and the result thrown away, so that a missing
/// document or an expired session surfaces as a message beside the button
/// rather than as a broken frame the reviewer has to interpret.
export async function documentUrlAction(
  doctorId: string,
  documentId: string,
): Promise<{ url: string } | { error: string }> {
  try {
    const { repository } = await reviewGraph();
    await repository.documentUrl(doctorId, documentId);

    return {
      url: `/api/documents/${encodeURIComponent(doctorId)}/${encodeURIComponent(documentId)}/preview`,
    };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

import { NextResponse } from 'next/server';

import { AppConfig, isFake } from '@/core/config/app-config';
import { reviewGraph } from '@/core/di/injector';
import { messageFor } from '@/core/error/failure';
import { readSession } from '@/core/session/admin-session';

/// Serves one document to the reviewer's browser.
///
/// The console has to mediate here, and it took getting the live backend
/// running to see why: the browser holds no API token — that is the whole point
/// of keeping it in an httpOnly cookie — and the API sends no CORS headers. A
/// link straight to the API would arrive unauthenticated and be refused. So the
/// browser asks this route, which is same-origin and carries the session cookie,
/// and the server side does the authenticated work.
///
/// Three cases:
///
///  * **fake backend** — render a placeholder SVG, so the viewer is real even
///    though the file is not.
///  * **live, real bucket** — the API returns an absolute presigned URL, and
///    this redirects the browser straight to it. The bytes never pass through
///    the console; S3 serves them, and the link expires on its own.
///  * **live, no bucket yet** — the API returns its own relative placeholder
///    path, which is fetched here with the admin token and streamed back.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ doctorId: string; documentId: string }> },
) {
  const { doctorId, documentId } = await params;

  const session = await readSession();
  if (!session) {
    // A document preview is not less sensitive than the record it belongs to.
    return NextResponse.json({ message: 'Not authorised.' }, { status: 401 });
  }

  let url: string;
  try {
    const { repository } = await reviewGraph();

    if (isFake) {
      const review = await repository.fetchApplication(doctorId);
      const document = review?.documents.find((candidate) => candidate.id === documentId);

      if (!review || !document) {
        return NextResponse.json({ message: 'No such document.' }, { status: 404 });
      }

      return svgResponse(placeholderSvg(review.fullName, document.fileName, review.registrationNumber));
    }

    url = await repository.documentUrl(doctorId, documentId);
  } catch (error) {
    return NextResponse.json({ message: messageFor(error) }, { status: 502 });
  }

  // A real presigned link. Hand the browser straight to it.
  if (/^https?:\/\//i.test(url)) {
    return NextResponse.redirect(url, 307);
  }

  // The API's own placeholder, which needs the admin bearer token to fetch.
  const upstream = await fetch(`${AppConfig.apiBaseUrl}${url}`, {
    headers: { authorization: `Bearer ${session.apiToken}` },
    cache: 'no-store',
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { message: 'That document could not be opened.' },
      { status: 502 },
    );
  }

  return new NextResponse(await upstream.text(), {
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'image/svg+xml; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}

function svgResponse(svg: string) {
  return new NextResponse(svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      // Never cached: a document link is per-review and short-lived by design.
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}

function placeholderSvg(
  fullName: string,
  fileName: string,
  registrationNumber?: string | null,
): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 860" width="620" height="860" font-family="Inter, system-ui, sans-serif">
  <rect width="620" height="860" fill="#ffffff"/>
  <rect x="0" y="0" width="620" height="8" fill="#4a90d9"/>
  <text x="48" y="96" font-size="13" font-weight="700" letter-spacing="1.6" fill="#9ca3af">SPECIMEN — NOT A REAL DOCUMENT</text>
  <text x="48" y="150" font-size="30" font-weight="800" fill="#111827">${escapeXml(fileName)}</text>
  <text x="48" y="188" font-size="17" fill="#6b7280">${escapeXml(fullName)}</text>
  <line x1="48" y1="220" x2="572" y2="220" stroke="#e5e7eb" stroke-width="1"/>
  <text x="48" y="262" font-size="14" fill="#374151">Registration no. ${escapeXml(registrationNumber ?? 'not given')}</text>
  <rect x="48" y="320" width="524" height="330" rx="12" fill="#f8fafc" stroke="#e5e7eb"/>
  <text x="310" y="470" font-size="15" fill="#9ca3af" text-anchor="middle">The real file lives in a private bucket and is</text>
  <text x="310" y="496" font-size="15" fill="#9ca3af" text-anchor="middle">fetched through a short-lived presigned link.</text>
  <text x="48" y="762" font-size="12" fill="#9ca3af">Served by the console&#39;s fake backend for development only.</text>
</svg>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

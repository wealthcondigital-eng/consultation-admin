import { redirect } from 'next/navigation';

import { readSession } from '@/core/session/admin-session';
import { SplashScreen } from '@/core/widgets/splash-screen';

/// The gate. The analogue of the splash route in the Flutter app: it decides
/// where to open rather than being a screen of its own, so a restored session
/// never sees the sign-in form.
///
/// The decision is made here, on the server, where the session cookie can be
/// read. The cookie is never exposed to the client and the branch is not
/// something the browser can influence.
///
/// **Only a signed-in reviewer gets the splash here**, and the reason is that
/// they are the only one with something to wait for: `/overview` is dynamic and
/// has to reach the API, so the splash covers real work while the destination
/// prefetches.
///
/// Signed out, there is nothing to wait for — so this redirects immediately and
/// the splash plays over the sign-in form instead, via `SplashIntro`. That also
/// means it plays for somebody who opens `/login` directly, from a bookmark or
/// a sign-out, who would otherwise never see it. One splash on every path in,
/// and never two.
export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const session = await readSession();

  if (!session) redirect('/login');

  return (
    <SplashScreen
      target="/overview"
      firstName={session.fullName.split(' ')[0] ?? null}
    />
  );
}

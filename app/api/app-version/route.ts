import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Latest Android app version published to Google Play.
 *
 * BUMP these two values on EVERY Play release and keep them in sync with
 * mobile/android/app/build.gradle (versionCode / versionName).
 *
 * The VG Driver app fetches this endpoint after login, compares its own
 * versionCode against `latestVersionCode`, and shows an "Доступно обновление"
 * prompt (→ Google Play) when the installed app is older than the latest.
 *
 * Safe default: if you forget to bump, newer apps simply won't be prompted.
 */
const LATEST_ANDROID = {
  latestVersionCode: 10,
  latestVersionName: '1.0.9',
  packageName: 'com.driver.crm',
};

export async function GET() {
  return NextResponse.json(
    { android: LATEST_ANDROID },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

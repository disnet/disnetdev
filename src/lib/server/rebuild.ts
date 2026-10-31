import { env } from '$env/dynamic/private';

// Public pages are prerendered, so a change to a published document only shows
// up once the site is built again. Kick the deploy workflow (see
// .github/workflows/deploy.yml) after the author publishes, edits or deletes.
//
// Needs GITHUB_DEPLOY_TOKEN: a fine-grained token on the repo with
// "Actions: read and write". Without it this is a no-op and the scheduled
// rebuild picks the change up instead.
export async function requestSiteRebuild(reason: string) {
  const token = env.GITHUB_DEPLOY_TOKEN;
  if (!token) {
    console.warn(`[rebuild] GITHUB_DEPLOY_TOKEN is not set; skipping rebuild (${reason})`);
    return;
  }

  const repo = env.GITHUB_DEPLOY_REPO || 'disnet/disnetdev';
  const workflow = env.GITHUB_DEPLOY_WORKFLOW || 'deploy.yml';
  const ref = env.GITHUB_DEPLOY_REF || 'main';

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`,
      {
        method: 'POST',
        headers: {
          accept: 'application/vnd.github+json',
          authorization: `Bearer ${token}`,
          'user-agent': 'disnetdev-site',
          'x-github-api-version': '2022-11-28'
        },
        body: JSON.stringify({ ref })
      }
    );

    if (!response.ok) {
      console.error(`[rebuild] dispatch failed: ${response.status} ${await response.text()}`);
    }
  } catch (err) {
    // Publishing already succeeded; a missed rebuild is caught by the schedule.
    console.error('[rebuild] dispatch failed', err);
  }
}

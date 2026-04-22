import { getOAuthClient } from '$lib/atproto/auth';

export function GET() {
  return Response.json(getOAuthClient().clientMetadata, {
    headers: {
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=3600'
    }
  });
}

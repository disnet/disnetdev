import { requirePublicationAtUri } from '$lib/config';

export function GET() {
  return new Response(requirePublicationAtUri(), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=3600'
    }
  });
}

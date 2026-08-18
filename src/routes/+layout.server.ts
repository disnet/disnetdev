import { AUTHOR_DID } from '$lib/config';
import { getSubscriber } from '$lib/server/session';

export async function load({ cookies }) {
  return {
    authorDid: AUTHOR_DID,
    subscribed: Boolean(await getSubscriber(cookies))
  };
}

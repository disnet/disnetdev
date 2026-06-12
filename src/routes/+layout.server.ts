import { getSubscriber } from '$lib/server/session';

export async function load({ cookies }) {
  return {
    subscribed: Boolean(await getSubscriber(cookies))
  };
}

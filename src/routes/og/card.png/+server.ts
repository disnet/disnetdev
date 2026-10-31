// Built once at deploy time. `/og` stays as a rendered fallback for cards that
// were shared before the image moved here.
export { GET } from '../+server';

export const prerender = true;

import { AUTHOR_DID } from '$lib/config';

// Nothing here may depend on the visitor: this load feeds every prerendered
// public page. Per-visitor state (the subscribe control) is read in the browser.
export function load() {
  return {
    authorDid: AUTHOR_DID
  };
}

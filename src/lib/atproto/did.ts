type DidDocument = {
  id?: string;
  service?: Array<{
    id?: string;
    type?: string;
    serviceEndpoint?: string | { uri?: string };
  }>;
};

function isDidWeb(did: string) {
  return did.startsWith('did:web:');
}

function isDidPlc(did: string) {
  return did.startsWith('did:plc:');
}

function getDidWebUrl(did: string) {
  const parts = did.replace('did:web:', '').split(':').map(decodeURIComponent);
  const host = parts[0];
  const path = parts.slice(1);

  if (path.length === 0) {
    return `https://${host}/.well-known/did.json`;
  }

  return `https://${host}/${path.join('/')}/did.json`;
}

export async function resolveDidDocument(did: string): Promise<DidDocument> {
  let url: string;

  if (isDidPlc(did)) {
    url = `https://plc.directory/${did}`;
  } else if (isDidWeb(did)) {
    url = getDidWebUrl(did);
  } else {
    throw new Error(`Unsupported DID method for resolution: ${did}`);
  }

  const response = await fetch(url, {
    headers: {
      accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to resolve DID document for ${did}: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as DidDocument;
}

export async function resolvePdsUrlFromDid(did: string): Promise<string> {
  const document = await resolveDidDocument(did);
  const service = document.service?.find(
    (entry) =>
      entry.type === 'AtprotoPersonalDataServer' ||
      entry.id?.endsWith('#atproto_pds') ||
      entry.id === '#atproto_pds'
  );

  if (!service?.serviceEndpoint) {
    throw new Error(`No AtprotoPersonalDataServer service found for DID ${did}`);
  }

  const endpoint =
    typeof service.serviceEndpoint === 'string'
      ? service.serviceEndpoint
      : service.serviceEndpoint.uri;

  if (!endpoint) {
    throw new Error(`Invalid PDS service endpoint for DID ${did}`);
  }

  return endpoint.replace(/\/$/, '');
}

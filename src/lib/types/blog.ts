export type BlobRef = {
  $type?: 'blob';
  ref: { $link: string };
  mimeType: string;
  size: number;
};

export type MarkdownContent = {
  $type: 'dev.disnet.blog.content.markdown';
  markdown: string;
  sourceFormat?: 'markdown';
  wordCount?: number;
};

export type PublicationRecord = {
  $type: 'site.standard.publication';
  url: string;
  name: string;
  description?: string;
  icon?: BlobRef;
  preferences?: {
    showInDiscover?: boolean;
  };
};

export type PublishedDocument = {
  $type: 'site.standard.document';
  site: string;
  title: string;
  publishedAt: string;
  path?: string;
  description?: string;
  tags?: string[];
  content?: MarkdownContent;
  textContent?: string;
  updatedAt?: string;
  coverImage?: BlobRef;
  embeddedBlobs?: BlobRef[];
};

export type DraftRecord = {
  $type: string;
  title: string;
  slug: string;
  description?: string;
  tags?: string[];
  markdown: string;
  createdAt: string;
  updatedAt: string;
  coverImage?: BlobRef;
  embeddedBlobs?: BlobRef[];
  sourceDocumentRkey?: string;
  legacy?: {
    sourcePath?: string;
    originalFilename?: string;
    importedAt?: string;
    previousPaths?: string[];
  };
};

export type DocumentSummary = {
  rkey: string;
  path: string;
  slug: string;
  title: string;
  description?: string;
  tags?: string[];
  publishedAt: string;
};

export type ShareSummary = {
  rkey: string;
  uri: string;
  itemUrl: string;
  itemTitle?: string;
  itemAuthor?: string;
  itemDescription?: string;
  itemImage?: string;
  itemPublishedAt?: string;
  feedUrl?: string;
  note?: string;
  tags?: string[];
  createdAt: string;
};

export type CardSummary = {
  rkey: string;
  uri: string;
  url: string;
  title?: string;
  description?: string;
  author?: string;
  siteName?: string;
  publishedDate?: string;
  createdAt: string;
  collectionRkeys: string[];
};

export type CollectionSummary = {
  rkey: string;
  uri: string;
  name: string;
  description?: string;
  accessType: 'OPEN' | 'CLOSED';
  cardCount: number;
  updatedAt?: string;
  createdAt?: string;
};

export type PostPageData = {
  uri: string;
  rkey: string;
  path: string;
  slug: string;
  title: string;
  description?: string;
  tags?: string[];
  updatedAt?: string;
  publishedAt: string;
  html: string;
  footnotes: Array<{
    id: string;
    refId: string;
    label: string;
    number: number;
    html: string;
  }>;
  coverImageUrl?: string;
  coverImageAlt?: string;
};

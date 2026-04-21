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
};

export type DraftRecord = {
  $type: 'dev.disnet.blog.draft';
  title: string;
  slug: string;
  description?: string;
  tags?: string[];
  markdown: string;
  createdAt: string;
  updatedAt: string;
  coverImage?: BlobRef;
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
  coverImageUrl?: string;
};

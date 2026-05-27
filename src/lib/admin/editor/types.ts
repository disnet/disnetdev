export type ContentValue = MarkdownContentValue;

export type MarkdownContentValue = {
  $type: 'dev.disnet.blog.content.markdown';
  markdown: string;
};

export type ContentType = ContentValue['$type'];

export type SerializedFor<T extends ContentType> = Extract<ContentValue, { $type: T }>;

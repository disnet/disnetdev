// Shapes for the Made in public ledger, shared by the server loader and the
// pages that render it.

export type LedgerKind = 'finished' | 'started' | 'noted' | 'merged' | 'published' | 'opened';

export type LedgerEntry = {
  id: string;
  at: string;
  kind: LedgerKind;
  project: string;
  title: string;
  detail?: string;
  href: string;
  links?: { title: string; uri: string }[];
  // Notes on the same goal in the same week fold into one line.
  count?: number;
};

export type LedgerWeek = {
  start: string;
  entries: LedgerEntry[];
  tally: { kind: LedgerKind; n: number }[];
};

export type Ledger = {
  weeks: LedgerWeek[];
  projects: { name: string; n: number }[];
  total: number;
  since: string;
};

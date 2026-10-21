// The field guide: record families I've designed, with a sentence of context
// for each, and the record types worth a plate. What the fields look like is
// read from real records at request time; only the prose here is written by
// hand. Client-safe.

export type FamilySpec = {
  key: string;
  name: string;
  home?: string;
  blurb: string;
  namespaces: string[];
  specimens: { nsid: string; note: string }[];
};

export const FAMILIES: FamilySpec[] = [
  {
    key: 'radial',
    name: 'Radial',
    home: 'https://radl.app',
    blurb:
      'Agent orchestration on the Atmosphere. Teams, projects and goals are records in the repos of the people who own them, and coding agents pick goals up and open PRs.',
    namespaces: ['dev.radl', 'com.disnetdev.radial'],
    specimens: [
      {
        nsid: 'dev.radl.v2.goal',
        note: 'A goal is little more than an identity and the team it belongs to. Everything else about it arrives as ops.'
      },
      {
        nsid: 'dev.radl.v2.goalOp',
        note: 'One change to a goal. Goals are folded from a log of these rather than edited in place, so anyone on the team can write to one from their own repo.'
      },
      { nsid: 'dev.radl.v2.team', note: 'The group a goal or project belongs to.' },
      {
        nsid: 'com.disnetdev.radial.goal',
        note: 'The first version, before the dev.radl namespace: one record per goal, with its title and body inline.'
      }
    ]
  },
  {
    key: 'atplan',
    name: 'atplan',
    blurb:
      'Plans for software projects: goals that are outcomes rather than tasks, and the dependencies between them. Agents read the plan, do the work and leave notes.',
    namespaces: ['com.disnetdev.atplan'],
    specimens: [
      { nsid: 'com.disnetdev.atplan.plan', note: 'A plan has a vision and a set of goals that point back at it.' },
      { nsid: 'com.disnetdev.atplan.goal', note: 'An outcome, with a summary and a test for when it counts as done.' },
      { nsid: 'com.disnetdev.atplan.note', note: 'Progress on a goal, with links to the PRs and branches that back it up.' }
    ]
  },
  {
    key: 'skyreader',
    name: 'Skyreader',
    home: 'https://skyreader.app',
    blurb:
      'An RSS reader on the Atmosphere. Subscriptions, read positions and shares live in your repo, so another reader could pick them up.',
    namespaces: ['app.skyreader', 'com.at-rss'],
    specimens: [
      { nsid: 'app.skyreader.feed.subscription', note: 'A feed you follow, RSS or atproto documents alike.' },
      { nsid: 'app.skyreader.social.share', note: 'An article passed along, with an optional note.' },
      { nsid: 'app.skyreader.feed.readPosition', note: 'An item you read, and whether you starred it.' }
    ]
  },
  {
    key: 'skyboard',
    name: 'Skyboard',
    home: 'https://skyboard.dev',
    blurb: 'A Kanban board on the Atmosphere. The board is mine; cards and moves can come from anyone I trust.',
    namespaces: ['dev.skyboard'],
    specimens: [
      { nsid: 'dev.skyboard.board', note: 'Columns and labels. Everything else points here.' },
      { nsid: 'dev.skyboard.task', note: 'A card, placed in a column by a fractional position.' },
      { nsid: 'dev.skyboard.op', note: 'A move or edit to a card, written by whoever made it.' }
    ]
  },
  {
    key: 'atrfc',
    name: 'RFCs on the Atmosphere',
    blurb: 'Proposals for the Atmosphere, published as versioned documents and discussed with comments from anyone’s repo.',
    namespaces: ['dev.disnet.atrfc'],
    specimens: [
      { nsid: 'dev.disnet.atrfc.comment', note: 'A comment pinned to the exact version of the document it answers.' }
    ]
  },
  {
    key: 'flint',
    name: 'Flint',
    home: 'https://www.flintnote.com',
    blurb: 'A note-taking app. The public repo only holds a manifest; the notes themselves live in permissioned spaces.',
    namespaces: ['com.disnetdev.flint'],
    specimens: [{ nsid: 'com.disnetdev.flint.vaultManifest', note: 'Points at each vault’s space. Nothing in a note is public.' }]
  }
];

export type FieldShape = {
  name: string;
  type: string;
  presence: number;
  example?: string;
  depth: number;
};

export type Specimen = {
  nsid: string;
  note: string;
  plate: number;
  fields: FieldShape[];
  mine: number;
  mineCapped: boolean;
  firstSeen?: string;
  lastSeen?: string;
  network?: number;
  networkCapped?: boolean;
  example?: string;
};

export type Family = Omit<FamilySpec, 'specimens'> & { specimens: Specimen[]; collections: number };

export type FieldGuide = { families: Family[]; plates: number; asOf: string };

---
title: New Year, New Flint
date: 2026-01-03
description: Big rework of Flint including updates to UI, new Automerge data layer, and a web version.
---

Big changes with [Flint](https://www.flintnote.com/)! Over the holidays I completely reworked just about every part of Flint. 

The UI has been totally refreshed, making every view cleaner and easier to navigate.

![Screenshot of Flint with the Agent panel open](/img/2026-01-03-flint-interface.png)

Under the hood, the way Flint stores  data has also changed. Previously we used a local SQLite database with a two-way sync to markdown files. This worked well enough (though the sync code was gross and had unresolved bugs) but the architecture made it hard to implement features I really wanted like versioning and syncing.

So, the new Flint now uses [Automerge](https://automerge.org/) to store notes, while still keeping the two-way markdown file syncing of the previous version. Automerge is a [CRDT](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type) library that makes it possible to sync data across devices without needing to store all your data in a central server. The current rework doesn't including syncing yet but guess what feature I'll be working on soon 😆.

The other capability Automerge gives us is the ability to easily make a web app that stores all your note data locally in the browser. You can try it out [here](https://app.flintnote.com/) to see the new interface and features without installing anything. The only capabilities that aren't included at the moment are markdown file syncing, review mode, and the AI agent.

I think Flint is really starting to come together. More to come soon but take a look and let me know what you think!

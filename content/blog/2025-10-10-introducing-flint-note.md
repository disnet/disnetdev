---
title: Introducing Flint
date: 2025-10-10
description: Introducing Flint, my new note-taking/thinking-system project.
---

[Flint](https://www.flintnote.com/) is a new note-taking/thinking-system I’m working on that fixes a lot of the frustrations I’ve had with traditional note-taking apps (or at lest it *will try* to fix those frustrations 😅)

I’ve long been obsessed with note-taking systems in both paper and digital forms because I love the idea of a system that helps me think better.

At the start of this summer (after [freeing up](https://www.disnetdev.com/blog/2025-06-03-new-things/) a bunch of my time) I started [experimenting](https://www.disnetdev.com/blog/2025-06-16-mcp-is-neat/) with [how](https://www.disnetdev.com/blog/2025-06-30-the-note-taking-trap-why-ai-could-save-or-destroy-how-we-think/) to [best](https://www.disnetdev.com/blog/2025-07-02-building-a-personal-gtd-system-in-plain-text-with-ai-agents/) improve my personal note taking system using LLMs. One of the outcomes of those experiments was [flint-note-mcp](https://github.com/disnet/flint-note-mcp) an MCP server that gave LLMs the ability to write and manage a directory of structured notes. It was an attempt to see just how far you could push note taking away from a UI. Just chat with any LLM and have the AI write your notes.

The MCP server was an interesting experiment but ultimately it made me realize two things. First, LLMs are magic and have serious potential but also they have a tendency to take over your thinking, which is the opposite of what you want in a good note-taking system. Second, I really needed a good UI.

So, I started working on [Flint](https://www.flintnote.com/), an attempt to make a good UI that uses LLMs in a way that won’t harm your thinking.

I’ll write a bunch more about all of this but the main philosophy behind Flint is this:

- **You own your notes**. Flint is plaintext-first. No lock-in and no complex formats that make migrating to a different system a pain. Flint just makes normal markdown files on your hard drive. Eventually I might add an optional sync system but your notes will always start as just normal text files on your computer that you control.
- **A UI that is humane**. The UI should surface *appropriate abstractions* that respects the way *you* think. This means you mange *notes* rather than files and folders. The UI should give you a workspace where you can make a mess and also give you tools to clean it up.
- **Writing is thinking and you do the thinking**. LLMs are incredible bits of magic but they can easily damage your thinking by automating your writing. Flint will incorporate LLMs and AI agents in a way that allows you to be ambitious with your thinking system without replacing the writing and thinking work that only *you* can do.

I’ve got a bunch more thinking, writing, and building to do but if this sounds interesting to you, go subscribe to the Flint [newsletter](https://buttondown.com/flintnote) where I’ll send out links to the beta when it's ready. If you have any questions just shoot me an email at [tim@flintnote.com](mailto:tim@flintnote.com).

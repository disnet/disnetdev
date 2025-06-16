---
title: MCP is neat
date: 2025-06-16
description: Using MCP to solve the 'activation energy' problem of creating Anki cards
---

Jotting down an aha! moment I had about how [MCP](https://modelcontextprotocol.io/introduction) can augment the utility of LLMs in some of the things I do every day.

The background is I've been trying to be more intentional about committing things to memory using [Anki](https://apps.ankiweb.net/) and [spaced repetition](https://en.wikipedia.org/wiki/Spaced_repetition). I was inspired years ago by Michael Nielsen's [article](https://augmentingcognition.com/ltm.html) about using SRS to read and remember ideas from papers so that's my main goal: commit interesting ideas from papers to memory.

When I first read that article I tried to build an Anki routine but fell off—the activation energy required to add cards was always too high (also [writing good prompts is hard](https://notes.andymatuschak.org/z2D1qPwddPktBjpNuwYFVva?stackedNotes=zKy4FsHTcf8LdkgXkMueeGL)).

LLMs are really good at summarizing and restructuring text so I wondered if they could help with writing Anki cards. I'm not sure if this is the right approach long-term since writing cards by hand would almost certainly aid in the learning process. That said, it turns out I couldn't sustain the manual effort so I think it's worth experimenting to see if a different approach could help.

So my approach is to use an LLM to help write the cards. MCP then lets me easily connect the LLM directly to Anki and even further reduce the activation energy required for authoring cards.

I'm using [Raycast](https://www.raycast.com/), but the basic idea works in any MCP-capable LLM client (e.g. [Claude desktop](https://claude.ai/download)). The MCP server I'm using is [anki-mcp-server](https://github.com/nailuoGG/anki-mcp-server), which requires Anki and the [AnkiConnect](https://ankiweb.net/shared/info/2055492159) plugin. Wiring up the Anki MCP server to Raycast is super straightforward and took me all of five minutes.

For articles, there are a few kinds of prompts that seem to work. If the article is well-known and in the model's training set, you can simply say:

> suggest some anki cards for the article "As We May Think" by Vannevar Bush

Claude 4 responds with something like:

> **Basic Information Cards**
>
> **Card 1:**
>
> • **Front:** Who wrote "As We May Think" and when was it published?
>
> • **Back:** Vannevar Bush, published in The Atlantic Monthly in July 1945
>
> **Core Concepts**
>
> **Card 2:**
>
> • **Front:** What is the "Memex" as described by Vannevar Bush?
>
> • **Back:** A hypothetical electromechanical device that would store books, records, and communications, allowing users to retrieve and link information through associative trails
>
> ...

For newer or less well-known articles, you can paste the entire article or a URL (if the model supports web browsing). Not every suggested card will be useful, sometimes the model suggests trivia I don't care about, but it's easy to go back and forth with the model to pick the best ones. You can also add some pre-prompt instructions to guide the model toward the kinds of cards that are most helpful, but honestly, it's quick enough to just pick out the good ones.

Once I have the cards I like, it’s a simple instruction to add them to Anki:

> now add those cards to @anki

(Raycast uses the `@` notation to add an MCP server to a chat, but you can also provide it as a chat preset.)

Raycast also provides a nice feature to wrap commonly used prompts in [AI commands](https://manual.raycast.com/ai#block-1cfd6e4a8215812f87f5dbc614adbccf). For example, I’ve added an “ankify” command with a prompt like:

> from the article in {browser-tab}, suggest some anki cards to help me remember the salient points. when referencing the article use a short version of its title and link to it

This does what it sounds like: it provides the currently focused browser tab as context to the model. I can then check the suggested cards and follow up by telling it to add them to my Anki deck.

I think it's pretty neat that thanks to MCP we can now wire up these powerful capabilities to our LLMs in a matter of minutes.

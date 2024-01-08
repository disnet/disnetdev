---
type: blog draft
url: https://posts.disnetdev.com/2024/01/06/neat-simple-llm.html
title: Neat simple LLM use for text manipulation
date: 2024-01-06
share: "true"
---

I had a neat little interaction with an LLM this week where I had a markdown note in Obsidian I wanted to convert some of its formatting. The note had a bunch of external markdown links:

```
- [Note1](app://obsidian.md/path/to/Note1)
- [Note2](app://obsidian.md/path/to/Note2)
- ...
```

that I wanted to convert to internal links:

```
- [[Note1]]
- [[Note2]]
- ...
```

Previously to do this I'd either reach for something like a [vim macro](https://vim.fandom.com/wiki/Macros) or write a little regex. Realistically for most cases the activation energy would be too much and I'd just not do the reformatting at all.

But with a LLM (in this case I used the [TextGen](https://text-gen.com/) plugin) you can just show an example and tell the [[LLM|LLM]] to do it and it just works. The prompt was something like

```
- [Note1](app://obsidian.md/path/to/Note1)
- [Note2](app://obsidian.md/path/to/Note2)
- ...

---

convert the list above from `[Note](path/to/Note)` to `[[Note]]`
```

It's pretty cool that we basically get a kind of [programming by example](https://en.wikipedia.org/wiki/Programming_by_example) for "free" with LLMs.
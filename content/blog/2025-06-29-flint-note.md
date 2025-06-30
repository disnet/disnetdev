---
title: The Note-Taking Trap - Why AI Could Save (or Destroy) How We Think
date: 2025-06-29
description: Introduces Flint Note.
---

# The Note-Taking Trap: Why AI Could Save (or Destroy) How We Think

I'm obsessed with note-taking systems. I've been obsessed with them for most of my computer-using life, trying to find the perfect note-taking system. Evernote, Notion, Roam, Obsidian—each promised to be my "external brain". I spent hours building out workflows to help me think and act on the things that mattered to me. But inevitably I would hit the same wall when my system became unmanageable and I had to start over from scratch.

Here's the problem: your thinking changes. Your projects shift. Your interests expand. But most note-taking systems lock you into structures that become prisons over time. Maybe you organize by project phases—"Research", "Planning", "Execution", "Review". Then you start working on iterative projects that don't follow linear phases, and your structure crumbles.

You either stick with categories that no longer fit, or you [abandon](https://www.joanwestenberg.com/p/i-deleted-my-second-brain) the system entirely and start over.

Now AI promises a solution: just dump everything into a smart assistant and let it handle the thinking for you. Sounds perfect, right?

Maybe, but I think that approach is dangerous.

When we fully outsource our thinking to AI, our thinking atrophies. Think about the Google Maps effect: before GPS, we mentally mapped neighborhoods, remembered landmarks, and built spatial reasoning. After GPS, we can't navigate familiar areas without turn-by-turn directions. The same thing happens with AI-assisted thinking.

The messy work of organizing ideas, making connections, and structuring knowledge isn't busy work—it's how we actually think and learn. Automate that away, and you're automating away your own intelligence.

Plus, you're handing over your most valuable asset—your accumulated knowledge and thinking—to systems you don't control.

So here's what I want: an AI thinking system that I control and that **augments** my thinking instead of replacing it.

Instead of throwing everything into an AI void, imagine an agent that works _with_ you based on **your explicit preferences** for how you want to think and organize. You tell the system what kinds of notes you work with—daily journals, project logs, book summaries, meeting notes, research captures—and what workflows matter to you: weekly reviews, concept mapping, progressive summarization, or building arguments over time.

For example, you specify that you keep "insight notes" and "reference notes" separate, and prefer connecting ideas through explicit linking rather than tagging. The AI then notices when you write about "flow state" in an insight note, remembers you mentioned "deep work" in a book reference from 6 months ago and "maker's schedule" in a meeting capture, then suggests creating a synthesis document that fits your preferred workflow—maybe a new insight note that builds on these connections, or links to add to your existing concept map.

Or when your project logs increasingly reference the same underlying problems across different domains, the AI suggests a reorganization that aligns with how you actually think—perhaps shifting from department-based folders to problem-solution frameworks, but only because you've indicated you prefer outcome-oriented organization over categorical filing.

The AI handles the friction—the tedious reorganization, automatically tagging notes with concepts and people mentioned, the structural updates—while you focus on the actual thinking. The goal isn't to eliminate the work of thinking. It's to eliminate the work that gets in the way of thinking.

This vision sounds great in theory, but how do you actually build it? The traditional approach would be to create another proprietary platform, which is exactly the kind of lock-in I want to avoid. Instead, we need a way for AI models to work with your note-taking system while keeping your notes completely under your control.

## MCP Is Neat

This is where I think [Model Context Protocol](https://modelcontextprotocol.io/introduction) (MCP) unlocks something special. Unlike proprietary systems that lock you into a platform, MCP unlocks the potential for any AI model to work with your data while *you* stay in control.

Consider the difference: In traditional systems, your notes are locked in Notion's proprietary format. Want to switch to Obsidian? Technically there is an export but the export breaks formatting and loses connections. Company gets [acquired](https://techcrunch.com/2022/11/16/bending-spoons-acquires-evernote-marking-the-end-of-an-era/)? Your thinking system disappears.

With an MCP-enabled system, your notes can just be files in a folder. The AI agent reads and writes through the MCP protocol, but you can switch AI models, sync services, or editing tools without losing anything. Your 10-year+ knowledge base outlasts any single company or platform.

But unlike traditional file-based systems like Obsidian where you're on your own for organization, the AI agent becomes your active partner in managing, connecting, and evolving this information.

This separation of concerns (intelligence versus data storage) enables something that wasn't possible before: true agent-first design where the AI can be deeply integrated with your thinking process and you control your data.

This isn't some distant future vision. It's what I'm building right now with [Flint Note](https://github.com/disnet/flint-note/).

## How Flint Works

Flint is an MCP server that organizes your notes as a vault of ordinary markdown files with semantic note types. Each note type defines its purpose, custom agent instructions, and metadata schema. Let me show you how this works in practice by walking through setting up a vault with three common note types.

### Setting Up Your Vault

A vault starts as just a directory of markdown and YAML config files:

```
my-notes/
├── .flint-note/
│   └── config.yml
├── daily/
│   └── _description.md
├── todos/
│   └── _description.md
└── reading/
│   └── _description.md
```

The magic happens when you define what each note type means and how the AI should behave when working with it.

### Creating Note Types Through Conversation

Let's start by defining our note types:

> You: lets create three note types: daily, todo, and reading
>
> Agent: I'll create all three note types for you: daily, todo, and reading. Let me set each one up with thoughtful agent instructions and useful metadata schemas.
>
> [Creates daily/\_description.md, todo/\_description.md, reading/\_description.md]
>
> Perfect! I've created all three note types for your vault:
>
> **📅 Daily (Journal & Reflection)**
>
> • **Purpose**: Daily journal entries for reflection, planning, and personal growth
> • **Features**: Mood tracking, energy levels, gratitude lists, key insights, and tomorrow's focus
> • **Agent Behavior**: Structures entries with morning intentions, daily events, and evening reflection while identifying patterns and celebrating progress
>
> **✅ Todo (Task Management)**
>
> • **Purpose**: Task management with priority, deadlines, and progress monitoring
> • **Features**: Priority levels, categories, completion tracking, due dates, and project connections
> • **Agent Behavior**: Formats tasks as checkboxes, organizes by priority, identifies dependencies, and suggests productivity improvements
>
> **📚 Reading (Books & Articles)**
>
> • **Purpose**: Reading notes for books, articles, and other materials with insights and connections
> • **Features**: Author tracking, reading status, ratings, key takeaways, and topic organization
> • **Agent Behavior**: Structures notes with summaries and key ideas, identifies connections to other materials, and encourages critical thinking
>
> Your vault is now ready for comprehensive knowledge management! You can start creating notes of any of these types. Just say something like:
>
> - "Create today's daily note"
> - "Add a todo list for this week's tasks"
> - "I want to create a reading note for [book/article name]"
>
> What would you like to create first?

The resulting `daily/_description.md` looks like this:

```markdown
# Daily

## Purpose

Daily journal entries for reflection, planning, and personal
growth tracking

## Agent Instructions

- Structure daily notes with clear sections: Morning
  intentions, daily events, evening reflection
- Extract and highlight key insights, lessons learned,
  and personal growth moments
- Identify patterns in mood, energy, productivity, and relationships
- Suggest connections to previous daily entries when
  similar themes emerge
- Encourage reflection questions: What went well? What
  could be improved? What am I grateful for?
- Track recurring themes and suggest deeper exploration
  through follow-up questions
- Notice and celebrate small wins and progress toward personal goals
- When appropriate, suggest creating separate notes for
  significant insights or ideas that emerge

## Metadata Schema

Expected frontmatter or metadata fields for this note type:

- `mood`: Overall mood for the day (optional, select,
  options: [`energized`, `content`, `neutral`, `tired`,
  `stressed`, `excited`, `reflective`, `grateful`])
- `energy_level`: Energy level (1-10 scale) (optional,
  number, min: 1, max: 10)
- `gratitude`: Things you're grateful for today (optional, array)
- `key_events`: Significant events or moments from the
  day (optional, array)
- `insights`: Key insights or lessons learned (optional, array)
- `tomorrow_focus`: Main focus or intention for tomorrow (optional)
```

Since the description is just a plain text markdown file, you can have the agent update it or edit it yourself with a text editor.

**Adding Notes Through Natural Conversation**

Now let's see the system in action:

> You: Add today's daily note
>
> Agent: [Creates daily/2025-06-27.md with structured content]
>
> Perfect! I've created your daily note for today, _June 27, 2025_. Following the agent instructions for daily notes, I've structured it with clear sections to guide your reflection:
>
> ## Your Daily Note Structure
>
> **Morning Intentions** (Space to set your focus for the day)
> **Daily Events** (Capture key moments, interactions, and accomplishments)
> **Evening Reflection** (Process how the day went with guided questions)
> **Gratitude Section** (Practice appreciation)
> **Key Insights & Lessons** (Extract learning and growth moments)
> **Tomorrow's Focus** (Set intention for the next day)
>
> The note is ready for you to fill in! As you use it, I'll help you:
>
> - Identify patterns in your mood, energy, and productivity
> - Connect themes to previous daily entries
> - Celebrate your small wins and progress
> - Extract insights that might be worth exploring in separate notes
>
> You can also add metadata like your mood, energy level (1-10), and specific gratitude items if you'd like more structured tracking. How would you like to start filling it in?
>
> You: My energy is about a 7, pretty good energy
>
> Agent: Great! I've updated your daily note to capture that energy level of 7. That's solid energy for the day!
>
> With that good energy level, it sounds like you're having a productive day. What's been contributing to that energy? Any particular events, accomplishments, or moments that have stood out so far today?
>
> I can help you capture those in the daily events section, or if you're reflecting on the day, we could work on the evening reflection part. What would you like to add to your daily note?

Adding a reading note:

> You: Add a reading note for "The Unaccountability Machine" by Dan Davies. I've finished it, here's a great quote:
>
> "An organisation does things, and it systematically does some things rather than others. But that's as far as it goes. Systems don't make mistakes – if they do something, that's their purpose."
>
> Agent: Excellent! I've added that powerful quote and updated your reading note to show you've completed the book. That's a really striking insight – the idea that "systems don't make mistakes, if they do something, that's their purpose" cuts right to the heart of how we think about organizational accountability.
>
> Since you've finished the book, I'd love to help you capture more of your insights:
>
> - What was the main thesis that resonated most with you?
> - How does this quote connect to the broader argument about unaccountability?
> - Are there specific examples from the book that illustrate this "systems don't make mistakes" principle?
> - Does this change how you think about organizations you've worked with or observed?
>
> This seems like the kind of concept that could warrant its own separate note if it becomes a recurring theme in your thinking about systems and organizations. What other key takeaways stood out to you from the book?
>
> [Creates reading/the-unaccountability-machine.md with the quote and reading status]

**Evolving Your System**

The real power emerges when you want to adapt how the system works:

> You: Update my daily notes to also ask about tomorrow's top priority
>
> Agent: I'll modify your daily note instructions to include planning tomorrow's main focus.
>
> [Updates daily/\_description.md to add tomorrow planning prompt]
>
> Updated! Now when you create daily notes, I'll also ask: "What's your top priority for tomorrow?" This will help bridge your reflection with forward planning.
>
> You: Actually, make it three priorities, not just one
>
> Agent: Good adjustment! Three priorities gives you more flexibility while still maintaining focus.
>
> [Updates the instruction again]
>
> Done! I'll now ask for your top three priorities for tomorrow in each daily note.

**The Result: Intelligent, Adaptive Organization**

What you end up with is a system that understands the different contexts of your thinking:
- **Daily notes** become reflective conversations that build self-awareness over time
- **Todos** match tasks to your energy and connect to bigger projects
- **Reading notes** capture insights with precision and link to your active work

But unlike rigid templates, every aspect can evolve through natural conversation. The AI learns your preferences and adapts its behavior, while your data remains simple markdown files you can edit anywhere.

The system grows with you, becoming more intelligent about your specific needs while keeping your information completely portable and under your control.

**Why This Matters**

We're at an inflection point where AI can finally deliver on the vision of an external brain that truly enhances thinking. But only if we're willing to rethink our assumptions about how knowledge systems should work.

Most AI-enhanced note apps are still designed for the old world where humans do the organizing and AI occasionally helps out. Flint flips that: the AI is your thinking partner from day one, and the system is designed to make that partnership as natural and powerful and flexible as possible.

Since all your notes are just markdown files, there's no lock-in. You can work on your notes with Flint, or fire up [vim](https://neovim.io/) or [Obsidian](https://obsidian.md/) or [iA Writer](https://ia.net/writer) or any other local markdown editor you want. You can sync or backup with whatever file syncing service you already use (git, Dropbox, iCloud, Obsidian Sync, etc.).

But unlike other markdown-based systems, Flint is architected from the ground up to be agent-first. Every design decision (from the vault structure to the metadata schemas to the conversation patterns) optimizes for AI collaboration rather than human maintenance.

**Getting Started**

If this sounds interesting, you can try Flint by adding it to your [MCP client](https://github.com/punkpeye/awesome-mcp-clients) of choice. You'll need [Node.js](https://nodejs.org/) installed first:

```json
{
  "mcpServers": {
    "flint-note": {
      "command": "npx",
      "args": ["@flint-note/server@latest"]
    }
  }
}
```

I've also created system prompts to help guide your model's interactions: [system_core.md](https://github.com/disnet/flint-note/blob/main/prompts/system_core.md) for intelligent models like Claude 4 or ChatGPT 4, and [simple_models_detailed.md](https://github.com/disnet/flint-note/blob/main/prompts/simple_models_detailed.md) for simpler or local models.

The project is still early, but if you try it out I'd love to hear what you think. The system is designed to evolve based on how people actually want to interact with their knowledge.

Check out the [GitHub project](https://github.com/disnet/flint-note/) to dive deeper, or just give it a try. The future of knowledge work is agent-first, and Flint is my attempt to build part of that future today.

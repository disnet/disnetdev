---
title:  Building a Personal GTD System in Plain Text with AI Agents
date: 2025-07-02
description:  Building a GTD system using plain text and AI agents through Flint. The key innovation is a "Today" note that acts as a centralized dashboard, automatically syncing with individual todo notes through conversational commands and simple text formatting (using + for priority tasks, checkboxes for completion). This approach replicates GTD apps like Things or OmniFocus while maintaining the flexibility of plain text.
---

I've been experimenting with trying to build a plain-text [GTD](https://en.wikipedia.org/wiki/Getting_Things_Done) system with [Flint](https://github.com/disnet/flint-note/). I started by just creating a *todo* note type with a couple of simple metadata fields (e.g. *status*, *due date*, etc.) with agent instructions to keep things concise and action-oriented.

Creating and updating todos then happens conversationally:

> Me: make a todo to schedule a dentist appointment today
>
> Agent: Done.

Later in the day:

> Me: mark dentist appointment done
>
> Agent: Updated.

My favorite part of this approach is you can then ask the agent "what should I be working on today" and it's generally smart enough to look through all your todos but also other kinds of notes (daily logs, project notes, etc.) and give you a pretty intelligent response.

This is fine but gets awkward to update multiple items at a time. What I wanted was a way of seeing and updating multiple todos at a time while still keeping the benefits of text and agent smarts. So I just asked Flint to make me a special note that it would keep in sync:

> Me: create a todo note that is special called "today", it should:
> - list all the other todo items that should be worked on today
> - format items like `- [ ] todo item`.
> - update agent instructions to update this note when updating other notes
> - when the note has items checked off, synchronize with corresponding note status
> - have a section called "Quick Add New Tasks" to easily add new items
>  - each todo should be in one of three states: now (I want to focus on working on it today), upcoming (ready to be worked on soon), someday (a backlog of stuff to plan out eventually)
>  - the today note should group by status but not show all the someday tasks (just show a count)
>  -  items in the now section should be written like `- [ ] + todo item` and items in the upcoming sections are written like `- [ ] todo item`.
>  - when syncing the today note look for changes to the + to move items from the now state to the upcoming or vice versa

Flint then made a "todo" note that looks like this:

```markdown
# Today - [Current Date]

## NOW (Focus on today) 🎯
- [ ] + Finish quarterly report draft
- [ ] + Review team feedback on project proposal
- [ ] + Schedule dentist appointment
- [ ] + Follow up on client contract (OVERDUE)

## UPCOMING (Ready to work on soon) 📋
- [ ] Plan next week's team meeting (Due: Friday)
- [ ] Update budget spreadsheet (Due: End of month)
- [ ] Research new project management tools

## Quick Add New Tasks
*Add new todo items below - use + for NOW, - for SOMEDAY, no symbol for UPCOMING*
- [ ]
- [ ]
- [ ]
```

Now I can easily check off (e.g. `- [x] + Finish quarterly report draft` ) multiple items and then ask Flint to sync the note and it will update each todo note as completed and refresh the today note.

A day's interaction could look something like this:

**Morning (9:00 AM)**:
```
User opens Today note, sees:
- [ ] + Write project proposal
- [ ] + Call insurance company
- [ ] Review budget numbers (Due: Thursday)

User adds + symbol to "Review budget numbers":
- [ ] + Review budget numbers (Due: Thursday)

System automatically:
- Updates individual todo note workflow_state to "now"
- Moves task to NOW section in Today note
```

**Midday (1:00 PM)**:
```
User checks off completed task in Today note:
- [x] + Write project proposal ✅

System automatically:
- Updates individual todo note status to "completed"
- Adds completion timestamp
- Moves to "Recently Completed" section
```

**Evening (6:00 PM)**:
```
User adds new task to Quick Add section:
- [ ] + Book flight for conference

System automatically:
- Creates new individual todo note: "Book flight for conference"
- Sets workflow_state to "now" (because of + symbol)
- Adds to NOW section in Today note
- Clears the Quick Add entry
```

I think this is pretty cool, you can build an approximation of a full-fledged GTD app like [Things](https://culturedcode.com/things/) or [OmniFocus](https://www.omnigroup.com/omnifocus) in plain text just by writing down a few simple instructions.

Another neat thing is I built this workflow conversationally. My example above defined the *today* note in one instruction but I actually went back and forth with the agent a bunch to narrow down how the today note should best be structured.

This bidirectional sync between plain text and AI agents feels like a fundamental building block. You get the benefits of structured data and automation while keeping the flexibility and ownership of plain text. I suspect this pattern will be useful beyond task management.

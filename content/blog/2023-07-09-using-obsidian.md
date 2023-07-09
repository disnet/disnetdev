---
title: 'Using Obsidian with Readwise, dataview, and periodic notes'
date: 2023-07-09T12:09:01-07:00
---

This is a writeup of how I use [Obsidian](https://obsidian.md/) to organize my personal knowledge base (PKB).

My goal in building out a PKB is to capture and reflect on the most relevant thoughts, ideas, and events in my life. I've tried a bunch of different tools over the years and have found that it is critical to decide on the right level of structure to impose. Too much structure is overwhelming and nothing gets written down. Too little structure leads to sprawling write-once read-never snake nests.

As a disclaimer, PKBs are very, well, _personal_ so this approach might not work for you.

At a high level, the kinds of notes I use are:

- project notes
  - notes to collect links, ideas, and brainstorms about a particular project
- [evergreen](https://notes.andymatuschak.org/Evergreen_notes) notes
  - [chunked concepts](<https://en.wikipedia.org/wiki/Chunking_(psychology)>) that I find particularly relevant (e.g. "Beware of automation bias")
- daily, weekly, and quarterly notes
  - the focus for this post

On any given day I use a _daily note_ to capture whatever comes up. Daily notes serve as a kind of scratchpad to capture random thoughts, drafts of other documents, and any other bits of ephemera.

The only structure I impose in a daily note is for capturing meeting notes where I'll use a heading and link to the related project or person. For example, a 1/1 meeting will have a heading like `# [[Person Name]] 1/1`. The links in the heading to `[[Person Name]]` provide backlinks so that in the future I can quickly see all the topics we've covered.

For a while I tried to get by with just the daily note level of structure but it wasn't enough. It was too easy for something I wrote in a daily note to get lost. I needed a structured way to reflect on a longer timeline than a day.

So, I use the [periodic notes](https://github.com/liamcain/obsidian-periodic-notes/) plugin to create both weekly and quarterly notes.

The _weekly note_ is more structured than a daily note and I use a template to fill in headings that I expand on throughout the week.

The first section is for reflection on how the week went. It uses a retro format I've used for years at work with simple "happy" and "sad" sections.

```
# Reflect

## Happy

- good progress on [[Project X]]
- three day weekend!

## Sad

- [[Twitter]] is at it again
- stalled discussion on [[Project Y]]
    - need to follow up with [[John Smith]]
```

The next section is to track the media I consumed that week. Any movies, shows, or games.

```
# Media Consumed

- [[Silo]]
- [[Factorio]]
```

I don't bother rating or writing down much else since the point is just to remember what and when I encountered various bits of media.

The final section is the Readwise highlights from the week. I use [Readwise Reader](https://readwise.io/read) for almost all my reading so when I make a highlight in Reader it gets automatically synced to Obsidian via the [Readwise plugin](https://github.com/readwiseio/obsidian-readwise). Having highlights synced is great for preservation but realistically I never looked at them again (outside of the Readwise spaced repetition emails). What I wanted was a way to see my recent highlights and have a chance to reflect on them again.

Enter the [dataview](https://github.com/blacksmithgu/obsidian-dataview) plugin:

```
list
from "Readwise"
where
  file.ctime > date("{{date:YYYY-MM-DD}}")
  and file.ctime < date("{{date:YYYY-MM-DD}}") + dur(7 day)
sort file.ctime
```

That query pulls back a list of all the Readwise notes created during the week. At the end of the week I look over them and create any [evergreen notes](https://notes.andymatuschak.org/Evergreen_notes) that might make sense.

The _quarterly notes_ are similar to weekly notes but with a few more sections to encourage me to reflect a bit deeper.

Quarter notes start with a Happy/Sad reflection section just like weekly notes however this isn't meant to be inclusive of all the reflections from every week, just the most salient items from the quarter.

The other sections are aspects of my life that I want to spend time reflecting on and should be fairly self-explanatory:

- Life Events
- Professional Events
- Tech Events
- World Events
- Media Consumed
- Health
- Finances

I try to spend a bit more time on each of these sections than I would in a weekly note, writing full sentences and paragraphs rather than just listing out bullet points.

So the way I use my PKB is essentially jotting down whatever is happening in the moment in a daily note, on the weekend filling out the weekly note and reflecting on highlights from that week, and then at the end of the quarter spending a bit more time reflecting on what happened in a number of different areas over the past few months.

I've struggled over the years trying to find the right cadence and tools to effectively capture and reflect on my "personal knowledge", but this combination of daily, weekly, and quarterly notes has been working pretty well for me so far.

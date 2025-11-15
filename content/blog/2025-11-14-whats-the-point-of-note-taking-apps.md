---
title: What's the point of a note-taking app?
date: 2025-11-14
description: The true purpose of a note-taking app is to facilitate deep learning through three interconnected processes—externalizing ideas, internalizing them into new insights, and resurfacing them over time—and good design should minimize accidental friction while preserving the productive friction that enables genuine understanding.
---

Note-taking apps are a bit weird. Most productivity apps you use every day have an obvious and tangible *output* that you spend all your time working towards. For example, the point of using Photoshop is to make an image. You spend all your time futzing with an image and eventually you get an image to use somewhere.

But the notes in a note-taking app are not really an output you directly use. Some people and systems approach them as if they *were* the goal  but I think this is a mistake and explains why people often have bad experiences with note-taking apps.

So if not notes then what are we actually trying to achieve with a note-taking app? In a single phrase: deep learning (for humans, not the [ML kind](https://en.wikipedia.org/wiki/Deep_learning)). The output we are looking for is the **mental change** that occurs via the process of note-taking that deepens our understanding about the things we care about: a topic of interest, ourselves, the world around us. By spending time taking notes we become smarter; our [crystallized intelligence](https://en.wikipedia.org/wiki/Fluid_and_crystallized_intelligence) grows.

This means that a note-taking app is a cognitive tool, not a document manager. Most apps are built as the latter, which I think is why many people struggle with them.

So if the primary goal of a note-taking app is to deepen our understanding of the things we care about, how do we go about designing for that? Well, first we need to understand how learning works, which I think can be broken down into three main components:

- **Externalizing**: Getting ideas out of your head and into a trusted system
- **Internalizing**: Synthesizing what you've externalized into new insights and understanding
- **Resurfacing**: Reinforcing your understanding through spaced retrieval and repeated engagement over time

These three processes feed on each other. Externalizing produces the raw material to internalize which sparks new ideas to be externalized while resurfacing what you've externalized and synthesized deepens your understanding and sparks new insights. Without all three you can get stuck. If you don't externalize, ideas are stuck in your head. If you only externalize, you're left with a bunch of notes that serve no one. If you don't resurface and review what you've externalized, your understanding is shallow and quickly fades.

Deep learning requires all three components working together in a virtuous cycle.

Where things go wrong for most note-taking systems is too much friction with one or more of these components. Friction during externalization keeps thoughts locked in your head. This might be due to an organization system that is too complex (too many options for creating a new note) or too simple (you don't trust the organizational system to find the note again). If you can't easily find and connect old notes, you miss the synthesis that deepens understanding. If the system doesn't support resurfacing those notes over time, your knowledge fades away. Designing a note-taking app around deep learning means minimizing friction at each of these stages.

While the goal of a good note-taking app should be to minimize the friction of the note-taking process, you can never completely eliminate it because some friction **is** learning. Having an LLM write your notes for example would be counterproductive, you skip the necessary friction that causes learning to occur. Actual learning requires the friction of articulating vague thoughts into precise language, the friction of recognizing connections between notes, the friction of intentional recall that reinforces and strengthens your memory. 

A well-designed note-taking system minimizes *accidental* friction that gets in the way while preserving the productive *essential* friction that results in deep learning. It should feel natural and freeing to quickly capture thoughts as they come, knowing the system will help you find, organize, and revisit them later. It should resurface old insights to strengthen your memory and reveal new connections. It should amplify rather than replace your thinking.

This is the kind of system I'm trying to build with [Flint](https://www.flintnote.com/), which is designed around the idea that note-taking is about deep learning and tries to minimize the accidental friction you encounter by:

- using higher level abstractions in the UI than files and folders
- making linking effortless
- using Arc-style tabs that help you organize notes with your spatial memory
- using a LLM agent to help with organization
- using a LLM agent to resurface old notes to cement your memory

Over the next few weeks, I'll dive deeper into how Flint's design reduces friction and contributes to each of the components that enables that deep learning cycle in practice. But the core idea is simple: a good note-taking app should get out of the way while keeping you engaged with the friction that matters.

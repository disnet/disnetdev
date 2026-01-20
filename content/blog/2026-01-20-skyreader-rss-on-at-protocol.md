---
title: "Skyreader: A RSS Reader on the AT Protocol"
date: 2026-01-20
description: Introducing a RSS reader for the AT Protocol where you feeds and article sharing are portable
---

I've just released [Skyreader](https://skyreader.app/), a RSS reader built on the AT Protocol.

- login with your bluesky account
- share articles like Google Reader but on the AT protocol
- your feeds and shares are stored on your server, not locked in my app

![Screenshot of Skyreader showing a list of RSS feeds](/img/ae204373.png)

## RSS is neat

[You should be using an RSS reader](https://pluralistic.net/2024/10/16/keep-it-really-simple-stupid/).

RSS readers are simple. They manage a list of websites you care about and show you new articles when they're posted. No algorithm deciding what you should see. 

## What makes Skyreader different

My favorite feature from the late, great Google Reader was article sharing. You could share articles to your followers in one click. It was a low-effort way to see what your friends were reading and share what you found interesting.

That feature died with Google Reader. Sure, you can post links in group chats or on social media now, but that collapses too many contexts. A dedicated feed of articles from a friend hits different.

Other RSS readers added social features after Google Reader shut down (like [the old reader](https://www.theoldreader.com/en/)), but they all had the same problem: the social graph was locked into their platform. RSS itself is client-agnostic but article sharing was never part of the protocol, so it stayed locked in closed ecosystems.

The [AT Protocol](https://atproto.com/) fixes this. AT Protocol is the underlying protocol for [Bluesky](https://bsky.app/)  and other decentralized apps. It's a kind of [social filesystem](https://overreacted.io/a-social-filesystem/) that lets apps interoperate.

Skyreader writes the feeds you follow and the shares you make to the AT Protocol, so anyone could build a RSS reader that shows your shares. Your data is yours and the social layer is as portable as the feeds themselves.

I wrote Skyreader to match how I think about feeds. That might not work for you; the sheer number of different RSS readers suggests we all think about this differently. The neat thing about building on the AT protocol is we can all share the underlying data (feeds, shares) and move between readers as we like.

Take a look at Skyreader and let me know what you think. If you find any bugs let me know, but if you want it to work differently just make your own! RSS readers are simple, you can probably get Claude to knock one out in an afternoon (that's how long the initial Skyreader prototype took me). The code for Skyreader is available on [Github](https://github.com/disnet/skyreader) if you want a starting point with the [lexicon](https://github.com/disnet/skyreader/blob/main/docs/LEXICONS.md) being the main thing you'll need to interoperate.

It's time to read like it's 2010!

---
title: Becoming a More Informed Programmer
layout: post.hbs
date: 2010-06-20T00:00:00.000Z
aliases:
  - /blog/2010/06/20/becoming-a-more-informed-programmer
---

So I wrote a little [interactive fiction](http://en.wikipedia.org/wiki/Interactive_fiction) game for class a few months ago and am putting it up here for those who wish to inflict my shoddy game design abilities upon themselves :)

If you're not familiar with IF, they are basically games that just use text (and your imagination) to convey their game world to the player. The classic example is [Zork](http://en.wikipedia.org/wiki/Zork) but over the past few years there's been something of a renaissance in IF with some pretty interesting titles like [Galatea](http://ifdb.tads.org/viewgame?id=urxrv27t7qtu52lb) and [Photopia](http://ifdb.tads.org/viewgame?id=ju778uv5xaswnlpl) (which was seriously the most moving game I've ever played).

A big part of the renaissance is due to the [Inform7](http://inform7.com/) programming language used by most IF games. Inform is a powerful language for creating IF and tries to be as close to a natural language as possible. It's a great example of the power and limitations of the natural approach. 

If you haven't seen it before, here's a (slightly morbid) snippet from my code:

>The Black Knight is a man in the Dark Forest. The Black Knight has a number called current body pieces. The current body pieces of the Black Knight is 4.

I'm not going to bother explaining it since you can probably figure out what it does pretty easily with almost no context. However writing it was a real pain since it's not always obvious what exactly makes a valid sentence. It's the uncanny valley effect, almost like a natural language but with even more arbitrary and hard to learn rules. You keeping thinking you should be able to say thing that aren't allowed. I'm sure that given enough time you become proficient in writing inform code but it's a painful process. 

Anyhow the game I created was a Monty Python themed adventure game. Be warned, it's almost impossible to complete if you haven't watched the movie :)

Grab the [code](/code/grail_search.inform) or get the [zblorb](/code/grail_search.zblorb) to run in your [favorite](http://ccxvii.net/spatterlight/) [z-machine](http://www.inform-fiction.org/zmachine/windows.html) [interpreters](http://www.inform-fiction.org/zmachine/unix.html).

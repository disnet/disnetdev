---
layout: post.hbs
title: Contracts.coffee Works In Node.js!
date: 2011-09-20T00:00:00.000Z
aliases:
  - /blog/2011/09/20/Contracts.coffee-Works-In-Node.js
---

[Contracts.coffee](http://disnetdev.com/contracts.coffee/) now works in node.js! V8 (the JavaScript engine used by node) has recently added support for Proxies which contracts.coffee requires.

You'll need a bleeding-edge version of node to get it running. Try either master (unstable) or [0.5.7](https://github.com/joyent/node/tree/v0.5.7). Build instructions are [here](https://github.com/joyent/node/wiki/Installation).

Proxies are hidden behind a command line flag in V8 so you'll also need to supply `--harmony_proxies` to node when calling the compiler:

    node --harmony_proxies bin/coffee -CL test.coffee

There are almost certainly node-specific bugs in contracts.coffee so don't trust it with anything important yet. You can get started playing though!

Report any bugs you run into on the [issue tracker](https://github.com/disnet/contracts.coffee/issues?sort=created&direction=desc&state=open).

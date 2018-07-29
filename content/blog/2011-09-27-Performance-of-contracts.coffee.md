---
title: Performance of contracts.coffee
layout: post.hbs
date: 2011-09-27T00:00:00.000Z
aliases:
  - /blog/2011/09/27/Performance-of-contracts.coffee
---

I've been meaning to get around to running some performance benchmarks on contracts.coffee, but I recently learned a valuable lesson: let the internet do your work for you! :-)

I woke up this morning to find [@paulmillr](https://twitter.com/#!/paulmillr) had put together a nice performance [benchmark](http://jsperf.com/performance-impact-of-contracts/4) of contracts.coffee.

Check it out for all the gory details but suffice it to say contracts makes things...slow. This is about what I'd expected since in addition to running the actual contract check we must wrap the contracted functions/objects in a Proxy which runs handlers for each function call or property set/get. Lots of stuff is in the way of the running code.

So does the slow performance of contracts make them unusable? Not necessarily. First off, the contracts.coffee compiler can emit JavaScript with contracts completely disabled. So, you can have a "slow" testing/development build with contracts enabled to help track down bugs and a production build with contracts disabled and no slowdown.

In addition, most code is IO bound not CPU bound. So if you want contracts enabled everywhere but still care about performance, be smart about where you apply them. Put them on module boundaries, but don't put them on tight loops for example. 

In sum, contracts are another tool in the software engineer's toolbox that have advantages (bug squashing) and disadvantages (performance slowdowns when enabled). Use them wisely.

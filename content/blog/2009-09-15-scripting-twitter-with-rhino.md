---
wordpress_id: 134
layout: post.hbs
title: Scripting twitter with Rhino
wordpress_url: 'http://disnetdev.com/blog/?p=134'
date: 2009-09-15T00:00:00.000Z
aliases:
  - /blog/2009/09/15/scripting-twitter-with-rhino
---
I just put together a little framework to help writing scripts against twitter streams called cltwitter. It's pretty basic right now but the idea is that the framework handles grabbing the twitter stream you specify and then passing the stream through a set of filters you write.

It's written in Rhino (javascript on top of the JVM) so the filters are in nice simple javascript and you can use any java libraries you might like (there's a few of them out there).

At the moment there are three filters, one that strips everything but urls from the tweet, one that expands any shortened urls in the tweet, and one that posts any tweets with urls to delicious. Since filters can be combined (the output of the one filter goes into the input of the next -- like unix pipes), this allows us to do some neat things like expanding all urls and then posting them to delicious.

If you're interested I have a git repository available on [github](http://github.com/disnet/cltwitter). If you don't want to mess around with git there's a zip file [here](http://github.com/disnet/cltwitter/tree/master/release/cltwitter-0.1.zip) you can use. Just unzip it an do what the README tells you.

Hope you find this useful.

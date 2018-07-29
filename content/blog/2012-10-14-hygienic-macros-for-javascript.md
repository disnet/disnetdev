---
title: Hygienic Macros for JavaScript
layout: post.hbs
date: 2012-10-14T00:00:00.000Z
aliases:
  - /blog/2012/10/14/hygienic-macros-for-javascript
---

Been slow to embloggen this (start of the quarter etc.) but my summer intern project was released a little while ago at [sweetjs.org](http://sweetjs.org). Sweet.js is a [hygienic macro](http://en.wikipedia.org/wiki/Hygienic_macro) compiler for JavaScript that takes JavaScript written with macros and produces normal JavaScript you can run in your browser or on node. It's an experiment to see if macros can work well for JavaScript.

Macros allow you to extend the syntax of JavaScript by writing macro definitions that perform syntax transformations, thus allowing you to do cool things like add sweet syntax for [var destructuring](https://gist.github.com/3881008) or even haskell-like [do notation](https://gist.github.com/3831514).

The idea is to provide a middle ground between no syntax extension and having to build an entire compile-to-js language like CoffeeScript, which can't compose with other syntax extensions.

I talk a bit about the motivation and design in this [presentation](https://air.mozilla.org/sweetjs/) I gave at the end of my internship.

The language that most directly inspires sweet.js is, of course, scheme. I'm not really much of a schemer myself but have always admired the fancy work going on in that world and macros are pretty fancy. At the start of the summer I was still somewhat of a macro newbie but being at Mozilla was fantastic since I was able to draw on and learn from two well-versed scheme macrologists [Dave Herman](https://twitter.com/littlecalculist) (who's PhD thesis was on macros) and [Paul Stansifer](https://twitter.com/PaulStansifer) (who has been developing the [Rust](http://www.rust-lang.org/) macro system).

Sweet.js is still in very early stages, lots of bugs and missing features, but I think it shows some real promise. Let me know what you think!

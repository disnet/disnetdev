---
title: Announcing Sweet.js 1.0
layout: post.hbs
xpost:
  link: https://medium.com/@disnet/announcing-sweet-js-1-0-e7f4f3e15594
  name: medium
---

Sweet.js, the hygienic macro system for JavaScript, just got a shiny new release: the magical 1.0! 🎉

If you’ve been following the development of Sweet for a while you might have noticed a dearth of activity. Part of that was life (I recently finished grad school and started a new job) but part of that seeming lack of activity was actually a giant rewrite in progress.

Yes I know, [that’s a thing you should never do](http://www.joelonsoftware.com/articles/fog0000000069.html).

But I swear it made sense this time. The collection of bad decisions I made early in development had finally made forward progress all but impossible. And so, Sweet has been completely rewritten.

So what’s good about the rewrite? Lot’s of stuff, but two I want to call out specifically here.

First, a proper parser is now integrated in the expansion pipeline. Previously, Sweet had a half-baked pseudo-parser that kinda-sorta built up an AST during expansion and then immediately flattened it back to tokens to let our crazy fork of [esprima](http://esprima.org/) build up a proper AST before doing codegen.

Yeah, totes reasonable.

This insane pipeline had tons of bugs especially related to proper ES2015 support.

Now we have a proper parser modeled after the [Shift Parser](http://shift-ast.org/parser.html) and producing a [Shift AST](https://github.com/shapesecurity/shift-spec) with Babel as an optional backend for great ES2015 support everywhere. It’s amazing.

Second, Sweet now has much more reasonable macro binding forms. Previously, you could define a macro in two ways, the recursive and non-recursive declaration forms:

```js
// recursive form
macro foo { /* ... */ }

// non-recursive form
let foo = macro { /* ... */ }
```

The recursive form binds the macro name inside the macro definition while the non-recursive form does not. This was gross and confusing because standard let in ES2015 does not work like this at all. Now, Sweet uses `syntax` and `syntaxrec`:

```js
// non-recursive form
syntax foo = function (ctx) { /* ... */ }
// recursive form
syntaxrec foo = function (ctx) { /* ... */ }
```

These are more symmetric and fit in better as a compiletime extension of the `var`/`let`/`const` binding forms of ES2015.

While all these changes are great, there are a few items from the pre-1.0 days that have not been re-implemented yet. Custom operators and infix macros in particular are not currently supported. However, the foundation provided by the rewrite will make adding these features back pretty straightforward so expect them to be available soon.

So should you dive in with the new Sweet? Well, to be honest it really depends on how risk averse you are. Since so much has changed with the rewrite there are bound to be bugs we still need to shake out. Maybe don’t go running Sweet over your production code just yet.

But if you’d like to help out by putting Sweet through its paces we would love to have you! The best way to get started is to familiarize yourself with all the new syntax by reading the [tutorial](http://sweetjs.org/doc/1.0/tutorial.html). If you’ve got questions or need help, head on over to [gitter](https://gitter.im/mozilla/sweet.js) or #sweet.js on irc.mozilla.org.

Have fun sweetening your code!

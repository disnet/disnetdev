---
title: Hygiene in sweetjs
date: 2013-09-27
aliases:
  - /blog/2013/09/27/hygiene-in-sweet.js
---

The most important feature of [sweet.js](http://sweetjs.org) is hygiene. Hygiene prevents variables names inside of macros from clashing with variables in the surrounding code. It's what gives macros the power to actually be syntactic abstractions by hiding implementation details and allowing you to use a hygienic macro *anywhere* in your code.

For hygiene to work sweet.js must rename variables. Recently several people have asked me why sweet.js renames **all** the variables. Wouldn't it be better and cleaner to only rename the variables that macros introduce?

The tl;dr is "because hygiene" but let's unpack that a little.

## Hygiene Part 1 (Binding) ##

The part of hygiene most people intuitively grok is keeping track of the variable *bindings* that a macro introduces. For example, the swap macro creates a `tmp` variable that should only be bound inside of the macro:

```javascript
macro swap {
  rule { ($a, $b) } => {
    var tmp = $a;
    $a = $b;
    $b = tmp;
  }
}

var tmp = 10;
var b = 20;
swap (tmp, b)
```

Hygiene keeps the two `tmp` bindings distinct by renaming them both:

```js
var tmp$1 = 10;
var b$2 = 20;

var tmp$3 = tmp$1;
tmp$1 = b$2;
b$2 = tmp$3;
```

This is the point where most people say "why bother renaming the variables outside of the macro"? Can't you just rename the bindings created by the macro? Wouldn't it be cleaner for the expansion to just be something like:

```js
var tmp = 10;
var b = 20;

var tmp$1 = tmp;
tmp = b;
b = tmp$1;
```

## Hygiene Part 2 (Reference) ##

The complication comes in with variable *references*. The body of a macro can contain references to bindings declared outside of the macro and those references must be consistent no matter the context in which the macro is invoked.

Some code to clarify. Let's say you have a macro that uses a random number function:

```js
var random = function(seed) { /* ... */ }
let m = macro {
    rule {()} => {
        var n = random(42);
        // ...
    }
}
```

This macro needs to refer to `random` in any context that it gets invoked. But its context could have a different binding to `random`!

```js
function foo() {
    var random = 42;
    m ()
}
```

Hygiene needs to keep the two `random` bindings different. So sweet.js will expand this into something like:

```js
var random$1 = function(seed$4) { /* ... */ }
function foo() {
    var random$2 = 42;
    var n$3 = random$1(42);
    // ...
}
```

Note that there is no way for hygiene to do this if it only renamed identifiers inside of macros since both `random` bindings were declared outside of the macro. Hygiene is necessarily a whole program transformation.

(ps if this sort of feels like a closure you're on to something: one of the early techniques that led to modern hygiene algorithms was called [syntactic closures](ftp://publications.ai.mit.edu/ai-publications/pdf/AIM-1049.pdf))

Strictly speaking the hygiene algorithm is still conservative. Variable bindings declared outside of a macro that are never referenced by a macro don't really need to be renamed. However, modifying the hygiene algorithm to only rename *exactly* what needs to be renamed seems pretty difficult (especially to do so efficiently). If anyone knows techniques for this definitely let me know (or even better submit a pull request).

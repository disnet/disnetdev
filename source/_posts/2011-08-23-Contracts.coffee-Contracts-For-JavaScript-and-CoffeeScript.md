---
title: Contracts.coffee - Contracts for JavaScript and CoffeeScript
layout: post.hbs
---

This summer I've been working at Mozilla looking at bringing the
awesomeness that is
[contracts](http://en.wikipedia.org/wiki/Design_by_contract) to
JavaScript. If you aren't familiar with contracts, think of them as
super powerful asserts.

Why contracts? Because they allow us to build
better software! They allow us to express invariants (things that will
always be true about our code) in JavaScript about JavaScript and
check at runtime that these invariants hold. And when things break
(like they always do) we get a precise error message pin-pointing the
part of our code the broke the contract.

Contracts in programming languages were first popularized in the
language Eiffel. In fact, the people behind Eiffel promoted an entire
design methodology centered around contracts (called, appropriately
enough, Design by Contract&trade;) that encouraged thinking about invariants and
interfaces between software component boundaries.

So if contracts are so great why don't we see them in JavaScript?
Well, for the most part, the languages that have supported contracts in
the past all share an important characteristic...no lambdas. Or more
specifically in Java and Eiffel functions are not first class (you
can't pass a function in a method call). Traditional contract systems
fall down in a higher order setting (how do you check a function
argument?).

Until, that is, the scheme people (err...I mean
[Racket](http://racket-lang.org/) people) figured out
[what to do](http://www.eecs.northwestern.edu/~robby/pubs/papers/ho-contracts-techreport.pdf)
a few years ago. Now, Racket has a very nice contract system.

But we haven't seen anything comparable to Racket's contracts in
JavaScript so far. So this summer I looked into taking the work that
was done in Racket and trying to fit it into JavaScript. As you
probably know, JavaScript has a bit of scheme in it (just confused by
some C/Java syntax).

The result of this exploration is a JavaScript libarary called
[contracts.js](https://github.com/disnet/contracts.js) and
a fork of the
[CoffeeScript](http://jashkenas.github.com/coffee-script/) compiler
(which translates CoffeeScript directly to JavaScript) called
[contracts.coffee](http://disnetdev.com/contracts.coffee/).
The JavaScript library gives us the ability to apply contracts to our
code and the CoffeeScript extension gives us some really pretty
syntax.

So what does it all look like?

Here's some CoffeeScript code with contracts:

```
id :: (Num) -> Num
id = (x) -> x
```

And the JavaScript translation:

```js
var id = guard(
     fun(Num, Num),
     function(x) { return x; })
```

This code takes the identity function and wraps it in a
function contract. Now every time `id` is called the contract library
first checks that the argument being passed in satisfies the `Num`
contract (which checks the the value is a `number`) and that the
result of `id` also satisfies `Num`. If any of these checks fail, an
error is thrown. For example:

```js
id("string")
```

<pre style='color: red'>
Error: Contract violation: expected &lt;Number&gt;, actual: "string"
Value guarded in: id_module.js:42
  -- blame is on: client_code.js:104
Parent contracts: (Number) -> Number
</pre>

Pretty nifty right?

We can also have contracts on objects:

```
person ::
    name: Str
    age: Num
person =
    name: "Bertrand Meyer"
    age: 42
```

And arrays:

```
loc :: [...Num]
loc = [99332, 23452, 123, 2, 5000]
```

And various combinations thereof:

```
average :: ({name: Str, age: Num}, [...Num]) -> Str
average = (person, loc) ->
    sum = loc.reduce (s1, s2) -> s1 + s2
    "#{person.name} wrote on average
    #{sum / loc.length} lines of code."
```

You can find documentation, install instructions, and a bunch more
examples for contracts.coffee at its
[website](http://disnetdev.com/contracts.coffee/). Docs for the
underlying contracts.js library is coming soon but for now just check
out the [github](https://github.com/disnet/contracts.js) page.

This is still very much a work in progress and I would love
feedback. Let me know if you find it useful!

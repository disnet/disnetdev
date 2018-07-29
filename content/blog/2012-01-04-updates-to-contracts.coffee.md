---
layout: post.hbs
title: Updates to contracts.coffee
date: 2012-01-04T00:00:00.000Z
aliases:
  - /blog/2012/01/04/updates-to-contracts.coffee
---

An update to contracts.coffee (0.2.0) is now up on npm. I've fixed up
a few bugs since the intial release and it's now based on the
latest CoffeeScript (1.2.0)
but the big update is a rework of how modules are handled.

Before this update we were handling module blame tracking by forcing the
programmer to call `.use()` before a contracted value could be used. This
did the work of figuring out who the server and client module.


This was an awkward way to enforce a module pattern since not only do you have to
write more code but it also means you have to know which values in a
module have a contract. This breaks abstraction which is bad.

So with this latest update we're completely dropping `.use()`. How we keep tack
of the modules without it depends on whether you are using node.js or a browser.

If you are using node.js then the wiring is handled automatically by wrapping
the `require` function and `exports` object. If you put a contract on an export
value the correct server and client module names are recorded.

    # file Math.coffee
    exports.square :: (Num) -> Pos
    exports.square = (x) -> x * x

    #####

    # file Main.coffee
    {square} = require './Math'

    # vioation blaming Main.coffee
    square "a string"

You can also put a contract on a value that isn't on the `exports` object (for use inside
the module), but the module name might get confusing since it's just the file name with
"(value)" or "(caller)" appened. I will look at adding something like Racket's
[nested boundaries](http://docs.racket-lang.org/reference/Attaching_Contracts_to_Values.html#%28part._.Nested_.Contract_.Boundaries%29)
to clean this up at some point.

If you're using the browser, things are a bit more complicated. Since the browser environment
doesn't currently have a standard way to do modules, we're stuck doing the wiring by hand.
Details are in the [documentation](http://disnetdev.com/contracts.coffee/) but the basic idea is that
the library now provides `Contracts.exports` and `Contracts.use` which are used to construct
contract aware modules.

`Contracts.exports` creates and names an exports object:

    # Math.coffee

    # create and name the exports object
    exports = Contracts.exports "Math"

    exports.square :: (Num) -> Pos
    exports.square = (x) -> x * x

    # put the exports object on the global object
    # for other modules to see and use
    window.Math = exports

And `Contracts.use` pulls in a module and names the user of the module.

    # Main.coffee
    {square} = Contracts.use window.Math, "Main"

    square 4          # 16
    square "a string" # Contract Violation...blaming Main

I'll look at ways to automate this more in future updates.

---
title: How to read macros
layout: post.hbs
date: 2012-12-20T00:00:00.000Z
aliases:
  - /blog/2012/12/20/how-to-read-macros
---

In my last [post][sweetintro] I gave a little overview of [sweet.js][sweetjs] the hygienic macro system I built over the summer. Today I want to write a little bit about what makes sweet.js possible and why we haven't really seen a macro system for JavaScript before now. I gave hints at some of this in my intern [talk][talk] but now we can finally do a deep dive!

## Basics

First, let's take a look at compilers 101:

<img src="/static/images/parser_pipeline.png" alt="Parser Pipeline" width="100%" height="109px"/>

The traditional way you build a compiler front end is to first write a lexer and a parser. Code (a string) is fed to the lexer which produces an array of tokens which gets fed to the parser which produces an Abstract Syntax Tree (AST).

For example,

```js
if (foo > bar) {
    alert("w00t!");
}
```

gets lexed into something like:

```js
["if", "(", "foo", ">", "bar", ")", "{" ...]
```

The lexer is basically responsible for throwing away unnecessary whitespace and grouping identifiers, strings, and numbers into discrete chunks (ie tokens). The array of tokens is then parsed into an AST that might look something like this:

```js
// output of esprima
{
    "type": "Program",
    "body": [
        {
            "type": "IfStatement",
            "test": {
                "type": "BinaryExpression",
                "operator": ">",
                "left": {
                    "type": "Identifier",
                    "name": "foo"
                },
                "right": {
                    "type": "Identifier",
                    "name": "bar"
                }
            },
            "consequent": {
                "type": "BlockStatement",
                "body": [{
                        "type": "ExpressionStatement",
                        "expression": {
                            "type": "CallExpression",
                            "callee": {
                                "type": "Identifier",
                                "name": "alert"
                            },
                            "arguments": [{
                                    "type": "Literal",
                                    "value": "w00t!",
                                    "raw": "\"w00t!\""
                                }]
                        }
                    }]
            },
            "alternate": null
        }
    ]
}
```

The AST gives you the structure necessary to do code optimization/generation etc.

So where can we fit macros into this picture? Which representation is best for macros to do their stuff?

Well, by the time we get to an AST it's too late since parsers only understand a fixed grammar (well, technically there is research on [adaptive/extensible grammars][adapt] but that way leads to madness!). Obviously the raw code as a string is too unstructured for macros so how about the array of tokens produced by the lexer?


Tokens are fine for cpp `#define` style macros but we want moar power! And, as it turns out, just normal tokens aren't going to cut it for us. Consider this simple macro that provides a concise way to define functions:

```js
macro def {
    case $name $params $body => {
        function $name $params $body
    }
}
def add(a, b) {
    return a + b;
}
```

which should be expanded into:

```js
function add(a, b) {
    return a + b;
}
```

Critically, note that the macro needs to match `$params` with `(a, b)` and `$body` with `{ return a + b; }`. However, we don't have enough structure to do this with just the token array `["def", "add", "(", "a", ",", "b", ...]`: we need to match the delimiters (`()`, `{}`, and `[]`) first!

If you remember your compilers class (or went to wikipedia), delimiter matching is what separates [context-free][ctx] languages (what parsers recognize) from [regular][reg] languages (what lexers recognize).

This is one of the reasons why macros are big in the lisp family of languages (scheme, racket, clojure, etc.). S-expressions (with (all (those (parentheses)))) are already fully delimited so it becomes almost trivial to do delimiter matching. Some people say this is due to [homoiconicity][homo] but as Dave Herman [pointed out][icon], homoiconicity isn't really the point. It's not that the lisp family is homoiconic but rather that the nature of s-expressions makes it easy to implement `read` which is necessary for macros.

`read` is the crucial function that gives a little bit more structure to the array of tokens by matching up all those delimiters. Now instead of just a flat array of tokens we are going to get a *read tree:*

```js
["def", "add", {
    type: "()",
    innerTokens: ["a", ",", "b"]
    }, {
    type: "{}",
    innerTokens: ["return", "a", "+", "b"]
}]
```

Note this doesn't have all the structure of a full AST, it just knows about tokens and delimiters not expressions and statements. So now our `def` macro pattern variables will match up like so:

```js
$params -> {
    type: "()",
    innerTokens: ["a", ",", "b"]
}
$body -> {
    type: "{}",
    innerTokens: ["return", "a", "+", "b"]
}
```

Great! Now our pipeline looks something like:

<img src="/static/images/pipeline_plus_read.png" alt="Pipeline With Read" width="100%" height="87px"/>

## The Devil in the Details

Ok, so all well and good but then why haven't we seen people implement `read` and build a macro system for JavaScript before now?

It turns out that there's this really annoying token (for potential macro implementers) in JavaScript: `/`.

Here's the problem, depending on context `/` can mean two different things: the divide operator or the beginning of a regular expression literal.

```js
10 / 2              // 5
/foo/.test("foo")   // true
```

(Well technically I guess `/` can also mean the start of a comment but this is always easy to figure out (since `//` **always** means line comment))

So how do we disambiguate between divide and regex? It turns out that the way a normal parser (like [esprima][esprima] for example) does it is by running the lexer and parser together and resolving the ambiguity via the current **parsing** context. In other words, as the parser is working through each production, it calls out to the lexer with a flag saying what context it is in. Depending on that context the lexer will either lex `/` as a divide token or as a regular expression literal.

But, we can't use the parsing context in `read` because we don't have any parsing context yet!

So, we somehow need to separate the lexer/reader from the parser.

Now you might think we could get away with just leaving `/` as an ambiguous token (say a `divOrRegex` token for example) to be handled by the parser once all the macros have been expanded away but consider this code fragment we might want to `read`:

```js
... { /foo}bar/ ...
// as a token array this would be
// [... "{", "/", "foo", "}", "bar", "/", ...]
```

Remember that the entire point of `read` is to do delimiter matching, so should we match the `}` with the opening `{` or as part of a regular expression literal (remember `/}/` is a valid regex that matches a single `}`)? It completely depends on our interpretation of `/`!

Therefore, in our lexer/reader we **must** disambiguate the meaning of `/` without the help of the parser. So how do we do that?

This is the hard technical problem that [Paul Stansifer][paul] (he also designed the [Rust][rust] macro system) solved this summer, unlocking the power of JavaScript macros for us all!

The basic idea is when you see a `/` as you are reading, just look back a couple of tokens and a small fixed set of tokens will determine unambiguously if `/` should be a divide or the start of a regex literal. To figure out exactly how far back and which tokens to look for requires working through all the different cases in the JavaScript grammar which is hard but done!

A snippet of this algorithm goes something like:

    if tok is /
        if tok-1 is )
            look back to matching (
            if identifier before ( in "if" "while"
                                      "for" "with"
                tok is start of regex literal
            else
                tok is divide
        ...

For example, if we have:

```js
if (foo + 24 > bar) /baz/.test("foo")
```

When we see the `/` we note that the previous token was `)` so we find its matching `(` and note that the token before that was `if` so `/` must be the beginning of a regular expression.

What's really cool here is that when we need to disambiguate `/` we've already been reading up to that point so `(foo + 24 > bar)` is a single token (the `()` token with inner tokens `foo`, `+`, `24`, `>`, and `bar`) and checking the token before the parens is literally as simple as `tokens[idx-2] === "if"`. By creating the read tree as we go along we don't need to carry lookbehind state in a complicated way; in fact, in the worst case, we only have to look back 5 tokens.

If you want to read more about how this works, I've got the entire algorithm pseudo-coded up [here][readdesign] and the actual JavaScript implementation in these relatively short [two][read1] [functions][read2].

[sweetjs]: http://sweetjs.org/ "Sweet.js"
[sweetintro]: http://disnetdev.com/blog/2012/10/14/hygienic-macros-for-javascript/ "Hygienic Macros for JavaScript"
[icon]: http://calculist.org/blog/2012/04/17/homoiconicity-isnt-the-point "Homoiconicity not the point"
[homo]: http://en.wikipedia.org/wiki/Homoiconicity "Homoiconicity"
[adapt]: http://en.wikipedia.org/wiki/Adaptive_grammar "Adaptive Grammar"
[talk]: https://air.mozilla.org/sweetjs/ "Sweet.js Talk"
[esprima]: http://esprima.org/ "Esprima"
[paul]: https://twitter.com/PaulStansifer "Paul Stansifer"
[rust]: http://www.rust-lang.org/ "Rust"
[read1]: https://github.com/mozilla/sweet.js/blob/master/src/parser.js#L3713 "Github"
[read2]: https://github.com/mozilla/sweet.js/blob/master/src/parser.js#L3631 "Github"
[readdesign]: https://github.com/mozilla/sweet.js/wiki/design "Read Design Doc"
[ctx]: http://en.wikipedia.org/wiki/Context-free_language "Context-Free Language"
[reg]: http://en.wikipedia.org/wiki/Regular_language "Regular Language"

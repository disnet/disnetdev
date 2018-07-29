---
layout: paper.hbs
subtitle: Game Semantics for Type Soundness
title: Game Semantics for Type Soundness
date: 2015-01-01
published_year: 2015
published_how:
  - name: LICS 2015
    files:
      - name: PDF
        link: /static/papers/15lics.pdf
authors:
  - name: Tim Disney
    link: http://disnetdev.com/
  - name: Cormac Flanagan
    link: http://users.soe.ucsc.edu/~cormac/
---

The key idea of game semantics is that a term can interact with its enclosing context via various events, such as function calls and returns. A trace is a sequence of such interaction events. The meaning of the term is then naturally represented by the set of all event traces that the term can generate. Game semantics allows us to define the meaning of both expressions and types in the same domain which enables an interesting alternative to subject reduction for proving type soundness.

This paper uses game semantics to define the meaning of and verify type soundness for a sequence of programming languages, starting with a functional sequential language (the call-by-value simply-typed lambda calculus), and then extending that proof with subtyping, side effects, control effects, and concurrency. These proofs are reasonably short and fairly semantic in structure, focusing on the relationship between the meanings of each term and its corresponding type. In particular, we show that the typing and subtyping relations are both conservative approximations of alternating trace containment.

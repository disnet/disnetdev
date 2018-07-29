---
layout: paper.hbs
subtitle: Virtual Values for Language Extension
title: Virtual Values for Language Extension
date: 2011-01-01
published_year: 2011
published_how:
  - name: OOPSLA (2011)
    files:
      - name: PDF
        link: /static/papers/oopsla054-austin.pdf
      - name: Slides
        link: /static/talks/virtual_values.pdf
      - name: Lightning talk
        link: /static/talks/virtual_values_lightning.pdf
authors:
  - name: Thomas H. Austin
    link: http://users.soe.ucsc.edu/~taustin/
  - name: Tim Disney
    link: http://disnetdev.com/
  - name: Cormac Flanagan
    link: http://users.soe.ucsc.edu/~cormac/
---

This paper focuses on _extensibility_, the ability of a
programmer using a particular language to extend the
expressiveness of that language.
This paper explores how to provide an interesting notion of
extensibility by virtualizing the interface between code and data.
A _virtual value_ is a special
value that supports behavioral intercession.  
When a primitive operation is applied to a virtual value,
it invokes a _trap_ on that virtual value.
A virtual value contains multiple traps, each of which is
a user-defined function that describes how that operation should
behave on that value.

This paper formalizes the semantics of virtual values, and shows how they
enable the definition of a variety of language extensions, including
additional numeric types; delayed evaluation; taint tracking; contracts; revokable membranes; and units of measure.
We report on our experience implementing virtual values for Javascript within an extension for the Firefox browser.

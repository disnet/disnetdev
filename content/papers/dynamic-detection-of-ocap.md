---
layout: paper.hbs
subtitle: Dynamic Detection of Object Capability Violations Through Model Checking
title: Dynamic Detection of Object Capability Violations Through Model Checking
date: 2014-01-01
published_year: 2014
published_how:
  - name: DLS 2014
    files:
      - name: PDF
        link: /static/papers/dls14b.pdf
authors:
  - name: Dustin Rhodes
    link: http://users.soe.ucsc.edu/~dustin/doku.php
  - name: Tim Disney
    link: http://disnetdev.com/
  - name: Cormac Flanagan
    link: http://users.soe.ucsc.edu/~cormac/
---

In this paper we present a new tool called DOCaT (Dynamic Object
Capability Tracer), a model checker for JavaScript that detects
capability leaks in an object capability system. DOCaT includes an
editor that highlights the sections of code that can be potentially
transferred to untrusted third-party code along with a trace showing
how the code could be leaked in an actual execution. This code
highlighting provides a simple way of visualizing the references
untrusted code potentially has access to and helps programmers to
discover if their code is leaking more capabilities then required.

DOCaT is implemented using a combination of source code
rewriting (using Sweet.js, a JavaScript macro system), dynamic behavioral
intercession (Proxies, introduced in ES6, the most recent
version of JavaScript), and model checking. Together these methods
are able to locate common ways for untrusted code to elevate
its authority.

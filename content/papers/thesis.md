---
layout: paper.hbs
subtitle: Hygienic Macros for JavaScript
title: Hygienic Macros for JavaScript
published_year: 2015
published_how:
  - name: Thesis 2015
    files:
      - name: PDF
        link: /static/papers/thesis.pdf
authors:
  - name: Tim Disney
    link: http://disnetdev.com/
---

Languages like Lisp, Scheme, and Racket have shown that powerful and expressive macro systems can give programmers the ability to grow their own language. Unfortunately, in languages with syntax like JavaScript, macros have had less success, due in part to the difficulty of integrating macro expansion and complex grammars.

This dissertation describes sweet.js, a hygienic macro system for JavaScript that fixes long standing challenges in lexing JavaScript and provides expressive pattern matching that allows macros to manipulate the complex grammar of JavaScript. With sweet.js programmers can experiment with syntax extensions for future versions of JavaScript and craft domain specific languages.

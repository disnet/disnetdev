---
layout: paper.hbs
subtitle: Types for Precise Thread Interference
title: Types for Precise Thread Interference
published_year: 2011
published_how:
  - name: FOOL (2011)
    files:
      - name: PDF
        link: /static/papers/fool11.pdf
  - name: UCSC Tech Report (2011)
    files:
      - name: PDF
        link: https://www.soe.ucsc.edu/research/technical-reports/ucsc-soe-11-22/download
authors:
  - name: Jaeheon Yi
    link: http://ucsc.jaeheon.info/
  - name: Tim Disney
    link: http://disnetdev.com/
  - name: Stephen N. Freund
    link: http://www.cs.williams.edu/~freund/
  - name: Cormac Flanagan
    link: http://users.soe.ucsc.edu/~cormac/
---

The potential for unexpected interference between threads makes multithreaded programming
notoriously difficult.
Programmers use a variety of synchronization idioms
such as locks and barriers to restrict where interference may actually occur.
Unfortunately, the resulting _actual_ interference points
are typically never documented and must be manually reconstructed as the first step in
any subsequent programming task (code review, refactoring, etc).

This paper proposes explicitly documenting actual interference points
in the program source code, and it presents a type and effect system for
verifying the correctness of these interference specifications.

Experimental results on a variety of Java benchmarks show that this
approach provides a significant improvement over prior systems based
on method-level atomicity specifications. In particular, it reduces
the number of interference points one must consider from several
hundred points per thousand lines of code to roughly 13 per thousand
lines of code. Explicit interference points also serve to highlight all known
concurrency defects in these benchmarks.

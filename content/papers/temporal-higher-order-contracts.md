---
layout: paper.hbs
subtitle: Temporal Higher-Order Contracts
title: Temporal Higher-Order Contracts
published_year: 2011
published_how:
  - name: ICFP (2011)
    files:
      - name: PDF
        link: /static/papers/icfp046-disney.pdf
authors:
  - name: Tim Disney
    link: http://disnetdev.com/
  - name: Cormac Flanagan
    link: http://users.soe.ucsc.edu/~cormac/
  - name: Jay McCarthy
    link: http://faculty.cs.byu.edu/~jay/home/
---

Behavioral contracts are embraced by software engineers
because they document module interfaces, detect interface violations,
and help identify faulty modules (packages, classes, functions, etc).
This paper extends prior higher-order contract systems
to also express and enforce temporal properties,
which are common in software systems with imperative state,
but which are mostly left implicit or are at best informally specified.
The paper presents both a programmatic contract API
as well as a temporal contract language,
and reports on experience and performance results from implementing  
these contracts in Racket.

Our development formalizes module behavior as a trace of events such as function calls and returns.
Our contract system provides both non-interference
(where contracts cannot influence correct executions)
and also a notion of completeness
(where contracts can enforce any decidable, prefix-closed predicate on event traces).

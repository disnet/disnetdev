---
title: "Announcing ParserLang"
layout: post.hbs
date: 2019-06-30T13:40:19-07:00
---

I'm excited to announce a new project I've been working on called [ParserLang](https://github.com/disnet/parser-lang)!

🎉🎉🎉

ParserLang is a parser combinator library for JavaScript with declarative superpowers. In addition to defining parsers in JavaScript, ParserLang allows you to use declarative syntax via template literals:

```javascript
import { lang } from "parser-lang";

let { calc } = lang`
  num = /[0-9]+/ > ${ch => parseInt(ch, 10)};

  addExpr = num '+' multExpr > ${([left, op, right]) => left + right}
          | num ;

  multExpr = addExpr '*' multExpr > ${([left, op, right]) => left * right}
           | addExpr ;
  
  calc = multExpr ;
`;

calc.tryParse("1+1*2");
// 3
```

A thing that has surprised me about JavaScript in the post-ES2015 era is how few projects have made use of tagged template literals even though they are incredibly powerful. This is my attempt to rectify that situation.

More details in the [documentation](https://github.com/disnet/parser-lang#documentation).

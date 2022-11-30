---
layout: post.hbs
title: Visualizing JavaScript
stylesheets:
  - /code/vis.css
scripts:
  - /code/jit.js
  - /code/jquery-1.4.2.js
  - /code/jquery-ui-1.8.1.custom.min.js
  - /code/jsvis.js
date: 2010-12-17T00:00:00.000Z
aliases:
  - /blog/2010/12/17/Visualizing-JavaScript
---

<script type="text/javascript">
var VIS = undefined;
$(document).ready(function() {
  $("#btnHere").click(function() {
    if(VIS === undefined) {
      VIS = new JSVis();
      VIS.init();
    }
    else {
      $("#infovis").css("display", "block");
    }
  });
});
</script>

If you've ever written much code you're probably familiar with
holding mental models of a program in your head. Since our heads are
somewhat limited you've probably also used some sort of aid to help
remember, think and communicate about that model. This could be simple
and low tech like scribbling down boxes and arrows on a whiteboard or
complicated like UML and Visio.

But what if you don't have the model, either in your head or on paper?
What happens when you come to a new codebase where the experts who
undertand it are unavailable? Or perhaps the codebase is yours but
you've forgotten how it all works (this happens to me all the time :)?

One way to solve this problem is to try and extract the program model
automatically and use some kind of visualization to help you regain
(or gain) your mental model.

There are a few tools out there that do this for static languages like
[SolidSX](http://www.solidsourceit.com/products/SolidSX-source-code-dependency-analysis.html)
for Java and C# which maps code relationships using a ring with
lines connecting classes that depend on each other.

<div style="text-align: center">
<img alt="SolidSX"
src="http://www.solidsourceit.com/img/SolidSX-XNA-example-small.jpg"
/>
</div>

There is also a haskell
[example](http://donsbot.wordpress.com/2009/03/16/visualising-the-haskell-universe/)
of visualizing the types from all the packages on Hackage.

![Hackage Universe](https://donsbot.files.wordpress.com/2009/03/haskell_universe.jpg?w=600&h=300)

Unfortunately as far as I know there's not much help for
dynamic languages like JavaScript. The best us JS coders have for
visualization is something like the Firebug DOM exploration
window.

<img width="600" alt="firebug DOM window"
src="https://getfirebug.com/perch/resources/dom.gif" />

Useful and great in a pinch but kinda boring and hard to get a
sense of the relationships between objects.

So I decided to attempt to remedy the situation a little. Last spring I
took a visualization class and did a little JavaScript
project called JSVis.

JSVis walks the global object graph in JavaScript (starting with
"window") and produces a nice node and link visualization that that
tries to show the relationships between objects. Nodes represent
objects and links show "contains" relationships. The different node
colors show the value's type (strings, numbers, objects).

<img alg="jsvis" src="/static/images/jsvis_yahoo.png" />

The easiest way to understand what it does is to try it out. So to
pull up an interactive visualization of the JavaScript code running on
this very page click <a id="btnHere" href="#">here</a>. Note that it
probably works best if you're using Firefox since some default object
filtering is currently Firefox specific.

More details on the design and rational can be found in the
[report](/papers/jsvis_report.pdf) if you're interested.

You can also find all the code over at the [github project
page](https://github.com/disnet/jsvis).

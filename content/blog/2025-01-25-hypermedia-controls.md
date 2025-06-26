---
tags:
  - posts
layout: layouts/post.njk
date: 2025-01-25
---

[Hypermedia Controls: From Feral to Formal](https://dl.acm.org/doi/pdf/10.1145/3648188.3675127). An interesting paper that tries to locate and formalize a set of core primitives in hypermedia systems as expressed in [HTMX](https://htmx.org/). It identifies a "hypermedia control" as consisting of four mechanisms: (1) an element that (2) responds to an event trigger by (3) sending a network request and (4) placing the response in at some position in the viewport. By enhancing a hypermedia system with primitives that allow you to manipulate each of those mechanisms you can declaratively extend the system with your own hypermedia controls.

An example they give:

```html
<button hx-trigger="click" hx-post="/clicked" hx-target="#output">
  Issue a request
</button>
<output id="output"> </output>
```

When the user clicks on the button the system will issue a network request to `/clicked` and place the response in the `<output id="output">` element.

This is interesting in so far as it goes but I'm not convinced that the "hypermedia maximalist" approach is really all that great of a way to develop systems.

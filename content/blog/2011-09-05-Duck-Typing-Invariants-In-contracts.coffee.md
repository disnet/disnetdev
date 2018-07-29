---
layout: post.hbs
title: Duck-Typing Invariants In contracts.coffee
date: 2011-09-05T00:00:00.000Z
aliases:
  - /blog/2011/09/05/Duck-Typing-Invariants-In-contracts.coffee
---

So the response I've been getting for [contracts.coffee](http://disnetdev.com/contracts.coffee/) has been absolutely incredible! There's been tons of positive feedback and some really great excitement about the project.

I've also heard a few worries that contracts are too much like static types and might not be such a good fit for a dynamic language like CoffeeScript or JavaScript. Now, I don't want to get into a huge debate over the merits of static vs. dynamic typing (that way leads to madness and holy wars!) but I would like to clarify a few points and show that contracts actually fit quite nicely into the dynamic ethos of CoffeeScript/JavaScript.

In dynamic languages like CoffeeScript and JavaScript you'll often hear about [duck-typing](http://en.wikipedia.org/wiki/Duck_typing) where we don't care about the "type" of an object, just the stuff on the object we actually need to use. So the classic example is a "file-like" object where all we care about are the few properties the code actually uses (like `open`, `read`, `close`, etc.). As long as the properties exist we're good. If a property don't exist and we try to use it, just throw an exception so we can track down the bug.

Contracts allow us to extend this concept quite a lot without sacrificing the awesome flexibility we dynamic language users love about duck-typing. To start out, let's consider the simple case of a missing property. Let's first define a contract for a binary tree:


    # A basic binary tree
    BinaryTree = ?(Null or {
      node: Num
      left: Self or Null
      right: Self or Null
    })

Pretty simple, a binary tree is either `null` or has a `node` and two children that are also binary trees. A function can now say it expects a `BinaryTree`:

    f :: (BinaryTree) -> ...
    f = (tree) ->
      n = tree.node
      ...

And if we call `f` with something that isn't quite a binary tree:

    broken_tree =
      nodee: 42  # misspelled!
      right: null
      left: null

    f broken_tree

We get a very descriptive error message:

<pre style="color: red">
Contract violation: expected &lt;{node: Num, left: self or Null,
                                right: self or Null}&gt;,
  actual: "[missing property: node]"
Value guarded in: coffee-script.js:53
  -- blame is on: coffee-script.js:56
Parent contracts:
{node: Num, left: self or Null, right: self or Null}
Null or {node: Num, left: self or Null, righ : self or Null}
(Null or {node: Num, left: self or Null, right: self or Null})
  -&gt; any
</pre>

Now we're already winning since the error message is triggered as soon as the function is called with an object that is missing the required properties. If we weren't using contracts, the variable `n` in the example above would get the value `undefined` which might not surface as an obvious problem until much later (if ever!).


We're also not losing any of the flexibility of duck-typing
since contracts allow us to specify just the object properties the function needs in order to work properly.
We're just being explicit about how our ducks should quack!

In addition to an early failure, we get lots of information in the error message about what was missing, which contract was violated, and which module was to blame (a powerful notion I explain a little [here](http://disnetdev.com/contracts.coffee/#use) but which really deserves a future blog post).

But we're just getting warmed up :)

Contracts on objects can also have arbitrary invariants that get checked whenever properties are modified. So we can have a contract for a binary search tree:

    # A binary search tree is a binary tree where each node is
    # greater than the left child but less than the right child
    BinarySearchTree = ?(Null or {
      node: Num
      left: Self or Null
      right: Self or Null
      | invariant: ->
        (@.node >= @.left.node) and (@.node < @.right.node)
    })

And a [red-black tree](http://en.wikipedia.org/wiki/Red-black_tree):

    # A red-black tree is a binary search tree
    # that keeps its balance
    RedBlackTree = ?(Null or {
      node: Num
      color: Str
      left: Self or Null
      right: Self or Null
      | invariant: ->
        (@.color is "red" or @.color is "black") and
        (if @.color is "red"
          (@.left.color is "black" and @.right.color is "black")
        else
          true
        ) and
        (@.node >= @.left.node) and (@.node < @.right.node)
    })

Note that our contract for a red-black tree is exactly the same as a binary search tree with the addition of the `color` property and some related invariants. We have a kind of subtyping going on here: a function that expects a binary search tree will also work with a red-black tree but *not* vica versa.

Now our functions can "duck-type" the invariants on the objects they accept:

    takesBST :: (BinarySearchTree) -> Any
    takesBST = (bst) -> ...

    takesRedBlack :: (RedBlackTree) -> Any
    takesRedBlack = (rbTree) -> ...

    bst = makeBinarySearchTree()
    rb = makeRedBlackTree()

    takesBST bst # works fine
    takesBST rb  # works fine

    takesRedBlack rb  # works fine
    takesRedBlack bst # might fail if the full
                      # red-black invariants don't hold!

These functions not only specify that they require certain properties but also that certain invariants must hold. This is really powerful! The function that only requires the behavior of a binary search tree can accept a red-black tree just fine and the function that requires the behavior of a red-black tree but is given just a binary search tree will  fail when the invariants are violated (just as we want it to).

So, contracts allow us to be explicit and fail early when things go wrong while still giving us the flexibility of duck-typing. And they work for both "missing-property" kinds of failures along with a more general "failed invariant".

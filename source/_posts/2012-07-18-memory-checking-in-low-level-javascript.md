---
title: Memory Checking in Low-Level JavaScript
layout: post.hbs
---

So this past month I've been helping out on the
[Low-Level JavaScript][lljs] (LLJS) project. Bit of a change for me since I usually
hide out at
as [high a level as I can possibly get][abstraction] :)

LLJS is an experiment in adding low-level features like pointers and
manual memory management to a dialect of JavaScript.
These low-level features are pretty cool and can get you some nice
performance wins, but they also come at a cost since
you are always one
null pointer dereference or memory leak away from oblivion.

One way C/C++ programmers have handled this danger is by using an
analysis tool like [Valgrind][valgrind] to detect memory errors
that happen while the program is running.
Since memory checking has proven to be useful in the C world, we
figured it might be helpful for LLJS. So, I've hacked up a
valgrind-like memory analysis for LLJS. It can detect four kinds
of memory errors:

* reads/writes to unallocated memory (pointers we haven't `malloc`'ed)
* reads from undefined memory (`malloc`'ed memory we haven't
  written to)
* bad frees (calling `free` on memory that hasn't been `malloc`'ed)
* leaks (any unfreed memory at the end of the program run)


## How to use

Go grab the latest version of LLJS from its github [repo][lljsrepo].
Then add the following snippet to the end of your script:

```js
let m = require('memory');
console.log(m.memcheck.report());
```



This pulls in the memory module and prints out the result of the
memory checking (this snippet is for node.js, so use `load` if you're
using SpiderMonkey or grab `memory` off the global object if you're in
the browser).

Then compile your LLJS code with the `-m` flag:

```sh
bin/ljc -m -o your_file.js your_file.ljs
```

and run it:

```sh
node --harmony-proxies your_file.js
```

As you can see the memory checker uses [Proxies][proxy], which node/V8
hides behind a flag (no flag needed on SpiderMonkey).

For example, the following script:

```js
extern console;

function test_unallocated() {
  let uint *x;
  // not allocated yet!
  return *x;
}
test_unallocated();

function test_leak() {
  // leak!
  let uint *leak = new uint;
}
test_leak();

function test_free() {
  let uint *x = new uint;
  delete x;
  delete x;
}
test_free();

let m = require('memory');
console.log(m.memcheck.report());
```


will print out the following report:

    Unallocated:
    0 at:
        test_unallocated:3:0

    Undefined:
    0 at:
        test_unallocated:3:0

    Bad frees:
    8184 at:
        test_free:16:0

    Leaks:
    8200 at:
        test_leak:10:0

## How it works

Memory allocation in LLJS is implemented as a big [typed array][tarray]
where pointers are really just array indexes into the array.

To do memory checking we create a second *shadow memory* typed array
that stores the allocation status of each byte of real memory (if the byte
has been allocated, initialized, etc.). Calls to `malloc` and `free`
change the allocation status of the bytes in shadow memory. The real memory
array is
wrapped in a Proxy that
intercepts each get and set operation and
checks the shadow memory
for a possible error.

For example, say we we allocate an int and try to do some pointer
arithmetic and dereference unallocated memory:

```js
let int *x = new int;
*(x+1)
```

When the dereference of `x+1` happens, the Proxy wrapping real memory
will check in shadow memory to see if `x+1` has been allocated. Since
it hasn't, an unallocated memory access error is recorded.

This approach is basically a simplified version of how
Valgrind [does memory checking][memcheck].


[lljs]: http://lljs.org/ "Low-Level JavaScript"
[lljsrepo]: https://github.com/mbebenita/LLJS "LLJS on github"
[valgrind]: http://valgrind.org/ "Valgrind"
[proxy]: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Proxy "Proxy"
[memcheck]: http://valgrind.org/docs/shadow-memory2007.pdf "Memcheck"
[tarray]: https://developer.mozilla.org/en/JavaScript_typed_arrays "Typed Arrays"
[abstraction]: http://www.quickmeme.com/meme/358lli/ "Abstract all the things!"

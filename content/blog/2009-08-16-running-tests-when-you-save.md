---
layout: post.hbs
title: Running Tests When You Save
date: 2009-08-16T00:00:00.000Z
aliases:
  - /blog/2009/08/16/running-tests-when-you-save
---

Have I mentioned how much I love automated testing of my code? Like madly, obsessively love testing? It's completely changed the way I write code and even made me more in tune with the universe (ok, so maybe not that last bit).

Now one thing I've found about running tests is that unless they run super-fast and with minimal thought on my part, they won't be run at all (unless there's a continuous integration server but that only runs tests after the code has been committed, too late to help with the coding process itself). One great way to achieve this is to have the tests run every single time I save a file. That way I can write a new test, save it and see it immediately fail, and then write the passing code and see it immediately succeed.

Doing this is actually not too hard. You just need a script to poll a directory for file changes and launch a command that runs the tests when that happens.

I put together a little python script to do just that. You can find the script [here](http://github.com/disnet/change-runner/blob/8c7eb62879487f032f634c0ad4a2d8b694f3c304/change_runner.py). The file polling code was inspired by an article I found [here](http://timgolden.me.uk/python/win32_how_do_i/watch_directory_for_changes.html).

<pre lang="bash">
$ python change_runner.py -c run_tests.sh ./test ./src
</pre>

It works by taking in a command you want to run and the directories you want to watch. In this example the directories "test" and "src" are watched. When files in these directories are changed, run_tests.sh is launched.

I've found using this script to be pretty fun. I keep it running in a terminal off to the side and every time I press C-xC-s (or :w depending on my mood) the results of the test run scroll by. It's a pretty addictive way to do TDD.

let Metalsmith  = require('metalsmith');
let collections = require('metalsmith-collections');
let layouts     = require('metalsmith-layouts');
let markdown    = require('metalsmith-markdown');
let permalinks  = require('metalsmith-permalinks');


Metalsmith(__dirname)         // __dirname defined by node.js:
                              // name of current working directory
  .metadata({                 // add any variable you want
                              // use them in layout-files
    sitename: "Disnetdev",
    siteurl: "http://disnetdev.com/",
    description: "Personal site of Tim Disney",
    generatorname: "Metalsmith",
    generatorurl: "http://metalsmith.io/"
  })
  .source('./source')            // source directory
  .destination('./public')     // destination directory
  .clean(true)                // clean destination before
  .use(collections({          // group all blog posts by internally
    posts: 'posts/*.md'       // adding key 'collections':'posts'
  }))                         // use `collections.posts` in layouts
  .use(markdown())            // transpile all md into html
  .use(permalinks({           // change URLs to permalink URLs
    relative: false           // put css only in /css
  }))
  .use(layouts({              // wrap layouts around html
    engine: 'handlebars',     // use the layout engine you like
  }))
  .build(function(err) {      // build process
    if (err) throw err;       // error handling is required
  });
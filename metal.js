/* globals __dirname */
let Metalsmith  = require('metalsmith');
let collections = require('metalsmith-collections');
let layouts     = require('metalsmith-layouts');
let markdown    = require('metalsmith-markdown-remarkable');
let permalinks  = require('metalsmith-permalinks');
let assets      = require('metalsmith-assets');
let dates       = require('metalsmith-jekyll-dates');
let prism       = require('prismjs');


Metalsmith(__dirname)
  .metadata({
    sitename: 'Disnetdev',
    siteurl: 'http://disnetdev.com/',
    description: 'Personal site of Tim Disney',
  })
  .source('./source')
  .destination('./public')
  .clean(true)
  .use(assets({
    source: './static',
    destination: './static'
  }))
  .use(collections({
    posts: 'blog/*.md'
  }))
  .use(markdown('full', {
    highlight (code) {
      return prism.highlight(code, prism.languages.javascript);
    }
  }))
  .use(dates())
  .use(permalinks({
    relative: false,
    linksets: [{
      match: { collection: 'posts' },
      pattern: 'blog/:date/:title'
    }]
  }))
  // .use(console.log)
  .use(layouts({
    engine: 'handlebars',
    partials: 'partials'
  }))
  .build(function(err) {
    if (err) throw err;
  });

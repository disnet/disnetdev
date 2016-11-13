/* globals __dirname */
let Metalsmith  = require('metalsmith');
let collections = require('metalsmith-collections');
let layouts     = require('metalsmith-layouts');
let markdown    = require('metalsmith-markdown-remarkable');
let permalinks  = require('metalsmith-permalinks');
let assets      = require('metalsmith-assets');
let dates       = require('metalsmith-jekyll-dates');
let prism       = require('prismjs');
let Handlebars  = require('handlebars');
let HandlebarsIntl = require('handlebars-intl');


HandlebarsIntl.registerWith(Handlebars);

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
    posts: 'blog/*.md',
    recentPosts: {
      pattern: 'blog/*.md',
      limit: 5
    }
  }))
  .use(markdown('full', {
    highlight (code, lang) {
      return prism.highlight(code, prism.languages[lang]);
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
  .use(function(files) {
    Object.keys(files).forEach(file => {
      let f = files[file];
      if (f.collection && f.collection.some(coll => coll === 'posts')) {
        f.original_contents = f.contents;
      }
    });
  })
  .use(layouts({
    engine: 'handlebars',
    partials: 'partials'
  }))
  .use(function() {
    debugger;
  })
  .build(function(err) {
    if (err) throw err;
  });

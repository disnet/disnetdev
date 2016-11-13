/* globals __dirname */
let Metalsmith  = require('metalsmith');
let collections = require('metalsmith-collections');
let layouts     = require('metalsmith-layouts');
let markdown    = require('metalsmith-markdown');
let permalinks  = require('metalsmith-permalinks');
let assets      = require('metalsmith-assets');


Metalsmith(__dirname)
  .metadata({
    sitename: 'Disnetdev',
    siteurl: 'http://disnetdev.com/',
    description: 'Personal site of Tim Disney',
    generatorname: 'Metalsmith',
    generatorurl: 'http://metalsmith.io/'
  })
  .source('./source')
  .destination('./public')
  .clean(true)
  .use(assets({
    source: './static',
    destination: './static'
  }))
  .use(collections({
    posts: 'posts/*.md'
  }))
  .use(markdown())
  .use(permalinks({
    relative: false
  }))
  .use(layouts({
    engine: 'handlebars',
    partials: 'partials'
  }))
  .build(function(err) {
    if (err) throw err;
  });

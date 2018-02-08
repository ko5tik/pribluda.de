module.exports = (env, callback) ->
  ###
    Genereate per language  overview pages collecting all the documents with proper tag
     ###
  defaults =
    template: 'articles.jade' # template that renders pages
    filename: 'lang/%s/index.html' # directory containing generated language pages
    base: 'articles' # where do we start

  # assign defaults any option not set in the config file
  options = env.config.polyglot or {}
  for key, value of defaults
    options[key] ?= defaults[key]


  # find all articles, sort them and group by language
  getArticles = (contents) ->
# helper that returns a list of articles found in *contents*
# note that each article is assumed to have its own directory in the articles directory
    articles = contents[options.base]._.directories.map (item) -> item.index
    console.log articles.length

    #filter out all the articles woithout template and lang is defined
    articles = articles.filter (item) -> item.template isnt 'none' and item.metadata.lang?
    console.log articles.length
    # filtered and sorted articles
    articles.sort (a, b) -> b.date - a.date

    return articles

  class PolyglotPage extends env.plugins.Page
    # polyglot page bundles all the articles sharing certain language

    constructor: (@lang, @articles) ->


    getFilename: ->
      options.filename.replace '%s', @lang


    getView: -> (env, locals, contents, templates, callback) ->

      # simple view to pass articles defined template
      # note that this function returns a funciton

      # get the template for page
      template = templates[options.template]
      if not template?
        return callback new Error "unknown polyglot template '#{ options.template }'"

      # setup the template context - add language and articles
      ctx = {@articles, @lang}

      # extend the template context with the enviroment locals
      env.utils.extend ctx, locals

      # finally render the template
      template.render ctx, callback


  # register a generator, 'polyglot' here is the content group generated content will belong to
  # i.e. contents._.polyglot

  env.registerGenerator 'polyglot', (contents, callback) ->

    # find all articles suitable aricles
    articles = getArticles contents
    languages = articles.map (item) -> item.metadata.lang


    ll = {}
    for lang in languages
      ll[lang] = lang

    languages = Object.keys(ll)

    # create page objects for each of the languages and add articles there
    pages = []
    for lang in languages
      la = articles.filter (article) -> article.metadata.lang == lang
      pages.push new PolyglotPage lang, la


    rv = {lang: {}}


    for page in pages
      console.log page.lang
      rv.lang[page.lang + ".page"] = page # file extension is arbitrary

    # callback with the generated contents
    callback null, rv


  # tell the plugin manager we are done
  callback()


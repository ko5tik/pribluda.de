---
title: Speaking in tongues
author: pribluda
date: 2018-02-09
template: article.pug
lang: en
---

I am learning  [wintersmith](https://github.com/jnordberg/wintersmith), anf now it is time to write first plugin. I write in 
multiple kanguages and can use some organisation so my readers can find suitable text easily. Of course it is based on basic paginatorplugin, 
but we have to start somewhere. Let's do it.

<span class="more"></span>


### What it shall do

  * group articles by language
  * take language from meta tag *lang*
  * sort by date 
  * generate overview pages with pattern */lang/&lt;tag&gt;/index.html*
  * use configurable template
  
This pllugin will generate new pages, so it will be generator plugin. 

### ... let's make it

First we mark our documents with proper meta tags:
 
```markdown

---
title: Spare, spare, Häusle baue!
author: pribluda
date: 2018-02-05
template: article.pug
tags: haus,vilnius,bau,project
lang: de
---

```

Files without language set will be ignored

First we start with reasonable defaults (they can be overrriden later) 

```coffeescript
module.exports = (env, callback) ->
  ###
    Genereate per language  overview pages collecting all the documents with proper tag
     ###
  defaults =
    template: 'articles.pug' # template that renders pages
    filename: 'lang/%s/index.html' # directory containing generated language pages
    base: 'articles' # where do we start

```

Find all pages with language setting (and ignore all others):

```coffeescript

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
    
```
    
OUr plugin will generate  overview pages listing all the articles on this page. We subclass basic page class and add  properties to store 
language and page list:
   
```coffeescript
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

```

Notable methods
  * getFilename -   where generated content shall go ( we use template substitution here with language property)
  * getView -  retrieves template, populates context ( Language and article will be available in template) and performs 
  actual rendering  
  
  
And now generate those pages.  Register generator function (will be called by framework):

```coffeescript
  env.registerGenerator 'polyglot', (contents, callback) ->
```
Retrieve artricles and languages:

```coffeescript


    # find all articles suitable aricles
    articles = getArticles contents
    languages = articles.map (item) -> item.metadata.lang


    ll = {}
    for lang in languages
      ll[lang] = lang

    languages = Object.keys(ll)
```

And create page objects:
```coffeescript

   # create page objects for each of the languages and add articles there
    pages = []
    for lang in languages
      la = articles.filter (article) -> article.metadata.lang == lang
      pages.push new PolyglotPage lang, la


    rv = {lang: {}}


    for page in pages
      rv.lang[page.lang + ".page"] = page # file extension is arbitrary

    # callback with the generated contents
    callback null, rv
```

As you may guess,  generated pages will be available in contents under *contents[lang]*

And here comes template,  list of articles is available in context:

```jade

    each article in articles
        article.article.intro
            header
                p.date
                    span= moment.utc(article.date).format('DD. MMMM YYYY')
                h2
                    a(href=article.url)= article.title
            section.content
                if article.intro.length > 0
                    != typogr(article.intro).typogrify()
                if article.hasMore
                    p.more
                        a(href=article.url) more
```

...  and now check those little flag icons on top navbar

  * [German](/lang/de/)
  * [English](/lang/en)
  
  

 * See full source on [Github](https://github.com/ko5tik/pribluda.de)
 * Question and discussion on [G+](https://plus.google.com/+KonstantinPribluda/posts/ZtTZAt3BGjX)

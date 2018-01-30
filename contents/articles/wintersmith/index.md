---
title: Moving site  to wintersmith
author: pribluda
date: 2018-01-29
template: article.jade
---

Recently I had to upgrade server, and  found that ancient technologies are not available anymore. So I had to look for a new solution
 
 <span class="more"></span>

A long time ago in another galaxy (or better said in another century) I created my website using technologies available back then:

 - Apache
 - mod_perl
 - [HTML::mason](http://search.cpan.org/dist/HTML-Mason/lib/HTML/Mason/FAQ.pod)
 
 
 
 At this  time there was no java (it was invented and published a year after this) - so there was really no other choice.
 HTML::Mason was wonderfull templating tool - with components, conditional includes, full power of perl inside your ureadable HTML - 
 and also  long and cryptic  stacktraces:
 

 
```html
    <& page_start , title=>'Welcome', 
          keywords_en=>'google,competence,webmaster,skills,content,validation,projekte,projects,fun,',
          description_en=>'Konstantin Pribluda is freelance software consulter based in Wiesbaden, Germany.',
          keywords_de=>'google,competence,webmaster,skills,content,validation,projekte,projects,fun,meta',
          description_de=>'Freiberuchlicher Software Entwickler, Konsultant und Dozent.Ich biete Dienstlesistungen rund um Software-Entwicklung in java'
    &>
  
    <div class="section-head">
          Welcome
    </div>
    <p>
```

which would include page_start component with all the paameters rendered to plain HTML:


```html
    <html>
        <head>
            <title>
            Konstantin Pribluda homepage -  <% $title %>
            </title>
            <meta http-equiv="content-type" content="text/html; charset=iso-8859-1" />
            <meta name="robots" content="index">
            <meta name="robots" content="follow">
            <meta name="author" content="Konstantin Pribluda">
        %if($keywords_en) {        
            <meta name="keywords" lang="en" content="<%  $keywords_en %>">
        %}  
        %if($description_en) {    
            <meta name="description" lang="en" content="<% $description_en %>">
        %} 
        %if($keywords_de) {                    
            <meta name="keywords" lang="de" content="<%  $keywords_de %>"/>
        %}  
        %if($description_de) {
            <meta name="description" lang="de" content="<% $description_de %>"/>
        %} 
```

This was nice and cosy tempating solution, type 1 MVC , but as time went by,  new perl versions came, and all the libraries for databases and whatever
were also upgraded - so  it was almost impossible to upgrade to new version.  And as my hosting provider came wth new and amazing hardware updates, there 
was no choice but to look for something new.

### Requirements

After programming websites for my customers I have pretty clear view of what I do not like to have on my server:

 * nothing java based
 * no databases
 * no standard full fledged CMS
 * basically nothing  on the serverside unless absolutely necessary
 
 
 But:

 * sane templating (with includes, reusable components, some logic)
 * writing my text in markdown.  HTML sucks.
 * static website with reasonable ampunt of javascript where necessary
 * as few boilerplate as possible
 * easy deployment (just run a script,  or git pull or whatever)
 
So my natural choice was some static website generator. I went shopping and found [wintersmith](https://github.com/jnordberg/wintersmith).   Posts are in markdown, 
templating with jade, CSS with less/sass. So here is new website.  For now it is just basic wintersmith blog but will be updated in future.  See the [sources on github](https://github.com/ko5tik/pribluda.de)  
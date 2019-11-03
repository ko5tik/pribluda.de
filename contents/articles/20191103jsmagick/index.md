---
title: JSF, Selenium and black magic
author: pribluda
date: 2019-11-03
template: article.pug
lang: en
tags: js, selenium, jsf, java, testing
description: Testing JSF - selenium and black magic
---

JSF is old and reputable technology,  and  while not really modern, it is still present in field, and applications have to be maintained. And -  of course - tested.  Selenium is a great tool for this,  but when pages are dynamically changed by backend it becomes challenging. 

 <span class="more"></span>
 
Usually you will retrieve  an page element through webdriver, and then query contents or execute some actions:

````java
        final WebElement tabView = webDriver.findElement(By.xpath(String.format("//*[contains(text(), '%s')]", tabViewString)));
        //  do something for some time 
        tabView.click();
````

However, if web page was changed asynchronously between finding element and click you will get *StaleElementReferenceException*  -  and unpredictalby failing test.  Of course, you can try to catch this exception ad compensate  - but it is not always possible and complicates things a lot.   And looks ugly.   And you still have unpredictable test failures.  

How to get rid of this problem?  Easy - do not use selenium  web elemens for it. Use javascript instead:

````javascript
target = document.evaluate("whetever xpath selector you like", document.body,  null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null).iterateNext(); 
if(!target.disabled) { 
   target.click();  return true
}
````

When used from browser console this would find the first matching element and click on it if enabled  -  and even return status (we could use ordered iterator,  or snapshot  -  whatever is necessary) Let's wrap it into convenient java method:

```java
   public static boolean clickItByXPath(WebDriver driver, String xpath) {

        final String script = "target = document.evaluate(\"%s\", document.body,  null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null).iterateNext(); if(!target.disabled) { target.click();  return true}";
        final String executable = String.format(script, xpath);

        log_info("executing javascipt click: " + executable);

        final Object result = ((JavascriptExecutor) driver).executeScript(executable);

        log_info("result: " + result);

        return Boolean.TRUE.equals(result);
    }
```
And invocation looks like:

```java
    clickItByXPath(webDriver, "//a[text()='" + element + "']");
```

And we  even get boolean status and no   *StaleElementReferenceException* !

### Taking it further

Just clinking on link is not enough -  sometimes I have to extract a lot of table data and evaluate it.   And extracting it row at a line is not really convenient
(and as my pages change dynamically, prone to failures).  Basically table is a group of  elements, which can be convniently selcted by single xpath query and a bit of javascript code:


```javascript
    foo = []; 
    res =document.evaluate("xpath selector for all the table cells" , document.body,  
            null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null); 
    while(node = res.iterateNext()) { foo.push(node.textContent) };  
    return foo
```

When we call it via selenium from java we will get just list of strings:

```java
    public static List<String> getAllByXPath(WebDriver webDriver, String selector) {

        final String script = "foo = []; res =document.evaluate(\"" + selector
                + "\", document.body,  null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null); while(node = res.iterateNext()) { foo.push(node.textContent) };  return foo";

        Object result = ((JavascriptExecutor) webDriver).executeScript(script);

        return (List<String>) result;
    }
```

Transform with stream functions:

````java
    // get cell headers
    final List<String> header = getAllByXPath(webDriver, XPATH_SELECTOR_TABLE_FOR_HEADER_CELLS);

     // get values
    final List<String> data = getAllByXPath(webDriver, XPAT_SELECTOR_FOR_ALL_TABLE_CELLS);

    //  zip together
    List<Map<String, String>> result = new ArrayList<>();

    IntStream.range(0, data.size() / header.size()).forEachOrdered(row -> {
            final HashMap<String, String> map = new HashMap<>();
            IntStream.range(0, header.size()).forEachOrdered(column -> map.put(header.get(column), data.get(row * header.size() + column)));
            result.add(map);
    });
````

And now we have List of key-value mapped table cells. Happy testing


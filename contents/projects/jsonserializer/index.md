---
title: JSON Serializer
date: 2018-01-29
template: article.jade
tags: java, json, marshall, serrialize, library, android
description: simple and lightweight JSON marshalling library for android applications
---


Android apps shall be as small as possible - space on the phone is valuable real estate. So there shall be as few foreign 
dependencies as possible. But we ike to have nice things like JSON conversion -  and good marshallling and unmarshalling 
libraries are big and rich on dependencies.    

<span class="more"></span>

### why do we need this

In my android apps I often need to save state (for example when it loses focus, it can be killed at anz moment and I would like 
to present the same game state when user opens it again).  Saving complext data models means a lot of work -  so some 
object marshalling solution would be nice.  And there are a lot of nice and easy to use tool -  [XStream](http://x-stream.github.io/) 
being my favorite due to great speed and simple usage. 

Unfortunately those libraries bring a lot of dependencies with them, and that is not nice on android.  Internal storage  is small 
and precious - nobody likes 100MB apps. 

So I went and wrote small and cosy json marshaller with only one external dependency -  [GSON](https://github.com/google/gson) - 
which is very lightweight and provides just JSON parser. And this is my marshaller is used: 

### How it works

Reading: 

```java

import com.google.gson.stream.JsonReader;
import de.pribluda.android.camerawatch.data.Camera;
import de.pribluda.android.jsonmarshaller.JSONUnmarshaller;

... 

ArrayList<Camera> cameras = new ArrayList<Camera>(JSONUnmarshaller.unmarshallArray(new JsonReader(new InputStreamReader(inputStream)), Camera.class));
                    
```

And writing:
```java

JSONMarshaller.marshallArray(new JsonWriter(new OutputStreamWriter(outputStream), )
```

nothing more than that.

### Features

This is not a full blown customisable marshalling library  - if you need this go for xstream or whatever you like.  This library will
read and write simple java beans with well behaved getters and setters, and also arrays of those  objects. Not much, but enough for most 
configuration issues in android app and simple local data storage.


### Sources

Released unde apache license, sources are available on [Github](https://github.com/ko5tik/jsonserializer).  Compiled  version is available 
from maven repositories

```xml
<dependency>
    <groupId>de.pribluda.android</groupId>
    <artifactId>jsonmarshaller</artifactId>
    <version>0.6</version>
</dependency>
```
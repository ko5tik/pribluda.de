---
title: JSON Serializer
date: 2018-03-02
template: article.jade
tags: java, json, marshall, serralize, library, android, deserialize
description: simple and lightweight JSON marshalling library for android applications - in just 9659 bytes 
---


Serialize simple and not so simple data structures to JSON 
(like game state of [lines game](/android/lines/))  under android

<span class="more"></span>

### why do we need this

In my android apps I often need to save state (for example when it loses focus, it can be killed at any moment - but I would like 
to present the same game state when user opens it again).  Saving complex data models means a lot of work -  so some 
object marshalling solution would be nice.  And there are a lot of nice and easy to use tools -  [XStream](http://x-stream.github.io/) 
being my favorite due to great speed and simple usage. 

Unfortunately those libraries bring a lot of dependencies with them, and that is not nice on android.  Internal storage  is small 
and precious - nobody likes 100MB apps. 

So I went and wrote small and cosy json marshaller with only one external dependency -  [GSON](https://github.com/google/gson) - 
which is very lightweight and provides just JSON parser. 

### How it works

Reading: 

```java

import com.google.gson.stream.JsonReader;
import de.pribluda.android.camerawatch.data.Camera;
import de.pribluda.android.jsonmarshaller.JSONUnmarshaller;

... 

ArrayList<Camera> cameras = new ArrayList<Camera>(JSONUnmarshaller.unmarshallArray(new JsonReader(new InputStreamReader(inputStream)), Camera.class));
                    
```

As you  may imagine, it just reads an array of some class out of JSON  reader.  Just say what and where from. 

And writing is also easy (actually current state of [lines game](/android/lines/) when focus is lost):

```java

StringWriter writer = new StringWriter();
JsonWriter jsonWriter = new JsonWriter(writer);


JSONMarshaller.marshall(jsonWriter, ss);
editor.putString(GAME_STATE, writer.toString());
editor.commit();

```

nothing more than that (in case you are wondering - editor stores values in app preferences).


### Features

This is not a full blown customisable marshalling library  - if you need this go for XStream or whatever you like.  This library will
read and write simple java beans with well behaved getters and setters, and also arrays of those  objects. Not much, but enough for most 
configuration issues in android app and simple local data storage.


### Sources

Released under apache license, sources are available on [Github](https://github.com/ko5tik/jsonserializer).  Compiled  version is available 
from maven repositories:

```xml
<dependency>
    <groupId>de.pribluda.android</groupId>
    <artifactId>jsonmarshaller</artifactId>
    <version>0.6</version>
</dependency>
```

Have fun. And guess how big is it - 9659 bytes!
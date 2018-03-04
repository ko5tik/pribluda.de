---
title: Andject
date: 2018-03-04
template: article.jade
tags: java, android, dependency, injection, ioc
description: lightweight dependency injection for android
---

Eliminate android boilerplate code and save your time with lightweight dependency injection


<span class="more"></span>

Dependency injection is not exactly new, and  made our lives easier since early 2000s (most popular being Spring, but there were alternatives
like pico/nanocontainer which I  co developed). However,  they were not really useful in android world due to heavy weight and different lifecycles of 
components - and lack of well defined scopes (like application - session - request in web environment)

Android already assembles an application, with all the views, layouts and components - but getting to those components from your code requires 
a lot of  boilerplate (getViewById(),  retrieve value from preferences  )- and this sucks.  So I went and wrote small, lightweight and not invasive  
dependency injection library to cover just those problems.


### Managong preferences

Configuration values configure out application (if you foun tautology here, you can keep it) - I like them as some klass properties.  UNfortunately, android stores 
them in property stores,   and reading and writing requires some (way too much) effort: 


```java

    String stringPref;
    int intPref;
    
    
    void someInitMethod(Context context) {
        
        SharedPreferences prefs = context.getSharedPreferences(PREFERENCE_TAG, Context.MODE_PRIVATE);
        
        stringPref = prefs.getString(STRING_PREFKEY);
        intPref = prefs.getInt(INT_PREF_KEY);
        
    }
    
    void someSaveMethod(Context context) {
         SharedPreferences prefs = context.getSharedPreferences(PREFERENCE_TAG, Context.MODE_PRIVATE);
         SharedPreferences.Editor editor = prefs.edit();
         
         editor.putString(STRING_PREFKEY, stringPref);
         editor.putInt(INT_PREF_KEY, intPreef);
         
         
          editor.commit();
    }
    
```

I omitted some code and exceptions -  but you see that for every preference you shall be aware of typing and provide key name. Imagine doing this for 30 of them.  Being lazy programmer I do not like this. 
And this is how it looks with *andject*:

 
```java


    @InjectPreference(key = "stringKey")
    String stringPref;
    @InjectPreference
    int intPref;    
    
     void someInitMethod(Context context) {
           PreferenceInjector.inject(this, context.getSharedPreferences(PREFERENCE_TAG, Context.MODE_PRIVATE));
     }
     
     void someSaveMethod(Context context) {
           PreferenceInjector.eject(this, context.getSharedPreferences(PREFERENCE_TAG, Context.MODE_PRIVATE));
     }
     
    

```


Quite a difference? Just annotate fields, property name is optional (defaults to field name), all types allowed inside shared preferences are allowed, alternatively String
value is parsed.  Of course, this can be expanded - like objects with single constructor  accepting primitive value,   or unmarshalling from JSON -  but I did not have 
usecase for it.  Your ideas welcome.  (Actually,  I access configuration values in 
[Singleton class](https://github.com/ko5tik/accanalyser/blob/master/src/de/pribluda/android/accanalyzer/Configuration.java),  and preferences are managed by own 
preference activity) 


### Managing views

The same problem is with views -  you need to references them in code -   for setting values, retrieving them, registering callbacks -  and you have to reestablish those relations after every 
focus loss (you can not be sure that your app was not restarted). So here comes simple view injector:
 * annotate view references (or just plain setters - see in tests)
 
```java 


    @InjectView(id = R.id.startStopButton)
    CheckBox recordButton;

    @InjectView(id = R.id.displayField)
    private SurfaceView surfaceView;

    @InjectView(id = R.id.windowSizeLabel)
    TextView windowSizeLabel;

    @InjectView(id = R.id.updateIntervalLabel)
    TextView updateIntervalLabel;

    @InjectView(id = R.id.sensorRateLabel)
    TextView sensorDelayLabel;


``` 
 
 * start injection ptoces
 
 
```java 

   public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        configuration = Configuration.getInstance(this);

        setContentView(R.layout.stroke_counter);
        // inject views
        ViewInjector.startActivity(this);

``` 
  
And all your views and components are where you like them to be in your code. See [full source](https://github.com/ko5tik/accanalyser/blob/master/src/de/pribluda/android/accanalyzer/SpectralViewer.java)

And guess what - your IDs are compile-safe and always correct,   and if you change layout and remove some elements you get compile errors.


### Where to get it?   

At the moment I had not cut a release into some maven repository (have to find time, keystores, prepare and perform release....) - but 
[sources are available](https://github.com/ko5tik/andject) on github - so you can clone and build it yourself.  Or [grab a jar](./andject-0.1-SNAPSHOT.jar)
Released under apache license. 
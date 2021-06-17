---
title: Saving game highscores
author: pribluda
date: 2021-03-03
template: article.pug
lang: en
tags: android, java,  spring,  webservice, docker
description: Competiion is fun.  So game requires highscore service.  Now there is one with spring rest backend and docker deployment
---

For a game to be real fun,   there has to be a competition.  When I decided to reactivate my [lines game](https://play.google.com/store/apps/details?id=de.pribluda.games.android.lines), 
there was need for Highscore backend. So I developed one  with spring and docker. 

<span class="more"></span>

Of course,  there are  services provided by google like firebase and whatever - but I like to keep privacy of my users, and control
how data is saved.  And I do not like idea to integrate yet another data collection framework into my app.  And I have my own server 
anyway - so I decided to roll my own service. I should:

- Store  reasonable amount of highscores (say - 1000)
- Game receives periodic updates (say every 10 minutes)
- Game app sends new game result from time to time
- Application shall be as simple as possible to develop and run

With those key features I decided to:
- store data as JSON file on FS (there is not much data,  and no complicated queries are necesary - just some filtering - so no need to use database)
- develop kind of REST server with spring boot (to reduce boilerplate code)
- run in docker container (I used mod_jk and standalone java apps earlier,  but it was a nightmare to run and setup, so some 100 MB extra storage for container is not an overhead)
- authenticate client via mutual TLS mutual authentication (pro:  no need for any setup from user, applicaton has primary key I trust on server.  Contra: private key  can be extracted from app  by someone using debugger, but  there is no real protection against someone willing to debug java app)
  
Let's see  some code!

### Interface

Rest service (simplified a little, just important parts, with comments):
````java


@RestController
@SpringBootApplication
public class HighscoreRest {
    
    private static final Logger log = LoggerFactory.getLogger(HighscoreRest.class);
    private static final Logger incoming = LoggerFactory.getLogger("incoming");
    private final Highscore highscore;
    private final Gson gson = new Gson();

    // backend is instatiated by spring , not a point of interest now
    @Autowired
    public HighscoreRest(@Autowired Highscore highscore) {
        this.highscore = highscore;
    }


    /**
     * private endpoint
     * store highscore entry and save it into backend
     *
     * 
     * @param entry
     */
    @RequestMapping(value = "/secured/store",
            method = RequestMethod.POST)
    public void store(@RequestBody Entry entry) {
        log.info("store called");
        // write out to logger
        incoming.info(gson.toJson(entry));
        // and store in separate thread as there is potential write to disk
        new Thread(() -> highscore.doAdd(entry)).start();
    }

 
    /**
     * public endpoint. crossOrigin will be necessary later, to call this endpoint from react application when I decide
     * to write one
     * provide list of  scores
     *
     * @param since retrieve highscores stored since given time
     * @return
     */
    @RequestMapping(value = "/public/scores", method = RequestMethod.GET)
    @CrossOrigin()
    public Collection<Entry> scores(@RequestParam(name = "since", defaultValue = "0") long since) {
        log.info("scores read from  " + since);
        return highscore.scores(since);
    }

    @RequestMapping(value = "/public/stats", method = RequestMethod.GET)
    @CrossOrigin()
    public Highscore.Stats stats(){
        return  highscore.getStats();
    }


    @RequestMapping(value = "/public/status", method = RequestMethod.GET)
    @CrossOrigin()
    public Highscore.Status status(){
        return  highscore.getStatus();
    }
    
    public static void main(String[] args) {
        SpringApplication.run(HighscoreRest.class, args);
    }
}

````
So, for now everything simple -  POST method to store incoming highscore entry (some magic happens in backend)  and GET method
for retrieval of stored highscores filtered by time.


### Securing interface

Obviously,   storing highscore shall be secured and allowed only for legitimate clients, and we do not care much about reading
of highscores.   SO we have to provide security configuration:

````java

//  this is security configuration,  it will be picked up by spring boot and put to good use
@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(securedEnabled = true)
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);
    public static final String CLIENT = "CLIENT";

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.csrf().disable()
                .authorizeRequests()
                //  private endpoint, only trusted client allowed
                .antMatchers("/secured/**").hasRole(CLIENT)
                //  public endpoint
                .antMatchers("/public/**").permitAll()
                //  go avay everybody, nothing to see here
                .anyRequest().denyAll()
                .and()
                //  extract principal from certificates if there is any
                .x509().subjectPrincipalRegex("CN=(.*?),")
                //   and grant roles
                .userDetailsService(userDetailsService())
        ;
    }

    // role is granted here
    public UserDetailsService userDetailsService() {
        return username -> {
            //  shall match CN  extracted by  .x509().subjectPrincipalRegex("CN=(.*?),")  from client certificate!
            if (username.equals("lines_app")) {
                log.info("authorising user lines_app");
                return new User(username, "",
                        //  CAVE AT:  IT has to be prepended with ROLE_
                        AuthorityUtils.commaSeparatedStringToAuthorityList("ROLE_CLIENT"));
            } else {
                throw new UsernameNotFoundException("User:" + username + " not found");
            }
        };
    }
}

````
Here we define that somebody calling our endpoint must provide proper CN  in their certificate (lines app ). Public methods can be called at will.
And we also neeed to configure TLS for client  authentication with proper cryptographic artifacts:

```properties
#default properties can be changed later
server.port=8443
server.ssl.key-store=crypto/lines_highscore_server.jks
server.ssl.key-store-password=omited
server.ssl.key-alias=lines_highscore_server

server.ssl.trust-store=crypto/lines_truststore_server.jks
server.ssl.trust-store-password=omited
server.ssl.client-auth=want

```
Important part is that  client authentication is optional (**want**) - this way secured part will need trusted client while unsecure part can be called by anybody.

And here come keystores and trustores.  

Keystore for server (provide password, CN and other stuff does not matter for us here):
```shell
keytool -genkeypair -keyalg RSA -alias lines_highscore_server -keystore lines_highscore_server.jks
```

Keystore for client (also, provide password,  but **CN has do be set to "lines_app" - as seen in userDetailsService()** before )

```shell
keytool -genkeypair -keyalg RSA -alias lines_highscore_client -keystore lines_highscore_client.jks
```

And export certificate from client keystore:
````shell
keytool -exportcert -file client.cer -alias lines_highscore_client -keystore lines_highscore_client.jks -storepass whatever -rfc
````

And trust it on server:

````shell
keytool  -importcert -file client.cer -alias server -keystore lines_truststore_server.jks -storepass ehatever -noprompt
````

Now we are explicitely trusting client key on server side. 


### Building and deploying:

I use gradle build for this  small app, nothing really interesting here:


```groovy

plugins {
    id 'org.springframework.boot' version '2.4.2'
    id 'io.spring.dependency-management' version '1.0.11.RELEASE'
    id 'java'
    id 'maven-publish'
}

repositories {
    mavenLocal()
    maven {
        url = uri('https://pribluda.de/m2')
    }
    maven {
        url = uri('https://repo.maven.apache.org/maven2/')
    }
}


dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'com.google.code.gson:gson:2.8.6'
    testImplementation 'org.junit.jupiter:junit-jupiter-api:5.7.0'
}

group = 'de.pribluda.lines'
version = '0.1-SNAPSHOT'
description = 'highscore-server'
java.sourceCompatibility = JavaVersion.VERSION_1_8

publishing {
    publications {
        maven(MavenPublication) {
            from(components.java)
        }
    }
}

tasks.withType(JavaCompile) {
    options.encoding = 'UTF-8'
}

```

End everything goes into docker container:

```dockerfile
FROM gradle:latest AS build
COPY --chown=gradle:gradle . /home/gradle/src
WORKDIR /home/gradle/src
RUN gradle build --no-daemon

FROM openjdk:8-jre-alpine

EXPOSE 8443


RUN addgroup -S highscore && adduser highscore -S highscore -G highscore
COPY --from=build /home/gradle/src/build/libs/*.jar highscore-service.jar
RUN mkdir /data && chown highscore:highscore /data
RUN mkdir /logs && chown highscore:highscore /logs
RUN mkdir /crypto && chown highscore:highscore /crypto
COPY crypto/lines_*_server.jks /crypto/

USER highscore:highscore
ENTRYPOINT ["java","-jar","/highscore-service.jar" , "--highscore.filename=/data/highscore.json" , "--spring.profiles.active=production,dev"]
```

Build this container
```shell
 docker image build -t lines-highscore .
```

Shipt it on server import,  and launch it:

```shell
 sudo docker volume create lines-hs-data
 sudo docker volume create lines-hs-logs
 sudo docker run -d --restart unless-stopped -p 8443:8443 -v lines-hs-data:/data -v lines-hs-logs:/logs lines-highscore

```
And now you can see  [webservice working](https://www.pribluda.de:8443/public/scores?since=0) (you  will have to trust muy certificate)

###  Do not forget to play the game

[Lines game](https://play.google.com/store/apps/details?id=de.pribluda.games.android.lines) -    it is still easy to get into highscore
list. 

---
title: JHipster and reactive feign clients
author: pribluda
date: 2021-05-26
template: article.pug
lang: en
tags: java, jhipster, openapi, jwt, spring, reactive, feign, openfeign,  openapi, openapi-generator, gradle
description: Connecting reactive jhipster application with open feign to webservice
---

As long as you keep to standards,  [jhipster](https://www.jhipster.tech/) is a great tool, but it starts to get difficult when you  like to have something different.
In my use case it is necessary to call backend  service after user creation,   and I had to google and tweak a lot to achieve this. I put it in one place, 
so you do not have to.

<span class="more">
</span>

Here comes why:
- Gateway app manages user and authority entities and is completely generated by JHipster, and I like to keep it. Or maybe switch from database to LDAP later
- Other entities are managed in own microservice, and there is separate database, and no way to have relationships to user entities. 
- There must be an object for every user created / removed as users are created and removed. 
- JHipster gateway app is reactive.  It makes things interesting.


### Reactive service interfaces. 
Unfortunately  [openapii-generator from previous post](https://www.pribluda.de/articles/20210422matinservices/)   will now work here -  JHIpster uses outdated version,  and 
even new one is unable to generate  interfaces for reactive feign clients out of the box.  Fortunately it  is easy to tweak, and we do not really need jhipster for it.

We start with gradle invocation.  I put the code into **gradle/swagger.gradle**  following jhipster project structure. This will generate interfaces when necessary:

````groovy
apply plugin: "org.openapi.generator"

//  generate client interfaces and data models.
//  this invocation is very fragile!!!
openApiGenerate {
    generatorName = "spring"
    inputSpec = "$rootDir/../recorder/src/main/resources/swagger/api.yml".toString()
    outputDir = "$buildDir/openapi".toString()
    // verbose = true
    apiPackage = "de.xxxxxxxx.api"
    modelPackage = "de.xxxxxxxxx.model"
    invokerPackage = "de.xxxxxxx.invoker"
    //  we have to use custom template  for reactive  feign clients
    //  some explanations:
    //  https://openapi-generator.tech/docs/templating/
    //  base for custom templates:
    //  https://github.com/OpenAPITools/openapi-generator/tree/master/modules/openapi-generator/src/main/resources/JavaSpring

    templateDir = "$rootDir/src/main/openapigen".toString()
    configOptions = [
        dateLibrary         : "java8",
        reactive            : "true",
        interfaceOnly       : "true",
        skipDefaultInterface: "true",
    ]

}

sourceSets {
    main {
        java {
            srcDir file("${project.buildDir.path}/openapi/src/main/java")
        }
    }
}

compileJava.dependsOn("openApiGenerate")
````

We can not use standard reactive templates, as they produce method signatures unsuitable for reactive feign client we intend to use -  wrapping
parameters into monos and fluxes, adding web exchanges etc.   So here are custom templates:

- [**src/main/openapigen/api.mustache**](./api.mustache)
- [**src/main/openapigen/bodyParams.mustache**](./bodyParams.mustache)

This generates nice interfaces (**gradle openapiGenerate**) :

```java
package de.xxxxxxxxxxx.api;
//  imports and generated comments are removed for brevity and readability
@javax.annotation.Generated(value = "org.openapitools.codegen.languages.SpringCodegen", date = "2021-05-06T17:03:09.822261726+03:00[Europe/Vilnius]")
    @Validated
@Api(value = "userProfile", description = "the userProfile API")
    public interface UserProfileApi {

            /**
            * POST /userProfile : creates new user profile  new user specifid by principal
                * new user profile object is created for the user with principal set
            *
                * @param userProfileDto  (optional)
            * @return user profile was  created (status code 200)
                *         or the same user principal already exists, no new profile was created (status code 406)
                *         or internal server error occured (status code 500)
            */
            @ApiOperation(value = "creates new user profile  new user specifid by principal", nickname = "createUserProfile", notes = "new user profile object is created for the user with principal set", authorizations = {
        
        @Authorization(value = "jwt")
         }, tags={  })
            @ApiResponses(value = { 
                @ApiResponse(code = 200, message = "user profile was  created"),
                @ApiResponse(code = 406, message = "the same user principal already exists, no new profile was created"),
                @ApiResponse(code = 500, message = "internal server error occured") })
            @PostMapping(
            value = "/userProfile",
            consumes = { "application/json" }
            )
        Mono<Void> createUserProfile(@ApiParam(value = ""  )  @Valid @RequestBody(required = false) UserProfileDto userProfileDto
);


            /**
            * DELETE /userProfile : delete user profile
                * user profile and corresponding resources and mappings  are removed
            *
                * @param principal  (required)
            * @return user profile was  removed (status code 200)
                *         or internal server error occured (status code 500)
            */
            @ApiOperation(value = "delete user profile", nickname = "removeUserProfile", notes = "user profile and corresponding resources and mappings  are removed", authorizations = {
        
        @Authorization(value = "jwt")
         }, tags={  })
            @ApiResponses(value = { 
                @ApiResponse(code = 200, message = "user profile was  removed"),
                @ApiResponse(code = 500, message = "internal server error occured") })
            @DeleteMapping(
            value = "/userProfile"
            )
        Mono<Void> removeUserProfile(@NotNull @ApiParam(value = "", required = true) @Valid @RequestParam(value = "principal", required = true) String principal
);

        }

```

And now we are just a tiny step away from

### Registering the bean for autowiring

Just derive from generated interface and add some annotations:
```java
import reactivefeign.spring.config.ReactiveFeignClient;
import de.vc.admin.client.recorder.api.UserProfileApi;

@ReactiveFeignClient(name = "${default.name:default}",  path="api/", url = "${default.url:http://localhost:8081/api}")
public interface UserProfileReactiveFeign extends UserProfileApi {
}

```
- ***name*** provides name of the eureca registered application.  It will be used  if it can be found.
- ***url*** specifies base fallback URL when none is availab le form eureca
- ***path***  defines base path on eureca server -   reactive feign client does not support **name="service/path"**  notation


As we are inside JHipster infrastructure, all the black magic with eureka, histrix and discovery shall just work.  And of course, 
we need to provide basic configuration with **@EnableReactiveFeignClients**.   It is better to  put this configuration  on dedicated interface
as application class itself is generated by jhipster and we are more flexible this way

```java
@Configuration
@EnableReactiveFeignClients(basePackages = "de.vc.admin.feign")
@EnableFeignClients
@EnableEurekaClient
public class ReactiveFeignConfiguration {
}


```

### Proper dependencies 
And of course we need feign client library  in our *build.gradle* which provides reactive feign clients  (standard one does not do this yet):

```groovy

    implementation("com.playtika.reactivefeign:feign-reactor-spring-cloud-starter:3.0.3")

```

### calling client reactive way

Now we can inject generated spring bean and make calls to backend ( this is basically jhispter generated service, so I shortened  irrelevant parts)

```java
/**
 * Service class for managing users.
 */
@Service
public class UserService {

    //  injected reactive feign client
    private final UserProfileReactiveFeign recorderClient;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, AuthorityRepository authorityRepository, UserProfileReactiveFeign recorderClient) {
        //omited for brevity
        this.recorderClient = recorderClient;
    }

    //  standard generated user creation method
    @Transactional
    public Mono<User> createUser(AdminUserDTO userDTO) {
        
        //  code omited  for brevity
        
        return Flux
                .fromIterable(userDTO.getAuthorities() != null ? userDTO.getAuthorities() : new HashSet<>())
                .flatMap(authorityRepository::findById)
                .doOnNext(authority -> user.getAuthorities().add(authority))
                .then(Mono.just(user))
                .publishOn(Schedulers.boundedElastic())
                .map(
                        newUser -> {
                            String encryptedPassword = passwordEncoder.encode(RandomUtil.generatePassword());
                            newUser.setPassword(encryptedPassword);
                            newUser.setResetKey(RandomUtil.generateResetKey());
                            newUser.setResetDate(Instant.now());
                            newUser.setActivated(true);
                            return newUser;
                        }
                )
                .flatMap(this::saveUser)
                // here happens async invocation magic
                .flatMap(user1 -> recorderClient.createUserProfile(new UserProfileDto().principal(user1.getLogin())).thenReturn(user1))
                .doOnNext(user1 -> log.debug("Created Information for User: {}", user1));
    }
}
```

And now when we create new user,  backend service will be invoked.   And we will certaily see  **401 not authorised** in our logs


### Propagating JWT token

As gateway app is secured with JWT and we are creating user from authenticated web frontend we shall be able to propagate  this security token to
microservice as bearer token.  We need an interceptor.  And it has to be done in reactive-way:


```java
package de.xxxxxxxxx.feign;


// those are important,  our feign client implementation looks for them
import reactivefeign.client.ReactiveHttpRequest;
import reactivefeign.client.ReactiveHttpRequestInterceptor;

import java.util.List;

@Component
public class UserFeignClientInterceptor implements ReactiveHttpRequestInterceptor {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER = "Bearer";
    private final TokenProvider tokenProvider;

    public UserFeignClientInterceptor(TokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }


    @Override
    public Mono<ReactiveHttpRequest> apply(ReactiveHttpRequest reactiveHttpRequest) {
        log.error("applying security filter");

        return Mono.just(reactiveHttpRequest)
                .log("UserFeignClientInterceptor")
                .flatMap(request -> {
                    // Hardwire Auth token,   as I did not figured yet how to make reactive feign clients to  
                    // pick up proper security context
                    String jwtToken = tokenProvider.createToken(
                            new UsernamePasswordAuthenticationToken("foobar", "", Arrays.asList(new SimpleGrantedAuthority("ADMIN"))),
                            true
                    );
                    log.error("invoking map {}", jwtToken);
                    request.headers().put(AUTHORIZATION_HEADER, List.of(String.format("%s %s", BEARER, jwtToken)));
                    //  IMPORTANT:  wrape incomming request into mono
                    return Mono.just(request);
                });
    }
}

```

And now our calls are authorised to call microservices. 


### Further reading

- [Feign reactive](https://github.com/Playtika/feign-reactive) 
- [Openapi Generator  spring](https://openapi-generator.tech/docs/generators/spring)

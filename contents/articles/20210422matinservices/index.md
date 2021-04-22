---
title: Mating JHipster microservices to each ohter
author: pribluda
date: 2022-04-22
template: article.pug
lang: en
tags: java, jhipster, openapi, jwt, spring
description: Mating jhipster services - step by step
---

JHIpster is great, like xdoclet (remember it?) on steroids and it allows you to get your applications runnung
fast. All the basic stuff. But it is not always clear how to do other things  when you need them.   I hat to mate 2 microservices. Here is how it can be done 

<span class="more">
</span>


JH generates all the basic CRUD  for you, and also rest services to do this - but sometimes you need more, and you can not declare this in JDL.  Here is 
step by step guide how ot do this.

We assume that you already have generated jhipster applications, and are using gradle  as build tool 

### Define target service

If you have activated   in your **.yo-rc.json**  like this:

```json
 "enableSwaggerCodegen": true,
```

(if not yet,   activate and run *jhipster* again)

Then there shall be openapi  declaration file  located at **src/main/resources/swagger/api.yml**  looking like this:

```yaml
# API-first development with OpenAPI
# This file will be used at compile time to generate Spring-MVC endpoint stubs using openapi-generator
openapi: '3.0.1'
info:
  title: 'adapter'
  version: 0.0.1
servers:
  - url: http://localhost:8082/api
    description: Development server
  - url: https://localhost:8082/api
    description: Development server with TLS Profile
paths: {}
components:
  responses:
    Problem:
      description: error occurred - see status code and problem object for more information.
      content:
        'application/problem+json':
          schema:
            $ref: 'https://opensource.zalando.com/problem/schema.yaml#/Problem'

  securitySchemes:
    jwt:
      type: http
      description: JWT Authentication
      scheme: bearer
      bearerFormat: JWT
security:
  - jwt: []

```

This is the place where you define your rest interface ( out of scope of this article, there are countless tools and editors  to help you do this). Once interface is defined, 
next build will automatically generate server stubs  via gradle task **openApiGenerate**.  You will find the generated sources under **build/openapi/src/main/java/** - and if you are using InteliJ
it will be already on your source path.   Now you are only a step away  from implementing your service -   just implement **&lt;YourCooleServiceName&gt;Delegate** interface, and mark the class with 
**@Component**  annotation. 

Now you have implemented service.


### Implementing Client code

And now we need client.  Just invoke:

```shell
jhipster openapi-client
```
Provide path to target service source directory, and now you  will have a client code generated in a package ***&lt;base package&gt;>client/***.  You will find there service interfaces
(just autowire them  to your spring beans):

````java
@Component
public class Caller {

    private static final Logger log = LoggerFactory.getLogger(Caller.class);

    private final DefaultApiClient callCient;
    private final TokenProvider tokenProvider;

    public Caller(DefaultApiClient callCient, TokenProvider tokenProvider) {
        this.callCient = callCient;
        this.tokenProvider = tokenProvider;
    }
````

All the [feign infrastructure](https://cloud.spring.io/spring-cloud-netflix/multi/multi_spring-cloud-feign.html)   is to your disposal.  If your context 
is authenticated with JWT  everything shall work out of the box. 



### Tweaking JWT authentication

In my use case I do not have prior external call, so I need to set up JWT token myself before calling methods on client interface:

```java
        // create JWT token,   password is not  important in this context
        String jwtToken = tokenProvider.createToken(
            new UsernamePasswordAuthenticationToken("foobar", "", Arrays.asList(new SimpleGrantedAuthority("ADMIN"))),
            true
        );
        //  and now authentication object
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken("foobar", jwtToken);
        //  insert it into security context
        SecurityContextHolder.getContext().setAuthentication(authenticationToken);

        ResponseEntity<Void> responseEntity = callCient.create(new InlineObject().callerId("foo bar " + System.currentTimeMillis()));
```


Like that.   

It is important that both sides share the same JWT secret (if you are using jhipster gateway and registry  it is automatic,  if not -  store it in respective properties)

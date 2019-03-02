---
title: Writing IntelliJ Idea plugin . Part 4 - Taming grammar recursion
author: pribluda
date: 2018-06-17
template: article.pug
tags: jetbrains, intellij, idea, plugin, java, module,facet,configuration, bnf, perser, lexer, jflex
lang: en
---

In the beginning our parser was pretty simple,    but progrramming language is complicated, has operators and also
expressions.  Brute force approach does not work well for big files due to recursion.

<span class="more"/>

### Finishing parser - Taming recursion

Our parser is finally finished,  our terminal symbols are in place (defined in parser and resolved via lexer 
regular expressions) - but some grammar constructs are not yet adequately covered.  Our language has chained function 
invocations, and expressions (not as complex as java, but nevertheless they need coverage and operator precedence and 
whatever). Our base expression is:

````bnf
term ::=
         // any primitive object
         object |
         // method can be involved with square params on implicit object,
         // or with round on first
         ( METHOD (squareParams|roundParams)?) |
         // can always have brackets around for precedence
         (PAREN_OPEN expression PAREN_CLOSE) |
         // lambda
         lambda |
         // function invocation -  up to 15 params - we are not  in grammar
         ( HASH_INVOCATION squareParams?) |
         with_op
```` 

Important part is treatment of expression in parenthesises as primtive term - this way we ensure that parenthesis has 
precedence over everything.  Now,  as everything is object for us, we can call methods on them (highest precedence):

````bnf
invocation_chain ::= invocation_chain dot_invocation | term  
````

This would work, produce nice parsing tree for us,  but also introduce recursion -  recursion is bad for performance. 
We shall use following instead:

````bnf
invocation_chain ::= term  dot_invocation*
```` 

(exact syntax of dot invocation is not of interest here,  but it contains parameters which are in turn expressions - 
it's turtles all the way down, and cost of recursion would be prohibitive).  We also have postfix operator with highest 
precedence (factorial), which can be applied multiple times -  and we also do not like to have any recursion here:

````bnf
postfix_expression ::=  invocation_chain FACTORIAL*
````

Then prefix operators, which have lesser precedence.   We can not avoid recursion here -  but since we have primitive prefix 
this is not as expensive:

````bnf
unary_expression ::=
           // prefix
           ( MINUS | PLUS | NOT ) unary_expression |
            postfix_expression

````

Now, as we have covered postfix and prefix we shall cover infix operators  - which come in 4 flavours (decreasing 
prcedence):
 - Multiplicative ( * / )
 - Additive ( + -)
 - Boolean and ( and,  comparison operators )
 - boolean or ( or, xor)
 
 Naive recursive attempt to solve  this would be:
 
````bnf
 
mutiplicative_exception ::= unary_expression MULT_OP mutiplicative_exception | unary_expression
additive_expression ::= mutiplicative_exception (PLUS| MINUS) additive_expression | mutiplicative_exception
compare_and_expression ::=  additive_expression (BOOL_AND|COMP_OP) compare_and_expression | additive_expression
bool_or_expression ::=   compare_and_expression BOOL_OR bool_or_expression | compare_and_expression

````

Looks clean and almost like in java grammar, lesser preference delegates to higher level - but performance for more complicated expressions is way below expectations
(it takes several minutes for  bigger files) - not a good solution.  But rhis can be reworked avoiding recursion:

````bnf
mutiplicative_expression ::= unary_expression (MULT_OP unary_expression)*
additive_expression ::= mutiplicative_expression ( (PLUS| MINUS) mutiplicative_expression)*
compare_and_expression ::=  additive_expression ((BOOL_AND|COMP_OP)  additive_expression)*
bool_or_expression ::=   compare_and_expression (BOOL_OR  compare_and_expression)*

````

This grammar would not produce nice PSI trees,  but it works way faster than recursive one. Now just hang our rule chain to expression
(staring from lowest possible precedence):

````bnf
expression ::=
             bool_or_expression
```` 

And your parser is way faster and copes with all the long files.

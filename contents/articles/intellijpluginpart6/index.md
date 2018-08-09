---
title: IntelliJ Idea plugin . Part 6  - Spacing
author: pribluda
date: 2018-08-09
template: article.jade
tags: jetbrains, intellij, idea, plugin, java, module,facet,configuration, bnf, perser, lexer, jflex, pretty, formatting
lang: en
---

Spacing provider is responsible for managemet ef excess spaces  -  like trailing whitespaces  on line ends or 
after parethesises or whatever.   It is created by **FormattingModelBuilder**

<span class="more"/>

### MMTalkFormattingBuildingModel

Spacing builder is provided via factory method,  which we have to override:

````java

    private static final TokenSet snugLeft = TokenSet.create(
            MMTalkTypes.BRACKET_OPEN, MMTalkTypes.PAREN_OPEN, MMTalkTypes.BRACKET_CLOSE,
            MMTalkTypes.PAREN_CLOSE, MMTalkTypes.ROUND_PARAMS,
            MMTalkTypes.SQUARE_PARAMS, MMTalkTypes.DOT_INVOCATION);

    private static final TokenSet snugRight = TokenSet.create( MMTalkTypes.BRACKET_OPEN, MMTalkTypes.PAREN_OPEN);


    public static SpacingBuilder createSpacingBuilder(CodeStyleSettings settings) {
        int spacesBeforeAssigment = 1;
        int spacesAfterAssignment = 1;

        return (new SpacingBuilder(settings, MMTalkLanguage.INSTANCE))
                // terminator always to the left.  up to 4 lines after
                .before(MMTalkTypes.TERMINATOR).spacing(0,0,0,false,4)
                // do not separate  dot from invocation,  never
                .after(MMTalkTypes.DOT).spacing(0, 0, 0, false, 0)
                .before(snugLeft).spacing(0, 0, 0, true, 4)
                .after(snugRight).spacing(0, 0, 0, true, 4)
                .before(MMTalkTypes.ASSIGMENT).spacing(spacesBeforeAssigment, spacesBeforeAssigment, 0, true, 0)
                .after(MMTalkTypes.ASSIGMENT).spacing(spacesAfterAssignment, spacesAfterAssignment, 0, true, 3)
                .withinPair(MMTalkTypes.PAREN_OPEN, MMTalkTypes.PAREN_CLOSE).spaceIf(false, true)
                .withinPair(MMTalkTypes.BRACKET_OPEN, MMTalkTypes.BRACKET_CLOSE).spaceIf(false, true);
    }
 
```` 

It receives code style settings (which are stored somewhere by IntelliJ and can be edited via respective control panels) - on our 
case we do not have any special settings to edit, and just ignore paramter. Actual spacing builder is configured via factory methods.
 
Methods are preyy self explanatory:

* we like our terminator symbol ( **;**) to be the last symbol on line,   we like ot to be directly after terminator,  not allowing 
  it to be on next line, even if user explicitely inserted line break, but up to 4 blank lines after it. 
* **.** Symbol is kind of function onvication on object,  and we do not like to have anyspaces or line breaks around it
* We have symbols which have to be glued to the left and right,   but there is OK to have  line breaks and up to 4 blank lines
* Our assigment symbol **:=**  has to have spaces around, and we allow line breaks
* Braket pairs shall have no spaces inside

This already does some job  with formatting,   but it can be overriden by block formatting and indentation 
(more about it in the next part )
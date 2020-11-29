---
title: Genderstern weg
author: pribluda
date: 2020-11-23
template: article.pug
lang: de
tags: js, userscript, genderstern
description: Genderstern entfernen, Lesbartkeit verbessern. 
---

Kennt iht diesen Komischen Sternzeicheninnen innerhalb von w&ouml;rter, da wo einfach plural stehen sollte? Manche glauben so geh&ouml;rt es sich heutzutage. 
 
 <span class="more"></span>

Und die haben nat&uuml;rlich Recht - auch wenn Duden dagegen ist - d&uuml;rfen die so schreiben.  Aber sie m&uuml;ssen es nicht lesen. Denn modere Browser 
unterst&uuml;tzen Plugins und sind in der Lage Webseiten  ihren Bed&uuml;rfnissen anzupassen -  wie zum Beispiel Werbung entfernen,   oder laute Videos 
deaktivieren.

Um Genderstern nicht mehr sehen zu m&uuml;ssen braucht man einen einfachen  Javascript und etwa 10 Minuten Arbeit. Und so geht es.

 * Script Manager installieren ([Tampermokey](https://www.tampermonkey.net/)  zum Beispiel )
 * Diesen kleinen Script einspielen ([diesen Link benutzen](/assets/userscript/degenderator/Degenderator.user.js))
 
```javascript
// ==UserScript==
// @name         Degenderator
// @namespace    http://www.pribluda.de/
// @version      0.1
// @description  improve reader experience by removing gendrerstern
// @include *
// @author       Konstantin Pribluda
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const traverse = function(node) {
        if(node){
            if(node.nodeType == Node.TEXT_NODE)
            {
                node.data = node.data.replace(/[*:_]innen/gi,"")
            }
            else
                if(node.nodeType == Node.ELEMENT_NODE)
                { node.childNodes.forEach(traverse)}
        }
    }
    document.body.childNodes.forEach(traverse)
})();
```

Was macht es? Nichts weltbewegendes.  Es gent einfach alle Texte auf der Webseite durch und entfernt Genderstern.  Jetzt 
m&uuml;ssen sie es nicht mehr lesen. Ich werde mal sagen, es is ist zu 90% effektiv -  bis den Schreibern etwas neues einf&aumllt.   
Aber dann kann man es updaten.

Hier noch mal zu Kontrolle:
```ignorelang
Keine Sonderzeichen*innen sollten_innen hier:innen zu sehen sein    
```

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
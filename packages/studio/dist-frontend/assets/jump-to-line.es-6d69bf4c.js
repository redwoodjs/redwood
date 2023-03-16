import{a as d}from"./codemirror.es-359dc661.js";import{a as g}from"./dialog.es-3adbbe10.js";import"./index-f0341760.js";var h=Object.defineProperty,l=(a,p)=>h(a,"name",{value:p,configurable:!0});function c(a,p){return p.forEach(function(r){r&&typeof r!="string"&&!Array.isArray(r)&&Object.keys(r).forEach(function(i){if(i!=="default"&&!(i in a)){var u=Object.getOwnPropertyDescriptor(r,i);Object.defineProperty(a,i,u.get?u:{enumerable:!0,get:function(){return r[i]}})}})}),Object.freeze(Object.defineProperty(a,Symbol.toStringTag,{value:"Module"}))}l(c,"_mergeNamespaces");var m={exports:{}};(function(a,p){(function(r){r(d.exports,g.exports)})(function(r){r.defineOption("search",{bottom:!1});function i(e,o,n,t,s){e.openDialog?e.openDialog(o,s,{value:t,selectValueOnOpen:!0,bottom:e.options.search.bottom}):s(prompt(n,t))}l(i,"dialog");function u(e){return e.phrase("Jump to line:")+' <input type="text" style="width: 10em" class="CodeMirror-search-field"/> <span style="color: #888" class="CodeMirror-search-hint">'+e.phrase("(Use line:column or scroll% syntax)")+"</span>"}l(u,"getJumpDialog");function f(e,o){var n=Number(o);return/^[-+]/.test(o)?e.getCursor().line+n:n-1}l(f,"interpretLine"),r.commands.jumpToLine=function(e){var o=e.getCursor();i(e,u(e),e.phrase("Jump to line:"),o.line+1+":"+o.ch,function(n){if(n){var t;if(t=/^\s*([\+\-]?\d+)\s*\:\s*(\d+)\s*$/.exec(n))e.setCursor(f(e,t[1]),Number(t[2]));else if(t=/^\s*([\+\-]?\d+(\.\d+)?)\%\s*/.exec(n)){var s=Math.round(e.lineCount()*Number(t[1])/100);/^[-+]/.test(t[1])&&(s=o.line+s+1),e.setCursor(s-1,o.ch)}else(t=/^\s*\:?\s*([\+\-]?\d+)\s*/.exec(n))&&e.setCursor(f(e,t[1]),o.ch)}})},r.keyMap.default["Alt-G"]="jumpToLine"})})();var b=m.exports,x=c({__proto__:null,default:b},[m.exports]);export{x as j};

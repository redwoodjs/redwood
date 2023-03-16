import{a as G}from"./codemirror.es-359dc661.js";import"./index-f0341760.js";var H=Object.defineProperty,h=(P,y)=>H(P,"name",{value:y,configurable:!0});function D(P,y){return y.forEach(function(n){n&&typeof n!="string"&&!Array.isArray(n)&&Object.keys(n).forEach(function(d){if(d!=="default"&&!(d in P)){var o=Object.getOwnPropertyDescriptor(n,d);Object.defineProperty(P,d,o.get?o:{enumerable:!0,get:function(){return n[d]}})}})}),Object.freeze(Object.defineProperty(P,Symbol.toStringTag,{value:"Module"}))}h(D,"_mergeNamespaces");var q={exports:{}};(function(P,y){(function(n){n(G.exports)})(function(n){var d={pairs:`()[]{}''""`,closeBefore:`)]}'":;>`,triples:"",explode:"[]{}"},o=n.Pos;n.defineOption("autoCloseBrackets",!1,function(e,t,a){a&&a!=n.Init&&(e.removeKeyMap(B),e.state.closeBrackets=null),t&&(_(b(t,"pairs")),e.state.closeBrackets=t,e.addKeyMap(B))});function b(e,t){return t=="pairs"&&typeof e=="string"?e:typeof e=="object"&&e[t]!=null?e[t]:d[t]}h(b,"getOption");var B={Backspace:$,Enter:F};function _(e){for(var t=0;t<e.length;t++){var a=e.charAt(t),i="'"+a+"'";B[i]||(B[i]=I(a))}}h(_,"ensureBound"),_(d.pairs+"`");function I(e){return function(t){return L(t,e)}}h(I,"handler");function x(e){var t=e.state.closeBrackets;if(!t||t.override)return t;var a=e.getModeAt(e.getCursor());return a.closeBrackets||t}h(x,"getConfig");function $(e){var t=x(e);if(!t||e.getOption("disableInput"))return n.Pass;for(var a=b(t,"pairs"),i=e.listSelections(),r=0;r<i.length;r++){if(!i[r].empty())return n.Pass;var f=j(e,i[r].head);if(!f||a.indexOf(f)%2!=0)return n.Pass}for(var r=i.length-1;r>=0;r--){var l=i[r].head;e.replaceRange("",o(l.line,l.ch-1),o(l.line,l.ch+1),"+delete")}}h($,"handleBackspace");function F(e){var t=x(e),a=t&&b(t,"explode");if(!a||e.getOption("disableInput"))return n.Pass;for(var i=e.listSelections(),r=0;r<i.length;r++){if(!i[r].empty())return n.Pass;var f=j(e,i[r].head);if(!f||a.indexOf(f)%2!=0)return n.Pass}e.operation(function(){var l=e.lineSeparator()||`
`;e.replaceSelection(l+l,null),O(e,-1),i=e.listSelections();for(var g=0;g<i.length;g++){var k=i[g].head.line;e.indentLine(k,null,!0),e.indentLine(k+1,null,!0)}})}h(F,"handleEnter");function O(e,t){for(var a=[],i=e.listSelections(),r=0,f=0;f<i.length;f++){var l=i[f];l.head==e.getCursor()&&(r=f);var g=l.head.ch||t>0?{line:l.head.line,ch:l.head.ch+t}:{line:l.head.line-1};a.push({anchor:g,head:g})}e.setSelections(a,r)}h(O,"moveSel");function K(e){var t=n.cmpPos(e.anchor,e.head)>0;return{anchor:new o(e.anchor.line,e.anchor.ch+(t?-1:1)),head:new o(e.head.line,e.head.ch+(t?1:-1))}}h(K,"contractSelection");function L(e,t){var a=x(e);if(!a||e.getOption("disableInput"))return n.Pass;var i=b(a,"pairs"),r=i.indexOf(t);if(r==-1)return n.Pass;for(var f=b(a,"closeBefore"),l=b(a,"triples"),g=i.charAt(r+1)==t,k=e.listSelections(),R=r%2==0,c,E=0;E<k.length;E++){var W=k[E],s=W.head,p,A=e.getRange(s,o(s.line,s.ch+1));if(R&&!W.empty())p="surround";else if((g||!R)&&A==t)g&&N(e,s)?p="both":l.indexOf(t)>=0&&e.getRange(s,o(s.line,s.ch+3))==t+t+t?p="skipThree":p="skip";else if(g&&s.ch>1&&l.indexOf(t)>=0&&e.getRange(o(s.line,s.ch-2),s)==t+t){if(s.ch>2&&/\bstring/.test(e.getTokenTypeAt(o(s.line,s.ch-2))))return n.Pass;p="addFour"}else if(g){var z=s.ch==0?" ":e.getRange(o(s.line,s.ch-1),s);if(!n.isWordChar(A)&&z!=t&&!n.isWordChar(z))p="both";else return n.Pass}else if(R&&(A.length===0||/\s/.test(A)||f.indexOf(A)>-1))p="both";else return n.Pass;if(!c)c=p;else if(c!=p)return n.Pass}var S=r%2?i.charAt(r-1):t,w=r%2?t:i.charAt(r+1);e.operation(function(){if(c=="skip")O(e,1);else if(c=="skipThree")O(e,3);else if(c=="surround"){for(var u=e.getSelections(),v=0;v<u.length;v++)u[v]=S+u[v]+w;e.replaceSelections(u,"around"),u=e.listSelections().slice();for(var v=0;v<u.length;v++)u[v]=K(u[v]);e.setSelections(u)}else c=="both"?(e.replaceSelection(S+w,null),e.triggerElectric(S+w),O(e,-1)):c=="addFour"&&(e.replaceSelection(S+S+S+S,"before"),O(e,1))})}h(L,"handleChar");function j(e,t){var a=e.getRange(o(t.line,t.ch-1),o(t.line,t.ch+1));return a.length==2?a:null}h(j,"charsAround");function N(e,t){var a=e.getTokenAt(o(t.line,t.ch+1));return/\bstring/.test(a.type)&&a.start==t.ch&&(t.ch==0||!/\bstring/.test(e.getTokenTypeAt(t)))}h(N,"stringStartsAfter")})})();var J=q.exports,U=D({__proto__:null,default:J},[q.exports]);export{U as c};

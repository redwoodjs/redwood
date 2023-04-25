import{C as c}from"./codemirror.es-2fb7d200.js";import{o as d,H as e,I as s,M as l}from"./index-17331a0b.js";var b=Object.defineProperty,p=(t,r)=>b(t,"name",{value:r,configurable:!0});c.defineMode("graphql-results",t=>{const r=d({eatWhitespace:n=>n.eatSpace(),lexRules:V,parseRules:f,editorConfig:{tabSize:t.tabSize}});return{config:t,startState:r.startState,token:r.token,indent:i,electricInput:/^\s*[}\]]/,fold:"brace",closeBrackets:{pairs:'[]{}""',explode:"[]{}"}}});function i(t,r){var n,u;const{levels:a,indentLevel:o}=t;return((!a||a.length===0?o:a[a.length-1]-(!((n=this.electricInput)===null||n===void 0)&&n.test(r)?1:0))||0)*(((u=this.config)===null||u===void 0?void 0:u.indentUnit)||0)}p(i,"indent");const V={Punctuation:/^\[|]|\{|\}|:|,/,Number:/^-?(?:0|(?:[1-9][0-9]*))(?:\.[0-9]*)?(?:[eE][+-]?[0-9]+)?/,String:/^"(?:[^"\\]|\\(?:"|\/|\\|b|f|n|r|t|u[0-9a-fA-F]{4}))*"?/,Keyword:/^true|false|null/},f={Document:[e("{"),s("Entry",e(",")),e("}")],Entry:[l("String","def"),e(":"),"Value"],Value(t){switch(t.kind){case"Number":return"NumberValue";case"String":return"StringValue";case"Punctuation":switch(t.value){case"[":return"ListValue";case"{":return"ObjectValue"}return null;case"Keyword":switch(t.value){case"true":case"false":return"BooleanValue";case"null":return"NullValue"}return null}},NumberValue:[l("Number","number")],StringValue:[l("String","string")],BooleanValue:[l("Keyword","builtin")],NullValue:[l("Keyword","keyword")],ListValue:[e("["),s("Value",e(",")),e("]")],ObjectValue:[e("{"),s("ObjectField",e(",")),e("}")],ObjectField:[l("String","property"),e(":"),"Value"]};

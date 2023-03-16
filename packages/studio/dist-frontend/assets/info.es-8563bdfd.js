import{C as g}from"./codemirror.es-359dc661.js";import{g as y,a as M,b as V,c as _,d as x,e as u}from"./SchemaReference.es-ce9273dc.js";import"./info-addon.es-9c6de374.js";import{n as f,q as p}from"./index-f0341760.js";import"./forEachState.es-1e367fb2.js";var A=Object.defineProperty,l=(d,e)=>A(d,"name",{value:e,configurable:!0});g.registerHelper("info","graphql",(d,e)=>{if(!e.schema||!d.state)return;const{kind:a,step:n}=d.state,r=y(e.schema,d.state);if(a==="Field"&&n===0&&r.fieldDef||a==="AliasedField"&&n===2&&r.fieldDef){const c=document.createElement("div");c.className="CodeMirror-info-header",v(c,r,e);const i=document.createElement("div");return i.appendChild(c),o(i,e,r.fieldDef),i}if(a==="Directive"&&n===1&&r.directiveDef){const c=document.createElement("div");c.className="CodeMirror-info-header",D(c,r,e);const i=document.createElement("div");return i.appendChild(c),o(i,e,r.directiveDef),i}if(a==="Argument"&&n===0&&r.argDef){const c=document.createElement("div");c.className="CodeMirror-info-header",C(c,r,e);const i=document.createElement("div");return i.appendChild(c),o(i,e,r.argDef),i}if(a==="EnumValue"&&r.enumValue&&r.enumValue.description){const c=document.createElement("div");c.className="CodeMirror-info-header",E(c,r,e);const i=document.createElement("div");return i.appendChild(c),o(i,e,r.enumValue),i}if(a==="NamedType"&&r.type&&r.type.description){const c=document.createElement("div");c.className="CodeMirror-info-header",m(c,r,e,r.type);const i=document.createElement("div");return i.appendChild(c),o(i,e,r.type),i}});function v(d,e,a){h(d,e,a),s(d,e,a,e.type)}l(v,"renderField");function h(d,e,a){var n;const r=((n=e.fieldDef)===null||n===void 0?void 0:n.name)||"";t(d,r,"field-name",a,M(e))}l(h,"renderQualifiedField");function D(d,e,a){var n;const r="@"+(((n=e.directiveDef)===null||n===void 0?void 0:n.name)||"");t(d,r,"directive-name",a,V(e))}l(D,"renderDirective");function C(d,e,a){var n;const r=((n=e.argDef)===null||n===void 0?void 0:n.name)||"";t(d,r,"arg-name",a,_(e)),s(d,e,a,e.inputType)}l(C,"renderArg");function E(d,e,a){var n;const r=((n=e.enumValue)===null||n===void 0?void 0:n.name)||"";m(d,e,a,e.inputType),t(d,"."),t(d,r,"enum-value",a,x(e))}l(E,"renderEnumValue");function s(d,e,a,n){const r=document.createElement("span");r.className="type-name-pill",n instanceof f?(m(r,e,a,n.ofType),t(r,"!")):n instanceof p?(t(r,"["),m(r,e,a,n.ofType),t(r,"]")):t(r,(n==null?void 0:n.name)||"","type-name",a,u(e,n)),d.appendChild(r)}l(s,"renderTypeAnnotation");function m(d,e,a,n){n instanceof f?(m(d,e,a,n.ofType),t(d,"!")):n instanceof p?(t(d,"["),m(d,e,a,n.ofType),t(d,"]")):t(d,(n==null?void 0:n.name)||"","type-name",a,u(e,n))}l(m,"renderType");function o(d,e,a){const{description:n}=a;if(n){const r=document.createElement("div");r.className="info-description",e.renderDescription?r.innerHTML=e.renderDescription(n):r.appendChild(document.createTextNode(n)),d.appendChild(r)}T(d,e,a)}l(o,"renderDescription");function T(d,e,a){const n=a.deprecationReason;if(n){const r=document.createElement("div");r.className="info-deprecation",d.appendChild(r);const c=document.createElement("span");c.className="info-deprecation-label",c.appendChild(document.createTextNode("Deprecated")),r.appendChild(c);const i=document.createElement("div");i.className="info-deprecation-reason",e.renderDescription?i.innerHTML=e.renderDescription(n):i.appendChild(document.createTextNode(n)),r.appendChild(i)}}l(T,"renderDeprecation");function t(d,e,a="",n={onClick:null},r=null){if(a){const{onClick:c}=n;let i;c?(i=document.createElement("a"),i.href="javascript:void 0",i.addEventListener("click",N=>{c(r,N)})):i=document.createElement("span"),i.className=a,i.appendChild(document.createTextNode(e)),d.appendChild(i)}else d.appendChild(document.createTextNode(e))}l(t,"text");

(async function(){

if(window.__AVIA_APPLE_EMOJI__)return;
window.__AVIA_APPLE_EMOJI__=true;

const DATA_URL="https://cdn.jsdelivr.net/npm/emoji-datasource-apple@16.0.0/+esm";
const APPLE_CDN="https://cdn.jsdelivr.net/npm/emoji-datasource-apple@16.0.0/img/apple/64/";

const map=new Map();

function add(key,image){
if(!key||!image)return;
map.set(String(key).toUpperCase(),image);
}

function ingest(entry){
if(!entry)return;
add(entry.unified,entry.image);
add(entry.non_qualified,entry.image);
add(entry.obsoletes,entry.image);
if(entry.skin_variations){
for(const k in entry.skin_variations)ingest(entry.skin_variations[k]);
}
}

function candidates(code){
const s=String(code).toUpperCase();
const out=[s];

const noFe0f=s.replace(/-FE0F(?=-|$)/g,"");
if(noFe0f!==s)out.push(noFe0f);

if(/-20E3$/i.test(s))out.push(s.replace(/-20E3$/i,"-FE0F-20E3"));
if(/-20E3$/i.test(noFe0f))out.push(noFe0f.replace(/-20E3$/i,"-FE0F-20E3"));

return [...new Set(out)];
}

function lookup(code){
for(const c of candidates(code)){
if(map.has(c))return map.get(c);
}
return null;
}

function convert(img){
if(!img||!img.src)return;

const m=img.src.match(/\/emoji\/twemoji\/([0-9a-f-]+)\.svg(?:\?v=\d+)?$/i);
if(!m)return;

const file=lookup(m[1]);

if(file){
img.src=APPLE_CDN+file;
return;
}

const fallback=candidates(m[1])[0].toLowerCase();
img.src=APPLE_CDN+fallback+".png";
}

function rename(node){
if(node.nodeType===3&&node.nodeValue.includes("Twemoji")){
node.nodeValue=node.nodeValue.replace(/Twemoji/g,"Apple Emoji");
}
}

function scan(root=document){
if(root.nodeType===1){
root.querySelectorAll("img").forEach(convert);
}

const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
let n;
while(n=w.nextNode())rename(n);
}

try{
const mod=await import(DATA_URL);
const data=Array.isArray(mod.default)?mod.default:[];
for(const entry of data)ingest(entry);
}catch(e){}

const obs=new MutationObserver(m=>{
for(const r of m){
for(const n of r.addedNodes){
if(n.nodeType===1){
if(n.tagName==="IMG")convert(n);
scan(n);
}else if(n.nodeType===3){
rename(n);
}
}
}
});

obs.observe(document.body,{childList:true,subtree:true});
scan();

})();
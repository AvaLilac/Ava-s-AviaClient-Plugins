(function(){

if(window.__AVIA_APPLE_EMOJI__)return;
window.__AVIA_APPLE_EMOJI__=true;

const APPLE_CDN="https://cdn.jsdelivr.net/gh/iamcal/emoji-data/img-apple-160/";

function convert(img){
if(!img||!img.src)return;

const m=img.src.match(/\/emoji\/[^\/]+\/([0-9a-f\-]+)\.(svg|png)/);
if(!m)return;

img.src=APPLE_CDN+m[1]+".png";
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

const obs=new MutationObserver(m=>{
for(const r of m){
for(const n of r.addedNodes){
if(n.tagName==="IMG")convert(n);
scan(n);
}
}
});

obs.observe(document.body,{childList:true,subtree:true});
scan();

})();

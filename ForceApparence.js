(function(){

if(window.__AVIA_FORCE_APPEARANCE__)return;
window.__AVIA_FORCE_APPEARANCE__=true;

function setAppearanceLabel(root=document){
const links=root.querySelectorAll("a.pos_relative.min-w_0.d_flex.ai_center");

links.forEach(a=>{
const svg=a.querySelector("svg");
if(!svg)return;

const path=svg.querySelector("path");
if(!path)return;

if(path.getAttribute("d")?.startsWith("M12 22C6.49 22")){

const label=a.querySelector("div.ov_hidden");
if(label&&label.textContent!=="Appearance"){
label.textContent="Appearance";
}

}
});
}

const observer=new MutationObserver(muts=>{
for(const m of muts){
for(const n of m.addedNodes){
if(!(n instanceof HTMLElement))continue;
setAppearanceLabel(n);
}
}
});

observer.observe(document.body,{childList:true,subtree:true});

setAppearanceLabel();

})();

(function(){

delete window.__AVIA_MONACO_CLONE__;

const monacoPanel=document.getElementById("avia-monaco-panel");
if(monacoPanel)monacoPanel.remove();

document.querySelectorAll("script").forEach(s=>{
    if(s.textContent && s.textContent.includes("__AVIA_MONACO_CLONE__")){
        s.remove();
    }
});

if(window.runningPlugins){
    Object.keys(window.runningPlugins).forEach(k=>{
        if(window.runningPlugins[k]?.textContent?.includes("__AVIA_MONACO_CLONE__")){
            window.runningPlugins[k].remove();
            delete window.runningPlugins[k];
        }
    });
}

console.log("Monaco plugin removed. QuickCSS untouched.");

})();

(function(){

if(window.__AVIA_MONACO_CLONE__)return;
window.__AVIA_MONACO_CLONE__=true;

function preloadMonaco(){
    return new Promise(resolve=>{
        if(window.monaco)return resolve();
        const loader=document.createElement("script");
        loader.src="https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js";
        loader.onload=function(){
            require.config({
                paths:{vs:"https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs"}
            });
            require(["vs/editor/editor.main"],()=>resolve());
        };
        document.head.appendChild(loader);
    });
}

function setIcon(button){
    const oldSvg=button.querySelector("svg");
    if(oldSvg)oldSvg.remove();

    const pathData="M8.7 16.3L4.4 12l4.3-4.3 1.4 1.4L7.2 12l2.9 2.9-1.4 1.4zm6.6 0l-1.4-1.4L16.8 12l-2.9-2.9 1.4-1.4L19.6 12l-4.3 4.3z";

    const svgNS="http://www.w3.org/2000/svg";
    const svg=document.createElementNS(svgNS,"svg");
    svg.setAttribute("viewBox","0 0 24 24");
    svg.setAttribute("width","20");
    svg.setAttribute("height","20");
    svg.setAttribute("fill","currentColor");
    svg.style.marginRight="8px";

    const path=document.createElementNS(svgNS,"path");
    path.setAttribute("d",pathData);
    svg.appendChild(path);

    button.insertBefore(svg,button.firstChild);
}

async function openMonacoPanel(){

    await preloadMonaco();

    let panel=document.getElementById("avia-monaco-panel");
    if(panel){
        panel.style.display=panel.style.display==="none"?"flex":"none";
        return;
    }

    panel=document.createElement("div");
    panel.id="avia-monaco-panel";

    Object.assign(panel.style,{
        position:"fixed",
        bottom:"24px",
        right:"24px",
        width:"650px",
        height:"420px",
        background:"var(--md-sys-color-surface,#1e1e1e)",
        borderRadius:"16px",
        boxShadow:"0 8px 28px rgba(0,0,0,0.35)",
        zIndex:"999999",
        display:"flex",
        flexDirection:"column",
        overflow:"hidden",
        border:"1px solid rgba(255,255,255,0.08)",
        backdropFilter:"blur(12px)"
    });

    const header=document.createElement("div");
    header.textContent="Monaco QuickCSS";
    Object.assign(header.style,{
        padding:"14px 16px",
        fontWeight:"600",
        fontSize:"14px",
        letterSpacing:"0.3px",
        background:"var(--md-sys-color-surface-container,rgba(255,255,255,0.04))",
        borderBottom:"1px solid rgba(255,255,255,0.08)",
        cursor:"move",
        color:"#fff"
    });

    const closeBtn=document.createElement("div");
    closeBtn.textContent="✕";
    Object.assign(closeBtn.style,{
        position:"absolute",
        top:"12px",
        right:"16px",
        cursor:"pointer",
        opacity:"0.7",
        color:"#fff"
    });
    closeBtn.onmouseenter=()=>closeBtn.style.opacity="1";
    closeBtn.onmouseleave=()=>closeBtn.style.opacity="0.7";
    closeBtn.onclick=()=>panel.style.display="none";

    const editorContainer=document.createElement("div");
    editorContainer.style.flex="1";

    panel.appendChild(header);
    panel.appendChild(closeBtn);
    panel.appendChild(editorContainer);
    document.body.appendChild(panel);

    const editor=monaco.editor.create(editorContainer,{
        value:localStorage.getItem("avia_quickcss")||"",
        language:"css",
        theme:"vs-dark",
        automaticLayout:true,
        minimap:{enabled:false},
        fontSize:13,
        scrollBeyondLastLine:false,
        wordWrap:"on"
    });

    editor.onDidChangeModelContent(()=>{
        const value=editor.getValue();
        localStorage.setItem("avia_quickcss",value);

        let styleTag=document.getElementById("avia-quickcss-style");
        if(!styleTag){
            styleTag=document.createElement("style");
            styleTag.id="avia-quickcss-style";
            document.head.appendChild(styleTag);
        }
        styleTag.textContent=value;
    });

    let isDragging=false,offsetX,offsetY;

    header.addEventListener("mousedown",e=>{
        isDragging=true;
        offsetX=e.clientX-panel.offsetLeft;
        offsetY=e.clientY-panel.offsetTop;
        document.body.style.userSelect="none";
    });

    document.addEventListener("mouseup",()=>{
        isDragging=false;
        document.body.style.userSelect="";
    });

    document.addEventListener("mousemove",e=>{
        if(!isDragging)return;
        panel.style.left=(e.clientX-offsetX)+"px";
        panel.style.top=(e.clientY-offsetY)+"px";
        panel.style.right="auto";
        panel.style.bottom="auto";
    });
}

function injectButton(){

    const appearanceBtn=Array.from(document.querySelectorAll("a"))
        .find(a=>a.textContent.trim()==="Appearance");
    if(!appearanceBtn)return;

    if(document.getElementById("stoat-monaco-quickcss"))return;

    const baseBtn=document.getElementById("stoat-fake-quickcss");
    if(!baseBtn)return;

    const monacoBtn=appearanceBtn.cloneNode(true);
    monacoBtn.id="stoat-monaco-quickcss";

    const textNode=Array.from(monacoBtn.querySelectorAll("div"))
        .find(d=>d.children.length===0);

    if(textNode)textNode.textContent="(Avia) Monaco QuickCSS";

    setIcon(monacoBtn);

    monacoBtn.addEventListener("click",openMonacoPanel);

    baseBtn.parentElement.insertBefore(monacoBtn,baseBtn.nextSibling);
}

function waitForBody(callback){
    if(document.body)callback();
    else new MutationObserver((obs)=>{
        if(document.body){
            obs.disconnect();
            callback();
        }
    }).observe(document.documentElement,{childList:true});
}

waitForBody(()=>{
    const observer=new MutationObserver(()=>injectButton());
    observer.observe(document.body,{childList:true,subtree:true});
    injectButton();
});

preloadMonaco();

})();Q

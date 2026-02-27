(function(){

if(window.__AVIA_MONACO_OVERRIDE__)return;
window.__AVIA_MONACO_OVERRIDE__=true;

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

async function openMonacoPanel(){

    await preloadMonaco();

    const old=document.getElementById("avia-quickcss-panel");
    if(old)old.remove();

    const panel=document.createElement("div");
    panel.id="avia-quickcss-panel";

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
    header.textContent="QuickCSS";
    Object.assign(header.style,{
        padding:"14px 16px",
        fontWeight:"600",
        fontSize:"14px",
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
    closeBtn.onclick=()=>panel.remove();

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
        fontFamily:"monospace",
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

function hijackButton(){
    const btn=document.getElementById("stoat-fake-quickcss");
    if(!btn){
        requestAnimationFrame(hijackButton);
        return;
    }
    btn.onclick=e=>{
        e.stopImmediatePropagation();
        e.preventDefault();
        openMonacoPanel();
    };
}

preloadMonaco();
hijackButton();

})();

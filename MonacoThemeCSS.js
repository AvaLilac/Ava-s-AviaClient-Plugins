(function(){
if(window.__AVIA_THEME_MONACO_PATCH__)return;
window.__AVIA_THEME_MONACO_PATCH__=true;

const STORAGE_KEY="avia_themes";

function getThemes(){ return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]"); }
function setThemes(data){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

function applyThemesNow(){
  document.querySelectorAll(".avia-theme-style").forEach(e=>e.remove());
  const themes = getThemes();
  themes.forEach(theme=>{
    if(!theme.enabled) return;
    const style = document.createElement("style");
    style.className = "avia-theme-style";
    style.textContent = theme.css;
    document.head.appendChild(style);
  });
  if(window.__avia_refresh_themes_panel) window.__avia_refresh_themes_panel();
}

function preloadMonaco(){
  return new Promise(resolve=>{
    if(window.monaco) return resolve();
    const loader=document.createElement("script");
    loader.src="https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js";
    loader.onload=function(){
      require.config({paths:{vs:"https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs"}});
      require(["vs/editor/editor.main"],()=>resolve());
    };
    document.head.appendChild(loader);
  });
}

async function openThemeMonaco(theme){
  await preloadMonaco();

  const old = document.getElementById("avia-theme-editor");
  if(old) old.remove();

  let panel = document.getElementById("avia-theme-monaco");
  if(!panel){
    panel = document.createElement("div");
    panel.id = "avia-theme-monaco";
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

    const header = document.createElement("div");
    header.id="avia-theme-monaco-header";
    Object.assign(header.style,{
      padding:"14px 16px",
      fontWeight:"600",
      fontSize:"14px",
      letterSpacing:"0.3px",
      background:"rgba(255,255,255,0.04)",
      borderBottom:"1px solid rgba(255,255,255,0.08)",
      cursor:"move",
      color:"#fff"
    });

    const close = document.createElement("div");
    close.textContent = "✕";
    Object.assign(close.style,{
      position:"absolute",
      top:"12px",
      right:"16px",
      cursor:"pointer",
      opacity:"0.7",
      color:"#fff"
    });
    close.onmouseenter = ()=> close.style.opacity="1";
    close.onmouseleave = ()=> close.style.opacity="0.7";
    close.onclick = ()=> panel.style.display="none";

    const editorDiv = document.createElement("div");
    editorDiv.id = "avia-theme-monaco-editor";
    editorDiv.style.flex = "1";

    panel.appendChild(header);
    panel.appendChild(close);
    panel.appendChild(editorDiv);
    document.body.appendChild(panel);

    const editor = monaco.editor.create(editorDiv,{
      value:"",
      language:"css",
      theme:"vs-dark",
      automaticLayout:true,
      minimap:{enabled:false},
      fontSize:13,
      scrollBeyondLastLine:false,
      wordWrap:"on"
    });

    window.__aviaThemeMonacoEditor = editor;

    let dragging=false, ox=0, oy=0;
    header.addEventListener("mousedown", e=>{
      dragging=true;
      ox=e.clientX-panel.offsetLeft;
      oy=e.clientY-panel.offsetTop;
      document.body.style.userSelect="none";
    });
    document.addEventListener("mouseup", ()=>{
      dragging=false;
      document.body.style.userSelect="";
    });
    document.addEventListener("mousemove", e=>{
      if(!dragging) return;
      panel.style.left = (e.clientX-ox) + "px";
      panel.style.top  = (e.clientY-oy) + "px";
      panel.style.right = "auto";
      panel.style.bottom= "auto";
    });
  }

  panel.style.display = "flex";

  const headerEl = document.getElementById("avia-theme-monaco-header");
  const nameMatch = theme.css.match(/@name\s+(.+)/);
  const themeName = nameMatch ? nameMatch[1].trim() : (theme.name||"Theme");
  headerEl.textContent = `Theme Editor - "${themeName}"`;

  const editor = window.__aviaThemeMonacoEditor;
  editor.setValue(theme.css);
  editor.focus();

  if(window.__aviaThemeMonacoListener){
    try{ window.__aviaThemeMonacoListener.dispose?.(); }catch(e){}
    window.__aviaThemeMonacoListener = null;
  }

  window.__aviaThemeMonacoListener = editor.onDidChangeModelContent(()=>{
    const value = editor.getValue();
    const themes = getThemes();
    const t = themes.find(x=>x.id===theme.id);
    if(!t) return;
    t.css = value;
    const name = value.match(/@name\s+(.+)/)?.[1]?.trim();
    const author = value.match(/@author\s+(.+)/)?.[1]?.trim();
    const version = value.match(/@version\s+(.+)/)?.[1]?.trim();
    const desc = value.match(/@description\s+(.+)/)?.[1]?.trim();
    if(name) t.name = name;
    if(author) t.author = author;
    if(version) t.version = version;
    if(desc) t.description = desc;
    setThemes(themes);
    applyThemesNow();
  });
}

function patchEditButtons(){
  const panel = document.getElementById("avia-themes-panel");
  if(!panel) return;
  const list = Array.from(panel.children).find(c=>{
    const s = c.style || {};
    return (s.overflowY==='auto' || c.querySelectorAll && c.querySelectorAll('div').length>0 && c.style.display==='flex');
  }) || panel.querySelector("div:nth-child(4)") || panel.querySelector("div[style]");
  const cards = panel.querySelectorAll("div");
  const themes = getThemes();

  const editButtons = Array.from(panel.querySelectorAll("button")).filter(b=>b.textContent.trim()==="Edit");
  editButtons.forEach(btn=>{
    if(btn.dataset.__aviaPatched) return;
    btn.dataset.__aviaPatched = "1";
    btn.addEventListener("click", function(e){
      e.stopPropagation();
      e.preventDefault();
      const card = btn.closest("div");
      if(!card) return;
      let listContainer = card.parentElement;
      while(listContainer && listContainer.id !== "avia-themes-panel"){
        if(listContainer.children.length>1 && Array.from(listContainer.children).every(ch=>ch.nodeType===1)) break;
        listContainer = listContainer.parentElement;
        if(!listContainer) break;
      }
      if(!listContainer) listContainer = card.parentElement;
      const children = Array.from(listContainer.children).filter(n=>n.nodeType===1);
      const index = children.indexOf(card);
      const themesArr = getThemes();
      const theme = themesArr[index] || themesArr.find(t=>{
        const txt = card.querySelector("div")?.textContent?.trim();
        if(!txt) return false;
        const metaName = t.css.match(/@name\s+(.+)/)?.[1] || t.name || "";
        return metaName.trim() === txt.split("\n")[0]?.trim();
      });
      if(!theme) return;
      openThemeMonaco(theme);
    }, {capture:true});
  });
}

const observer = new MutationObserver(()=>{ patchEditButtons(); });
observer.observe(document.body, { childList:true, subtree:true });

patchEditButtons();
applyThemesNow();

})();

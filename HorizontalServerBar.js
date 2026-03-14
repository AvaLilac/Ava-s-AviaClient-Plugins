(function(){

if(window.__HORIZONTAL_SERVER_BAR_JS__) return;
window.__HORIZONTAL_SERVER_BAR_JS__ = true;

const TITLEBAR_HEIGHT = 29;
const SERVERBAR_HEIGHT = 72;

function applyHorizontalServerBar(){

const serverBar = document.querySelector(
".d_flex.flex-d_column.fill_var\\(--md-sys-color-on-surface\\)"
);

if(!serverBar) return;

Object.assign(serverBar.style,{
position:"fixed",
top:TITLEBAR_HEIGHT+"px",
left:"0",
right:"0",
width:"100vw",
height:SERVERBAR_HEIGHT+"px",
zIndex:"10000",
display:"flex",
flexDirection:"row",
alignItems:"center",
justifyContent:"flex-start",
background:"var(--md-sys-color-surface)"
});

const scrollContainer = document.querySelector(
".will-change_transform.scr-bar-w_none.ov-y_scroll.flex-g_1"
);

if(scrollContainer){

Object.assign(scrollContainer.style,{
display:"flex",
flexDirection:"row",
alignItems:"center",
overflowX:"auto",
overflowY:"hidden",
height:SERVERBAR_HEIGHT+"px",
flexGrow:"0"
});

const list = scrollContainer.querySelector('[role="list"]');

if(list){
Object.assign(list.style,{
display:"flex",
flexDirection:"row",
alignItems:"center",
gap:"6px"
});
}

}

document
.querySelectorAll(".h_1px.flex-sh_0.m_6px_auto.w_calc\\(100\\%_-_24px\\)")
.forEach(el=>{
el.style.display="none";
});

const sidebar = document.querySelector(
".d_flex.flex-sh_0.flex-d_column.ov_hidden.bdr-tl_var\\(--borderRadius-lg\\).bdr-bl_var\\(--borderRadius-lg\\).w_var\\(--layout-width-channel-sidebar\\)"
);

if(sidebar){

Object.assign(sidebar.style,{
position:"relative",
top:"0px"
});

}

const rootApp = document.querySelector("body > div");

if(rootApp){
rootApp.style.paddingTop = SERVERBAR_HEIGHT + "px";
}

}

applyHorizontalServerBar();

const observer = new MutationObserver(()=>{
applyHorizontalServerBar();
});

observer.observe(document.body,{
childList:true,
subtree:true
});

})();

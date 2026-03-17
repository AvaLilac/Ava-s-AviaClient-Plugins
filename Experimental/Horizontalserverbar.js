(function(){
const root = document.documentElement;
root.style.setProperty('--titlebar-height','29px');
root.style.setProperty('--serverbar-height','72px');

function setImportant(el, prop, val){
 try{ el.style.setProperty(prop, val, 'important'); }catch(e){}
}

function findServerBars(doc){
 const nodes = Array.from(doc.querySelectorAll('.d_flex.flex-d_column'));
 return nodes.filter(el=>{
  try{
   const cls = Array.from(el.classList).join(' ');
   if(cls.includes('fill_var(--md-sys-color-on-surface)')) return true;
   return Array.from(el.classList).some(c=>c.startsWith('fill_var(') && c.includes('--md-sys-color-on-surface'));
  }catch(e){ return false; }
 });
}

function applyServerBarStyle(serverBar){
 setImportant(serverBar,'position','fixed');
 setImportant(serverBar,'top','var(--titlebar-height)');
 setImportant(serverBar,'left','0');
 setImportant(serverBar,'right','0');
 setImportant(serverBar,'height','var(--serverbar-height)');
 setImportant(serverBar,'width','100vw');
 setImportant(serverBar,'z-index','10000');
 setImportant(serverBar,'display','flex');
 setImportant(serverBar,'flex-direction','row');
 setImportant(serverBar,'align-items','center');
 setImportant(serverBar,'justify-content','flex-start');
 setImportant(serverBar,'background','var(--md-sys-color-surface)');
}

function isInsideAnyServerBar(el, serverBars){
 if(!el) return false;
 for(const sb of serverBars){
  if(sb.contains(el)) return true;
 }
 return false;
}

function applyPushToElement(el, offset, serverBars){
 if(!el || isInsideAnyServerBar(el, serverBars)) return;
 if(el.dataset.__serverbar_pushed === '1') return;
 setImportant(el,'margin-top', offset);
 el.dataset.__serverbar_pushed = '1';
}

function shouldMatchClassSubstr(el, substrs){
 if(!el || !el.className) return false;
 const cn = el.className;
 return substrs.every(s => cn.indexOf(s) !== -1);
}

function applyAll(doc){
 const serverBars = findServerBars(doc);
 serverBars.forEach(applyServerBarStyle);

 const offset = 'calc(var(--titlebar-height) + var(--serverbar-height))';

 const pushSelectors = [
  'body',
  '#app',
  'main',
  '[role="main"]',
  '[class*="layout"]',
  '[class*="content"]',
  '[class*="main"]'
 ];

 pushSelectors.forEach(sel=>{
  try{
   doc.querySelectorAll(sel).forEach(el => applyPushToElement(el, offset, serverBars));
  }catch(e){}
 });

 const substrTargets = [
  'bg_var(--md-sys-color-surface-container-low)',
  'd_flex',
  'w_100%',
  'min-w_0'
 ];
 Array.from(doc.querySelectorAll('*')).forEach(el=>{
  try{
   if(shouldMatchClassSubstr(el, substrTargets)) applyPushToElement(el, offset, serverBars);
  }catch(e){}
 });

 Array.from(doc.querySelectorAll('*')).forEach(el=>{
  try{
   if(el.className && el.className.indexOf('gap_10px') !== -1 && el.className.indexOf('h_48px') !== -1){
    applyPushToElement(el, offset, serverBars);
   }
  }catch(e){}
 });

 const specialSelectorStrings = [
  'will-change_transform scr-bar-c_var(--md-sys-color-primary)_transparent',
  'will-change_transform scr-bar-w_none.ov-y_scroll.flex-g_1'
 ];
 Array.from(doc.querySelectorAll('*')).forEach(el=>{
  try{
   const cn = el.className || '';
   for(const s of specialSelectorStrings){
    if(cn.indexOf(s) !== -1){
     applyPushToElement(el, offset, serverBars);
     break;
    }
   }
  }catch(e){}
 });

 let s = document.getElementById('injected-scrollbar-js');
 if(!s){
  s = document.createElement('style');
  s.id = 'injected-scrollbar-js';
  document.head.appendChild(s);
 }
 s.textContent = '*{scrollbar-width:none!important} ::-webkit-scrollbar{display:none!important}';
}

applyAll(document);

const observer = new MutationObserver((mutations)=>{
 let added = false;
 for(const m of mutations){
  if(m.addedNodes && m.addedNodes.length){ added = true; break; }
 }
 if(added) applyAll(document);
});
observer.observe(document.documentElement, {childList:true, subtree:true});
})();

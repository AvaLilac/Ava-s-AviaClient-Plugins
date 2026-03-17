(function(){
const root = document.documentElement;
root.style.setProperty('--titlebar-height','29px');
root.style.setProperty('--serverbar-height','72px');

function setImportant(el, prop, value){
  try{ el.style.setProperty(prop, value, 'important'); }catch(e){}
}

function applyStyles(scope){
  const docRoot = scope && scope.querySelector ? scope : document;
  const serverBars = docRoot.querySelectorAll('.d_flex.flex-d_column');
  serverBars.forEach(el=>{
    const hasFill = [...el.classList].some(c=>c.startsWith('fill_var(') && c.includes('--md-sys-color-on-surface'));
    if(!hasFill) return;
    setImportant(el,'position','fixed');
    setImportant(el,'top','var(--titlebar-height)');
    setImportant(el,'left','0');
    setImportant(el,'right','0');
    setImportant(el,'height','var(--serverbar-height)');
    setImportant(el,'width','100vw');
    setImportant(el,'z-index','10000');
    setImportant(el,'display','flex');
    setImportant(el,'flex-direction','row');
    setImportant(el,'align-items','center');
    setImportant(el,'justify-content','flex-start');
    setImportant(el,'background','var(--md-sys-color-surface)');
  });

  const scrBars = docRoot.querySelectorAll('.will-change_transform.scr-bar-w_none.ov-y_scroll.flex-g_1');
  scrBars.forEach(el=>{
    setImportant(el,'display','flex');
    setImportant(el,'flex-direction','row');
    setImportant(el,'align-items','center');
    setImportant(el,'overflow-x','auto');
    setImportant(el,'overflow-y','visible');
    setImportant(el,'flex-grow','0');
    setImportant(el,'height','var(--serverbar-height)');
    setImportant(el,'position','relative');
    el.querySelectorAll('[role="list"]').forEach(list=>{
      setImportant(list,'display','flex');
      setImportant(list,'flex-direction','row');
      setImportant(list,'align-items','center');
      setImportant(list,'gap','6px');
    });
  });

  const hiddenBars = docRoot.querySelectorAll('.h_1px.flex-sh_0.m_6px_auto');
  hiddenBars.forEach(el=>{
    const hasWcalc = [...el.classList].some(c=>c.startsWith('w_calc('));
    if(hasWcalc) setImportant(el,'display','none');
  });

  const sideCandidates = docRoot.querySelectorAll('.d_flex.flex-sh_0.flex-d_column');
  sideCandidates.forEach(el=>{
    const cl = [...el.classList].join(' ');
    const hasBdrTL = [...el.classList].some(c=>c.startsWith('bdr-tl_var('));
    const hasBdrBL = [...el.classList].some(c=>c.startsWith('bdr-bl_var('));
    const hasWvar = [...el.classList].some(c=>c.startsWith('w_var('));
    if(!(hasBdrTL && hasBdrBL && hasWvar)) return;
    setImportant(el,'position','relative');
    setImportant(el,'top','calc(var(--titlebar-height) + var(--serverbar-height))');
    setImportant(el,'left','auto');
    setImportant(el,'right','auto');
    setImportant(el,'height','auto');
    setImportant(el,'width','var(--layout-width-channel-sidebar)');
    setImportant(el,'z-index','1');
    setImportant(el,'display','flex');
    setImportant(el,'flex-direction','column');
    setImportant(el,'align-items','stretch');
    setImportant(el,'overflow','visible');
    setImportant(el,'background','var(--md-sys-color-surface-container-low)');
  });

  const gapEls = docRoot.querySelectorAll('.gap_10px.flex_0_auto.d_flex.flex-sh_0.p_0_16px.ai_center.fw_600.us_none.ov_hidden.h_48px');
  gapEls.forEach(el=>{
    setImportant(el,'margin-top','calc(var(--titlebar-height) + var(--serverbar-height))');
  });

  const offset = 'calc(var(--titlebar-height) + var(--serverbar-height))';
  const pushSelectors = ['body','#app','[class*="layout"]','[class*="content"]','[class*="main"]'];
  pushSelectors.forEach(sel=>{
    docRoot.querySelectorAll(sel).forEach(el=>{
      if(el.closest('.d_flex.flex-d_column')) return;
      setImportant(el,'margin-top',offset);
    });
  });

  let s = document.getElementById('injected-scrollbar-js');
  if(!s){
    s = document.createElement('style');
    s.id = 'injected-scrollbar-js';
    document.head.appendChild(s);
  }
  s.textContent = '*{scrollbar-width:none!important} ::-webkit-scrollbar{display:none!important}';
}

applyStyles(document);

const observer = new MutationObserver((mutations)=>{
  let run = false;
  for(const m of mutations){
    if(m.addedNodes && m.addedNodes.length) { run = true; break; }
  }
  if(run) applyStyles(document);
});
observer.observe(document.documentElement,{childList:true,subtree:true});
})();

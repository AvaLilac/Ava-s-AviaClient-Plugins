(function(){
const root = document.documentElement;
root.style.setProperty('--titlebar-height','29px');
root.style.setProperty('--serverbar-height','72px');

document.querySelectorAll('.d_flex.flex-d_column').forEach(el=>{
  if([...el.classList].some(c=>c.startsWith('fill_var(') && c.includes('--md-sys-color-on-surface'))){
    el.style.setProperty('position','fixed','important');
    el.style.setProperty('top','var(--titlebar-height)','important');
    el.style.setProperty('left','0','important');
    el.style.setProperty('right','0','important');
    el.style.setProperty('height','var(--serverbar-height)','important');
    el.style.setProperty('width','100vw','important');
    el.style.setProperty('z-index','10000','important');
    el.style.setProperty('display','flex','important');
    el.style.setProperty('flex-direction','row','important');
    el.style.setProperty('align-items','center','important');
    el.style.setProperty('justify-content','flex-start','important');
    el.style.setProperty('background','var(--md-sys-color-surface)','important');
  }
});

document.querySelectorAll('.will-change_transform.scr-bar-w_none.ov-y_scroll.flex-g_1').forEach(el=>{
  el.style.setProperty('display','flex','important');
  el.style.setProperty('flex-direction','row','important');
  el.style.setProperty('align-items','center','important');
  el.style.setProperty('overflow-x','auto','important');
  el.style.setProperty('overflow-y','visible','important');
  el.style.setProperty('flex-grow','0','important');
  el.style.setProperty('height','var(--serverbar-height)','important');
  el.style.setProperty('position','relative','important');
  el.querySelectorAll('[role="list"]').forEach(list=>{
    list.style.setProperty('display','flex','important');
    list.style.setProperty('flex-direction','row','important');
    list.style.setProperty('align-items','center','important');
    list.style.setProperty('gap','6px','important');
  });
});

document.querySelectorAll('.h_1px.flex-sh_0.m_6px_auto').forEach(el=>{
  if([...el.classList].some(c=>c.startsWith('w_calc('))) el.style.setProperty('display','none','important');
});

document.querySelectorAll('.d_flex.flex-sh_0.flex-d_column').forEach(el=>{
  const classes = [...el.classList].join(' ');
  if(classes.includes('bdr-tl_var(') && classes.includes('bdr-bl_var(') && classes.includes('w_var(')){
    el.style.setProperty('position','relative','important');
    el.style.setProperty('top','calc(var(--titlebar-height) + var(--serverbar-height))','important');
    el.style.setProperty('left','auto','important');
    el.style.setProperty('right','auto','important');
    el.style.setProperty('height','auto','important');
    el.style.setProperty('width','var(--layout-width-channel-sidebar)','important');
    el.style.setProperty('z-index','1','important');
    el.style.setProperty('display','flex','important');
    el.style.setProperty('flex-direction','column','important');
    el.style.setProperty('align-items','stretch','important');
    el.style.setProperty('overflow','visible','important');
    el.style.setProperty('background','var(--md-sys-color-surface-container-low)','important');
  }
});

const s = document.createElement('style');
s.id = 'injected-webkit-scrollbar';
s.textContent = '::-webkit-scrollbar{display:none!important}';
document.head.appendChild(s);

document.querySelectorAll('*').forEach(el=>{
  el.style.setProperty('scrollbar-width','none','important');
});

document.querySelectorAll('.gap_10px.flex_0_auto.d_flex.flex-sh_0.p_0_16px.ai_center.fw_600.us_none.ov_hidden.h_48px').forEach(el=>{
  el.style.setProperty('margin-top','calc(var(--titlebar-height) + var(--serverbar-height))','important');
});
})();

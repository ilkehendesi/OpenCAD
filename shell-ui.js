'use strict';
(()=>{
 const ribbon=document.querySelector('.ribbon');
 for(const name of ['text','dim','hatch'])document.querySelector('#annotate-tools').append(document.querySelector(`[data-tool="${name}"]`));
 const advanced=document.createElement('div');advanced.className='ribbon-group advanced-group';advanced.append(document.querySelector('.modify-tools'));const label=document.createElement('span');label.className='group-caption';label.textContent='Advanced modify';advanced.append(label);ribbon.querySelector('.edit-group').after(advanced);
 const viewOptions=document.createElement('div');viewOptions.className='ribbon-group view-options';viewOptions.innerHTML='<div class="toolgroup"><button data-action="drafting">Snap / polar settings</button><button data-action="ucs">Coordinate system</button><button data-action="fence">Fence selection</button></div><span class="group-caption">Precision</span>';ribbon.append(viewOptions);
 const tabs=[...document.querySelectorAll('[data-ribbon]')];
 function selectTab(tab){ribbon.dataset.mode=tab.dataset.ribbon;for(const b of tabs){const active=b===tab;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;}document.querySelector('#fileMenu').hidden=true;document.querySelector('#fileMenuToggle').setAttribute('aria-expanded','false');}
 tabs.forEach((tab,i)=>{tab.onclick=()=>selectTab(tab);tab.onkeydown=e=>{let next;if(e.key==='ArrowRight')next=(i+1)%tabs.length;if(e.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;if(e.key==='Home')next=0;if(e.key==='End')next=tabs.length-1;if(next!==undefined){e.preventDefault();selectTab(tabs[next]);tabs[next].focus();}};});selectTab(tabs[0]);
 const menu=document.querySelector('#fileMenu'),toggle=document.querySelector('#fileMenuToggle');toggle.onclick=()=>{menu.hidden=!menu.hidden;toggle.setAttribute('aria-expanded',String(!menu.hidden));};
 document.addEventListener('click',e=>{if(!menu.hidden&&e.target!==toggle&&!toggle.contains(e.target)){menu.hidden=true;toggle.setAttribute('aria-expanded','false');}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){menu.hidden=true;toggle.setAttribute('aria-expanded','false');}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(!document.querySelector('#dialog').open)focusCommand();}});
 function focusCommand(){HomeUI.hide();document.querySelector('#command').focus();}
 document.querySelector('#commandFocus').onclick=focusCommand;
 document.querySelector('#filePlot').onclick=document.querySelector('#ribbonPlot').onclick=()=>plotDialog();
 document.querySelectorAll('[data-external]').forEach(a=>a.addEventListener('click',async e=>{if(!window.desktop?.openExternal)return;e.preventDefault();try{await window.desktop.openExternal(a.dataset.external);}catch(err){document.querySelector('#homeMessage').textContent='Could not open the link: '+err.message;}}));
})();

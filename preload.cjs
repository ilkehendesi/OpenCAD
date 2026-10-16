const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktop',{
 openExternal:url=>ipcRenderer.invoke('open-external',url),
 recentList:()=>ipcRenderer.invoke('recent-list'),openRecent:id=>ipcRenderer.invoke('open-recent',id),cancelOpen:()=>ipcRenderer.invoke('open-cancel'),recentPreview:data=>ipcRenderer.invoke('recent-preview',data),removeRecent:id=>ipcRenderer.invoke('recent-remove',id),onOpenProgress:fn=>{const handler=(_,phase)=>fn(phase);ipcRenderer.on('open-progress',handler);return ()=>ipcRenderer.removeListener('open-progress',handler);},
 dwgBackend:()=>ipcRenderer.invoke('dwg-backend'),configureDWG:mode=>ipcRenderer.invoke('dwg-configure',mode),
 open:()=>ipcRenderer.invoke('open'),save:data=>ipcRenderer.invoke('save',data),autosave:data=>ipcRenderer.invoke('autosave',data),recover:()=>ipcRenderer.invoke('recover'),dirty:value=>ipcRenderer.send('dirty',value),confirm:text=>ipcRenderer.invoke('confirm',text)
});

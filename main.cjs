const {app,BrowserWindow,ipcMain,dialog,Menu,shell}=require('electron');
const fs=require('node:fs/promises');
const path=require('node:path');
const fsSync=require('node:fs');
app.setName('OpenCAD');
// Keep previous recent drawings, recovery data and display preferences on rename.
const previousData=['Hendese CAD','hendesecad'].map(name=>path.join(app.getPath('appData'),name)).find(dir=>fsSync.existsSync(dir));
if(!fsSync.existsSync(app.getPath('userData'))&&previousData)app.setPath('userData',previousData);
if(process.platform==='win32')app.setAppUserModelId('OpenCAD');
const {allowedExternalURL}=require('./external-links.cjs');
const {backend,writeDWG}=require('./dwg-backend.cjs');
const {verifyDWG}=require('./verify-dwg.cjs');
const {createPDF}=require('./pdf-export.cjs');
const ModernDXF=require('./dxf-modern.js');
let win,dirty=false,closing=false,closePending=false;
const allowed=new Set();
function verify(e){if(e.sender!==win.webContents||e.senderFrame!==win.webContents.mainFrame)throw new Error('Invalid request');}
const {parseFile,MAX_FILE_BYTES}=require('./file-loader.cjs');
const {RecentStore}=require('./recent-store.cjs');
let recentStore,openJob=null;
async function openPath(file){
 if(openJob)throw Error('A file is already opening. Wait for it or cancel first.');
 const job=new AbortController();openJob=job;
 try{const stat=await fs.stat(file);if(stat.size>MAX_FILE_BYTES)throw Error('The file exceeds the 512 MB limit.');const ext=path.extname(file).toLowerCase();if(!['.hcad','.dwg','.dxf'].includes(ext))throw Error('Unsupported file type');win.webContents.send('open-progress','Reading file…');const bytes=await fs.readFile(file);const result=await parseFile(bytes,ext,{normalize:true,transferInput:true,name:path.basename(file),signal:job.signal,onProgress:phase=>win.webContents.send('open-progress',phase)});let recentId=null;try{recentId=await recentStore.touch(file);}catch{}return {...result,name:path.basename(file),recentId,sourceKey:process.platform==='win32'?path.resolve(file).toLowerCase():path.resolve(file)};}finally{if(openJob===job)openJob=null;}
}
ipcMain.handle('open-external',async(e,url)=>{verify(e);await shell.openExternal(allowedExternalURL(url));return true;});
ipcMain.handle('open',async e=>{verify(e);const r=await dialog.showOpenDialog(win,{filters:[{name:'CAD drawings',extensions:['dwg','dxf','hcad']}],properties:['openFile']});return r.canceled?null:openPath(r.filePaths[0]);});
ipcMain.handle('open-recent',async(e,id)=>{verify(e);return openPath(recentStore.resolve(id));});
ipcMain.handle('open-cancel',e=>{verify(e);openJob?.abort();return true;});
ipcMain.handle('recent-list',e=>{verify(e);return recentStore.list();});
ipcMain.handle('recent-preview',async(e,data)=>{verify(e);return recentStore.preview(data.id,data);});
ipcMain.handle('recent-remove',async(e,id)=>{verify(e);await recentStore.remove(id);return true;});
const dwgSettingsFile=()=>path.join(app.getPath('userData'),'dwg-settings.json');
ipcMain.handle('dwg-backend',async e=>{verify(e);const value=await backend(dwgSettingsFile());return {mode:value.mode,label:value.label};});
ipcMain.handle('dwg-configure',async(e,mode)=>{verify(e);if(!['oda','native','auto'].includes(mode))throw Error('Invalid DWG engine');let settings={mode};if(mode==='oda'){const r=await dialog.showOpenDialog(win,{title:'Select the installed ODAFileConverter.exe',filters:[{name:'ODA File Converter',extensions:['exe']}],properties:['openFile']});if(r.canceled)return null;const file=r.filePaths[0];if(path.basename(file).toLowerCase()!=='odafileconverter.exe')throw Error('Select the ODAFileConverter.exe executable.');settings.executable=file;}await fs.writeFile(dwgSettingsFile(),JSON.stringify(settings),'utf8');const value=await backend(dwgSettingsFile());return {mode:value.mode,label:value.label};});
ipcMain.handle('save',async(e,{name,content,kind})=>{verify(e);if(!['hcad','dxf','dwg','svg','pdf'].includes(kind))throw new Error('Invalid file type');if(typeof content!=='string'||content.length>512*1024*1024)throw new Error('Invalid file size');const r=await dialog.showSaveDialog(win,{defaultPath:path.basename(name||'Drawing')+'.'+kind,filters:[{name:kind.toUpperCase(),extensions:[kind]}]});if(r.canceled)return null;const file=r.filePath.toLowerCase().endsWith('.'+kind)?r.filePath:r.filePath+'.'+kind;
 let bytes;
 if(kind==='dwg'){
  bytes=await writeDWG(content,await backend(dwgSettingsFile()));
  await verifyDWG(content,bytes);
 }else if(kind==='pdf'){
  const payload=JSON.parse(content);bytes=await createPDF(payload.doc,payload.settings,payload.ids||[]);
 }else bytes=Buffer.from(content,'utf8');
 const tmp=file+'.'+Date.now()+'.tmp';await fs.writeFile(tmp,bytes);try{await fs.rename(tmp,file);}catch(err){await fs.rm(tmp,{force:true});throw err;}

 let recentId=null;if(['hcad','dxf','dwg'].includes(kind))try{recentId=await recentStore.touch(file);}catch{}return {name:path.basename(file),recentId,sourceKey:process.platform==='win32'?path.resolve(file).toLowerCase():path.resolve(file)};
});
let recoveryQueue=Promise.resolve();
ipcMain.handle('autosave',async(e,data)=>{verify(e);if(closing||typeof data!=='string'||Buffer.byteLength(data,'utf8')>100*1024*1024)return false;recoveryQueue=recoveryQueue.catch(()=>{}).then(async()=>{if(closing)return;const file=path.join(app.getPath('userData'),'recovery.hcad');if(!data){await fs.rm(file,{force:true});return;}await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file+'.tmp',data);await fs.rename(file+'.tmp',file);});await recoveryQueue;return true;});
ipcMain.handle('recover',async e=>{verify(e);try{return JSON.parse(await fs.readFile(path.join(app.getPath('userData'),'recovery.hcad'),'utf8'));}catch{return null;}});
ipcMain.on('dirty',(e,value)=>{verify(e);dirty=!!value;win.setDocumentEdited(dirty);});
ipcMain.handle('confirm',async(e,text)=>{verify(e);const r=await dialog.showMessageBox(win,{type:'question',message:String(text).slice(0,1000),buttons:['Cancel','Continue'],defaultId:0,cancelId:0});return r.response===1;});
app.whenReady().then(async()=>{
 recentStore=await new RecentStore(app.getPath('userData')).load();
 Menu.setApplicationMenu(null);win=new BrowserWindow({width:1480,height:940,minWidth:1000,minHeight:650,title:'OpenCAD',icon:path.join(__dirname,'assets/opencad.ico'),backgroundColor:'#10151c',webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());win.webContents.session.setPermissionRequestHandler((a,b,cb)=>cb(false));
 win.loadFile(path.join(__dirname,'index.html'));win.on('close',async e=>{if(closing)return;e.preventDefault();if(closePending)return;closePending=true;try{if(dirty){const r=await dialog.showMessageBox(win,{type:'question',message:'One or more drawing tabs have unsaved changes.',detail:'Choose Cancel to save your work before closing.',buttons:['Cancel','Close without saving'],defaultId:0,cancelId:0});if(r.response!==1)return;}closing=true;await recoveryQueue.catch(()=>{});await fs.rm(path.join(app.getPath('userData'),'recovery.hcad'),{force:true}).catch(()=>{});win.close();}finally{closePending=false;}});
});app.on('window-all-closed',()=>app.quit());

const { parentPort } = require('node:worker_threads');
const path = require('node:path');

const DxfParser=require('dxf-parser');
const Modern=require('./dxf-modern.js'),IO=require('./io.js');
parentPort.on('message',async({bytes,ext,normalize=false,name='Drawing'})=>{
 const progress=phase=>{if(normalize)parentPort.postMessage({progress:phase});};const finish=r=>{if(normalize){progress('Preparing layers and drawing objects…');const document=IO.importDrawing({...r,name});parentPort.postMessage({format:r.format,document});}else parentPort.postMessage(r);};
 try {
  progress('Parsing file…');if(ext==='.hcad'){finish({format:'hcad',database:JSON.parse(new TextDecoder().decode(bytes))});return;}
  if(ext==='.dxf') {const p=new DxfParser(),text=new TextDecoder().decode(bytes),database=p.parseSync(text),meta=Modern.layerMetadata(text);for(const [name,layer] of Object.entries(database.tables?.layer?.layers||{}))Object.assign(layer,meta[name]||meta[String(name).replace(/\\U\+([0-9A-F]{4})/gi,(_,h)=>String.fromCharCode(parseInt(h,16)))]||{});finish({format:'dxf',database});return;}
  const {LibreDwg,Dwg_File_Type}=await import('@mlightcad/libredwg-web');
  const engine=await LibreDwg.create(path.join(__dirname,'node_modules/@mlightcad/libredwg-web/wasm/') );
  const data=bytes.byteOffset===0&&bytes.byteLength===bytes.buffer.byteLength?bytes.buffer:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
  const ptr=engine.dwg_read_data(data,Dwg_File_Type.DWG);
  if(!ptr) throw new Error('The DWG reader could not decode this file.');
  try {progress('Decoding DWG objects…');const r=engine.convertEx(ptr),db=r.database;for(const l of db.tables.LAYER.entries)l.lineweight=Modern.WEIGHTS[l.lineweight]??25;
   // The reader includes layout entities in database.entities. Mark their owners explicitly.
   const paperOwners=new Set((db.tables.BLOCK_RECORD?.entries||[]).filter(b=>/^\*paper_space/i.test(b.name)).map(b=>String(b.handle).toUpperCase()));
   for(const e of db.entities||[])if(paperOwners.has(String(e.ownerBlockRecordSoftId).toUpperCase()))e.isInPaperSpace=true;
   finish({format:'dwg',...r});}finally{engine.dwg_free(ptr);}
 }catch(e){parentPort.postMessage({error:String(e.message||e)});}
});

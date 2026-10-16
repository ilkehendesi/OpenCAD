const fs=require('node:fs/promises'),path=require('node:path'),{randomUUID}=require('node:crypto');
class RecentStore{
 constructor(directory){this.file=path.join(directory,'recent-projects.json');this.items=[];this.queue=Promise.resolve();}
 async load(){try{const data=JSON.parse(await fs.readFile(this.file,'utf8'));this.items=(Array.isArray(data)?data:[]).filter(v=>typeof v.id==='string'&&typeof v.path==='string').slice(0,20);}catch{}return this;}
 persist(){const data=JSON.stringify(this.items);this.queue=this.queue.catch(()=>{}).then(async()=>{await fs.mkdir(path.dirname(this.file),{recursive:true});const temp=this.file+'.tmp';await fs.writeFile(temp,data);await fs.rename(temp,this.file);});return this.queue;}
 async touch(file){const key=process.platform==='win32'?file.toLowerCase():file;const old=this.items.find(x=>(process.platform==='win32'?x.path.toLowerCase():x.path)===key),item={...old,id:old?.id||randomUUID(),path:file,name:path.basename(file),openedAt:new Date().toISOString()};this.items=[item,...this.items.filter(x=>x.id!==item.id)].slice(0,20);await this.persist();return item.id;}
 async list(){return Promise.all(this.items.map(async item=>{let available=true;try{await fs.access(item.path);}catch{available=false;}return {...item,available};}));}
 resolve(id){const item=this.items.find(x=>x.id===id);if(!item)throw Error('The recent file record was not found. Use Open to locate the file.');return item.path;}
 async preview(id,{thumbnail,entities,layers}){const item=this.items.find(x=>x.id===id);if(!item)return false;if(typeof thumbnail!=='string'||thumbnail.length>900000||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(thumbnail))return false;const b=Buffer.from(thumbnail.split(',')[1],'base64');if(!b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return false;item.thumbnail=thumbnail;item.entities=Number.isSafeInteger(entities)?entities:0;item.layers=Number.isSafeInteger(layers)?layers:0;await this.persist();return true;}
 async remove(id){this.items=this.items.filter(x=>x.id!==id);await this.persist();}
}
module.exports={RecentStore};

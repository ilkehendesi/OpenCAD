'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),source=path.join(root,'vendor/libredwg-web-patches'),target=path.join(root,'node_modules/@mlightcad/libredwg-web');
const manifest=JSON.parse(fs.readFileSync(path.join(source,'manifest.json'),'utf8'));
const installed=JSON.parse(fs.readFileSync(path.join(target,'package.json'),'utf8'));
if(installed.version!==manifest.version)throw Error('Parser patch version mismatch: expected '+manifest.version+', found '+installed.version);
// Validate every input before changing any installed file.
const inputs=Object.entries(manifest.files).map(([name,hash])=>{
 if(path.isAbsolute(name)||name.split(/[\\/]/).includes('..'))throw Error('Invalid patch path');
 const bytes=fs.readFileSync(path.join(source,name));
 if(crypto.createHash('sha256').update(bytes).digest('hex')!==hash)throw Error('Parser patch integrity mismatch: '+name);
 return {name,bytes};
});
for(const {name,bytes}of inputs){const destination=path.join(target,name);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,bytes);}
console.log('Restored '+inputs.length+' OpenCAD parser files for libredwg-web '+manifest.version+'.');

// The native Windows library is tracked compressed to keep each GitHub file small.
const native=path.join(root,'native'),runtime=JSON.parse(fs.readFileSync(path.join(native,'runtime.json'),'utf8'));
const library=require('node:zlib').gunzipSync(fs.readFileSync(path.join(native,'libredwg-0.dll.gz')));
if(library.length!==runtime.size||crypto.createHash('sha256').update(library).digest('hex')!==runtime.sha256)throw Error('Native converter integrity mismatch');
fs.writeFileSync(path.join(native,'libredwg-0.dll'),library);
console.log('Restored and verified native Windows DWG library.');

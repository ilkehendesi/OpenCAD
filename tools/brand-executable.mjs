import * as PE from 'pe-library';
import * as RE from 'resedit';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const [source,destination,icon]=process.argv.slice(2);
const original=PE.NtExecutable.from(fs.readFileSync(source)),res=PE.NtExecutableResource.from(original),icons=RE.Data.IconFile.from(fs.readFileSync(icon));
const groups=RE.Resource.IconGroupEntry.fromEntries(res.entries);
for(const group of groups)RE.Resource.IconGroupEntry.replaceIconsForResource(res.entries,group.id,group.lang,icons.icons.map(i=>i.data));
for(const vi of RE.Resource.VersionInfo.fromEntries(res.entries)){
 vi.setFileVersion(0,9,0,0,1033);vi.setProductVersion(0,9,0,0,1033);
 for(const lang of vi.getAvailableLanguages())vi.setStringValues(lang,{FileDescription:'OpenCAD',ProductName:'OpenCAD',InternalName:'OpenCAD',OriginalFilename:'OpenCAD.exe',CompanyName:'Egemen Ilke Kurt',FileVersion:'0.9.0',ProductVersion:'0.9.0'});
 vi.outputToResourceEntries(res.entries);
}
res.outputResource(original);fs.writeFileSync(destination,Buffer.from(original.generate()));
const reread=PE.NtExecutable.from(fs.readFileSync(destination));const entries=PE.NtExecutableResource.from(reread).entries;
assert.equal(RE.Resource.VersionInfo.fromEntries(entries)[0].getStringValues({lang:1033,codepage:1200}).ProductName,'OpenCAD');
assert.equal(RE.Resource.IconGroupEntry.fromEntries(entries).length,groups.length);
const before=PE.NtExecutable.from(fs.readFileSync(source));
for(const old of before.getAllSections().filter(s=>s.info.name!=='.rsrc')){
 const next=reread.getAllSections().find(s=>s.info.name===old.info.name);assert.ok(next,old.info.name);assert.deepEqual(Buffer.from(next.data||[]),Buffer.from(old.data||[]),'Executable section changed: '+old.info.name);
}
console.log('PASS Windows PE resource branding: OpenCAD 0.9, original supplied icon, all non-resource sections unchanged.');

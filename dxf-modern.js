(function(root,factory){if(typeof module==='object')module.exports=factory(require('./core.js'),require('./io.js'),require('./templates/template.js'));else root.ModernDXF=factory(root.CAD,root.CADIO,root.DXF_TEMPLATE);})(this,function(C,IO,template){
'use strict';
const WEIGHTS=[0,5,9,13,15,18,20,25,30,35,40,50,53,60,70,80,90,100,106,120,140,158,200,211];
const weight=mm=>WEIGHTS.reduce((a,b)=>Math.abs(b-mm*100)<Math.abs(a-mm*100)?b:a,25);
const decode=s=>String(s).replace(/\\U\+([\da-f]{4})/gi,(_,s)=>String.fromCharCode(parseInt(s,16)));
function pairs(s){const lines=s.replace(/^\uFEFF/,'').split(/\r?\n/);let a=[];for(let i=0;i+1<lines.length;i+=2)a.push([Number(lines[i].trim()),lines[i+1].trimEnd()]);return a;}
function layerMetadata(s){const a=pairs(s),result={};let inLayer=false,l=null;for(let i=0;i<a.length;i++){const [c,v]=a[i];if(c===0&&v==='TABLE'&&a[i+1]?.[1]==='LAYER'){inLayer=true;continue;}if(inLayer&&c===0){if(l&&l.name)result[l.name]=l;l=null;if(v==='ENDTAB'){inLayer=false;continue;}if(v==='LAYER')l={};}if(l){if(c===2)l.name=decode(v);if(c===370)l.lineweight=Number(v);if(c===70){l.locked=!!(Number(v)&4);l.frozen=!!(Number(v)&1);}if(c===6)l.lineType=v.toUpperCase();}}return result;}
function serialize(doc){let a=pairs(template),h=Math.max(0x40,...a.filter(v=>v[0]===5||v[0]===105).map(v=>parseInt(v[1],16)||0))+1;const handle=()=>((h++).toString(16).toUpperCase()),out=[],p=(c,v)=>out.push([c,String(v)]),text=s=>String(s).replace(/[\r\n]+/g,' ').replace(/[^\x20-\x7e]/g,c=>'\\U+'+c.charCodeAt(0).toString(16).toUpperCase().padStart(4,'0'));
 const nearest=color=>{let n=parseInt(color.slice(1),16),best=7,d=Infinity;for(let i=1;i<256;i++){let c=IO.aciColor(i),v=[16,8,0].reduce((s,k)=>s+(((n>>k)&255)-((c>>k)&255))**2,0);if(v<d){d=v;best=i;}}return best;};
 for(let i=0;i<a.length;i++){
  if(a[i][0]===9&&a[i][1]==='$INSUNITS')a[i+1][1]=String(({in:1,ft:2,mm:4,cm:5,m:6})[doc.units]||4);
  if(a[i][0]===9&&a[i][1]==='$MEASUREMENT')a[i+1][1]=String(['in','ft'].includes(doc.units)?0:1);
  if(a[i][0]===9&&a[i][1]==='$LWDISPLAY')a[i+1][1]='1';
 }
 const start=a.findIndex((v,i)=>v[0]===0&&v[1]==='TABLE'&&a[i+1]?.[1]==='LAYER'),end=a.findIndex((v,i)=>i>start&&v[0]===0&&v[1]==='ENDTAB');
 p(0,'TABLE');p(2,'LAYER');p(5,'1');p(330,'0');p(100,'AcDbSymbolTable');p(70,doc.layers.length);
 for(const l of doc.layers){p(0,'LAYER');p(5,l.name==='0'?'27':handle());p(330,'1');p(100,'AcDbSymbolTableRecord');p(100,'AcDbLayerTableRecord');p(2,text(l.name));p(70,l.locked?4:0);p(62,nearest(l.color)*(l.visible?1:-1));p(6,['DASHED','CENTER'].includes(l.lineType)?l.lineType:'CONTINUOUS');p(290,1);p(370,weight(l.width??.25));p(390,'13');}p(0,'ENDTAB');a.splice(start,end-start+1,...out);out.length=0;
 const blockDefs=new Map();for(const e of C.walk(doc.entities))if(e.type==='block'){const record=handle(),name=(String(e.name||'Block').replace(/[<>/\\":;?*|=,`]/g,'_').slice(0,100)||'Block')+'_'+record;blockDefs.set(e,{record,name});}
 const point=(code,pt)=>{p(code,pt.x);p(code+10,pt.y);p(code+20,0);};
 function entity(e,owner='17'){if(e.type==='dim'){C.dimensionParts(e).forEach(v=>entity(v,owner));return;}if(e.type==='text'&&e.text.includes('\n')){e.text.split('\n').forEach((s,i)=>entity({...e,text:s,pos:C.pt(e.pos.x+i*e.height*1.3*Math.sin(e.rotation||0),e.pos.y-i*e.height*1.3*Math.cos(e.rotation||0))},owner));return;}
  const type=({block:'INSERT',line:'LINE',polyline:'LWPOLYLINE',hatch:'LWPOLYLINE',circle:'CIRCLE',arc:'ARC',text:'TEXT',point:'POINT'})[e.type];if(!type)return;p(0,type);p(5,handle());p(330,owner);p(100,'AcDbEntity');p(8,text(e.layer));if(e.sourceVisible===false)p(60,1);if(e.color)p(62,nearest(e.color));p(370,-1);
  if(e.type==='block'){p(100,'AcDbBlockReference');p(2,text(blockDefs.get(e).name));point(10,e.pos);p(41,1);p(42,1);p(43,1);p(50,0);}
  else if(e.type==='line'){p(100,'AcDbLine');point(10,e.a);point(11,e.b);}else if(['circle','arc'].includes(e.type)){p(100,'AcDbCircle');point(10,e.center);p(40,e.radius);if(e.type==='arc'){p(100,'AcDbArc');p(50,e.start*180/Math.PI);p(51,e.end*180/Math.PI);}}
  else if(e.type==='text'){p(100,'AcDbText');point(10,e.pos);p(40,e.height);p(1,text(e.text));p(50,(e.rotation||0)*180/Math.PI);p(7,'Standard');p(100,'AcDbText');p(73,0);}
  else if(e.type==='point'){p(100,'AcDbPoint');point(10,e.pos);}
  else{p(100,'AcDbPolyline');p(90,e.points.length);p(70,e.closed?1:0);for(const v of e.points){p(10,v.x);p(20,v.y);if(v.bulge)p(42,v.bulge);}if(e.type==='hatch')for(const [a,b]of IO.hatchLines(e))entity({...e,type:'line',a,b},owner);}
 }
 // Append real block table records and definitions, including nested INSERTs.
 const bs=a.findIndex((v,i)=>v[0]===0&&v[1]==='TABLE'&&a[i+1]?.[1]==='BLOCK_RECORD'),be=a.findIndex((v,i)=>i>bs&&v[0]===0&&v[1]==='ENDTAB');
 for(let i=bs;i<be;i++)if(a[i][0]===70){a[i][1]=String(2+blockDefs.size);break;}
 for(const [e,b] of blockDefs){p(0,'BLOCK_RECORD');p(5,b.record);p(330,'9');p(100,'AcDbSymbolTableRecord');p(100,'AcDbBlockTableRecord');p(2,text(b.name));}
 a=a.slice(0,be).concat(out,a.slice(be));out.length=0;
 for(const [e,b] of blockDefs){p(0,'BLOCK');p(5,handle());p(330,b.record);p(100,'AcDbEntity');p(8,'0');p(100,'AcDbBlockBegin');p(2,text(b.name));p(70,0);point(10,e.pos);p(3,text(b.name));p(1,'');for(const child of e.children)entity(child,b.record);p(0,'ENDBLK');p(5,handle());p(330,b.record);p(100,'AcDbEntity');p(8,'0');p(100,'AcDbBlockEnd');}
 const blocksStart=a.findIndex((v,i)=>v[0]===0&&v[1]==='SECTION'&&a[i+1]?.[1]==='BLOCKS'),blocksEnd=a.findIndex((v,i)=>i>blocksStart&&v[0]===0&&v[1]==='ENDSEC');
 a=a.slice(0,blocksEnd).concat(out,a.slice(blocksEnd));out.length=0;
 doc.entities.forEach(e=>entity(e));
 const es=a.findIndex((v,i)=>v[0]===0&&v[1]==='SECTION'&&a[i+1]?.[1]==='ENTITIES'),ee=a.findIndex((v,i)=>i>es&&v[0]===0&&v[1]==='ENDSEC');a=a.slice(0,es+2).concat(out,a.slice(ee));
 for(let i=0;i<a.length;i++)if(a[i][0]===9&&a[i][1]==='$HANDSEED')a[i+1][1]=handle();
 return a.map(([c,v])=>c+'\r\n'+v).join('\r\n')+'\r\n';
}
return {serialize,layerMetadata,WEIGHTS,weight};
});

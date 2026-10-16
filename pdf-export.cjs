const fs=require('node:fs/promises'),path=require('node:path');
const {PDFDocument,rgb,degrees,pushGraphicsState,popGraphicsState,rectangle,clip,endPath}=require('pdf-lib'),fontkit=require('@pdf-lib/fontkit');
const C=require('./core.js'),IO=require('./io.js'),Plot=require('./plot.js');
const MM=72/25.4;
async function createPDF(document,settings,ids=[]){const doc=C.validate(C.clone(document)),layout=Plot.layout(doc,settings,ids);if(!layout.fit)throw new Error(`The drawing does not fit at this scale. Choose larger paper or a scale of at least 1:${Math.ceil(layout.required)}.`);
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(await fs.readFile(path.join(__dirname,'fonts/DejaVuSans.ttf')),{subset:true});pdf.setTitle(doc.name);pdf.setSubject(`OpenCAD | ${layout.settings.paper} | 1:${layout.settings.scale} | drawing units ${layout.settings.units}`);pdf.setCreator('OpenCAD 0.9');
 const page=pdf.addPage([layout.width*MM,layout.height*MM]),xy=p=>({x:(layout.offset.x+p.x*layout.factor)*MM,y:(layout.offset.y+p.y*layout.factor)*MM});
 function render(e){const l=doc.layers.find(l=>l.name===e.layer)||doc.layers[0],col=layout.settings.color==='black'?'#000000':e.color||l.color;let n=parseInt(col.slice(1),16);if(n===0xffffff)n=0;const color=rgb(((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255),thickness=(layout.settings.lineweights?(l.width??.25):.13)*MM;const dashArray=l.lineType==='DASHED'?[3*MM,1.5*MM]:l.lineType==='CENTER'?[6*MM,1.5*MM,1*MM,1.5*MM]:undefined;
  if(e.type==='text'){const a=e.rotation||0,h=e.height*layout.factor*MM;for(const [i,s]of e.text.split('\n').entries()){const p=xy(C.pt(e.pos.x+i*e.height*1.3*Math.sin(a),e.pos.y-i*e.height*1.3*Math.cos(a)));page.drawText(s,{...p,font,size:h,color,rotate:degrees(a*180/Math.PI)});}return;}
  if(e.type==='circle'){page.drawCircle({...xy(e.center),size:e.radius*layout.factor*MM,borderColor:color,borderWidth:thickness,borderDashArray:dashArray});return;}
  if(e.type==='point'){page.drawCircle({...xy(e.pos),size:Math.max(thickness,.15*MM),color});return;}
  const ps=C.points(e).map(xy);if(ps.length>1){let svg=`M ${ps[0].x} ${-ps[0].y} `+ps.slice(1).map(p=>`L ${p.x} ${-p.y}`).join(' ')+(e.closed?' Z':'');page.drawSvgPath(svg,{x:0,y:0,borderColor:color,borderWidth:thickness,borderDashArray:dashArray});}
  if(e.type==='hatch')for(const [a,b]of IO.hatchLines(e))page.drawLine({start:xy(a),end:xy(b),thickness,color});
 }
 page.pushOperators(pushGraphicsState(),rectangle(layout.clipArea.x*MM,layout.clipArea.y*MM,layout.clipArea.w*MM,layout.clipArea.h*MM),clip(),endPath());
 for(const e of layout.entities)render(e);
 page.pushOperators(popGraphicsState());
 if(layout.settings.footer){const x=layout.settings.margin*MM,y=layout.settings.margin*MM;const label=`${doc.name} | 1:${layout.settings.scale} | ${layout.settings.paper} | ${layout.settings.units}`;let size=8;while(font.widthOfTextAtSize(label,size)>(layout.width-2*layout.settings.margin-70)*MM&&size>5)size-=.5;page.drawText(label,{x,y,font,size,color:rgb(.2,.2,.2)});page.drawText('Print at 100% / Actual size',{x,y:y-4*MM,font,size:6.5,color:rgb(.4,.4,.4)});
  const bx=(layout.width-layout.settings.margin-50)*MM,by=y+1*MM;page.drawLine({start:{x:bx,y:by},end:{x:bx+50*MM,y:by},thickness:.2*MM,color:rgb(0,0,0)});for(const xx of [bx,bx+50*MM])page.drawLine({start:{x:xx,y:by-1*MM},end:{x:xx,y:by+1*MM},thickness:.2*MM,color:rgb(0,0,0)});page.drawText('Check line: 50 mm',{x:bx,y:by+2*MM,font,size:6,color:rgb(.3,.3,.3)});
 }
 return Buffer.from(await pdf.save());
}
module.exports={createPDF};

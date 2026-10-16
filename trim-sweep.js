(function(root,factory){if(typeof module==='object')module.exports=factory(require('./core.js'),require('./precision.js'),require('./modify.js'));else root.TrimSweep=factory(root.CAD,root.Precision,root.Modify);})(this,function(C,P,M){
'use strict';
// The source index and cutting edges stay fixed until release. No document mutation during preview.
class Stroke{
 constructor({entities,index,editable,visible,cuttingIds=[]}){this.entities=entities;this.index=index;this.editable=editable;this.visible=visible;this.cuttingIds=new Set(cuttingIds);this.results=new Map();this.boundaryCache=new Map();this.errors=[];this.count=0;this.last=null;}
 eligible(e){return ['line','arc','circle','polyline'].includes(e.type)&&this.editable(e)&&!this.cuttingIds.has(e.id);}
 boundaries(e){if(!this.boundaryCache.has(e.id)){const candidates=this.cuttingIds.size?this.entities.filter(v=>this.cuttingIds.has(v.id)):this.index.query(P.bounds(e));this.boundaryCache.set(e.id,candidates.filter(v=>v.id!==e.id).map(this.visible).filter(Boolean));}return this.boundaryCache.get(e.id);}
 cut(e,p,tolerance){const pieces=this.results.get(e.id)||[e];let at=-1,best=tolerance;pieces.forEach((v,i)=>{const d=P.hit(v,p);if(d<=best){at=i;best=d;}});if(at<0)return;try{const next=M.trim(pieces[at],p,this.boundaries(e));this.results.set(e.id,[...pieces.slice(0,at),...next,...pieces.slice(at+1)]);this.count++;}catch(error){if(!this.errors.length)this.errors.push(error.message);}}
 start(p,tolerance){this.last=p;let target=null,best=tolerance;for(const e of this.index.query({x0:p.x-tolerance,y0:p.y-tolerance,x1:p.x+tolerance,y1:p.y+tolerance})){if(!this.eligible(e))continue;const d=P.hit(e,p);if(d<=best){best=d;target=e;}}if(target)this.cut(target,p,tolerance);}
 move(p){const a=this.last;this.last=p;if(!a||C.dist(a,p)<1e-9)return;const line={type:'line',a,b:p},hits=[];for(const e of this.index.query(P.bounds(line))){if(!this.eligible(e))continue;for(const part of P.parts(e))for(const q of P.intersections(line,part))hits.push({e,q,d:C.dist(a,q)});}hits.sort((a,b)=>a.d-b.d);for(const {e,q}of hits)this.cut(e,q,Math.max(1e-6,C.dist(a,p)*1e-9));}
 apply(doc){if(!this.results.size)return false;doc.entities=doc.entities.flatMap(e=>this.results.has(e.id)?this.results.get(e.id).map(C.duplicate):[e]);return true;}
}
return {Stroke};});

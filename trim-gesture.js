'use strict';
window.TrimGesture=(()=>{
 let stroke=null,trail=[];
 function cancel(){stroke=null;trail=[];if(drag?.kind==='trim')drag=null;}
 function hint(){if(stroke)$('#hint').textContent='TRIM · '+stroke.results.size+' objects · Drag across parts to remove. Release: apply · Esc: cancel.';}
 function start(p){cancel();stroke=new TrimSweep.Stroke({entities:doc.entities,index:index(),editable,visible:visibleGeometry,cuttingIds:[...selection]});stroke.start(p,9/view.scale);trail=[p];hint();}
 function move(p){if(!stroke)return;stroke.move(p);if(C.dist(trail.at(-1),p)*view.scale>3){trail.push(p);if(trail.length>500)trail.shift();}hint();}
 function finish(){const current=stroke;cancel();if(!current)return;if(current.results.size){checkpoint();current.apply(doc);for(const id of current.results.keys())selection.delete(id);changed();log(current.results.size+' objects trimmed. Undo reverses this entire stroke.');}else if(current.errors.length)log('TRIM: '+current.errors[0]);updateHint();render();}
 function draw(){if(!stroke)return;ctx.save();ctx.strokeStyle='#65c9ff';ctx.lineWidth=2;ctx.setLineDash([5,4]);path(trail);ctx.stroke();ctx.restore();for(const id of stroke.results.keys()){const e=stroke.index.byId.get(id)?.entity;if(e)drawEntity(e,false,true);}}
 return {start,move,finish,cancel,draw,active:()=>!!stroke};
})();

'use strict';
// Incremental full-detail geometry cache. No entity is dropped to meet the frame budget.
class ProgressiveScene{
 constructor(){this.canvas=document.createElement('canvas');this.context=this.canvas.getContext('2d');this.key=null;this.generation=0;this.pending=false;this.drawn=0;this.total=0;}
 paint(key,width,height,ratio,entities,draw,notify){if(this.key!==key){this.key=key;const generation=++this.generation;this.canvas.width=Math.round(width*ratio);this.canvas.height=Math.round(height*ratio);this.context.setTransform(ratio,0,0,ratio,0,0);const items=entities();this.total=items.length;this.drawn=0;this.pending=items.length>0;const batch=()=>{if(generation!==this.generation)return;const start=performance.now();let count=0;while(this.drawn<items.length){draw(items[this.drawn++],this.context);if(++count%64===0&&performance.now()-start>9)break;}this.pending=this.drawn<items.length;if(this.pending)requestAnimationFrame(batch);notify();};batch();}return this.canvas;}
 invalidate(){this.key=null;this.generation++;this.pending=false;}
}

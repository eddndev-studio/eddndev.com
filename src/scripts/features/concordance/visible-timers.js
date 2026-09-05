/** Timers retain remaining visible time; no catch-up bursts after a hidden tab. */
export class VisibleTimers {
  constructor(){this.items=new Map();this.active=false;this.dead=false;}
  set(key,fn,delay){
    this.clear(key);if(this.dead)return;
    this.items.set(key,{fn,left:delay,id:0,started:0});if(this.active)this.arm(key);
  }
  arm(key){
    const item=this.items.get(key);if(!item||item.id||this.dead)return;
    item.started=performance.now();
    item.id=setTimeout(()=>{this.items.delete(key);if(!this.dead)item.fn();},Math.max(0,item.left));
  }
  clear(key){const item=this.items.get(key);if(item)clearTimeout(item.id);this.items.delete(key);}
  setActive(active){
    if(this.active===active||this.dead)return;this.active=active;
    if(active){for(const key of this.items.keys())this.arm(key);}
    else for(const item of this.items.values()){
      if(item.id){clearTimeout(item.id);item.id=0;item.left=Math.max(0,item.left-(performance.now()-item.started));}
    }
  }
  destroy(){for(const key of this.items.keys())this.clear(key);this.dead=true;}
}

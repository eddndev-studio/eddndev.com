import { INKS, DEFAULT_COLORS, describeTile, shortestTurn } from './glyphs.js';

const MOTION = Object.freeze({lead:.10, hop:.15, morph:.22, settle:.16});
const clamp = n => Math.max(0,Math.min(1,n));
const ease = t => 1-Math.pow(1-clamp(t),3);
const fmt = n => Number(n.toFixed(4));

function setRect(el,x,y,w,h) {
  el.setAttribute('x',fmt(x));el.setAttribute('y',fmt(y));el.setAttribute('width',fmt(w));el.setAttribute('height',fmt(h));
}
function setGlyph(path, cell) {
  const g=describeTile(cell);
  path.setAttribute('d',g.path);path.setAttribute('fill',`var(${INKS[g.ink]}, ${DEFAULT_COLORS[g.ink]})`);
  path.setAttribute('transform',`rotate(${g.rotation} 50 50)`);
}
function edgePath(d) { return ['M8 1H92','M99 8V92','M8 99H92','M1 8V92'][d]; }

/** Renderer has no random source, graph search, timers, observers or event handlers. */
export class MosaicView {
  constructor(svg, state) {
    this.svg=svg;this.state=state;this.plan=null;this.progress=0;
    this.nodes=[...svg.querySelectorAll('[data-cell]')].map(root=>({root,
      stage:root.querySelector('[data-stage]'), old:root.querySelector('[data-old]'), fresh:root.querySelector('[data-new]'),
      oldPath:root.querySelector('[data-old-path]'),newPath:root.querySelector('[data-new-path]'),
      oldClip:root.querySelector('[data-old-clip]'),newClip:root.querySelector('[data-new-clip]'),handoff:root.querySelector('[data-handoff]'),
    }));
    if(this.nodes.length!==state.cells.length) throw new Error('SSR/model cell-count mismatch');
  }
  prepare(plan, speed=1) {
    if(!plan.accepted) return 0;
    if(!Number.isFinite(speed)||speed<.25||speed>3) throw new RangeError('speed must be .25..3');
    this.plan=plan;this.speed=speed;
    this.motion=plan.motion??MOTION;
    const motion=this.motion;
    this.duration=(motion.lead+(plan.steps.length-1)*motion.hop+motion.morph+motion.settle)/speed;
    for(const step of plan.steps) {
      const n=this.nodes[step.id]; setGlyph(n.newPath,step.to);
      n.fresh.setAttribute('opacity','0');
      n.handoff.setAttribute('d',edgePath(step.outgoing));
    }
    this.paint(0);return this.duration;
  }
  paint(time) {
    if(!this.plan)return;
    const t=Math.max(0,time)*this.speed;
    this.progress=clamp(time/this.duration);
    for(const step of this.plan.steps) {
      const n=this.nodes[step.id], a=describeTile(step.from), b=describeTile(step.to);
      const start=this.motion.lead+step.depth*this.motion.hop, p=clamp((t-start)/this.motion.morph), e=ease(p);
      const anticipation=Math.min(this.motion.lead,step.depth===0 ? .10 : .04);
      const pre=clamp((t-start+anticipation)/anticipation);
      const compression=t<start ? Math.sin(pre*Math.PI/2) : 1-ease(p);
      // All temporary transforms live inside the cell's fixed viewport.
      n.stage.setAttribute('transform',compression>0?`translate(50 50) rotate(${fmt((step.depth?-.5:-1.4)*compression)}) scale(${fmt(1-.016*compression)}) translate(-50 -50)`:'');
      const rotate=a.kind===b.kind && a.rotation!==b.rotation && a.ink===b.ink && a.path!=='';
      if(rotate) {
        n.oldPath.setAttribute('transform',`rotate(${fmt(a.rotation+shortestTurn(a.rotation,b.rotation)*e)} 50 50)`);
        n.fresh.setAttribute('opacity','0');
      } else {
        n.oldPath.setAttribute('transform',`rotate(${a.rotation} 50 50)`);
        n.fresh.setAttribute('opacity',p>0?'1':'0');
        const d=step.incoming??((step.outgoing+2)%4), size=100*e;
        // Orthogonal, opaque wipe: no muddy alpha blend between two designs.
        if(d===3){setRect(n.newClip,0,0,size,100);setRect(n.oldClip,size,0,100-size,100);}
        if(d===1){setRect(n.newClip,100-size,0,size,100);setRect(n.oldClip,0,0,100-size,100);}
        if(d===0){setRect(n.newClip,0,0,100,size);setRect(n.oldClip,0,size,100,100-size);}
        if(d===2){setRect(n.newClip,0,100-size,100,size);setRect(n.oldClip,0,0,100,100-size);}
      }
      // A restrained shared-edge handoff, not a travelling electric particle.
      const gate=clamp((t-(start+.065))/.12);
      n.handoff.setAttribute('opacity',fmt(gate>0&&gate<1?Math.sin(gate*Math.PI)*.48:0));
      n.root.dataset.phase=t<start?'waiting':p<1?'repairing':'settled';
    }
  }
  commit(state) {
    const changed=this.plan?this.plan.steps.map(step=>state.cells[step.id]):state.cells;
    this.state=state;this.plan=null;this.progress=0;
    changed.forEach(cell=>{
      const n=this.nodes[cell.id];setGlyph(n.oldPath,cell);
      n.stage.removeAttribute('transform');n.fresh.setAttribute('opacity','0');n.newPath.setAttribute('d','');
      n.handoff.setAttribute('opacity','0');setRect(n.oldClip,0,0,100,100);setRect(n.newClip,0,0,0,100);
      delete n.root.dataset.phase;
    });
    this.svg.dataset.revision=state.revision;
  }
}

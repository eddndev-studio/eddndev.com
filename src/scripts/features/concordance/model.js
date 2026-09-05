import { VALID_MASKS, describeTile } from './glyphs.js';

const DEFAULTS = Object.freeze({
  width: 6, height: 3, seed: 'eddndev/concordancia/01',
  maxReach: 12, maxCandidates: 96, brightQuota: .44,
  minMass: .27, maxMass: .62, minQuiet: .11, maxQuiet: .56,
  minLightMass: .055, maxLightMass: .36,
});
const BITS = [1, 2, 4, 8], OPP = [4, 8, 1, 2];
const DELTA = [[0,-1],[1,0],[0,1],[-1,0]];
const popcount = n => ((n&1)>0)+((n&2)>0)+((n&4)>0)+((n&8)>0);
const mod = (n, m) => (n % m + m) % m;

/** Stable 32-bit hash. No Date, Math.random, frame counter or platform RNG. */
function hash(value) {
  let h = 2166136261;
  for (const ch of String(value)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  h ^= h >>> 16; h = Math.imul(h, 0x7feb352d); h ^= h >>> 15;
  return h >>> 0;
}
function random(seed) {
  let t = hash(seed);
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ t >>> 15, 1 | t);
    r ^= r + Math.imul(r ^ r >>> 7, 61 | r);
    return ((r ^ r >>> 14) >>> 0) / 4294967296;
  };
}
function resolveConfig(input = {}) {
  const c = { ...DEFAULTS, ...input };
  if (!Number.isInteger(c.width) || c.width < 2 || c.width > 16 ||
      !Number.isInteger(c.height) || c.height < 2 || c.height > 12) {
    throw new RangeError('Grid must be 2..16 columns by 2..12 rows.');
  }
  if (!Number.isInteger(c.maxReach) || c.maxReach < 4 || c.maxReach > 24)
    throw new RangeError('maxReach must be an integer in 4..24.');
  if (!Number.isInteger(c.maxCandidates) || c.maxCandidates < 1 || c.maxCandidates > 256)
    throw new RangeError('maxCandidates must be in 1..256.');
  for (const k of ['brightQuota','minMass','maxMass','minQuiet','maxQuiet','minLightMass','maxLightMass'])
    if (!Number.isFinite(c[k]) || c[k] < 0 || c[k] > 1) throw new RangeError(`Invalid ${k}`);
  if (c.minMass >= c.maxMass || c.minQuiet > c.maxQuiet || c.minLightMass > c.maxLightMass)
    throw new RangeError('Inverted artistic bounds.');
  c.seed = String(c.seed);
  return c;
}
function neighbor(i, d, width, height) {
  const x = i % width, y = Math.floor(i / width), [dx,dy] = DELTA[d];
  return x+dx < 0 || x+dx >= width || y+dy < 0 || y+dy >= height ? -1 : (y+dy)*width+x+dx;
}
function direction(a, b, width) {
  if (b === a-width) return 0;
  if (b === a+1 && Math.floor(b/width) === Math.floor(a/width)) return 1;
  if (b === a+width) return 2;
  if (b === a-1 && Math.floor(b/width) === Math.floor(a/width)) return 3;
  throw new RangeError(`Cells ${a},${b} are not adjacent`);
}
function fingerprint(state) { return state.cells.map(c => c.mask.toString(16)).join(''); }

/** Finite library of simple rectangular cycles in the CELL adjacency graph. */
function enumerateCycles(width, height, maxReach = 24) {
  const result = [];
  for (let y0=0; y0<height-1; y0++) for (let x0=0; x0<width-1; x0++)
  for (let y1=y0+1; y1<height; y1++) for (let x1=x0+1; x1<width; x1++) {
    const length = 2*((x1-x0)+(y1-y0));
    if (length > maxReach) continue;
    const path = [];
    for (let x=x0; x<x1; x++) path.push(y0*width+x);
    for (let y=y0; y<y1; y++) path.push(y*width+x1);
    for (let x=x1; x>x0; x--) path.push(y1*width+x);
    for (let y=y1; y>y0; y--) path.push(y*width+x0);
    result.push(path);
  }
  return result;
}
function palette(config) {
  const n = config.width*config.height;
  const ranks = Array.from({length:n}, (_,i) => ({
    i, rank: hash(`${config.seed}/ink/${i}`) / 2**32 + .13*(i%config.width)/(config.width-1),
  })).sort((a,b) => a.rank-b.rank || a.i-b.i);
  const bright = Math.round(n*config.brightQuota), inks = Array(n).fill(0);
  ranks.forEach(({i},j) => { inks[i] = j<bright ? (j%3===0 ? 3 : 2) : (j%2); });
  return inks;
}
function blank(config) {
  const inks = palette(config);
  return { config, revision:0, previous:null,
    cells:Array.from({length:config.width*config.height},(_,id)=>({
      id, mask:0, ink:inks[id], motif: hash(`${config.seed}/motif/${id}`)%8,
    })),
  };
}
function toggleCycle(state, path) {
  const {width,height} = state.config;
  if (path.length < 4 || new Set(path).size !== path.length || path.some(i => !Number.isInteger(i) || i<0 || i>=width*height))
    throw new RangeError('Expected a simple, in-bounds cycle.');
  const cells = state.cells.map(c => ({...c}));
  path.forEach((i,j) => {
    const k=path[(j+1)%path.length], d=direction(i,k,width);
    cells[i].mask ^= BITS[d]; cells[k].mask ^= OPP[d];
  });
  return {...state, cells};
}
function metrics(state) {
  let mass=0, light=0, quiet=0, quarters=0, stairs=0, apertures=0;
  const n=state.cells.length;
  for (const cell of state.cells) {
    const g=describeTile(cell);
    mass+=g.area;
    if (cell.ink>=2) light+=g.area;
    if (cell.mask===0) quiet++;
    if (g.kind==='quarter') quarters++;
    if (g.kind==='stair') stairs++;
    if (g.kind==='aperture'||g.kind==='island') apertures++;
  }
  return {mass:mass/n, light:light/n, quiet:quiet/n, quarters, stairs, apertures};
}
function validate(state, {art = true} = {}) {
  const errors=[], {width,height}=state.config;
  if (state.cells.length!==width*height) return {ok:false, errors:['cell-count']};
  for (let i=0;i<state.cells.length;i++) {
    const cell=state.cells[i], {mask,ink,motif}=cell;
    if (cell.id!==i) errors.push(`id:${i}`);
    if (!VALID_MASKS.includes(mask)) errors.push(`parity:${i}`);
    if (!Number.isInteger(ink)||ink<0||ink>3) errors.push(`ink:${i}`);
    if (!Number.isInteger(motif)||motif<0||motif>7) errors.push(`motif:${i}`);
    for (let d=0;d<4;d++) {
      const j=neighbor(i,d,width,height), active=Boolean(mask&BITS[d]);
      if (j<0 && active) errors.push(`open-boundary:${i}:${d}`);
      if (j>=0 && active!==Boolean(state.cells[j].mask&OPP[d])) errors.push(`edge:${i}:${j}`);
    }
  }
  if (errors.length) return {ok:false,errors};
  const m=metrics(state), c=state.config;
  if (art) {
    if(m.mass<c.minMass||m.mass>c.maxMass) errors.push('mass');
    if(m.quiet<c.minQuiet||m.quiet>c.maxQuiet) errors.push('quiet');
    if(m.light<c.minLightMass||m.light>c.maxLightMass) errors.push('light');
    // No 2x2 solid hub carpet: keep perforations exceptional.
    for(let y=0;y<height-1;y++) for(let x=0;x<width-1;x++)
      if([y*width+x,y*width+x+1,(y+1)*width+x,(y+1)*width+x+1].every(i=>state.cells[i].mask===15)) errors.push('hub-carpet');
  }
  return {ok:errors.length===0, errors, metrics:m};
}
function beauty(state) {
  const m=metrics(state), target=.43;
  return Math.abs(m.mass-target)*2 + Math.abs(m.quiet-.27)*.4 + Math.abs(m.light-.22)*1.3
    + (m.quarters===0?.2:0) + (m.apertures===0?.08:0);
}
/** Bounded search for an initial valid plate. Fails explicitly for impossible custom bounds. */
function createInitial(input = {}) {
  const config=resolveConfig(input), base=blank(config), rng=random(`${config.seed}/initial`);
  const cycles=enumerateCycles(config.width,config.height,24);
  let candidate=base, best=null, score=Infinity;
  for(let attempt=0;attempt<512;attempt++) {
    if(attempt%32===0) candidate=base;
    candidate=toggleCycle(candidate,cycles[Math.floor(rng()*cycles.length)]);
    if(validate(candidate).ok) {
      const s=beauty(candidate);
      if(s<score) {best=candidate;score=s;}
    }
  }
  if(!best) throw new Error('No initial composition satisfies these artistic bounds. Restore defaults.');
  return {...best,revision:0,previous:null};
}

/**
 * A root toggles two ports. Its next neighbor repairs the incoming port and
 * toggles its outgoing port; the defect walks along this simple cycle.
 * The last cell repairs the frontier AND the root's held closure edge.
 * Target is validated BEFORE the renderer receives anything.
 */
function planCascade(state, root, overrides = {}) {
  if(!validate(state).ok) throw new Error('Refusing to plan from an invalid equilibrium.');
  const config=resolveConfig({...state.config,...overrides});
  // Grid/palette are immutable during a transaction. Explicit reinitialization is required.
  for (const k of ['width','height','seed','brightQuota'])
    if(config[k]!==state.config[k]) throw new Error(`${k} requires a new initial plate`);
  if(!Number.isInteger(root)||root<0||root>=state.cells.length) throw new RangeError('Invalid root');
  const seed=`${config.seed}/${state.revision}/${root}`;
  const candidates=enumerateCycles(config.width,config.height,config.maxReach)
    .filter(path=>path.includes(root))
    .map(path=>({path,rank:hash(`${seed}/${path.join(',')}`)}))
    .sort((a,b)=>a.rank-b.rank)
    .slice(0,config.maxCandidates);
  let best=null, bestScore=Infinity, examined=0;
  for(const {path,rank} of candidates) {
    examined++;
    const target=toggleCycle({...state,config},path);
    if(!validate(target).ok) continue;
    const undo=fingerprint(target)===state.previous;
    const score=beauty(target) + (undo?4:0) + .26*Math.abs(path.length-Math.min(8,config.maxReach))/config.maxReach + (rank/2**32)*.20;
    if(score<bestScore) {best={path,target};bestScore=score;}
  }
  if(!best) return {accepted:false,reason:'no-compatible-composition',examined,target:state,steps:[],path:[]};
  let path=best.path.slice();
  if(hash(`${seed}/direction`)%2) path.reverse();
  const offset=path.indexOf(root);
  path=[...path.slice(offset),...path.slice(0,offset)];
  const target={...best.target,revision:state.revision+1,previous:fingerprint(state)};
  const steps=path.map((id,depth)=>({id,depth,parent:depth?path[depth-1]:null,
    incoming:depth?direction(id,path[depth-1],config.width):null,
    outgoing:direction(id,path[(depth+1)%path.length],config.width),
    closure:depth===path.length-1,
    from:state.cells[id],to:target.cells[id],
  }));
  return {accepted:true,root,path,steps,target,examined,metrics:metrics(target)};
}

/** Apply visual tile updates one by one: only cycle-frontier mismatches are allowed. */
function intermediateState(state, plan, completed) {
  const cells=state.cells.map(c=>({...c}));
  for(const step of plan.steps.slice(0,completed)) cells[step.id]={...step.to};
  return {...state,cells};
}
function mismatchedEdges(state) {
  const result=[], {width,height}=state.config;
  for(let i=0;i<state.cells.length;i++) for(const d of [1,2]) {
    const j=neighbor(i,d,width,height);
    if(j>=0&&Boolean(state.cells[i].mask&BITS[d])!==Boolean(state.cells[j].mask&OPP[d])) result.push([i,j]);
  }
  return result;
}

export { createInitial, planCascade, validate, intermediateState, mismatchedEdges, neighbor, direction, beauty, metrics };

import { INKS, DEFAULT_COLORS, describeTile } from './glyphs.js';
import { fieldOpacity } from './field.js';

const svgNS = 'http://www.w3.org/2000/svg';

export function svgMarkup(state, {id='concordancia'}={}) {
  if(!/^[a-zA-Z][\w-]*$/.test(id)) throw new TypeError('Expected a safe, unique SVG id prefix');
  const {width,height}=state.config;
  const cells=state.cells.map(c=>{
    const g=describeTile(c), prefix=`${id}-${c.id}`;
    return `<svg data-cell="${c.id}" x="${c.id%width*100}" y="${Math.floor(c.id/width)*100}" width="100" height="100" viewBox="0 0 100 100" overflow="hidden" opacity="${fieldOpacity(c.id, state.config)}">
      <defs><clipPath id="${prefix}-old" clipPathUnits="userSpaceOnUse"><rect data-old-clip x="0" y="0" width="100" height="100"/></clipPath><clipPath id="${prefix}-new" clipPathUnits="userSpaceOnUse"><rect data-new-clip x="0" y="0" width="0" height="100"/></clipPath></defs>
      <g data-stage>
        <g data-old clip-path="url(#${prefix}-old)"><path data-old-path d="${g.path}" fill="var(${INKS[g.ink]}, ${DEFAULT_COLORS[g.ink]})" fill-rule="evenodd" transform="rotate(${g.rotation} 50 50)"/></g>
        <g data-new clip-path="url(#${prefix}-new)" opacity="0"><path data-new-path d="" fill-rule="evenodd"/></g>
      </g>
      <path data-handoff d="" stroke="var(--starlight)" stroke-width="1.3" opacity="0" fill="none"/>
    </svg>`;
  }).join('');
  const crosses=[];
  for(let y=0;y<=height;y++) for(let x=0;x<=width;x++) {
    const exposure = Math.max(...[[x-1,y-1],[x,y-1],[x-1,y],[x,y]].map(([cx,cy]) =>
      cx < 0 || cx >= width || cy < 0 || cy >= height ? 0 : fieldOpacity(cy*width+cx, state.config)));
    if((x+y)%2===0 && exposure > 0) crosses.push(`<path d="M${x*100-3} ${y*100}h6m-3 -3v6" opacity="${exposure}"/>`);
  }
  return `<svg xmlns="${svgNS}" class="concordance-svg" data-concordance-svg data-revision="${state.revision}" viewBox="0 0 ${width*100} ${height*100}" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">
    ${cells}
    <g class="concordance-register" stroke="var(--hairline-strong)" stroke-width=".7" fill="none">${crosses.join('')}</g>
  </svg>`;
}

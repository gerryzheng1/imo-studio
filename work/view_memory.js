// Positions belong to the previously rendered DOM, not to newly selected filters.
const ViewMemory=(()=>{
 const pages=new Map();let generation=0;
 function regionKey(node,index){if(node.id)return '#'+node.id;const table=node.querySelector('table[data-grid]'),location=node.closest('[data-store-location]')?.dataset.storeLocation;return table?'table:'+table.dataset.grid+':'+(location||''):node.dataset.scrollRegion||'region:'+index}
 const regions=root=>[...root.querySelectorAll('.tablewrap,.plan-timeline,[data-scroll-region]')];
 function focus(root){const el=document.activeElement;if(!el||!root.contains(el))return null;const choice=el.matches('.value-choice'),source=choice?el.closest('.choice-editor')?.querySelector('input[data-table],input[data-bind]')||el:el,attrs=['id','data-bind','data-table','data-id','data-field','data-declaration','data-ui-pref','data-action','data-view','data-location','data-default-auto'];const matches=attrs.filter(a=>source.hasAttribute(a)).map(a=>'['+a+'="'+CSS.escape(source.getAttribute(a))+'"]');if(!matches.length)return null;let start=null,end=null;try{start=source.selectionStart;end=source.selectionEnd}catch{}return {choice,selector:source.tagName.toLowerCase()+matches.join(''),start,end}}
 function detailKey(el,i){return el.dataset.wsDetails||el.id||el.querySelector(':scope > summary')?.textContent.trim()||'detail:'+i}
 function capture(root){return {top:root.scrollTop,left:root.scrollLeft,x:window.scrollX,y:window.scrollY,regions:new Map(regions(root).map((n,i)=>[regionKey(n,i),{top:n.scrollTop,left:n.scrollLeft}])),details:new Map([...root.querySelectorAll('details')].map((d,i)=>[detailKey(d,i),d.open])),focus:focus(root)}}
 function before(root){const key=root.dataset.renderKey;if(key)pages.set(key,capture(root));return key}
 function after(root,key,previous){const token=++generation,saved=pages.get(key);root.dataset.renderKey=key;const restore=(details=false)=>{if(token!==generation||root.dataset.renderKey!==key)return;if(!saved){root.scrollTop=0;root.scrollLeft=0;return}if(details)for(const [i,d]of [...root.querySelectorAll('details')].entries())if(saved.details.has(detailKey(d,i)))d.open=saved.details.get(detailKey(d,i));for(const [i,n]of regions(root).entries()){const p=saved.regions.get(regionKey(n,i));if(p){n.scrollTop=p.top;n.scrollLeft=p.left}}root.scrollTop=saved.top;root.scrollLeft=saved.left;if(window.scrollX!==saved.x||window.scrollY!==saved.y)window.scrollTo({left:saved.x,top:saved.y,behavior:'instant'})};restore(true);
  if(previous===key&&saved?.focus){const f=saved.focus,source=root.querySelector(f.selector),el=f.choice?source?.closest('.choice-editor')?.querySelector('.value-choice'):source;if(el&&!el.hidden){el.focus({preventScroll:true});try{if(f.start!==null)el.setSelectionRange(f.start,f.end)}catch{}}}
  requestAnimationFrame(()=>restore(false));
 }
 function clear(){pages.clear();generation++}
 return {before,after,clear,get size(){return pages.size}};
})();

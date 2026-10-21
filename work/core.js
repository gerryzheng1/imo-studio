'use strict';
const BASE_CONFIG=JSON.parse(document.getElementById('imo-config').textContent);
let CONFIG=structuredClone(BASE_CONFIG);
const NS={s:'http://schemas.openxmlformats.org/spreadsheetml/2006/main',r:'http://schemas.openxmlformats.org/officeDocument/2006/relationships',rel:'http://schemas.openxmlformats.org/package/2006/relationships',ct:'http://schemas.openxmlformats.org/package/2006/content-types'};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v??'').trim().normalize('NFKC').replace(/[\s,，.。_\-()（）/\\:：]/g,'').toLowerCase();
const uid=()=>globalThis.crypto?.randomUUID?.()||('p'+Date.now().toString(36)+Math.random().toString(36).slice(2));
const nilKeys=['stowaways','firearms','explosives','toxicWaste','radioactive','animals','floatingCargo','passengers','dangerousGoods','parcels'];
const nilLabels=['偷渡人员','枪支及弹药','爆炸品','有毒废物','放射性物质','动物','浮动货物','旅客','危险货物','包裹'];
const healthQuestions=[
'1. 航次中是否有人因非意外原因死亡？（原表第 1 问）',
'2. 国际航次中是否存在疑似传染性疾病病例？',
'3. 航次中是否有人因非意外原因死亡？（原表另列第 3 问，保留原文）',
'4. 目前船上是否有人生病？',
'5. 是否咨询过医生？',
'6. 是否知悉可能导致感染或传播疾病的其他情况？',
'7. 船上是否实施过卫生措施？',
'8. 是否发现偷渡人员？',
'9. 船上是否有患病动物？'];
// Stable NIL item definitions; answers retain semantic keys for consistency checks.
const NIL_ENGLISH=['STOWAWAY/S','FIREARMS AND AMMUNITION','EXPLOSIVES','TOXIC WASTE','RADIO ACTIVE SUBSTANCE/S','ANIMALS','FLOATING CARGO','PASSENGERS','DANGEROUS GOODS','PARCEL'];
function defaultNilItems(){return nilKeys.map((key,i)=>({id:'nil-'+key,key,name:NIL_ENGLISH[i],labelZh:nilLabels[i]}))}
function activeNilItems(){return state.nilItems||defaultNilItems()}
function nilAnswer(key){return activeNilItems().some(r=>r.key===key)?state.nil[key]:undefined}
function validateNilItems(items){if(!Array.isArray(items)||items.length>1000)throw Error('NIL 项目列表无效，最多 1000 项');const ids=new Set(),keys=new Set();for(const r of items){if(!r||typeof r.id!=='string'||!r.id||ids.has(r.id)||typeof r.key!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(r.key)||keys.has(r.key)||typeof r.name!=='string'||typeof r.labelZh!=='string')throw Error('NIL 项目名称、答案标识或人员标识无效');ids.add(r.id);keys.add(r.key)}return items}
function migrateNilMapping(config){if(!config?.templates)return config;const c=config.templates.find(c=>c.id===9);for(const sc of c?.sheets||[]){const fields=sc.fields?.filter(f=>f.key.startsWith('nil.'));if(!sc.table&&fields?.length===10){const refs=fields.map(f=>rect(f.cell)),cols=[...new Set(refs.map(r=>r.c1))];if(cols.length===1&&refs.every(r=>r.r1===r.r2&&r.c1===r.c2)){sc.fields=sc.fields.filter(f=>!f.key.startsWith('nil.'));sc.table={source:'nilItems',rows:refs.map(r=>r.r1),columns:{name:'E',value:colName(cols[0])},clear:['E'+Math.min(...refs.map(r=>r.r1))+':'+colName(cols[0])+Math.max(...refs.map(r=>r.r1))]};if(sc.expectedLabels?.B16)sc.titlePage='B16'}}}return config}
function checkNilItems(r){const items=activeNilItems();if(!items.length)r.errors.push('NIL 清单没有项目，请添加需要申报的项目。');const names=new Set();for(const [i,item]of items.entries()){const label=item.labelZh||item.name||'第 '+(i+1)+' 项',v=state.nil[item.key];if(!item.name.trim())r.errors.push(label+'：请输入写入 Excel 的项目名称');if(isBlank(v))r.errors.push(label+' 尚未申报');if(String(v??'').length>40)r.warnings.push(label+'答案较长，请核对 Excel/WPS 打印预览');if(item.name.length>38)r.warnings.push(label+'项目名称较长，请核对打印显示');if(names.has(norm(item.name)))r.warnings.push('NIL 项目名称重复：'+item.name);names.add(norm(item.name))}const passenger=nilAnswer('passengers');if(passenger!==undefined){if(state.declarations.passengers==='records'&&(isNil(passenger)||String(passenger)==='0'))r.errors.push('已有旅客，旅客项不能申报 NIL 或 0');if(state.declarations.passengers==='none'&&!isBlank(passenger)&&!isNil(passenger)&&String(passenger)!=='0')r.errors.push('旅客申报与“无旅客”状态不一致')}if(state.health.q8==='Yes'&&isNil(nilAnswer('stowaways')))r.errors.push('健康申报有偷渡人员，与 NIL 申报矛盾')}
// Editing history stays complete. Only the generated history document is capped.
function portOutputSelection(){const cutoff=dateValue(state.voyage.arrivalDate)||'',future=[],eligible=[];state.ports.forEach((r,index)=>{const departure=dateValue(r.departureDate),arrival=dateValue(r.arrivalDate);if(cutoff&&departure&&departure>cutoff)future.push(r);else eligible.push({r,index,date:departure||arrival||'9999-99-99',arrival:arrival||''})});eligible.sort((a,b)=>b.date.localeCompare(a.date)||b.arrival.localeCompare(a.arrival)||a.index-b.index);return {rows:eligible.slice(0,10).map(x=>x.r),older:eligible.slice(10).map(x=>x.r),future,cutoff}}
function outputPolicy(){return state.preferences.output||{keys:[],fields:[],columns:[],cells:[]}}
function outputFieldId(id,sc,f){return JSON.stringify([id,sc.name,f.key,f._originalCell||f.cell])}
function outputColumnId(id,sc,key){return JSON.stringify([id,sc.name,key])}
function outputCellId(id,sc,cell){return JSON.stringify([id,sc.name,cell])}
function templateHasSignatureDate(id,sc,f){const book=chosenTemplate(id)?.book,sh=book?.sheets.find(s=>s.name===sc.name),ref=f._originalCell||f.cell,c=sh?.cells.get(ref);if(!c)return false;if(els(c,'f').length||!isBlank(cellText(c,book.strings)))return true;const target=rect(ref);return [...sh.cells].some(([address,cell])=>{const r=rect(address);return r.r1===target.r1&&r.c1<target.c1&&r.c1>=target.c1-4&&/^(date|data|日期|签署日期)\s*[:：]?$/i.test(cellText(cell,book.strings).trim())})}
function isOutputFieldEnabled(id,sc,f){const p=outputPolicy(),key=f.key==='$master'?'ship.master':f.key,field=outputFieldId(id,sc,f);if((p.keys||[]).includes(key)||(p.fields||[]).includes(field)||(p.cells||[]).includes(outputCellId(id,sc,f._originalCell||f.cell)))return false;if(f.key==='$signatureDate'&&!templateHasSignatureDate(id,sc,f)&&!(p.enabledFields||[]).includes(field))return false;return true}
function isOutputColumnEnabled(id,sc,key){return !(outputPolicy().columns||[]).includes(outputColumnId(id,sc,key))}
function isOutputKeyEnabled(id,key){const c=CONFIG.templates.find(c=>c.id===id),fields=c?.sheets.flatMap(sc=>sc.fields.filter(f=>f.key===key).map(f=>[sc,f]))||[];return fields.some(([sc,f])=>isOutputFieldEnabled(id,sc,f))}
function suppressedOutputCells(id,sc){return (outputPolicy().cells||[]).flatMap(text=>{try{const [tid,sheet,cell]=JSON.parse(text);return tid===id&&sheet===sc.name?[sc._insert?shiftA1(cell,sc._insert.at,sc._insert.count):cell]:[]}catch{return []}})}
function validateOutputPolicy(raw){if(raw===undefined)return;const p=raw;if(!p||typeof p!=='object'||Array.isArray(p))throw Error('输出选择设置无效');for(const k of ['keys','fields','columns','cells','enabledFields']){if(k==='enabledFields'&&p[k]===undefined)continue;if(!Array.isArray(p[k])||p[k].length>5000||p[k].some(v=>typeof v!=='string'||v.length>500))throw Error('输出选择列表无效：'+k);if(k!=='keys')for(const v of p[k]){let row;try{row=JSON.parse(v)}catch{throw Error('输出字段标识无效')}if(!Array.isArray(row)||!Number.isInteger(row[0])||row[0]<1||row[0]>10||typeof row[1]!=='string')throw Error('输出字段标识无效');if(k==='cells'){const a=rect(row[2]);if(a.r1!==a.r2||a.c1!==a.c2)throw Error('只可清空单个单元格')}}}}
function outputOmissions(id){const c=CONFIG.templates.find(c=>c.id===id),list=[];for(const sc of c?.sheets||[]){for(const f of sc.fields)if(f.key!=='$blank'&&!isOutputFieldEnabled(id,sc,f))list.push(fieldLabel(f.key)+' '+sc.name+'!'+f.cell);for(const k of Object.keys(sc.table?.columns||{}))if(!isOutputColumnEnabled(id,sc,k))list.push(detailLabel(sc.table.source,k)+'列');for(const cell of suppressedOutputCells(id,sc))if(!sc.fields.some(f=>f.cell===cell))list.push(sc.name+'!'+cell)}return list}

const NAME_RULE_FIELDS=[['保存日期','点击保存或生成时的电脑本地日期，YYYYMMDD'],['保存时间','点击保存或生成时的电脑本地时间，24 小时制 HHmmss'],['毫秒','保存时的三位毫秒，000–999'],['时间戳','保存日期_保存时间_毫秒的组合'],['靠港港口','本次所选申报阶段的靠港英文港口；与“港口”相同'],['港口','进港阶段用到港港口，离港阶段用离港港口'],['港口中文名','所选靠港港口的中文检索名；没有则使用填写名称'],['港口LOCODE','所选靠港港口已核定或自行填写的代码，例如 AUBNE'],['国家','当前靠港港口关联的英文国家／地区'],['船名','船舶档案中的船名'],['IMO编号','船舶档案中的 IMO 编号'],['呼号','船舶档案中的呼号'],['船旗','船舶档案中的船旗'],['船籍港','船舶档案中的船籍港'],['公司','船舶档案中的船公司'],['申报阶段','本次选择的“进港”或“离港”'],['日期','所选申报阶段的航次日期，YYYYMMDD；不是电脑保存日'],['年月','本次选择的药品文件年月，YYYY-MM'],['到港港口','本次航次到港港口'],['离港港口','本次航次离港港口'],['到港日期','本次航次到港日期，YYYYMMDD'],['离港日期','本次航次离港日期，YYYYMMDD'],['上一港','本次航次上一港'],['下一港','本次航次下一港']];
function validateNamePattern(pattern,label='命名规则'){if(typeof pattern!=='string'||!pattern.trim()||pattern.length>120)throw Error(label+'须为 1–120 字');const keys=new Set(NAME_RULE_FIELDS.map(([k])=>k));for(const m of pattern.matchAll(/\{([^{}]*)\}/g))if(!keys.has(m[1]))throw Error(label+'中没有这个占位符：{'+m[1]+'}；请从说明表复制');if(/[{}]/.test(pattern.replace(/\{[^{}]*\}/g,'')))throw Error(label+'的大括号不成对');return pattern}
function namingValues(now=new Date()){const p=(v,n=2)=>String(v).padStart(n,'0'),savedDate=now.getFullYear()+p(now.getMonth()+1)+p(now.getDate()),savedTime=p(now.getHours())+p(now.getMinutes())+p(now.getSeconds()),ms=p(now.getMilliseconds(),3),v=state.voyage,side=v.mode||'arrival',port=v[side+'Port']||'',metadata=typeof portInfo==='function'?portInfo(port,'',v[side+'PortMeta']):null,date=value=>(dateValue(value)||'').replace(/-/g,'');return {'保存日期':savedDate,'保存时间':savedTime,'毫秒':ms,'时间戳':savedDate+'_'+savedTime+'_'+ms,'靠港港口':port||'未填港口','港口':port||'未填港口','港口中文名':metadata?.nameZh||port||'未填港口','港口LOCODE':metadata?.locode||'无代码','国家':metadata?.country||'未填国家','船名':state.ship.name||'未填船名','IMO编号':state.ship.imo||'未填IMO','呼号':state.ship.callSign||'未填呼号','船旗':state.ship.flag||'未填船旗','船籍港':state.ship.registry||'未填船籍港','公司':state.ship.company||'未填公司','申报阶段':side==='arrival'?'进港':'离港','日期':date(v[side+'Date'])||'未填日期','年月':v.month||'未填年月','到港港口':v.arrivalPort||'未填到港港口','离港港口':v.departurePort||'未填离港港口','到港日期':date(v.arrivalDate)||'未填到港日期','离港日期':date(v.departureDate)||'未填离港日期','上一港':v.lastPort||'未填上一港','下一港':v.nextPort||'未填下一港'}}
function expandFilePattern(pattern,extension,now=new Date()){validateNamePattern(pattern);const values=namingValues(now),stem=pattern.replace(/\.imoproject\.json$|\.zip$/i,'').replace(/\{([^{}]*)\}/g,(_,key)=>values[key]);return safeName(stem)+extension}
function projectSnapshotName(){return expandFilePattern(typeof uiSettings==='object'?uiSettings.projectPattern:'{保存日期}_{保存时间}_{毫秒}_{靠港港口}','.imoproject.json')}
function isProjectFileName(name){return typeof name==='string'&&name.length<=180&&name.toLowerCase().endsWith('.imoproject.json')&&!/[\x00-\x1f<>:"/\\|?*]/.test(name)&&!/^\.+$/.test(name)&&!name.endsWith('.')&&!/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(name)}

function blankState(){return {version:1,ship:{name:'',imo:'',callSign:'',flag:'',registry:'',company:'',netTonnage:'',master:'',confirmed:false},voyage:{mode:'arrival',arrivalPort:'',departurePort:'',arrivalDate:'',departureDate:'',lastPort:'',nextPort:'',stay:'',signArrival:'',signDeparture:'',month:'',storage:''},people:[],arrival:[],departure:[],effects:{},effectsDeclaration:'NIL',ports:[],stores:[],passengers:[],medicines:[],cases:[],declarations:{ports:'',stores:'',passengers:'',medicines:'',cases:''},health:{certType:'',certDate:'',certPlace:'',certExpiry:'',surgeon:'',measures:'',stowawayPlace:'',q1:'',q2:'',q3:'',q4:'',q5:'',q6:'',q7:'',q8:'',q9:''},nil:Object.fromEntries(nilKeys.map(k=>[k,''])),nilItems:defaultNilItems(),preferences:{includeTemplates:true,reuseSignatures:false,signatureAnchors:[],warningsAcknowledged:false}}}
let state=blankState(), templates=new Map(), importProblems=[], templateIssues=[], currentView='templates', lastChecks=null, busy=false, revision=0, generated=new Map();
function changed(){revision++;generated.clear();lastChecks=null;state.preferences.warningsAcknowledged=false;updateMeters();}
function getPath(obj,key){return key.split('.').reduce((o,k)=>o?.[k],obj)}
function setPath(obj,key,value){const ks=key.split('.');let p=obj;for(const k of ks.slice(0,-1)){if(['__proto__','prototype','constructor'].includes(k))throw Error('无效字段');p=p[k]??={}}p[ks.at(-1)]=value;}
function getPerson(id){return state.people.find(p=>p.id===id)}
function roster(side){return state[side].map(e=>({...getPerson(e.personId),...e.overrides,id:e.personId})).filter(p=>p.id)}
function selectedSide(id){return id===1?'arrival':id===2?'departure':id===6?'arrival':state.voyage.mode}
function dateValue(v){
 const s=String(v??'').trim();if(!s)return null;let y,m,d;
 let a=s.match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?$/);if(a)[,y,m,d]=a.map(Number);
 else if((a=s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/)))[,d,m,y]=a.map(Number);else return null;
 const t=new Date(Date.UTC(y,m-1,d));return t.getUTCFullYear()===y&&t.getUTCMonth()===m-1&&t.getUTCDate()===d?`${String(y).padStart(4,'0')}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`:null;
}
function serialDate(v,date1904=false){const iso=dateValue(v);if(!iso)throw Error('无效日期：'+v);return (Date.parse(iso+'T00:00:00Z')-Date.UTC(date1904?1904:1899,date1904?0:11,date1904?1:30))/86400000;}
function fromSerial(v,date1904=false){const t=new Date(Date.UTC(date1904?1904:1899,date1904?0:11,date1904?1:30)+Number(v)*86400000);return t.toISOString().slice(0,10)}
function displayDate(v){const d=dateValue(v);return d?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):String(v??'')}
function isNil(v){return /^(nil|none|无|不适用|n\/?a)$/i.test(String(v??'').trim())}
function isBlank(v){return v===undefined||v===null||String(v).trim()===''}
function safeName(s){let v=String(s||'').replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').replace(/[.\s]+$/g,'').trim();if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(v))v='_'+v;return v.slice(0,100)||'未命名'}
function download(data,name,type='application/octet-stream'){const blob=data instanceof Blob?data:new Blob([data],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=String(name).replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').replace(/[.\s]+$/g,'').slice(0,230);document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
let toastTimer=0;
function toast(message){
 const root=$('#toastRoot'),notice=document.createElement('div'),text=document.createElement('span'),close=document.createElement('button');
 clearTimeout(toastTimer);notice.className='toast';text.className='toast-message';text.textContent=String(message);text.title=String(message);close.type='button';close.className='toast-dismiss';close.setAttribute('aria-label','关闭通知');close.title='关闭通知';close.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
 const dismiss=()=>{clearTimeout(toastTimer);if(root.firstElementChild===notice)root.replaceChildren()};close.addEventListener('click',dismiss);notice.append(text,close);root.replaceChildren(notice);toastTimer=setTimeout(dismiss,3500);$('#status').textContent=message;$('#status').title=message;
}
// Replacing a preview with its confirmation is one modal session. Keep the
// original opener and background state until that whole session is dismissed.
const modalFocus=(()=>{
 let session=null,titleSequence=0,redirecting=false;
 const dialog=()=>$('#modalRoot > .dialogback > .dialog');
 const visible=el=>!!el?.isConnected&&!el.closest('[inert],[hidden]')&&!el.matches(':disabled')&&getComputedStyle(el).visibility!=='hidden'&&el.getClientRects().length>0;
 function controls(root){return [...root.querySelectorAll('button,input:not([type="hidden"]),select,textarea,a[href],area[href],summary,[tabindex],[contenteditable="true"],audio[controls],video[controls],iframe')].filter(el=>el.tabIndex>=0&&visible(el)).sort((a,b)=>(a.tabIndex>0?a.tabIndex:Infinity)-(b.tabIndex>0?b.tabIndex:Infinity))}
 function focus(el){if(!el||typeof el.focus!=='function')return;redirecting=true;try{el.focus({preventScroll:true})}finally{redirecting=false}}
 function first(root,last=false){const items=controls(root);focus((last?items.at(-1):items[0])||root)}
 function begin(root){if(!session){const active=document.activeElement,attrs=['id','data-action','data-id','data-view','data-bind','data-field','data-task'],parts=active?attrs.filter(a=>active.hasAttribute(a)).map(a=>'['+a+'="'+CSS.escape(active.getAttribute(a))+'"]'):[];session={opener:active===document.body||active===document.documentElement?null:active,selector:parts.length?active.tagName.toLowerCase()+parts.join(''):null,context:$('#content')?.dataset.renderKey,background:[...document.querySelectorAll('.shell')].filter(el=>!el.contains(root)).map(el=>({el,value:el.getAttribute('inert')}))};for(const {el}of session.background)el.inert=true}return 'imo-modal-title-'+(++titleSequence)}
 function ready(){const root=dialog();if(root)first(root)}
 function end(){const previous=session;session=null;if(!previous)return;for(const {el,value}of previous.background)if(value===null)el.removeAttribute('inert');else el.setAttribute('inert',value);const replacement=previous.selector&&previous.context===$('#content')?.dataset.renderKey?document.querySelector(previous.selector):null,target=visible(previous.opener)?previous.opener:visible(replacement)?replacement:$('#content');if(target&&visible(target))focus(target)}
 document.addEventListener('keydown',event=>{const root=dialog();if(!session||!root)return;if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeModal();return}if(event.key!=='Tab')return;const items=controls(root),current=document.activeElement;if(!items.length||!root.contains(current)||current===root||event.shiftKey&&current===items[0]||!event.shiftKey&&current===items.at(-1)){event.preventDefault();event.stopPropagation();first(root,event.shiftKey)}},true);
 document.addEventListener('focusin',event=>{const root=dialog();if(session&&root&&!redirecting&&!root.contains(event.target))first(root)},true);
 return {begin,ready,end};
})();
function modal(title,body,buttons){const root=$('#modalRoot'),titleId=modalFocus.begin(root);root.innerHTML=`<div class="dialogback"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="${titleId}" aria-label="${esc(title)}" tabindex="-1"><h2 id="${titleId}">${esc(title)}</h2><div class="dialog-body">${body}</div><div class="actions">${buttons||'<button data-action="closeModal">关闭</button>'}</div></section></div>`;modalFocus.ready()}
function closeModal(){$('#modalRoot').replaceChildren();modalFocus.end()}
async function task(fn){if(busy)return;busy=true;document.body.insertAdjacentHTML('afterbegin','<div class="busybar"></div>');$$('.footer button').forEach(b=>b.disabled=true);try{await fn()}catch(e){console.error(e);modal('操作未完成',`<div class="errorbox">${esc(e.message||e)}</div><p>未报告生成成功。已填写资料仍保留在当前页面。</p>`);$('#status').textContent='操作失败：'+(e.message||e)}finally{busy=false;$('.busybar')?.remove();$$('.footer button').forEach(b=>b.disabled=false);updateMeters()}}
function parseXML(text){const d=new DOMParser().parseFromString(text,'application/xml');if(d.getElementsByTagName('parsererror').length)throw Error('XLSX 内部 XML 无法解析');return d}
const xml=d=>new XMLSerializer().serializeToString(d);
const els=(root,name)=>[...root.getElementsByTagNameNS(NS.s,name)];
function relEls(d){return [...d.getElementsByTagNameNS(NS.rel,'Relationship')]}
function resolvePath(base,target){if(target.startsWith('/'))return target.slice(1);const p=base.split('/');p.pop();for(const s of target.split('/')){if(s==='..')p.pop();else if(s!=='.'&&s)p.push(s)}return p.join('/')}
const relPath=p=>p.slice(0,p.lastIndexOf('/')+1)+'_rels/'+p.slice(p.lastIndexOf('/')+1)+'.rels';
function colNum(c){return [...c].reduce((v,x)=>v*26+x.charCodeAt(0)-64,0)}
function colName(n){let a='';while(n>0){n--;a=String.fromCharCode(65+n%26)+a;n=Math.floor(n/26)}return a}
function rect(ref){const a=ref.split(':').map(p=>p.replace(/\$/g,'').match(/^([A-Z]+)(\d+)$/));if(a.some(x=>!x))throw Error('无效区域：'+ref);const b=a[1]||a[0];return {c1:colNum(a[0][1]),r1:+a[0][2],c2:colNum(b[1]),r2:+b[2]}}
function allCells(doc){return els(doc,'c')}
function cellMap(doc){return new Map(allCells(doc).map(c=>[c.getAttribute('r'),c]))}
function cellText(cell,strings){if(!cell)return '';const t=cell.getAttribute('t');if(t==='inlineStr')return els(cell,'t').map(x=>x.textContent).join('');const v=els(cell,'v')[0]?.textContent??'';return t==='s'?(strings[+v]??''):v}
async function readBook(bytes,name='模板'){
 if(bytes.byteLength>35*1024*1024)throw Error(name+' 超过 35MB 限制');
 const zip=await JSZip.loadAsync(bytes,{checkCRC32:true});const parts=Object.values(zip.files).filter(f=>!f.dir);
 if(parts.length>4000||parts.reduce((n,f)=>n+(f._data?.uncompressedSize||0),0)>120*1024*1024)throw Error(name+' 解压内容过大');
 for(const req of ['xl/workbook.xml','xl/_rels/workbook.xml.rels','[Content_Types].xml'])if(!zip.file(req))throw Error(name+' 不是可识别的 XLSX（不支持加密文件或 XLS）');
 const wb=parseXML(await zip.file('xl/workbook.xml').async('string')),rels=parseXML(await zip.file('xl/_rels/workbook.xml.rels').async('string'));
 const strings=zip.file('xl/sharedStrings.xml')?els(parseXML(await zip.file('xl/sharedStrings.xml').async('string')),'si').map(si=>els(si,'t').map(t=>t.textContent).join('')):[];
 const byRel=new Map(relEls(rels).map(r=>[r.getAttribute('Id'),r.getAttribute('Target')]));const sheets=[];
 for(const sh of els(wb,'sheet')){const path=resolvePath('xl/workbook.xml',byRel.get(sh.getAttributeNS(NS.r,'id'))||'');if(!zip.file(path))throw Error(name+' 缺少工作表 '+path);const raw=await zip.file(path).async('string'),doc=parseXML(raw);sheets.push({name:sh.getAttribute('name'),path,doc,raw,cells:cellMap(doc)})}
 const styles=zip.file('xl/styles.xml')?parseXML(await zip.file('xl/styles.xml').async('string')):null;
 const drawings={};for(const path of Object.keys(zip.files).filter(p=>/^xl\/drawings\/drawing\d+\.xml$/.test(p)))drawings[path]=parseXML(await zip.file(path).async('string'));
 return {zip,wb,rels,strings,sheets,styles,drawings,name,date1904:els(wb,'workbookPr')[0]?.getAttribute('date1904')==='1'};
}
function signatureValue(book,rule){const sh=rule.sheet?book.sheets.find(s=>s.name===rule.sheet):book.sheets[0];return sh?cellText(sh.cells.get(rule.cell),book.strings):''}
function recognize(book){const configs=typeof LEGACY_TEMPLATE_CONFIGS==='undefined'?[CONFIG]:[CONFIG,...LEGACY_TEMPLATE_CONFIGS],ids=new Set(configs.flatMap(c=>c.templates).filter(c=>c.identify.every(r=>norm(signatureValue(book,r)).includes(norm(r.contains)))).map(c=>c.id));return CONFIG.templates.filter(c=>ids.has(c.id))}
async function acceptTemplates(files,options={}){
 const candidates=[];const problems=[];
 for(const f of files){
  if(/\.xlsx$/i.test(f.name))candidates.push({name:f.name,bytes:new Uint8Array(await f.arrayBuffer())});
  else if(/\.zip$/i.test(f.name)){if(f.size>50*1024*1024){problems.push(f.name+'：ZIP 超过 50MB');continue}const z=await JSZip.loadAsync(await f.arrayBuffer(),{checkCRC32:true});const entries=Object.values(z.files).filter(x=>!x.dir&&/\.xlsx$/i.test(x.name)&&!/(^|\/)~\$/.test(x.name));if(entries.length>100)throw Error('ZIP 内 XLSX 过多，最多 100 个');let total=0;for(const x of entries){total+=x._data?.uncompressedSize||0;if(total>100*1024*1024)throw Error('ZIP 解压后超过 100MB');candidates.push({name:x.name.split('/').at(-1),bytes:await x.async('uint8array')})}}
  else if(!/\.DS_Store$|desktop\.ini$/i.test(f.name))problems.push(f.name+'：非 XLSX/ZIP，已忽略');
 }
 const replace=options.replace??document.querySelector('#replaceMatchingTemplates')?.checked??false,replaced=new Set();
 for(const c of candidates){try{if(/^~\$/.test(c.name))continue;const book=await readBook(c.bytes,c.name);const matched=recognize(book);if(matched.length!==1){problems.push(c.name+'：'+(matched.length?'同时匹配多个模板，请检查映射':'无法按工作表与表头识别'));continue}const id=matched[0].id,mapping=typeof knownTemplateMapping==='function'?knownTemplateMapping(id,book):matched[0];const entry={...c,book,token:uid(),mapping};if(replace&&!replaced.has(id)){templates.delete(id);replaced.add(id)}if(!templates.has(id))templates.set(id,[]);templates.get(id).push(entry);if(templates.get(id).length===1&&mapping)CONFIG.templates[CONFIG.templates.findIndex(x=>x.id===id)]=structuredClone(mapping)}catch(e){problems.push(c.name+'：'+e.message)}}
 importProblems.push(...problems);changed();render();toast('模板读取完成，已识别 '+templates.size+' 类；请检查重复和缺失项。');
}
function chosenTemplate(id){const a=templates.get(id)||[];return a.length===1?a[0]:null}
function storageAreaKey(value){const k=String(value||'').trim().replace(/\s*:\s*$/,'').replace(/\s+/g,' ').toUpperCase();return ({'BONDED STORES':'BONDED STORE','DECK STORE':'DECK STORES','ENGINE STORE':'ENGINE STORES','PROVISION':'PROVISIONS'})[k]||k||'__UNASSIGNED__'}
function storeDetailRecords(){const groups=new Map();for(const r of state.stores){const key=storageAreaKey(r.location);if(!groups.has(key)){const known=['BONDED STORE','DECK STORES','ENGINE STORES','PROVISIONS'].includes(key),label=known?key:String(r.location||'UNASSIGNED STORES').trim().replace(/\s*:\s*$/,'');groups.set(key,{header:{id:'heading-'+key,_sectionHeader:true,_sectionId:key,name:label+':',quantity:'',unit:''},rows:[]})}const category=String(r.category||'').trim();groups.get(key).rows.push({...r,_sectionId:key,name:(category&&storageAreaKey(category)!==key?category+': ':'')+r.name})}return [...groups.values()].flatMap(g=>[g.header,...g.rows])}
function storeStorageSummary(){const short={'BONDED STORE':'Bonded stores','DECK STORES':'Deck','ENGINE STORES':'Engine room','PROVISIONS':'Provisions'};return [...new Map(state.stores.map(r=>[storageAreaKey(r.location),String(r.location||'').trim().replace(/\s*:\s*$/,'')])).entries()].map(([key,label])=>short[key]||label).filter(Boolean).join(' / ')}
function sectionRecords(source,id){
 const side=selectedSide(id),rs=roster(side);
 if(source==='arrival'||source==='departure')return roster(source);
 if(source==='effects')return rs.map(p=>({...p,...(state.effects[p.id]||{})}));
 if(source==='vaccines')return rs.map(p=>({...p,...(getPerson(p.id)?.vaccines||{})}));
 if(source==='ports')return portOutputSelection().rows;
 if(source==='nilItems')return activeNilItems().map(r=>({...r,value:state.nil[r.key]??''}));
 if(source==='stores'){
  return storeDetailRecords();
 }
 return state[source]||[];
}
function pagesFor(records,capacity){
 if(records.some(r=>r._sectionHeader))return pagesForStoreSections(records,capacity);
 if(!Number.isInteger(capacity)||capacity<1)throw Error('明细容量无效');const pages=[[]];for(let i=0;i<records.length;){const group=[records[i++]];if(group[0]._group)while(i<records.length&&records[i]._group===group[0]._group)group.push(records[i++]);if(group.length>capacity)throw Error('单条记录及其位置说明超过整页容量，请缩短内容或拆成多条');if(pages.at(-1).length+group.length>capacity)pages.push([]);pages.at(-1).push(...group)}return pages;
}
function pagesForStoreSections(records,capacity){if(!Number.isInteger(capacity)||capacity<2)throw Error('物料分类标题与明细每页至少需要 2 行');const pages=[[]];let header=null,pageSection=null;for(const r of records){if(r._sectionHeader){header=r;continue}if(!header)throw Error('物料记录缺少分类标题');let page=pages.at(-1);const needsHeader=pageSection!==header._sectionId;if(page.length+(needsHeader?2:1)>capacity){pages.push([]);page=pages.at(-1);pageSection=null}if(pageSection!==header._sectionId){page.push({...header});pageSection=header._sectionId}page.push(r)}return pages}
function effectiveDate(id){return state.voyage[selectedSide(id)+'Date']}
function signatureDate(id){const s=selectedSide(id);return state.voyage[s==='arrival'?'signArrival':'signDeparture']||state.voyage[s+'Date']}
function valuesContext(id,page=1,total=1){const side=selectedSide(id),v=state.voyage;const passenger=state.declarations.passengers==='none'?'NIL':state.passengers.length;
 return {...state,$blank:'',$port:v[side+'Port'],$date:v[side+'Date'],$from:side==='arrival'?v.lastPort:v.nextPort,$to:v.nextPort,$portLabel:'2. Port of '+(side==='arrival'?'Arrival':'Departure')+(id===7?' :':id===4?'.':''),$dateLabel:'3. Date of '+(side==='arrival'?'Arrival':'Departure')+(id===7?' :':id===4?'.':''),$fromLabel:id===7?(side==='arrival'?'5. Last Port :':'5. Next Port :'):(side==='arrival'?'5. Port arrived from':'5. Port departure to'),$signatureDate:signatureDate(id),$crewCount:roster(side).length,$crewCountLabel:roster(side).length+' including Master',$aboardCount:roster(side).length+(state.declarations.passengers==='records'?state.passengers.length:0),$passengerCount:passenger,$page:page+' / '+total,$arrivalMark:side==='arrival'?'X':'',$departureMark:side==='departure'?'X':'',$master:state.ship.master,$storage:v.storage||(state.declarations.stores==='none'?'NIL':storeStorageSummary())};
}
const dateFields=new Set(['birthDate','seamanExpiry','passportExpiry','signOnDate','arrivalDate','departureDate','embarkDate','onsetDate','expiry','cholera','yellowFever']);
const textFields=new Set(['name','rank','sex','nationality','birthPlace','seamanBook','passport','signOnPlace','port','country','security','remarks','articles','signature','unit','mark','embarkPort','illness','result','disposal','cholera','yellowFever']);
const schema={
 profiles:[['name','姓名'],['rank','职务'],['sex','性别'],['nationality','国籍'],['birthDate','出生日期'],['birthPlace','出生地点'],['seamanBook','海员证号'],['seamanExpiry','海员证有效期'],['passport','护照号'],['passportExpiry','护照有效期'],['signOnDate','上船日期'],['signOnPlace','上船地点']],
 arrival:[],departure:[],
 effects:[['name','姓名（关联）','readonly'],['rank','职务（关联）','readonly'],['cigs','香烟 / 支'],['beer','啤酒 / L'],['wine','葡萄酒 / L'],['spirit','烈酒 / L'],['articles','其他物品'],['signature','签署文字（可空）']],
 ports:[['port','港口'],['country','国家'],['security','保安等级'],['remarks','备注'],['arrivalDate','到港日期'],['departureDate','离港日期']],
 stores:[['name','物料名称'],['quantity','数量'],['unit','单位'],['location','存放位置'],['category','分类（可空）']],
 passengers:[['name','姓名'],['rank','舱位 / 身份'],['nationality','国籍'],['birthDate','出生日期'],['birthPlace','出生地点'],['passport','护照号'],['passportExpiry','护照有效期']],
 medicines:[['name','药品名称'],['quantity','数量（含单位）'],['expiry','有效期'],['mark','存放标记 / NIS #']],
 cases:[['personId','关联船员（可选）','person'],['name','姓名'],['rank','舱位 / 职务'],['age','年龄'],['sex','性别'],['nationality','国籍'],['embarkPort','上船港口'],['embarkDate','上船日期'],['illness','疾病情况'],['onsetDate','发病日期'],['result','疾病结果'],['disposal','病例处置']],
 vaccines:[['name','姓名（关联）','readonly'],['rank','职务（关联）','readonly'],['nationality','国籍（关联）','readonly'],['cholera','霍乱有效日期'],['yellowFever','黄热病有效日期']]
};schema.arrival=schema.profiles;schema.departure=schema.profiles;
const aliases={name:['name','crew name','family name given names','姓名','船员姓名'],rank:['rank','rating','rank rating','position','职务','职务等级','class'],sex:['sex','gender','性别'],nationality:['nationality','国籍'],birthDate:['date of birth','birth date','dob','出生日期','生日'],birthPlace:['place of birth','birth place','出生地点','出生地'],seamanBook:['seaman book','seafarers book','seaman number','seaman no','海员证号码','海员证号','海员证'],seamanExpiry:['seaman expiry','seaman valid date','海员证有效期','海员证到期日期'],passport:['passport','passport no','passport number','护照号码','护照号','护照'],passportExpiry:['passport expiry','passport valid date','护照有效期','护照到期日期'],signOnDate:['sign on date','上船日期','上船时间'],signOnPlace:['sign on place','上船地点','上船港口'],cigs:['cigarettes','cigarettes stk','香烟','香烟支'],beer:['beer','beer l','啤酒'],wine:['wine','wine l','葡萄酒'],spirit:['spirit','spirit l','烈酒'],articles:['other articles','其他物品','个人物品'],port:['port','ports','港口'],country:['country','国家'],security:['security level','保安等级'],remarks:['remarks','port remarks','备注'],arrivalDate:['arrival date','date of arrival','到港日期'],departureDate:['departure date','date of departure','离港日期'],quantity:['quantity','qty','数量'],unit:['unit','单位'],location:['location','storage','存放位置','存放地点'],category:['category','分类'],expiry:['expiry','expired date','有效期'],mark:['mark','mark nis','存放标记'],cholera:['cholera','霍乱','霍乱有效日期'],yellowFever:['yellow fever','黄热病','黄热病有效日期'],age:['age','年龄'],illness:['illness','nature of illness','疾病情况'],onsetDate:['onset date','发病日期'],result:['result','疾病结果'],disposal:['disposal','病例处置'],embarkDate:['embarkation date','date of embarkation','上船日期'],embarkPort:['port of embarkation','上船港口']};
function parseDelimited(text){
 text=text.replace(/^\uFEFF/,'');const first=text.split(/\r?\n/)[0]||'';const sep=first.includes('\t')?'\t':',';const rows=[];let row=[],v='',quote=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quote&&text[i+1]==='"'){v+='"';i++}else if(!quote&&v==='')quote=true;else if(quote)quote=false;else v+=c}else if(c===sep&&!quote){row.push(v);v=''}else if((c==='\n'||c==='\r')&&!quote){if(c==='\r'&&text[i+1]==='\n')i++;row.push(v);if(row.some(x=>x!==''))rows.push(row);row=[];v=''}else v+=c}
 if(quote)throw Error('CSV 引号不成对');row.push(v);if(row.some(x=>x!==''))rows.push(row);return rows;
}
async function spreadsheetMatrices(file){
 if(/\.xlsx$/i.test(file.name)){const book=await readBook(new Uint8Array(await file.arrayBuffer()),file.name);return book.sheets.map(sh=>{const cells=[...sh.cells];let maxRow=0,maxCol=0;for(const [ref] of cells){const p=rect(ref);maxRow=Math.max(maxRow,p.r1);maxCol=Math.max(maxCol,p.c1)}if(maxRow>10000||maxCol>100)throw Error('导入表过大，最多 10,000 行、100 列');const rows=Array.from({length:maxRow},()=>Array(maxCol).fill(''));for(const [ref,c]of cells){const p=rect(ref);let value=cellText(c,book.strings);const sty=+c.getAttribute('s');const xf=els(book.styles||document,'cellXfs')[0]?.children[sty];const fmtId=+(xf?.getAttribute('numFmtId')||0);const fmt=els(book.styles||document,'numFmt').find(x=>+x.getAttribute('numFmtId')===fmtId)?.getAttribute('formatCode')||'';const number=c.getAttribute('t')!=='s'&&c.getAttribute('t')!=='inlineStr'&&/^\d+(\.\d+)?$/.test(value);if(number&&((fmtId>=14&&fmtId<=22)||/[dy]/i.test(fmt.replace(/"[^"]*"/g,''))))value=fromSerial(value,book.date1904);else if(number&&/^0+$/.test(fmt))value=value.padStart(fmt.length,'0');rows[p.r1-1][p.c1-1]=value}return {name:sh.name,rows,date1904:book.date1904}})}
 const bytes=await file.arrayBuffer();let text=new TextDecoder('utf-8').decode(bytes);if(text.includes('\uFFFD'))text=new TextDecoder('gb18030').decode(bytes);return [{name:file.name,rows:parseDelimited(text)}];
}

schema.nilItems=[["name","申报项目名称"],["value","申报内容"]];

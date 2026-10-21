// Choice controls edit the same underlying text values used by imports and paste.
const EDITOR_CUSTOM='__imo_custom__';
const RANK_GROUPS=[
 ['甲板部 · 驾驶员',[
  ['Master','船长'],['Staff Captain','副船长'],['Chief Off','大副'],['Sr. 2nd Off','资深二副'],['2nd Off','二副'],['Jr. 2nd Off','初级二副'],['3rd Off','三副'],['Jr. 3rd Off','初级三副'],['4th Off','四副'],['Deck Cadet','甲板实习生'],['Trainee Officer','见习驾驶员']
 ]],
 ['甲板部 · 其他船员',[
  ['Bosun','水手长'],['AB','一水'],['AB1','一水'],['AB2','一水'],['AB3','一水'],['OS','二水'],['Deck Trainee','见习水手'],['Pumpman','泵工']
 ]],
 ['轮机部 · 轮机员',[
  ['Chief Eng','轮机长'],['2nd Eng','大管轮'],['Jr. 2nd Eng','初级大管轮'],['3rd Eng','二管轮'],['Jr. 3rd Eng','初级二管轮'],['4th Eng','三管轮'],['Jr. 4th Eng','初级三管轮'],['5th Eng','四管轮'],['Engine Cadet','轮机实习生'],['Trainee Engineer','见习轮机员']
 ]],
 ['轮机部 · 电气与其他船员',[
  ['ETO','电子电气员'],['Asst. ETO','助理电子电气员'],['Electrician','电工'],['Asst. Electrician','助理电工'],['Fitter','机工长 / 铜匠'],['Motorman','机工'],['Oiler','机工'],['Wiper','实习机工'],['Engine Trainee','见习机工'],['Welder','焊工'],['Repairman','修理工']
 ]],
 ['事务部 · 厨房与服务',[
  ['Chief Steward','事务长'],['Steward','服务员'],['Chief Cook','大厨'],['2nd Cook','二厨'],['Cook','厨师'],['Asst. Cook','助厨'],['Messman','服务员'],['Galley Utility','厨房勤杂员']
 ]],
 ['其他人员',[
  ['Supernumerary','随船人员'],['Passenger','旅客']
 ]]
];
const RANK_CHOICES=RANK_GROUPS.flatMap(([group,rows])=>rows.map(([value,label])=>[value,label+' '+value,group]));
// Recognize template-era spellings without silently changing stored declarations.
const LEGACY_RANK_ALIASES={'C/Off':'Chief Off','2/Off':'2nd Off','3/Off':'3rd Off','4/Off':'4th Off','D/Cadet':'Deck Cadet','C/Eng':'Chief Eng','E/Cadet':'Engine Cadet','C/Cook':'Chief Cook','2/Cook':'2nd Cook'};
function rankChoicesFor(value){const canonical=Object.hasOwn(LEGACY_RANK_ALIASES,value)?LEGACY_RANK_ALIASES[value]:null;if(!canonical)return RANK_CHOICES;const label=RANK_GROUPS.flatMap(([,rows])=>rows).find(([v])=>v===canonical)?.[1]||'职务';return [[value,label+' '+value+'（原写法）','当前记录 · 保留原写法'],...RANK_CHOICES]}
const NATIONALITY_CHOICES=[['CHINESE','中国籍 CHINESE'],['FILIPINO','菲律宾籍 FILIPINO'],['INDIAN','印度籍 INDIAN'],['NORWEGIAN','挪威籍 NORWEGIAN'],['ROMANIAN','罗马尼亚籍 ROMANIAN'],['POLISH','波兰籍 POLISH'],['CROATIAN','克罗地亚籍 CROATIAN'],['UKRAINIAN','乌克兰籍 UKRAINIAN'],['RUSSIAN','俄罗斯籍 RUSSIAN'],['INDONESIAN','印度尼西亚籍 INDONESIAN'],['MYANMAR','缅甸籍 MYANMAR'],['VIETNAMESE','越南籍 VIETNAMESE'],['PAKISTANI','巴基斯坦籍 PAKISTANI'],['BANGLADESHI','孟加拉国籍 BANGLADESHI'],['SRI LANKAN','斯里兰卡籍 SRI LANKAN']];
const UNIT_CHOICES=[['pcs','件 / 个 pcs'],['kgs','千克 kgs'],['MT','吨 MT'],['Ltrs','升 Ltrs'],['mtrs','米 mtrs'],['Ctn','箱 Ctn'],['Case','箱 Case'],['Btls','瓶 Btls'],['Set','套 Set'],['Box','盒 Box'],['Pack','包 Pack'],['Roll','卷 Roll']];
const REMARK_CHOICES=[['CARGO OPERATION','货物作业'],['BUNKER','加油'],['CREW CHANGE','船员换班'],['PROVISIONS','补给'],['REPAIRS','维修'],['DRY DOCK','坞修'],['TRANSIT','通过 / 转运'],['ANCHORAGE','锚泊']];
function countryChoices(value='',upper=false){const choices=PORT_CATALOG.countries.map(c=>[upper?c.name.toUpperCase():c.name,c.nameZh+' · '+c.name+' ('+c.code+')']);if(value&&!choices.some(([v])=>v===value)){const found=PORT_CATALOG.ports.find(p=>norm(p.country)===norm(value))||PORT_CATALOG.countries.find(c=>norm(c.name)===norm(value)||norm(c.code)===norm(value));if(found)choices.unshift([value,(found.countryZh||found.nameZh)+' · '+value])}return choices}
function updateEditorValue(input,value){input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));if(input.dataset.table==='stores'&&input.dataset.field==='location')input.dispatchEvent(new Event('change',{bubbles:true}));}
function choiceOptions(choices){const groups=new Map();for(const [value,label,group='']of choices){if(!groups.has(group))groups.set(group,[]);groups.get(group).push(`<option value="${esc(value)}">${esc(label)}</option>`)}return [...groups].map(([group,options])=>group?`<optgroup label="${esc(group)}">${options.join('')}</optgroup>`:options.join('')).join('')}
function addChoiceEditor(input,choices){if(input.closest('.choice-editor')||input.readOnly||input.type==='checkbox')return;const value=input.value,known=choices.some(([v])=>v===value),wrap=document.createElement('div'),select=document.createElement('select');wrap.className='choice-editor';select.className='value-choice';select.setAttribute('aria-label',(input.getAttribute('aria-label')||input.closest('label')?.querySelector('span')?.textContent||'字段')+' · 选择');select.innerHTML='<option value="">未填写</option>'+choiceOptions(choices)+`<option value="${EDITOR_CUSTOM}">自定义 / 其他…</option>`;select.value=value===''?'':known?value:EDITOR_CUSTOM;input.before(wrap);wrap.append(select,input);input.hidden=select.value!==EDITOR_CUSTOM;input.classList.add('custom-choice-input');select.addEventListener('change',()=>{if(select.value===EDITOR_CUSTOM){input.hidden=false;input.focus({preventScroll:true});return}input.hidden=true;updateEditorValue(input,select.value)});input.addEventListener('input',()=>{if(!input.hidden)select.value=EDITOR_CUSTOM})}
function addDateEditor(input,key){
 if(input.closest('.date-editor')||input.readOnly)return;
 const wrap=document.createElement('div'),calendar=document.createElement('span'),picker=document.createElement('input');
 wrap.className='date-editor';calendar.className='date-calendar';
 input.before(wrap);input.type='text';input.hidden=false;input.autocomplete='off';
 input.placeholder=['cholera','yellowFever'].includes(key)?'YYYY-MM-DD / NIL / lifelong':'YYYY-MM-DD / 文字';
 input.title='直接输入日期或文字；点击右侧日历选择日期。';
 calendar.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="16" rx="2"></rect><path d="M7 2.5v5M17 2.5v5M3.5 10.5h17M7 14h2M12 14h2M7 17.5h2M12 17.5h2"></path></svg>';
 calendar.title='选择日期';picker.type='date';picker.className='date-calendar-picker';
 picker.setAttribute('aria-label',(input.getAttribute('aria-label')||input.closest('label')?.querySelector('span')?.textContent||'日期')+' · 打开日历');
 const sync=()=>{picker.value=dateValue(input.value)||''};sync();
 for(const attr of ['min','max'])if(input.hasAttribute(attr))picker.setAttribute(attr,input.getAttribute(attr));
 calendar.append(picker);wrap.append(input,calendar);input.addEventListener('input',sync);
 const open=event=>{sync();if(typeof picker.showPicker==='function'){try{picker.focus({preventScroll:true});picker.showPicker();event.preventDefault()}catch{}}};
 picker.addEventListener('click',open);picker.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')open(event)});
 picker.addEventListener('change',()=>{updateEditorValue(input,picker.value);input.dispatchEvent(new Event('change',{bubbles:true}))});
}
function remarkParts(value){return String(value||'').split(/[,\n]+/).map(s=>s.trim()).filter(Boolean)}
function remarkLabels(value){return remarkParts(value).map(part=>REMARK_CHOICES.find(([v])=>v===part)?.[1]||part)}
function remarksPreview(value){return remarkLabels(value).map(label=>`<span class="remark-tag">${esc(label)}</span>`).join('')||'<span class="muted">尚未填写用途</span>'}
function addRemarksEditor(input,view){
 if(input.closest('.remarks-editor'))return;
 const area=document.createElement('textarea');for(const attr of input.attributes)if(attr.name!=='value'&&attr.name!=='type')area.setAttribute(attr.name,attr.value);
 area.value=input.value;area.rows=2;area.wrap='soft';area.placeholder='CARGO OPERATION,BUNKER…';input.replaceWith(area);
 const wrap=document.createElement('div'),footer=document.createElement('div'),preview=document.createElement('div'),button=document.createElement('button');wrap.className='remarks-editor';footer.className='remarks-footer';preview.className='remarks-preview';
 area.before(wrap);wrap.append(area,footer);footer.append(preview,button);button.type='button';button.className='small';button.textContent='选择用途';button.dataset.action='chooseRemarks';button.dataset.view=view;button.dataset.id=area.dataset.id;
 const refresh=()=>{preview.innerHTML=remarksPreview(area.value);area.style.height='auto';area.style.height=Math.min(160,Math.max(48,area.scrollHeight+2))+'px'};
 area.addEventListener('input',refresh);refresh();
}
function enhanceChoiceControls(){for(const input of $$('#content input[data-table],#content input[data-bind]')){if(input.readOnly)continue;const key=input.dataset.field||input.dataset.bind?.split('.').at(-1),view=input.dataset.table,bind=input.dataset.bind;if(dateFields.has(key)||input.type==='date'){addDateEditor(input,key);continue}if(bind==='effectsDeclaration'){addChoiceEditor(input,[['NIL','无 · NIL']]);continue}if(key==='security'){addChoiceEditor(input,[['1','1 · 通常'],['2','2 · 加强'],['3','3 · 特别']]);continue}if(key==='sex'){addChoiceEditor(input,[['M','男 M'],['F','女 F'],['X','其他 X']]);continue}if(key==='rank'){addChoiceEditor(input,rankChoicesFor(input.value));continue}if(key==='nationality'){addChoiceEditor(input,NATIONALITY_CHOICES);continue}if(key==='country'||bind==='ship.flag'){addChoiceEditor(input,countryChoices(input.value,bind==='ship.flag'));continue}if(key==='unit'){addChoiceEditor(input,UNIT_CHOICES);continue}if(key==='location'&&view==='stores'){addChoiceEditor(input,[['BONDED STORE','保税库 BONDED STORE'],['DECK STORES','甲板物料 DECK STORES'],['ENGINE STORES','轮机物料 ENGINE STORES'],['PROVISIONS','食品 PROVISIONS']]);continue}if(bind==='health.certType'){addChoiceEditor(input,[['Ship Sanitation Control Exemption Certificate','船舶免予卫生控制措施证书'],['Ship Sanitation Control Certificate','船舶卫生控制措施证书']]);continue}if(key==='remarks'&&['ports','plannedPorts'].includes(view))addRemarksEditor(input,view)}}
const enhanceChoicesBefore=enhanceView;enhanceView=function(){enhanceChoicesBefore();enhanceChoiceControls()};
actions.chooseRemarks=el=>{const row=state[el.dataset.view]?.find(r=>r.id===el.dataset.id);if(!row)throw Error('记录不存在');const parts=remarkParts(row.remarks),custom=parts.filter(s=>!REMARK_CHOICES.some(([v])=>v===s));modal('选择本次港口用途',`<p>可多选；不选择表示未填写。其他用途可以补充英文。</p><div class="grid two">${REMARK_CHOICES.map(([v,l])=>`<label class="checkline"><input type="checkbox" data-remark-option="${v}" ${parts.includes(v)?'checked':''}><span>${l} · ${v}</span></label>`).join('')}</div><label><span>其他用途（多个用英文逗号分隔）</span><input id="customRemarks" value="${esc(custom.join(','))}"></label>`,`<button data-action="closeModal">取消</button><button class="primary" data-action="applyRemarks" data-view="${el.dataset.view}" data-id="${esc(el.dataset.id)}">应用到此记录</button>`)};
actions.applyRemarks=el=>{const value=[...$$('[data-remark-option]:checked').map(e=>e.dataset.remarkOption),$('#customRemarks').value.trim()].filter(Boolean).join(',');mutateCell(el.dataset.view,el.dataset.id,'remarks',value);closeModal();render()};
const choiceAddStoreBefore=actions.addStore;actions.addStore=el=>{choiceAddStoreBefore(el);addChoiceEditor($('#newStoreUnit'),UNIT_CHOICES);addChoiceEditor($('#newStoreLocation'),STORE_LOCATIONS.map(([v,l])=>[v,l+' · '+v]))};
const choiceMoveStoreBefore=actions.moveStoreGroup;actions.moveStoreGroup=el=>{choiceMoveStoreBefore(el);if($('#moveStoreLocation'))addChoiceEditor($('#moveStoreLocation'),STORE_LOCATIONS.map(([v,l])=>[v,l+' · '+v]))};

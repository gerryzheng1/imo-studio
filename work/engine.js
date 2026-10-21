function mappingErrors(c,book){
 const errors=[];const expected=c.sheets.map(s=>s.name),actual=book.sheets.map(s=>s.name);
 if(expected.length!==actual.length||expected.some((n,i)=>actual[i]!==n))errors.push('工作表或顺序与映射不符：实际 '+actual.join('、')+'；预期 '+expected.join('、'));
 for(const s of c.sheets){const sh=book.sheets.find(x=>x.name===s.name);if(!sh){errors.push('缺少工作表 '+s.name);continue}
  if(s.expectedDimension&&els(sh.doc,'dimension')[0]?.getAttribute('ref')!==s.expectedDimension)errors.push(s.name+' 使用区域与已核查模板不符，可能新增了未映射的历史记录，请核对 expectedDimension 与清理范围');
  for(const [ref,label]of Object.entries(s.expectedLabels||{}))if(norm(cellText(sh.cells.get(ref),book.strings))!==norm(label))errors.push(s.name+'!'+ref+' 表头 / 静态标签与映射不符，可能发生了行列移动');
  const merges=els(sh.doc,'mergeCell').map(x=>x.getAttribute('ref')).sort();if(s.expectedMerges&&JSON.stringify([...s.expectedMerges].sort())!==JSON.stringify(merges))errors.push(s.name+' 合并区域已变化，请调整映射');
  for(const f of s.fields||[]){try{const r=rect(f.cell);if(r.r1!==r.r2||r.c1!==r.c2)throw Error();if(!sh.cells.has(f.cell))errors.push(s.name+'!'+f.cell+' 映射目标不存在');const m=merges.find(x=>{const a=rect(x);return r.r1>=a.r1&&r.r1<=a.r2&&r.c1>=a.c1&&r.c1<=a.c2});if(m&&m.split(':')[0]!==f.cell&&f.key!=='$blank')errors.push(s.name+'!'+f.cell+' 不是合并区域左上角')}catch(e){errors.push('无效字段位置 '+s.name+'!'+f.cell)}}
  if(s.table){const t=s.table;if(!Array.isArray(t.rows)||t.rows.length===0||new Set(t.rows).size!==t.rows.length||t.rows.some(x=>!Number.isInteger(x)||x<1||x>1048576))errors.push(s.name+' 明细行配置无效');if(!schema[t.source]&&!['arrival','departure','effects','vaccines'].includes(t.source))errors.push(s.name+' 明细数据源无效');for(const col of Object.values(t.columns||{}))if(!/^[A-Z]{1,3}$/.test(col))errors.push(s.name+' 明细列无效 '+col);for(const r of t.rows||[])if(!els(sh.doc,'row').some(x=>+x.getAttribute('r')===r))errors.push(s.name+' 明细第 '+r+' 行不存在')}
  if(s.table?.source==='stores'){if(s.table.rows.length<2)errors.push(s.name+' 分类标题与物料每页至少需要 2 行');if(s.table.headerStyleCell&&!sh.cells.has(s.table.headerStyleCell))errors.push(s.name+' 分类标题样式来源不存在')}
  for(const ref of [...(s.clear||[]),...(s.table?.clear||[])])try{rect(ref)}catch(e){errors.push(e.message)}
 }
 for(const rule of c.drawingRules||[]){const drawing=book.drawings[rule.path];if(!drawing){errors.push('缺少映射的绘图 '+rule.path);continue}const ids=[...drawing.getElementsByTagNameNS('*','cNvPr')].map(x=>x.getAttribute('id'));for(const id of rule.nilAnchorIds)if(!ids.includes(String(id)))errors.push(rule.path+' 的历史 NIL / 斜线对象 ID '+id+' 不存在，请核对映射')}
 return errors;
}
function checkConfiguration(config){
 config=migrateNilMapping(config);
 if(!config||!Array.isArray(config.templates)||config.templates.length!==10)throw Error('映射必须恰好包含 10 个模板');
 if(new Set(config.templates.map(c=>c.id)).size!==10||config.templates.some(c=>!Number.isInteger(c.id)||c.id<1||c.id>10||!Array.isArray(c.identify)||!c.identify.length||!Array.isArray(c.sheets)||!c.sheets.length))throw Error('映射模板编号、识别规则或工作表无效');
 for(const c of config.templates)for(const s of c.sheets){if(!s.name||!Array.isArray(s.fields))throw Error('工作表名称或字段列表无效');for(const f of s.fields){rect(f.cell);if(typeof f.key!=='string'||/[<>]/.test(f.key))throw Error('字段来源无效')}if(s.table){if(!Array.isArray(s.table.rows)||!s.table.rows.length||s.table.rows.length>1000)throw Error('明细行数量无效');for(const col of Object.values(s.table.columns))if(!/^[A-Z]{1,3}$/.test(col))throw Error('明细列无效')}}
 return config;
}
function checkAll(){
 const results=CONFIG.templates.map(c=>({id:c.id,title:c.title,errors:[],warnings:[],notes:[],pages:0}));
 for(const r of results){const c=CONFIG.templates.find(c=>c.id===r.id);const entry=chosenTemplate(r.id);if(!entry){r.errors.push((templates.get(r.id)?.length||0)>1?'同类模板重复，须保留一个版本':'尚未选择此模板')}else{r.errors.push(...mappingErrors(c,entry.book));if(entry.book.zip.file('xl/calcChain.xml')||entry.book.sheets.some(s=>els(s.doc,'f').length))r.notes.push('保留公式并更新已知缓存；打开 Excel/WPS 后自动重算。')}
  const required=['name','flag','master'];if([7,10].includes(r.id))required.push('company');if([9,10].includes(r.id))required.push('imo');if(r.id===9)required.push('registry','callSign');if(r.id===6)required.push('netTonnage');
  const labels={name:'船名',flag:'船旗',master:'船长姓名',company:'船公司',imo:'IMO 编号',registry:'船籍港',callSign:'呼号',netTonnage:'净吨'};
  for(const k of required)if(isBlank(state.ship[k]))r.errors.push('缺少船舶资料：'+labels[k]);
  if(!state.ship.confirmed)r.errors.push('船舶档案尚未确认');
  if([9,10].includes(r.id)&&state.ship.imo){if(!/^\d{7}$/.test(state.ship.imo))r.errors.push('IMO 编号应为 7 位数字');else if([...state.ship.imo.slice(0,6)].reduce((n,x,i)=>n+(+x)*(7-i),0)%10!==+state.ship.imo[6])r.warnings.push('IMO 编号校验位不符，请核查原始数据')}
  if(r.id===6&&state.ship.netTonnage!==''&&(!Number.isFinite(+state.ship.netTonnage)||+state.ship.netTonnage<0))r.errors.push('净吨必须为非负数');
  const side=selectedSide(r.id),v=state.voyage;
  for(const k of [side+'Port',side+'Date',side==='arrival'?'lastPort':'nextPort'])if(isBlank(v[k]))r.errors.push('缺少航次资料：'+({arrivalPort:'到港港口',departurePort:'离港港口',arrivalDate:'到港日期',departureDate:'离港日期',lastPort:'上一港',nextPort:'下一港'}[k]));
  for(const k of [side+'Date',...(isOutputKeyEnabled(r.id,'$signatureDate')?[side==='arrival'?'signArrival':'signDeparture']:[])])if(v[k]&&!dateValue(v[k]))r.errors.push('无效日期：'+k+' = '+v[k]);
  if(dateValue(v.arrivalDate)&&dateValue(v.departureDate)&&dateValue(v.arrivalDate)>dateValue(v.departureDate))r.errors.push('离港日期早于到港日期');
  if(r.id===6&&isBlank(v.nextPort))r.errors.push('健康申报缺少下一港');
  if(r.id===8&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(v.month||''))r.errors.push('请选择本次药品文件的年月');
  if([5,6,9].includes(r.id)){const declaration=state.declarations.passengers;if(!['none','records'].includes(declaration))r.errors.push('请先明确确认本次是否有旅客，人数不能从未填写状态推断');if(declaration==='none'&&state.passengers.length)r.errors.push('旅客已选“无”但名单仍有记录');if(declaration==='records'&&!state.passengers.length)r.errors.push('旅客已选“有记录”但名单为空')}
  const crew=roster(side);if([1,2,3,5,6,10].includes(r.id)){
   if(!crew.length)r.errors.push((side==='arrival'?'进港':'离港')+'名单为空，须明确选入本次船员');
   const ids=state[side].map(e=>e.personId);if(new Set(ids).size!==ids.length)r.errors.push('同一人员在名单中重复');for(const id of ids)if(!getPerson(id))r.errors.push('名单引用了不存在的人员标识 '+id);
   const masters=crew.filter(p=>norm(p.name)===norm(state.ship.master));if(state.ship.master&&masters.length!==1)r.errors.push('船长姓名必须在本次'+(side==='arrival'?'进港':'离港')+'名单中唯一匹配');
  }
  if([1,2].includes(r.id))checkCrewRows(crew,r,effectiveDate(r.id));
  if(r.id===3){if(isBlank(state.effectsDeclaration))r.errors.push('请填写应税 / 受限物品申报（可明确填写 NIL）');for(const [i,p]of crew.entries())for(const k of ['cigs','beer','wine','spirit','articles']){const value=state.effects[p.id]?.[k];if(isBlank(value))r.errors.push('个人物品第 '+(i+1)+' 人 '+p.name+'：'+schema.effects.find(x=>x[0]===k)[1]+' 未填写');if(k!=='articles'&&!isBlank(value)&&!isNil(value)&&(!Number.isFinite(+value)||+value<0))r.errors.push(p.name+' 的 '+k+' 应为非负数或 NIL')}}
  if(r.id===5&&isBlank(v.stay))r.errors.push('缺少停留时间');
  const sources={4:'ports',5:'stores',7:'passengers',8:'medicines'};if(sources[r.id])checkSection(sources[r.id],r);
  if(r.id===6){for(let i=1;i<=9;i++)if(!['Yes','No'].includes(state.health['q'+i]))r.errors.push('健康问题 '+i+' 尚未回答 Yes / No');for(const k of ['certType','certDate','certPlace','surgeon'])if(isBlank(state.health[k]))r.errors.push('缺少卫生资料：'+({certType:'卫生证书类别',certDate:'签发日期',certPlace:'签发地点',surgeon:'船医 / 会签人（无则填 NIL）'}[k]));if(state.health.certDate&&!dateValue(state.health.certDate))r.errors.push('卫生证书签发日期无效');if(state.health.certExpiry){if(!dateValue(state.health.certExpiry))r.errors.push('卫生证书到期日期无效');else if(dateValue(state.health.certExpiry)<dateValue(v.arrivalDate))r.warnings.push('卫生证书已过期，请核查（到期日期只用于检查，原表无此栏）')}
   checkSection('cases',r);if([1,2,3,4,5].some(i=>state.health['q'+i]==='Yes')&&state.declarations.cases!=='records')r.errors.push('健康问题存在 Yes，需填写病例附表');if(state.health.q7==='Yes'&&isBlank(state.health.measures))r.errors.push('请填写卫生措施的类别、地点及日期');if(state.health.q8==='Yes'&&isBlank(state.health.stowawayPlace))r.errors.push('请填写偷渡人员登船地点');if(state.health.q8==='Yes'&&isNil(nilAnswer('stowaways')))r.errors.push('偷渡人员健康答案与 NIL 申报矛盾');if(state.health.q9==='Yes'&&isNil(nilAnswer('animals')))r.errors.push('患病动物健康答案与 NIL 申报矛盾');
  }
  if(r.id===9)checkNilItems(r);
  if(r.id===10)for(const [i,p]of crew.entries())for(const k of ['cholera','yellowFever']){const value=getPerson(p.id)?.vaccines?.[k];if(isBlank(value))r.errors.push(p.name+'：'+(k==='cholera'?'霍乱':'黄热病')+'有效日期未填写');else if(!dateValue(value)&&!isNil(value)&&!/^(lifelong|lifetime|终身)$/i.test(value))r.errors.push(p.name+' 的疫苗有效日期无效：'+value);else if(dateValue(value)&&dateValue(value)<dateValue(effectiveDate(r.id)))r.warnings.push(p.name+' 的 '+(k==='cholera'?'霍乱':'黄热病')+'有效日期已过，请核查')}
  for(const sh of c.sheets){r.pages++;if(sh.table){try{const rec=sh.table.source==='cases'?caseRecords():sectionRecords(sh.table.source,r.id),layout=sheetLayout(sh,rec);if(layout._insert)r.notes.push(sh.name+'：插入 '+layout._insert.count+' 行，完整输出 '+rec.length+' 条；表头及签署区保留，本表缩放为 1 页打印。');if(rec.length>sh.table.rows.length)r.warnings.push(sh.name+' 记录超过原容量，已插入行并缩放成一页；打印字号会缩小，请核查可读性。');if(sh.table.source==='stores')r.notes.push('物料按存放位置列大类标题，再列各项名称、数量及单位。')}catch(e){r.errors.push(e.message)}}}r.notes.push(r.id===6?'主表与病例附表各 1 页；保留两张原工作表，不生成续页。':'各原工作表设为宽 1 页、高 1 页；不生成续页。');
  if([1,2].includes(r.id))r.notes.push('附加 Sheet1 的历史人员记录清空并隐藏，保留工作表，避免空白打印页。');
  for(const k of ['name','company','master'])if(String(state.ship[k]||'').length>(k==='company'?70:40))r.warnings.push(labels[k]+'较长，需在 Excel/WPS 打印预览中检查是否溢出');
  const omitted=outputOmissions(r.id);if(omitted.length)r.notes.push('按你的选择清空 '+omitted.length+' 个输出项目：'+omitted.join('、')+'。资料仍保存在工程中。');
  r.errors=[...new Set(r.errors)];r.warnings=[...new Set(r.warnings)];
 }
 lastChecks={revision,results,errors:results.reduce((n,r)=>n+r.errors.length,0),warnings:results.reduce((n,r)=>n+r.warnings.length,0)};updateMeters();return lastChecks;
}
function checkCrewRows(rows,r,cutoff){
 const seen={passport:new Set(),seamanBook:new Set()};for(const [i,p]of rows.entries()){
  for(const [key,label]of schema.profiles)if(isBlank(p[key]))r.errors.push('第 '+(i+1)+' 人 '+(p.name||'未命名')+'：缺少'+label);
  for(const key of ['birthDate','seamanExpiry','passportExpiry','signOnDate'])if(p[key]&&!dateValue(p[key]))r.errors.push(p.name+'：'+key+' 日期无效 '+p[key]);
  for(const key of ['passport','seamanBook'])if(p[key]){const v=norm(p[key]);if(seen[key].has(v))r.errors.push((key==='passport'?'护照':'海员证')+'号码重复：'+p[key]);seen[key].add(v)}
  for(const key of ['passportExpiry','seamanExpiry'])if(dateValue(p[key])&&dateValue(cutoff)&&dateValue(p[key])<dateValue(cutoff))r.warnings.push(p.name+' 的'+(key==='passportExpiry'?'护照':'海员证')+'已过期：'+p[key]);
  if(dateValue(p.birthDate)&&dateValue(cutoff)&&dateValue(p.birthDate)>dateValue(cutoff))r.errors.push(p.name+' 的出生日期晚于本次日期');if(dateValue(p.signOnDate)&&dateValue(cutoff)&&dateValue(p.signOnDate)>dateValue(cutoff))r.errors.push(p.name+' 的上船日期晚于本次日期');
 }
}
function caseRecords(){return state.cases.map(r=>{const p=r.personId?(roster('arrival').find(p=>p.id===r.personId)||getPerson(r.personId)):null;if(!p)return r;const d=dateValue(p.birthDate),as=dateValue(state.voyage.arrivalDate);let age='';if(d&&as){age=+as.slice(0,4)-+d.slice(0,4)-(as.slice(5)<d.slice(5)?1:0)}return {...r,name:p.name,rank:p.rank,sex:p.sex,nationality:p.nationality,embarkPort:p.signOnPlace,embarkDate:p.signOnDate,age:isBlank(r.age)?String(age):r.age}})}
function checkSection(source,r){
 const mode=state.declarations[source],allRows=source==='cases'?caseRecords():source==='ports'&&typeof routeHistoryCandidates==='function'?routeHistoryCandidates().combined:state[source],rows=source==='ports'?portOutputSelection().rows:allRows;
 if(source==='ports'){const selection=portOutputSelection();r.notes.push('历史与前序计划合并共 '+allRows.length+' 条，本次按离港日期由近到远输出 '+rows.length+' 条（最多 10 条）；较早 '+selection.older.length+' 条、晚于本次到港日期 '+selection.future.length+' 条保留在工程，不写入清单。');}
 if(!['none','records'].includes(mode)){r.errors.push(({ports:'挂靠港',stores:'船舶物料',passengers:'旅客',medicines:'药品',cases:'病例附表'}[source])+' 尚未确认“无”或“有记录”');return}
 if(mode==='none'&&allRows.length){r.errors.push(source+' 已选“无”但仍有 '+allRows.length+' 条记录，请清空记录或改为“有记录”');return}
 if(mode==='records'&&!rows.length)r.errors.push(source==='ports'?'当前到港日期之前没有可输出的历史港口，请核查日期或明确选择“无记录”。':source+' 已选“有记录”但表格为空');
 const mandatory={ports:['port','country','security','arrivalDate','departureDate'],stores:['name','quantity','unit','location'],passengers:['name','rank','nationality','birthDate','birthPlace','passport','passportExpiry'],medicines:['name','quantity','expiry','mark'],cases:['name','rank','age','sex','nationality','embarkPort','embarkDate','illness','onsetDate','result','disposal']}[source];
 const seen=new Set();for(const [i,row]of rows.entries()){
  for(const k of mandatory)if(isBlank(row[k]))r.errors.push('第 '+(i+1)+' 条：'+(schema[source].find(x=>x[0]===k)?.[1]||k)+' 未填写');
  for(const k of mandatory.filter(k=>dateFields.has(k)))if(row[k]&&!dateValue(row[k])&&!isNil(row[k]))r.errors.push('第 '+(i+1)+' 条：日期无效 '+row[k]);
  if(source==='ports'){if(dateValue(row.arrivalDate)&&dateValue(row.departureDate)&&dateValue(row.arrivalDate)>dateValue(row.departureDate))r.errors.push('第 '+(i+1)+' 港：离港早于到港');if(dateValue(row.departureDate)>dateValue(state.voyage.arrivalDate))r.warnings.push('第 '+(i+1)+' 港离港日期晚于本次到港日期，请核查');if(!/^[123]$/.test(String(row.security)))r.warnings.push('第 '+(i+1)+' 港保安等级非 1、2、3，请核查')}
  if(source==='stores'&&!isBlank(row.quantity)&&!isNil(row.quantity)&&(!Number.isFinite(+row.quantity)||+row.quantity<0))r.errors.push('第 '+(i+1)+' 项物料数量应为非负数或 NIL');
  if(['medicines','passengers'].includes(source)){const k=source==='medicines'?'expiry':'passportExpiry';if(dateValue(row[k])&&dateValue(row[k])<dateValue(effectiveDate(r.id)))r.warnings.push('第 '+(i+1)+' 条 '+row.name+'：'+(source==='medicines'?'药品':'护照')+'已过期，请核查')}
  if(source==='passengers'&&row.passport){const key=norm(row.passport);if(seen.has(key))r.errors.push('旅客护照重复：'+row.passport);seen.add(key);if(roster(selectedSide(r.id)).some(p=>norm(p.passport)===key))r.errors.push(row.name+' 的护照同时出现在船员名单和旅客名单')}
  if(source==='cases'&&row.personId&&!getPerson(row.personId))r.errors.push('病例第 '+(i+1)+' 条关联人员不存在');
  if(source==='cases')for(const k of ['embarkPort','illness','result','disposal'])if(String(row[k]||'').length>12)r.warnings.push('病例第 '+(i+1)+' 条 '+(schema.cases.find(x=>x[0]===k)?.[1]||k)+'较长；完整保存在单元格，请核对原行高下的打印显示');
  if(source==='cases'&&dateValue(row.onsetDate)&&dateValue(row.embarkDate)&&dateValue(row.onsetDate)<dateValue(row.embarkDate))r.warnings.push('病例第 '+(i+1)+' 条发病早于登船，请核查');
  for(const [k,v]of Object.entries(row))if(typeof v==='string'&&v.length>180)r.warnings.push('第 '+(i+1)+' 条 '+k+' 文本较长，保留完整文字；请核对打印显示');
 }
}
function ensureCell(doc,ref){
 let c=allCells(doc).find(x=>x.getAttribute('r')===ref);if(c)return c;const a=rect(ref),sd=els(doc,'sheetData')[0];if(!sd)throw Error('工作表缺少 sheetData');let row=els(sd,'row').find(x=>+x.getAttribute('r')===a.r1);
 if(!row){row=doc.createElementNS(NS.s,'row');row.setAttribute('r',a.r1);const next=[...sd.children].find(x=>+x.getAttribute('r')>a.r1);sd.insertBefore(row,next||null)}
 c=doc.createElementNS(NS.s,'c');c.setAttribute('r',ref);const next=[...row.children].find(x=>x.localName==='c'&&rect(x.getAttribute('r')).c1>a.c1);row.insertBefore(c,next||null);return c;
}
function clearCell(c){for(const n of [...c.children])if(['v','f','is'].includes(n.localName))n.remove();c.removeAttribute('t')}
function clearRange(doc,ref){const r=rect(ref);for(const c of allCells(doc)){const p=rect(c.getAttribute('r'));if(p.r1>=r.r1&&p.r1<=r.r2&&p.c1>=r.c1&&p.c1<=r.c2)clearCell(c)}}
function newDateStyle(book,style){
 if(!book.styles)return style;book.dateStyleCache??=new Map();if(book.dateStyleCache.has(style))return book.dateStyleCache.get(style);
 const doc=book.styles,xfs=els(doc,'cellXfs')[0];if(!xfs)return style;const original=xfs.children[Number(style)||0];if(!original)return style;
 const id=+(original.getAttribute('numFmtId')||0),fmt=els(doc,'numFmt').find(x=>+x.getAttribute('numFmtId')===id)?.getAttribute('formatCode')||'';
 if((id>=14&&id<=22)||/[dy]/i.test(fmt.replace(/"[^"]*"/g,''))){book.dateStyleCache.set(style,style);return style}
 let nf=els(doc,'numFmts')[0];if(!nf){nf=doc.createElementNS(NS.s,'numFmts');doc.documentElement.insertBefore(nf,doc.documentElement.firstChild)}
 let match=els(nf,'numFmt').find(x=>x.getAttribute('formatCode')==='dd/mm/yyyy');if(!match){match=doc.createElementNS(NS.s,'numFmt');const max=Math.max(163,...els(nf,'numFmt').map(x=>+x.getAttribute('numFmtId')));match.setAttribute('numFmtId',max+1);match.setAttribute('formatCode','dd/mm/yyyy');nf.append(match);nf.setAttribute('count',nf.children.length)}
 const clone=original.cloneNode(true);clone.setAttribute('numFmtId',match.getAttribute('numFmtId'));clone.setAttribute('applyNumberFormat','1');xfs.append(clone);xfs.setAttribute('count',xfs.children.length);book.dateStyleCache.set(style,String(xfs.children.length-1));book.stylesDirty=true;return String(xfs.children.length-1);
}
function newTextStyle(book,style){
 if(!book.styles)return style;book.textStyleCache??=new Map();if(book.textStyleCache.has(style))return book.textStyleCache.get(style);const xfs=els(book.styles,'cellXfs')[0],base=xfs?.children[Number(style)||0];if(!base)return style;if(base.getAttribute('numFmtId')==='49')return style;const clone=base.cloneNode(true);clone.setAttribute('numFmtId','49');clone.setAttribute('applyNumberFormat','1');xfs.append(clone);xfs.setAttribute('count',xfs.children.length);const index=String(xfs.children.length-1);book.textStyleCache.set(style,index);book.stylesDirty=true;return index;
}
function referenceFontStyle(book,style,referenceStyle){const xfs=book.styles&&els(book.styles,'cellXfs')[0],base=xfs?.children[Number(style)||0],ref=xfs?.children[Number(referenceStyle)||0];if(!base||!ref||base.getAttribute('fontId')===ref.getAttribute('fontId'))return style;book.referenceFontCache??=new Map();const key=style+':'+ref.getAttribute('fontId');if(book.referenceFontCache.has(key))return book.referenceFontCache.get(key);const clone=base.cloneNode(true);clone.setAttribute('fontId',ref.getAttribute('fontId')||'0');clone.setAttribute('applyFont','1');xfs.append(clone);xfs.setAttribute('count',xfs.children.length);const index=String(xfs.children.length-1);book.referenceFontCache.set(key,index);book.stylesDirty=true;return index}
function writeCell(book,doc,ref,value,kind='text',formula=null){
 const c=ensureCell(doc,ref);clearCell(c);if(isBlank(value)&&!formula)return;
 if(/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(String(value)))throw Error(ref+' 含不允许写入 XML 的控制字符');
 if(kind==='identifier'){c.setAttribute('s',newTextStyle(book,c.getAttribute('s')||'0'));kind='text'}
 if(kind==='date'){value=serialDate(value,book.date1904);c.setAttribute('s',newDateStyle(book,c.getAttribute('s')||'0'));kind='number'}
 if(formula){const f=doc.createElementNS(NS.s,'f');f.textContent=formula;c.append(f);const v=doc.createElementNS(NS.s,'v');v.textContent=String(value);if(kind!=='number')c.setAttribute('t','str');c.append(v);return}
 if(kind==='number'&&Number.isFinite(+value)){const v=doc.createElementNS(NS.s,'v');v.textContent=String(+value);c.append(v)}else{c.setAttribute('t','inlineStr');const is=doc.createElementNS(NS.s,'is'),t=doc.createElementNS(NS.s,'t');t.setAttributeNS('http://www.w3.org/XML/1998/namespace','xml:space','preserve');t.textContent=String(value);is.append(t);c.append(is)}
}
function quotedSheet(name){return "'"+name.replace(/'/g,"''")+"'"}
async function addContinuation(book,original,name){
 const sheetList=els(book.wb,'sheets')[0];const usedPaths=new Set(Object.keys(book.zip.files));let n=1;while(usedPaths.has('xl/worksheets/sheet'+n+'.xml'))n++;const path='xl/worksheets/sheet'+n+'.xml';
 let rid=1;const usedIds=new Set(relEls(book.rels).map(r=>r.getAttribute('Id')));while(usedIds.has('rId'+rid))rid++;
 const relation=book.rels.createElementNS(NS.rel,'Relationship');relation.setAttribute('Id','rId'+rid);relation.setAttribute('Type',NS.r+'/worksheet');relation.setAttribute('Target','worksheets/sheet'+n+'.xml');book.rels.documentElement.append(relation);
 const node=book.wb.createElementNS(NS.s,'sheet');node.setAttribute('name',name);node.setAttribute('sheetId',Math.max(...els(book.wb,'sheet').map(x=>+x.getAttribute('sheetId')))+1);node.setAttributeNS(NS.r,'r:id','rId'+rid);sheetList.append(node);
 const ct=book.contentTypes;const o=ct.createElementNS(NS.ct,'Override');o.setAttribute('PartName','/'+path);o.setAttribute('ContentType','application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml');ct.documentElement.append(o);
 const oldIndex=book.sheets.findIndex(s=>s.name===original.name),newIndex=els(book.wb,'sheet').length-1;const names=els(book.wb,'definedNames')[0];if(names)for(const dn of [...names.children])if(+dn.getAttribute('localSheetId')===oldIndex&&dn.hasAttribute('localSheetId')){const copy=dn.cloneNode(true);copy.setAttribute('localSheetId',newIndex);copy.textContent=copy.textContent.replace(new RegExp("(?:'"+original.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/'/g,"''")+"'|"+original.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+")!",'g'),quotedSheet(name)+'!');names.append(copy)}
 if(book.zip.file(relPath(original.path)))book.zip.file(relPath(path),await book.zip.file(relPath(original.path)).async('uint8array'));
 book.zip.file(path,original.raw);return {name,path,doc:parseXML(original.raw),raw:original.raw,cells:null};
}
function continuationName(book,base,page){let n=page;let name;do{name=base.slice(0,31-String(n).length-3)+' ('+n+')';n++}while(els(book.wb,'sheet').some(s=>s.getAttribute('name')===name));return name}
async function cleanStrings(book){
 if(!book.zip.file('xl/sharedStrings.xml'))return;const used=new Set();let count=0;
 for(const sh of book.outputSheets){for(const c of allCells(sh.doc))if(c.getAttribute('t')==='s'){used.add(+els(c,'v')[0]?.textContent);count++}}
 const source=await book.zip.file('xl/sharedStrings.xml').async('string');let index=0;
 const output=source.replace(/<((?:[\w]+:)?si)\b[^>]*(?:\/>|>[\s\S]*?<\/\1>)/g,(match,tag)=>used.has(index++)?match:'<'+tag+'><'+(tag.includes(':')?tag.split(':')[0]+':':'')+'t/></'+tag+'>').replace(/(<(?:\w+:)?sst\b[^>]*\bcount=")[^"]*(")/,'$1'+count+'$2');
 book.zip.file('xl/sharedStrings.xml',output);
}
async function removeSelectedSignatures(book,id){
 if(state.preferences.reuseSignatures)return;const selected=state.preferences.signatureAnchors.filter(x=>x.templateId===id);if(!selected.length)return;
 const maybeUnused=new Set();
 for(const sel of selected){if(!book.zip.file(sel.path))continue;const doc=parseXML(await book.zip.file(sel.path).async('string'));for(const a of [...doc.documentElement.children]){const props=[...a.getElementsByTagNameNS('*','cNvPr')];if(props.some(p=>String(sel.ids||[]).split(',').includes(p.getAttribute('id'))))a.remove()}
  book.zip.file(sel.path,xml(doc));const rp=relPath(sel.path);if(book.zip.file(rp)){const d=parseXML(await book.zip.file(rp).async('string'));const used=new Set([...doc.getElementsByTagNameNS('*','blip')].map(b=>b.getAttributeNS(NS.r,'embed')));for(const r of relEls(d))if(r.getAttribute('Type')===NS.r+'/image'&&!used.has(r.getAttribute('Id'))){maybeUnused.add(resolvePath(sel.path,r.getAttribute('Target')));r.remove()}book.zip.file(rp,xml(d))}
 }
 for(const path of maybeUnused){let used=false;for(const name of Object.keys(book.zip.files).filter(p=>p.endsWith('.rels'))){const raw=await book.zip.file(name).async('string');if(raw.includes(path.split('/').at(-1))){used=true;break}}if(!used)book.zip.remove(path)}
}
function applyDeclarationDrawings(book,cfg){
 for(const rule of cfg.drawingRules||[]){if(state.declarations[rule.source]!=='records')continue;const original=book.drawings[rule.path];if(!original)throw Error('缺少申报图形：'+rule.path);const doc=parseXML(xml(original));for(const anchor of [...doc.documentElement.children]){const ids=[...anchor.getElementsByTagNameNS('*','cNvPr')].map(x=>x.getAttribute('id'));if(ids.some(id=>rule.nilAnchorIds.includes(id)))anchor.remove()}book.zip.file(rule.path,xml(doc))}
}
async function generateWorkbook(id){
 const cfg=CONFIG.templates.find(t=>t.id===id),entry=chosenTemplate(id);if(!cfg||!entry)throw Error('模板缺失或重复：'+id);
 const book=await readBook(entry.bytes,entry.name);const bad=mappingErrors(cfg,book);if(bad.length)throw Error(bad.join('\n'));book.contentTypes=parseXML(await book.zip.file('[Content_Types].xml').async('string'));book.outputSheets=[...book.sheets];
 const plans=[];for(const originalConfig of cfg.sheets){const sh=book.sheets.find(s=>s.name===originalConfig.name),source=originalConfig.table?.source,records=source?(source==='cases'?caseRecords():sectionRecords(source,id)):[],sc=sheetLayout(originalConfig,records),baseTitle=originalConfig.titlePage?cellText(sh.cells.get(originalConfig.titlePage),book.strings):'';await applyBookLayout(book,sh,sc);plans.push({sc,sh,baseTitle,rows:records,page:1,total:1,offset:0})}
 let masterRef=null;for(const p of plans)if(['arrival','departure'].includes(p.sc.table?.source)){const i=p.rows.findIndex(r=>norm(r.name)===norm(state.ship.master));if(i>=0){masterRef=quotedSheet(p.sh.name)+'!'+p.sc.table.columns.name+p.sc.table.rows[i];break}}
 for(const p of plans){const {sc,sh,rows,page,total}=p,doc=sh.doc;for(const c of allCells(doc))if(els(c,'f').length)for(const v of els(c,'v'))v.remove();
  for(const range of [...(sc.clear||[]),...(sc.table?.clear||[])])clearRange(doc,range);
  const ctx=valuesContext(id,page,total);
  for(const f of sc.fields||[]){if(!isOutputFieldEnabled(id,sc,f)){clearCell(ensureCell(doc,f.cell));continue}let value=getPath(ctx,f.key);if(value===undefined)value='';
   if(f.type==='masterFormula'){if(!masterRef)throw Error('本次名单未找到船长，无法更新签署公式');writeCell(book,doc,f.cell,state.ship.master,'text',masterRef);continue}
   if(f.type==='signatureFormula'){const iso=dateValue(value);if(!iso)throw Error('签署日期无效');const dateRefField=sc.fields.find(x=>x.cell===f.dateRef),dateFormula=dateValue(effectiveDate(id))===iso&&(!dateRefField||isOutputFieldEnabled(id,sc,dateRefField))?f.dateRef:`DATE(${+iso.slice(0,4)},${+iso.slice(5,7)},${+iso.slice(8,10)})`;writeCell(book,doc,f.cell,serialDate(iso,book.date1904),'number',dateFormula);continue}
   if(f.prefix||f.suffix){value=(f.prefix||'')+(f.key==='$signatureDate'?displayDate(value):value)+(f.suffix||'')}
   writeCell(book,doc,f.cell,value,['ship.imo','ship.callSign'].includes(f.key)?'identifier':f.type||'text');
  }
  if(sc.page)writeCell(book,doc,sc.page,page+' / '+total);
  if(sc.titlePage)writeCell(book,doc,sc.titlePage,p.baseTitle+(total>1?'  ('+page+' / '+total+')':''));
  if(sc.table){const t=sc.table;if(!rows.length&&t.nilCell&&state.declarations[t.source]==='none')writeCell(book,doc,t.nilCell,'NIL');
   for(let i=0;i<rows.length;i++){const row=rows[i];for(const [field,col]of Object.entries(t.columns)){if(!isOutputColumnEnabled(id,sc,field)){clearCell(ensureCell(doc,col+t.rows[i]));continue}let value=field==='seq'?String(p.offset+i+1):row[field]??'';let kind=['passport','seamanBook'].includes(field)?'identifier':'text';if(dateFields.has(field)&&dateValue(value))kind='date';else if(['cigs','beer','wine','spirit','quantity','age','seq'].includes(field)&&!isBlank(value)&&Number.isFinite(+value))kind='number';writeCell(book,doc,col+t.rows[i],value,kind);if(t.source==='stores'&&field==='name'){const original=book.sheets.find(s=>s.name===sc.name)?.cells.get(row._sectionHeader?(t.headerStyleCell||t.columns.name+t.rows[0]):t.columns.name+(t.bodyStyleRow||t.rows[0]+1)),cell=ensureCell(doc,col+t.rows[i]);if(original?.hasAttribute('s'))cell.setAttribute('s',referenceFontStyle(book,cell.getAttribute('s')||'0',original.getAttribute('s')))}}}
  }
  for(const ref of suppressedOutputCells(id,sc))clearCell(ensureCell(doc,ref));
  if(!sc.table&&!sc.fields.length&&(sc.clear||[]).length){const node=els(book.wb,'sheet').find(n=>n.getAttribute('name')===sh.name);if(node)node.setAttribute('state','hidden')}
  book.zip.file(sh.path,xml(doc));
 }
 if(book.stylesDirty)book.zip.file('xl/styles.xml',xml(book.styles));
 let calc=els(book.wb,'calcPr')[0];if(!calc){calc=book.wb.createElementNS(NS.s,'calcPr');book.wb.documentElement.insertBefore(calc,els(book.wb,'extLst')[0]||null)}calc.setAttribute('calcMode','auto');calc.setAttribute('fullCalcOnLoad','1');calc.setAttribute('forceFullCalc','1');
 book.zip.remove('xl/calcChain.xml');for(const r of relEls(book.rels))if(r.getAttribute('Type')===NS.r+'/calcChain')r.remove();for(const o of [...book.contentTypes.documentElement.children])if(o.getAttribute('PartName')==='/xl/calcChain.xml')o.remove();
 applyDeclarationDrawings(book,cfg);await removeSelectedSignatures(book,id);await cleanStrings(book);
 book.zip.file('xl/workbook.xml',xml(book.wb));book.zip.file('xl/_rels/workbook.xml.rels',xml(book.rels));book.zip.file('[Content_Types].xml',xml(book.contentTypes));
 const bytes=await book.zip.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:6},mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
 // Parse our output again before allowing a successful download.
 const check=await readBook(bytes,'生成文件');if(check.sheets.length!==book.outputSheets.length)throw Error('生成后工作表数量校验失败');
 return {bytes,name:outputName(id),sheetNames:book.outputSheets.map(s=>s.name),revision};
}
function originalCell(book,name,ref){return book.sheets.find(s=>s.name===name)?.cells.get(ref)}
function outputName(id){if(id===8){const [year,month]=state.voyage.month.split('-');return safeName('8. Narcotics list -'+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+month-1]+'-'+year+'.xlsx')}return safeName(CONFIG.templates.find(c=>c.id===id).filename)}
async function runGenerate(id=null){
 const startRevision=revision;
 const checks=checkAll(),scope=id?checks.results.filter(r=>r.id===id):checks.results;currentView='check';render();
 if(scope.some(r=>r.errors.length)){toast('生成已阻止：'+scope.reduce((n,r)=>n+r.errors.length,0)+' 项错误，请查看各表检查结果。');return {success:false}}
 const ids=id?[id]:CONFIG.templates.map(c=>c.id);const done=[];for(const key of ids){$('#status').textContent='正在生成 '+key+' / 10：'+CONFIG.templates.find(c=>c.id===key).title;await new Promise(resolve=>setTimeout(resolve,0));const out=await generateWorkbook(key);if(revision!==startRevision){generated.clear();throw Error('生成期间资料发生修改，已停止下载。请重新检查并生成。')}generated.set(key,out);done.push(out);}
 if(id){download(done[0].bytes,done[0].name,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');toast('已生成并下载：'+done[0].name)}else{if(done.length!==10)throw Error('文件数量不是 10，已阻止整包成功状态');const zip=new JSZip();for(const o of done)zip.file(o.name,o.bytes);const data=await zip.generateAsync({type:'uint8array',compression:'STORE'});if(revision!==startRevision){generated.clear();throw Error('打包期间资料发生修改，请重新生成。')}const v=state.voyage,port=v[v.mode+'Port'];const name=typeof zipPackageName==='function'?zipPackageName():'IMO_'+safeName(state.ship.name)+'_'+safeName(port)+'_'+String(v[v.mode+'Date']).replace(/-/g,'')+'.zip';download(data,name,'application/zip');toast('整包生成成功：10 个 XLSX，'+checks.warnings+' 项核查警告。请在 Excel/WPS 打开后检查打印预览。')}
 if(!id&&typeof recordGeneratedBaseline==='function')recordGeneratedBaseline(done);
 render();
 return {success:true,id,files:done.map(o=>o.name)};
}

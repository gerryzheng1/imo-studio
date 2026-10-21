from pathlib import Path

root = Path(__file__).parent
p = root / 'ports.js'
s = p.read_text(encoding='utf-8')
before = "meta.innerHTML=(p.nameZh?'<span>'+esc(p.nameZh)+'</span>':'')+' '+locodeBadge(p)"
after = "meta.innerHTML=locodeBadge(p)+(p.nameZh?' <span class=\"port-name-zh\">'+esc(p.nameZh)+'</span>':'')"
assert before in s
p.write_text(s.replace(before, after), encoding='utf-8')

p = root / 'route_history.js'
s = p.read_text(encoding='utf-8')
start = s.index('portExportPanel=function()')
end = s.index('const routeCheckBefore=', start)
panel = '''function portSummaryDate(value){const iso=dateValue(value);return iso?`<time datetime="${iso}">${iso}</time>`:`<span class="${value?'':'muted'}">${esc(value||'未填写')}</span>`}
portExportPanel=function(){
 const selection=portOutputSelection(),plans=selection.rows.filter(r=>r._outputOrigin==='plan');
 return `<div class="card port-export-summary"><div class="row spaced"><div><h2>本次港口清单：${selection.rows.length} / 最多 10 条</h2><p class="muted">已存历史 ${state.ports.length} 条＋当前站之前的计划 ${selection.planned.length} 条，合并后按日期取最近 10 条；不含当前站和之后的计划站。${selection.older.length} 条较早记录、${selection.future.length} 条基准日后的记录保留在工程中。</p></div><button data-action="previewFile" data-id="4">查看本次清单</button></div>${plans.length?`<p class="note warn">本次包含前序计划站：${plans.map(r=>esc(r.port)).join('、')}。请将预计日期核实为实际到离港日期后申报；计划仍保留在原列表，不会自动转为已发生记录。</p>`:''}<details open><summary>将写入的港口（基准日 ${esc(selection.cutoff||'未填写')}）</summary><div class="tablewrap port-summary-wrap"><table class="port-summary-table" aria-label="本次港口清单待写入数据"><colgroup><col class="summary-seq"><col class="summary-locode"><col class="summary-port"><col class="summary-date"><col class="summary-date"><col class="summary-remarks"><col class="summary-source"></colgroup><thead><tr><th>序号</th><th>UN/LOCODE</th><th>港口</th><th>到港日期</th><th>离港日期</th><th>备注 / 用途</th><th>记录来源</th></tr></thead><tbody>${selection.rows.map((r,i)=>{const p=portInfo(r.port,r.country,r.portMeta);return `<tr><td class="summary-number">${i+1}</td><td>${locodeBadge(p)}</td><td><strong class="summary-port-name">${esc(p?.nameZh||r.port||'未填港口')}</strong><span class="summary-port-english">${esc(r.port)}</span></td><td class="summary-date-value">${portSummaryDate(r.arrivalDate)}</td><td class="summary-date-value">${portSummaryDate(r.departureDate)}</td><td><div class="remarks-preview">${remarksPreview(r.remarks)}</div><span class="summary-remark-english">${esc(r.remarks||'')}</span></td><td><span class="badge ${r._outputOrigin==='plan'?'warn':'ok'}">${r._outputOrigin==='plan'?'前序计划，需核实':'已存历史'}</span></td></tr>`}).join('')||'<tr><td colspan="7" class="empty">暂无可写入记录，请添加历史港口或关联本次计划站。</td></tr>'}</tbody></table></div><p class="hint">以上为待写入数据预览，按此顺序输出；完整历史和未来计划仍分别保存在工程中。</p></details></div>`
};
'''
p.write_text(s[:start] + panel + s[end:], encoding='utf-8')

p = root / 'v12.css'
s = p.read_text(encoding='utf-8')
start = s.index('.date-editor{min-width:170px}')
end = s.index('.port-input{display:flex!important;', start)
s = s[:start] + s[end:]
s += '''
/* Direct text dates with a native calendar; complete, wrapping port remarks. */
.date-editor{display:flex;flex-wrap:nowrap;align-items:center;gap:3px;min-width:155px;width:100%}
.date-editor>input{flex:1;min-width:0;width:0;font:inherit}
.date-calendar{position:relative;display:inline-flex;flex:0 0 31px;width:31px;height:31px;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:5px;color:#365a7c;background:#f7faff;cursor:pointer}
.date-calendar:hover{background:#e8f2ff;border-color:#88acd5}
.date-calendar:focus-within{outline:2px solid #8ab5e6;outline-offset:1px}
.date-calendar svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.6;pointer-events:none}
.date-calendar>.date-calendar-picker{position:absolute;inset:0;width:100%;height:100%;min-width:0;margin:0;padding:0;opacity:0;cursor:pointer}
.date-calendar-picker::-webkit-calendar-picker-indicator{position:absolute;inset:0;width:100%;height:100%;margin:0;padding:0;cursor:pointer}
.remarks-editor{display:flex;flex-direction:column;align-items:stretch;gap:5px;min-width:205px}
.remarks-editor>textarea{display:block;box-sizing:border-box;width:100%;min-height:48px;max-height:240px;resize:vertical;padding:5px 7px;font-size:inherit;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere;border-color:var(--line)}
.remarks-editor>button{align-self:flex-end;white-space:nowrap}
.remarks-preview{display:flex;gap:4px;flex-wrap:wrap;align-items:flex-start;white-space:normal;overflow-wrap:anywhere;line-height:1.5}
.remark-tag{display:inline-block;max-width:100%;font-size:11px;line-height:1.5;padding:1px 6px;border-radius:4px;color:#375a7b;background:#edf3fa;white-space:pre-wrap;overflow-wrap:anywhere}
.port-meta .locode-badge,.port-meta .locode-pending{order:0}.port-meta .port-name-zh{order:1}
.port-export-summary>.row{align-items:flex-start}.port-export-summary>.row>div{flex:1;min-width:250px}
.port-summary-wrap{max-height:none;margin:12px 0 6px;overflow:auto}
.port-summary-table{table-layout:fixed;min-width:960px}
.port-summary-table .summary-seq{width:48px}.port-summary-table .summary-locode{width:94px}.port-summary-table .summary-port{width:200px}.port-summary-table .summary-date{width:115px}.port-summary-table .summary-source{width:146px}
.port-summary-table th,.port-summary-table td{white-space:normal;padding:10px 12px;vertical-align:middle;line-height:1.55}
.port-summary-table th{position:static}.port-summary-table tbody tr:last-child td{border-bottom:0}
.port-summary-table .summary-number{text-align:center;color:var(--muted);font-variant-numeric:tabular-nums}
.summary-port-name{display:block;font-weight:600}.summary-port-english,.summary-remark-english{display:block;color:var(--muted);font-size:11px;overflow-wrap:anywhere;margin-top:3px;white-space:pre-wrap}
.summary-date-value{white-space:nowrap!important;font-variant-numeric:tabular-nums}
.port-summary-table .badge{white-space:nowrap}
[data-theme=dark] .date-calendar{background:#293e55;color:#c8def5;border-color:#4c6380}
[data-theme=dark] .date-calendar:hover{background:#355477}
[data-theme=dark] .remark-tag{background:#304b66;color:#d6e8fa}
'''
p.write_text(s, encoding='utf-8')

p = root / 'app.html'
s = p.read_text(encoding='utf-8').replace('离线办公版 1.3</div>', '离线办公版 1.3.1</div>')
p.write_text(s, encoding='utf-8')

p = root / 'help.js'
s = p.read_text(encoding='utf-8')
s = s.replace('日期可以点日历。', '日期框可直接输入 YYYY-MM-DD、NIL 或其他原始文字，也可点击右侧日历图标选日期，无需切换填写方式。')
s = s.replace('支持日历、NIL 或终身选项。', '可直接输入日期、NIL 或 lifelong（终身），也可点击右侧日历。')
s = s.replace('日期方式选“自定义文字”可保留非标准原始内容。', '日期框始终可以直接输入日期或文字，右侧日历用于选日期；没有日期填写方式下拉框。')
s = s.replace('“本次港口清单”卡片可展开查看具体选中了哪 10 条。', '“本次港口清单”卡片按列列出具体选中的 10 条、日期、完整用途与记录来源。手动新增历史港口和计划港口时，保安等级默认 1，备注默认货物作业（CARGO OPERATION），都可修改或清空。已有记录和导入的空白值不会自动改写。备注可直接多行编辑或点击“选择用途”多选，下方会完整列出已选用途。港口英文名下方先显示 LOCODE，再显示中文名。')
p.write_text(s, encoding='utf-8')

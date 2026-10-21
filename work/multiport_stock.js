// Multi-port inventory editor. Quantities are changed only by the reviewed apply.
(function (global) {
  'use strict';
  let draft = null, dialogOpen = false;
  const copy = value => structuredClone(value);
  const attr = value => esc(String(value ?? ''));
  const own = (obj, key) => !!obj && Object.prototype.hasOwnProperty.call(obj, key);
  const fmt = value => value === null || value === undefined ? '待确认' : String(value);
  const workspace = () => state.multiport;
  const taskList = () => typeof MultiPort.tasks === 'function' ? MultiPort.tasks() : MultiPort.tasks;
  const activeId = () => typeof MultiPort.activeId === 'function' ? MultiPort.activeId() : MultiPort.activeId;
  const snapshot = id => MultiPort.snapshotFor(id);
  const stamp = () => String(MultiPort.contextStamp());
  const label = task => String(MultiPort.label(task) || task.data?.voyage?.arrivalPort || task.id);
  const currentDate = data => data.storesAsOf?.date || '';
  const passengerCount = data => data.declarations?.passengers === 'records' ? (data.passengers || []).length : 0;
  const count = (data, side) => (data[side] || []).length;
  const cloneSettings = settings => {
    const cfg = copy(settings || {});
    return { version: 1, schema: 1, sourceId: cfg.sourceId || 'current', sourceTaskId: cfg.sourceTaskId || activeId(), date: cfg.date || '', rates: cfg.rates || {}, dailyRates: cfg.dailyRates || {}, deliveries: cfg.deliveries || [], legPeople: cfg.legPeople || {}, stayPeople: cfg.stayPeople || {}, includePassengers: !!cfg.includePassengers, protectManual: cfg.protectManual !== false, base: cfg.base || null };
  };
  function sourceFor(cfg) {
    const w = workspace();
    if (cfg.sourceId !== 'current') {
      const source = (w.shared?.storeSnapshots || []).find(s => s.id === cfg.sourceId);
      if (!source) throw Error('选择的库存快照已不存在，请重新选择。');
      return { sourceId: source.id, sourceTaskId: '', port: source.port, date: source.date, rows: copy(source.rows || []) };
    }
    if (cfg.base?.sourceId === 'current' && cfg.base.sourceTaskId === cfg.sourceTaskId && Array.isArray(cfg.base.rows)) return copy(cfg.base);
    const sourceTask = taskList().find(task => task.id === cfg.sourceTaskId) || taskList().find(task => task.id === activeId()) || taskList()[0];
    if (!sourceTask) throw Error('请先建立至少一个港口任务。');
    const data = snapshot(sourceTask.id), side = data.voyage?.mode || 'arrival';
    return { sourceId: 'current', sourceTaskId: sourceTask.id, port: data.storesAsOf?.port || data.voyage?.[side + 'Port'] || label(sourceTask), date: currentDate(data), rows: copy(data.stores || []) };
  }
  function routeStages(realTasks, openingDate) {
    const plans = workspace().shared?.plannedPorts || [], index = new Map(plans.map((plan, n) => [plan.id, n])), used = new Set(realTasks.map(task => task.planId).filter(Boolean));
    const stages = [], assumptions = [];
    let previousData = null, previousPlan = -1;
    const firstIndex = index.get(realTasks[0]?.planId);
    // Starting before an earlier planned call could omit an unknown roster and
    // partial stay. Require an unambiguous starting count instead of guessing.
    if (Number.isInteger(firstIndex) && openingDate) {
      const earlier = plans.slice(0, firstIndex).filter(plan => {
        const departure = dateValue(plan.departureDate), arrival = dateValue(plan.arrivalDate);
        return departure ? departure > openingDate : arrival ? arrival >= openingDate : true;
      });
      if (earlier.length) throw Error('起始盘点日至第一任务港之间还有前序计划港，可能漏算停泊消耗。请把这些港口也加入任务，或选择第一任务港到港日的盘点作为起点。');
    }
    for (const task of realTasks) {
      const data = snapshot(task.id), at = index.get(task.planId);
      if (previousData && Number.isInteger(at) && at > previousPlan + 1 && previousPlan >= 0) {
        for (let n = previousPlan + 1; n < at; n++) {
          const plan = plans[n]; if (used.has(plan.id)) continue;
          const virtualId = 'route-plan:' + plan.id;
          const virtual = { id: virtualId, label: (plan.port || '未命名港口') + '（中间站）', arrivalDate: plan.arrivalDate || '', departureDate: plan.departureDate || '', people: { arrival: count(previousData, 'departure'), departure: count(previousData, 'departure'), passengerArrival: passengerCount(previousData), passengerDeparture: passengerCount(previousData) }, stores: [] };
          stages.push({ ...virtual, virtual: true, planId: plan.id });
          assumptions.push(`${plan.port || '中间站'}：没有独立任务，人数暂沿用上一任务港离港名单；请核对或在“各段人数”中修改。此站参与消耗，不输出文件。`);
        }
      }
      stages.push({ id: task.id, label: label(task), arrivalDate: data.voyage?.arrivalDate || '', departureDate: data.voyage?.departureDate || '', people: { arrival: count(data, 'arrival'), departure: count(data, 'departure'), passengerArrival: passengerCount(data), passengerDeparture: passengerCount(data) }, stores: copy(data.stores || []), virtual: false, task, data });
      previousData = data; if (Number.isInteger(at)) previousPlan = at;
    }
    return { stages, assumptions };
  }
  function buildOptions(settings) {
    MultiPort.flush();
    const tasks = taskList(); if (!tasks.length) throw Error('请先建立港口任务。');
    const cfg = cloneSettings(settings || draft?.settings || workspace().inventory), base = sourceFor(cfg);
    cfg.sourceTaskId = base.sourceTaskId || cfg.sourceTaskId;
    cfg.date = dateValue(cfg.date || base.date || snapshot(tasks[0].id).voyage?.arrivalDate) || cfg.date || base.date || '';
    cfg.base = copy(base); cfg.base.date = cfg.date;
    const { stages, assumptions } = routeStages(tasks, dateValue(cfg.date));
    const protections = [], overrides = {}, first = stages[0], firstData = first.data || snapshot(tasks[0].id);
    for (const stage of stages.filter(s => !s.virtual)) {
      const task = stage.task, manual = task.manual || {}, keys = manual.stockKeys || {}, allManual = manual.stores && !Object.keys(keys).length;
      const currentPhase = stage.data.voyage?.mode === 'departure' ? 'departure' : 'arrival';
      if (!cfg.protectManual) continue;
      const phases = manual.stockPhases && Object.keys(manual.stockPhases).length
        ? Object.entries(manual.stockPhases).filter(([phase, rows]) => ['arrival', 'departure'].includes(phase) && Array.isArray(rows)).map(([phase, rows]) => ({ phase, rows, full: true }))
        : [{ phase: currentPhase, rows: (stage.data.stores || []).filter(row => allManual || keys[row.id] || keys[RouteInventory.rowKey(row)]), full: false }];
      for (const { phase, rows, full } of phases) {
        const unique = new Set();
        if (full) {
          const missing = base.rows.filter(old => !rows.some(row => RouteInventory.rowKey(row) === RouteInventory.rowKey(old)));
          if (missing.length) throw Error(`${stage.label} ${phase === 'departure' ? '离港' : '到港'}盘点曾删除、改名或移动物料（${missing.slice(0,3).map(row => row.name).join('、')}）。请选用调整后的盘点作为起始库存，或取消手工保护并核对预览，避免自动重新加入旧物料。`);
        }
        for (const row of rows) {
          const key = RouteInventory.rowKey(row);
          if (unique.has(key)) throw Error(`${stage.label} 的手工盘点有名称、单位、位置相同的重复物料，请先合并。`);
          unique.add(key);
          if (String(row.quantity ?? '').trim() === '' || !Number.isFinite(Number(row.quantity)) || Number(row.quantity) < 0) throw Error(`${stage.label} 的手工盘点“${row.name}”不是非负数字。空白、NIL 和文字无法当作数字盘点，请确认数量后再连续推算。`);
          overrides[task.id] ??= { arrival: {}, departure: {} };
          overrides[task.id][phase][key] = row.quantity;
          protections.push({ taskId: task.id, task: stage.label, phase, key, name: row.name, quantity: row.quantity, unit: row.unit });
          if (!stage.stores.some(source => RouteInventory.rowKey(source) === key)) stage.stores.push(copy(row));
        }
      }
    }
    const perLegRates = {};
    for (const stage of stages) {
      const config = {};
      if (own(cfg.legPeople, stage.id) && String(cfg.legPeople[stage.id]).trim() !== '') config.people = cfg.legPeople[stage.id];
      if (own(cfg.stayPeople, stage.id) && String(cfg.stayPeople[stage.id]).trim() !== '') config.stayPeople = cfg.stayPeople[stage.id];
      if (Object.keys(config).length) perLegRates[stage.id] = config;
    }
    return { opening: { port: base.port || '', date: cfg.date, rows: copy(base.rows), people: count(firstData, 'arrival'), passengers: passengerCount(firstData) }, tasks: stages.map(({ task, data, virtual, planId, ...stage }) => stage), rates: { ...(workspace().shared?.provisionRates || {}), ...cfg.rates }, dailyRates: cfg.dailyRates, deliveries: cfg.deliveries, perLegRates, overrides, includePassengers: cfg.includePassengers,
      _settings: cfg, _stages: stages, _assumptions: assumptions, _protections: protections, _realIds: tasks.map(task => task.id), _virtualIds: stages.filter(stage => stage.virtual).map(stage => stage.id), _stamp: stamp() };
  }
  function catalogue(options) {
    const rows = new Map();
    for (const row of [...options.opening.rows, ...options.tasks.flatMap(task => task.stores || [])]) {
      const key = RouteInventory.rowKey(row); if (!rows.has(key)) rows.set(key, { ...copy(row), _routeKey: key });
    }
    return [...rows.values()];
  }
  function invalidate() {
    if (!draft) return; draft.result = null; draft.options = null;
    const status = $('#routeStockStatus'); if (status) status.textContent = '参数已更改，请先重新预览。';
    const apply = $('#routeStockApply'); if (apply) apply.disabled = true;
  }
  function preview(settings) {
    const cfg = settings || draft?.settings || workspace().inventory, options = buildOptions(cfg), result = RouteInventory.calculate(options);
    draft = { settings: options._settings, options, result, stamp: options._stamp };
    if (dialogOpen) showDialog();
    return result;
  }
  function totals(rows) {
    const units = new Map();
    for (const row of rows) { const n = Number(row.quantity); if (String(row.quantity).trim() && Number.isFinite(n)) units.set(row.unit || '无单位', (units.get(row.unit || '无单位') || 0) + n); }
    return [...units].map(([unit, n]) => `${Number(n.toPrecision(10))} ${unit}`).join(' · ') || '无可汇总的数字数量';
  }
  function resultHTML() {
    const result = draft.result; if (!result) return '<p id="routeStockStatus" class="note">按顺序完成起始盘点、消耗标准、补给，再点击“预览全部港口”。预览不会改变资料。</p>';
    return `<section id="routeStockStatus" class="note"><strong>${result.ok && result.complete ? '推算通过，可以应用。' : '暂不能应用，请处理以下项目。'}</strong> ${result.ports.length} 个计算站，${result.errors.length} 项错误，${result.warnings.length} 项提醒。所有物料都能明确推算后才可写入。</section>${result.errors.length ? `<ul class="danger">${result.errors.map(error => `<li>${attr(error.message)}</li>`).join('')}</ul>` : ''}${result.warnings.length ? `<details open><summary>待确认 / 提醒（${result.warnings.length} 项）</summary><ul>${result.warnings.map(warning => `<li>${attr(warning.message)}</li>`).join('')}</ul></details>` : ''}<div class="tablewrap" style="max-height:300px"><table><thead><tr><th>港口</th><th>航行天数 / 人数</th><th>停泊天数 / 人数</th><th>到港库存（按单位汇总）</th><th>离港库存（按单位汇总）</th></tr></thead><tbody>${result.ports.map(port => `<tr><td>${attr(port.label)}${draft.options._virtualIds.includes(port.id) ? '<small>仅计算，不输出</small>' : ''}</td><td>${port.leg.days} 天 / ${fmt(port.leg.people)} 人</td><td>${port.stay.days} 天 / ${fmt(port.stay.people)} 人</td><td>${attr(totals(port.arrivalRows))}</td><td>${attr(totals(port.departureRows))}</td></tr>`).join('')}</tbody></table></div><details><summary>查看逐项到港、离港库存与耗用 / 补给明细</summary>${result.ports.map(port => `<h3>${attr(port.label)}</h3><div class="tablewrap" style="max-height:250px"><table><thead><tr><th>物料 / 单位</th><th>本段起始</th><th>航行耗用</th><th>到港补给</th><th>到港剩余</th><th>停泊耗用</th><th>离港补给</th><th>离港剩余</th></tr></thead><tbody>${port.changes.map(change => `<tr><td>${attr(change.name)} / ${attr(change.unit)}${change.pending ? '<small>待确认</small>' : ''}</td><td>${attr(fmt(change.opening))}</td><td>${attr(fmt(change.consumedLeg))}</td><td>${attr(fmt(change.receivedArrival))}</td><td>${attr(fmt(change.arrival))}${change.overriddenArrival ? '（手工盘点）' : ''}</td><td>${attr(fmt(change.consumedStay))}</td><td>${attr(fmt(change.receivedDeparture))}</td><td>${attr(fmt(change.departure))}${change.overriddenDeparture ? '（手工盘点）' : ''}</td></tr>`).join('')}</tbody></table></div>`).join('')}</details>`;
  }
  function showDialog() {
    if (!draft) return;
    let options = draft.options, problem = '';
    try { options = options || buildOptions(draft.settings); draft.settings = options._settings; } catch (error) {
      problem = error.message;
      try { const source = sourceFor(draft.settings); draft.settings.base = source; draft.settings.date ||= source.date || snapshot(taskList()[0].id).voyage?.arrivalDate || ''; } catch (_) { /* Keep the original actionable error visible. */ }
    }
    const existingDialog = !!$('#modalRoot [data-route-stock]'), openSections = new Set(existingDialog ? $$('#modalRoot details[data-route-section][open]').map(el => el.dataset.routeSection) : ['rates']);
    const sectionOpen = key => openSections.has(key) ? 'open' : '';
    const cfg = draft.settings, snapshots = workspace().shared?.storeSnapshots || [], items = options ? catalogue(options) : cfg.base?.rows || [], stages = options?._stages || [];
    const sourceChoices = `<option value="current" ${cfg.sourceId === 'current' ? 'selected' : ''}>固定当前盘点（当前编辑港口库存）</option>` + snapshots.map(source => `<option value="${attr(source.id)}" ${cfg.sourceId === source.id ? 'selected' : ''}>${attr(source.date)} · ${attr(source.port)} · ${source.rows.length} 项</option>`).join('');
    const itemChoices = key => `<option value="">请选择物料</option>` + items.map(row => `<option value="${attr(RouteInventory.rowKey(row))}" ${key === RouteInventory.rowKey(row) ? 'selected' : ''}>${attr(row.name)} · ${attr(row.unit)} · ${attr(row.location)}</option>`).join('');
    const stopChoices = id => `<option value="">请选择港口</option>` + stages.map(stage => `<option value="${attr(stage.id)}" ${id === stage.id ? 'selected' : ''}>${attr(stage.label)}</option>`).join('');
    modal('多港口连续库存推算', `<p>先确定一份起始盘点，再按航行顺序计算。修改日期、人数、补给或定额后重新预览；预览通过再统一写入各港。</p>${problem ? `<p class="note danger">${attr(problem)}</p>` : ''}<div class="grid two"><label><span>1. 起始盘点来源</span><select data-route-stock="sourceId">${sourceChoices}</select></label><label><span>盘点日期（必须确认）</span><input type="date" data-route-stock="date" value="${attr(cfg.date)}"></label></div><p class="hint">${attr(cfg.base?.port || '')} · ${cfg.base?.rows?.length || 0} 项。起始库存已固定，反复重算不会重复扣减。数量以所填日期为准，日期差按日计算，不额外加一天。</p><div class="row"><button class="small" data-action="routeStockReload">重新读取当前库存</button><label class="checkline"><input type="checkbox" data-route-stock="includePassengers" ${cfg.includePassengers ? 'checked' : ''}>人数包含本港旅客名单</label><label class="checkline"><input type="checkbox" data-route-stock="protectManual" ${cfg.protectManual ? 'checked' : ''}>保留各港已手工修改的库存数量</label></div><details data-route-section="rates" ${sectionOpen('rates')}><summary>2. 物料消耗标准（伙食必须填写，确实不消耗可填 0）</summary><p class="hint">伙食填写“本单位 / 人 / 天”；其他物料可填“本单位 / 天”，留空则原量结转。程序不猜定额，不自动换算单位。</p><div class="tablewrap" style="max-height:260px"><table><thead><tr><th>物料</th><th>位置</th><th>起始库存 / 单位</th><th>消耗标准</th></tr></thead><tbody>${items.map(row => { const provision = RouteInventory.isProvision(row), key = RouteInventory.rowKey(row), rate = provision ? cfg.rates[key] ?? cfg.rates[RouteInventory.provisionKey(row)] ?? workspace().shared?.provisionRates?.[RouteInventory.provisionKey(row)] ?? '' : cfg.dailyRates[key] ?? ''; return `<tr><td>${attr(row.name)}</td><td>${attr(row.location)}</td><td>${attr(row.quantity)} ${attr(row.unit)}</td><td><input type="number" min="0" step="any" inputmode="decimal" data-route-stock-rate="${provision ? 'rates' : 'dailyRates'}" data-key="${attr(key)}" value="${attr(rate)}" placeholder="${provision ? '需填写或填0' : '可留空'}" aria-label="${attr(row.name)}消耗标准"><small>${attr(row.unit)} / ${provision ? '人 / ' : ''}天</small></td></tr>`; }).join('') || '<tr><td colspan="4">起始盘点没有物料。请先完善库存。</td></tr>'}</tbody></table></div></details><details data-route-section="deliveries" ${sectionOpen('deliveries')}><summary>3. 各港补给（${cfg.deliveries.length} 条，可选）</summary><p class="hint">到港补给发生在本段航行消耗后，离港补给发生在本港停泊消耗后。已经发生的负库存不能用后续补给掩盖。</p><div class="tablewrap"><table><thead><tr><th>港口</th><th>物料</th><th>补给时间</th><th>补给数量</th><th></th></tr></thead><tbody>${cfg.deliveries.map((delivery, n) => `<tr><td><select data-route-delivery="taskId" data-index="${n}">${stopChoices(delivery.taskId)}</select></td><td><select data-route-delivery="key" data-index="${n}">${itemChoices(delivery.key)}</select></td><td><select data-route-delivery="when" data-index="${n}"><option value="arrival" ${delivery.when !== 'departure' ? 'selected' : ''}>到港时</option><option value="departure" ${delivery.when === 'departure' ? 'selected' : ''}>离港时</option></select></td><td><input type="number" min="0" step="any" data-route-delivery="quantity" data-index="${n}" value="${attr(delivery.quantity)}" aria-label="补给数量"></td><td><button class="small danger" data-action="routeStockRemoveDelivery" data-index="${n}">删除</button></td></tr>`).join('') || '<tr><td colspan="5">尚未添加补给。</td></tr>'}</tbody></table></div><button class="small" data-action="routeStockAddDelivery">添加补给</button></details><details data-route-section="people" ${sectionOpen('people')}><summary>4. 各段人数与中间停靠站（${stages.length} 站）</summary><p class="hint">航行默认使用上一港离港名单人数，第一段使用第一港到港人数；停泊默认使用本港进港名单人数。手填人数是该段总人数，已包含旅客，不再叠加。</p>${options?._assumptions?.length ? `<ul class="note">${options._assumptions.map(text => `<li>${attr(text)}</li>`).join('')}</ul>` : ''}<div class="tablewrap"><table><thead><tr><th>港口</th><th>到港 → 离港</th><th>本段航行总人数（可选）</th><th>本港停泊总人数（可选）</th></tr></thead><tbody>${stages.map((stage, n) => `<tr><td>${attr(stage.label)}</td><td>${attr(stage.arrivalDate || '日期待填')} → ${attr(stage.departureDate || '日期待填')}</td><td><input type="number" min="0" step="1" data-route-stock-people="legPeople" data-key="${attr(stage.id)}" value="${attr(cfg.legPeople[stage.id] ?? '')}" placeholder="默认 ${n ? stages[n - 1].people.departure : stage.people.arrival}" aria-label="${attr(stage.label)}航行人数"></td><td><input type="number" min="0" step="1" data-route-stock-people="stayPeople" data-key="${attr(stage.id)}" value="${attr(cfg.stayPeople[stage.id] ?? '')}" placeholder="默认 ${stage.people.arrival}" aria-label="${attr(stage.label)}停泊人数"></td></tr>`).join('')}</tbody></table></div></details>${options?._protections?.length ? `<details data-route-section="protection" ${sectionOpen('protection')}><summary>已保护 ${options._protections.length} 项手工库存，点击查看</summary><ul>${options._protections.map(row => `<li>${attr(row.task)} · ${row.phase === 'departure' ? '离港' : '到港'} · ${attr(row.name)}：${attr(row.quantity)} ${attr(row.unit)}</li>`).join('')}</ul><p class="hint">这些数量按实际盘点修正对应港口的计算结果，并作为后续港口的起点；修正前的短缺仍需处理。</p></details>` : ''}<hr>${resultHTML()}`, `<button data-action="closeModal">关闭</button><button data-action="routeStockSaveSettings">仅保存推算参数</button><button class="primary" data-action="routeStockPreview">预览全部港口</button><button id="routeStockApply" class="primary" data-action="routeStockApply" ${draft.result?.ok && draft.result?.complete ? '' : 'disabled'}>应用到 ${taskList().length} 个港口</button>`);
    $('.dialog')?.classList.add('workflow-dialog');
    global.WorkspaceUI?.decorateStockDialog();
  }
  function open() {
    MultiPort.flush();
    if (!taskList().length) throw Error('请先建立港口任务。');
    const settings = cloneSettings(workspace().inventory);
    try { const options = buildOptions(settings); draft = { settings: options._settings, options: null, result: null, stamp: options._stamp }; }
    catch (error) { draft = { settings, options: null, result: null, stamp: stamp() }; }
    dialogOpen = true; showDialog();
  }
  function makeRowIds(result) {
    const ids = new Map(), used = new Set();
    for (const port of result.ports) for (const row of [...port.arrivalRows, ...port.departureRows]) {
      const key = RouteInventory.rowKey(row); if (ids.has(key)) continue;
      let id = row.id; if (!id || used.has(id)) id = uid();
      ids.set(key, id); used.add(id);
    }
    return rows => rows.map(row => { const next = copy(row); next.id = ids.get(RouteInventory.rowKey(row)); delete next._routePending; return next; });
  }
  function apply(value) {
    const prepared = value?.result ? value : draft;
    if (!prepared?.result?.ok || !prepared.result.complete) throw Error('请先预览并处理缺失标准、日期、人数或负库存，全部通过后再应用。');
    MultiPort.flush();
    if (stamp() !== prepared.stamp) throw Error('港口、日期、人数或物料已经变更，请重新预览库存后再应用。');
    const rowsWithIds = makeRowIds(prepared.result), at = new Date().toISOString();
    MultiPort.transact(w => {
      w.inventory = copy(prepared.settings);
      w.shared.provisionRates ??= {};
      for (const row of catalogue(prepared.options).filter(RouteInventory.isProvision)) {
        const rate = prepared.options.rates[RouteInventory.rowKey(row)] ?? prepared.options.rates[RouteInventory.provisionKey(row)];
        if (rate !== undefined && String(rate).trim() !== '' && Number.isFinite(Number(rate)) && Number(rate) >= 0) w.shared.provisionRates[RouteInventory.provisionKey(row)] = String(rate);
      }
      for (const port of prepared.result.ports) {
        const task = w.tasks.find(task => task.id === port.id); if (!task) continue;
        const arrivalRows = rowsWithIds(port.arrivalRows), departureRows = rowsWithIds(port.departureRows), side = task.data.voyage.mode === 'departure' ? 'departure' : 'arrival';
        task.inventory = { kind: 'estimated', calculatedAt: at, opening: { port: prepared.options.opening.port, date: prepared.options.opening.date }, arrivalRows, departureRows, leg: copy(port.leg), stay: copy(port.stay), changes: copy(port.changes), warnings: copy(prepared.result.warnings.filter(warning => warning.taskId === task.id)) };
        if (prepared.settings.protectManual && task.manual?.stockPhases) {
          if (Array.isArray(task.manual.stockPhases.arrival)) task.manual.stockPhases.arrival = copy(arrivalRows);
          if (Array.isArray(task.manual.stockPhases.departure)) task.manual.stockPhases.departure = copy(departureRows);
        }
        task.data.stores = copy(side === 'departure' ? departureRows : arrivalRows);
        task.data.storesAsOf = { port: task.data.voyage[side + 'Port'] || port.label, date: task.data.voyage[side + 'Date'] || '', snapshotId: '' };
        task.data.declarations ??= {}; if (task.data.stores.length) task.data.declarations.stores = 'records';
        task.stale = (task.stale || []).filter(reason => reason !== 'inventory');
      }
    }, { automatic: true });
    dialogOpen = false; closeModal(); toast('连续库存已应用到 ' + prepared.options._realIds.length + ' 个港口；各港分别保留到港、离港估算和计算明细。');
    return { applied: prepared.options._realIds.length, virtual: prepared.options._virtualIds.length };
  }
  actions.multiportStock = open;
  actions.routeStockPreview = () => preview();
  actions.routeStockApply = () => apply();
  actions.routeStockAddDelivery = () => { draft.settings.deliveries.push({ taskId: taskList()[0]?.id || '', key: '', when: 'arrival', quantity: '' }); invalidate(); showDialog(); };
  actions.routeStockRemoveDelivery = el => { draft.settings.deliveries.splice(Number(el.dataset.index), 1); invalidate(); showDialog(); };
  actions.routeStockReload = () => { draft.settings.sourceId = 'current'; draft.settings.sourceTaskId = activeId(); draft.settings.base = null; draft.settings.date = ''; invalidate(); showDialog(); };
  actions.routeStockSaveSettings = () => {
    if (!draft) return;
    const options = buildOptions(draft.settings);
    MultiPort.transact(w => { w.inventory = copy(options._settings); }, { automatic: true });
    draft.settings = options._settings; draft.stamp = stamp(); invalidate(); showDialog(); toast('已保存起始盘点和推算参数，没有改动各港库存。');
  };
  document.addEventListener('input', event => {
    const el = event.target; if (!draft || !dialogOpen) return;
    if (el.dataset.routeStock) { draft.settings[el.dataset.routeStock] = el.type === 'checkbox' ? el.checked : el.value; invalidate(); }
    if (el.dataset.routeStockRate) { draft.settings[el.dataset.routeStockRate][el.dataset.key] = el.value; invalidate(); }
    if (el.dataset.routeStockPeople) { draft.settings[el.dataset.routeStockPeople][el.dataset.key] = el.value; invalidate(); }
    if (el.dataset.routeDelivery) { const row = draft.settings.deliveries[Number(el.dataset.index)]; if (row) { row[el.dataset.routeDelivery] = el.value; delete row.rowId; delete row.unit; delete row.location; invalidate(); } }
  });
  document.addEventListener('change', event => {
    const el = event.target; if (!draft || !dialogOpen || el.dataset.routeStock !== 'sourceId') return;
    draft.settings.sourceId = el.value; draft.settings.base = null; draft.settings.date = ''; invalidate(); showDialog();
  });
  document.addEventListener('click', event => {
    const close = event.target.closest?.('[data-action="closeModal"]');
    if (close?.closest('.dialog')?.querySelector('[data-route-stock]')) dialogOpen = false;
  });
  global.MultiPortStock = Object.freeze({ open, preview, apply, buildOptions, get draft() { return draft; } });
})(globalThis);

/* Continuous route inventory. Pure calculation: never changes application state.
 * Opening inventory is the only initial balance; task.stores is an item catalogue,
 * never an implicit quantity override. All date differences are calendar days.
 * Provision rates are quantity/person/day; dailyRates for other items are
 * quantity/day. Sailing uses the previous departure headcount, berth stay uses
 * the current arrival headcount. Explicit leg/stay overrides take precedence.
 * A pending quantity/rate is carried visibly, never treated as a confirmed zero.
 * Arrival/departure corrections are explicit physical-count rebases. They cannot
 * erase a shortage or incomplete estimate that occurred before that correction.
 */
(function (global) {
  'use strict';
  const own = (obj, key) => !!obj && Object.prototype.hasOwnProperty.call(obj, key);
  const norm = value => String(value ?? '').trim().normalize('NFKC').replace(/[\s,，.。_\-()（）/\\:：]/g, '').toLowerCase();
  const clone = value => structuredClone(value);
  const cleanNum = value => Number.isFinite(value) ? Number(value.toPrecision(14)) : value;
  function numeric(value) {
    if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '') return null;
    const text = String(value).trim();
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) return null;
    const n = Number(text); return Number.isFinite(n) ? n : null;
  }
  function dateNumber(value) {
    const s = String(value ?? '').trim();
    let m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(s), y, month, day;
    if (m) [, y, month, day] = m;
    else { m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s); if (!m) return null; [, day, month, y] = m; }
    y = Number(y); month = Number(month); day = Number(day);
    if (y < 1900 || y > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return null;
    const d = new Date(Date.UTC(y, month - 1, day));
    return d.getUTCFullYear() === y && d.getUTCMonth() === month - 1 && d.getUTCDate() === day ? d.getTime() : null;
  }
  function daySpan(from, to) { const a = dateNumber(from), b = dateNumber(to); return a === null || b === null ? null : (b - a) / 86400000; }
  function rowKey(row) {
    if (String(row?._routeKey ?? row?.key ?? '').trim()) return String(row._routeKey ?? row.key).trim();
    return [norm(row?.name), norm(row?.unit), norm(row?.location)].join('|');
  }
  function provisionKey(row) { return norm(row?.name) + '|' + norm(row?.unit); }
  function isProvision(row) { return ['provisions', 'provision', 'food', '伙食库', '伙食', '食品库', '食品'].includes(norm(row?.location)); }
  function calculate(options = {}) {
    const errors = [], warnings = [], ports = [], issueKeys = new Set();
    const result = { ok: false, complete: false, errors, warnings, ports, rowKeys: [] };
    const issue = (level, code, message, detail = {}) => {
      const marker = [level, code, detail.taskId, detail.key, detail.phase].join('|');
      if (issueKeys.has(marker)) return;
      issueKeys.add(marker); (level === 'error' ? errors : warnings).push({ code, message, ...detail });
    };
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      issue('error', 'INVALID_OPTIONS', '库存推算参数无效。'); return result;
    }
    const opening = options.opening || {}, tasks = options.tasks;
    if (!Array.isArray(opening.rows) || !Array.isArray(tasks) || !tasks.length) {
      issue('error', 'MISSING_INPUT', '请先选择起始库存，并至少添加一个港口任务。'); return result;
    }
    if (opening.rows.length > 10000 || tasks.length > 500) {
      issue('error', 'TOO_MANY_ITEMS', '一次推算最多支持 500 个港口、10000 项起始物料。'); return result;
    }
    const openingDate = dateNumber(opening.date), ids = new Set();
    if (openingDate === null) issue('error', 'INVALID_OPENING_DATE', '请填写起始库存的有效盘点日期。');
    let previousDate = opening.date;
    for (const task of tasks) {
      if (!task || typeof task !== 'object' || !String(task.id ?? '').trim() || ids.has(String(task.id))) {
        issue('error', 'INVALID_TASK_ID', '港口任务标识缺失或重复。'); continue;
      }
      ids.add(String(task.id));
      const arrival = dateNumber(task.arrivalDate), departure = dateNumber(task.departureDate), taskId = String(task.id);
      if (task.stores !== undefined && (!Array.isArray(task.stores) || task.stores.length > 10000)) issue('error', 'INVALID_TASK_STORES', '港口物料目录格式无效或超过 10000 项。', { taskId });
      if (arrival === null || departure === null) issue('error', 'INVALID_TASK_DATE', `${task.label || taskId}：请填写有效的到港和离港日期。`, { taskId });
      else if (daySpan(previousDate, task.arrivalDate) < 0 || departure < arrival) issue('error', 'REVERSED_DATE', `${task.label || taskId}：日期早于起始盘点、上一港离港或本港到港日期。`, { taskId });
      previousDate = task.departureDate;
    }
    const deliveries = options.deliveries ?? [];
    if (!Array.isArray(deliveries) || deliveries.length > 10000) issue('error', 'INVALID_DELIVERIES', '补给记录格式无效或超过 10000 条。');
    else for (const delivery of deliveries) {
      if (!delivery || !ids.has(String(delivery.taskId)) || !['arrival', 'departure'].includes(delivery.when) || numeric(delivery.quantity) === null || numeric(delivery.quantity) < 0) {
        issue('error', 'INVALID_DELIVERY', '补给必须关联已有港口，选择到港/离港，并填写非负数量。', { taskId: String(delivery?.taskId ?? '') });
      }
    }
    if (errors.length) return result;
    const stock = new Map(), catalog = [], byId = new Map();
    function register(row, initial = false) {
      if (!row || typeof row !== 'object' || !String(row.name ?? '').trim()) { issue('error', 'INVALID_ROW', '每项库存必须填写物料名称。'); return null; }
      const key = rowKey(row);
      if (initial && stock.has(key)) { issue('error', 'DUPLICATE_ROW', `物料“${row.name}”名称、单位、位置重复，请合并或设置不同的物料标识。`, { key }); return null; }
      if (initial) {
        const quantity = numeric(row.quantity);
        if (quantity !== null && quantity < 0) issue('error', 'NEGATIVE_OPENING', `“${row.name}”起始库存不能为负数。`, { key });
        const source = { ...clone(row), _routeKey: key };
        stock.set(key, { row: source, value: quantity, raw: row.quantity ?? '', pending: quantity === null });
        if (quantity === null) issue('warning', 'NON_NUMERIC_OPENING', `“${row.name}”起始库存为文字或空白，将保留原义，不作为数字零推算。`, { key });
      }
      catalog.push({ ...clone(row), _routeKey: key });
      if (row.id !== undefined && row.id !== '') {
        const id = String(row.id), keys = byId.get(id) || new Set(); keys.add(key); byId.set(id, keys);
      }
      return key;
    }
    for (const row of opening.rows) register(row, true);
    for (const task of tasks) for (const row of task.stores || []) register(row, false);
    if (errors.length) return result;
    function resolveDelivery(delivery) {
      let key = String(delivery.key ?? delivery._routeKey ?? '').trim();
      if (!key && delivery.rowId !== undefined && delivery.rowId !== '') {
        const found = byId.get(String(delivery.rowId));
        if (!found || found.size !== 1) { issue('error', 'AMBIGUOUS_DELIVERY', '补给物料标识不存在或对应多个物料，请重新选择。', { taskId: String(delivery.taskId) }); return null; }
        key = [...found][0];
      }
      if (!key && String(delivery.name ?? '').trim()) key = rowKey(delivery);
      const source = catalog.find(row => row._routeKey === key) || (String(delivery.name ?? '').trim() ? delivery : null);
      if (!key || !source) { issue('error', 'UNKNOWN_DELIVERY', '请为补给记录选择物料，或完整填写物料名称、单位和位置。', { taskId: String(delivery.taskId), key }); return null; }
      if (own(delivery, 'unit') && norm(delivery.unit) !== norm(source.unit)) {
        issue('error', 'DELIVERY_UNIT_MISMATCH', `“${source.name}”补给单位与原库存单位不同，程序不会自动换算，请统一单位后再计算。`, { taskId: String(delivery.taskId), key }); return null;
      }
      if (own(delivery, 'location') && norm(delivery.location) !== norm(source.location)) {
        issue('error', 'DELIVERY_LOCATION_MISMATCH', `“${source.name}”补给位置与选择的库存位置不同，请重新选择物料。`, { taskId: String(delivery.taskId), key }); return null;
      }
      return { ...delivery, taskId: String(delivery.taskId), key, source: { ...clone(source), _routeKey: key }, quantity: numeric(delivery.quantity) };
    }
    const resolvedDeliveries = deliveries.map(resolveDelivery).filter(Boolean);
    if (errors.length) return result;
    let previousPeople = opening.people;
    const includePassengers = !!options.includePassengers;
    let previousPassengers = opening.passengers ?? 0;
    function peopleCount(value, passengers, detail) {
      const count = numeric(value), guest = includePassengers ? numeric(passengers ?? 0) : 0;
      if (count === null || !Number.isSafeInteger(count) || count < 0 || guest === null || !Number.isSafeInteger(guest) || guest < 0 || !Number.isSafeInteger(count + guest)) {
        issue('error', 'INVALID_PEOPLE', '推算人数必须为明确填写的非负整数。', detail); return null;
      }
      return count + guest;
    }
    function rateFor(row, map) {
      for (const key of [row._routeKey, provisionKey(row), row.id === undefined ? '' : String(row.id)]) if (key && own(map, key)) return { present: true, raw: map[key] };
      return { present: false, raw: '' };
    }
    function consume(task, phase, days, people, rates, dailyRates, changes) {
      for (const [key, item] of stock) {
        const change = changes.get(key), field = phase === 'leg' ? 'consumedLeg' : 'consumedStay', detail = { taskId: String(task.id), key, phase };
        change[field] = 0;
        if (days === 0) continue;
        const personRate = isProvision(item.row), selected = rateFor(item.row, personRate ? rates : dailyRates);
        if (!personRate && (!selected.present || String(selected.raw).trim() === '')) continue;
        if (personRate && people === 0) continue;
        const rate = numeric(selected.raw);
        if (!selected.present || String(selected.raw).trim() === '') {
          change[field] = null; item.pending = true; change.pending = true;
          issue('warning', 'MISSING_RATE', `“${item.row.name}”未填写每人每天用量，数量暂保留，需补齐后重算。`, detail); continue;
        }
        if (rate === null || rate < 0) {
          change[field] = null; item.pending = true; change.pending = true;
          issue('error', 'INVALID_RATE', `“${item.row.name}”消耗标准必须为非负数。`, detail); continue;
        }
        if (item.value === null || (personRate && people === null)) {
          change[field] = null; item.pending = true; change.pending = true;
          issue('warning', 'NON_NUMERIC_STOCK', `“${item.row.name}”不是可计算数量（空白、NIL 或文字均保留原义），请确认盘点数量。`, detail); continue;
        }
        const consumption = cleanNum(rate * days * (personRate ? people : 1));
        item.value = cleanNum(item.value - consumption); change[field] = consumption;
        if (!Number.isFinite(item.value) || !Number.isFinite(consumption)) issue('error', 'NUMBER_OVERFLOW', `“${item.row.name}”推算结果超出数值范围。`, detail);
        else if (item.value < 0) issue('error', 'STOCK_SHORTAGE', `“${item.row.name}”在${phase === 'leg' ? '到港前航行段' : '本港停泊期间'}库存不足（${item.value} ${item.row.unit || ''}），请核对起始盘点、消耗标准或前站补给。`, { ...detail, quantity: item.value });
      }
    }
    function exportRows() { return [...stock.values()].map(item => ({ ...clone(item.row), quantity: item.value === null ? item.raw : String(cleanNum(item.value)), _routePending: item.pending })); }
    function changeFor(item) { return { key: item.row._routeKey, name: item.row.name, unit: item.row.unit || '', location: item.row.location || '', opening: item.value === null ? item.raw : item.value, consumedLeg: 0, consumedStay: 0, receivedArrival: 0, receivedDeparture: 0, arrival: null, departure: null, pending: item.pending, overriddenArrival: false, overriddenDeparture: false }; }
    function receive(task, phase, changes) {
      for (const delivery of resolvedDeliveries.filter(d => d.taskId === String(task.id) && d.when === phase)) {
        if (!stock.has(delivery.key)) {
          const source = { ...clone(delivery.source), quantity: '0' }, item = { row: source, value: 0, raw: '0', pending: false };
          stock.set(delivery.key, item); changes.set(delivery.key, changeFor(item));
        }
        const item = stock.get(delivery.key), change = changes.get(delivery.key);
        const field = phase === 'arrival' ? 'receivedArrival' : 'receivedDeparture';
        change[field] = cleanNum(change[field] + delivery.quantity);
        if (item.value === null) {
          item.pending = true; change.pending = true;
          issue('warning', 'UNKNOWN_OPENING_WITH_DELIVERY', `“${item.row.name}”原库存为文字，已记录补给 ${delivery.quantity}，请用实际盘点数量确认结余。`, { taskId: String(task.id), key: delivery.key, phase });
        } else {
          item.value = cleanNum(item.value + delivery.quantity);
          if (!Number.isFinite(item.value)) issue('error', 'NUMBER_OVERFLOW', `“${item.row.name}”补给后数量超出数值范围。`, { taskId: String(task.id), key: delivery.key, phase });
        }
      }
    }
    function applyOverrides(task, phase, changes) {
      const all = options.overrides?.[task.id]; if (!all || typeof all !== 'object') return;
      const map = own(all, 'arrival') || own(all, 'departure') ? all[phase] || {} : phase === 'arrival' ? all : {};
      for (const key of Object.keys(map)) {
        if (!stock.has(key)) {
          const source = catalog.find(row => row._routeKey === key);
          if (!source) { issue('error', 'UNKNOWN_OVERRIDE', '盘点修正关联的物料不存在，请重新选择物料。', { taskId: String(task.id), key, phase }); continue; }
          const item = { row: { ...clone(source), quantity: '0' }, value: 0, raw: '0', pending: false };
          stock.set(key, item); changes.set(key, changeFor(item));
        }
        const quantity = numeric(map[key]), item = stock.get(key), change = changes.get(key);
        if (quantity === null || quantity < 0) { issue('error', 'INVALID_OVERRIDE', `“${item.row.name}”盘点修正必须填写非负数量。`, { taskId: String(task.id), key, phase }); continue; }
        item.value = quantity; item.raw = String(quantity); item.pending = false;
        change[phase === 'arrival' ? 'overriddenArrival' : 'overriddenDeparture'] = true;
        change[phase === 'arrival' ? 'arrivalOverride' : 'departureOverride'] = quantity;
      }
    }
    previousDate = opening.date;
    for (const task of tasks) {
      const taskId = String(task.id), person = typeof task.people === 'object' && task.people !== null ? task.people : { arrival: task.people, departure: task.people };
      const legConfig = options.perLegRates?.[task.id] || {}, rates = { ...(options.rates || {}), ...(legConfig.rates || {}) }, dailyRates = { ...(options.dailyRates || {}), ...(legConfig.dailyRates || {}) };
      const explicitLeg = legConfig.people ?? person.leg, legBase = explicitLeg ?? previousPeople ?? person.arrival;
      const explicitStay = legConfig.stayPeople ?? person.stay, stayBase = explicitStay ?? person.arrival;
      const legPeople = peopleCount(legBase, explicitLeg !== undefined && explicitLeg !== null ? 0 : previousPeople !== undefined ? previousPassengers : person.passengerArrival, { taskId, phase: 'leg' });
      const stayPeople = peopleCount(stayBase, explicitStay !== undefined && explicitStay !== null ? 0 : person.passengerArrival, { taskId, phase: 'stay' });
      const departurePeople = peopleCount(person.departure ?? person.arrival, person.passengerDeparture ?? person.passengerArrival, { taskId, phase: 'departure' });
      const days = daySpan(previousDate, task.arrivalDate), stayDays = daySpan(task.arrivalDate, task.departureDate), changes = new Map([...stock].map(([key, item]) => [key, changeFor(item)]));
      consume(task, 'leg', days, legPeople, rates, dailyRates, changes);
      receive(task, 'arrival', changes); applyOverrides(task, 'arrival', changes);
      const arrivalRows = exportRows();
      for (const [key, item] of stock) { const change = changes.get(key); change.arrival = item.value === null ? item.raw : item.value; change.arrivalPending = item.pending; }
      consume(task, 'stay', stayDays, stayPeople, rates, dailyRates, changes);
      receive(task, 'departure', changes); applyOverrides(task, 'departure', changes);
      const departureRows = exportRows();
      for (const [key, item] of stock) { const change = changes.get(key); change.departure = item.value === null ? item.raw : item.value; change.departurePending = item.pending; change.pending = !!change.pending || change.arrivalPending || item.pending; }
      ports.push({ id: taskId, label: String(task.label || taskId), arrivalDate: task.arrivalDate, departureDate: task.departureDate,
        leg: { from: previousDate, to: task.arrivalDate, days, people: legPeople }, stay: { from: task.arrivalDate, to: task.departureDate, days: stayDays, people: stayPeople }, departurePeople,
        arrivalRows, departureRows, rows: arrivalRows, changes: [...changes.values()],
        valid: !errors.some(e => e.taskId === taskId), complete: ![...changes.values()].some(c => c.pending) });
      previousDate = task.departureDate;
      previousPeople = person.departure ?? person.arrival;
      previousPassengers = person.passengerDeparture ?? person.passengerArrival ?? 0;
    }
    result.rowKeys = [...stock.keys()]; result.ok = errors.length === 0;
    result.complete = result.ok && ports.every(port => port.complete);
    return result;
  }
  global.RouteInventory = Object.freeze({ calculate, rowKey, provisionKey, daySpan, isProvision });
})(typeof globalThis !== 'undefined' ? globalThis : window);

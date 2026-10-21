import { readFile, writeFile } from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context = vm.createContext({ structuredClone });
vm.runInContext(await readFile(new URL('./route_inventory.js', import.meta.url), 'utf8'), context);
const api = context.RouteInventory, checks = [];
function test(name, fn) { fn(); checks.push(name); }
const rice = { id: 'rice', name: 'Rice', quantity: '100', unit: 'kgs', location: 'PROVISIONS' };
const fuel = { id: 'fuel', name: 'VLSFO', quantity: '50', unit: 'MT', location: 'ENGINE STORES' };
const key = api.rowKey(rice), fuelKey = api.rowKey(fuel);
function config() { return { opening: { date: '2026-10-01', port: 'Opening', people: 10, rows: [rice, fuel] }, tasks: [{ id: 'a', label: 'Port A', arrivalDate: '2026-10-06', departureDate: '2026-10-08', people: { arrival: 10, departure: 12 } }, { id: 'b', label: 'Port B', arrivalDate: '2026-10-11', departureDate: '2026-10-12', people: { arrival: 12, departure: 12 } }], rates: { [api.provisionKey(rice)]: '0.2' } }; }
test('Independent two-port arithmetic: sailing, stay, changed departure headcount and receipts', () => {
  const input = config(); input.deliveries = [{ taskId: 'a', key, when: 'arrival', quantity: '5' }, { taskId: 'a', rowId: 'rice', when: 'departure', quantity: '10' }];
  const saved = JSON.stringify(input), result = api.calculate(input);
  assert.equal(result.ok, true); assert.equal(result.complete, true);
  // A arrival:100-5*10*.2+5=95; A departure:95-2*10*.2+10=101.
  // B arrival:101-3*12*.2=93.8; B departure:93.8-1*12*.2=91.4.
  assert.equal(result.ports[0].arrivalRows[0].quantity, '95'); assert.equal(result.ports[0].departureRows[0].quantity, '101');
  assert.equal(result.ports[1].arrivalRows[0].quantity, '93.8'); assert.equal(result.ports[1].departureRows[0].quantity, '91.4');
  assert.equal(result.ports[1].leg.people, 12); assert.equal(result.ports[1].leg.days, 3);
  assert.equal(result.ports[1].departureRows[1].quantity, '50'); assert.equal(JSON.stringify(input), saved);
});
test('Explicit other-store daily use and per-leg rate/headcount overrides', () => {
  const input = config(); input.dailyRates = { [fuelKey]: '1.5' }; input.perLegRates = { b: { people: 20, stayPeople: 5, rates: { [key]: '0.1' }, dailyRates: { [fuelKey]: '2' } } };
  const result = api.calculate(input);
  assert.equal(result.ports[1].arrivalRows[0].quantity, '80'); assert.equal(result.ports[1].departureRows[0].quantity, '79.5');
  assert.equal(result.ports[1].departureRows[1].quantity, '31.5'); assert.equal(result.ports[1].leg.people, 20);
});
test('Explicit arrival/departure count corrections propagate while preserving audit evidence', () => {
  const input = config(); input.overrides = { a: { arrival: { [key]: '70' }, departure: { [key]: '80' } } };
  const result = api.calculate(input);
  assert.equal(result.ports[0].arrivalRows[0].quantity, '70'); assert.equal(result.ports[0].departureRows[0].quantity, '80');
  assert.equal(result.ports[1].arrivalRows[0].quantity, '72.8'); assert.equal(result.ports[0].changes[0].overriddenArrival, true);
  assert.equal(result.ports[0].changes[0].consumedLeg, 10); assert.equal(result.ports[0].changes[0].consumedStay, 4);
});
test('Shortage blocks result, retains negative, cannot be hidden by later delivery/count correction', () => {
  const input = config(); input.opening.rows[0] = { ...rice, quantity: '1' }; input.deliveries = [{ taskId: 'a', key, when: 'arrival', quantity: 100 }];
  input.overrides = { a: { arrival: { [key]: 200 } } }; const result = api.calculate(input);
  assert.equal(result.ok, false); assert.ok(result.errors.some(e => e.code === 'STOCK_SHORTAGE' && e.quantity === -9));
  const plain = config(); plain.opening.rows[0] = { ...rice, quantity: '1' };
  assert.equal(api.calculate(plain).ports[0].arrivalRows[0].quantity, '-9');
});
test('Missing rates are pending; explicit zero rate is a valid estimate', () => {
  const input = config(); input.rates = {}; const missing = api.calculate(input);
  assert.equal(missing.ok, true); assert.equal(missing.complete, false); assert.ok(missing.warnings.some(w => w.code === 'MISSING_RATE'));
  assert.equal(missing.ports[0].arrivalRows[0].quantity, '100'); assert.equal(missing.ports[1].arrivalRows[0]._routePending, true);
  input.rates = { [key]: '0' }; assert.equal(api.calculate(input).complete, true);
});
test('NIL and arbitrary text quantities remain literal; receipt cannot turn NIL into zero', () => {
  const input = config(); input.opening.rows[0] = { ...rice, quantity: 'NIL' }; input.deliveries = [{ taskId: 'a', key, when: 'arrival', quantity: 2 }];
  const result = api.calculate(input); assert.equal(result.complete, false); assert.equal(result.ports[0].arrivalRows[0].quantity, 'NIL');
  assert.equal(result.ports[0].changes[0].receivedArrival, 2); assert.ok(result.warnings.some(w => w.code === 'UNKNOWN_OPENING_WITH_DELIVERY'));
});
test('Passenger inclusion, explicit sailing total, leap dates and calendar day spans', () => {
  const input = config(); input.opening.passengers = 2; input.tasks[0].people.passengerArrival = 3; input.tasks[0].people.passengerDeparture = 1;
  input.tasks[1].people.leg = 20; input.includePassengers = true; const result = api.calculate(input);
  assert.equal(result.ports[0].leg.people, 12); assert.equal(result.ports[0].stay.people, 13); assert.equal(result.ports[0].departurePeople, 13);
  assert.equal(result.ports[1].leg.people, 20); assert.equal(api.daySpan('2024-02-28', '2024-03-01'), 2);
  assert.equal(api.daySpan('2026-10-03', '2026-10-05'), 2); assert.equal(api.daySpan('2026-02-29', '2026-03-01'), null);
});
test('Ambiguous duplicate rows reject; explicitly distinct keys survive', () => {
  const input = config(); input.opening.rows.push({ ...rice, id: 'other-rice' }); assert.equal(api.calculate(input).ok, false);
  input.opening.rows[0] = { ...rice, key: 'bin-1' }; input.opening.rows[2] = { ...rice, id: 'other-rice', key: 'bin-2' };
  const result = api.calculate(input); assert.equal(result.ok, true); assert.equal(result.ports[0].arrivalRows.length, 3);
});
test('Deliveries can introduce a new item at its real event, quantities in task catalog do not overwrite stock', () => {
  const input = config(); input.tasks[0].stores = [{ ...rice, quantity: '9000' }];
  input.deliveries = [{ taskId: 'b', name: 'Paint', unit: 'Ltrs', location: 'DECK STORES', quantity: 12, when: 'departure' }];
  const result = api.calculate(input); assert.equal(result.ports[0].arrivalRows[0].quantity, '90');
  assert.equal(result.ports[0].arrivalRows.length, 2); assert.equal(result.ports[1].arrivalRows.length, 2);
  assert.equal(result.ports[1].departureRows.at(-1).quantity, '12');
});
test('A delivery cannot silently add different units or a different storage location to the chosen stock', () => {
  const input = config(); input.deliveries = [{ taskId: 'a', key, unit: 'MT', quantity: 2, when: 'arrival' }];
  assert.ok(api.calculate(input).errors.some(error => error.code === 'DELIVERY_UNIT_MISMATCH'));
  input.deliveries[0].unit = 'kgs'; input.deliveries[0].location = 'ENGINE STORES';
  assert.ok(api.calculate(input).errors.some(error => error.code === 'DELIVERY_LOCATION_MISMATCH'));
});
test('Malformed dates, missing/negative people, rates, delivery phase and future-dated opening block safely', () => {
  const a = config(); a.opening.date = '2026-10-07'; assert.equal(api.calculate(a).ok, false);
  const b = config(); b.tasks[0].people.arrival = -1; assert.equal(api.calculate(b).ok, false);
  const c = config(); c.rates[key] = '-0.2'; assert.equal(api.calculate(c).ok, false);
  const d = config(); d.deliveries = [{ taskId: 'a', key, quantity: 10, when: 'sailing' }]; assert.equal(api.calculate(d).ok, false);
  const e = config(); e.tasks[0].arrivalDate = 'bad'; assert.equal(api.calculate(e).ok, false);
  const f = config(); f.tasks[0].stores = {}; assert.equal(api.calculate(f).ok, false);
  assert.equal(api.calculate(null).ok, false);
});
test('Zero-day visits and zero people need no guessed provision rate; tiny shortages are not clipped', () => {
  const input = config(); input.tasks = [{ id: 'a', arrivalDate: '2026-10-01', departureDate: '2026-10-01', people: 10 }]; input.rates = {};
  assert.equal(api.calculate(input).complete, true);
  input.tasks[0].arrivalDate = '2026-10-02'; input.tasks[0].departureDate = '2026-10-02'; input.opening.people = 0;
  assert.equal(api.calculate(input).complete, true);
  input.opening.people = 1; input.opening.rows[0] = { ...rice, quantity: '0' }; input.rates[key] = '0.0000000001';
  const negative = api.calculate(input); assert.equal(negative.ok, false); assert.equal(negative.ports[0].arrivalRows[0].quantity, '-1e-10');
});
test('Overflowing receipts and unsafe headcounts cannot pass a zero-day calculation', () => {
  const input = config(); input.opening.rows = [{ ...fuel, quantity: '1e308' }]; input.tasks = [{ id: 'a', arrivalDate: '2026-10-01', departureDate: '2026-10-01', people: 10 }];
  input.deliveries = [{ taskId: 'a', rowId: 'fuel', when: 'arrival', quantity: '1e308' }];
  assert.ok(api.calculate(input).errors.some(error => error.code === 'NUMBER_OVERFLOW'));
  input.deliveries = []; input.tasks[0].people = Number.MAX_SAFE_INTEGER + 1;
  assert.ok(api.calculate(input).errors.some(error => error.code === 'INVALID_PEOPLE'));
});
test('An explicit physical count may introduce a known task-catalog item only at that port', () => {
  const input = config(), paint = { id: 'paint', name: 'Paint', unit: 'Ltrs', location: 'DECK STORES', quantity: '12' };
  input.tasks[1].stores = [paint]; input.overrides = { b: { departure: { [api.rowKey(paint)]: 12 } } };
  const result = api.calculate(input); assert.equal(result.ok, true); assert.equal(result.ports[0].departureRows.length, 2);
  assert.equal(result.ports[1].departureRows.at(-1).quantity, '12');
});
const report = { checkedAt: new Date().toISOString(), passed: checks.length, checks };
await writeFile(new URL('./route-inventory-verification.json', import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

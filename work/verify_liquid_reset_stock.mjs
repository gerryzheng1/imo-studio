import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { pathToFileURL, fileURLToPath } from 'node:url';
process.chdir(fileURLToPath(new URL('.',import.meta.url)));
import assert from 'node:assert/strict';
const reports = [];
for (const channel of (process.env.IMO_BROWSERS||'chrome,msedge').split(',')) {
  const browser = await chromium.launch({ ...(channel==='chromium'?{}:{channel}), headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } }), errors = [], checks = [];
    page.on('pageerror', error => errors.push(error.message)); page.on('dialog', dialog => dialog.accept());
    await page.goto(pathToFileURL('../outputs/IMO_Generator.html').href); await page.evaluate(() => IMOApp.ready);
    await page.evaluate(async () => {
      const s = blankState(); s.people = Array.from({ length: 12 }, (_, n) => ({ id: 'crew' + n, name: 'CREW ' + n }));
      s.arrival = s.people.slice(0, 10).map(p => ({ personId: p.id, overrides: {} })); s.departure = s.people.map(p => ({ personId: p.id, overrides: {} }));
      s.stores = [{ id: 'rice', name: 'Rice', quantity: '100', unit: 'kgs', location: 'PROVISIONS' }, { id: 'fuel', name: 'VLSFO', quantity: '50', unit: 'MT', location: 'ENGINE STORES' }];
      s.declarations.stores = 'records'; s.provisionRates = { 'rice|kgs': '0.2' };
      s.plannedPorts = [
        { id: 'pa', port: 'Brisbane', country: 'Australia', arrivalDate: '2026-10-01', departureDate: '2026-10-02', security: '1', remarks: 'CARGO OPERATION' },
        { id: 'pb', port: 'Noumea', country: 'New Caledonia', arrivalDate: '2026-10-04', departureDate: '2026-10-05', security: '1', remarks: 'CARGO OPERATION' },
        { id: 'pc', port: 'Shanghai', country: 'China', arrivalDate: '2026-10-07', departureDate: '2026-10-08', security: '1', remarks: 'CARGO OPERATION' }
      ]; IMOApp.setState(s); await MultiPort.create(['pa', 'pc'], { includeCurrent: false });
      MultiPort.transact(w => { w.tasks[0].data.arrival = w.tasks[0].data.arrival.slice(0, 10); for (const task of w.tasks) { task.data.health.q1 = 'No'; task.data.nil.passengers = 'NIL'; } });
    });
    checks.push('Clean portable boot and two independent tasks created without page errors');
    await page.locator('#filesDock').click();await page.locator('#nav [data-action=wsGo][data-view=stores]').click();await page.locator('[data-action=wsStock]').click();
    await page.locator('[data-route-stock="date"]').fill('2026-10-01');
    await page.locator('details').filter({ has: page.locator('summary', { hasText: '3. 各港补给' }) }).locator('summary').first().click();
    await page.locator('[data-action="routeStockAddDelivery"]').click();
    const aid = await page.evaluate(() => MultiPort.tasks()[0].id), cid = await page.evaluate(() => MultiPort.tasks()[1].id);
    await page.locator('[data-route-delivery="taskId"]').selectOption(aid);
    const riceKey = await page.evaluate(() => RouteInventory.rowKey(MultiPort.tasks()[0].data.stores[0]));
    await page.locator('[data-route-delivery="key"]').selectOption(riceKey);
    await page.locator('[data-route-delivery="when"]').selectOption('departure');
    await page.locator('[data-route-delivery="quantity"]').fill('10');
    await page.locator('[data-action="routeStockAddDelivery"]').click();
    const fuelKey = await page.evaluate(() => RouteInventory.rowKey(MultiPort.tasks()[0].data.stores[1]));
    await page.locator('[data-route-delivery="taskId"]').nth(1).selectOption(aid);
    await page.locator('[data-route-delivery="key"]').nth(1).selectOption(fuelKey);
    await page.locator('[data-route-delivery="when"]').nth(1).selectOption('departure');
    await page.locator('[data-route-delivery="quantity"]').nth(1).fill('5');
    await page.locator('[data-action="routeStockPreview"]').click();
    const initial = await page.evaluate(() => MultiPortStock.draft.result);
    assert.equal(initial.complete, true); assert.equal(initial.ports.length, 3);
    assert.equal(initial.ports[0].departureRows[0].quantity, '108'); assert.equal(initial.ports[1].arrivalRows[0].quantity, '103.2');
    assert.equal(initial.ports[1].departureRows[0].quantity, '100.8'); assert.equal(initial.ports[2].arrivalRows[0].quantity, '96');
    assert.equal(initial.ports[2].departureRows[0].quantity, '93.6'); assert.equal(initial.ports[2].departureRows[1].quantity, '55');
    await page.screenshot({ path: `multiport-stock-${channel}-preview.png`, fullPage: true });
    await page.locator('#routeStockApply').click();
    assert.deepEqual(await page.evaluate(() => MultiPort.tasks().map(t => [t.data.health.q1, t.data.nil.passengers])), [['No', 'NIL'], ['No', 'NIL']]);
    checks.push('Actual dialog: dated opening, receipt editing, virtual intermediate stop, people changes, separate sailing/stay and receipt arithmetic, apply without altering health/NIL');
    await page.evaluate(id => MultiPort.switchTask(id, 'stores'), cid);
    await page.locator('[data-table="stores"][data-id="rice"][data-field="quantity"]').fill('80');
    await page.evaluate(() => { currentView = 'voyage'; render(); });
    await page.evaluate(()=>{currentView='voyage';render()});await page.locator('[data-bind="voyage.mode"]').selectOption('departure');await page.evaluate(()=>{currentView='stores';render()});
    assert.equal(await page.evaluate(() => state.stores[0].quantity), '93.6');
    await page.evaluate(() => MultiPortStock.open()); await page.locator('[data-action="routeStockPreview"]').click();
    assert.equal(await page.evaluate(() => MultiPortStock.draft.result.ports.at(-1).arrivalRows[0].quantity), '80');
    assert.equal(await page.evaluate(() => MultiPortStock.draft.result.ports.at(-1).departureRows[0].quantity), '77.6');
    await page.locator('#routeStockApply').click(); assert.equal(await page.evaluate(() => state.stores[0].quantity), '77.6');
    checks.push('Hand-edited arrival count survives departure-mode switch and recalculation; departure receives the correctly recomputed quantity');
    await page.evaluate(() => { currentView = 'stores'; render(); });
    await page.locator('[data-table="stores"][data-id="rice"][data-field="quantity"]').fill('75.5');
    await page.evaluate(() => { currentView = 'voyage'; render(); }); await page.locator('[data-bind="voyage.mode"]').selectOption('arrival');
    assert.equal(await page.evaluate(() => state.stores[0].quantity), '80');
    await page.evaluate(() => MultiPortStock.open()); await page.locator('[data-action="routeStockPreview"]').click();
    assert.equal(await page.evaluate(() => MultiPortStock.draft.result.ports.at(-1).departureRows[0].quantity), '75.5');
    await page.locator('#routeStockApply').click();
    await page.evaluate(async () => { const packed = packedProject(); await loadProject(new File([JSON.stringify(packed)], 'multiport-stock-roundtrip.imoproject.json', { type: 'application/json' })); });
    const restored = await page.evaluate(id => { const task = MultiPort.inspect(id); return { arrival: task.inventory.arrivalRows[0].quantity, departure: task.inventory.departureRows[0].quantity, actualA: task.manual.stockPhases.arrival[0].quantity, actualD: task.manual.stockPhases.departure[0].quantity, base: state.multiport.inventory.base.rows[0].quantity }; }, cid);
    assert.deepEqual(restored, { arrival: '80', departure: '75.5', actualA: '80', actualD: '75.5', base: '100' });
    checks.push('Both phase-specific physical counts, calculated rows, receipts and frozen opening round-trip through the actual full project parser');
    await page.evaluate(() => MultiPortStock.open());
    await page.locator('[data-route-stock-rate="rates"]').first().fill(''); await page.locator('[data-action="routeStockPreview"]').click();
    assert.equal(await page.evaluate(() => MultiPortStock.draft.result.complete), false); assert.equal(await page.locator('#routeStockApply').isDisabled(), true);
    await page.locator('[data-route-stock-rate="rates"]').first().fill('100'); await page.locator('[data-action="routeStockPreview"]').click();
    assert.equal(await page.evaluate(() => MultiPortStock.draft.result.ok), false); assert.equal(await page.locator('#routeStockApply').isDisabled(), true);
    checks.push('Actual rate edits invalidate old preview; missing rate and negative inventory disable Apply instead of substituting zero');
    await page.locator('[data-route-stock-rate="rates"]').first().fill('0.2'); await page.locator('[data-action="routeStockPreview"]').click();
    const stale = await page.evaluate(() => { MultiPort.transact(w => { w.tasks.at(-1).data.voyage.departureDate = '2026-10-09'; }); try { MultiPortStock.apply(); return false; } catch (error) { return /重新预览/.test(error.message); } });
    assert.equal(stale, true); checks.push('Date/revision changes after preview block stale application');
    const unitMismatch = await page.evaluate(() => { const options = MultiPortStock.buildOptions(); options.deliveries[0].unit = 'MT'; return RouteInventory.calculate(options).errors.some(error => error.code === 'DELIVERY_UNIT_MISMATCH'); });
    assert.equal(unitMismatch, true); checks.push('Fuel MT and food kgs receipts remain separate; malformed conflicting receipt units are rejected');
    const skippedEarlier = await page.evaluate(async id => { await MultiPort.remove(MultiPort.tasks()[0].id); try { MultiPortStock.buildOptions({ ...state.multiport.inventory, date: '2026-10-01' }); return false; } catch (error) { return /前序计划港/.test(error.message); } }, cid);
    assert.equal(skippedEarlier, true); checks.push('An opening date crossing earlier unrepresented port calls is explicitly blocked rather than skipping their stay consumption');
    assert.deepEqual(errors, []); reports.push({ channel, checks, pageErrors: errors, screenshots: [`multiport-stock-${channel}-preview.png`] });
  } finally { await browser.close(); }
}
const report = { checkedAt: new Date().toISOString(), browserChecks: reports.reduce((n, r) => n + r.checks.length, 0), reports };
await writeFile('liquid-reset-stock-report.json', JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2));

from pathlib import Path
p=Path(__file__).parent
s=(p/'capture_studio.mjs').read_text(encoding='utf-8').replace(".impeccable/review/fusion",".impeccable/review/liquid-reset").replace("work/studio-contrast-report.json","work/liquid-reset-contrast-report.json")
s=s.replace("await capture('defaults'", "await p.locator('#filesDock').click();await p.screenshot({path:dir+'/library.png',animations:'disabled'});await p.keyboard.press('Escape');await capture('defaults'")
s=s.replace("await capture('dark'", "await p.locator('#sharedDock').click();await p.screenshot({path:dir+'/mobile-library.png',animations:'disabled'});await p.keyboard.press('Escape');await capture('dark'")
(p/'capture_liquid_reset.mjs').write_text(s,encoding='utf-8')
# Keep the domain regressions; adapt user navigation to the new genuine popover.
s=(p/'verify_studio_v21.mjs').read_text(encoding='utf-8').replace("work/studio-v21-report.json","work/liquid-reset-regression-report.json")
for v in ['effects','arrival','stores']:
 s=s.replace("await page.locator('[data-action=wsGo][data-view="+v+"]').first().click();", "await page.locator('#filesDock').click();await page.locator('#nav [data-action=wsGo][data-view="+v+"]').click();")
(p/'verify_liquid_reset_regression.mjs').write_text(s,encoding='utf-8')
s=(p/'verify_studio_workflow.mjs').read_text(encoding='utf-8').replace("work/studio-workflow-report.json","work/liquid-reset-workflow-report.json")
for v in ['declarationDefaults','settings','check']:
 s=s.replace("await page.locator('#nav [data-action=wsGo][data-view="+v+"]').first().click();", "await page.locator('#"+('filesDock' if v=='check' else 'sharedDock')+"').click();await page.locator('#nav [data-action=wsGo][data-view="+v+"]').click();")
s=s.replace("await page.locator('#mobilePageSelect').selectOption('profiles');", "await page.locator('#sharedDock').click();await page.locator('#nav [data-view=profiles]').click();")
s=s.replace("await page.locator('#mobilePageSelect').selectOption('effects');", "await page.locator('#filesDock').click();await page.locator('#nav [data-view=effects]').click();")
(p/'verify_liquid_reset_workflow.mjs').write_text(s,encoding='utf-8')
print('Prepared actual new navigation capture and workflow checks')

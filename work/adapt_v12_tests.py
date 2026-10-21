from pathlib import Path
P=Path(__file__).parent
f=P/'verify_browser.mjs';s=f.read_text(encoding='utf-8')
s=s.replace("await page.waitForFunction(()=>!!window.IMOApp);pass(","await page.waitForFunction(()=>!!window.IMOApp);await page.evaluate(()=>IMOApp.ready);await page.locator('[data-action=clearTemplates]').click();pass(")
s=s.replace("// Duplicate template detection and resolving one version.","// Duplicate template detection and resolving one version.\n await page.locator('#replaceMatchingTemplates').uncheck();")
f.write_text(s,encoding='utf-8')
for name in ['verify_secondary.mjs','verify_pdf_import.mjs']:
 f=P/name;s=f.read_text(encoding='utf-8');s=s.replace('await page.goto(html);','await page.goto(html);await page.evaluate(()=>IMOApp.ready);await page.locator(\'[data-action=clearTemplates]\').click();')
 s=s.replace('await p.goto(html);','await p.goto(html);await p.evaluate(()=>IMOApp.ready);await p.locator(\'[data-action=clearTemplates]\').click();')
 s=s.replace("await page.locator('[data-action=editMapping]').click();","await page.locator('details').filter({has:page.locator('[data-action=editMapping]')}).locator('summary').click();await page.locator('[data-action=editMapping]').click();")
 f.write_text(s,encoding='utf-8')

from pathlib import Path

root=Path(__file__).resolve().parent
nav=(root/'verify_liquid_reset_navigation.mjs').read_text(encoding='utf-8')
start=nav.index(' await p.waitForTimeout(100);assert.ok(await p.evaluate(()=>StudioGlass.filters>=5))')
end=nav.index('\n const beforeFeedback=',start)
nav=nav[:start]+''' await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>StudioGlass.status.renderer),'css');assert.equal(await p.locator('svg filter').count(),0);assert.equal(await p.locator('#studioGlassBackdrop').count(),1);for(const selector of ['.portbar','.liquid-dock']){const style=await p.locator(selector).evaluate(e=>({blur:getComputedStyle(e).backdropFilter,shadow:getComputedStyle(e).boxShadow}));assert.ok(style.blur.includes('blur('));assert.ok(style.shadow.includes('inset'))}const bg=await p.locator('#studioGlassBackdrop').evaluate(c=>c.toDataURL());const paints=await p.evaluate(()=>StudioGlass.status.paintCount);await p.waitForTimeout(200);assert.equal(await p.locator('#studioGlassBackdrop').evaluate(c=>c.toDataURL()),bg);assert.equal(await p.evaluate(()=>StudioGlass.status.paintCount),paints);pass(channel+': source-derived CSS glass is scoped to controls; the local backdrop stays stable without SVG lenses');'''+nav[end:]
nav=nav.replace('liquid-reset-navigation-report.json','yzrt-navigation-report.json')
(root/'verify_yzrt_navigation.mjs').write_text(nav,encoding='utf-8')

cap=(root/'capture_liquid_reset.mjs').read_text(encoding='utf-8')
cap=cap.replace("dir='.impeccable/review/liquid-reset'","dir='.impeccable/review/yzrt'")
start=cap.index('await p.evaluate(()=>{uiSettings.theme=\'light\';applyUISettings();currentView=\'effects\';render()});')
end=cap.index('\nconst ratios=',start)
cap=cap[:start]+'''await capture('settings','settings');await p.locator('#appearanceGlassOptions>summary').click();await p.screenshot({path:dir+'/settings-glass.png',animations:'disabled'});
await p.evaluate(()=>{uiSettings.backgroundStyle='aurora';uiSettings.glassStyle='soft';uiSettings.cornerStyle='soft';applyUISettings();currentView='effects';render()});await p.waitForTimeout(100);await p.screenshot({path:dir+'/aurora-soft.png',animations:'disabled'});
await p.evaluate(()=>{uiSettings.backgroundStyle='plain';uiSettings.glassStyle='clear';applyUISettings();render()});await p.waitForTimeout(100);await p.screenshot({path:dir+'/plain-clear.png',animations:'disabled'});
await p.evaluate(()=>{uiSettings.backgroundStyle='ocean';uiSettings.glassStyle='liquid';uiSettings.cornerStyle='rounded';applyUISettings()});await capture('short-landscape','effects',844,390);await capture('short-mobile','effects',390,480);
''' + cap[end:]
cap=cap.replace('liquid-reset-contrast-report.json','yzrt-contrast-report.json')
(root/'capture_yzrt.mjs').write_text(cap,encoding='utf-8')

app=(root/'app_shell.js').read_text(encoding='utf-8')
app=app.replace('更多显示与操作 <span>强调色、表格字号、快捷键</span>','更多显示与操作 <span>表格字号、预览缩放、快捷键</span>')
app=app.replace("${settingSelect('accent','强调色',[['blue','蓝色'],['teal','青绿'],['violet','紫色']])}${settingSelect('tableFont'", "${settingSelect('tableFont'")
(root/'app_shell.js').write_text(app,encoding='utf-8')

helpfile=root/'app_help.js'
helptext=helpfile.read_text(encoding='utf-8')
a=helptext.index(" topic('settings',")
b=helptext.index("\n topic('faq',",a)
helptext=helptext[:a]+''' topic('settings','外观、文件命名与快捷操作',`<p>点击右上角“总设置”。最上方“外观”可选择浅色、深色或跟随系统，调整强调色、界面字号和表格密度；修改立即生效，不必另点保存。</p><p>想调整玻璃感，展开“玻璃与背景”：玻璃效果可选通透液态、柔和玻璃或清晰易读；背景可选海蓝、极光或纯色；圆角可选圆润或适中。长时间填表可用“清晰易读”。“减少动态”会停止背景和切换动画，电脑的减少动态或减少透明度设置始终优先。</p><p>“恢复默认外观”只重置页面外观，不会更改工程资料、保存位置、自动保存和文件命名规则。外观保存在当前浏览器，生成的 Excel 仍保持模板原有样式。</p><p>工程和 ZIP 的命名规则藏在“文件命名与检查”中，展开后可看见 24 个可用信息、实例和实时预览。“高级与资料管理”可以导出或导入总设置，方便换浏览器继续使用。</p><p>外观、保存和导出选项不代替申报内容；不会自动确认健康、NIL、库存或人数。Ctrl / Command + K 打开文件库，Esc 关闭；Ctrl / Command + S 保存，Ctrl / Command + Shift + S 另存为。修改选项会保留当前页面和表格的滚动位置。</p>`)+''' + helptext[b:]
helpfile.write_text(helptext,encoding='utf-8')
print('Prepared source-integration checks, captures and simplified settings help.')

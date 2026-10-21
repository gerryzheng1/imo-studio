from pathlib import Path
p=Path(__file__).with_name('app_help.js');s=p.read_text(encoding='utf-8')
replacements={
 '在底部“文件”或“资料”中“常用资料”填写船舶档案、船员档案':'点击底部“资料”，填写船舶档案、船员档案',
 '疫苗在底部“文件”或“资料”中的对应文件中维护':'疫苗在底部“文件”→“疫苗有效日期”中维护',
 '在底部“文件”或“资料”中直接打开对应文件补齐资料':'点击底部“文件”，打开对应文件补齐资料',
 '上方横向靠港计划切换港口，底部“文件”或“资料”中直接选择本港文件':'顶部“靠港计划”切换港口，底部“文件”选择本港申报文件',
 '在底部“文件”或“资料”中打开“靠港资料”':'点击底部“航次”打开靠港资料',
 '底部“文件”或“资料”中“本次港口清单”':'底部“文件”→“本次港口清单”',
 '底部“文件”或“资料”中直接打开进港名单、离港名单、人员变动、个人物品':'点击底部“文件”，打开进港名单、离港名单、人员变动或个人物品',
 '表格底部“文件”或“资料”中的行':'表格左侧的行',
 '总设置先显示外观和保存':'右上角齿轮打开“总设置”，先显示外观和保存',
 '点击上方“添加港口”':'点击顶部“靠港计划”中的“添加港口”',
}
for a,b in replacements.items():s=s.replace(a,b)
s=s.replace('底部“保存工程”保存整个工作台，','文件面板支持搜索，Ctrl / Command + K 可直接打开，Esc 关闭；也可点击当前文件标题切换文件。底部“保存工程”保存整个工作台，')
p.write_text(s,encoding='utf-8')
p=Path(__file__).with_name('verify_liquid_reset_navigation.mjs');s=p.read_text(encoding='utf-8').replace('const revision=await p.evaluate(()=>IMOApp.state?0:0);','const beforeFeedback=await p.evaluate(()=>revision);').replace("pass(channel+': specular and press feedback respond to interaction');","assert.equal(await p.evaluate(()=>revision),beforeFeedback);pass(channel+': specular and press feedback respond without changing saved data');")
p.write_text(s,encoding='utf-8')
print('Corrected active instructions to the precise new navigation paths')

from pathlib import Path
P=Path(__file__).parent
f=P/'project_storage.js';s=f.read_text(encoding='utf-8')
s=s.replace("const packed=packedProject(),text=JSON.stringify(packed);", "const savedRevision=revision,packed=packedProject(),text=JSON.stringify(packed);")
s=s.replace("}lastSavedRevision=revision;lastSavedTime=Date.now();if(!quiet)","}lastSavedRevision=savedRevision;lastSavedTime=Date.now();if(!quiet)")
s=s.replace("+'（历史最多 '+projectLimit()+' 条）'", "+'（历史最多 '+projectLimit()+' 条）'+(revision!==savedRevision?'；后续修改尚未保存':'' )")
f.write_text(s,encoding='utf-8')
f=P/'engine.js';s=f.read_text(encoding='utf-8')
s=s.replace("async function runGenerate(id=null){\n const checks=", "async function runGenerate(id=null){\n const startRevision=revision;\n const checks=")
s=s.replace("const out=await generateWorkbook(key);generated.set(key,out);", "const out=await generateWorkbook(key);if(revision!==startRevision){generated.clear();throw Error('生成期间资料发生修改，已停止下载。请重新检查并生成。')}generated.set(key,out);")
s=s.replace("const data=await zip.generateAsync({type:'uint8array',compression:'STORE'});const v=state.voyage", "const data=await zip.generateAsync({type:'uint8array',compression:'STORE'});if(revision!==startRevision){generated.clear();throw Error('打包期间资料发生修改，请重新生成。')}const v=state.voyage")
f.write_text(s,encoding='utf-8')

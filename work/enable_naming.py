from pathlib import Path
P=Path(__file__).parent
p=P/'core.js';s=p.read_text(encoding='utf-8').replace('function blankState(){',(P/'naming_core.js').read_text(encoding='utf-8')+'\nfunction blankState(){');p.write_text(s,encoding='utf-8')
p=P/'settings.js';s=p.read_text(encoding='utf-8').replace("zipPattern:'IMO_{船名}_{港口}_{日期}'", "projectPattern:'{保存日期}_{保存时间}_{毫秒}_{靠港港口}',zipPattern:'IMO_{船名}_{港口}_{日期}'");a="if(typeof s.zipPattern!=='string'||!s.zipPattern.trim()||s.zipPattern.length>120)throw Error('ZIP 文件名规则须为 1–120 字');";assert a in s;s=s.replace(a,"validateNamePattern(s.zipPattern,'ZIP 命名规则');validateNamePattern(s.projectPattern,'工程命名规则');");a=s.index('<label><span>整包 ZIP 命名规则</span>');b=s.index('<p class="hint">模板原有字号',a);s=s[:a]+'<div id="namingInlineSlot"></div>'+s[b:];p.write_text(s,encoding='utf-8')
p=P/'project_storage.js';s=p.read_text(encoding='utf-8')
s=s.replace("if(handle.kind!=='file'||!HISTORY_RE.test(name))continue", "if(handle.kind!=='file'||!isProjectFileName(name))continue")
s=s.replace("if(p.kind==='IMO-PROJECT'&&p.schema===1)records.push({name,size:f.size,modified:new Date(f.lastModified).toISOString()})", "if(p.kind==='IMO-PROJECT'&&p.schema===1&&p.managedSnapshot!==false&&(HISTORY_RE.test(name)||p.managedBy==='IMO-GENERATOR'&&p.managedSnapshot===true))records.push({name,size:f.size,modified:new Date(f.lastModified).toISOString(),savedAt:Number.isFinite(Date.parse(p.savedAt))?p.savedAt:new Date(f.lastModified).toISOString()})")
s=s.replace("return records.sort((a,b)=>b.name.localeCompare(a.name))", "return records.sort((a,b)=>Date.parse(b.savedAt)-Date.parse(a.savedAt)||b.name.localeCompare(a.name))")
s=s.replace("const savedRevision=revision,packed=packedProject(),text=JSON.stringify(packed);", "const savedRevision=revision,packed=packedProject();packed.managedBy='IMO-GENERATOR';packed.managedSnapshot=!as;packed.suggestedName=projectSnapshotName();const text=JSON.stringify(packed);")
s=s.replace("suggestedName:projectTimestamp()+'.imoproject.json'", "suggestedName:packed.suggestedName")
s=s.replace("const stamp=projectTimestamp();let name=stamp+'.imoproject.json',n=1;", "const stamp=packed.suggestedName.replace(/\\.imoproject\\.json$/i,'');let name=stamp+'.imoproject.json',n=1;")
s=s.replace("HISTORY_RE.test(r.name))await dir.removeEntry", "isProjectFileName(r.name))await dir.removeEntry")
s=s.replace("if(!HISTORY_RE.test(name))throw Error('工程记录名称无效')", "if(!isProjectFileName(name))throw Error('工程记录名称无效')")
s=s.replace('按日期时间命名，历史最多','默认按日期时间和靠港港口命名，可在总设置自定义。历史最多').replace('本工具的日期时间工程记录','本工具的受管工程记录')
p.write_text(s,encoding='utf-8')
p=P/'LocalLauncher.cs';s=p.read_text(encoding='utf-8')
def rep(a,b):
 global s
 assert a in s,a[:85]
 s=s.replace(a,b)
rep('Where(f=>ManagedName.IsMatch(f.Name)&&IsProject(f.FullName)).OrderByDescending(f=>f.Name,StringComparer.Ordinal)', 'Where(f=>IsManagedRecord(f.FullName)).OrderByDescending(f=>RecordTime(f.FullName)).ThenByDescending(f=>f.Name,StringComparer.Ordinal)')
rep(' static string Latest(){', ''' static bool IsManagedRecord(string path){try{if(!SafeProjectName(Path.GetFileName(path))||!IsProject(path))return false;var p=Parse(File.ReadAllText(path,Utf8));if(p.ContainsKey("managedSnapshot")&&Str(p,"managedSnapshot").ToLowerInvariant()=="false")return false;return ManagedName.IsMatch(Path.GetFileName(path))||(Str(p,"managedBy")=="IMO-GENERATOR"&&Str(p,"managedSnapshot").ToLowerInvariant()=="true");}catch{return false;}}
 static DateTime RecordTime(string path){try{var p=Parse(File.ReadAllText(path,Utf8));DateTime date;if(DateTime.TryParse(Str(p,"savedAt"),null,System.Globalization.DateTimeStyles.RoundtripKind,out date))return date.ToUniversalTime();}catch{}return File.GetLastWriteTimeUtc(path);}
 static bool SafeProjectName(string name){return !string.IsNullOrEmpty(name)&&name.Length<=180&&name.EndsWith(".imoproject.json",StringComparison.OrdinalIgnoreCase)&&Path.GetFileName(name)==name&&name.IndexOfAny(Path.GetInvalidFileNameChars())<0&&!Regex.IsMatch(name,@"^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\\.|$)",RegexOptions.IgnoreCase);}
 static string SuggestedName(Dictionary<string,object> data){string name=Str(data,"suggestedName");return SafeProjectName(name)?name:DateTime.Now.ToString("yyyyMMdd_HHmmss_fff")+".imoproject.json";}
 static string Latest(){''')
rep('if(!ManagedName.IsMatch(name??""))throw new Exception("工程记录名称无效")','if(!SafeProjectName(name))throw new Exception("工程记录名称无效")')
rep('if(IsProject(checkedPath))File.Delete(checkedPath)', 'if(IsManagedRecord(checkedPath))File.Delete(checkedPath)')
rep('string stamp=DateTime.Now.ToString("yyyyMMdd_HHmmss_fff"),name=stamp+".imoproject.json";', 'string originalName=SuggestedName(data),stamp=originalName.Substring(0,originalName.Length-".imoproject.json".Length),name=originalName;')
rep('AtomicWrite(path,project);LastProject=path;', 'data["managedBy"]="IMO-GENERATOR";data["managedSnapshot"]=true;data["savedAt"]=DateTime.UtcNow.ToString("o");AtomicWrite(path,Json(data));LastProject=path;')
rep('static object SaveAs(string project,int keep){string selected=', 'static object SaveAs(string project,int keep){var draft=Parse(project);string selected=')
rep('FileName=DateTime.Now.ToString("yyyyMMdd_HHmmss_fff")+".imoproject.json"', 'FileName=SuggestedName(draft)')
rep('AtomicWrite(selected,project);LastProject=', 'data["managedBy"]="IMO-GENERATOR";data["managedSnapshot"]=false;AtomicWrite(selected,Json(data));LastProject=')
rep('&&ManagedName.IsMatch(Path.GetFileName(LastProject)))Prune(keep,LastProject)', '&&IsManagedRecord(LastProject))Prune(keep,LastProject)')
p.write_text(s,encoding='utf-8')
p=P/'app.html';s=p.read_text(encoding='utf-8').replace('<script>__ROUTE_HISTORY__</script>','<script>__ROUTE_HISTORY__</script>\n<script>__NAMING__</script>');p.write_text(s,encoding='utf-8')
p=P/'build.py';s=p.read_text(encoding='utf-8').replace("('ROUTE_HISTORY','route_history.js')", "('ROUTE_HISTORY','route_history.js'),('NAMING','naming.js')");p.write_text(s,encoding='utf-8')
print('Custom project and ZIP naming enabled, including managed-file retention and legacy names')

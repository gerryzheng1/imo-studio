from pathlib import Path
P=Path(__file__).parent;p=P/'LocalLauncher.cs';s=p.read_text(encoding='utf-8')
def rep(a,b):
 global s
 assert a in s,a[:90]
 s=s.replace(a,b)
rep('static int Port=39471;', '''static string LifecycleMode="follow";static readonly object ClientGate=new object();static readonly Dictionary<string,DateTime> Clients=new Dictionary<string,DateTime>();static DateTime LastClientSeen=DateTime.UtcNow,LastTick=DateTime.UtcNow;static bool HadClient=false;static int CloseGraceMs=8000,StaleClientMs=180000;static System.Windows.Forms.Timer LifecycleTimer;static ToolStripMenuItem FollowItem,ResidentItem;
 static int Port=39471;''')
rep('LastProject=Str(settings,"lastProject");}', 'LastProject=Str(settings,"lastProject");if(Str(settings,"lifecycleMode")=="resident")LifecycleMode="resident";}')
rep('byte[] secret=new byte[32];', '''if(Headless){int value;if(int.TryParse(Arg(args,"--lifecycle-close-ms"),out value)&&value>=300&&value<=60000)CloseGraceMs=value;if(int.TryParse(Arg(args,"--lifecycle-stale-ms"),out value)&&value>=1000&&value<=600000)StaleClientMs=value;}
   byte[] secret=new byte[32];''')
rep('menu.Items.Add("退出生成器",null,', '''var behavior=new ToolStripMenuItem("网页关闭后的运行方式");FollowItem=new ToolStripMenuItem("关闭所有生成器网页后退出");ResidentItem=new ToolStripMenuItem("常驻托盘");FollowItem.Checked=LifecycleMode=="follow";ResidentItem.Checked=LifecycleMode=="resident";FollowItem.Click+=(s,e)=>SetLifecycle("follow");ResidentItem.Click+=(s,e)=>SetLifecycle("resident");behavior.DropDownItems.Add(FollowItem);behavior.DropDownItems.Add(ResidentItem);menu.Items.Add(behavior);menu.Items.Add("退出生成器",null,''')
rep('   Application.Run();','''   LifecycleTimer=new System.Windows.Forms.Timer{Interval=1000};LifecycleTimer.Tick+=(s,e)=>CheckLifecycle();LifecycleTimer.Start();
   Application.Run();''')
rep('finally{Running=false;', 'finally{if(LifecycleTimer!=null)LifecycleTimer.Dispose();Running=false;')
rep('new{saveDirectory=SaveDir,lastProject=LastProject}', 'new{saveDirectory=SaveDir,lastProject=LastProject,lifecycleMode=LifecycleMode}')
rep('latestPath=latest,notice=StartupNotice,records=', 'latestPath=latest,notice=StartupNotice,lifecycleMode=LifecycleMode,records=')
rep(' static string SafeRecord(', ''' static void SetLifecycle(string mode){if(mode!="follow"&&mode!="resident")throw new Exception("运行方式无效");lock(FileGate){string previous=LifecycleMode;try{LifecycleMode=mode;Persist();}catch{LifecycleMode=previous;throw;}}if(FollowItem!=null)FollowItem.Checked=mode=="follow";if(ResidentItem!=null)ResidentItem.Checked=mode=="resident";lock(ClientGate){LastClientSeen=DateTime.UtcNow;}}
 static object ClientPing(string body,bool close){var data=Parse(body);string id=Str(data,"id");if(!Regex.IsMatch(id,@"^[A-Za-z0-9_-]{8,100}$"))throw new Exception("网页标识无效");lock(ClientGate){HadClient=true;LastClientSeen=DateTime.UtcNow;if(close)Clients.Remove(id);else Clients[id]=DateTime.UtcNow;}return new{mode=LifecycleMode,closeGraceMs=CloseGraceMs};}
 static void CheckLifecycle(){var now=DateTime.UtcNow;lock(ClientGate){if((now-LastTick).TotalSeconds>30){foreach(var key in Clients.Keys.ToArray())Clients[key]=now;LastClientSeen=now;}LastTick=now;if(LifecycleMode!="follow")return;foreach(var key in Clients.Where(p=>(now-p.Value).TotalMilliseconds>StaleClientMs).Select(p=>p.Key).ToArray())Clients.Remove(key);if(Clients.Count>0)return;double idle=(now-LastClientSeen).TotalMilliseconds;if((HadClient&&idle<CloseGraceMs)||(!HadClient&&idle<StaleClientMs))return;}if(!Monitor.TryEnter(FileGate))return;Monitor.Exit(FileGate);Application.ExitThread();}
 static string SafeRecord(''')
rep('else if(path=="/api/save"&&method=="POST")', '''else if(path=="/api/client-ping"&&method=="POST")response=ClientPing(text,false);
    else if(path=="/api/client-close"&&method=="POST")response=ClientPing(text,true);
    else if(path=="/api/lifecycle"&&method=="POST"){string mode=Str(Parse(text),"mode");response=OnUI(()=>{SetLifecycle(mode);return new{mode=LifecycleMode};});}
    else if(path=="/api/save"&&method=="POST")''')
p.write_text(s,encoding='utf-8')
p=P/'project_storage.js';s=p.read_text(encoding='utf-8').replace("notice:s.notice||''}","notice:s.notice||'',lifecycleMode:s.lifecycleMode||'follow'}");p.write_text(s,encoding='utf-8')
p=P/'app.html';s=p.read_text(encoding='utf-8').replace('<script>__HELP__</script>','<script>__HELP__</script>\n<script>__LIFECYCLE__</script>\n<script>__STORES_ARCHIVE__</script>');s=s.replace('<input id="uiSettingsFile"','<input type="file" id="storeArchiveFile" accept=".json,.imostores.json" hidden>\n<input id="uiSettingsFile"');p.write_text(s,encoding='utf-8')
p=P/'build.py';s=p.read_text(encoding='utf-8').replace("('HELP','help.js')", "('HELP','help.js'),('LIFECYCLE','lifecycle.js'),('STORES_ARCHIVE','stores_archive.js')");p.write_text(s,encoding='utf-8')
print('Native lifecycle wiring ready')

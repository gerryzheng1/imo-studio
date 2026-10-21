using System;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Diagnostics;
using System.Reflection;
using System.Security.Cryptography;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using System.Drawing;

// Windows/.NET Framework local launcher. Listens only on loopback; no external service.
internal static class LocalLauncher {
 static string Root, SaveDir, LastProject="", Token, SessionPath, SettingsPath, TestFolder="", TestSaveAs="", StartupNotice="";
 static string LifecycleMode="follow";static readonly object ClientGate=new object();static readonly Dictionary<string,DateTime> Clients=new Dictionary<string,DateTime>();static DateTime LastClientSeen=DateTime.UtcNow,LastTick=DateTime.UtcNow;static bool HadClient=false;static int CloseGraceMs=8000,StaleClientMs=180000;static System.Windows.Forms.Timer LifecycleTimer;static ToolStripMenuItem FollowItem,ResidentItem;
 static int Port=39471;static bool Running=true,Headless=false;static TcpListener Listener;static Control Dispatcher;static NotifyIcon Tray;static Mutex Instance;
 static readonly object FileGate=new object();static readonly UTF8Encoding Utf8=new UTF8Encoding(false);
 static readonly Regex ManagedName=new Regex(@"^\d{8}_\d{6}_\d{3}(?:_\d{2,4})?\.imoproject\.json$",RegexOptions.CultureInvariant);
 static JavaScriptSerializer Serializer(){return new JavaScriptSerializer{MaxJsonLength=67108864,RecursionLimit=120};}
 static string Json(object value){return Serializer().Serialize(value);}
 static Dictionary<string,object> Parse(string value){return Serializer().DeserializeObject(value) as Dictionary<string,object>;}
 static string Str(Dictionary<string,object> d,string key){return d!=null&&d.ContainsKey(key)?Convert.ToString(d[key]):"";}
 static string Arg(string[] args,string key){int i=Array.IndexOf(args,key);return i>=0&&i+1<args.Length?args[i+1]:"";}
 static string DefaultDir{get{return Path.Combine(Root,"保存工程");}}
 [STAThread] static void Main(string[] args){
  Application.EnableVisualStyles();Application.SetCompatibleTextRenderingDefault(false);
  try{
   Root=Path.GetFullPath(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location));Headless=args.Contains("--headless");
   if(Headless&&Arg(args,"--test-root")!="")Root=Path.GetFullPath(Arg(args,"--test-root"));
   if(Headless&&Arg(args,"--port")!="")Port=int.Parse(Arg(args,"--port"));
   SessionPath=Path.Combine(Root,".imo-local-session.json");SettingsPath=Path.Combine(Root,"本地设置.json");SaveDir=DefaultDir;
   string mutexId;using(var h=SHA256.Create())mutexId=BitConverter.ToString(h.ComputeHash(Utf8.GetBytes(Root.ToUpperInvariant()))).Replace("-","").Substring(0,24);
   bool created;Instance=new Mutex(true,"Local\\IMOGenerator-"+mutexId,out created);
   if(!created){if(!Headless&&File.Exists(SessionPath)){var previous=Parse(File.ReadAllText(SessionPath,Utf8));int p;string token=Str(previous,"token");if(int.TryParse(Str(previous,"port"),out p)&&p>1023&&p<65536&&Regex.IsMatch(token,@"^[a-f0-9]{64}$"))Process.Start("http://127.0.0.1:"+p+"/#token="+token);}return;}
   if(!Headless&&!File.Exists(Path.Combine(Root,"打开生成器.html")))throw new Exception("请先完整解压文件包，再运行启动器。请保留 assets 文件夹。");
   if(File.Exists(SettingsPath)){var settings=Parse(File.ReadAllText(SettingsPath,Utf8));if(Str(settings,"saveDirectory")!="")SaveDir=Path.GetFullPath(Str(settings,"saveDirectory"));LastProject=Str(settings,"lastProject");if(Str(settings,"lifecycleMode")=="resident")LifecycleMode="resident";}
   try{Directory.CreateDirectory(SaveDir);}catch{SaveDir=DefaultDir;Directory.CreateDirectory(SaveDir);LastProject="";StartupNotice="原自定义目录当前不可用，已使用解压目录旁的保存工程文件夹。";}
   if(Headless){if(Arg(args,"--dialog-test-dir")!="")TestFolder=WithinRoot(Arg(args,"--dialog-test-dir"));if(Arg(args,"--dialog-test-file")!="")TestSaveAs=WithinRoot(Arg(args,"--dialog-test-file"));}
   if(Headless){int value;if(int.TryParse(Arg(args,"--lifecycle-close-ms"),out value)&&value>=300&&value<=60000)CloseGraceMs=value;if(int.TryParse(Arg(args,"--lifecycle-stale-ms"),out value)&&value>=1000&&value<=600000)StaleClientMs=value;}
   byte[] secret=new byte[32];using(var rng=RandomNumberGenerator.Create())rng.GetBytes(secret);Token=BitConverter.ToString(secret).Replace("-","").ToLowerInvariant();
   for(int i=0;;i++){try{Listener=new TcpListener(IPAddress.Loopback,Port+i);Listener.Start();Port+=i;break;}catch(SocketException){if(i>=50)throw;}}
   Dispatcher=new Control();Dispatcher.CreateControl();var handle=Dispatcher.Handle;
   AtomicWrite(SessionPath,Json(new{url=Url(),port=Port,token=Token,pid=Process.GetCurrentProcess().Id,root=Root}));
   var thread=new Thread(AcceptLoop);thread.IsBackground=true;thread.Start();
   if(!Headless){Tray=new NotifyIcon{Icon=SystemIcons.Application,Text="IMO 文件包生成器 · 本机离线运行",Visible=true};var menu=new ContextMenuStrip();menu.Items.Add("打开生成器",null,(s,e)=>Process.Start(Url()));menu.Items.Add("选择工程保存文件夹",null,(s,e)=>{var folder=SelectFolder();if(folder!="")SetFolder(folder);});var behavior=new ToolStripMenuItem("网页关闭后的运行方式");FollowItem=new ToolStripMenuItem("关闭所有生成器网页后退出");ResidentItem=new ToolStripMenuItem("常驻托盘");FollowItem.Checked=LifecycleMode=="follow";ResidentItem.Checked=LifecycleMode=="resident";FollowItem.Click+=(s,e)=>SetLifecycle("follow");ResidentItem.Click+=(s,e)=>SetLifecycle("resident");behavior.DropDownItems.Add(FollowItem);behavior.DropDownItems.Add(ResidentItem);menu.Items.Add(behavior);menu.Items.Add("退出生成器",null,(s,e)=>Application.ExitThread());Tray.ContextMenuStrip=menu;Tray.DoubleClick+=(s,e)=>Process.Start(Url());Process.Start(Url());}
   LifecycleTimer=new System.Windows.Forms.Timer{Interval=1000};LifecycleTimer.Tick+=(s,e)=>CheckLifecycle();LifecycleTimer.Start();
   Application.Run();
  }catch(Exception ex){if(Headless)try{File.WriteAllText(Path.Combine(Root,"launcher-error.txt"),ex.ToString(),Utf8);}catch{}else MessageBox.Show(ex.Message,"IMO 启动失败",MessageBoxButtons.OK,MessageBoxIcon.Error);}
  finally{if(LifecycleTimer!=null)LifecycleTimer.Dispose();Running=false;if(Listener!=null)Listener.Stop();if(Tray!=null){Tray.Visible=false;Tray.Dispose();}try{if(File.Exists(SessionPath)&&Str(Parse(File.ReadAllText(SessionPath,Utf8)),"token")==Token)File.Delete(SessionPath);}catch{}if(Instance!=null)Instance.Dispose();}
 }
 static string Url(){return "http://127.0.0.1:"+Port+"/#token="+Token;}
 static string WithinRoot(string path){string full=Path.GetFullPath(Path.IsPathRooted(path)?path:Path.Combine(Root,path));if(!full.StartsWith(Root.TrimEnd(Path.DirectorySeparatorChar)+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase))throw new Exception("测试路径须在测试目录内");return full;}
 static void AtomicWrite(string path,string text){string dir=Path.GetDirectoryName(Path.GetFullPath(path));Directory.CreateDirectory(dir);string temp=Path.Combine(dir,".imo-write-"+Guid.NewGuid().ToString("N")+".tmp");try{using(var fs=new FileStream(temp,FileMode.CreateNew,FileAccess.Write,FileShare.None)){var bytes=Utf8.GetBytes(text);fs.Write(bytes,0,bytes.Length);fs.Flush(true);}if(File.Exists(path))File.Replace(temp,path,null);else File.Move(temp,path);}finally{if(File.Exists(temp))File.Delete(temp);}}
 static void Persist(){AtomicWrite(SettingsPath,Json(new{saveDirectory=SaveDir,lastProject=LastProject,lifecycleMode=LifecycleMode}));}
 static bool IsProject(string path){try{if(new FileInfo(path).Length>62914560)return false;var p=Parse(File.ReadAllText(path,Utf8));return Str(p,"kind")=="IMO-PROJECT"&&Str(p,"schema")=="1"&&p.ContainsKey("state");}catch{return false;}}
 static List<FileInfo> Records(){if(!Directory.Exists(SaveDir))return new List<FileInfo>();return new DirectoryInfo(SaveDir).GetFiles("*.imoproject.json").Where(f=>IsManagedRecord(f.FullName)).OrderByDescending(f=>RecordTime(f.FullName)).ThenByDescending(f=>f.Name,StringComparer.Ordinal).ToList();}
 static bool IsManagedRecord(string path){try{if(!SafeProjectName(Path.GetFileName(path))||!IsProject(path))return false;var p=Parse(File.ReadAllText(path,Utf8));if(p.ContainsKey("managedSnapshot")&&Str(p,"managedSnapshot").ToLowerInvariant()=="false")return false;return ManagedName.IsMatch(Path.GetFileName(path))||(Str(p,"managedBy")=="IMO-GENERATOR"&&Str(p,"managedSnapshot").ToLowerInvariant()=="true");}catch{return false;}}
 static DateTime RecordTime(string path){try{var p=Parse(File.ReadAllText(path,Utf8));DateTime date;if(DateTime.TryParse(Str(p,"savedAt"),null,System.Globalization.DateTimeStyles.RoundtripKind,out date))return date.ToUniversalTime();}catch{}return File.GetLastWriteTimeUtc(path);}
 static bool SafeProjectName(string name){return !string.IsNullOrEmpty(name)&&name.Length<=180&&name.EndsWith(".imoproject.json",StringComparison.OrdinalIgnoreCase)&&Path.GetFileName(name)==name&&name.IndexOfAny(Path.GetInvalidFileNameChars())<0&&!Regex.IsMatch(name,@"^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)",RegexOptions.IgnoreCase);}
 static string SuggestedName(Dictionary<string,object> data){string name=Str(data,"suggestedName");return SafeProjectName(name)?name:DateTime.Now.ToString("yyyyMMdd_HHmmss_fff")+".imoproject.json";}
 static string Latest(){if(LastProject!=""&&File.Exists(LastProject)&&IsProject(LastProject))return LastProject;var record=Records().FirstOrDefault();return record==null?"":record.FullName;}
 static object Status(){lock(FileGate){string latest=Latest();return new{saveDirectory=SaveDir,defaultDirectory=DefaultDir,latestPath=latest,notice=StartupNotice,lifecycleMode=LifecycleMode,records=Records().Select(f=>new{name=f.Name,size=f.Length,modified=f.LastWriteTimeUtc.ToString("o")}).ToArray()};}}
 static void SetLifecycle(string mode){if(mode!="follow"&&mode!="resident")throw new Exception("运行方式无效");lock(FileGate){string previous=LifecycleMode;try{LifecycleMode=mode;Persist();}catch{LifecycleMode=previous;throw;}}if(FollowItem!=null)FollowItem.Checked=mode=="follow";if(ResidentItem!=null)ResidentItem.Checked=mode=="resident";lock(ClientGate){LastClientSeen=DateTime.UtcNow;}}
 static object ClientPing(string body,bool close){var data=Parse(body);string id=Str(data,"id");if(!Regex.IsMatch(id,@"^[A-Za-z0-9_-]{8,100}$"))throw new Exception("网页标识无效");lock(ClientGate){HadClient=true;LastClientSeen=DateTime.UtcNow;if(close)Clients.Remove(id);else Clients[id]=DateTime.UtcNow;}return new{mode=LifecycleMode,closeGraceMs=CloseGraceMs};}
 static void CheckLifecycle(){var now=DateTime.UtcNow;lock(ClientGate){if((now-LastTick).TotalSeconds>30){foreach(var key in Clients.Keys.ToArray())Clients[key]=now;LastClientSeen=now;}LastTick=now;if(LifecycleMode!="follow")return;foreach(var key in Clients.Where(p=>(now-p.Value).TotalMilliseconds>StaleClientMs).Select(p=>p.Key).ToArray())Clients.Remove(key);if(Clients.Count>0)return;double idle=(now-LastClientSeen).TotalMilliseconds;if((HadClient&&idle<CloseGraceMs)||(!HadClient&&idle<StaleClientMs))return;}if(!Monitor.TryEnter(FileGate))return;Monitor.Exit(FileGate);Application.ExitThread();}
 static string SafeRecord(string name){if(!SafeProjectName(name))throw new Exception("工程记录名称无效");string path=Path.GetFullPath(Path.Combine(SaveDir,name));if(!string.Equals(Path.GetDirectoryName(path).TrimEnd('\\'),Path.GetFullPath(SaveDir).TrimEnd('\\'),StringComparison.OrdinalIgnoreCase))throw new Exception("工程路径超出保存目录");return path;}
 static void Prune(int count,string keep){count=Math.Max(1,Math.Min(10,count));var records=Records();var retained=new HashSet<string>(StringComparer.OrdinalIgnoreCase);retained.Add(keep);foreach(var f in records){if(retained.Count>=count)break;retained.Add(f.FullName);}foreach(var f in records)if(!retained.Contains(f.FullName)){string checkedPath=SafeRecord(f.Name);if(IsManagedRecord(checkedPath))File.Delete(checkedPath);}}
 static object Save(string project,int keep){if(Utf8.GetByteCount(project)>62914560)throw new Exception("工程超过 60MB，请减少模板体积或导出不含模板的工程");var data=Parse(project);if(Str(data,"kind")!="IMO-PROJECT"||Str(data,"schema")!="1"||!data.ContainsKey("state"))throw new Exception("工程格式无效");lock(FileGate){Directory.CreateDirectory(SaveDir);string originalName=SuggestedName(data),stamp=originalName.Substring(0,originalName.Length-".imoproject.json".Length),name=originalName;int n=1;while(File.Exists(SafeRecord(name)))name=stamp+"_"+(n++).ToString("00")+".imoproject.json";string path=SafeRecord(name);data["managedBy"]="IMO-GENERATOR";data["managedSnapshot"]=true;data["savedAt"]=DateTime.UtcNow.ToString("o");AtomicWrite(path,Json(data));LastProject=path;Persist();Prune(keep,path);return new{saved=true,name=name,path=path,history=Status()};}}
 static object OnUI(Func<object> action){return Dispatcher.Invoke(action);}
 static string SelectFolder(){if(Headless)return TestFolder;using(var owner=new Form{TopMost=true,ShowInTaskbar=false,Width=1,Height=1,Opacity=0})using(var d=new FolderBrowserDialog{Description="选择工程保存文件夹（日期时间命名，最多保留 10 条本工具记录）",ShowNewFolderButton=true,SelectedPath=SaveDir}){owner.Show();return d.ShowDialog(owner)==DialogResult.OK?d.SelectedPath:"";}}
 static void SetFolder(string folder){lock(FileGate){string next=Path.GetFullPath(folder);Directory.CreateDirectory(next);string previous=SaveDir,last=LastProject;try{SaveDir=next;LastProject="";Persist();StartupNotice="";}catch{SaveDir=previous;LastProject=last;throw;}}}
 static object ChooseFolder(){string folder=Convert.ToString(OnUI(()=>SelectFolder()));if(folder=="")return new{cancelled=true};SetFolder(folder);return Status();}
 static object SaveAs(string project,int keep){var draft=Parse(project);string selected=Convert.ToString(OnUI(()=>{if(Headless)return TestSaveAs;using(var owner=new Form{TopMost=true,ShowInTaskbar=false,Width=1,Height=1,Opacity=0})using(var d=new SaveFileDialog{Title="工程另存为",InitialDirectory=SaveDir,FileName=SuggestedName(draft),Filter="IMO 工程 JSON|*.json",DefaultExt="json",AddExtension=true,OverwritePrompt=true}){owner.Show();return d.ShowDialog(owner)==DialogResult.OK?d.FileName:"";}}));if(selected=="")return new{cancelled=true};var data=Parse(project);if(Str(data,"kind")!="IMO-PROJECT"||Str(data,"schema")!="1")throw new Exception("工程格式无效");lock(FileGate){data["managedBy"]="IMO-GENERATOR";data["managedSnapshot"]=false;AtomicWrite(selected,Json(data));LastProject=Path.GetFullPath(selected);Persist();if(string.Equals(Path.GetDirectoryName(LastProject),SaveDir,StringComparison.OrdinalIgnoreCase)&&IsManagedRecord(LastProject))Prune(keep,LastProject);return new{saved=true,name=Path.GetFileName(selected),path=LastProject,history=Status()};}}
 static void AcceptLoop(){while(Running){try{var client=Listener.AcceptTcpClient();ThreadPool.QueueUserWorkItem(o=>Handle((TcpClient)o),client);}catch{if(Running)Thread.Sleep(50);}}}
 static string ReadLine(Stream stream){var data=new List<byte>();for(int n=0;n<16384;n++){int b=stream.ReadByte();if(b<0)break;if(b==10)break;if(b!=13)data.Add((byte)b);}if(data.Count>=16384)throw new Exception("请求头过长");return Encoding.ASCII.GetString(data.ToArray());}
 static void Respond(Stream stream,int status,byte[] data,string type){string header="HTTP/1.1 "+status+(status==200?" OK":" Error")+"\r\nContent-Type: "+type+"\r\nContent-Length: "+data.Length+"\r\nConnection: close\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nX-Frame-Options: DENY\r\nContent-Security-Policy: frame-ancestors 'none'\r\n\r\n";byte[] h=Encoding.ASCII.GetBytes(header);stream.Write(h,0,h.Length);stream.Write(data,0,data.Length);}
 static void Handle(TcpClient client){using(client){var stream=client.GetStream();stream.ReadTimeout=20000;stream.WriteTimeout=30000;try{var first=ReadLine(stream).Split(' ');if(first.Length<2)return;string method=first[0],target=first[1];var headers=new Dictionary<string,string>(StringComparer.OrdinalIgnoreCase);int size=0;for(;;){string line=ReadLine(stream);size+=line.Length;if(size>32768)throw new Exception("请求头过长");if(line=="")break;int colon=line.IndexOf(':');if(colon>0)headers[line.Substring(0,colon).Trim()]=line.Substring(colon+1).Trim();}string host=headers.ContainsKey("Host")?headers["Host"]:"";if(host!="127.0.0.1:"+Port){Respond(stream,403,Utf8.GetBytes("Forbidden"),"text/plain");return;}Uri uri=new Uri("http://127.0.0.1:"+Port+target);string path=Uri.UnescapeDataString(uri.AbsolutePath);
   if(path.StartsWith("/api/",StringComparison.Ordinal)){
    if(!headers.ContainsKey("X-IMO-Token")||headers["X-IMO-Token"]!=Token||(headers.ContainsKey("Origin")&&headers["Origin"]!="http://127.0.0.1:"+Port)){Respond(stream,403,Utf8.GetBytes("Forbidden"),"text/plain");return;}
    if(method!="GET"&&method!="POST")throw new Exception("请求方式无效");int length=headers.ContainsKey("Content-Length")?int.Parse(headers["Content-Length"]):0;if(length<0||length>67108864||headers.ContainsKey("Transfer-Encoding"))throw new Exception("工程数据过大或传输格式无效");byte[] body=new byte[length];int got=0;while(got<length){int n=stream.Read(body,got,length-got);if(n==0)throw new Exception("工程上传不完整");got+=n;}string text=Utf8.GetString(body);int keep=10;if(headers.ContainsKey("X-IMO-Keep"))int.TryParse(headers["X-IMO-Keep"],out keep);keep=Math.Max(1,Math.Min(10,keep));object response;
    if(path=="/api/status"&&method=="GET")response=Status();
    else if(path=="/api/latest"&&method=="GET"){lock(FileGate){string file=Latest();if(file=="")response=new{empty=true};else{Respond(stream,200,File.ReadAllBytes(file),"application/json; charset=utf-8");return;}}}
    else if(path=="/api/project"&&method=="GET"){string name=System.Web.HttpUtility.ParseQueryString(uri.Query)["name"];lock(FileGate){string file=SafeRecord(name);if(!IsProject(file))throw new Exception("工程不存在或格式无效");Respond(stream,200,File.ReadAllBytes(file),"application/json; charset=utf-8");return;}}
    else if(path=="/api/client-ping"&&method=="POST")response=ClientPing(text,false);
    else if(path=="/api/client-close"&&method=="POST")response=ClientPing(text,true);
    else if(path=="/api/lifecycle"&&method=="POST"){string mode=Str(Parse(text),"mode");response=OnUI(()=>{SetLifecycle(mode);return new{mode=LifecycleMode};});}
    else if(path=="/api/save"&&method=="POST")response=Save(text,keep);
    else if(path=="/api/save-as"&&method=="POST")response=SaveAs(text,keep);
    else if(path=="/api/choose-folder"&&method=="POST")response=ChooseFolder();
    else if(path=="/api/default-folder"&&method=="POST"){SetFolder(DefaultDir);response=Status();}
    else if(path=="/api/quit"&&method=="POST"){response=new{closed=true};Dispatcher.BeginInvoke(new Action(()=>Application.ExitThread()));}
    else throw new Exception("不支持的本机操作");Respond(stream,200,Utf8.GetBytes(Json(response)),"application/json; charset=utf-8");return;
   }
   if(method!="GET")throw new Exception("请求方式无效");if(path=="/")path="/打开生成器.html";if(path=="/favicon.ico"){using(var m=new MemoryStream()){SystemIcons.Application.Save(m);Respond(stream,200,m.ToArray(),"image/x-icon");}return;}
   if(path!="/打开生成器.html"&&!path.StartsWith("/assets/",StringComparison.Ordinal))throw new Exception("此路径不可访问");string full=Path.GetFullPath(Path.Combine(Root,path.TrimStart('/').Replace('/',Path.DirectorySeparatorChar))),allowed=path=="/打开生成器.html"?Path.Combine(Root,"打开生成器.html"):Path.Combine(Root,"assets")+Path.DirectorySeparatorChar;if((path=="/打开生成器.html"?!string.Equals(full,allowed,StringComparison.OrdinalIgnoreCase):!full.StartsWith(allowed,StringComparison.OrdinalIgnoreCase))||!File.Exists(full))throw new Exception("页面资源不存在，请完整解压文件夹");string ext=Path.GetExtension(full).ToLowerInvariant(),type=ext==".html"?"text/html; charset=utf-8":ext==".js"?"text/javascript; charset=utf-8":ext==".css"?"text/css; charset=utf-8":"application/octet-stream";Respond(stream,200,File.ReadAllBytes(full),type);
  }catch(Exception ex){try{Respond(stream,400,Utf8.GetBytes(Json(new{error=ex.Message})),"application/json; charset=utf-8");}catch{}}}}
}

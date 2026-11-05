const CFG=window.GAME_CONFIG||{};
const $=(s,r=document)=>r.querySelector(s),app=$("#app");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const G={},S={me:null,clean:[],skew:0};
const COLORS=["#e11d48","#2563eb","#16a34a","#d97706","#9333ea","#0891b2","#db2777","#65a30d"];
const LV=["Dễ","Vừa","Khó"],MAILDOM="@avh-hocsinh.app";
let sb,UID;
const now=()=>Date.now()+S.skew;
const av=p=>p.avatar_url?`<img class="av" src="${esc(p.avatar_url)}" alt="">`:esc(p.avatar||"😀");
function cleanup(){S.clean.forEach(f=>{try{f()}catch(e){}});S.clean=[]}
function view(h){cleanup();app.innerHTML=h}
function jwt(t){try{return JSON.parse(atob(t.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")))}catch(e){return null}}
async function init(){
  if(!CFG.SUPABASE_URL||CFG.SUPABASE_URL.includes("YOUR-"))return app.innerHTML='<div class="card">⚙️ Chưa cấu hình config.js</div>';
  const h=new URLSearchParams(location.hash.slice(1));let at=h.get("at");
  if(location.hash)history.replaceState(null,"",location.pathname+location.search);
  try{if(at)sessionStorage.setItem("g_at",at);else at=sessionStorage.getItem("g_at")}catch(e){}
  const p=at&&jwt(at);
  if(p&&p.exp*1000>Date.now()){
    sb=supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY,{global:{headers:{Authorization:"Bearer "+at}},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    sb.realtime.setAuth(at);UID=p.sub;
  }else{
    sb=supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY);
    const {data:{session}}=await sb.auth.getSession();UID=session&&session.user.id;
  }
  if(!UID)return login();
  const {data:me}=await sb.from("profiles").select("*").eq("id",UID).maybeSingle();
  if(!me){try{sessionStorage.removeItem("g_at")}catch(e){}return login("Phiên đã hết hạn, hãy đăng nhập lại.")}
  S.me=me;
  const {data:t}=await sb.rpc("server_now");if(t)S.skew=t-Date.now();
  home();
}
function login(msg){
  view(`<h2>🎮 Trò chơi</h2><div class="card"><div class="mu" style="margin-bottom:8px">Đăng nhập bằng tài khoản của app chính (hoặc mở trò chơi từ nút 🎮 trong app).</div>
  <input id="lu" placeholder="Tên đăng nhập" autocapitalize="off"><input id="lp" type="password" placeholder="Mật khẩu"><div class="err" id="le">${esc(msg||"")}</div>
  <button style="width:100%" onclick="doLogin()">Đăng nhập</button></div>`);
}
async function doLogin(){
  const u=$("#lu").value.toLowerCase().replace(/[^a-z0-9_]/g,"");
  const {error}=await sb.auth.signInWithPassword({email:u+MAILDOM,password:$("#lp").value});
  if(error)return $("#le").textContent="Sai tên đăng nhập hoặc mật khẩu.";
  try{sessionStorage.removeItem("g_at")}catch(e){}init();
}
function home(){
  view(`<div class="top"><a href="${esc(CFG.APP_URL||"#")}">← Về app</a><span>${av(S.me)} ${esc(S.me.name)}</span></div><h2>🎮 Giải trí</h2>
  <div id="inv"></div>
  <button class="gc" onclick="G.find.menu()">🔢 Tìm số<small>Một mình · với máy · nhiều người · thách đấu nhà</small></button>
  <button class="gc" onclick="G.caro.menu()">⭕ Cờ caro<small>Với máy (3 cấp độ) · thách đấu bạn bè</small></button>
  <div class="card"><h3>Vào phòng bằng mã</h3><div class="row"><input id="jc" placeholder="Mã phòng" autocapitalize="characters" style="margin:0"><button onclick="joinCode($('#jc').value)" style="flex:none">Vào</button></div><div class="err" id="je"></div></div>`);
  loadInvites();
}
async function loadInvites(){
  const {data:mine}=await sb.from("room_players").select("room_id,status").eq("user_id",UID);
  if(!mine||!mine.length||!$("#inv"))return;
  const ids=mine.map(x=>x.room_id);
  const [a,b]=await Promise.all([sb.from("rooms").select("id,code,game,host,status,created_at").in("id",ids).neq("status","done"),sb.from("room_players").select("room_id,user_id,name").in("room_id",ids)]);
  const day=Date.now()-864e5,rs=(a.data||[]).filter(r=>new Date(r.created_at)>day);
  if(!$("#inv"))return;
  $("#inv").innerHTML=rs.map(r=>{const m=mine.find(x=>x.room_id===r.id),hn=(b.data||[]).find(p=>p.room_id===r.id&&p.user_id===r.host);const gn=r.game==="find"?"Tìm số":"Cờ caro";
    return m.status==="invited"?`<div class="card">💌 <b>${esc(hn?hn.name:"Bạn bè")}</b> mời bạn chơi <b>${gn}</b><div class="row" style="margin-top:8px"><button onclick="joinCode('${r.code}')">Tham gia</button><button class="g" onclick="declineRoom('${r.id}')">Từ chối</button></div></div>`
    :`<div class="card">▶️ Phòng ${gn} <b>${r.code}</b> đang mở<div class="row" style="margin-top:8px"><button onclick="openRoom('${r.id}')">Vào lại</button></div></div>`}).join("");
}
async function declineRoom(id){await sb.rpc("leave_room",{p_room:id});loadInvites()}
async function joinCode(c){
  const e=$("#je")||$("#me2");c=(c||"").trim();if(!c)return;
  const {data,error}=await sb.rpc("join_room",{p_code:c});
  if(error){if(e)e.textContent=error.message;else alert(error.message);return}
  openRoom(data);
}
async function mkRoom(game,mode,cfg){
  const {data,error}=await sb.rpc("create_room",{p_game:game,p_mode:mode,p_cfg:cfg||{}});
  if(error){alert(error.message);return null}return data;
}
async function leaveRoom(id){await sb.rpc("leave_room",{p_room:id});home()}
/* ---------- Phòng nhiều người ---------- */
function teamsOf(R){const t=[];R.players.filter(p=>p.status==="joined").forEach(p=>{let x=t.find(y=>y.team===p.team);if(!x){x={team:p.team,label:p.team_label,color:COLORS[t.length%8],members:[]};t.push(x)}x.members.push(p)});return t}
function colorOfUid(R,u){const p=R.players.find(q=>q.user_id===u),t=p&&teamsOf(R).find(x=>x.team===p.team);return t?t.color:"#888"}
async function openRoom(id){
  const R={id,room:null,players:[],sig:"",shell:""};
  view('<div id="rv"></div>');
  const fetchAll=async()=>{
    const [a,b]=await Promise.all([sb.from("rooms").select("*").eq("id",id).maybeSingle(),sb.from("room_players").select("*").eq("room_id",id).order("joined_at")]);
    if(a.error)return;
    if(!a.data){if(S.inRoom===id){S.inRoom=null;alert("Phòng đã đóng.");home()}return}
    const sig=JSON.stringify([a.data.state,a.data.status,b.data]);if(sig===R.sig)return;
    R.sig=sig;R.room=a.data;R.players=b.data||[];paintRoom(R);
  };
  S.inRoom=id;
  const ch=sb.channel("room"+id).on("postgres_changes",{event:"*",schema:"public",table:"rooms",filter:"id=eq."+id},fetchAll)
    .on("postgres_changes",{event:"*",schema:"public",table:"room_players",filter:"room_id=eq."+id},fetchAll).subscribe();
  const iv=setInterval(fetchAll,3000);
  S.clean.push(()=>{sb.removeChannel(ch);clearInterval(iv);if(R.ui&&R.ui.stop)R.ui.stop()});
  await fetchAll();
}
function paintRoom(R){
  const r=R.room;
  if(r.status==="waiting"){if(R.ui&&R.ui.stop)R.ui.stop();R.ui=null;return waitView(R)}
  G[r.game].room(R);
}
function waitView(R){
  const r=R.room,el=$("#rv"),host=r.host===UID,gn=r.game==="find"?"🔢 Tìm số":"⭕ Cờ caro";
  if(R.shell!=="wait"){R.shell="wait";
    el.innerHTML=`<div class="top"><a onclick="leaveRoom('${R.id}')">← Rời phòng</a><span>${gn}</span></div>
    <div class="card"><div class="mu">Mã phòng — gửi cho người cùng chơi</div><div class="code">${esc(r.code)}</div>
    <div class="mu">${r.mode==="house"?"Thách đấu nhà: mỗi nhà một màu. Phụ huynh và học sinh của nhà mình cùng vào bằng mã; nhà khác cũng nhập mã này để tham gia.":r.mode==="duel"?"Thách đấu 1 chọi 1.":"Mỗi người một màu."}</div></div>
    <div class="card"><h3>Người chơi</h3><div id="plist"></div></div>
    ${host?`<div class="card"><h3>Mời theo tên đăng nhập</h3><div class="row"><input id="iu" placeholder="Tên đăng nhập" autocapitalize="off" style="margin:0"><button style="flex:none" onclick="invite('${R.id}')">Mời</button></div><div class="err" id="ie"></div></div><button id="sbtn" style="width:100%" onclick="startRoom('${R.id}')">▶️ Bắt đầu</button>`:'<div class="card mu" style="text-align:center">Chờ chủ phòng bắt đầu…</div>'}`;
  }
  const j=R.players.filter(p=>p.status==="joined"),teams=teamsOf(R);
  $("#plist").innerHTML=R.players.map(p=>{const t=teams.find(x=>x.team===p.team);return `<div class="pl"><span class="dot" style="background:${p.status==="joined"&&t?t.color:"#bbb"}"></span>${av(p)} <b>${esc(p.name)}</b> <span class="mu">${r.cfg.teams?esc(p.team_label):""} ${p.user_id===r.host?"· chủ phòng":""} ${p.status==="invited"?"· đã mời, chờ vào":""}</span></div>`}).join("");
  const b=$("#sbtn");if(b){b.disabled=r.game==="caro"?j.length!==2:j.length<1;b.textContent=r.game==="caro"&&j.length!==2?"Chờ đủ 2 người…":"▶️ Bắt đầu"}
}
async function invite(id){const e=$("#ie");e.textContent="";const {error}=await sb.rpc("invite_user",{p_room:id,p_username:$("#iu").value});if(error)e.textContent=error.message;else{$("#iu").value="";e.style.color="var(--ok)";e.textContent="Đã gửi lời mời ✓"}}
async function startRoom(id){const {error}=await sb.rpc("room_start",{p_room:id});if(error)alert(error.message)}
    

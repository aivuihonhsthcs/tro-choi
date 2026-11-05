const CN=13,DIR=[[1,0],[0,1],[1,1],[1,-1]];
function five(b,n,i){const ch=b[i];if(!ch||ch==="."||b.length!==n*n)return null;const x=i%n,y=(i/n)|0;
  for(const[dx,dy]of DIR){const l=[i];for(const s of[1,-1])for(let k=1;k<5;k++){const X=x+dx*k*s,Y=y+dy*k*s;if(X<0||Y<0||X>=n||Y>=n||b[Y*n+X]!==ch)break;l.push(Y*n+X)}if(l.length>=5)return l}
  return null}
function pat(c,o){if(c>=5)return 1e5;if(c===4)return o===2?1e4:o===1?1e3:0;if(c===3)return o===2?1e3:o===1?100:0;if(c===2)return o===2?100:o===1?10:0;return o?2:0}
function sc(b,n,x,y,ch){let t=0;for(const[dx,dy]of DIR){let c=1,o=0;for(const s of[1,-1]){for(let k=1;;k++){const X=x+dx*k*s,Y=y+dy*k*s;if(X<0||Y<0||X>=n||Y>=n)break;const v=b[Y*n+X];if(v===ch)c++;else{if(v===".")o++;break}}}t+=pat(c,o)}return t}
function cands(b,n){const r=[];for(let i=0;i<n*n;i++){if(b[i]!==".")continue;const x=i%n,y=(i/n)|0;let near=false;
  for(let dy=-2;dy<=2&&!near;dy++)for(let dx=-2;dx<=2;dx++){const X=x+dx,Y=y+dy;if(X>=0&&Y>=0&&X<n&&Y<n&&b[Y*n+X]!=="."){near=true;break}}if(near)r.push(i)}return r}
/* Máy là 'O', người là 'X'. Dễ: hay đi sai; Vừa: công thủ cân bằng; Khó: nhìn trước 1 nước của đối thủ */
function aiMove(b,n,lv){
  const c=cands(b,n);if(!c.length)return(n*n)>>1;
  const dw=[.6,1,1.15][lv],R=Math.random;
  const s=c.map(i=>{const x=i%n,y=(i/n)|0;return{i,s:sc(b,n,x,y,"O")+dw*sc(b,n,x,y,"X")}}).sort((p,q)=>q.s-p.s);
  if(lv===0)return s[Math.floor(R()*Math.min(s.length,R()<.3?8:3))].i;
  if(lv===1)return s[R()<.2?Math.min(1,s.length-1):0].i;
  let best=s[0].i,bv=-1e12;
  for(const m of s.slice(0,8)){if(m.s>=1e5)return m.i;b[m.i]="O";let ob=0;
    for(const j of cands(b,n)){const x=j%n,y=(j/n)|0;ob=Math.max(ob,sc(b,n,x,y,"X")+.5*sc(b,n,x,y,"O"))}
    b[m.i]=".";const v=m.s-.9*ob;if(v>bv){bv=v;best=m.i}}
  return best}
function caroBoard(el,n,onTap){
  el.innerHTML=`<div class="cg" style="grid-template-columns:repeat(${n},1fr)"></div>`;const g=el.firstChild,cs=[];
  for(let i=0;i<n*n;i++){const d=document.createElement("div");d.className="cell";d.onclick=()=>onTap(i);g.appendChild(d);cs.push(d)}
  return{paint(b,last,win){const w=new Set(win||[]);for(let i=0;i<n*n;i++){const v=b[i],c=cs[i];c.textContent=v==="X"?"✕":v==="O"?"◯":"";c.className="cell"+(v==="X"?" x":v==="O"?" o":"")+(w.has(i)?" w":i===last?" l":"")}}}
}
G.caro={
  menu(){
    view(`<div class="top"><a onclick="home()">← Trò chơi</a></div><h2>⭕ Cờ caro</h2>
    <div class="card"><div class="mu">Bàn ${CN}×${CN}, 5 quân liên tiếp thắng. Bạn đi trước (✕).</div></div>
    <div class="card"><h3>🤖 Chơi với máy</h3><div class="row"><select id="cl" style="margin:0"><option value="0">Dễ</option><option value="1" selected>Vừa</option><option value="2">Khó</option></select><button style="flex:none" onclick="G.caro.vs()">Chơi</button></div></div>
    <div class="card"><h3>⚔️ Thách đấu bạn bè</h3><input id="cu" placeholder="Tên đăng nhập của người bạn muốn thách" autocapitalize="off"><button style="width:100%" onclick="G.caro.challenge()">Thách đấu</button><div class="err" id="ce"></div>
    <div class="mu">Người đó sẽ nhận lời mời trong mục Giải trí. Bạn cũng có thể gửi mã phòng cho họ.</div></div>
    <div class="card"><div class="row"><input id="jc" placeholder="Mã phòng" autocapitalize="characters" style="margin:0"><button style="flex:none" onclick="joinCode($('#jc').value)">Vào phòng</button></div><div class="err" id="me2"></div></div>`);
  },
  async challenge(){
    const u=$("#cu").value.trim(),e=$("#ce");e.textContent="";if(!u)return e.textContent="Nhập tên đăng nhập.";
    const id=await mkRoom("caro","duel",{});if(!id)return;
    const {error}=await sb.rpc("invite_user",{p_room:id,p_username:u});
    if(error){await sb.rpc("leave_room",{p_room:id});return e.textContent=error.message}
    openRoom(id);
  },
  vs(lv){
    lv=lv===undefined?+$("#cl").value:lv;const b=Array(CN*CN).fill("."),L={over:false,busy:false};let tmo;
    view(`<div class="top"><a onclick="G.caro.menu()">← Thoát</a><span>Máy: ${LV[lv]}</span></div><div class="turn" id="tn"></div><div id="bd"></div><div id="res"></div>`);
    S.clean.push(()=>clearTimeout(tmo));
    const ui=caroBoard($("#bd"),CN,i=>{if(L.over||L.busy||b[i]!==".")return;put(i,"X");if(!L.over){L.busy=true;$("#tn").textContent="Máy đang nghĩ…";tmo=setTimeout(()=>{put(aiMove(b,CN,lv),"O");L.busy=false;if(!L.over)$("#tn").textContent="Lượt của bạn (✕)"},350)}});
    function put(i,ch){b[i]=ch;const w=five(b,CN,i),full=!b.includes(".");ui.paint(b,i,w);
      if(w||full){L.over=true;$("#tn").textContent="";$("#res").innerHTML=`<div class="res">${w?(ch==="X"?"🏆 Bạn thắng máy!":"🤖 Máy thắng!"):"🤝 Hòa!"}<div class="row"><button onclick="G.caro.vs(${lv})">Chơi lại</button><button class="g" onclick="G.caro.menu()">Thoát</button></div></div>`}}
    $("#tn").textContent="Lượt của bạn (✕)";ui.paint(b,-1,null);
  },
  room(R){
    const r=R.room,st=r.state,el=$("#rv");
    if(R.shell!=="caro"){R.shell="caro";
      el.innerHTML=`<div class="top"><a onclick="leaveRoom('${R.id}')">← Rời phòng</a><span>Phòng ${esc(r.code)}</span></div><div class="turn" id="tn"></div><div id="bd"></div><div id="res"></div>`;
      R.ui=caroBoard($("#bd"),CN,i=>{const s=R.room.state;if(s.winner===null&&s.order[s.turn]===UID&&s.board[i]===".")sb.rpc("caro_move",{p_room:R.id,p_idx:i}).then(x=>{if(x.error)console.warn(x.error.message)})})}
    const b=st.board.split(""),pn=u=>{const p=R.players.find(q=>q.user_id===u);return p?p.name:"?"};
    const me=st.order.indexOf(UID),sym=["✕","◯"];
    R.ui.paint(b,st.last,st.winner&&st.winner.length>8?five(b,CN,st.last):null);
    $("#tn").innerHTML=st.winner!==null?"":`${sym[st.turn]} Lượt của <b>${esc(pn(st.order[st.turn]))}</b>${st.order[st.turn]===UID?" (bạn)":""} · bạn là ${sym[me]||"khán giả"}`;
    let res="";
    if(st.winner!==null){const w=st.winner==="draw"?"🤝 Hòa!":st.winner==="left"?"Đối thủ đã rời phòng.":st.winner===UID?"🏆 Bạn thắng!":`🏆 <b>${esc(pn(st.winner))}</b> thắng!`;
      res=`<div class="res">${w}`+(r.host===UID&&st.winner!=="left"?`<div class="row"><button onclick="startRoom('${R.id}')">Ván mới (đổi quân)</button><button class="g" onclick="leaveRoom('${R.id}')">Đóng phòng</button></div>`:`<div class="row"><button class="g" onclick="leaveRoom('${R.id}')">Rời phòng</button></div>`)+"</div>"}
    $("#res").innerHTML=res;
  }
};

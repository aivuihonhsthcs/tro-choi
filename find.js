function prng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
/* Bảng số: kích thước, độ nghiêng, vị trí khác nhau, cố định theo seed (mọi người trong phòng thấy giống nhau) */
function findUI(el,n,seed,onTap){
  el.innerHTML='<div class="fh"><div class="tgt">Tìm số<b id="tg">1</b></div><div class="tm">⏱ Thời gian<b><span id="tm">0</span>s</b></div></div><div class="sbd" id="sbd"></div><div class="bd" id="bd"></div><div id="res"></div>';
  const rnd=prng(seed),cols=n<=40?5:n<=70?6:7,rows=Math.ceil(n/cols),CH=cols===5?68:60,FS=cols===5?[18,28]:cols===6?[16,22]:[16,18],cells=[...Array(cols*rows).keys()];
  for(let i=cells.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[cells[i],cells[j]]=[cells[j],cells[i]]}
  const bd=$("#bd",el);bd.style.height=rows*CH+"px";const btn={};
  for(let i=1;i<=n;i++){
    const c=cells[i-1],cx=(c%cols+.5)/cols*100,cy=(Math.floor(c/cols)+.5)*CH,fs=FS[0]+Math.floor(rnd()*FS[1]),rot=Math.round((rnd()-.5)*120),jx=Math.round((rnd()-.5)*12),jy=Math.round((rnd()-.5)*14);
    const b=document.createElement("button");b.className="num";b.textContent=i;
    b.style.cssText=`left:calc(${cx}% + ${jx}px);top:${cy+jy}px;font-size:${fs}px;transform:translate(-50%,-50%) rotate(${rot}deg)`;
    b.onclick=()=>onTap(i);bd.appendChild(b);btn[i]=b;
  }
  let cur=null;const tm=$("#tm",el);
  const iv=setInterval(()=>{if(cur)tm.textContent=Math.max(0,Math.floor(((cur.end||now())-cur.start)/1000))},250);
  S.clean.push(()=>clearInterval(iv));
  return{stop(){clearInterval(iv)},paint(st){
    cur=st;$("#tg",el).textContent=st.next>n?"✓":st.next;
    for(let i=1;i<=n;i++){const c=st.found[i],b=btn[i];if(c){if(!b.classList.contains("f")){b.classList.add("f");b.style.background=c}}else{b.classList.remove("f");b.style.background=""}}
    $("#sbd",el).innerHTML=st.score.map(s=>`<span><i class="dot" style="background:${s.color}"></i>${esc(s.label)}: <b>${s.count}</b></span>`).join("");
    tm.textContent=Math.max(0,Math.floor(((st.end||now())-st.start)/1000));
    $("#res",el).innerHTML=st.result?`<div class="res">${st.result}</div>`:"";
  }};
}
G.find={
  menu(){
    view(`<div class="top"><a onclick="home()">← Trò chơi</a></div><h2>🔢 Tìm số</h2>
    <div class="card"><div class="mu">Bấm lần lượt các số từ 1 đến hết, đúng số đang hiện ở ô "Tìm số".</div><div class="row" style="margin-top:8px"><div>Số lượng số<select id="fn"><option>20</option><option selected>30</option><option>40</option><option>50</option><option>60</option><option>80</option><option>100</option></select></div><div>Cấp độ máy<select id="fl"><option value="0">Dễ</option><option value="1" selected>Vừa</option><option value="2">Khó</option></select></div></div></div>
    <button class="gc" onclick="G.find.solo(false)">🧍 Chơi một mình</button>
    <button class="gc" onclick="G.find.solo(true)">🤖 Chơi với máy<small>Dùng cấp độ đã chọn ở trên</small></button>
    <button class="gc" onclick="G.find.create('multi')">👥 Nhiều người<small>Tạo phòng, rủ bạn bằng mã hoặc tên đăng nhập · mỗi người một màu</small></button>
    <button class="gc" onclick="G.find.create('house')">🏠 Thách đấu nhà<small>Phụ huynh + học sinh cùng nhà chơi chung · mỗi nhà một màu</small></button>
    <div class="card"><div class="row"><input id="jc" placeholder="Mã phòng" autocapitalize="characters" style="margin:0"><button style="flex:none" onclick="joinCode($('#jc').value)">Vào phòng</button></div><div class="err" id="me2"></div></div>`);
  },
  async create(mode){const id=await mkRoom("find",mode,{n:+$("#fn").value});if(id)openRoom(id)},
  solo(cpu,n,lv){
    n=n||+$("#fn").value;lv=lv===undefined?+$("#fl").value:lv;const seed=Math.floor(Math.random()*1e9);
    view('<div class="top"><a onclick="G.find.menu()">← Thoát</a></div><div id="fg"></div>');
    const pl=[{k:"me",l:"Bạn",c:COLORS[0]}].concat(cpu?[{k:"cpu",l:"Máy ("+LV[lv]+")",c:"#64748b"}]:[]);
    const L={next:1,found:{},start:Date.now(),end:0,cnt:{me:0,cpu:0}};let tmo;S.clean.push(()=>clearTimeout(tmo));
    const ui=findUI($("#fg"),n,seed,k=>{if(!L.end&&k===L.next)claim("me")});
    function sched(){clearTimeout(tmo);if(!cpu)return;const d=[[3500,6000],[2000,3500],[1000,1900]][lv],cur=L.next;tmo=setTimeout(()=>{if(L.next===cur&&!L.end)claim("cpu")},d[0]+Math.random()*(d[1]-d[0]))}
    function claim(k){L.found[L.next]=pl.find(p=>p.k===k).c;L.cnt[k]++;L.next++;if(L.next>n){L.end=Date.now();clearTimeout(tmo)}else sched();draw()}
    function draw(){
      let res="";if(L.end){const s=Math.round((L.end-L.start)/1000);
        res=cpu?(L.cnt.me>L.cnt.cpu?"🏆 Bạn thắng máy!":L.cnt.me<L.cnt.cpu?"🤖 Máy thắng!":"🤝 Hòa!")+`<div class="mu">Bạn ${L.cnt.me} số · Máy ${L.cnt.cpu} số · ${s} giây</div>`:`🎉 Xong trong <b>${s}</b> giây!`;
        res+=`<div class="row"><button onclick="G.find.solo(${!!cpu},${n},${lv})">Chơi lại</button><button class="g" onclick="G.find.menu()">Thoát</button></div>`}
      ui.paint({next:L.next,found:L.found,start:L.start,end:L.end,result:res,score:pl.map(p=>({label:p.l,color:p.c,count:L.cnt[p.k]}))});
    }
    draw();sched();
  },
  room(R){
    const r=R.room,st=r.state,el=$("#rv"),key="f"+st.seed;
    if(R.shell!==key){R.shell=key;if(R.ui)R.ui.stop();
      el.innerHTML=`<div class="top"><a onclick="leaveRoom('${R.id}')">← Rời phòng</a><span>Phòng ${esc(r.code)}</span></div><div id="fg"></div>`;
      R.ui=findUI($("#fg"),st.n,st.seed,k=>{if(!R.room.state.ended_at)sb.rpc("find_claim",{p_room:R.id,p_n:k})});}
    const teams=teamsOf(R),found={},cnt={};
    Object.entries(st.found).forEach(([k,u])=>{const c=colorOfUid(R,u);found[k]=c;cnt[c]=(cnt[c]||0)+1});
    let res="";
    if(st.ended_at){const best=[...teams].sort((a,b)=>(cnt[b.color]||0)-(cnt[a.color]||0)),tie=best.length>1&&(cnt[best[0].color]||0)===(cnt[best[1].color]||0),s=Math.round((st.ended_at-st.started_at)/1000);
      res=(teams.length>1?(tie?"🤝 Hòa!":`🏆 <b>${esc(best[0].label)}</b> thắng!`):"🎉 Hoàn thành!")+`<div class="mu">${s} giây</div>`
        +(r.host===UID?`<div class="row"><button onclick="startRoom('${R.id}')">Ván mới</button><button class="g" onclick="leaveRoom('${R.id}')">Đóng phòng</button></div>`:'<div class="mu">Chờ chủ phòng mở ván mới…</div>')}
    R.ui.paint({next:st.next,found,start:st.started_at,end:st.ended_at||0,result:res,
      score:teams.map(t=>({label:t.label+(r.cfg.teams?` (${t.members.length})`:""),color:t.color,count:cnt[t.color]||0}))});
  }
};

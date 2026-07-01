const $=id=>document.getElementById(id);
const suits=['♠','♥','♦','♣'], ranks=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
let money=10000, chip=100, shoe=[], hist=[], round=1, shoeRound=0, timer=15, profit=0, busy=false, betRounds=0, winRounds=0, soundOn=true, speedMode=1, autoMode=false, paused=false;
let bets={P:0,B:0,T:0,PP:0,BP:0,Lucky7:0,Super7:0,Lucky6:0};
let betChips={P:[],B:[],T:[],PP:[],BP:[],Lucky7:[],Super7:[],Lucky6:[]};
let lastBet={...bets}, lastBetChips=JSON.parse(JSON.stringify(betChips));
let audioCtx=null;
function sound(type='chip'){if(!soundOn)return;try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();let o=audioCtx.createOscillator(),g=audioCtx.createGain();let m={chip:420,deal:560,flip:720,win:880,lose:180,nomore:300};o.frequency.value=m[type]||420;o.type=type==='lose'?'sawtooth':'sine';g.gain.value=.035;o.connect(g);g.connect(audioCtx.destination);o.start();setTimeout(()=>o.stop(),type==='win'?180:80)}catch(e){}}
function save(){localStorage.macauSimulator20=JSON.stringify({money,chip,shoe,hist,round,shoeRound,profit,bets,betChips,lastBet,lastBetChips,betRounds,winRounds,soundOn,speedMode,autoMode,paused})}
function load(){try{let s=JSON.parse(localStorage.macauSimulator20||'{}');if(s.money!=null){money=s.money;chip=s.chip;shoe=s.shoe||[];hist=s.hist||[];round=s.round||1;shoeRound=s.shoeRound||0;profit=s.profit||0;betRounds=s.betRounds||0;winRounds=s.winRounds||0;soundOn=s.soundOn!==false;speedMode=s.speedMode||1;autoMode=!!s.autoMode;paused=!!s.paused;bets={...bets,...(s.bets||{})};betChips={...betChips,...(s.betChips||{})};lastBet={...lastBet,...(s.lastBet||{})};lastBetChips={...lastBetChips,...(s.lastBetChips||{})}}}catch(e){}if(shoe.length<80)newShoe();render();if(hist.length||profit!==0)setTimeout(()=>toast('自动保存已恢复'),500);setInterval(countdown,1000)}
function newShoe(){shoe=[];shoeRound=0;for(let d=0;d<8;d++)for(let s of suits)for(let r of ranks)shoe.push({r,s});for(let i=shoe.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[shoe[i],shoe[j]]=[shoe[j],shoe[i]]}}
function val(c){return c.r==='A'?1:('10JQK'.includes(c.r)?0:+c.r)}
function total(h){return h.reduce((a,c)=>a+val(c),0)%10}
function draw(){if(shoe.length<60)newShoe();return shoe.pop()}
function thirdRule(bt,p3){if(p3==null)return bt<=5;if(bt<=2)return true;if(bt===3)return p3!==8;if(bt===4)return p3>=2&&p3<=7;if(bt===5)return p3>=4&&p3<=7;if(bt===6)return p3===6||p3===7;return false}
function card(c,back=false,flip=false,isNew=false){let cls='card '+(back?'back ':'')+(flip?'flip ':'')+(isNew?'new ':'');if(!back&&c&&(c.s==='♥'||c.s==='♦'))cls+='red';return `<div class="${cls}">${back?'◆':c.r+c.s}</div>`}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
function delay(ms){const map=[1.35,1,.65];return Math.round(ms*(map[speedMode]||1))}
function showNoMore(){let n=$('noMore');n.classList.remove('show');void n.offsetWidth;n.classList.add('show');sound('nomore')}
function toast(t){let el=$('toast');el.textContent=t;el.classList.remove('show');void el.offsetWidth;el.classList.add('show')}
function countdown(){if(busy||paused)return;timer--;if(timer<=0){timer=0;$('timer').textContent=timer;$('timer').classList.remove('warning');autoRound()}else {$('timer').textContent=timer;$('timer').classList.toggle('warning',timer<=3)}}
function totalBet(){return Object.values(bets).reduce((a,b)=>a+b,0)}
function resetBets(){bets={P:0,B:0,T:0,PP:0,BP:0,Lucky7:0,Super7:0,Lucky6:0};betChips={P:[],B:[],T:[],PP:[],BP:[],Lucky7:[],Super7:[],Lucky6:[]}}
function render(){document.documentElement.style.setProperty('--cut-x', Math.max(0, Math.round((1-shoe.length/416)*24))+'px');$('money').textContent=money.toLocaleString('zh-CN');['P','B','T','PP','BP','Lucky7','Super7','Lucky6'].forEach(k=>{let b=$('bet'+k);if(b)b.textContent=bets[k];let s=$('stack'+k);if(s)s.innerHTML=betChips[k].slice(-6).map(v=>`<span class="mini-chip m${v}">${v>=1000?v/1000+'K':v}</span>`).join('')});$('roundNo').textContent=String(round).padStart(6,'0');$('shoeLeft').textContent='牌靴'+shoe.length;const ss=$('shoeStats');if(ss)ss.textContent='本靴 '+shoeRound+' 局';document.querySelector('.shoe')?.classList.toggle('warning',shoe.length<70);$('profit').textContent=profit;roads();updateStats();updateControls()}

function updateStats(){
  const total=hist.length;
  const b=hist.filter(x=>x.res==='B').length;
  const p=hist.filter(x=>x.res==='P').length;
  const t=hist.filter(x=>x.res==='T').length;
  const pct=n=>total?Math.round(n/total*100):0;
  const set=(id,val)=>{const el=$(id); if(el)el.textContent=val};
  set('statRounds', total);
  set('statBetRounds', betRounds);
  set('statWinRate', betRounds?Math.round(winRounds/betRounds*100)+'%':'0%');
  set('statAvg', betRounds?Math.round(profit/betRounds):0);
  set('barBTxt', pct(b)+'%'); set('barPTxt', pct(p)+'%'); set('barTTxt', pct(t)+'%');
  const barB=$('barB'),barP=$('barP'),barT=$('barT');
  if(barB)barB.style.width=pct(b)+'%';
  if(barP)barP.style.width=pct(p)+'%';
  if(barT)barT.style.width=pct(t)+'%';
}

function roads(){let c={B:0,P:0,T:0};hist.forEach(x=>c[x.res]++);$('cntB').textContent=c.B;$('cntP').textContent=c.P;$('cntT').textContent=c.T;const trend=$('trendBar');if(trend)trend.innerHTML=hist.slice(-20).map(x=>`<span class="trend-dot ${x.res}">${x.res==='B'?'庄':x.res==='P'?'闲':'和'}</span>`).join('');let bead=hist.slice(-36).map(x=>`<div class="cell ${x.res}">${x.res==='B'?'庄':x.res==='P'?'闲':'和'}</div>`);while(bead.length<36)bead.push('<div></div>');$('beadRoad').innerHTML=bead.join('');let non=hist.filter(x=>x.res!=='T');let big=non.slice(-112).map(x=>`<div class="ring ${x.res}"></div>`);while(big.length<112)big.push('<div></div>');$('bigRoad').innerHTML=big.join('');let colors=[];for(let i=1;i<non.length;i++)colors.push(non[i].res===non[i-1].res?'r':'b');[['eyeRoad',0],['smallRoad',1],['cockRoad',2]].forEach(([id,idx])=>{let arr=colors.slice(idx).slice(-48).map(x=>`<div class="mark ${x}"></div>`);while(arr.length<48)arr.push('<div></div>');$(id).innerHTML=arr.join('')})}
function tap(el,fn){el.addEventListener('click',fn);el.addEventListener('touchend',e=>{e.preventDefault();fn(e)},{passive:false})}

function holdBet(el,k){
  let holdTimer=null, holdInterval=null;
  const start=e=>{
    if(busy||paused)return;
    holdTimer=setTimeout(()=>{
      const ring=document.createElement('span'); ring.className='long-press-ring'; el.appendChild(ring);
      holdInterval=setInterval(()=>place(k,e),320);
    },420);
  };
  const stop=()=>{
    clearTimeout(holdTimer); clearInterval(holdInterval);
    el.querySelector('.long-press-ring')?.remove();
  };
  el.addEventListener('touchstart',start,{passive:true});
  el.addEventListener('touchend',stop,{passive:true});
  el.addEventListener('touchcancel',stop,{passive:true});
  el.addEventListener('mousedown',start);
  window.addEventListener('mouseup',stop);
}

document.querySelectorAll('.chip').forEach(el=>tap(el,()=>{if(busy)return;chip=+el.dataset.chip;
function holdBet(el,k){
  let holdTimer=null, holdInterval=null;
  const start=e=>{
    if(busy||paused)return;
    holdTimer=setTimeout(()=>{
      const ring=document.createElement('span'); ring.className='long-press-ring'; el.appendChild(ring);
      holdInterval=setInterval(()=>place(k,e),320);
    },420);
  };
  const stop=()=>{
    clearTimeout(holdTimer); clearInterval(holdInterval);
    el.querySelector('.long-press-ring')?.remove();
  };
  el.addEventListener('touchstart',start,{passive:true});
  el.addEventListener('touchend',stop,{passive:true});
  el.addEventListener('touchcancel',stop,{passive:true});
  el.addEventListener('mousedown',start);
  window.addEventListener('mouseup',stop);
}

document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));el.classList.add('active');save()}));
document.querySelectorAll('.bet').forEach(el=>{tap(el,e=>place(el.dataset.bet,e));holdBet(el,el.dataset.bet)});
document.querySelectorAll('.side-bets button').forEach(el=>{tap(el,e=>place(el.dataset.side,e));holdBet(el,el.dataset.side)});
function centerOf(el){let r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}}
function flyChip(k,v,e){let layer=$('fxLayer'),target=document.querySelector(`[data-bet="${k}"],[data-side="${k}"]`),t=centerOf(target),f=document.createElement('div');f.className='fly-chip mini-chip m'+v;f.textContent=v>=1000?v/1000+'K':v;let sx=e?.changedTouches?.[0]?.clientX||e?.clientX||innerWidth/2,sy=e?.changedTouches?.[0]?.clientY||innerHeight-60;f.style.left=sx+'px';f.style.top=sy+'px';f.style.setProperty('--tx',t.x+'px');f.style.setProperty('--ty',t.y+'px');layer.appendChild(f);setTimeout(()=>f.remove(),520);sound('chip')}
function place(k,e){if(busy||paused)return;if(money<chip){document.body.classList.add('low-balance');return toast('余额不足')};bets[k]+=chip;betChips[k].push(chip);money-=chip;flyChip(k,chip,e);render();save()}
tap($('clearBtn'),()=>{if(busy)return;money+=totalBet();resetBets();render();save()});
tap($('repeatBtn'),()=>{if(busy)return;let s=Object.values(lastBet).reduce((a,b)=>a+b,0);if(!s)return toast('没有上一局');if(money<s)return toast('余额不足');money-=s;bets={...lastBet};betChips=JSON.parse(JSON.stringify(lastBetChips));render();save()});
tap($('doubleBtn'),()=>{if(busy)return;let s=totalBet();if(!s)return toast('请先下注');if(money<s)return toast('余额不足');money-=s;Object.keys(bets).forEach(k=>{bets[k]*=2;betChips[k]=betChips[k].concat(betChips[k])});render();save()});
tap($('resetBtn'),()=>{if(confirm('重置全部数据？')){localStorage.removeItem('macauSimulator20');location.reload()}});

async function maybeShuffle(){
  if(shoe.length<70){
    toast('切牌到达，正在换靴');
    const el=$('toast'); if(el)el.classList.add('shuffle');
    await wait(delay(1200));
    newShoe();
    render();
    toast('新牌靴已完成');
    await wait(delay(800));
  }
}


function chipClass(v){return 'm'+v}
function targetOfBet(k){
  return document.querySelector(`[data-bet="${k}"],[data-side="${k}"]`) || document.querySelector('.bet.player');
}
function settleFx(kind,res){
  const layer=$('fxLayer'); if(!layer)return;
  const keys=['P','B','T','PP','BP','Lucky7','Super7','Lucky6'];
  const active=keys.filter(k=>bets[k]>0).slice(0,10);
  if(kind==='collect'){
    active.forEach((k,i)=>{
      const t=centerOf(targetOfBet(k));
      const c=document.createElement('div');
      c.className='settle-chip collect '+chipClass((betChips[k]&&betChips[k][0])||100);
      c.textContent='收';
      c.style.left=(t.x-12)+'px'; c.style.top=(t.y-12)+'px';
      layer.appendChild(c); setTimeout(()=>c.remove(),760);
    });
  }else if(kind==='pay'){
    const target=targetOfBet(res);
    const t=centerOf(target);
    for(let i=0;i<6;i++){
      const c=document.createElement('div');
      c.className='settle-chip pay m100';
      c.textContent='赢';
      c.style.setProperty('--tx',(t.x-18+i*5)+'px');
      c.style.setProperty('--ty',(t.y-12+(i%2)*5)+'px');
      layer.appendChild(c); setTimeout(()=>c.remove(),900);
    }
  }
}
function setLastResult(res,pt,bt,delta,stake){
  const el=$('lastResult'); if(!el)return;
  const name=res==='B'?'庄赢':res==='P'?'闲赢':'和局';
  el.textContent=`最近一局：${name} 闲${pt} 庄${bt}` + (stake>0 ? ` · ${delta>=0?'赢':'输'} ${Math.abs(delta)}` : '');
}

async function autoRound(){if(busy||paused)return;await maybeShuffle();showNoMore();await wait(delay(900));busy=true;document.querySelector('#dealer').classList.add('dealing');lastBet={...bets};lastBetChips=JSON.parse(JSON.stringify(betChips));document.querySelectorAll('.bet,.side-bets button').forEach(x=>x.classList.remove('win'));$('pCards').innerHTML='';$('bCards').innerHTML='';$('pScore').textContent='?';$('bScore').textContent='?';let P=[],B=[];P.push(draw());await showBack(P,B,650,true);B.push(draw());await showBack(P,B,650,true);P.push(draw());await showBack(P,B,650,true);B.push(draw());await showBack(P,B,1000,true);await flipShow(P,B,1,0,850,true,'P');await flipShow(P,B,1,1,850,true,'B');await flipShow(P,B,2,1,850,true,'P');await flipShow(P,B,2,2,1000,true,'B');let pt=total(P),bt=total(B),p3=null;if(!(pt>=8||bt>=8)){if(pt<=5){let c=draw();P.push(c);await showKnownWithBack(P,B,'P',1000);p3=val(c);await flipShow(P,B,P.length,B.length,1000,true,'P')}if(thirdRule(total(B.slice(0,2)),p3)){let c=draw();B.push(c);await showKnownWithBack(P,B,'B',1000);await flipShow(P,B,P.length,B.length,1000,true,'B')}}pt=total(P);bt=total(B);let res=pt>bt?'P':bt>pt?'B':'T';let stake=totalBet(),payout=settle(P,B,res,pt,bt);money+=payout;let delta=payout-stake;profit+=delta;if(stake>0){betRounds++; if(delta>0)winRounds++;}hist.push({res,pt,bt,delta,is7:res==='P'&&pt===7});if(hist.length>240)hist.shift();setLastResult(res,pt,bt,delta,stake);document.querySelector('#dealer')?.classList.add('settle');if(stake>0){if(delta>0)settleFx('pay',res);else if(delta<0)settleFx('collect',res)}setTimeout(()=>document.querySelector('#dealer')?.classList.remove('settle'),1200);markWins(P,B,res,pt,bt);document.querySelector('#dealer').classList.remove('dealing');sound(delta>0?'win':delta<0?'lose':'flip');if(stake>0)toast(delta>=0?'您赢 +'+delta:'您输 '+delta);resetBets();round++;shoeRound++;timer=autoMode?5:15;$('timer').classList.remove('warning');busy=false;render();save()}
function settle(P,B,res,pt,bt){let p=0;if(res==='P')p+=bets.P*2;if(res==='B')p+=Math.floor(bets.B*1.95);if(res==='T')p+=bets.T*9+bets.P+bets.B;let pp=P[0]&&P[1]&&P[0].r===P[1].r,bp=B[0]&&B[1]&&B[0].r===B[1].r;if(pp)p+=bets.PP*12;if(bp)p+=bets.BP*12;let cc=P.length+B.length;if(res==='P'&&pt===7){if(P.length===2)p+=bets.Lucky7*7;if(P.length===3)p+=bets.Lucky7*16}if(res==='P'&&pt===7&&bt===6){if(cc===4)p+=bets.Super7*31;else if(cc===5)p+=bets.Super7*41;else if(cc===6)p+=bets.Super7*101}if(res==='B'&&bt===6){if(B.length===2)p+=bets.Lucky6*13;if(B.length===3)p+=bets.Lucky6*21}return p}
function markWins(P,B,res,pt,bt){document.querySelector('.bet.'+({P:'player',T:'tie',B:'banker'}[res]))?.classList.add('win');let pp=P[0]&&P[1]&&P[0].r===P[1].r,bp=B[0]&&B[1]&&B[0].r===B[1].r;if(pp)document.querySelector('[data-side="PP"]').classList.add('win');if(bp)document.querySelector('[data-side="BP"]').classList.add('win');if(res==='P'&&pt===7)document.querySelector('[data-side="Lucky7"]').classList.add('win');if(res==='P'&&pt===7&&bt===6)document.querySelector('[data-side="Super7"]').classList.add('win');if(res==='B'&&bt===6)document.querySelector('[data-side="Lucky6"]').classList.add('win')}
async function showBack(P,B,ms,isNew=false){sound('deal');$('pCards').innerHTML=P.map(()=>card(null,true,false,isNew)).join('');$('bCards').innerHTML=B.map(()=>card(null,true,false,isNew)).join('');await wait(delay(ms))}
async function flipShow(P,B,pCount,bCount,ms,flipLast=false,side=''){sound('flip');$('pCards').innerHTML=P.map((c,i)=>i<pCount?card(c,false,flipLast&&side==='P'&&i===pCount-1):card(c,true)).join('');$('bCards').innerHTML=B.map((c,i)=>i<bCount?card(c,false,flipLast&&side==='B'&&i===bCount-1):card(c,true)).join('');$('pScore').textContent=pCount?total(P.slice(0,pCount)):'?';$('bScore').textContent=bCount?total(B.slice(0,bCount)):'?';await wait(delay(ms))}
async function showKnownWithBack(P,B,side,ms){$('pCards').innerHTML=P.map((c,i)=>side==='P'&&i===P.length-1?card(null,true,true):card(c,false)).join('');$('bCards').innerHTML=B.map((c,i)=>side==='B'&&i===B.length-1?card(null,true,true):card(c,false)).join('');await wait(delay(ms))}
bindControls();
load();



function updateControls(){
  const soundBtn=$('soundBtn'), speedBtn=$('speedBtn'), autoBtn=$('autoBtn');
  if(soundBtn)soundBtn.textContent='声音 '+(soundOn?'开':'关');
  if(speedBtn)speedBtn.textContent='速度 '+(['慢','标准','快'][speedMode]||'标准');
  if(autoBtn)autoBtn.textContent='自动 '+(autoMode?'开':'关'); const pauseBtn=$('pauseBtn'); if(pauseBtn)pauseBtn.textContent=paused?'继续':'暂停'; document.body.classList.toggle('paused',paused); document.body.classList.toggle('low-balance',money<chip);
}
function bindControls(){
  const soundBtn=$('soundBtn'), speedBtn=$('speedBtn'), autoBtn=$('autoBtn'), pauseBtn=$('pauseBtn'), roadClearBtn=$('roadClearBtn'), moneyResetBtn=$('moneyResetBtn');
  if(soundBtn)tap(soundBtn,()=>{soundOn=!soundOn;updateControls();save()});
  if(speedBtn)tap(speedBtn,()=>{speedMode=(speedMode+1)%3;updateControls();save()});
  if(autoBtn)tap(autoBtn,()=>{autoMode=!autoMode;updateControls();save()});
  if(pauseBtn)tap(pauseBtn,()=>{paused=!paused;updateControls();save()});
  if(roadClearBtn)tap(roadClearBtn,()=>{if(busy)return; if(confirm('只清空路单和统计，保留余额？')){hist=[];profit=0;betRounds=0;winRounds=0;round=1;render();save()}});
  if(moneyResetBtn)tap(moneyResetBtn,()=>{if(busy)return; if(confirm('余额重置为10000？')){money=10000;render();save()}});
  updateControls();
}

function setOrientationState(){
  const badge=document.querySelector('.live-badge');
  if(!badge)return;
  badge.textContent = innerWidth > innerHeight ? 'LIVE · VIP ROOM · 横屏模式' : 'LIVE · VIP ROOM';
}
window.addEventListener('resize', setOrientationState);
setOrientationState();

window.addEventListener('error',()=>{try{toast('程序保护：已拦截错误')}catch(e){}});

function hideSplash(){
  const s=$('splash');
  if(s)setTimeout(()=>s.classList.add('hide'),650);
}
hideSplash();


function unlockAudioOnce(){
  soundOn && sound('chip');
  window.removeEventListener('touchstart', unlockAudioOnce);
  window.removeEventListener('click', unlockAudioOnce);
}
window.addEventListener('touchstart', unlockAudioOnce, {once:true});
window.addEventListener('click', unlockAudioOnce, {once:true});

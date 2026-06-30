
const $=id=>document.getElementById(id);
const suits=['♠','♥','♦','♣'], ranks=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
let money=10000, chip=10, bets={P:0,B:0,T:0}, lastBet={P:0,B:0,T:0}, shoe=[], hist=[], busy=false, round=1, timer=15;
function save(){localStorage.macauV7=JSON.stringify({money,bets,lastBet,shoe,hist,round})}
function load(){try{let s=JSON.parse(localStorage.macauV7||'{}'); if(s.money!=null){money=s.money;bets=s.bets||bets;lastBet=s.lastBet||lastBet;shoe=s.shoe||[];hist=s.hist||[];round=s.round||1}}catch(e){} if(shoe.length<80)newShoe(); render(); setInterval(()=>{if(!busy){timer--; if(timer<0)timer=15; $('timer').textContent=timer}},1000)}
function newShoe(){shoe=[];for(let d=0;d<8;d++)for(let s of suits)for(let r of ranks)shoe.push({r,s});for(let i=shoe.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[shoe[i],shoe[j]]=[shoe[j],shoe[i]]}}
function val(c){return c.r==='A'?1:('10JQK'.includes(c.r)?0:+c.r)}
function total(h){return h.reduce((a,c)=>a+val(c),0)%10}
function draw(){if(shoe.length<60)newShoe();return shoe.pop()}
function thirdRule(bt,p3){if(p3==null)return bt<=5;if(bt<=2)return true;if(bt===3)return p3!==8;if(bt===4)return p3>=2&&p3<=7;if(bt===5)return p3>=4&&p3<=7;if(bt===6)return p3===6||p3===7;return false}
function card(c){let red=c.s==='♥'||c.s==='♦';return `<div class="card ${red?'red':''}">${c.r}${c.s}</div>`}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
function toast(t){let el=$('toast');el.textContent=t;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');try{navigator.vibrate&&navigator.vibrate(8)}catch(e){}}
function render(){
 $('money').textContent=money.toLocaleString('zh-CN'); $('betP').textContent=bets.P; $('betB').textContent=bets.B; $('betT').textContent=bets.T;
 $('roundNo').textContent=String(round).padStart(6,'0');
 const c={B:0,P:0,T:0}; hist.forEach(x=>c[x.res]++); $('cntB').textContent=c.B; $('cntP').textContent=c.P; $('cntT').textContent=c.T;
 let bead=hist.slice(-36).map(x=>`<div class="cell ${x.res}">${x.res==='B'?'庄':x.res==='P'?'闲':'和'}</div>`); while(bead.length<36)bead.push('<div></div>'); $('bead').innerHTML=bead.join('');
 let big=hist.filter(x=>x.res!=='T').slice(-96).map(x=>`<div class="ring ${x.res}"></div>`); while(big.length<96)big.push('<div></div>'); $('bigRoad').innerHTML=big.join('');
}
document.querySelectorAll('.chip').forEach(el=>el.onclick=()=>{chip=+el.dataset.chip;document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));el.classList.add('active')});
document.querySelectorAll('.bet').forEach(el=>el.onclick=()=>{if(busy)return; if(money<chip)return toast('余额不足'); let s=el.dataset.bet; bets[s]+=chip; money-=chip; render(); save()});
$('clearBtn').onclick=()=>{if(busy)return; money+=bets.P+bets.B+bets.T; bets={P:0,B:0,T:0}; render(); save()};
$('repeatBtn').onclick=()=>{if(busy)return; let sum=lastBet.P+lastBet.B+lastBet.T; if(!sum)return toast('没有上一局'); if(money<sum)return toast('余额不足'); money-=sum; bets={...lastBet}; render(); save()};
$('dealBtn').onclick=async()=>{
 if(busy)return; let stake=bets.P+bets.B+bets.T; if(!stake)return toast('请先下注');
 busy=true; lastBet={...bets}; $('pCards').innerHTML=''; $('bCards').innerHTML=''; $('pScore').textContent='0'; $('bScore').textContent='0';
 let P=[draw(),draw()], B=[draw(),draw()]; await show(P,B);
 let pt=total(P), bt=total(B), p3=null;
 if(!(pt>=8||bt>=8)){ if(pt<=5){let c=draw();P.push(c);p3=val(c);await show(P,B)} if(thirdRule(total(B.slice(0,2)),p3)){B.push(draw());await show(P,B)}}
 pt=total(P); bt=total(B); let res=pt>bt?'P':bt>pt?'B':'T';
 let payout=0; if(res==='P')payout+=bets.P*2; if(res==='B')payout+=Math.floor(bets.B*1.95); if(res==='T')payout+=bets.T*9+bets.P+bets.B;
 money+=payout; let profit=payout-stake; hist.push({res,pt,bt,profit}); if(hist.length>150)hist.shift();
 toast((res==='P'?'闲赢':res==='B'?'庄赢':'和局')+' '+(profit>=0?'+':'')+profit);
 bets={P:0,B:0,T:0}; round++; timer=15; busy=false; render(); save();
};
async function show(P,B){$('pCards').innerHTML=P.map(card).join('');$('bCards').innerHTML=B.map(card).join('');$('pScore').textContent=total(P);$('bScore').textContent=total(B);await wait(650)}
load();

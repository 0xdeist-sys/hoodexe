const cows = [
  {id:1, image:'assets/cows/1(2).png'},
  {id:45, image:'assets/cows/45(1).png'},
  {id:158, image:'assets/cows/158.png'},
  {id:159, image:'assets/cows/159.png'},
  {id:285, image:'assets/cows/285.png'},
  {id:398, image:'assets/cows/398.png'},
  {id:452, image:'assets/cows/452.png'},
  {id:512, image:'assets/cows/512.png'},
  {id:547, image:'assets/cows/547.png'},
  {id:863, image:'assets/cows/863.png'},
  {id:865, image:'assets/cows/865.png'},
  {id:1161, image:'assets/cows/1161.png'},
  {id:1164, image:'assets/cows/1164.png'}
].map((cow,i)=>({...cow,milk:240+i*73}));

let milk = 1240;
let claimable = 130;
let connected = false;
let tick = 42;
const milkPerCow = 10;

const cowLayer = document.getElementById('cowLayer');
const cowCards = document.getElementById('cowCards');
const milkBalance = document.getElementById('milkBalance');
const claimableMilk = document.getElementById('claimableMilk');
const toast = document.getElementById('collectToast');

const positions = [
  [34,64],[45,70],[57,61],[69,70],[29,81],[41,85],[53,81],
  [65,84],[77,79],[37,73],[49,75],[61,73],[73,62]
];

function setStaticStats(){
  document.getElementById('cowCount').textContent=cows.length;
  document.getElementById('dailyProduction').textContent=`${cows.length*milkPerCow} MILK/day`;
  const share=document.getElementById('mooShare'); if(share) share.textContent=`${cows.length} COWS`;
}

function renderCows(){
  cowLayer.innerHTML=''; cowCards.innerHTML='';
  cows.forEach((cow,i)=>{
    const el=document.createElement('div');
    el.className='cow cow-nft';
    el.style.left=positions[i][0]+'%'; el.style.top=positions[i][1]+'%';
    el.innerHTML=`<div class="cow-tag">#${cow.id}</div><img src="${cow.image}" alt="MooPunk #${cow.id}">`;
    el.addEventListener('click',()=>showCow(cow));
    cowLayer.appendChild(el);

    const card=document.createElement('article'); card.className='pixel-panel cow-card';
    card.innerHTML=`
      <div class="cow-avatar-img"><img src="${cow.image}" alt="MooPunk #${cow.id}"></div>
      <h3>MooPunk #${cow.id}</h3>
      <div class="meta"><span>Daily</span><b>${milkPerCow} MILK</b></div>
      <div class="meta"><span>Lifetime</span><b>${cow.milk} MILK</b></div>
      <button class="inspect-btn">VIEW COW</button>`;
    card.querySelector('.inspect-btn').addEventListener('click',()=>showCow(cow));
    cowCards.appendChild(card);
  });
}

function showCow(cow){
  const modal=document.getElementById('cowModal');
  document.getElementById('modalCowImage').src=cow.image;
  document.getElementById('modalCowTitle').textContent=`MooPunk #${cow.id}`;
  document.getElementById('modalCowMilk').textContent=`${milkPerCow} MILK / DAY`;
  modal.classList.add('show');
}

document.getElementById('closeCowModal').addEventListener('click',()=>document.getElementById('cowModal').classList.remove('show'));
document.getElementById('cowModal').addEventListener('click',e=>{if(e.target.id==='cowModal') e.currentTarget.classList.remove('show')});

function wander(){
  [...document.querySelectorAll('.cow-nft')].forEach(el=>{
    const dx=(Math.random()*18-9); const dy=(Math.random()*10-5);
    el.style.transform=`translate(${dx}px,${dy}px)`;
  });
}
setInterval(wander,1700);

function updateMilk(){milkBalance.textContent=milk.toLocaleString(); claimableMilk.textContent=claimable.toLocaleString();}

document.getElementById('collectBtn').addEventListener('click',()=>{
  if(claimable<=0) return;
  milk+=claimable; claimable=0; updateMilk();
  toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),1400);
});

document.querySelectorAll('.nav-tabs button').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.nav-tabs button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active-view'));
  document.getElementById(btn.dataset.view).classList.add('active-view');
}));

document.getElementById('walletBtn').addEventListener('click',e=>{
  connected=!connected;
  e.currentTarget.textContent=connected?'0xMOO...FARM':'CONNECT WALLET';
  e.currentTarget.style.background=connected?'#f6c344':'#7bd65c';
});

document.querySelectorAll('.shop-btn').forEach(btn=>btn.addEventListener('click',()=>{
  const cost=Number(btn.dataset.cost);
  if(milk>=cost){milk-=cost; updateMilk(); btn.textContent='OWNED ✓'; btn.disabled=true; btn.style.background='#7bd65c';}
  else{btn.classList.add('shake'); setTimeout(()=>btn.classList.remove('shake'),400); btn.textContent='NOT ENOUGH MILK'; setTimeout(()=>btn.textContent=cost.toLocaleString()+' MILK',900)}
}));

setInterval(()=>{
  tick--; if(tick<0){tick=59; claimable+=cows.length; updateMilk();}
  document.getElementById('nextTick').textContent=`Next milk tick in 00:${String(tick).padStart(2,'0')}`;
  document.getElementById('milkProgress').style.width=((59-tick)/59*100)+'%';
},1000);

setStaticStats(); renderCows(); updateMilk();

const cows = [
  { id: 1, img: './1(2).png' },
  { id: 45, img: './45(1).png' },
  { id: 158, img: './158.png' },
  { id: 159, img: './159.png' },
  { id: 285, img: './285.png' },
  { id: 398, img: './398.png' },
  { id: 452, img: './452.png' },
  { id: 512, img: './512.png' },
  { id: 547, img: './547.png' },
  { id: 863, img: './863.png' },
  { id: 865, img: './865.png' },
  { id: 1161, img: './1161.png' },
  { id: 1164, img: './1164.png' }
];

const positions = [[34,57],[44,66],[55,54],[66,65],[30,76],[40,82],[50,73],[61,82],[72,75],[38,69],[48,62],[59,69],[69,56]];
let milk = 1240;
let claimable = cows.length * 10;
let tick = 42;
let connected = false;

const $ = (id) => document.getElementById(id);
const cowLayer = $('cowLayer');
const cowCards = $('cowCards');

function renderCows() {
  cowLayer.innerHTML = '';
  cowCards.innerHTML = '';
  cows.forEach((cow, index) => {
    const farmCow = document.createElement('div');
    farmCow.className = 'moo';
    farmCow.style.left = positions[index][0] + '%';
    farmCow.style.top = positions[index][1] + '%';
    farmCow.innerHTML = `<span class="moo-label">#${cow.id}</span><img src="${cow.img}" alt="MooPunk #${cow.id}">`;
    farmCow.addEventListener('click', () => openCow(cow));
    cowLayer.appendChild(farmCow);

    const card = document.createElement('article');
    card.className = 'panel cow-card';
    card.innerHTML = `<img src="${cow.img}" alt="MooPunk #${cow.id}"><h3>MooPunk #${cow.id}</h3><div class="cow-meta"><span>DAILY</span><b>10 MILK</b></div><div class="cow-meta"><span>STATUS</span><b>ON FARM</b></div>`;
    card.addEventListener('click', () => openCow(cow));
    cowCards.appendChild(card);
  });
  $('cowCount').textContent = cows.length;
  $('farmRate').textContent = `${cows.length * 10} MILK / DAY`;
}

function openCow(cow) {
  $('modalImg').src = cow.img;
  $('modalTitle').textContent = `MooPunk #${cow.id}`;
  $('cowModal').classList.add('show');
  $('cowModal').setAttribute('aria-hidden', 'false');
}
function closeCow() {
  $('cowModal').classList.remove('show');
  $('cowModal').setAttribute('aria-hidden', 'true');
}
$('modalClose').addEventListener('click', closeCow);
$('cowModal').addEventListener('click', (e) => { if (e.target === $('cowModal')) closeCow(); });

function updateBalances() {
  $('milkBalance').textContent = milk.toLocaleString();
  $('claimable').textContent = claimable.toLocaleString();
}

$('collectBtn').addEventListener('click', () => {
  if (claimable <= 0) return;
  const amount = claimable;
  milk += amount;
  claimable = 0;
  updateBalances();
  const burst = $('milkBurst');
  burst.textContent = `+${amount} MILK`;
  burst.classList.remove('show');
  void burst.offsetWidth;
  burst.classList.add('show');
});

document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active-view'));
    btn.classList.add('active');
    $(btn.dataset.view).classList.add('active-view');
  });
});

$('walletBtn').addEventListener('click', () => {
  connected = !connected;
  $('walletBtn').textContent = connected ? '0xMOO...FARM' : 'CONNECT WALLET';
  $('walletBtn').style.background = connected ? '#ffd13d' : '#77d956';
});

document.querySelectorAll('.shop-buy').forEach((btn) => {
  btn.addEventListener('click', () => {
    const cost = Number(btn.dataset.cost);
    if (milk >= cost) {
      milk -= cost;
      updateBalances();
      btn.textContent = 'OWNED ✓';
      btn.disabled = true;
      btn.style.background = '#77d956';
    } else {
      const old = btn.textContent;
      btn.textContent = 'NOT ENOUGH MILK';
      setTimeout(() => { btn.textContent = old; }, 900);
    }
  });
});

setInterval(() => {
  tick -= 1;
  if (tick < 0) {
    tick = 59;
    claimable += cows.length;
    updateBalances();
  }
  $('timer').textContent = `NEXT MILK TICK IN 00:${String(tick).padStart(2, '0')}`;
  $('progressBar').style.width = `${((59 - tick) / 59) * 100}%`;
}, 1000);

setInterval(() => {
  document.querySelectorAll('.moo').forEach((cow) => {
    const x = Math.round(Math.random() * 12 - 6);
    const y = Math.round(Math.random() * 8 - 4);
    cow.style.transform = `translate(${x}px, ${y}px)`;
  });
}, 1800);

renderCows();
updateBalances();

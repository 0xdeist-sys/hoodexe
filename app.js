const cows=[
["1","1(2).png","#159ee9","#5b3700","🤠"],["45","45(1).png","#e7bd2f","#663300","👑"],
["158","158.png","#deddae","#78eaf0",""],["159","159.png","#640075","#f27de3",""],
["285","285.png","#ff28d8","#e9a900",""],["398","398.png","#73a6c1","#6d0012",""],
["452","452.png","#ff1830","#fff","🎩"],["512","512.png","#dd7100","#8d00ff",""],
["547","547.png","#276f0d","#f2c61b","🎩"],["863","863.png","#174f15","#111","🤠"],
["865","865.png","#2c005c","#ff1eb7",""],["1161","1161.png","#c1e6e0","#8af6ef",""],
["1164","1164.png","#123b20","#b5ff93",""]
];
const spots=[[36,35],[44,46],[55,28],[63,48],[30,57],[50,62],[66,66],[58,58],[72,54],[40,67],[47,53],[61,37],[70,34]];
const sprites=document.querySelector("#sprites");
cows.forEach((c,i)=>{
 const d=document.createElement("div"); d.className="cow";
 d.style.left=spots[i][0]+"%"; d.style.top=spots[i][1]+"%";
 d.style.setProperty("--fur",c[2]);d.style.setProperty("--horn",c[3]);
 d.innerHTML=`<span class="hat">${c[4]}</span><i class="horn hl"></i><i class="horn hr"></i><i class="head"></i><i class="muzzle"></i><i class="eye e1"></i><i class="eye e2"></i><label>#${c[0]}</label>`;
 d.onclick=()=>openCow(c); sprites.appendChild(d);
});
function openCow(c){modalImg.src=c[1];modalName.textContent="MooPunk #"+c[0];modal.classList.add("show")}
close.onclick=()=>modal.classList.remove("show");modal.onclick=e=>{if(e.target===modal)modal.classList.remove("show")}
let balance=1240;
collect.onclick=()=>{
 balance+=130;milkBalance.textContent=balance.toLocaleString("en-US");
 document.querySelectorAll(".cow").forEach((c,i)=>setTimeout(()=>{let x=document.createElement("span");x.className="drop";x.textContent="🥛";let r=c.getBoundingClientRect(),f=farm.getBoundingClientRect();x.style.left=(r.left-f.left+20)+"px";x.style.top=(r.top-f.top)+"px";milkBurst.appendChild(x);setTimeout(()=>x.remove(),1500)},i*45));
 let g=document.createElement("b");g.className="gain";g.textContent="+130 MILK";milkBurst.appendChild(g);setTimeout(()=>g.remove(),1600);
};
let sec=42;setInterval(()=>{sec--;if(sec<0)sec=59;tick.textContent="00:"+String(sec).padStart(2,"0")},1000);
wallet.onclick=()=>{wallet.textContent=wallet.textContent==="CONNECT WALLET"?"0xMOO...FARM":"CONNECT WALLET"};

const NFT="0xC20eFC3e0bbD395676c606128D7C1634AAE548bF";
const STAKING="0x41549bd76048C5A984a1674f138157f2d66c31AD";
const CHAIN_ID=4663;
const RPC="https://rpc.robinhoodchain.com";
const stakingAbi=[
 "function totalStaked() view returns (uint256)",
 "function earned(address) view returns (uint256)",
 "function stake(uint256[] tokenIds)",
 "function unstakeAndClaim(uint256[] tokenIds)"
];
const nftAbi=[
 "function ownerOf(uint256) view returns(address)",
 "function getApproved(uint256) view returns(address)",
 "function approve(address,uint256)"
];
let provider,signer,user,tab="available",selected=new Set(),items=[];
const $=id=>document.getElementById(id);
function short(a){return a?`${a.slice(0,6)}…${a.slice(-4)}`:""}
async function readStats(){
 try{
  const p=new ethers.JsonRpcProvider(RPC);
  const c=new ethers.Contract(STAKING,stakingAbi,p);
  const n=(await c.totalStaked()).toString();
  $("totalStaked").textContent=n;$("totalStaked2").textContent=n;
 }catch(e){console.warn(e)}
}
async function connect(){
 if(!window.ethereum){alert("No injected wallet detected.");return}
 provider=new ethers.BrowserProvider(window.ethereum);
 await provider.send("eth_requestAccounts",[]);
 let net=await provider.getNetwork();
 if(Number(net.chainId)!==CHAIN_ID){
  try{await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:"0x1237"}]})}
  catch(e){alert("Switch your wallet to Robinhood Chain.");return}
  provider=new ethers.BrowserProvider(window.ethereum);
 }
 signer=await provider.getSigner();user=await signer.getAddress();
 $("connectBtn").textContent=short(user);$("connectBtn2").textContent=short(user);
 $("walletState").classList.add("hidden");$("nftGrid").classList.remove("hidden");$("stakeActions").classList.remove("hidden");
 await refreshWallet();
}
async function refreshWallet(){
 const c=new ethers.Contract(STAKING,stakingAbi,provider);
 try{$("earned").textContent=`${ethers.formatUnits(await c.earned(user),18)} TSLA`}catch{$("earned").textContent="— TSLA"}
 // NFT discovery endpoint may vary with explorer deployment; ownership is verified onchain before transactions.
 items=[]; selected.clear(); render();
 $("yourStaked").textContent="—";
}
function render(){
 const g=$("nftGrid");g.innerHTML="";
 if(!items.length){g.innerHTML='<div class="empty" style="grid-column:1/-1"><span>CONNECTED</span><h3>Wallet connected.</h3><p>NFT positions will appear here after collection indexing is connected. Transaction functions remain tied to the verified onchain contracts.</p></div>'}
 items.forEach(x=>{let d=document.createElement("div");d.className="nft-card"+(selected.has(x.id)?" selected":"");d.innerHTML=`<img src="${x.image}"><div><b>#${x.id}</b><span>${tab==="available"?"AVAILABLE":"STAKED"}</span></div>`;d.onclick=()=>{selected.has(x.id)?selected.delete(x.id):selected.add(x.id);render()};g.appendChild(d)});
 $("selectionText").textContent=`${selected.size} MOO SELECTED`;$("primaryAction").disabled=!selected.size;$("primaryAction").textContent=tab==="available"?"STAKE SELECTED":"UNSTAKE & CLAIM";
}
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");tab=b.dataset.tab;selected.clear();render()});
$("connectBtn").onclick=$("connectBtn2").onclick=connect;
$("primaryAction").onclick=async()=>{if(!signer||!selected.size)return;const ids=[...selected].map(BigInt);try{if(tab==="staked"){const c=new ethers.Contract(STAKING,stakingAbi,signer);const tx=await c.unstakeAndClaim(ids);await tx.wait()}else{const n=new ethers.Contract(NFT,nftAbi,signer);for(const id of ids){const approved=await n.getApproved(id);if(approved.toLowerCase()!==STAKING.toLowerCase()){const a=await n.approve(STAKING,id);await a.wait()}}const c=new ethers.Contract(STAKING,stakingAbi,signer);const tx=await c.stake(ids);await tx.wait()}await readStats();await refreshWallet()}catch(e){console.error(e);alert(e.shortMessage||e.message||"Transaction failed")}};
readStats();
const NFT = "0xC20eFC3e0bbD395676c606128D7C1634AAE548bF";
const STAKING = "0x41549bd76048C5A984a1674f138157f2d66c31AD";
const TSLA = "0x322F0929c4625eD5bAd873c95208D54E1c003b2d";

const CHAIN_ID = 4663;
const CHAIN_HEX = "0x1237";
const RPC = "https://rpc.mainnet.chain.robinhood.com";
const EXPLORER = "https://robinhoodchain.blockscout.com";
const API = `${EXPLORER}/api/v2`;

const stakingAbi = [
  "function totalStaked() view returns (uint256)",
  "function seasonId() view returns (uint256)",
  "function availableSlots() view returns (uint256)",
  "function secondsUntilSeasonEnd() view returns (uint256)",
  "function rewardPerMooPerDay() view returns (uint256)",
  "function tslaBalance() view returns (uint256)",
  "function earned(address) view returns (uint256)",
  "function stakedCount(address) view returns (uint256)",
  "function getStakedTokens(address) view returns (uint256[])",
  "function stake(uint256[] tokenIds)",
  "function claim()",
  "function unstakeAndClaim(uint256[] tokenIds)"
];

const nftAbi = [
  "function ownerOf(uint256 tokenId) view returns(address)",
  "function getApproved(uint256 tokenId) view returns(address)",
  "function isApprovedForAll(address owner,address operator) view returns(bool)",
  "function approve(address to,uint256 tokenId)"
];

let readProvider = new ethers.JsonRpcProvider(RPC);
let provider = null;
let signer = null;
let user = null;
let tab = "available";
let selected = new Set();
let availableItems = [];
let stakedItems = [];
let refreshTimer = null;

const $ = (id) => document.getElementById(id);
const lower = (x) => String(x || "").toLowerCase();
const short = (a) => a ? `${a.slice(0,6)}…${a.slice(-4)}` : "";
const fmt = (v, max=8) => {
  const n = Number(ethers.formatUnits(v, 18));
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "0";
  if (n < 0.000001) return n.toFixed(12).replace(/0+$/,"").replace(/\.$/,"");
  return n.toLocaleString(undefined,{maximumFractionDigits:max});
};
const ipfs = (u) => {
  if (!u) return "";
  if (u.startsWith("ipfs://ipfs/")) return "https://ipfs.io/ipfs/" + u.slice(12);
  if (u.startsWith("ipfs://")) return "https://ipfs.io/ipfs/" + u.slice(7);
  return u;
};
const status = (msg, type="ok", link="") => {
  const el = $("statusBar");
  el.className = `status-bar ${type}`;
  el.classList.remove("hidden");
  el.innerHTML = link ? `${msg} · <a class="tx-link" target="_blank" rel="noreferrer" href="${EXPLORER}/tx/${link}">VIEW TX ↗</a>` : msg;
};
const clearStatus = () => $("statusBar").classList.add("hidden");

async function readStats() {
  try {
    const c = new ethers.Contract(STAKING, stakingAbi, readProvider);
    const [total, season, slots, sec, perDay, bal] = await Promise.all([
      c.totalStaked(), c.seasonId(), c.availableSlots(), c.secondsUntilSeasonEnd(),
      c.rewardPerMooPerDay(), c.tslaBalance()
    ]);
    $("totalStaked").textContent = total.toString();
    $("totalStaked2").textContent = total.toString();
    $("availableSlots").textContent = slots.toString();
    $("poolBalance").textContent = `${fmt(bal, 10)} TSLA`;
    $("perMooDay").textContent = `${fmt(perDay, 12)} TSLA`;
    $("seasonTicker").textContent = `${season.toString().padStart(2,"0")} / TSLA`;
    $("seasonEnds").textContent = formatCountdown(Number(sec));
    return true;
  } catch (e) {
    console.warn("Stats", e);
    return false;
  }
}

function formatCountdown(seconds) {
  if (!seconds || seconds <= 0) return "ENDED";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

async function ensureChain() {
  const current = await provider.getNetwork();
  if (Number(current.chainId) === CHAIN_ID) return true;
  try {
    await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:CHAIN_HEX}]});
  } catch (e) {
    if (e.code === 4902) {
      await window.ethereum.request({
        method:"wallet_addEthereumChain",
        params:[{
          chainId: CHAIN_HEX,
          chainName:"Robinhood Chain",
          nativeCurrency:{name:"Ether",symbol:"ETH",decimals:18},
          rpcUrls:[RPC],
          blockExplorerUrls:[EXPLORER]
        }]
      });
    } else {
      throw e;
    }
  }
  provider = new ethers.BrowserProvider(window.ethereum);
  return true;
}

async function connect() {
  if (!window.ethereum) {
    status("NO INJECTED WALLET DETECTED. INSTALL METAMASK OR A COMPATIBLE WALLET.", "error");
    return;
  }
  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    await ensureChain();
    signer = await provider.getSigner();
    user = await signer.getAddress();
    $("connectBtn").textContent = short(user);
    $("connectBtn2").textContent = short(user);
    $("walletState").classList.add("hidden");
    $("nftGrid").classList.remove("hidden");
    $("stakeActions").classList.remove("hidden");
    $("manualFallback").classList.remove("hidden");
    status(`CONNECTED ${short(user)} · ROBINHOOD CHAIN`, "ok");
    await refreshWallet();
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(refreshDynamic, 12000);
  } catch (e) {
    console.error(e);
    status(e.shortMessage || e.message || "WALLET CONNECTION FAILED", "error");
  }
}

async function refreshDynamic() {
  await readStats();
  if (!user) return;
  try {
    const c = new ethers.Contract(STAKING, stakingAbi, readProvider);
    const [earned, count] = await Promise.all([c.earned(user), c.stakedCount(user)]);
    $("earned").textContent = `${fmt(earned, 12)} TSLA`;
    $("yourStaked").textContent = count.toString();
  } catch (e) { console.warn(e); }
}

async function fetchOwnedMoos(address) {
  let url = `${API}/addresses/${address}/nft?type=ERC-721`;
  let output = [];
  let guard = 0;
  while (url && guard++ < 10) {
    const r = await fetch(url, {headers:{"accept":"application/json"}});
    if (!r.ok) throw new Error(`Explorer NFT index returned ${r.status}`);
    const data = await r.json();
    for (const x of (data.items || [])) {
      const tokenAddr = lower(x?.token?.address_hash || x?.token?.address?.hash);
      if (tokenAddr !== lower(NFT)) continue;
      output.push(normalizeNft(x));
    }
    const p = data.next_page_params;
    if (!p) break;
    const q = new URLSearchParams(p);
    url = `${API}/addresses/${address}/nft?type=ERC-721&${q.toString()}`;
  }

  // Blockscout is discovery only; verify every result against ownerOf onchain.
  const n = new ethers.Contract(NFT, nftAbi, readProvider);
  const verified = [];
  for (const x of output) {
    try {
      const owner = await n.ownerOf(BigInt(x.id));
      if (lower(owner) === lower(address)) verified.push(x);
    } catch {}
  }
  return dedupe(verified);
}

function normalizeNft(x) {
  const image = ipfs(
    x.image_url ||
    x?.metadata?.image_url ||
    x?.metadata?.image ||
    ""
  );
  return {
    id:String(x.id ?? x.token_id ?? ""),
    image,
    name:x?.metadata?.name || `MooPunks #${x.id}`
  };
}

function dedupe(arr) {
  const m = new Map();
  arr.forEach(x => x.id && m.set(String(x.id), x));
  return [...m.values()].sort((a,b) => Number(a.id)-Number(b.id));
}

async function getTokenImage(id) {
  try {
    const r = await fetch(`${API}/tokens/${NFT}/instances/${id}`, {headers:{"accept":"application/json"}});
    if (r.ok) {
      const x = await r.json();
      return normalizeNft({...x,id:String(id)});
    }
  } catch {}
  return {id:String(id),image:"",name:`MooPunks #${id}`};
}

async function fetchStakedMoos(address) {
  const c = new ethers.Contract(STAKING, stakingAbi, readProvider);
  const ids = await c.getStakedTokens(address);
  const results = [];
  for (const id of ids) results.push(await getTokenImage(id.toString()));
  return results;
}

async function refreshWallet() {
  if (!user) return;
  clearStatus();
  status("READING YOUR MOO POSITIONS FROM CHAIN…", "pending");
  selected.clear();
  try {
    const [owned, staked] = await Promise.all([
      fetchOwnedMoos(user).catch(e => { console.warn("NFT discovery",e); return []; }),
      fetchStakedMoos(user)
    ]);
    availableItems = owned;
    stakedItems = staked;
    await refreshDynamic();
    render();
    status(`POSITIONS UPDATED · ${availableItems.length} AVAILABLE · ${stakedItems.length} STAKED`, "ok");
  } catch (e) {
    console.error(e);
    render();
    status("POSITION INDEXING FAILED. USE TOKEN ID FALLBACK OR REFRESH.", "error");
  }
}

function currentItems() {
  return tab === "available" ? availableItems : stakedItems;
}

function render() {
  const g = $("nftGrid");
  g.innerHTML = "";
  const list = currentItems();
  if (!list.length) {
    g.innerHTML = `<div class="empty" style="grid-column:1/-1">
      <span>${tab === "available" ? "NO AVAILABLE MOO FOUND" : "NO STAKED MOO"}</span>
      <h3>${tab === "available" ? "Nothing indexed here yet." : "No active position."}</h3>
      <p>${tab === "available" ? "If you own a MooPunk and it is not visible, use the token ID field below. Ownership is verified onchain before staking." : "Stake a MooPunk to start an onchain TSLA position."}</p>
    </div>`;
  }
  list.forEach(x => {
    const d = document.createElement("div");
    d.className = "nft-card" + (selected.has(x.id) ? " selected" : "");
    d.innerHTML = `${x.image ? `<img src="${x.image}" alt="MooPunk #${x.id}" onerror="this.outerHTML='<div class=&quot;image-fallback&quot;>#${x.id}</div>'">` : `<div class="image-fallback">#${x.id}</div>`}
      <span class="check">${selected.has(x.id) ? "✓" : ""}</span>
      <div><b>#${x.id}</b><span class="state">${tab === "available" ? "AVAILABLE" : "STAKED"}</span></div>`;
    d.onclick = () => {
      selected.has(x.id) ? selected.delete(x.id) : selected.add(x.id);
      render();
    };
    g.appendChild(d);
  });
  $("selectionText").textContent = `${selected.size} MOO SELECTED`;
  $("primaryAction").disabled = !selected.size;
  $("primaryAction").textContent = tab === "available" ? "STAKE SELECTED" : "UNSTAKE & CLAIM";
}

async function addManualToken() {
  if (!user) return;
  const id = $("manualTokenId").value.trim();
  if (!/^\d+$/.test(id)) {
    status("ENTER A VALID NUMERIC TOKEN ID.", "error");
    return;
  }
  try {
    if (tab === "available") {
      const n = new ethers.Contract(NFT, nftAbi, readProvider);
      const owner = await n.ownerOf(BigInt(id));
      if (lower(owner) !== lower(user)) throw new Error("This MooPunk is not in the connected wallet.");
      const item = await getTokenImage(id);
      availableItems = dedupe([...availableItems,item]);
    } else {
      const c = new ethers.Contract(STAKING, stakingAbi, readProvider);
      const ids = (await c.getStakedTokens(user)).map(x=>x.toString());
      if (!ids.includes(id)) throw new Error("This MooPunk is not staked by the connected wallet.");
      const item = await getTokenImage(id);
      stakedItems = dedupe([...stakedItems,item]);
    }
    $("manualTokenId").value = "";
    render();
  } catch (e) {
    status(e.shortMessage || e.message || "TOKEN CHECK FAILED", "error");
  }
}

async function stakeSelected() {
  const ids = [...selected].map(BigInt);
  if (!ids.length || !signer) return;
  const n = new ethers.Contract(NFT, nftAbi, signer);
  const c = new ethers.Contract(STAKING, stakingAbi, signer);
  try {
    const allApproved = await n.isApprovedForAll(user, STAKING);
    if (!allApproved) {
      for (let i=0;i<ids.length;i++) {
        const id = ids[i];
        const approved = await n.getApproved(id);
        if (lower(approved) !== lower(STAKING)) {
          status(`APPROVING MOO #${id.toString()} · ${i+1}/${ids.length}`, "pending");
          const tx = await n.approve(STAKING, id);
          status(`APPROVAL SUBMITTED FOR #${id.toString()}`, "pending", tx.hash);
          await tx.wait();
        }
      }
    }
    status(`STAKING ${ids.length} MOO${ids.length>1?"S":""}…`, "pending");
    const tx = await c.stake(ids);
    status("STAKE TRANSACTION SUBMITTED", "pending", tx.hash);
    await tx.wait();
    status("STAKE CONFIRMED ONCHAIN", "ok", tx.hash);
    await refreshWallet();
    await readStats();
  } catch (e) {
    console.error(e);
    status(e.shortMessage || e.reason || e.message || "STAKE FAILED", "error");
  }
}

async function unstakeSelected() {
  const ids = [...selected].map(BigInt);
  if (!ids.length || !signer) return;
  const c = new ethers.Contract(STAKING, stakingAbi, signer);
  try {
    status(`UNSTAKING ${ids.length} MOO${ids.length>1?"S":""} + CLAIMING TSLA…`, "pending");
    const tx = await c.unstakeAndClaim(ids);
    status("UNSTAKE TRANSACTION SUBMITTED", "pending", tx.hash);
    await tx.wait();
    status("NFT RETURNED + TSLA CLAIMED", "ok", tx.hash);
    await refreshWallet();
    await readStats();
  } catch (e) {
    console.error(e);
    status(e.shortMessage || e.reason || e.message || "UNSTAKE FAILED", "error");
  }
}

async function claimRewards() {
  if (!signer || !user) {
    await connect();
    if (!signer) return;
  }
  try {
    const c = new ethers.Contract(STAKING, stakingAbi, signer);
    const value = await c.earned(user);
    if (value === 0n) {
      status("NO TSLA REWARDS AVAILABLE TO CLAIM YET.", "error");
      return;
    }
    status(`CLAIMING ${fmt(value,12)} TSLA…`, "pending");
    const tx = await c.claim();
    status("CLAIM TRANSACTION SUBMITTED", "pending", tx.hash);
    await tx.wait();
    status("TSLA REWARD CLAIMED", "ok", tx.hash);
    await refreshDynamic();
    await readStats();
  } catch (e) {
    console.error(e);
    status(e.shortMessage || e.reason || e.message || "CLAIM FAILED", "error");
  }
}

document.querySelectorAll(".tab").forEach(b => b.onclick = () => {
  document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
  b.classList.add("active");
  tab = b.dataset.tab;
  selected.clear();
  render();
});

$("connectBtn").onclick = $("connectBtn2").onclick = connect;
$("primaryAction").onclick = () => tab === "available" ? stakeSelected() : unstakeSelected();
$("claimBtn").onclick = claimRewards;
$("refreshBtn").onclick = async () => { await readStats(); if(user) await refreshWallet(); };
$("addManualBtn").onclick = addManualToken;
$("manualTokenId").addEventListener("keydown", e => { if(e.key==="Enter") addManualToken(); });

if (window.ethereum) {
  window.ethereum.on?.("accountsChanged", () => location.reload());
  window.ethereum.on?.("chainChanged", () => location.reload());
}

readStats();
setInterval(readStats, 30000);

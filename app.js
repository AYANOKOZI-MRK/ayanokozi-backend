const API_URL = "https://ayanokozi-backend.onrender.com";
const BOT_USERNAME = "Tonm1_bot";
const FACEBOOK_URL = "https://www.facebook.com/418sfbb18x";
const WHATSAPP_NUMBER = "8801301578242";
const CHANNEL_URL = "https://t.me/Tonm1_bot";

const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

let user = tg?.initDataUnsafe?.user || {
  id: "demo_user",
  first_name: "Demo",
  username: ""
};

let currentUser = null;
let lastClaim = Date.now();

document.getElementById("username").innerText = user.first_name || "User";

async function api(path, data = {}) {
  const res = await fetch(API_URL + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telegramId: String(user.id),
      name: user.first_name || "User",
      username: user.username || "",
      ...data
    })
  });
  return await res.json();
}

async function loadUser() {
  try {
    const data = await api("/user");
    currentUser = data.user;

    document.getElementById("balance").innerText = Number(currentUser.balance || 0).toFixed(8);
    document.getElementById("power").innerText = currentUser.miningPower || 15;
    document.getElementById("ads").innerText = currentUser.adsWatched || 0;
    document.getElementById("refs").innerText = currentUser.referrals || 0;
    document.getElementById("mined").innerText = Number(currentUser.mined || 0).toFixed(6);
    document.getElementById("walletInput").value = currentUser.wallet || "";
    lastClaim = new Date(currentUser.lastClaim).getTime();
    renderHistory(data.withdraws || []);
  } catch (e) {
    document.getElementById("msg").innerText = "❌ Server connection failed";
  }
}

function liveMining() {
  if (!currentUser) return;
  const seconds = Math.floor((Date.now() - lastClaim) / 1000);
  const live = ((seconds * currentUser.miningPower) / 100000000).toFixed(8);
  document.getElementById("liveMine").innerText = live;
}

async function claim() {
  const data = await api("/claim");
  document.getElementById("msg").innerText = data.message;
  await loadUser();
}

async function watchAd() {
  const msg = document.getElementById("msg");
  msg.innerText = "Ad Loading...";
  try {
    if (typeof show_1107410707 === "function") {
      await show_1107410707();
    }
    const data = await api("/watch-ad");
    msg.innerText = data.message;
    await loadUser();
  } catch (e) {
    msg.innerText = "❌ Ad skipped or failed";
  }
}

async function taskReward() {
  window.open(CHANNEL_URL, "_blank");
  const data = await api("/task");
  document.getElementById("msg").innerText = data.message || "✅ Task completed";
  await loadUser();
}

function getReferralLink() {
  return `https://t.me/${BOT_USERNAME}/app?startapp=${user.id}`;
}

function copyReferral() {
  navigator.clipboard.writeText(getReferralLink()).then(() => {
    document.getElementById("msg").innerText = "✅ Referral link copied";
  }).catch(() => {
    document.getElementById("msg").innerText = "❌ Copy failed";
  });
}

function shareFB() {
  window.open(FACEBOOK_URL, "_blank");
}

function shareWhatsApp() {
  const text = encodeURIComponent("🚀 Join my TON Miner App and earn TON!\n" + getReferralLink());
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank");
}

async function saveWallet() {
  const wallet = document.getElementById("walletInput").value.trim();
  if (!wallet) return alert("Wallet address দিন");
  const data = await api("/save-wallet", { wallet });
  alert(data.message);
  await loadUser();
}

async function withdraw() {
  const amount = Number(document.getElementById("amountInput").value);
  const wallet = document.getElementById("walletInput").value.trim();
  const data = await api("/withdraw", { amount, wallet });
  alert(data.message);
  document.getElementById("amountInput").value = "";
  await loadUser();
}

function renderHistory(list) {
  const box = document.getElementById("history");
  if (!list.length) {
    box.innerHTML = "<p>No withdraw history</p>";
    return;
  }
  box.innerHTML = list.map(w => `
    <div class="history">
      <div>
        <b>-${Number(w.amount).toFixed(4)} TON</b>
        <small>${w.wallet ? w.wallet.slice(0, 16) : "No wallet"}...</small>
      </div>
      <span class="${String(w.status).toLowerCase()}">${w.status}</span>
    </div>
  `).join("");
}

function showPage(page) {
  const walletPage = document.getElementById("walletPage");
  if (page === "wallet") {
    walletPage.style.display = "block";
    window.scrollTo(0, walletPage.offsetTop);
  } else {
    walletPage.style.display = "none";
    window.scrollTo(0, 0);
  }
}

loadUser();
setInterval(liveMining, 1000);

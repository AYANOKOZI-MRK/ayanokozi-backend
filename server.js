require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI).then(() => console.log("MongoDB connected"));

const User = mongoose.model("User", new mongoose.Schema({
  telegramId: String,
  name: String,
  username: String,
  balance: { type: Number, default: 0 },
  miningPower: { type: Number, default: 15 },
  mined: { type: Number, default: 0 },
  adsWatched: { type: Number, default: 0 },
  referrals: { type: Number, default: 0 },
  wallet: { type: String, default: "" },
  lastClaim: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
}));

const Withdraw = mongoose.model("Withdraw", new mongoose.Schema({
  telegramId: String,
  amount: Number,
  wallet: String,
  status: { type: String, default: "Pending" },
  txid: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
}));

async function getUser(body) {
  let user = await User.findOne({ telegramId: body.telegramId });
  if (!user) {
    user = await User.create({
      telegramId: body.telegramId,
      name: body.name || "User",
      username: body.username || ""
    });
  }
  return user;
}

app.post("/user", async (req, res) => {
  try {
    const user = await getUser(req.body);
    const withdraws = await Withdraw.find({ telegramId: user.telegramId }).sort({ createdAt: -1 });
    res.json({ user, withdraws });
  } catch (e) { res.status(500).json({ message: "Server error" }); }
});

app.post("/claim", async (req, res) => {
  try {
    const user = await getUser(req.body);
    const now = Date.now();
    const seconds = Math.floor((now - new Date(user.lastClaim).getTime()) / 1000);
    const reward = Number(((seconds * user.miningPower) / 100000000).toFixed(8));
    user.balance += reward;
    user.mined += reward;
    user.lastClaim = new Date();
    await user.save();
    res.json({ message: `✅ Claimed ${reward} TON`, user });
  } catch (e) { res.status(500).json({ message: "Claim failed" }); }
});

app.post("/watch-ad", async (req, res) => {
  try {
    const user = await getUser(req.body);
    user.balance += 0.00001;
    user.adsWatched += 1;
    await user.save();
    res.json({ message: "✅ Ad reward added: 0.00001 TON", user });
  } catch (e) { res.status(500).json({ message: "Ad reward failed" }); }
});

app.post("/save-wallet", async (req, res) => {
  try {
    const user = await getUser(req.body);
    user.wallet = req.body.wallet || "";
    await user.save();
    res.json({ message: "✅ Wallet saved", user });
  } catch (e) { res.status(500).json({ message: "Wallet save failed" }); }
});

app.post("/withdraw", async (req, res) => {
  try {
    const user = await getUser(req.body);
    const amount = Number(req.body.amount);
    const wallet = req.body.wallet || user.wallet;
    if (!wallet) return res.json({ message: "❌ Wallet address required" });
    if (!amount || amount <= 0) return res.json({ message: "❌ Invalid amount" });
    if (amount < 0.1) return res.json({ message: "❌ Minimum withdraw 0.10 TON" });
    if (user.balance < amount) return res.json({ message: "❌ Not enough balance" });
    user.balance -= amount;
    await user.save();
    await Withdraw.create({ telegramId: user.telegramId, amount, wallet, status: "Pending" });
    res.json({ message: "✅ Withdraw request submitted", user });
  } catch (e) { res.status(500).json({ message: "Withdraw failed" }); }
});

app.get("/", (req, res) => res.send("TON Mining Backend Running"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on " + PORT));

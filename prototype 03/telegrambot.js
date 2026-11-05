// ======= Initialize Player Data =========
let player = {
  coins: 100000, // start with 100k coins for testing
  farmingLevel: 1,
  lastFarmingStart: null,
  lastFarmingClaim: null,
  farmingUpgradeCost: 60000,
  dailyLoginDay: 1,
  lastDailyLogin: null,
  emblem: "Silver",
  referralUsed: false,
};

// Update coins display and emblem
function updateUI() {
  document.getElementById("farmingLevel").textContent = player.farmingLevel;
  document.getElementById("upgradeCost").textContent = player.farmingUpgradeCost.toLocaleString();
  updateEmblem();
}

// Emblem logic based on coins
function updateEmblem() {
  let coinBalance = parseInt(localStorage.getItem("coinBalance")) || 0;

  let c = player.coins;
  let emblem = "Silver";
  if (c >= 250000000) emblem = "Emperial";
  else if (c >= 10000000) emblem = "Platinum";
  else if (c >= 500000) emblem = "Gold";
  else emblem = "Silver";
  player.emblem = emblem;
  document.getElementById("emblem").textContent = emblem;
}
function updateCoinDisplay() {
  document.getElementById("coin-balance").textContent = coinBalance;
}


// ====== COIN FARMING =======
const FARMING_BASE_COINS = 10000;
const FARMING_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours in ms
const FARMING_RATE_INCREASE = 0.4; // 40% increase per level

function canStartFarming() {
  if (!player.lastFarmingStart) return true;
  let now = Date.now();
  return now - player.lastFarmingStart >= FARMING_INTERVAL;
}

function startFarming() {
  if (!canStartFarming()) {
    alert("You must wait 4 hours before starting farming again.");
    return;
  }
  player.lastFarmingStart = Date.now();
  alert("Farming started! Come back in 4 hours to claim coins.");
  document.getElementById("startFarmingBtn").disabled = true;
  setTimeout(() => {
    document.getElementById("startFarmingBtn").disabled = false;
  }, FARMING_INTERVAL);
}

function claimFarming() {
  if (!player.lastFarmingStart) {
    alert("You haven't started farming yet.");
    return;
  }
  let now = Date.now();
  if (now - player.lastFarmingStart < FARMING_INTERVAL) {
    let remaining = ((FARMING_INTERVAL - (now - player.lastFarmingStart)) / 60000).toFixed(0);
    alert(`Please wait ${remaining} more minutes to claim farming coins.`);
    return;
  }
  // Calculate coins earned with farming rate upgrades
  let multiplier = 1 + (player.farmingLevel - 1) * FARMING_RATE_INCREASE;
  let earned = Math.floor(FARMING_BASE_COINS * multiplier);
  player.coins += earned;
  alert(`You earned ${earned.toLocaleString()} coins from farming!`);
  player.lastFarmingStart = null; // reset farming
  updateUI();
}

function upgradeFarming() {
  if (player.coins < player.farmingUpgradeCost) {
    alert("Not enough coins to upgrade farming.");
    return;
  }
  player.coins -= player.farmingUpgradeCost;
  player.farmingLevel++;
  // upgrade cost = previous + 35%
  player.farmingUpgradeCost = Math.floor(player.farmingUpgradeCost * 1.35);
  alert(`Farming upgraded to level ${player.farmingLevel}!`);
  updateUI();
}

// ===== ROCK PAPER SCISSORS =======
const RPS_CHOICES = ["rock", "paper", "scissors"];

function getBotChoice() {
  // Bot choice randomly
  return RPS_CHOICES[Math.floor(Math.random() * 3)];
}

function rpsResult(playerChoice, botChoice) {
  if (playerChoice === botChoice) return "draw";

  if (
    (playerChoice === "rock" && botChoice === "scissors") ||
    (playerChoice === "paper" && botChoice === "rock") ||
    (playerChoice === "scissors" && botChoice === "paper")
  ) return "win";

  return "lose";
}

function playRPS(playerChoice) {
  // Winning chance = 50%, so simulate chance here
  let winChance = 0.5;
  let rand = Math.random();
  let botChoice = getBotChoice();
  let resultText = `Bot chose ${botChoice}. `;

  if (rand < winChance) {
    // You win
    player.coins += 1500;
    resultText += "You win! Earned 1,500 coins.";
  } else {
    resultText += "You lose! Try again.";
  }
  document.getElementById("rpsResult").textContent = resultText;
  updateUI();
}

// ======= ROULETTE ========
function spinRoulette() {
  let betInput = document.getElementById("rouletteBet");
  let bet = Number(betInput.value);
  if (isNaN(bet) || bet < 100 || bet > 1000000) {
    alert("Please enter a bet between 100 and 1,000,000 coins.");
    return;
  }
  if (player.coins < bet) {
    alert("Not enough coins for that bet.");
    return;
  }

  player.coins -= bet;
  let winChance = 0.65;
  let rand = Math.random();
  let resultText = "";
  if (rand < winChance) {
    let winnings = bet * 3;
    player.coins += winnings;
    resultText = `You won! You earned ${winnings.toLocaleString()} coins!`;
  } else {
    resultText = `You lost ${bet.toLocaleString()} coins. Better luck next time!`;
  }
  document.getElementById("rouletteResult").textContent = resultText;
  updateUI();
}

// ====== WATCH VIDEO ========
function watchVideo() {
  // Just simulate video watch reward
  player.coins += 3000;
  document.getElementById("videoReward").textContent = "You earned 3,000 coins!";
  updateUI();
}

// ====== DAILY LOGIN =======
const DAILY_REWARDS = [100, 200, 300, 400, 500, 600, 700];

function claimDailyLogin() {
  let today = new Date().toDateString();
  if (player.lastDailyLogin === today) {
    document.getElementById("dailyStatus").textContent = "Already claimed today!";
    return;
  }

  if (player.lastDailyLogin) {
    let lastDate = new Date(player.lastDailyLogin);
    let diff = (new Date(today) - lastDate) / (1000 * 60 * 60 * 24);
    if (diff > 1) {
      // Missed day, reset week
      player.dailyLoginDay = 1;
    } else {
      // Continue week
      player.dailyLoginDay++;
      if (player.dailyLoginDay > 7) player.dailyLoginDay = 1;
    }
  }

  let reward = DAILY_REWARDS[player.dailyLoginDay - 1];
  player.coins += reward;
  player.lastDailyLogin = today;
  document.getElementById("dailyReward").textContent = reward.toLocaleString();
  document.getElementById("dailyStatus").textContent = `Claimed day ${player.dailyLoginDay} reward!`;
  updateUI();
}

// ===== REFERRAL ======
function submitReferral() {
  if (player.referralUsed) {
    document.getElementById("referralStatus").textContent = "Referral already used.";
    return;
  }

  let code = document.getElementById("referralCode").value.trim();
  if (!code) {
    alert("Please enter a referral code.");
    return;
  }

  // Simulate referral success
  player.coins += 15000;
  player.referralUsed = true;
  document.getElementById("referralStatus").textContent = "Referral accepted! You earned 15,000 coins.";
  updateUI();
}

// ======= EVENT LISTENERS =========
document.getElementById("startFarmingBtn").addEventListener("click", startFarming);
document.getElementById("upgradeFarmingBtn").addEventListener("click", upgradeFarming);

document.querySelectorAll("#rps-game button[data-choice]").forEach((btn) => {
  btn.addEventListener("click", () => {
    playRPS(btn.getAttribute("data-choice"));
  });
});

document.getElementById("spinRouletteBtn").addEventListener("click", spinRoulette);
document.getElementById("watchVideoBtn").addEventListener("click", watchVideo);
document.getElementById("claimDailyBtn").addEventListener("click", claimDailyLogin);
document.getElementById("submitReferralBtn").addEventListener("click", submitReferral);

// Initialize UI on load
updateUI();
document.getElementById("dailyReward").textContent = "-";

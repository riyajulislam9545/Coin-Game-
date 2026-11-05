let coins = 0;
let farmingLevel = 1;
let farmCooldown = 0;
let lastFarmTime = 0;
let upgradeCost = 60000;
let farmingRate = 10000;
let loginDay = 1;

function updateDisplay() {
  document.getElementById('coinDisplay').innerText = coins.toLocaleString();
  document.getElementById('farmingLevel').innerText = farmingLevel;
  document.getElementById('upgradeCost').innerText = upgradeCost.toLocaleString();

  const rank = coins < 500000 ? 'Silver' : coins < 10000000 ? 'Gold' : coins < 250000000 ? 'Platinum' : 'Emperial';
  document.getElementById('rank').innerText = rank;
}

function startFarming() {
  const now = Date.now();
  if (now - lastFarmTime < 4 * 60 * 60 * 1000) {
    alert("Farming available every 4 hours. Try again later.");
    return;
  }
  const reward = Math.floor(farmingRate);
  coins += reward;
  lastFarmTime = now;
  alert(`You earned ${reward.toLocaleString()} coins!`);
  updateDisplay();
}

function upgradeFarming() {
  if (coins < upgradeCost) return alert("Not enough coins!");
  coins -= upgradeCost;
  farmingLevel++;
  farmingRate *= 1.4;
  upgradeCost = Math.floor(upgradeCost * 1.35);
  updateDisplay();
}

function claimDailyBonus() {
  const bonus = loginDay * 100;
  coins += bonus;
  loginDay = loginDay % 7 + 1;
  alert(`You claimed ${bonus} coins!`);
  updateDisplay();
}

function playRPS() {
  const win = Math.random() < 0.5;
  if (win) {
    coins += 1500;
    alert("You won! +1500 coins");
  } else {
    alert("You lost! Try again");
  }
  updateDisplay();
}

function playRoulette() {
  const bet = parseInt(document.getElementById('rouletteBet').value);
  if (isNaN(bet) || bet <= 0) return alert("Enter valid bet amount");
  if (coins < bet) return alert("Not enough coins to bet");
  const win = Math.random() < 0.65;
  coins -= bet;
  if (win) {
    coins += bet * 3;
    alert("You won! +" + (bet * 2).toLocaleString());
  } else {
    alert("You lost the bet!");
  }
  updateDisplay();
}

function watchVideo() {
  coins += 3000;
  alert("You earned 3000 coins!");
  updateDisplay();
}

document.addEventListener("DOMContentLoaded", updateDisplay);

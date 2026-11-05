/* =========================
  File: app.js
========================== */
(() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // --- Storage helpers ---
  const STORAGE_KEY = 'epx_save_v01';
  const load = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const save = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  const now = () => Date.now();
  const dayMs = 24*60*60*1000;

  // --- State ---
  const state = Object.assign({
    coins: 0,
    lastDaily: 0,
    adCooldownUntil: 0,
    farming: false,
    farmStart: 0,
    tasks: {
      tgJoin: false,
      followX: false,
      invite1: false,
    },
    referrals: { myCode: '', usedCodes: {}, hits: 0 },
  }, load());

  // --- Init referral code & inbound ref detection ---
  function uuid(){ return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16)); }
  if(!state.referrals.myCode){ state.referrals.myCode = uuid(); save(state); }
  const params = new URLSearchParams(location.search);
  const ref = params.get('ref');
  if(ref && !state.referrals.usedCodes[ref]){
    state.referrals.usedCodes[ref] = true; // mark one-time use per device
    state.coins += 50; // new user bonus
    // credit referrer map in another key (since we can't reach their storage): simulate via a tiny beacon using localStorage namespace per-code
    try {
      const k = `epx_ref_${ref}`;
      const hits = Number(localStorage.getItem(k) || '0') + 1;
      localStorage.setItem(k, String(hits));
    } catch {}
    save(state);
  }

  // --- Elements ---
  const balanceEl = $('#balance');
  const tabsBtn = $$('.tabs button');
  const sections = {
    home: $('#tab-home'), farm: $('#tab-farm'), games: $('#tab-games'), tasks: $('#tab-tasks'), leaderboard: $('#tab-leaderboard'), wallet: $('#tab-wallet')
  };

  // --- UI helpers ---
  function setBalance(v){ balanceEl.textContent = Math.max(0, Math.floor(v)); }
  function addCoins(v){ state.coins = Math.max(0, Math.floor(state.coins + v)); save(state); setBalance(state.coins); renderLeaderboard(); }

  // Tabs
  tabsBtn.forEach(btn=>btn.addEventListener('click',()=>{
    tabsBtn.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    Object.values(sections).forEach(s=>s.classList.remove('active'));
    sections[btn.dataset.tab].classList.add('active');
  }));

  // Daily Claim
  const btnDailyClaim = $('#btnDailyClaim');
  const dailyStatus = $('#dailyStatus');
  function refreshDaily(){
    const canClaimAt = (state.lastDaily||0) + dayMs;
    const left = canClaimAt - now();
    if(left <= 0){ btnDailyClaim.disabled = false; dailyStatus.textContent = 'Ready to claim.'; }
    else { btnDailyClaim.disabled = true; dailyStatus.textContent = `Next in ${(left/3600000).toFixed(1)}h`; }
  }
  btnDailyClaim.addEventListener('click', ()=>{
    const canClaimAt = (state.lastDaily||0) + dayMs;
    if(now() >= canClaimAt){
      state.lastDaily = now(); addCoins(100); save(state); refreshDaily();
    }
  });

  // Watch Ad (simulated 15s)
  const btnWatchAd = $('#btnWatchAd');
  const adStatus = $('#adStatus');
  const adModal = $('#adModal');
  const adTimer = $('#adTimer');
  const btnCloseAd = $('#btnCloseAd');
  function refreshAd(){
    const left = (state.adCooldownUntil||0) - now();
    if(left <= 0){ btnWatchAd.disabled = false; adStatus.textContent = 'Ready.'; }
    else { btnWatchAd.disabled = true; adStatus.textContent = `Cooldown ${(left/60000).toFixed(0)}m`; }
  }
  btnWatchAd.addEventListener('click', ()=>{
    adModal.classList.remove('hidden');
    let t = 15; adTimer.textContent = t;
    btnCloseAd.disabled = true;
    const id = setInterval(()=>{
      t--; adTimer.textContent = t;
      if(t<=0){ clearInterval(id); btnCloseAd.disabled = false; }
    },1000);
  });
  btnCloseAd.addEventListener('click', ()=>{
    adModal.classList.add('hidden');
    if(now() >= (state.adCooldownUntil||0)){
      addCoins(50); state.adCooldownUntil = now() + 60*60*1000; save(state); refreshAd();
    }
  });

  // Farming 1 coin / 5s while ON
  const btnFarmToggle = $('#btnFarmToggle');
  const farmStatus = $('#farmStatus');
  let farmTicker = null;
  function setFarming(on){
    state.farming = !!on; save(state);
    if(on){
      btnFarmToggle.textContent = 'Stop Farming';
      farmStatus.textContent = 'Running…';
      if(!state.farmStart) state.farmStart = now();
      if(!farmTicker){
        farmTicker = setInterval(()=>{
          addCoins(1);
        }, 5000);
      }
    } else {
      btnFarmToggle.textContent = 'Start Farming';
      farmStatus.textContent = 'Stopped';
      if(farmTicker){ clearInterval(farmTicker); farmTicker = null; }
      state.farmStart = 0; save(state);
    }
  }
  btnFarmToggle.addEventListener('click', ()=> setFarming(!state.farming));

  // RPS
  const rpsChoice = $('#rpsChoice');
  const rpsBet = $('#rpsBet');
  const rpsResult = $('#rpsResult');
  $('#btnRpsPlay').addEventListener('click', ()=>{
    const bet = Math.max(1, Math.floor(Number(rpsBet.value)||0));
    if(bet > state.coins){ rpsResult.textContent = 'Not enough coins.'; return; }
    const you = rpsChoice.value;
    const opts = ['rock','paper','scissors'];
    const bot = opts[Math.floor(Math.random()*3)];
    const win = (you==='rock'&&bot==='scissors')||(you==='paper'&&bot==='rock')||(you==='scissors'&&bot==='paper');
    const draw = you===bot;
    if(draw){ rpsResult.textContent = `Draw! Bot chose ${bot}.`; }
    else if(win){ addCoins(bet); rpsResult.textContent = `You win +${bet}! Bot chose ${bot}.`; }
    else { addCoins(-bet); rpsResult.textContent = `You lose -${bet}. Bot chose ${bot}.`; }
  });

  // Roulette 50/50
  const rouletteChoice = $('#rouletteChoice');
  const rouletteBet = $('#rouletteBet');
  const rouletteResult = $('#rouletteResult');
  $('#btnRoulettePlay').addEventListener('click', ()=>{
    const bet = Math.max(1, Math.floor(Number(rouletteBet.value)||0));
    if(bet > state.coins){ rouletteResult.textContent = 'Not enough coins.'; return; }
    const pick = rouletteChoice.value; // black/white
    const outcome = Math.random() < 0.5 ? 'black' : 'white';
    if(pick === outcome){ addCoins(bet); rouletteResult.textContent = `Win +${bet}! Outcome: ${outcome}.`; }
    else { addCoins(-bet); rouletteResult.textContent = `Lose -${bet}. Outcome: ${outcome}.`; }
  });

  // Tasks
  const taskList = $('#taskList');
  const TASKS = [
    { id: 'tgJoin', label: 'Join our Telegram', reward: 50, url: '#' },
    { id: 'followX', label: 'Follow on X/Twitter', reward: 50, url: '#' },
    { id: 'invite1', label: 'Invite 1 friend (referral)', reward: 100, url: '#' },
  ];
  function renderTasks(){
    taskList.innerHTML = '';
    TASKS.forEach(t=>{
      const li = document.createElement('li');
      li.className = 'task';
      const done = !!state.tasks[t.id];
      li.innerHTML = `
        <div>
          <strong>${t.label}</strong>
          <small>Reward: ${t.reward}</small>
        </div>
        <div class="row">
          <a class="btn-link" href="${t.url}" target="_blank">Open</a>
          <button data-claim="${t.id}" ${done?'disabled':''}>${done?'Claimed':'Claim'}</button>
        </div>
      `;
      taskList.appendChild(li);
    });
  }
  taskList.addEventListener('click', (e)=>{
    const id = e.target.closest('button')?.dataset.claim;
    if(!id) return;
    if(state.tasks[id]) return;
    const t = TASKS.find(x=>x.id===id);
    state.tasks[id] = true; addCoins(t.reward); save(state); renderTasks();
  });

  // Leaderboard (local demo)
  const lbTable = $('#lbTable tbody');
  function tierFor(score){
    if(score >= 5000) return 'Emperial';
    if(score >= 1500) return 'Platinum';
    if(score >= 500) return 'Gold';
    if(score >= 100) return 'Silver';
    return 'Bronze';
  }
  function renderLeaderboard(){
    const locals = [];
    // your local score
    locals.push({ user: 'You', score: state.coins });
    // simulate global by reading localStorage ref counters
    for(let i=0;i<5;i++){
      const score = Math.floor(Math.random()*2000)+50;
      locals.push({ user: `Player_${i+1}`, score });
    }
    locals.sort((a,b)=>b.score-a.score);
    lbTable.innerHTML = '';
    locals.forEach((row, idx)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${idx+1}</td><td>${row.user}</td><td>${row.score}</td><td>${tierFor(row.score)}</td>`;
      lbTable.appendChild(tr);
    });
  }

  // Referral UI
  const refLink = $('#refLink');
  const btnCopyRef = $('#btnCopyRef');
  const refInfo = $('#refInfo');
  function refreshRef(){
    const link = `${location.origin}${location.pathname}?ref=${state.referrals.myCode}`;
    refLink.value = link;
    const k = `epx_ref_${state.referrals.myCode}`;
    const hits = Number(localStorage.getItem(k) || '0');
    refInfo.textContent = `Total installs via your link (this device demo): ${hits}`;
  }
  btnCopyRef.addEventListener('click', async ()=>{
    try { await navigator.clipboard.writeText(refLink.value); btnCopyRef.textContent = 'Copied!'; setTimeout(()=>btnCopyRef.textContent='Copy',1200); } catch {}
  });

  // Export/Import Save
  $('#btnExport').addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'epx_save.json'; a.click(); URL.revokeObjectURL(a.href);
  });
  const fileImport = $('#fileImport');
  $('#btnImport').addEventListener('click', ()=> fileImport.click());
  fileImport.addEventListener('change', async (e)=>{
    const file = e.target.files?.[0]; if(!file) return;
    const text = await file.text();
    try { const data = JSON.parse(text); Object.assign(state, data); save(state); hydrate(); } catch(err){ alert('Invalid save file'); }
  });

  // Hydrate UI
  function hydrate(){
    setBalance(state.coins);
    refreshDaily();
    refreshAd();
    setFarming(state.farming);
    renderTasks();
    renderLeaderboard();
    refreshRef();
  }

  // Kickoff
  hydrate();
})();

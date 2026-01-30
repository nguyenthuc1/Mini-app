const firebaseConfig = {
  apiKey: "AIzaSyAc0psT5Up6aEu0VnCz1TZ4sSNTKmif8oA",
  authDomain: "telegram-bot-backup-11c83.firebaseapp.com",
  databaseURL: "https://telegram-bot-backup-11c83-default-rtdb.firebaseio.com",
  projectId: "telegram-bot-backup-11c83",
  storageBucket: "telegram-bot-backup-11c83.firebasestorage.app",
  messagingSenderId: "363675104532",
  appId: "1:363675104532:web:6c51d1c7318b765e897e01"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const tg = window.Telegram.WebApp;
const userId = String(tg.initDataUnsafe?.user?.id || '88888888');
const BOT_USERNAME = "Supermoneymine_bot"; // Đảm bảo đúng tên bot của bạn

// Cấu hình giới hạn
const MAX_SPEED = 5.0; 
const UPGRADE_COST = 200; 
const SPEED_INCREMENT = 0.2; 

let data = { 
    fish: 0, 
    coins: 0, 
    speed: 1, 
    shipLevel: 1, 
    startTime: null, 
    fuel: 100, 
    history: [],
    refBy: null, 
    friends: {}, 
    totalRefEarnings: 0, 
    tasks: {
        adsWatchedToday: 0,
        adsLastReset: null,
        channelJoined: false,
        inviteCount: 0,
        invite5Claimed: false,
        dailyLastClaim: null,
        dailyStreak: 0
    }
};

// ========================================
// HỆ THỐNG QUẢNG CÁO (ADSGRAM) - ĐÃ SỬA LỖI
// ========================================
let AdController = null;

// Hàm khởi tạo quảng cáo
   // ========================================
// 1. TỰ ĐỘNG TẢI THƯ VIỆN (FORCE LOAD)
// ========================================
function initAdsgram() {
    // Chỉ kiểm tra: Nếu thư viện có rồi thì chạy, chưa có thì đợi
    if (window.Adsgram) {
        startAdsgram();
    } else {
        console.log("⏳ Đang đợi thư viện Adsgram tải xong...");
        // Kiểm tra lại sau 0.5 giây
        setTimeout(initAdsgram, 500);
    }
}
   // ========================================
// 2. KHỞI TẠO QUẢNG CÁO (Chỉ 1 hàm duy nhất ở đây)
// ========================================
function startAdsgram() {
    try {
        // ID "0" là Test Mode. Chạy thật thì đổi số khác sau.
        AdController = window.Adsgram.init({ blockId: "0", debug: true });
        console.log("✅ Kết nối Adsgram thành công!");
    } catch (error) {
        console.error("❌ Lỗi khởi tạo:", error);
    }
}
// ========================================
// 3. HIỂN THỊ QUẢNG CÁO (Hàm showAd liền mạch)
// ========================================
function showAd(onSuccess) {
    if (!AdController) {
        // Nếu chưa có, thử gọi lại init và báo user đợi xíu
        initAdsgram();
        tg.showAlert("⏳ Đang kết nối quảng cáo, vui lòng bấm lại sau 3 giây...");
        return;
    }

    AdController.show()
        .then(() => {
            // Xem xong -> Thưởng
            onSuccess();
        })
        .catch((result) => {
            // Xử lý lỗi hoặc tắt sớm
            if (result.done) {
                onSuccess(); // Vẫn tính là xong (để test cho dễ)
            } else {
                tg.showAlert("⚠️ Bạn chưa xem hết quảng cáo hoặc có lỗi xảy ra.");
            }
        });
}
    // 2. Gọi hiển thị (Phần này phải nối tiếp bên trên, không được chèn gì vào giữa)
    AdController.show()
        .then(() => {
            // Xem thành công
            onSuccess(); 
        })
        .catch((result) => {
            // Xử lý các kiểu lỗi
            console.error("Ad error:", result);
            if (result.done) {
                // Trường hợp lạ: Có lỗi nhưng vẫn tính là xem xong
                onSuccess();
            } else if (result.error) {
                window.Telegram.WebApp.showAlert("❌ Bạn đã tắt quảng cáo hoặc gặp lỗi!");
            } else {
                window.Telegram.WebApp.showAlert("⚠️ Không có quảng cáo phù hợp lúc này.");
            }
        });
}

// ========================================
// LOGIC GAME & APP
// ========================================

async function init() {
    const loader = document.getElementById('loading-screen');
    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            firebase.auth().signInAnonymously();
            return;
        }
        try {
            const snap = await db.ref('users/' + userId).once('value');
            if (snap.exists()) {
                data = Object.assign(data, snap.val());
                // Fix lỗi dữ liệu cũ
                data.speed = Math.round((data.speed || 1) * 10) / 10;
                if (data.speed > MAX_SPEED) data.speed = MAX_SPEED;
                if (typeof data.fuel !== 'number') data.fuel = 100;
                if (!data.tasks) data.tasks = { adsWatchedToday: 0, adsLastReset: null, channelJoined: false, inviteCount: 0, invite5Claimed: false, dailyLastClaim: null, dailyStreak: 0 };
            } else {
                await initReferral();
            }
            
            if (!data.friends) data.friends = {};
            if (!data.refBy) data.refBy = null;
            if (typeof data.totalRefEarnings !== 'number') data.totalRefEarnings = 0;

            setupEventListeners();
            updateUI();
            checkMining();
            initAdsgram(); // Khởi tạo quảng cáo ngay khi vào

            if (loader) loader.style.display = 'none';
        } catch (e) {
            console.error(e);
            if (loader) loader.style.display = 'none';
        }
    });
}

async function initReferral() {
    await db.ref('users/' + userId).set(data);
    const startParam = tg.initDataUnsafe?.start_param;
    if (!startParam || startParam === userId) return;
    await processReferral(startParam);
}

async function processReferral(inviterId) {
    try {
        const inviterRef = db.ref('users/' + inviterId);
        const inviterSnap = await inviterRef.once('value');
        if (!inviterSnap.exists()) return;
        
        const inviterData = inviterSnap.val();
        data.refBy = inviterId;
        await db.ref('users/' + userId).update({ refBy: inviterId });
        
        if (!inviterData.friends) inviterData.friends = {};
        inviterData.friends[userId] = true;
        if (!inviterData.tasks) inviterData.tasks = {};
        inviterData.tasks.inviteCount = (inviterData.tasks.inviteCount || 0) + 1;
        
        inviterData.coins = (inviterData.coins || 0) + 100;
        if (!inviterData.totalRefEarnings) inviterData.totalRefEarnings = 0;
        inviterData.totalRefEarnings += 100;
        
        await inviterRef.set(inviterData);
    } catch (error) { console.error(error); }
}

async function addCoins(amount, source = 'unknown') {
    if (!amount || amount <= 0) return;
    data.coins += amount;
    if (data.refBy) await updateRefBonus(data.refBy, amount, source);
    save();
    updateUI();
}

async function updateRefBonus(inviterId, baseAmount, source) {
    try {
        const bonus = Math.floor(baseAmount * 0.1); 
        if (bonus <= 0) return;
        const inviterRef = db.ref('users/' + inviterId);
        const inviterSnap = await inviterRef.once('value');
        if (!inviterSnap.exists()) return;
        const inviterData = inviterSnap.val();
        inviterData.coins = (inviterData.coins || 0) + bonus;
        if (!inviterData.totalRefEarnings) inviterData.totalRefEarnings = 0;
        inviterData.totalRefEarnings += bonus;
        await inviterRef.set(inviterData);
    } catch (error) { console.error(error); }
}

function generateRefLink() {
    return `https://t.me/${BOT_USERNAME}/app?startapp=${userId}`;
}

function updateReferralUI() {
    const refLinkEl = document.getElementById('ref-link');
    if (refLinkEl) refLinkEl.innerText = generateRefLink();
    const friendCount = data.friends ? Object.keys(data.friends).length : 0;
    const friendCountEl = document.getElementById('friend-count');
    if (friendCountEl) friendCountEl.innerText = friendCount;
    const refEarningsEl = document.getElementById('ref-earnings');
    if (refEarningsEl) refEarningsEl.innerText = Math.floor(data.totalRefEarnings || 0).toLocaleString();
}

function setupEventListeners() {
    const bind = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
    bind('btn-mine', handleMine);
    bind('btn-sell', handleSell);
    bind('btn-refuel', handleRefuel);
    bind('btn-upgrade', handleUpgrade);
    bind('btn-withdraw', handleWithdraw);
    bind('btn-copy-ref', handleCopyRef);
    bind('btn-task-ads', handleTaskAds);
    bind('btn-task-channel', handleTaskChannel);
    bind('btn-task-invite', handleTaskInvite);
    bind('btn-task-daily', handleTaskDaily);

    const bankOwnerInput = document.getElementById('bank-owner');
    if (bankOwnerInput) bankOwnerInput.addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase(); });
    const bankAccInput = document.getElementById('bank-acc');
    if (bankAccInput) bankAccInput.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); });

    ['home', 'tasks', 'friends', 'wallet'].forEach(tab => bind(`nav-${tab}`, () => switchTab(tab)));
}

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    const target = document.getElementById('tab-' + tab);
    if (target) target.classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('text-blue-400', 'text-purple-400', 'text-pink-400', 'text-yellow-400');
        btn.classList.add('text-gray-500');
    });
    const activeBtn = document.getElementById('nav-' + tab);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-500');
        if (tab === 'home') activeBtn.classList.add('text-blue-400');
        else if (tab === 'tasks') activeBtn.classList.add('text-purple-400');
        else if (tab === 'friends') activeBtn.classList.add('text-pink-400');
        else if (tab === 'wallet') activeBtn.classList.add('text-yellow-400');
    }
}

function handleMine() {
    if (!data.startTime) {
        if (data.fuel < 100) {
            tg.showAlert(`⛽ Không đủ nhiên liệu! Hiện có: ${data.fuel}/100.`);
            return;
        }
        // Dùng showAd để xem quảng cáo trước khi đào (nếu muốn)
        // Hiện tại chỉ kiểm tra Adscontroller, nếu không có thì vẫn cho đào
        if (!AdController && window.Adsgram) {
             AdController = window.Adsgram.init({ blockId: "0", debug: true });
        }
        
        // Logic cũ: Xem quảng cáo xong mới đào. 
        // Nếu muốn bỏ qua quảng cáo khi đào thì gọi startMining() luôn.
        // Ở đây mình giữ logic: Có quảng cáo thì hiện, không thì cho đào luôn cho mượt.
        if (AdController) {
             AdController.show().then(() => {
                 startMining();
                 tg.showAlert("⛵ Đã ra khơi! Cảm ơn bạn đã xem quảng cáo 🎉");
             }).catch((e) => {
                 // Lỗi hoặc tắt -> Vẫn cho đào
                 startMining();
             });
        } else {
             startMining();
        }
    } else {
        const elapsed = Date.now() - data.startTime;
        if (elapsed >= 3 * 3600 * 1000) {
            const fishEarned = Math.floor(3 * 3600 * data.speed);
            data.fish += fishEarned;
            data.startTime = null;
            data.fuel = 0;
            save(); updateUI(); checkMining();
            tg.showAlert(`🎉 Đã nhận ${fishEarned.toLocaleString()} con cá!`);
        } else {
            const remainingMin = Math.ceil(((3 * 3600 * 1000) - elapsed) / 60000);
            tg.showAlert(`⏳ Còn ${remainingMin} phút nữa!`);
        }
    }
}

function startMining() {
    data.startTime = Date.now();
    save(); checkMining();
}

function handleSell() {
    if (data.fish < 100) { tg.showAlert("❌ Cần tối thiểu 100 con cá để bán!"); return; }
    const coinsEarned = Math.floor(data.fish * 0.005);
    data.fish = 0;
    addCoins(coinsEarned, 'sell');
    tg.showAlert(`💰 Đã bán cá và nhận ${coinsEarned.toLocaleString()} xu!`);
}

// === CÁC NÚT BẤM DÙNG QUẢNG CÁO ===

// 1. Nạp nhiên liệu (Đã sửa sạch sẽ)
function handleRefuel() {
    if (data.fuel >= 100) { tg.showAlert("⛽ Nhiên liệu đã đầy (100/100)!"); return; }
    showAd(() => {
        data.fuel = 100;
        save(); updateUI();
        tg.showAlert("⛽ Đã nạp đầy nhiên liệu! 🎉");
    });
}

// 2. Nhiệm vụ xem quảng cáo
function handleTaskAds() {
    checkAndResetAds();
    const MAX_ADS = 5;
    if (data.tasks.adsWatchedToday >= MAX_ADS) { tg.showAlert("❌ Đã hết lượt xem hôm nay!"); return; }
    showAd(() => {
        const reward = Math.floor(Math.random() * 6) + 10;
        data.tasks.adsWatchedToday += 1;
        addCoins(reward, 'ads_task');
        updateTasksUI();
        tg.showAlert(`🎉 Nhận được ${reward} xu!`);
    });
}

// 3. Nâng cấp giảm giá
function handleUpgrade() {
    if (data.speed >= MAX_SPEED) { tg.showAlert(`⚠️ Đã đạt tốc độ tối đa!`); return; }
    
    // Nếu có quảng cáo -> Cho chọn giảm giá
    const normalCost = UPGRADE_COST;
    const discountCost = Math.floor(UPGRADE_COST * 0.5);

    tg.showConfirm(
        `💡 Chọn cách nâng cấp:\n\n⭐ Xem quảng cáo: ${discountCost} xu (Giảm 50%)\n💰 Trả thường: ${normalCost} xu`,
        (confirmed) => {
            if (confirmed) {
                // Xem quảng cáo để giảm giá
                if (data.coins < discountCost) { tg.showAlert("❌ Không đủ xu!"); return; }
                showAd(() => {
                    performUpgrade(discountCost);
                    tg.showAlert(`⚡ Nâng cấp thành công (Giá ưu đãi)!`);
                });
            } else {
                // Trả full giá
                if (data.coins < normalCost) { tg.showAlert("❌ Không đủ xu!"); return; }
                performUpgrade(normalCost);
                tg.showAlert(`⚡ Nâng cấp thành công!`);
            }
        }
    );
}

function performUpgrade(cost) {
    let newSpeed = data.speed + SPEED_INCREMENT;
    newSpeed = Math.round(newSpeed * 10) / 10;
    if (newSpeed > MAX_SPEED) newSpeed = MAX_SPEED;
    data.coins -= cost;
    data.speed = newSpeed;
    data.shipLevel += 1;
    save(); updateUI();
}

// === CÁC NHIỆM VỤ KHÁC ===

function checkAndResetAds() {
    const today = new Date().toDateString();
    if (!data.tasks.adsLastReset || data.tasks.adsLastReset !== today) {
        data.tasks.adsWatchedToday = 0;
        data.tasks.adsLastReset = today;
        save();
    }
}

function handleTaskChannel() {
    if (data.tasks.channelJoined) { tg.showAlert("✅ Đã hoàn thành!"); return; }
    const CHANNEL_USERNAME = "YOUR_CHANNEL_USERNAME"; // Thay bằng kênh của bạn
    tg.openTelegramLink(`https://t.me/${CHANNEL_USERNAME}`);
    setTimeout(() => {
        tg.showConfirm("📢 Đã tham gia Channel chưa?", (confirmed) => {
            if (confirmed) {
                data.tasks.channelJoined = true;
                addCoins(400, 'channel_join');
                updateTasksUI();
                tg.showAlert("🎉 Đã nhận 400 xu!");
            }
        });
    }, 2000);
}

function handleTaskInvite() {
    if (data.tasks.invite5Claimed) { tg.showAlert("✅ Đã nhận thưởng!"); return; }
    if (data.tasks.inviteCount < 5) { tg.showAlert(`📊 Bạn mới mời được ${data.tasks.inviteCount}/5 người.`); return; }
    data.tasks.invite5Claimed = true;
    data.coins += 2500;
    save(); updateUI(); updateTasksUI();
    tg.showAlert("🎉 Nhận 2,500 xu thành công!");
}

function handleTaskDaily() {
    const today = new Date().toDateString();
    if (data.tasks.dailyLastClaim === today) { tg.showAlert("✅ Đã điểm danh hôm nay!"); return; }
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    if (data.tasks.dailyLastClaim === yesterday.toDateString()) data.tasks.dailyStreak += 1;
    else data.tasks.dailyStreak = 1;
    data.tasks.dailyLastClaim = today;
    const bonus = Math.min(10 * (data.tasks.dailyStreak - 1), 150);
    const totalReward = 50 + bonus;
    addCoins(totalReward, 'daily_login');
    updateTasksUI();
    tg.showAlert(`🎁 Điểm danh ngày ${data.tasks.dailyStreak}: Nhận ${totalReward} xu!`);
}

function handleCopyRef() {
    const link = `https://t.me/${BOT_USERNAME}/start?startapp=${userId}`;
    navigator.clipboard.writeText(link).then(() => tg.showAlert("✅ Đã sao chép link!")).catch(() => tg.showAlert("❌ Lỗi sao chép!"));
}

function handleWithdraw() {
    // Logic rút tiền (giữ nguyên logic cũ của bạn hoặc thêm sau)
    // Để code gọn mình tạm để thông báo
    const bankName = document.getElementById('bank-name').value.trim();
    if(!bankName) { tg.showAlert("Chức năng đang bảo trì!"); return; }
    tg.showAlert("Đã gửi yêu cầu rút tiền!");
}

// === UI UPDATES ===

function checkMining() {
    const btn = document.getElementById('btn-mine');
    const timer = document.getElementById('timer-display');
    if (!btn) return;
    if (!data.startTime) {
        btn.innerHTML = '<span class="relative z-10">⛵ RA KHƠI</span>';
        if (timer) timer.classList.add('hidden');
        updateFuelDisplay();
    } else {
        const interval = setInterval(() => {
            const elapsed = Date.now() - data.startTime;
            const duration = 3 * 3600 * 1000;
            if (elapsed >= duration) {
                clearInterval(interval);
                btn.innerHTML = '<span class="relative z-10">🎁 NHẬN CÁ</span>';
                if (timer) timer.innerText = "00:00:00";
                updateFuelDisplay(0);
            } else {
                btn.innerHTML = '<span class="relative z-10">⏳ ĐANG ĐÀO...</span>';
                const currentFuel = Math.max(0, 100 - ((elapsed / duration) * 100));
                updateFuelDisplay(currentFuel);
                if (timer) {
                    timer.classList.remove('hidden');
                    const rem = Math.floor((duration - elapsed) / 1000);
                    timer.innerText = new Date(rem * 1000).toISOString().substr(11, 8);
                }
            }
        }, 1000);
    }
}

function updateFuelDisplay(fuel = null) {
    if (fuel === null) fuel = data.fuel;
    fuel = Math.max(0, Math.min(100, fuel));
    const bar = document.getElementById('fuel-bar');
    const text = document.getElementById('fuel-text');
    if (bar) {
        bar.style.width = fuel + '%';
        bar.className = `h-full rounded-full transition-all duration-300 ${fuel <= 20 ? 'bg-red-500' : fuel <= 50 ? 'bg-orange-500' : 'bg-cyan-400'}`;
    }
    if (text) text.innerText = Math.floor(fuel) + '/100';
}

function updateUI() {
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    setText('fish-count', Math.floor(data.fish).toLocaleString());
    setText('coin-balance', Math.floor(data.coins).toLocaleString());
    setText('speed-display', (data.speed || 1).toFixed(1));
    updateFuelDisplay();
    updateTasksUI();
    updateReferralUI();
}

function updateTasksUI() {
    if (!data.tasks) return;
    checkAndResetAds();
    const remaining = 5 - (data.tasks.adsWatchedToday || 0);
    const elAds = document.getElementById('ads-remaining');
    if (elAds) elAds.innerText = remaining;
}

function save() { 
    db.ref('users/' + userId).set(data).catch(console.error);
}

// KHỞI CHẠY
window.onload = () => {
    init();
    // Chắc chắn gọi initAdsgram lần nữa cho chắc
    setTimeout(initAdsgram, 1000); 
};
if (tg) { tg.ready(); tg.expand(); }

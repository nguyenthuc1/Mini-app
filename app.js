// 0. CẤU HÌNH SUPABASE (Dán URL và Key của bạn vào đây)
const SUPABASE_URL = 'DÁN_PROJECT_URL_CỦA_BẠN';
const SUPABASE_KEY = 'DÁN_ANON_KEY_CỦA_BẠN';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// 1. ĐỊNH DANH USER (Lấy ID duy nhất của Telegram)
const userId = tg.initDataUnsafe?.user?.id || 'guest_user';

// 2. CẤU HÌNH GAME
const UPGRADE_COSTS = [500, 1000, 2000, 4000, 7000, 12000, 18000, 25000, 35000, 50000, 70000, 100000, 140000, 190000, 250000];
const MAX_UPGRADES = UPGRADE_COSTS.length;
const MINING_DURATION = 3 * 60 * 60 * 1000;
const GLOBAL_RATIO = 0.00463;

// 3. KHỞI TẠO BIẾN DỮ LIỆU TẠM (Sẽ được ghi đè khi tải từ Server)
let data = {
    fish: 0,
    coins: 0,
    miningSpeed: 0.5,
    upgradeCount: 0,
    startTime: null,
    history: []
};

// --- HÀM CỐT LÕI: TẢI & LƯU SERVER ---

async function loadDataFromServer() {
    try {
        let { data: userRow, error } = await supabaseClient
            .from('users_data')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (userRow) {
            data = {
                fish: parseFloat(userRow.fish),
                coins: parseInt(userRow.coins),
                miningSpeed: parseFloat(userRow.mining_speed),
                upgradeCount: parseInt(userRow.upgrade_count),
                startTime: userRow.start_time,
                history: userRow.history || []
            };
        } else {
            // Nếu là người dùng mới, tạo bản ghi mới trên Supabase
            await supabaseClient.from('users_data').insert([{ user_id: userId, fish: 0, coins: 0 }]);
        }
        updateUI();
        checkOfflineMining();
        updateHistoryUI();
    } catch (e) { console.error("Lỗi tải dữ liệu:", e); }
}

async function syncToServer() {
    // Lưu mọi thứ lên server để chống hack
    await supabaseClient.from('users_data').upsert({
        user_id: userId,
        fish: data.fish,
        coins: data.coins,
        mining_speed: data.miningSpeed,
        upgrade_count: data.upgradeCount,
        start_time: data.startTime,
        history: data.history
    });
}

// --- LOGIC GAME (GIỮ NGUYÊN NHƯ BẢN CỦA BẠN) ---

function updateUI() {
    let currentFish = data.fish;
    if (data.startTime) {
        const elapsed = (Date.now() - parseInt(data.startTime)) / 1000;
        currentFish = data.fish + (elapsed * data.miningSpeed);
    }
    const totalFish = Math.floor(Math.max(0, currentFish));

    if (document.getElementById('fish-count')) document.getElementById('fish-count').innerText = totalFish.toLocaleString();
    if (document.getElementById('coin-balance')) document.getElementById('coin-balance').innerText = data.coins.toLocaleString();
    if (document.getElementById('ship-level')) document.getElementById('ship-level').innerText = (data.upgradeCount + 1);
    
    // Cập nhật các hiển thị khác... (giữ code cũ của bạn)
    const btnUpgrade = document.getElementById('btn-upgrade');
    if (btnUpgrade) {
        if (data.upgradeCount >= MAX_UPGRADES) {
            btnUpgrade.innerText = "MAX LEVEL"; btnUpgrade.disabled = true;
        } else {
            btnUpgrade.innerText = `NÂNG CẤP (${UPGRADE_COSTS[data.upgradeCount].toLocaleString()} 💰)`;
        }
    }
}

function handleSell() {
    let currentTotalFish = data.fish;
    let minedSoFar = 0;
    if (data.startTime) {
        const elapsed = (Date.now() - parseInt(data.startTime)) / 1000;
        minedSoFar = elapsed * data.miningSpeed;
        currentTotalFish += minedSoFar;
    }

    const earnings = Math.floor(currentTotalFish * GLOBAL_RATIO);
    if (earnings >= 1) {
        const fishUsed = earnings / GLOBAL_RATIO;
        data.coins += earnings;
        data.fish = (currentTotalFish - fishUsed) - (minedSoFar);

        updateUI();
        syncToServer(); // Lưu lên Server thay vì saveData()
        tg.showAlert(`💰 Nhận được ${earnings.toLocaleString()} xu!`);
    } else {
        tg.showAlert("❌ Chưa đủ cá!");
    }
}

function handleUpgrade() {
    const cost = UPGRADE_COSTS[data.upgradeCount];
    if (data.coins >= cost) {
        data.coins -= cost;
        data.upgradeCount++;
        data.miningSpeed += 0.5;
        updateUI();
        syncToServer(); // Đồng bộ lên server ngay
        tg.showAlert("🚀 Nâng cấp thành công!");
    } else {
        tg.showAlert("❌ Không đủ xu!");
    }
}

// --- CÁC HÀM KHÁC (GIỮ NGUYÊN: startAds, checkOfflineMining, handleWithdraw...) ---

function startAds() {
    if (data.startTime) return;
    const btnMine = document.getElementById('btn-mine');
    btnMine.innerText = "ĐANG XEM ADS...";
    setTimeout(() => {
        data.startTime = Date.now();
        syncToServer(); // Lưu mốc thời gian bắt đầu đào
        checkOfflineMining();
    }, 2000);
}

// KHỞI CHẠY
window.onload = () => {
    loadDataFromServer(); // Tải từ Server khi vào Game
    
    document.getElementById('btn-mine')?.addEventListener('click', startAds);
    document.getElementById('btn-sell')?.addEventListener('click', handleSell);
    document.getElementById('btn-upgrade')?.addEventListener('click', handleUpgrade);
    document.getElementById('btn-withdraw')?.addEventListener('click', handleWithdraw);
};

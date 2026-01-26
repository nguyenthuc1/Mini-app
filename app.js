// --- 0. CẤU HÌNH SUPABASE ---
const SUPABASE_URL = 'https://icfirearfofkosodtmii.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_uwAvdH2z8vC56pwTgmXulQ_ciRf8iGf';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// --- 1. BIẾN TOÀN CỤC ---
const userId = tg.initDataUnsafe?.user?.id || 'guest_user';
const UPGRADE_COSTS = [500, 1000, 2000, 4000, 7000, 12000, 18000, 25000, 35000, 50000, 70000, 100000, 140000, 190000, 250000];
const MINING_DURATION = 3 * 60 * 60 * 1000;
const GLOBAL_RATIO = 0.00463;

let data = { fish: 0, coins: 0, miningSpeed: 0.5, upgradeCount: 0, startTime: null, history: [] };
let tInterval;

// --- 2. HÀM ĐỒNG BỘ DỮ LIỆU ---

        async function loadDataFromServer() {
    // Hiển thị trạng thái đang tải (tùy chọn)
    console.log("Đang tải dữ liệu từ Server...");
    
    try {
        let { data: userRow, error } = await supabaseClient
            .from('users_data')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (userRow) {
            data = {
                fish: parseFloat(userRow.fish) || 0,
                coins: parseInt(userRow.coins) || 0,
                miningSpeed: parseFloat(userRow.mining_speed) || 0.5,
                upgradeCount: parseInt(userRow.upgrade_count) || 0,
                startTime: userRow.start_time,
                history: userRow.history || []
            };
            console.log("Tải dữ liệu thành công!");
        } else {
            // Nếu là người dùng mới hoàn toàn
            await supabaseClient.from('users_data').insert([{ user_id: userId, fish: 0, coins: 0, mining_speed: 0.5 }]);
        }
        
        // CẬP NHẬT GIAO DIỆN SAU KHI ĐÃ CÓ DATA
        updateUI();
        checkOfflineMining();
        updateHistoryUI();
        
    } catch (e) { 
        console.error("Lỗi kết nối Server:", e);
        // Nếu lỗi Server, có thể dùng tạm LocalStorage làm dự phòng (Backup)
        const backup = JSON.parse(localStorage.getItem('backup_data'));
        if(backup) data = backup;
    }
}

async function sync() {
    // 1. Lưu dự phòng vào máy để mở app là có ngay
    localStorage.setItem('backup_data', JSON.stringify(data));

    // 2. Đẩy lên Server để bảo mật
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

// --- 3. GIAO DIỆN VÀ TAB ---

function switchTab(name) {
    // Ẩn tất cả tab
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    // Hiện tab được chọn
    document.getElementById(`tab-${name}`)?.classList.remove('hidden');
    
    // Đổi màu icon điều hướng
    document.querySelectorAll('.nav-item').forEach(n => {
        n.classList.replace('text-blue-400', 'text-gray-500');
    });
    document.getElementById(`nav-${name}`)?.classList.replace('text-gray-500', 'text-blue-400');
}

function updateUI() {
    let currentTotalFish = data.fish;
    if (data.startTime) {
        const elapsed = (Date.now() - parseInt(data.startTime)) / 1000;
        currentTotalFish += (elapsed * data.miningSpeed);
    }
    const totalFishInt = Math.floor(Math.max(0, currentTotalFish));

    // Hiển thị các chỉ số
    document.getElementById('fish-count').innerText = totalFishInt.toLocaleString();
    document.getElementById('coin-balance').innerText = data.coins.toLocaleString();
    document.getElementById('wallet-coin-balance').innerText = data.coins.toLocaleString();
    document.getElementById('mining-speed').innerText = `${data.miningSpeed.toFixed(1)} cá/s`;
    document.getElementById('ship-level').innerText = data.upgradeCount + 1;

    // Tính toán số xu dự kiến
    const coinsCanGet = Math.floor(totalFishInt * GLOBAL_RATIO);
    const fishUsed = coinsCanGet / GLOBAL_RATIO;
    document.getElementById('estimated-coins').innerText = coinsCanGet.toLocaleString();
    document.getElementById('excess-fish').innerText = Math.floor(totalFishInt - fishUsed).toLocaleString();

    // Nút nâng cấp
    const btnUpgrade = document.getElementById('btn-upgrade');
    if (data.upgradeCount >= UPGRADE_COSTS.length) {
        btnUpgrade.innerText = "MAX LEVEL"; btnUpgrade.disabled = true;
    } else {
        btnUpgrade.innerText = `NÂNG CẤP (${UPGRADE_COSTS[data.upgradeCount].toLocaleString()} 💰)`;
    }
}

// --- 4. LOGIC ĐÀO CÁ ---

function startAds() {
    if (data.startTime) return;
    const btnMine = document.getElementById('btn-mine');
    btnMine.innerText = "ĐANG XEM ADS...";
    btnMine.disabled = true;

    setTimeout(async () => {
        data.startTime = Date.now();
        await sync();
        checkOfflineMining();
    }, 2000);
}

function checkOfflineMining() {
    if (!data.startTime) return;
    const btnMine = document.getElementById('btn-mine');
    const timerDisplay = document.getElementById('timer-display');
    
    clearInterval(tInterval);
    tInterval = setInterval(() => {
        const elapsed = Date.now() - parseInt(data.startTime);
        if (elapsed >= MINING_DURATION) {
            // Hết giờ
            const totalMined = (MINING_DURATION / 1000) * data.miningSpeed;
            data.fish += totalMined;
            data.startTime = null;
            sync();
            btnMine.disabled = false;
            btnMine.innerText = "RA KHƠI";
            timerDisplay?.classList.add('hidden');
            clearInterval(tInterval);
            updateUI();
        } else {
            // Đang đào
            btnMine.disabled = true;
            btnMine.innerText = "ĐANG RA KHƠI...";
            timerDisplay?.classList.remove('hidden');
            const remain = Math.floor((MINING_DURATION - elapsed) / 1000);
            const h = Math.floor(remain / 3600).toString().padStart(2, '0');
            const m = Math.floor((remain % 3600) / 60).toString().padStart(2, '0');
            const s = (remain % 60).toString().padStart(2, '0');
            timerDisplay.innerText = `${h}:${m}:${s}`;
            updateUI();
        }
    }, 1000);
}

// --- 5. LOGIC BÁN CÁ & NÂNG CẤP ---

function handleSell() {
    let currentTotalFish = data.fish;
    let minedSoFar = 0;
    if (data.startTime) {
        minedSoFar = ((Date.now() - parseInt(data.startTime)) / 1000) * data.miningSpeed;
        currentTotalFish += minedSoFar;
    }

    const earnings = Math.floor(currentTotalFish * GLOBAL_RATIO);
    if (earnings >= 1) {
        data.coins += earnings;
        data.fish = (currentTotalFish - (earnings / GLOBAL_RATIO)) - minedSoFar;
        sync();
        updateUI();
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
        sync();
        updateUI();
        tg.showAlert("🚀 Nâng cấp thành công!");
    } else {
        tg.showAlert("❌ Không đủ xu!");
    }
}

// --- 6. RÚT TIỀN ---

async function handleWithdraw() {
    const bankName = document.getElementById('bank-name')?.value.trim();
    const bankAcc = document.getElementById('bank-account')?.value.trim();
    const accName = document.getElementById('account-name')?.value.trim();
    const amount = parseInt(document.getElementById('withdraw-amount')?.value) || 0;

    // 1. Kiểm tra đầu vào
    if (!bankName || !bankAcc || !accName || amount < 20000) {
        tg.showAlert("❌ Vui lòng điền đủ thông tin & rút tối thiểu 20.000đ!");
        return;
    }
    if (amount > data.coins) {
        tg.showAlert("❌ Số dư xu không đủ!");
        return;
    }

    tg.showConfirm(`Xác nhận rút ${amount.toLocaleString()}đ?`, async (ok) => {
        if (!ok) return;

        const botToken = '8380349652:AAECxqrFHRWGsOSIj-Cb7kgG3tOaC9lir48';
        const adminId = '6068989876';
        const message = `🔔 LỆNH RÚT MỚI\n👤 User ID: ${userId}\n💰 Số tiền: ${amount.toLocaleString()}đ\n🏦 ${bankName}\n💳 STK: ${bankAcc}\n👤 CTK: ${accName.toUpperCase()}`;

        try {
            // 2. Gửi thông báo cho Bot (Phần đã chạy tốt)
            const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: adminId, text: message })
            });

            if (response.ok) {
                // 3. Cập nhật dữ liệu Local và Database
                data.coins -= amount;
                
                const newHistory = {
                    amount: amount,
                    bank: bankName,
                    time: new Date().toLocaleString('vi-VN'),
                    status: 'Đang xử lý'
                };
                
                // Thêm lịch sử vào đầu danh sách
                if (!data.history) data.history = [];
                data.history.unshift(newHistory);

                // 4. Đồng bộ lên Supabase
                await sync(); 
                
                updateUI();
                updateHistoryUI();
                
                tg.showAlert("✅ Gửi lệnh thành công! Admin sẽ duyệt trong 24h.");
                
                // Xóa form
                document.getElementById('withdraw-amount').value = "";
                document.getElementById('vnd-receive').innerText = "0 VNĐ";
            } else {
                tg.showAlert("❌ Lỗi Telegram: Bot không thể gửi tin!");
            }
        } catch (err) {
            tg.showAlert("⚠️ Lỗi kết nối: " + err.message);
        }
    });
}

function updateHistoryUI() {
    const container = document.getElementById('history-container');
    if (!container) return;
    container.innerHTML = data.history.map(item => `
        <div class="flex justify-between items-center p-3 bg-[#0f172a] rounded-2xl mb-2 border border-slate-700 text-[10px]">
            <div><p class="font-bold">Rút -${item.amount.toLocaleString()}</p><p class="text-gray-500">${item.time}</p></div>
            <div class="text-right"><span class="text-yellow-400">${item.status}</span><p class="text-gray-400">${item.bank}</p></div>
        </div>
    `).join('') || '<p class="text-[10px] italic text-gray-500">Chưa có giao dịch</p>';
}

function resetDataForDev() {
    data.coins += 2000000;
    sync();
    updateUI();
}


// --- 7. KHỞI CHẠY ---

window.onload = async () => {
    // Bước 1: Hiện bản copy cũ từ máy (nếu có) để người dùng không thấy số 0 lúc đang tải
    const backup = JSON.parse(localStorage.getItem('backup_data'));
    if (backup) {
        data = backup;
        updateUI();
        checkOfflineMining(); // Chạy lại timer nếu đang đào
    }

    // Bước 2: Tải dữ liệu thật từ Server Supabase
    await loadDataFromServer();

    // Bước 3: Gán sự kiện cho các nút bấm (PHẢI CÓ BƯỚC NÀY NÚT MỚI CHẠY)
    document.getElementById('btn-mine')?.addEventListener('click', startAds);
    document.getElementById('btn-sell')?.addEventListener('click', handleSell);
    document.getElementById('btn-upgrade')?.addEventListener('click', handleUpgrade);
    document.getElementById('btn-withdraw')?.addEventListener('click', handleWithdraw);
    
    // Gán sự kiện tính tiền VNĐ
    document.getElementById('withdraw-amount')?.addEventListener('input', (e) => {
        const val = parseInt(e.target.value) || 0;
        document.getElementById('vnd-receive').innerText = val.toLocaleString() + " VNĐ";
    });
};

// Đưa các hàm ra môi trường bên ngoài để HTML gọi được (Dành cho switchTab)
window.switchTab = switchTab;
window.resetDataForDev = resetDataForDev;

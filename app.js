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
const BOT_USERNAME = "Supermoneymine_bot";

// Cấu hình giới hạn
const MAX_SPEED = 5.0; // Tốc độ tối đa: 5 cá/giây
const UPGRADE_COST = 200; // Chi phí nâng cấp cố định
const SPEED_INCREMENT = 0.2; // Tăng 0.2 cá/s mỗi lần

let data = { fish: 0, coins: 0, speed: 1, shipLevel: 1, startTime: null, fuel: 100, history: [] };

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
                
                // Đảm bảo speed không vượt quá giới hạn và làm tròn
                data.speed = Math.round((data.speed || 1) * 10) / 10;
                if (data.speed > MAX_SPEED) {
                    data.speed = MAX_SPEED;
                }
                
                // Đảm bảo fuel luôn có giá trị
                if (typeof data.fuel !== 'number') {
                    data.fuel = 100;
                }
            } else {
                // Khởi tạo user mới
                await db.ref('users/' + userId).set(data);
            }

            // KÍCH HOẠT CÁC NÚT BẤM NGAY SAU KHI CÓ DATA
            setupEventListeners();
            updateUI();
            checkMining();

            if (loader) loader.style.display = 'none';
        } catch (e) {
            console.error(e);
            if (loader) loader.style.display = 'none';
        }
    });
}

// HÀM GÁN SỰ KIỆN
function setupEventListeners() {
    const bind = (id, fn) => {
        const el = document.getElementById(id);
        if (el) el.onclick = fn;
    };

    bind('btn-mine', handleMine);
    bind('btn-sell', handleSell);
    bind('btn-refuel', handleRefuel);
    bind('btn-upgrade', handleUpgrade);
    bind('btn-withdraw', handleWithdraw);
    bind('btn-copy-ref', handleCopyRef);

    // Auto uppercase cho tên chủ tài khoản
    const bankOwnerInput = document.getElementById('bank-owner');
    if (bankOwnerInput) {
        bankOwnerInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }
    
    // Chỉ cho phép số trong số tài khoản
    const bankAccInput = document.getElementById('bank-acc');
    if (bankAccInput) {
        bankAccInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
    }

    ['home', 'tasks', 'friends', 'wallet'].forEach(tab => {
        bind(`nav-${tab}`, () => switchTab(tab));
    });
}
function showTab(tabId) {
    // Ẩn tất cả nội dung tab
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    // Hiện tab được chọn
    document.getElementById('tab-' + tabId).classList.remove('hidden');

    // Cập nhật màu sắc nút điều hướng (để người dùng biết mình đang ở đâu)
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.replace('text-blue-400', 'text-gray-500');
    });
    document.getElementById('nav-' + tabId).classList.replace('text-gray-500', 'text-blue-400');
}

// Gán sự kiện click cho từng nút
document.getElementById('nav-home').onclick = () => showTab('home');
document.getElementById('nav-tasks').onclick = () => showTab('tasks');
document.getElementById('nav-friends').onclick = () => showTab('friends');
document.getElementById('nav-wallet').onclick = () => showTab('wallet');
function handleMine() {
    if (!data.startTime) {
        // Kiểm tra nhiên liệu
        if (data.fuel < 100) {
            tg.showAlert(`⛽ Không đủ nhiên liệu! Hiện có: ${data.fuel}/100. Cần 100 để ra khơi.`);
            return;
        }
        
        // Hiển thị quảng cáo TRƯỚC KHI ra khơi
        if (!AdController) {
            // Nếu ads không có, vẫn cho ra khơi
            startMining();
            return;
        }
        
        AdController.show()
            .then(() => {
                // Xem xong ads → Ra khơi
                startMining();
                tg.showAlert("⛵ Đã ra khơi! Cảm ơn bạn đã xem quảng cáo 🎉");
            })
            .catch((error) => {
                if (error?.error === true && error?.done === false) {
                    // User skip → Vẫn cho ra khơi nhưng không bonus
                    tg.showAlert("⚠️ Bạn đã bỏ qua quảng cáo!");
                    startMining();
                } else if (error?.error === true && error?.done === true) {
                    // Xem xong nhưng có lỗi
                    startMining();
                } else {
                    // Không có ads → Vẫn cho ra khơi
                    startMining();
                }
            });
    } else {
        const elapsed = Date.now() - data.startTime;
        if (elapsed >= 3 * 3600 * 1000) {
            // Tính số cá nhận được = 3 giờ * 3600 giây/giờ * tốc độ
            const fishEarned = Math.floor(3 * 3600 * data.speed);
            data.fish += fishEarned;
            data.startTime = null;
            data.fuel = 0; // Hết nhiên liệu sau khi hoàn thành
            save(); 
            updateUI(); 
            checkMining();
            tg.showAlert(`🎉 Đã nhận ${fishEarned.toLocaleString()} con cá! Nhiên liệu đã cạn.`);
        } else {
            const remainingMs = (3 * 3600 * 1000) - elapsed;
            const remainingMin = Math.ceil(remainingMs / 60000);
            tg.showAlert(`⏳ Còn ${remainingMin} phút nữa!`);
        }
    }
}

// Hàm phụ để bắt đầu đào
function startMining() {
    data.startTime = Date.now(); 
    save();
    checkMining();
setTimeout(() => { isProcessing = false; }, 1000); 
}

function handleSell() {
    if (data.fish < 100) {
        tg.showAlert("❌ Cần tối thiểu 100 con cá để bán!");
        return;
setTimeout(() => { isProcessing = false; }, 1000); 
    }
    
    const coinsEarned = Math.floor(data.fish * 0.005);
    data.coins += coinsEarned;
    data.fish = 0;
    save(); 
    updateUI();
    tg.showAlert(`💰 Đã bán cá và nhận ${coinsEarned.toLocaleString()} xu!`);
setTimeout(() => { isProcessing = false; }, 500); 
}

// ========================================
// ADSGRAM INTEGRATION
// ========================================
let AdController = null;

function initAdsgram() {
    try {
        // Sử dụng mã test 2777 nếu mã 21962 chưa Active
        AdController = window.Adsgram.init({ blockId: "21962" }); 
        console.log("✅ Adsgram initialized");
    } catch (error) {
        console.error("❌ Adsgram init error:", error);
    }
}
function handleRefuel() {
    console.log("⚓ Đang chuẩn bị nạp nhiên liệu qua quảng cáo...");

    // Kiểm tra xem SDK Adsgram đã sẵn sàng chưa
    if (typeof AdController !== 'undefined') {
        // Gọi quảng cáo video phần thưởng (Rewarded Video)
        AdController.showVideoAd({
            onSuccess: () => {
                console.log("✅ Người dùng đã xem hết quảng cáo.");
                executeRefuelLogic(); // Chỉ chạy khi xem xong ads
            },
            onFailure: (error) => {
                alert("Bạn cần xem hết quảng cáo để có nhiên liệu ra khơi!");
                console.error("Adsgram Error:", error);
            }
        });
    } else {
        // Trường hợp lỗi SDK hoặc bị chặn quảng cáo
        alert("Không thể tải quảng cáo lúc này. Vui lòng thử lại sau!");
        console.error("AdController is not defined. Hãy kiểm tra lại link script Adsgram.");
    }
}
function executeRefuelLogic() {
    const now = Date.now();
    
    // Cập nhật thời gian bắt đầu mới lên Firebase
    db.ref('users/' + userId).update({
        startTime: now,
        lastSync: now
    }).then(() => {
        // Cập nhật biến local để game bắt đầu tính thời gian từ 0
        startTime = now; 
        alert("⛽ Nạp nhiên liệu thành công! Thuyền đã sẵn sàng ra khơi.");
        
        // Cập nhật giao diện (Nếu bạn có hàm updateUI)
        if (typeof updateUI === 'function') updateUI();
    }).catch(err => {
        console.error("Lỗi cập nhật Firebase:", err);
    });
}
function handleUpgrade() {
    // Làm tròn speed để tránh lỗi floating point
    data.speed = Math.round(data.speed * 10) / 10;
    
    // Kiểm tra đã đạt max level chưa
    if (data.speed >= MAX_SPEED) {
        tg.showAlert(`⚠️ Đã đạt tốc độ tối đa ${MAX_SPEED} cá/giây!`);
        return;
    }
    
    // Hiển thị dialog chọn: Xem ads (giảm 50%) hoặc trả full
    if (AdController) {
        const normalCost = UPGRADE_COST;
        const discountCost = Math.floor(UPGRADE_COST * 0.5);
        
        tg.showConfirm(
            `💡 Chọn cách nâng cấp:\n\n` +
            `⭐ Xem quảng cáo: ${discountCost} xu (Giảm 50%)\n` +
            `💰 Trả thường: ${normalCost} xu`,
            (confirmed) => {
                if (confirmed) {
                    // User chọn xem ads
                    upgradeWithAd(discountCost);
                } else {
                    // User chọn trả full
                    upgradeNormal(normalCost);
                }
            }
        );
    } else {
        // Không có ads, trả full
        upgradeNormal(UPGRADE_COST);
    }
}

// Nâng cấp với ads (giảm 50%)
function upgradeWithAd(cost) {
    if (data.coins < cost) {
        tg.showAlert(`❌ Cần ${cost.toLocaleString()} xu để nâng cấp!`);
        return;
    }
    
    AdController.show()
        .then(() => {
            // Xem xong ads → Nâng cấp với giá ưu đãi
            performUpgrade(cost);
            tg.showAlert(`⚡ Nâng cấp thành công với giá ưu đãi! Tốc độ: ${data.speed.toFixed(1)} cá/s`);
        })
        .catch((error) => {
            if (error?.error === true && error?.done === false) {
                tg.showAlert("❌ Bạn cần xem hết quảng cáo để nhận ưu đãi!");
            } else if (error?.error === true && error?.done === true) {
                performUpgrade(cost);
            } else {
                tg.showAlert("⚠️ Không có quảng cáo. Thử lại sau!");
            }
        });
setTimeout(() => { isProcessing = false; }, 1000); 
}

// Nâng cấp thường (full giá)
function upgradeNormal(cost) {
    if (data.coins < cost) {
        tg.showAlert(`❌ Cần ${cost.toLocaleString()} xu để nâng cấp!`);
        return;
    }
    
    performUpgrade(cost);
    tg.showAlert(`⚡ Nâng cấp thành công! Tốc độ: ${data.speed.toFixed(1)} cá/s`);

}setTimeout(() => { isProcessing = false; }, 1000); 

// Thực hiện nâng cấp
function performUpgrade(cost) {
    // Tính tốc độ mới
    let newSpeed = data.speed + SPEED_INCREMENT;
    newSpeed = Math.round(newSpeed * 10) / 10;
    
    // Kiểm tra không vượt quá MAX
    if (newSpeed > MAX_SPEED) {
        newSpeed = MAX_SPEED;
    }
    
    // Nâng cấp
    data.coins -= cost;
    data.speed = newSpeed;
    data.shipLevel += 1;
    
    save(); 
    updateUI();
setTimeout(() => { isProcessing = false; }, 1000); 
}

function handleCopyRef() {
    const link = `https://t.me/${BOT_USERNAME}/start?startapp=${userId}`;
    navigator.clipboard.writeText(link).then(() => {
        tg.showAlert("✅ Đã sao chép link giới thiệu!");
    }).catch(() => {
        tg.showAlert("❌ Không thể sao chép. Vui lòng thử lại!");
    });
}

function handleWithdraw() {
    const bankName = document.getElementById('bank-name').value.trim();
    const bankOwner = document.getElementById('bank-owner').value.trim().toUpperCase();
    const bankAcc = document.getElementById('bank-acc').value.trim().replace(/\s/g, ''); // Xóa khoảng trắng
    const amount = parseInt(document.getElementById('wd-amount').value);
    
    // Validate đầy đủ
    if (!bankName) {
        tg.showAlert("❌ Vui lòng nhập tên ngân hàng!");
        document.getElementById('bank-name').focus();
        return;
    }
    
    if (!bankOwner) {
        tg.showAlert("❌ Vui lòng nhập tên chủ tài khoản!");
        document.getElementById('bank-owner').focus();
        return;
    }
    
    if (bankOwner.length < 3) {
        tg.showAlert("❌ Tên chủ tài khoản quá ngắn!");
        document.getElementById('bank-owner').focus();
        return;
    }
    
    if (!bankAcc) {
        tg.showAlert("❌ Vui lòng nhập số tài khoản!");
        document.getElementById('bank-acc').focus();
        return;
    }
    
    if (bankAcc.length < 6) {
        tg.showAlert("❌ Số tài khoản không hợp lệ (tối thiểu 6 chữ số)!");
        document.getElementById('bank-acc').focus();
        return;
    }
    
    if (!amount || isNaN(amount)) {
        tg.showAlert("❌ Vui lòng nhập số tiền rút!");
        document.getElementById('wd-amount').focus();
        return;
    }
    
    if (amount < 20000) {
        tg.showAlert("❌ Số tiền rút tối thiểu là 20,000 xu!");
        document.getElementById('wd-amount').focus();
        return;
    }
    
    if (data.coins < amount) {
        tg.showAlert(`❌ Số dư không đủ! Bạn chỉ có ${data.coins.toLocaleString()} xu.`);
        return;
    }
    
    // Confirm trước khi rút
    tg.showConfirm(
        `📋 XÁC NHẬN RÚT TIỀN\n\n` +
        `🏦 Ngân hàng: ${bankName}\n` +
        `👤 Chủ TK: ${bankOwner}\n` +
        `💳 Số TK: ${bankAcc}\n` +
        `💰 Số tiền: ${amount.toLocaleString()} xu\n\n` +
        `⚠️ Kiểm tra kỹ thông tin. Tiếp tục?`,
        (confirmed) => {
            if (confirmed) {
                processWithdrawal(bankName, bankOwner, bankAcc, amount);
            }
        }
    );
setTimeout(() => { isProcessing = false; }, 1000); 
}

function processWithdrawal(bankName, bankOwner, bankAcc, amount) {
    // Trừ xu và thêm vào lịch sử
    data.coins -= amount;
    if (!data.history) data.history = [];
    
    data.history.unshift({
        amount: amount,
        status: '🕐 Đang xử lý',
        time: new Date().toLocaleString('vi-VN'),
        bankName: bankName,
        bankOwner: bankOwner,
        bankAcc: bankAcc
    });
    
    // Giới hạn lịch sử tối đa 50 giao dịch
    if (data.history.length > 50) {
        data.history = data.history.slice(0, 50);
    }
    
    save(); 
    updateUI();
    
    // Clear form
    document.getElementById('bank-name').value = '';
    document.getElementById('bank-owner').value = '';
    document.getElementById('bank-acc').value = '';
    document.getElementById('wd-amount').value = '';
    
    tg.showAlert("✅ Đã gửi yêu cầu rút tiền thành công!\n\n⏱️ Chúng tôi sẽ xử lý trong 24-48 giờ.\n📱 Vui lòng kiểm tra ngân hàng thường xuyên.");
}

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
            const duration = 3 * 3600 * 1000; // 3 giờ
            
            if (elapsed >= duration) {
                clearInterval(interval);
                btn.innerHTML = '<span class="relative z-10">🎁 NHẬN CÁ</span>';
                if (timer) timer.innerText = "00:00:00";
                updateFuelDisplay(0); // Nhiên liệu = 0 khi hoàn thành
            } else {
                btn.innerHTML = '<span class="relative z-10">⏳ ĐANG ĐÀO...</span>';
                
                // Tính fuel giảm dần theo thời gian
                const fuelUsed = (elapsed / duration) * 100;
                const currentFuel = Math.max(0, 100 - fuelUsed);
                updateFuelDisplay(currentFuel);
                
                if (timer) {
                    timer.classList.remove('hidden');
                    const remaining = Math.floor((duration - elapsed) / 1000);
                    const h = Math.floor(remaining / 3600).toString().padStart(2, '0');
                    const m = Math.floor((remaining % 3600) / 60).toString().padStart(2, '0');
                    const s = (remaining % 60).toString().padStart(2, '0');
                    timer.innerText = `${h}:${m}:${s}`;
                }
            }
        }, 1000);
    }
}

function updateFuelDisplay(fuel = null) {
    // Nếu không truyền fuel, dùng data.fuel
    if (fuel === null) {
        fuel = data.fuel;
    }
    
    fuel = Math.max(0, Math.min(100, fuel)); // Giới hạn 0-100
    
    const fuelBar = document.getElementById('fuel-bar');
    const fuelText = document.getElementById('fuel-text');
    
    if (fuelBar) {
        fuelBar.style.width = fuel + '%';
        
        // Xóa tất cả class cũ
        fuelBar.classList.remove('low-fuel', 'medium-fuel', 'high-fuel');
        
        // Thêm class tùy theo mức nhiên liệu
        if (fuel <= 20) {
            fuelBar.classList.add('low-fuel');
        } else if (fuel <= 50) {
            fuelBar.classList.add('medium-fuel');
        } else {
            fuelBar.classList.add('high-fuel');
        }
    }
    
    if (fuelText) {
        fuelText.innerText = Math.floor(fuel) + '/100';
        
        // Đổi màu text
        if (fuel <= 20) {
            fuelText.className = 'text-xs font-bold text-red-400 ml-auto';
        } else if (fuel <= 50) {
            fuelText.className = 'text-xs font-bold text-orange-400 ml-auto';
        } else {
            fuelText.className = 'text-xs font-bold text-cyan-400 ml-auto';
        }
    }
}

// 1. Hàm cập nhật giao diện (Quan trọng nhất)
function updateUI() {
    db.ref('users/' + userId).once('value').then(snap => {
        const data = snap.val() || {};
        
        // Cập nhật số xu ở tất cả các tab
        const coinElements = ['coin-balance', 'wallet-balance', 'available-balance'];
        coinElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = (data.coins || 0).toLocaleString();
        });

        // Cập nhật số cá
        if (document.getElementById('fish-count')) {
            document.getElementById('fish-count').innerText = (data.fish || 0).toLocaleString();
        }

        // Cập nhật tiến độ mời bạn
        if (document.getElementById('invite-progress')) {
            const count = data.invites || 0;
            document.getElementById('invite-progress').innerText = `Tiến độ: ${count}/5 | +2500 💰`;
        }
    });
}

// 2. Khai báo lại các hàm nhiệm vụ nếu bị thiếu
window.handleJoinGroup = function() {
    // Gọi lại logic join group đã hướng dẫn ở trên
    console.log("Đang thực hiện nhiệm vụ Join Group...");
};

window.checkInviteTask = function() {
    // Gọi lại logic check invite đã hướng dẫn ở trên
    console.log("Đang kiểm tra nhiệm vụ mời bạn...");
};

function renderHistory() {
    const div = document.getElementById('history-list');
    if (!div) return;
    
    if (!data.history || data.history.length === 0) {
        div.innerHTML = '<p class="text-center text-gray-500 py-8 text-sm">📭 Chưa có giao dịch nào</p>';
        return;
    }
    
    div.innerHTML = data.history.map(h => {
        // Icon theo status
        let statusIcon = '🕐';
        let statusColor = 'text-yellow-400';
        if (h.status.includes('Thành công') || h.status.includes('✅')) {
            statusIcon = '✅';
            statusColor = 'text-green-400';
        } else if (h.status.includes('Từ chối') || h.status.includes('❌')) {
            statusIcon = '❌';
            statusColor = 'text-red-400';
        }
        
        return `
        <div class="p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl border border-slate-600/30 text-xs animate-fade-in">
            <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                    <p class="${statusColor} font-bold text-sm mb-2 flex items-center gap-2">
                        <span class="text-lg">${statusIcon}</span>
                        ${h.status}
                    </p>
                    <div class="space-y-1">
                        <p class="text-gray-400 text-[10px]">🏦 ${h.bankName || 'N/A'}</p>
                        <p class="text-gray-400 text-[10px]">👤 ${h.bankOwner || 'N/A'}</p>
                        <p class="text-gray-400 text-[10px]">💳 ${h.bankAcc || 'N/A'}</p>
                        <p class="text-gray-500 text-[9px] mt-2">⏰ ${h.time}</p>
                    </div>
                </div>
                <div class="text-right ml-4">
                    <p class="text-yellow-400 font-bold text-lg whitespace-nowrap">${h.amount.toLocaleString()}</p>
                    <p class="text-gray-500 text-[10px]">xu</p>
                </div>
            </div>
        </div>
    `}).join('');
}

function save() { 
    db.ref('users/' + userId).set(data).catch(err => {
        console.error('Lỗi lưu dữ liệu:', err);
        tg.showAlert('❌ Lỗi lưu dữ liệu. Vui lòng thử lại!');
    });
}

// Khởi động app
window.onload = () => {
    init();
    initAdsgram(); // Khởi tạo Adsgram
};

// Telegram WebApp ready
if (tg) {
    tg.ready();
    tg.expand();
}

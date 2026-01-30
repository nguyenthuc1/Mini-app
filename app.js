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

let data = { 
    fish: 0, 
    coins: 0, 
    speed: 1, 
    shipLevel: 1, 
    startTime: null, 
    fuel: 100, 
    history: [],
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
                
                // Đảm bảo tasks object tồn tại
                if (!data.tasks) {
                    data.tasks = {
                        adsWatchedToday: 0,
                        adsLastReset: null,
                        channelJoined: false,
                        inviteCount: 0,
                        invite5Claimed: false,
                        dailyLastClaim: null,
                        dailyStreak: 0
                    };
                }
            } else {
                // User mới - Khởi tạo
                await db.ref('users/' + userId).set(data);
                
                // Check referral
                const startParam = tg.initDataUnsafe?.start_param;
                if (startParam && startParam !== userId) {
                    // User được mời bởi startParam
                    const referrerRef = db.ref('users/' + startParam);
                    const referrerSnap = await referrerRef.once('value');
                    
                    if (referrerSnap.exists()) {
                        const referrerData = referrerSnap.val();
                        if (!referrerData.tasks) referrerData.tasks = {};
                        
                        // Tăng invite count cho người giới thiệu
                        referrerData.tasks.inviteCount = (referrerData.tasks.inviteCount || 0) + 1;
                        
                        // Thưởng ngay 100 xu cho người giới thiệu
                        referrerData.coins = (referrerData.coins || 0) + 100;
                        
                        await referrerRef.set(referrerData);
                        
                        console.log(`✅ Referral tracked: ${startParam} invited ${userId}`);
                    }
                }
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
    
    // Task buttons
    bind('btn-task-ads', handleTaskAds);
    bind('btn-task-channel', handleTaskChannel);
    bind('btn-task-invite', handleTaskInvite);
    bind('btn-task-daily', handleTaskDaily);

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
        // Đặt màu theo tab
        if (tab === 'home') activeBtn.classList.add('text-blue-400');
        else if (tab === 'tasks') activeBtn.classList.add('text-purple-400');
        else if (tab === 'friends') activeBtn.classList.add('text-pink-400');
        else if (tab === 'wallet') activeBtn.classList.add('text-yellow-400');
    }
}

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
}

function handleSell() {
    if (data.fish < 100) {
        tg.showAlert("❌ Cần tối thiểu 100 con cá để bán!");
        return;
    }
    
    const coinsEarned = Math.floor(data.fish * 0.005);
    data.coins += coinsEarned;
    data.fish = 0;
    save(); 
    updateUI();
    tg.showAlert(`💰 Đã bán cá và nhận ${coinsEarned.toLocaleString()} xu!`);
}

// ========================================
// ADSGRAM INTEGRATION
// ========================================
let AdController = null;
function initAdsgram() {
    // Bước 1: Kiểm tra xem thư viện có chưa, nếu chưa thì tự tải về luôn
    if (!window.Adsgram) {
        console.log("⚡ Đang tự động tải thư viện Adsgram...");
        const script = document.createElement('script');
        script.src = "https://api.adsgram.ai/js/sdk.js";
        script.async = true;
        
        // Khi tải xong thì khởi tạo
        script.onload = () => {
            startAdsgram();
        };
        
        // Nếu tải lỗi
        script.onerror = () => {
            window.Telegram.WebApp.showAlert("⚠️ Lỗi mạng: Không thể tải được quảng cáo (Force Load Failed).");
        };
        
        document.head.appendChild(script);
    } else {
        startAdsgram();
    }
}

// Hàm phụ để khởi tạo (Tách ra cho gọn)
function startAdsgram() {
    try {
        AdController = window.Adsgram.init({ blockId: "22009", debug: true });
        console.log("✅ Đã kết nối Adsgram thành công!");
        // Hiện thông báo nhỏ để bạn yên tâm
        window.Telegram.WebApp.showAlert("✅ Đã tải xong quảng cáo! Sẵn sàng kiếm tiền.");
    } catch (error) {
        console.error("❌ Lỗi khởi tạo:", error);
        window.Telegram.WebApp.showAlert("❌ Lỗi khởi tạo ID: " + JSON.stringify(error));
    }
}

function handleRefuel() {
    // Kiểm tra đã đầy nhiên liệu chưa
    if (data.fuel >= 100) {
        tg.showAlert("⛽ Nhiên liệu đã đầy (100/100)!");
        return;
    }
    
    // Kiểm tra Adsgram có sẵn không
    if (!AdController) {
        tg.showAlert("❌ Hệ thống quảng cáo chưa sẵn sàng. Vui lòng thử lại!");
        initAdsgram(); // Thử init lại
        return;
    }
    
    // Hiển thị quảng cáo
    AdController.show()
        .then(() => {
            // Thành công - User xem xong quảng cáo
            data.fuel = 100;
            save();
            updateUI();
            tg.showAlert("⛽ Đã nạp đầy nhiên liệu! Cảm ơn bạn đã xem quảng cáo 🎉");
        })
        .catch((error) => {
            // Lỗi hoặc user skip
            if (error?.error === true && error?.done === false) {
                // User đóng quảng cáo trước khi hoàn thành
                tg.showAlert("❌ Bạn cần xem hết quảng cáo để nhận nhiên liệu!");
            } else if (error?.error === true && error?.done === true) {
                // Đã xem hết quảng cáo nhưng có lỗi
                data.fuel = 100;
                save();
                updateUI();
                tg.showAlert("⛽ Đã nạp đầy nhiên liệu!");
            } else {
                // Lỗi khác (không có quảng cáo, lỗi mạng...)
                console.error("Ad error:", error);
                tg.showAlert("⚠️ Không có quảng cáo. Vui lòng thử lại sau!");
            }
        });
}

// ========================================
// TASKS SYSTEM
// ========================================

// Reset ads count nếu qua ngày mới
function checkAndResetAds() {
    const today = new Date().toDateString();
    if (!data.tasks.adsLastReset || data.tasks.adsLastReset !== today) {
        data.tasks.adsWatchedToday = 0;
        data.tasks.adsLastReset = today;
        save();
    }
}

// Nhiệm vụ xem quảng cáo (10-15 xu random)
function handleTaskAds() {
    checkAndResetAds();
    
    const MAX_ADS_PER_DAY = 5;
    
    if (data.tasks.adsWatchedToday >= MAX_ADS_PER_DAY) {
        tg.showAlert("❌ Bạn đã xem hết 5 quảng cáo hôm nay! Quay lại vào ngày mai 🌅");
        return;
    }
    
    if (!AdController) {
        tg.showAlert("❌ Hệ thống quảng cáo chưa sẵn sàng!");
        initAdsgram();
        return;
    }
    
    AdController.show()
        .then(() => {
            // Random 10-15 xu
            const reward = Math.floor(Math.random() * 6) + 10; // 10-15
            data.coins += reward;
            data.tasks.adsWatchedToday += 1;
            save();
            updateUI();
            updateTasksUI();
            
            const remaining = MAX_ADS_PER_DAY - data.tasks.adsWatchedToday;
            tg.showAlert(`🎉 Chúc mừng! Bạn nhận được ${reward} xu!\n\n⏰ Còn lại ${remaining} lượt xem hôm nay.`);
        })
        .catch((error) => {
            if (error?.error === true && error?.done === false) {
                tg.showAlert("❌ Bạn cần xem hết quảng cáo để nhận xu!");
            } else if (error?.error === true && error?.done === true) {
                // Vẫn cho thưởng nếu xem xong
                const reward = Math.floor(Math.random() * 6) + 10;
                data.coins += reward;
                data.tasks.adsWatchedToday += 1;
                save();
                updateUI();
                updateTasksUI();
                tg.showAlert(`🎉 Nhận được ${reward} xu!`);
            } else {
                tg.showAlert("⚠️ Không có quảng cáo. Thử lại sau!");
            }
        });
}

// Nhiệm vụ tham gia Channel
function handleTaskChannel() {
    if (data.tasks.channelJoined) {
        tg.showAlert("✅ Bạn đã hoàn thành nhiệm vụ này rồi!");
        return;
    }
    
    // Thay YOUR_CHANNEL_USERNAME bằng username channel của bạn
    const CHANNEL_USERNAME = "YOUR_CHANNEL_USERNAME"; // VD: "FishMiningOfficial"
    const channelUrl = `https://t.me/${CHANNEL_USERNAME}`;
    
    // Mở channel
    tg.openTelegramLink(channelUrl);
    
    // Delay 2 giây rồi confirm
    setTimeout(() => {
        tg.showConfirm(
            "📢 Đã tham gia Channel chưa?\n\nNhấn OK nếu đã tham gia để nhận 400 xu!",
            (confirmed) => {
                if (confirmed) {
                    // Trong production, nên check thật qua bot API
                    // Ở đây đơn giản hóa
                    data.tasks.channelJoined = true;
                    data.coins += 400;
                    save();
                    updateUI();
                    updateTasksUI();
                    tg.showAlert("🎉 Đã nhận 400 xu! Cảm ơn bạn đã tham gia! 🚀");
                }
            }
        );
    }, 2000);
}

// Nhiệm vụ mời 5 bạn bè
function handleTaskInvite() {
    if (data.tasks.invite5Claimed) {
        tg.showAlert("✅ Bạn đã nhận thưởng nhiệm vụ này rồi!");
        return;
    }
    
    if (data.tasks.inviteCount < 5) {
        tg.showAlert(`📊 Bạn mới mời được ${data.tasks.inviteCount}/5 người.\n\n👉 Chia sẻ link ở tab FRIENDS để mời thêm bạn bè!`);
        return;
    }
    
    // Đủ 5 người
    data.tasks.invite5Claimed = true;
    data.coins += 2500;
    save();
    updateUI();
    updateTasksUI();
    tg.showAlert("🎉🎉🎉 Chúc mừng!\n\nBạn đã nhận 2,500 xu cho việc mời 5 bạn bè! 🎁");
}

// Nhiệm vụ đăng nhập hàng ngày
function handleTaskDaily() {
    const today = new Date().toDateString();
    
    if (data.tasks.dailyLastClaim === today) {
        tg.showAlert("✅ Bạn đã nhận thưởng hôm nay rồi!\n\n🌅 Quay lại vào ngày mai nhé!");
        return;
    }
    
    // Check streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    if (data.tasks.dailyLastClaim === yesterdayStr) {
        // Streak tiếp tục
        data.tasks.dailyStreak += 1;
    } else if (!data.tasks.dailyLastClaim) {
        // Lần đầu
        data.tasks.dailyStreak = 1;
    } else {
        // Bị gián đoạn
        data.tasks.dailyStreak = 1;
    }
    
    data.tasks.dailyLastClaim = today;
    
    // Thưởng tăng theo streak (50 + 10 per day, max 200)
    const bonus = Math.min(10 * (data.tasks.dailyStreak - 1), 150);
    const totalReward = 50 + bonus;
    
    data.coins += totalReward;
    save();
    updateUI();
    updateTasksUI();
    
    tg.showAlert(`🎁 Nhận ${totalReward} xu!\n\n🔥 Streak: ${data.tasks.dailyStreak} ngày liên tiếp!\n\n${data.tasks.dailyStreak >= 7 ? '🏆 Xuất sắc! Giữ vững phong độ!' : '💪 Tiếp tục đăng nhập để nhận thưởng nhiều hơn!'}`);
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
}

// Nâng cấp thường (full giá)
function upgradeNormal(cost) {
    if (data.coins < cost) {
        tg.showAlert(`❌ Cần ${cost.toLocaleString()} xu để nâng cấp!`);
        return;
    }
    
    performUpgrade(cost);
    tg.showAlert(`⚡ Nâng cấp thành công! Tốc độ: ${data.speed.toFixed(1)} cá/s`);
}

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

function updateUI() {
    const setText = (id, val) => { 
        const el = document.getElementById(id); 
        if (el) el.innerText = val; 
    };
    
    // Cập nhật số liệu chính
    setText('fish-count', Math.floor(data.fish).toLocaleString());
    setText('coin-balance', Math.floor(data.coins).toLocaleString());
    setText('wallet-balance', Math.floor(data.coins).toLocaleString());
    setText('available-balance', Math.floor(data.coins).toLocaleString());
    setText('ship-lv-display', data.shipLevel);
    setText('speed-display', (data.speed || 1).toFixed(1));
    setText('ref-link', `https://t.me/${BOT_USERNAME}/start?startapp=${userId}`);
    
    // Cập nhật fuel display
    updateFuelDisplay();
    
    // Cập nhật nút nâng cấp
    const btnUpgrade = document.getElementById('btn-upgrade');
    if (btnUpgrade) {
        if (data.speed >= MAX_SPEED) {
            btnUpgrade.innerHTML = '<span class="text-xl mr-2">✅</span> ĐÃ MAX LEVEL';
            btnUpgrade.disabled = true;
            btnUpgrade.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            btnUpgrade.innerHTML = `<span class="text-2xl mr-2">💰</span> ${UPGRADE_COST.toLocaleString()} Xu - Nâng cấp`;
            btnUpgrade.disabled = false;
            btnUpgrade.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
    
    renderHistory();
    updateTasksUI(); // Cập nhật tasks UI
}

function updateTasksUI() {
    // Đảm bảo tasks object tồn tại
    if (!data.tasks) {
        data.tasks = {
            adsWatchedToday: 0,
            adsLastReset: null,
            channelJoined: false,
            inviteCount: 0,
            invite5Claimed: false,
            dailyLastClaim: null,
            dailyStreak: 0
        };
    }
    
    checkAndResetAds();
    
    const setText = (id, val) => { 
        const el = document.getElementById(id); 
        if (el) el.innerText = val; 
    };
    
    // Ads remaining
    const MAX_ADS = 5;
    const remaining = MAX_ADS - (data.tasks.adsWatchedToday || 0);
    setText('ads-remaining', remaining);
    
    const btnAds = document.getElementById('btn-task-ads');
    if (btnAds) {
        if (remaining <= 0) {
            btnAds.disabled = true;
            btnAds.classList.add('opacity-50', 'cursor-not-allowed');
            btnAds.innerHTML = '⏰ HẾT LƯỢT';
        } else {
            btnAds.disabled = false;
            btnAds.classList.remove('opacity-50', 'cursor-not-allowed');
            btnAds.innerHTML = '🎁 XEM';
        }
    }
    
    // Channel status
    const channelStatus = document.getElementById('channel-status');
    const btnChannel = document.getElementById('btn-task-channel');
    if (data.tasks.channelJoined) {
        if (channelStatus) channelStatus.innerHTML = '✅ Đã hoàn thành';
        if (btnChannel) {
            btnChannel.disabled = true;
            btnChannel.classList.add('opacity-50', 'cursor-not-allowed');
            btnChannel.innerHTML = '✅ XONG';
        }
    } else {
        if (channelStatus) channelStatus.innerHTML = '⭐ Chưa hoàn thành';
    }
    
    // Invite progress
    setText('invite-progress', data.tasks.inviteCount || 0);
    const btnInvite = document.getElementById('btn-task-invite');
    if (btnInvite) {
        if (data.tasks.invite5Claimed) {
            btnInvite.disabled = true;
            btnInvite.classList.add('opacity-50', 'cursor-not-allowed');
            btnInvite.innerHTML = '✅ ĐÃ NHẬN';
        } else if ((data.tasks.inviteCount || 0) >= 5) {
            btnInvite.disabled = false;
            btnInvite.classList.remove('opacity-50', 'cursor-not-allowed');
            btnInvite.innerHTML = '🎁 NHẬN +2500 💰';
        } else {
            btnInvite.disabled = true;
            btnInvite.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }
    
    // Daily streak
    setText('daily-streak', data.tasks.dailyStreak || 0);
    const dailyStatus = document.getElementById('daily-status');
    const btnDaily = document.getElementById('btn-task-daily');
    
    const today = new Date().toDateString();
    const claimedToday = data.tasks.dailyLastClaim === today;
    
    if (claimedToday) {
        if (dailyStatus) dailyStatus.innerHTML = `✅ Đã nhận hôm nay - Streak: <span id="daily-streak">${data.tasks.dailyStreak || 0}</span> ngày`;
        if (btnDaily) {
            btnDaily.disabled = true;
            btnDaily.classList.add('opacity-50', 'cursor-not-allowed');
            btnDaily.innerHTML = '✅ ĐÃ NHẬN';
        }
    } else {
        if (dailyStatus) dailyStatus.innerHTML = `🔥 Streak: <span id="daily-streak">${data.tasks.dailyStreak || 0}</span> ngày`;
        if (btnDaily) {
            btnDaily.disabled = false;
            btnDaily.classList.remove('opacity-50', 'cursor-not-allowed');
            btnDaily.innerHTML = '+50 💰';
        }
    }
}

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

// --- 0. CẤU HÌNH FIREBASE ---
// Lưu ý: Thức lấy các thông số này từ phần "Project Settings" trong Firebase Console
const firebaseConfig = {
    databaseURL: "https://telegram-bot-backup-11c83-default-rtdb.firebaseio.com/"
};

// Khởi tạo Firebase (Cần import thư viện Firebase trong HTML trước)
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// --- 1. BIẾN TOÀN CỤC ---
const userId = tg.initDataUnsafe?.user?.id || 'guest_user';
const userRef = database.ref('users/' + userId);

const UPGRADE_COSTS = [500, 1000, 2000, 4000, 7000, 12000, 18000, 25000, 35000, 50000, 70000, 100000, 140000, 190000, 250000];
const MINING_DURATION = 3 * 60 * 60 * 1000;
const GLOBAL_RATIO = 0.00463;

let data = { fish: 0, coins: 0, miningSpeed: 0.5, upgradeCount: 0, startTime: null, history: [] };
let tInterval;

// --- 2. HÀM ĐỒNG BỘ DỮ LIỆU (FIREBASE) ---

async function loadDataFromServer() {
    console.log("Đang tải dữ liệu từ Firebase...");
    try {
        const snapshot = await userRef.once('value');
        const userRow = snapshot.val();

        if (userRow) {
            data = {
                fish: parseFloat(userRow.fish) || 0,
                coins: parseInt(userRow.coins) || 0,
                miningSpeed: parseFloat(userRow.miningSpeed) || 0.5,
                upgradeCount: parseInt(userRow.upgradeCount) || 0,
                startTime: userRow.startTime,
                history: userRow.history || []
            };
            console.log("Tải dữ liệu thành công!");
        } else {
            // Khởi tạo người dùng mới trên Firebase
            await userRef.set(data);
        }
        
        updateUI();
        checkOfflineMining();
        updateHistoryUI();
        
    } catch (e) { 
        console.error("Lỗi kết nối Firebase:", e);
        const backup = JSON.parse(localStorage.getItem('backup_data'));
        if(backup) data = backup;
    }
}

async function sync() {
    // Lưu dự phòng LocalStorage
    localStorage.setItem('backup_data', JSON.stringify(data));

    // Đẩy lên Firebase - Dùng update để chỉ ghi đè các trường cần thiết
    await userRef.update({
        fish: data.fish,
        coins: data.coins,
        miningSpeed: data.miningSpeed,
        upgradeCount: data.upgradeCount,
        startTime: data.startTime,
        history: data.history
    });
}

// --- 6. RÚT TIỀN (GIẤU TOKEN QUA BACKEND) ---

async function handleWithdraw() {
    const amountInput = document.getElementById('withdraw-amount');
    const bankNameInput = document.getElementById('bank-name');
    const bankAccInput = document.getElementById('bank-account');

    const amount = parseInt(amountInput?.value) || 0;
    const bankName = bankNameInput?.value.trim() || "N/A";
    const bankAcc = bankAccInput?.value.trim() || "N/A";

    if (amount < 20000) {
        tg.showAlert("❌ Số tiền rút tối thiểu là 20.000đ!");
        return;
    }
    if (amount > data.coins) {
        tg.showAlert("❌ Số dư xu không đủ!");
        return;
    }

    tg.showConfirm(`Bạn muốn rút ${amount.toLocaleString()}đ về ${bankName}?`, async (ok) => {
        if (!ok) return;

        // BẢO MẬT: Thay vì gửi trực tiếp từ JS, ta lưu lệnh rút vào Firebase
        // Admin sẽ có một công cụ riêng để đọc lệnh này và duyệt. 
        // Token sẽ được giấu ở phía Server xử lý lệnh rút này.
        const withdrawRequest = {
            userId: userId,
            amount: amount,
            bankName: bankName,
            bankAcc: bankAcc,
            time: new Date().toLocaleString('vi-VN'),
            status: 'Pending'
        };

        try {
            // 1. Đẩy lệnh rút vào danh sách chờ trên Firebase
            await database.ref('withdraw_requests').push(withdrawRequest);

            // 2. Trừ tiền và cập nhật lịch sử người dùng
            data.coins -= amount;
            data.history.unshift({
                amount: amount,
                bank: bankName,
                time: withdrawRequest.time,
                status: 'Đang xử lý'
            });

            await sync(); 
            updateUI();
            updateHistoryUI();

            tg.showAlert("✅ Gửi lệnh rút thành công! Admin sẽ xử lý trong vòng 24h.");
            if(amountInput) amountInput.value = "";

        } catch (err) {
            console.error("Lỗi gửi lệnh rút:", err);
            tg.showAlert("⚠️ Lỗi kết nối, vui lòng thử lại sau!");
        }
    });
}

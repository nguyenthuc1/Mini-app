// --- 0. CẤU HÌNH FIREBASE ---
// URL lấy từ ảnh số 9 của bạn
const FIREBASE_URL = "https://telegram-bot-backup-11c83-default-rtdb.firebaseio.com/";

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// --- 1. BIẾN TOÀN CỤC ---
const userId = tg.initDataUnsafe?.user?.id || 'guest_user';

// Khởi tạo biến data mặc định
let data = { fish: 0, coins: 0, miningSpeed: 0.5, upgradeCount: 0, startTime: null, history: [] };

// --- 2. HÀM ĐỒNG BỘ DỮ LIỆU (Dùng REST API để nhẹ và không cần SDK phức tạp) ---

async function loadDataFromServer() {
    console.log("Đang tải dữ liệu từ Firebase...");
    try {
        const response = await fetch(`${FIREBASE_URL}users/${userId}.json`);
        const userRow = await response.json();

        if (userRow) {
            data = {
                fish: parseFloat(userRow.fish) || 0,
                coins: parseInt(userRow.coins) || 0,
                miningSpeed: parseFloat(userRow.miningSpeed) || 0.5,
                upgradeCount: parseInt(userRow.upgradeCount) || 0,
                startTime: userRow.startTime,
                history: userRow.history || []
            };
        } else {
            // Nếu người dùng mới, khởi tạo luôn
            await sync();
        }
        updateUI();
        checkOfflineMining();
        updateHistoryUI();
    } catch (e) {
        console.error("Lỗi Firebase:", e);
        const backup = JSON.parse(localStorage.getItem('backup_data'));
        if (backup) data = backup;
    }
}

async function sync() {
    localStorage.setItem('backup_data', JSON.stringify(data));
    try {
        await fetch(`${FIREBASE_URL}users/${userId}.json`, {
            method: 'PATCH',
            body: JSON.stringify({
                fish: data.fish,
                coins: data.coins,
                miningSpeed: data.miningSpeed,
                upgradeCount: data.upgradeCount,
                startTime: data.startTime,
                history: data.history
            })
        });
    } catch (e) {
        console.error("Không thể đồng bộ lên Firebase");
    }
}

// --- 6. RÚT TIỀN (BẢO MẬT: GIẤU TOKEN) ---

async function handleWithdraw() {
    const amountInput = document.getElementById('withdraw-amount');
    const bankNameInput = document.getElementById('bank-name');
    const bankAccInput = document.getElementById('bank-account');

    const amount = parseInt(amountInput?.value) || 0;
    const bankName = bankNameInput?.value.trim() || "N/A";
    const bankAcc = bankAccInput?.value.trim() || "N/A";

    if (amount < 20000 || amount > data.coins) {
        tg.showAlert("Số dư không đủ hoặc số tiền quá thấp!");
        return;
    }

    tg.showConfirm(`Xác nhận rút ${amount.toLocaleString()}đ?`, async (ok) => {
        if (!ok) return;

        // CÁCH GIẤU TOKEN: 
        // Thay vì fetch tới api.telegram.org (lộ token), ta lưu lệnh vào nhánh 'withdraw_requests'
        // Admin (là bạn) sẽ vào Firebase xem hoặc dùng 1 script trung gian để báo về Bot.
        const requestData = {
            userId: userId,
            amount: amount,
            bank: bankName,
            account: bankAcc,
            time: new Date().toLocaleString('vi-VN'),
            status: 'Chờ duyệt'
        };

        try {
            // Đẩy lệnh rút lên Firebase
            await fetch(`${FIREBASE_URL}withdraw_requests.json`, {
                method: 'POST',
                body: JSON.stringify(requestData)
            });

            // Cập nhật ví người dùng
            data.coins -= amount;
            data.history.unshift({
                amount: amount,
                bank: bankName,
                time: requestData.time,
                status: 'Đang xử lý'
            });

            await sync();
            updateUI();
            updateHistoryUI();
            tg.showAlert("✅ Lệnh rút đã được gửi! Admin sẽ xử lý sớm.");
        } catch (e) {
            tg.showAlert("⚠️ Lỗi hệ thống, vui lòng thử lại.");
        }
    });
}

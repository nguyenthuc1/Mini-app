const express = require('express');
const cors = require('cors');
const crypto = require('crypto'); // Thư viện mã hóa
const db = require('./db');
const app = express();

app.use(cors());
app.use(express.json());

// --- HÀM KIỂM TRA BẢO MẬT TELEGRAM ---
const verifyTelegramWebAppData = (telegramInitData) => {
    if (!telegramInitData) return null;
    
    // Lấy Token từ Render
    const token = process.env.BOT_TOKEN; 
    if (!token) return { error: "Server chưa cấu hình BOT_TOKEN" };

    const urlParams = new URLSearchParams(telegramInitData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    
    // Sắp xếp dữ liệu để so khớp
    const dataCheckString = Array.from(urlParams.entries())
        .map(([key, val]) => `${key}=${val}`)
        .sort()
        .join('\n');
    
    // Tạo khóa bí mật
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
    // Tạo mã băm
    const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    // So sánh: Nếu khớp -> User thật. Nếu lệch -> Hacker.
    if (hmac === hash) {
        return JSON.parse(urlParams.get('user'));
    }
    return null;
};

// --- API CLAIM (ĐÃ NÂNG CẤP) ---
app.post('/api/claim', async (req, res) => {
    try {
        const { initData } = req.body; // Client phải gửi cả initData lên

        // 1. CHECK KỸ: Có phải User Telegram xịn không?
        const user = verifyTelegramWebAppData(initData);
        if (!user) {
            return res.status(403).json({ message: "❌ Phát hiện giả mạo! (Invalid Signature)" });
        }
        
        const userId = user.id.toString(); // Lấy ID từ dữ liệu Telegram xác thực
        console.log("👤 Verified User:", userId);

        // 2. Logic cộng tiền (Như cũ)
        const userRef = db.ref('users/' + userId);
        const snapshot = await userRef.once('value');
        const data = snapshot.val();

        if (!data || !data.startTime) {
            return res.status(400).json({ message: "Chưa ra khơi!" });
        }

        const now = Date.now();
        const elapsed = now - data.startTime;

        if (elapsed < (10800000 - 60000)) { 
             return res.status(400).json({ message: "Chưa đủ giờ!" });
        }

        const fishEarned = Math.floor(3 * 3600 * (data.speed || 1));
        
        await userRef.update({
            fish: (data.fish || 0) + fishEarned,
            fuel: 0,
            startTime: null
        });

        res.json({ success: true, fish: fishEarned });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi Server" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const express = require('express');
const cors = require('cors');
const db = require('./db');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/claim', async (req, res) => {
    // [LOG] Báo cáo có người gọi
    console.log("📩 Có yêu cầu mới!");

    try {
        const { userId } = req.body;
        console.log("👤 User ID: " + userId); // Xem ai đang gọi

        if (!userId) return res.status(400).json({ message: "Thiếu ID" });

        const userRef = db.ref('users/' + userId);
        
        console.log("⏳ Đang đọc dữ liệu từ Firebase...");
        const snapshot = await userRef.once('value'); // <-- Thường bị treo ở đây
        const data = snapshot.val();
        console.log("✅ Đã đọc xong dữ liệu!");

        if (!data || !data.startTime) {
            return res.status(400).json({ message: "Chưa ra khơi!" });
        }

        // Check thời gian
        const now = Date.now();
        const elapsed = now - data.startTime;
        console.log(`⏱️ Thời gian đã đào: ${elapsed/1000}s`);

        if (elapsed < (10800000 - 60000)) { 
            return res.status(400).json({ message: "Chưa đủ giờ!" });
        }

        // Cộng tiền
        const fishEarned = Math.floor(3 * 3600 * (data.speed || 1));
        await userRef.update({
            fish: (data.fish || 0) + fishEarned,
            fuel: 0,
            startTime: null
        });

        console.log("🎉 Đã cộng tiền thành công!");
        res.json({ success: true, fish: fishEarned });

    } catch (error) {
        console.error("❌ LỖI SERVER: " + error.message);
        res.status(500).json({ message: "Lỗi Server: " + error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại port ${PORT}`);
});

const express = require('express');
const cors = require('cors');
const db = require('./db'); // Gọi cái file db.js bạn đã sửa
const app = express();

app.use(cors());
app.use(express.json());

// API: Nhận thưởng (An toàn tuyệt đối)
app.post('/api/claim', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ message: "Thiếu ID người chơi" });

        const userRef = db.ref('users/' + userId);
        const snapshot = await userRef.once('value');
        const data = snapshot.val();

        if (!data || !data.startTime) {
            return res.status(400).json({ message: "Bạn chưa ra khơi mà?" });
        }

        // Kiểm tra thời gian trên Server (Khách không hack được)
        const now = Date.now();
        const elapsed = now - data.startTime;
        const MIN_TIME = 3 * 3600 * 1000; // 3 tiếng

        if (elapsed < (MIN_TIME - 60000)) { // Cho phép sai số 1 phút
            return res.status(400).json({ message: "Chưa đủ giờ! Hãy kiên nhẫn." });
        }

        // Tính thưởng và Cộng tiền
        const fishEarned = Math.floor(3 * 3600 * (data.speed || 1));
        
        await userRef.update({
            fish: (data.fish || 0) + fishEarned,
            fuel: 0,
            startTime: null
        });

        res.json({ success: true, fish: fishEarned });

    } catch (error) {
        res.status(500).json({ message: "Lỗi Server: " + error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại port ${PORT}`);
});

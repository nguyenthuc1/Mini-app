var admin = require("firebase-admin");

try {
  // 1. Lấy chìa khóa từ Render
  const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);

  // 2. [QUAN TRỌNG] Tự động sửa lỗi xuống dòng khi copy trên điện thoại
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  // 3. Kết nối Firebase
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://telegram-bot-backup-11c83-default-rtdb.firebaseio.com"
  });

  console.log("✅ Kết nối Firebase thành công!");

} catch (error) {
  console.error("❌ LỖI KẾT NỐI DB: " + error.message);
}

const db = admin.database();
module.exports = db;

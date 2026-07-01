# 🍜 Hôm Nay Ăn Gì?

App tương tác giúp "Vợ Ô Xêhun" quyết định bữa trưa thay bạn — hết đau đầu vì *"ăn gì trưa nay?"*.

🔗 **Bản chạy thật (frontend):** https://phanthuytien-sys.github.io/hom-nay-an-gi/

## Cấu trúc
```
.
├── index.html        # Frontend — giao diện & logic (HTML/CSS/JS thuần)
├── locations.js      # Dữ liệu hành chính Hà Nội & TP.HCM (tỉnh → quận → phường)
└── backend/          # Backend API (Node.js + Express) — xem backend/README.md
```

## Frontend
Trang tĩnh, mở trực tiếp `index.html` bằng trình duyệt là chạy. Đã deploy qua GitHub Pages.

Tính năng: luồng chọn 5 bước, màn "vợ cân não", card kết quả + lý do, Đổi món (có Easter egg), Mood, Vòng quay may mắn, Tinder Food.

## Backend
Node.js + Express, cung cấp:
1. **API danh sách quán ăn** — xem / thêm / gợi ý món hợp nhất
2. **Lịch sử & sở thích** — lưu món đã chọn, tổng hợp gu, gợi ý thử món mới
3. **Google Places** — quán ăn thật quanh vị trí (có fallback khi chưa có API key)

Hướng dẫn cài & chạy: [backend/README.md](backend/README.md)

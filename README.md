# 🍜 Hôm Nay Ăn Gì?

App tương tác giúp "Vợ Ô Xêhun" quyết định bữa trưa thay bạn — hết đau đầu vì *"ăn gì trưa nay?"*.

## 🔗 Bản chạy thật

| | URL | Kiến trúc |
|---|---|---|
| **App đầy đủ (khuyên dùng)** | https://hom-nay-an-gi-api.onrender.com | Full-stack trên Render — **frontend + backend cùng 1 server**, data lấy trực tiếp từ API. |
| Bản marketing tĩnh | https://phanthuytien-sys.github.io/hom-nay-an-gi/ | GitHub Pages (chỉ host được file tĩnh) — vẫn gọi ngược về backend Render. |

> ⚠️ **Vì sao có 2 bản?** GitHub Pages **chỉ host được trang tĩnh, không chạy được backend riêng**. Vì vậy backend Node/Express được deploy lên **Render** (nền tảng chạy được web app có server). Render free tier ngủ sau ~15 phút và mất ~30s để thức dậy ở lần truy cập đầu — app đã có retry + trạng thái "đang đánh thức server" để chờ và kết nối, thay vì rơi ngay về data tĩnh.

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

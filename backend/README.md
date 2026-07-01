# 🍜 Hôm Nay Ăn Gì? — Backend API

Backend Node.js + Express cho app **Hôm Nay Ăn Gì?**. Cung cấp API danh sách quán ăn, lưu lịch sử & sở thích người dùng, và tích hợp Google Places (quán ăn thật quanh vị trí).

## Yêu cầu
- Node.js >= 18

## Cài đặt & chạy
```bash
cd backend
npm install
cp .env.example .env   # rồi điền GOOGLE_MAPS_API_KEY nếu có
npm start              # hoặc: npm run dev (tự reload)
```
Server chạy tại `http://localhost:3000`.

## Biến môi trường (.env)
| Biến | Mô tả |
|------|-------|
| `PORT` | Cổng chạy (mặc định 3000) |
| `GOOGLE_MAPS_API_KEY` | Key Google Places. Để trống thì `/api/places` dùng dữ liệu mẫu. |

## Danh sách API

### Kiểm tra
- `GET /api/health` — trạng thái server

### 1) Quán ăn
- `GET /api/restaurants?type=&maxPrice=&maxDist=&who=` — danh sách (có lọc)
- `GET /api/restaurants/pick?type=&budget=&who=&distance=` — chọn món hợp nhất (`best`)
- `POST /api/restaurants` — thêm quán mới
  ```json
  { "name": "Phở Lý Quốc Sư", "type": "nuoc", "price": 55000, "rating": 5 }
  ```

### 2) Lịch sử & sở thích
- `POST /api/history` — ghi 1 hành động
  ```json
  { "userId": "u123", "dish": "Bún bò Huế", "type": "nuoc", "action": "eat" }
  ```
  `action`: `eat` | `like` | `nope` | `change`
- `GET /api/history/:userId` — toàn bộ lịch sử
- `GET /api/preferences/:userId` — tổng hợp gu ăn uống + gợi ý "thử món mới"

### 3) Google Places (Maps thật)
- `GET /api/places?lat=&lng=&keyword=&radius=` — quán ăn thật quanh vị trí
  - Có `GOOGLE_MAPS_API_KEY` → gọi Google Places API (New)
  - Không có key → trả dữ liệu quán mẫu (`source: "fallback"`)

## Lưu trữ
Dữ liệu lưu dạng JSON file trong `data/`:
- `restaurants.json` — danh sách quán (có commit sẵn)
- `history.json` — lịch sử người dùng (tự tạo lúc chạy, **không** commit)

> Đây là bản demo. Khi lên production nên thay bằng database thật (PostgreSQL / MongoDB).

## Kết nối với frontend
Frontend (ở thư mục gốc repo) hiện dùng dữ liệu tĩnh trong `locations.js` / `index.html`.
Để dùng backend, đặt biến `API_BASE` trong frontend trỏ về URL server rồi gọi các endpoint trên.

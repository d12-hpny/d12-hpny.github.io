# Lì Xì Tết - Lucky Wheel App 🎊

Ứng dụng quay vòng may mắn Tết Nguyên Đán với React, TypeScript, Vite và Supabase.

## 🚀 Quick Start

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình môi trường
Copy file `.env.example` thành `.env` và điền thông tin:
```bash
cp .env.example .env
```

Cập nhật các biến môi trường:
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth Client ID
- `VITE_SUPABASE_URL`: URL của Supabase project
- `VITE_SUPABASE_ANON_KEY`: Anon key từ Supabase

### 3. Chạy Development Server
```bash
npm run dev
```

## 📁 Project Structure

```
├── src/
│   ├── components/     # React components
│   ├── lib/           # Supabase client & utilities
│   └── App.tsx        # Main app component
└── public/            # Static assets
```

## 🎯 Features

- ✅ Google OAuth Authentication
- ✅ Lucky Wheel Spinning
- ✅ Prize Management
- ✅ QR Code Upload for Prize Claims
- ✅ Admin Controls (pause, time range, prizes)
- ✅ Real-time Winner List
- ✅ Pending Prize Recovery

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Auth**: Google OAuth 2.0
- **Deployment**: Vercel/Firebase Hosting

## 📝 License


Private project for internal use.

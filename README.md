# 🧭 The Life Navigator — NORTH Repository

> **NORTH** = New Online Repository with Teaching Hub

This is the upgraded version of the [south](https://github.com/thelifenavigator/south) repository — with a **Live Classroom** module added for logged-in users.

---

## 📁 Folder Structure

```
north/
├── index.html                    ← Login page (same as south, updated)
├── parents_homepage.html         ← Home after login (updated with Live Class card)
├── dashboard.html                ← Assessment dashboard (unchanged from south)
├── changepw.html                 ← Change password
│
├── TLN_FULL/
│   ├── live_classroom/
│   │   ├── live_home.html        ← 🆕 Live class lobby (teacher/student join)
│   │   ├── classroom.html        ← 🆕 The actual video room (LiveKit embedded)
│   │   └── schedule.html         ← 🆕 Upcoming classes from Google Sheet
│   │
│   ├── skilling_practice/        ← (your existing modules go here)
│   └── tests/                    ← (your existing test modules go here)
│
├── assets/
│   ├── css/
│   │   └── north-theme.css       ← Shared theme variables
│   └── js/
│       └── auth.js               ← Shared auth helper (localStorage checks)
│
└── gas/
    ├── Code.gs                   ← 🆕 Updated Apps Script (adds live class sheet)
    └── README_GAS.md             ← How to deploy the Apps Script
```

---

## 🔧 Tech Stack (same as south, zero new servers needed)

| Layer | Technology | Cost |
|---|---|---|
| Hosting | GitHub Pages | **Free** |
| Auth | Google Cloud Function (existing) | **Free tier** |
| Database | Google Sheets via Apps Script | **Free** |
| Video | LiveKit Cloud (free tier = 100 concurrent) | **Free → $0.006/min** |
| Real-time | LiveKit WebSocket (built-in) | Included |

---

## 🚀 Setup Steps

### 1. Copy this repo to GitHub
```bash
git clone https://github.com/thelifenavigator/south
# copy files, rename to north
git remote set-url origin https://github.com/thelifenavigator/north
git push
```

### 2. Add Live Classroom Sheet to your Google Sheet
- Open your existing spreadsheet (`17W7fNdG7J5HFZ5N8g1Y5yQMVSA-BQb5xj40TSl59C_w`)
- Add a new tab called `live_classes`
- Columns: `class_id | title | teacher | scheduled_time | livekit_room | status`

### 3. Deploy updated Apps Script
- Open `gas/Code.gs`
- Paste into your existing Apps Script project
- Re-deploy as Web App

### 4. Get LiveKit Cloud Token
- Sign up free at https://cloud.livekit.io
- Create a project → get `API_KEY` and `API_SECRET`
- Add them to `TLN_FULL/live_classroom/live_home.html`

---

## 🔐 Auth Flow (unchanged from south)

```
Login Page → Google Cloud Function validates user
         → On success: writes to localStorage
         → Redirects to parents_homepage.html
         → All pages check localStorage on load
         → If empty → redirect back to login
```

---

## 🎥 Live Classroom Flow (NEW)

```
parents_homepage.html
  → Click "Live Class" card
  → live_home.html (fetches schedule from Google Sheet)
  → User clicks "Join"
  → classroom.html (LiveKit video room loads)
  → Teacher controls: mute, screen share, whiteboard
  → Student controls: raise hand, chat
```

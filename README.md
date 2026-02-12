# 🧧 Lunar New Year Li Xi Wheel 🧧

A festive web application for celebrating Lunar New Year with a fun prize wheel game!

## Features

- 🎡 **Interactive Spinning Wheel** - Spin to win prizes!
- 🔐 **Google OAuth Login** - Secure authentication
- ⚙️ **Host Settings** - Configure budget, prizes, and event timing
- ⏰ **Countdown Timer** - Shows time until event starts/ends
- 🎁 **Prize Management** - Track winners and submissions
- 📱 **Responsive Design** - Works on mobile and desktop
- 🎨 **Festive Theme** - Red and gold Lunar New Year colors

## Live Demo

Visit: [https://d12-hpny.github.io](https://d12-hpny.github.io)

## Setup Instructions

### 1. Firebase Configuration (Required for full functionality)

To enable Google login and real-time data synchronization:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable **Authentication** with Google sign-in provider
4. Enable **Realtime Database**
5. Enable **Storage** (optional, for QR code images)
6. Get your Firebase configuration from Project Settings
7. Replace the placeholder config in `app.js`:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT.firebaseio.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 2. Database Rules (Recommended)

Set these Realtime Database rules for security:

```json
{
  "rules": {
    "settings": {
      ".read": true,
      ".write": "auth != null && root.child('host').val() == auth.uid"
    },
    "host": {
      ".read": true,
      ".write": "!data.exists()"
    },
    "submissions": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

### 3. GitHub Pages Deployment

This repository is already configured for GitHub Pages. Any commits to the main branch will automatically deploy.

## Usage

### For Hosts:
1. **Login** with your Google account
2. Click **Settings** to configure:
   - Total budget
   - Prize list (name and value)
   - Event start and end times
3. Share the link with participants
4. Monitor submissions and send gifts to winners

### For Participants:
1. **Login** (optional, but recommended)
2. Wait for the event to start (countdown timer shows remaining time)
3. Click **SPIN THE WHEEL!**
4. Submit your payment QR code or payment information
5. Wait for the host to send your prize!

## Demo Mode

The application works in demo mode without Firebase configuration:
- Settings are saved to localStorage
- No real authentication (simulated)
- Submissions stored locally
- Perfect for testing and development

## Technology Stack

- **HTML5/CSS3** - Structure and styling
- **Vanilla JavaScript** - Application logic
- **Firebase** - Authentication, Database, and Storage
- **Canvas API** - Wheel rendering and animation

## Customization

### Changing Colors
Edit `style.css` to modify the color scheme:
- Background gradient
- Wheel segment colors
- Button colors

### Adding More Prizes
In the Settings modal, add prizes in this format:
```
Prize Name - Prize Value
$100 Red Envelope - 100
$50 Red Envelope - 50
Good Luck - 0
```

### Adjusting Wheel Animation
In `app.js`, modify the `spinWheel()` function:
- `spins`: Number of rotations (default: 5-8)
- `duration`: Animation duration in milliseconds (default: 3000)

## License

MIT License - Feel free to use and modify!

## Happy Lunar New Year! 🎊

恭喜發財！紅包拿來！ (Gong Xi Fa Cai! Give me red envelopes!)
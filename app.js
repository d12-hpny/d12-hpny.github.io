// Firebase Configuration
// Note: Replace these with your actual Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDemoKey-ReplaceWithYourActualKey",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project.firebaseio.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
let app, auth, database, storage;
let currentUser = null;
let isHost = false;
let eventSettings = null;
let hasSpun = false;
let currentRotation = 0;

// Default prizes
const defaultPrizes = [
    { name: "$100 Red Envelope", value: 100, color: "#ff0000" },
    { name: "$50 Red Envelope", value: 50, color: "#ffd700" },
    { name: "$20 Red Envelope", value: 20, color: "#ff6b6b" },
    { name: "$10 Red Envelope", value: 10, color: "#ffaa00" },
    { name: "Good Luck", value: 0, color: "#4ecdc4" },
    { name: "Try Again", value: 0, color: "#95e1d3" }
];

// Initialize app
function initApp() {
    try {
        app = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        database = firebase.database();
        storage = firebase.storage();
        console.log("Firebase initialized successfully");
    } catch (error) {
        console.error("Firebase initialization error:", error);
        // For demo purposes, we'll continue without Firebase
        console.log("Running in demo mode without Firebase");
    }

    setupEventListeners();
    loadEventSettings();
    drawWheel(defaultPrizes);
    updateCountdown();
    loadSubmissions();

    // Check auth state
    if (auth) {
        auth.onAuthStateChanged(handleAuthStateChange);
    }
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('loginBtn')?.addEventListener('click', handleLogin);
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    document.getElementById('settingsBtn')?.addEventListener('click', openSettings);
    document.getElementById('spinBtn')?.addEventListener('click', spinWheel);
    document.getElementById('submitQrBtn')?.addEventListener('click', submitQR);
    document.getElementById('settingsForm')?.addEventListener('submit', saveSettings);
    
    // Modal close
    const closeBtn = document.querySelector('.close');
    closeBtn?.addEventListener('click', closeSettings);
    
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('settingsModal');
        if (e.target === modal) {
            closeSettings();
        }
    });
}

// Auth handlers
function handleLogin() {
    if (!auth) {
        alert("Firebase not configured. Please add your Firebase configuration.");
        return;
    }
    
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(error => {
        console.error("Login error:", error);
        alert("Login failed: " + error.message);
    });
}

function handleLogout() {
    if (auth) {
        auth.signOut();
    }
}

function handleAuthStateChange(user) {
    currentUser = user;
    
    if (user) {
        // User logged in
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('userSection').classList.remove('hidden');
        document.getElementById('userName').textContent = user.displayName || user.email;
        document.getElementById('userPhoto').src = user.photoURL || 'https://via.placeholder.com/50';
        
        // Check if user is host (first user or admin)
        checkIfHost(user.uid);
    } else {
        // User logged out
        document.getElementById('loginSection').classList.remove('hidden');
        document.getElementById('userSection').classList.add('hidden');
        isHost = false;
        document.getElementById('settingsBtn').style.display = 'none';
    }
}

function checkIfHost(uid) {
    if (!database) {
        // Demo mode: make first user host
        isHost = true;
        document.getElementById('settingsBtn').style.display = 'inline-block';
        return;
    }
    
    database.ref('host').once('value', snapshot => {
        if (!snapshot.exists()) {
            // No host set, make this user the host
            database.ref('host').set(uid);
            isHost = true;
            document.getElementById('settingsBtn').style.display = 'inline-block';
        } else if (snapshot.val() === uid) {
            isHost = true;
            document.getElementById('settingsBtn').style.display = 'inline-block';
        } else {
            isHost = false;
            document.getElementById('settingsBtn').style.display = 'none';
        }
    });
}

// Settings modal
function openSettings() {
    if (!isHost) {
        alert("Only the host can change settings");
        return;
    }
    
    const modal = document.getElementById('settingsModal');
    modal.classList.remove('hidden');
    
    // Load current settings
    if (eventSettings) {
        document.getElementById('budgetInput').value = eventSettings.budget || 0;
        
        const prizesText = eventSettings.prizes.map(p => 
            `${p.name} - ${p.value}`
        ).join('\n');
        document.getElementById('prizesInput').value = prizesText;
        
        if (eventSettings.startTime) {
            document.getElementById('startTimeInput').value = 
                new Date(eventSettings.startTime).toISOString().slice(0, 16);
        }
        if (eventSettings.endTime) {
            document.getElementById('endTimeInput').value = 
                new Date(eventSettings.endTime).toISOString().slice(0, 16);
        }
    }
}

function closeSettings() {
    document.getElementById('settingsModal').classList.add('hidden');
}

function saveSettings(e) {
    e.preventDefault();
    
    const budget = parseFloat(document.getElementById('budgetInput').value);
    const prizesText = document.getElementById('prizesInput').value;
    const startTime = new Date(document.getElementById('startTimeInput').value).getTime();
    const endTime = new Date(document.getElementById('endTimeInput').value).getTime();
    
    // Parse prizes
    const prizes = [];
    const lines = prizesText.split('\n').filter(line => line.trim());
    const colors = ['#ff0000', '#ffd700', '#ff6b6b', '#ffaa00', '#4ecdc4', '#95e1d3'];
    
    lines.forEach((line, index) => {
        const parts = line.split('-').map(s => s.trim());
        if (parts.length >= 2) {
            prizes.push({
                name: parts[0],
                value: parseFloat(parts[1]) || 0,
                color: colors[index % colors.length]
            });
        }
    });
    
    const settings = {
        budget,
        prizes: prizes.length > 0 ? prizes : defaultPrizes,
        startTime,
        endTime,
        updatedAt: Date.now()
    };
    
    if (database) {
        database.ref('settings').set(settings).then(() => {
            alert("Settings saved successfully!");
            eventSettings = settings;
            drawWheel(settings.prizes);
            closeSettings();
        }).catch(error => {
            console.error("Error saving settings:", error);
            alert("Error saving settings: " + error.message);
        });
    } else {
        // Demo mode
        eventSettings = settings;
        localStorage.setItem('eventSettings', JSON.stringify(settings));
        drawWheel(settings.prizes);
        alert("Settings saved (demo mode)!");
        closeSettings();
    }
}

function loadEventSettings() {
    if (database) {
        database.ref('settings').on('value', snapshot => {
            if (snapshot.exists()) {
                eventSettings = snapshot.val();
                drawWheel(eventSettings.prizes);
            } else {
                eventSettings = {
                    budget: 1000,
                    prizes: defaultPrizes,
                    startTime: Date.now(),
                    endTime: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days from now
                };
            }
        });
    } else {
        // Demo mode
        const saved = localStorage.getItem('eventSettings');
        if (saved) {
            eventSettings = JSON.parse(saved);
        } else {
            eventSettings = {
                budget: 1000,
                prizes: defaultPrizes,
                startTime: Date.now(),
                endTime: Date.now() + 7 * 24 * 60 * 60 * 1000
            };
        }
        drawWheel(eventSettings.prizes);
    }
}

// Countdown timer
function updateCountdown() {
    setInterval(() => {
        if (!eventSettings) return;
        
        const now = Date.now();
        const startTime = eventSettings.startTime;
        const endTime = eventSettings.endTime;
        
        let text = '';
        
        if (now < startTime) {
            const diff = startTime - now;
            text = `Event starts in: ${formatTime(diff)}`;
            document.getElementById('spinBtn').disabled = true;
        } else if (now >= startTime && now < endTime) {
            const diff = endTime - now;
            text = `Event ends in: ${formatTime(diff)}`;
            document.getElementById('spinBtn').disabled = false;
        } else {
            text = 'Event has ended';
            document.getElementById('spinBtn').disabled = true;
        }
        
        document.getElementById('countdownText').textContent = text;
    }, 1000);
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

// Wheel drawing
function drawWheel(prizes) {
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const sliceAngle = (2 * Math.PI) / prizes.length;
    
    prizes.forEach((prize, index) => {
        const startAngle = index * sliceAngle + currentRotation;
        const endAngle = startAngle + sliceAngle;
        
        // Draw slice
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = prize.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 3;
        ctx.fillText(prize.name, radius * 0.6, 5);
        ctx.restore();
    });
    
    // Draw pointer
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius - 20);
    ctx.lineTo(centerX - 15, centerY - radius);
    ctx.lineTo(centerX + 15, centerY - radius);
    ctx.closePath();
    ctx.fillStyle = '#d32f2f';
    ctx.fill();
}

// Spin wheel
function spinWheel() {
    if (!eventSettings) return;
    
    const now = Date.now();
    if (now < eventSettings.startTime || now >= eventSettings.endTime) {
        alert("The event is not active right now!");
        return;
    }
    
    if (hasSpun && !isHost) {
        alert("You have already spun the wheel!");
        return;
    }
    
    const spinBtn = document.getElementById('spinBtn');
    spinBtn.disabled = true;
    spinBtn.textContent = 'SPINNING...';
    
    const prizes = eventSettings.prizes;
    const randomIndex = Math.floor(Math.random() * prizes.length);
    const prizeAngle = (2 * Math.PI / prizes.length) * randomIndex;
    
    // Calculate spins
    const spins = 5 + Math.random() * 3; // 5-8 full rotations
    const targetRotation = spins * 2 * Math.PI + prizeAngle;
    
    const duration = 3000; // 3 seconds
    const startTime = Date.now();
    const startRotation = currentRotation;
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        currentRotation = startRotation + targetRotation * easeOut;
        
        drawWheel(prizes);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Normalize rotation
            currentRotation = currentRotation % (2 * Math.PI);
            showPrize(prizes[randomIndex]);
            hasSpun = true;
        }
    }
    
    animate();
}

function showPrize(prize) {
    document.getElementById('spinBtn').textContent = 'SPIN THE WHEEL!';
    document.getElementById('spinBtn').disabled = hasSpun && !isHost;
    
    const prizeDisplay = document.getElementById('prizeDisplay');
    const prizeText = document.getElementById('prizeText');
    
    prizeText.textContent = `You won: ${prize.name}!`;
    if (prize.value > 0) {
        prizeText.textContent += ` ($${prize.value})`;
    }
    
    prizeDisplay.classList.remove('hidden');
}

// QR submission
function submitQR() {
    const qrUrl = document.getElementById('qrCodeInput').value;
    const qrFile = document.getElementById('qrImageInput').files[0];
    
    if (!qrUrl && !qrFile) {
        alert("Please provide a QR code URL or upload an image");
        return;
    }
    
    if (!currentUser) {
        alert("Please login first");
        return;
    }
    
    const prizeText = document.getElementById('prizeText').textContent;
    
    const submission = {
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        userPhoto: currentUser.photoURL || '',
        prize: prizeText,
        qrUrl: qrUrl || '',
        timestamp: Date.now()
    };
    
    if (database) {
        database.ref('submissions').push(submission).then(() => {
            alert("QR code submitted successfully! Wait for the host to send your gift.");
            document.getElementById('qrCodeInput').value = '';
            document.getElementById('qrImageInput').value = '';
        }).catch(error => {
            console.error("Error submitting:", error);
            alert("Error submitting: " + error.message);
        });
    } else {
        // Demo mode
        const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
        submissions.push(submission);
        localStorage.setItem('submissions', JSON.stringify(submissions));
        alert("QR code submitted (demo mode)!");
        document.getElementById('qrCodeInput').value = '';
        document.getElementById('qrImageInput').value = '';
        loadSubmissions();
    }
}

// Load submissions
function loadSubmissions() {
    const submissionsContent = document.getElementById('submissionsContent');
    
    if (database) {
        database.ref('submissions').on('value', snapshot => {
            submissionsContent.innerHTML = '';
            
            if (!snapshot.exists()) {
                submissionsContent.innerHTML = '<p>No submissions yet. Be the first to spin!</p>';
                return;
            }
            
            const submissions = [];
            snapshot.forEach(child => {
                submissions.push({ id: child.key, ...child.val() });
            });
            
            // Sort by timestamp (newest first)
            submissions.sort((a, b) => b.timestamp - a.timestamp);
            
            submissions.forEach(sub => {
                const item = createSubmissionItem(sub);
                submissionsContent.appendChild(item);
            });
        });
    } else {
        // Demo mode
        const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
        submissionsContent.innerHTML = '';
        
        if (submissions.length === 0) {
            submissionsContent.innerHTML = '<p>No submissions yet. Be the first to spin!</p>';
            return;
        }
        
        submissions.sort((a, b) => b.timestamp - a.timestamp);
        submissions.forEach(sub => {
            const item = createSubmissionItem(sub);
            submissionsContent.appendChild(item);
        });
    }
}

function createSubmissionItem(submission) {
    const div = document.createElement('div');
    div.className = 'submission-item';
    
    let html = `
        <strong>${submission.userName}</strong>
        <p>${submission.prize}</p>
        <p><small>${new Date(submission.timestamp).toLocaleString()}</small></p>
    `;
    
    if (submission.qrUrl) {
        html += `
            <div class="submission-qr">
                <p>Payment QR Code:</p>
                <p><a href="${submission.qrUrl}" target="_blank">${submission.qrUrl}</a></p>
            </div>
        `;
    }
    
    div.innerHTML = html;
    return div;
}

// Start app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

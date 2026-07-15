/* ================= STARFIELD BACKGROUND SYSTEM ================= */
const starsCanvas = document.getElementById('stars-canvas');
const starsCtx = starsCanvas.getContext('2d');

let stars = [];
const STAR_COUNT = 85;

function resizeCanvas() {
    starsCanvas.width = window.innerWidth;
    starsCanvas.height = window.innerHeight;
    initStars();
}

function initStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * starsCanvas.width,
            y: Math.random() * starsCanvas.height,
            size: Math.random() * 1.5 + 0.5,
            alpha: Math.random(),
            twinkleSpeed: Math.random() * 0.02 + 0.005,
            direction: Math.random() > 0.5 ? 1 : -1
        });
    }
}

function drawStars() {
    starsCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
    starsCtx.fillStyle = '#ffffff';

    for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        
        // Twinkle effect
        s.alpha += s.twinkleSpeed * s.direction;
        if (s.alpha >= 1) {
            s.alpha = 1;
            s.direction = -1;
        } else if (s.alpha <= 0.2) {
            s.alpha = 0.2;
            s.direction = 1;
        }

        starsCtx.globalAlpha = s.alpha;
        starsCtx.beginPath();
        starsCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        starsCtx.fill();
    }
    
    starsCtx.globalAlpha = 1;
    requestAnimationFrame(drawStars);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
drawStars();

/* ================= WEB AUDIO MUSIC BOX SYNTHESIZER ================= */
let audioCtx = null;
let musicInterval = null;
let currentNoteIndex = 0;
let isMusicPlaying = false;
let backgroundAudio = new Audio('audio/senorita.mp3');
backgroundAudio.loop = true;
backgroundAudio.preload = 'auto';
let musicUsingFile = false;

// Happy Birthday Sweet Music Box Notes (G major)
const birthdayMelody = [
    { freq: 293.66, dur: 0.7 },  // D4
    { freq: 293.66, dur: 0.3 },  // D4
    { freq: 329.63, dur: 1.0 },  // E4
    { freq: 293.66, dur: 1.0 },  // D4
    { freq: 392.00, dur: 1.0 },  // G4
    { freq: 369.99, dur: 2.0 },  // F#4
    
    { freq: 293.66, dur: 0.7 },  // D4
    { freq: 293.66, dur: 0.3 },  // D4
    { freq: 329.63, dur: 1.0 },  // E4
    { freq: 293.66, dur: 1.0 },  // D4
    { freq: 440.00, dur: 1.0 },  // A4
    { freq: 392.00, dur: 2.0 },  // G4
    
    { freq: 293.66, dur: 0.7 },  // D4
    { freq: 293.66, dur: 0.3 },  // D4
    { freq: 587.33, dur: 1.0 },  // D5
    { freq: 493.88, dur: 1.0 },  // B4
    { freq: 392.00, dur: 1.0 },  // G4
    { freq: 369.99, dur: 1.0 },  // F#4
    { freq: 329.63, dur: 1.0 },  // E4
    
    { freq: 523.25, dur: 0.7 },  // C5
    { freq: 523.25, dur: 0.3 },  // C5
    { freq: 493.88, dur: 1.0 },  // B4
    { freq: 392.00, dur: 1.0 },  // G4
    { freq: 440.00, dur: 1.0 },  // A4
    { freq: 392.00, dur: 2.5 }   // G4
];

const noteTempo = 130; // BPM
const secondsPerBeat = 60 / noteTempo;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Custom Music Box Synth Pluck
function playMusicBoxNote(freq, startTime, duration) {
    if (!audioCtx) return;

    // Main sweet bell oscillator (Sine)
    const osc1 = audioCtx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);

    // Warmth harmonics oscillator (Triangle at double frequency, very quiet)
    const osc2 = audioCtx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, startTime);

    // Envelope for the pluck
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, startTime);
    // Fast attack (metallic strike click)
    gainNode.gain.linearRampToValueAtTime(0.22, startTime + 0.01);
    // Beautiful slow music box ring out
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 2.2);

    // Lowpass filter to keep it dreamy and soft
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, startTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration * 2.3);
    osc2.stop(startTime + duration * 2.3);

    // Occasional dreamy background harp/arpeggio note for harmony
    if (Math.random() > 0.4) {
        const harmonyOffset = freq * 1.5; // Perfect fifth
        const arpeggioOsc = audioCtx.createOscillator();
        arpeggioOsc.type = 'sine';
        arpeggioOsc.frequency.setValueAtTime(harmonyOffset, startTime + 0.08);

        const harpGain = audioCtx.createGain();
        harpGain.gain.setValueAtTime(0, startTime + 0.08);
        harpGain.gain.linearRampToValueAtTime(0.07, startTime + 0.09);
        harpGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08 + (duration * 1.5));

        arpeggioOsc.connect(harpGain);
        harpGain.connect(audioCtx.destination);

        arpeggioOsc.start(startTime + 0.08);
        arpeggioOsc.stop(startTime + 0.08 + (duration * 1.6));
    }
}

// Scheduling loop
function scheduler() {
    if (!isMusicPlaying) return;

    const currentNote = birthdayMelody[currentNoteIndex];
    const duration = currentNote.dur * secondsPerBeat;

    playMusicBoxNote(currentNote.freq, audioCtx.currentTime, duration);

    currentNoteIndex = (currentNoteIndex + 1) % birthdayMelody.length;
    
    // Schedule next note precisely
    musicInterval = setTimeout(scheduler, duration * 1000);
}

async function startMusic() {
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }

    // Try to play a user-supplied audio file first (audio/senorita.mp3).
    // If it fails (file missing or playback blocked), fall back to the synth melody.
    try {
        await backgroundAudio.play();
        musicUsingFile = true;
        isMusicPlaying = true;
        return;
    } catch (err) {
        // Fallback to synth
        musicUsingFile = false;
        console.warn('Background audio play failed, falling back to synth:', err);
    }

    isMusicPlaying = true;
    currentNoteIndex = 0;
    scheduler();
}

function stopMusic() {
    isMusicPlaying = false;
    clearTimeout(musicInterval);
    if (musicUsingFile && backgroundAudio && !backgroundAudio.paused) {
        backgroundAudio.pause();
        backgroundAudio.currentTime = 0;
    }
}

// Background Music Toggle Button handler
const musicToggleBtn = document.getElementById('musicToggleBtn');
musicToggleBtn.addEventListener('click', async () => {
    if (isMusicPlaying) {
        stopMusic();
        musicToggleBtn.classList.remove('playing');
    } else {
        await startMusic();
        musicToggleBtn.classList.add('playing');
    }
});

/* ================= SYNTH SOUND EFFECTS (SFX) ================= */

// 1. Chime effect (for opening envelope / wishing)
function playChimeSFX() {
    initAudio();
    const now = audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.5);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.6);
    });
}

// 2. Whoosh puff effect (for blowing out candle)
function playWhooshSFX() {
    initAudio();
    if (!audioCtx) return;
    
    const bufferSize = audioCtx.sampleRate * 0.35; // 0.35 seconds
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Fill buffer with random noise values
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = buffer;
    
    // Create filter to shape sound into breath puff
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.35);
    
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    
    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    noiseSource.start();
}

// 3. Magical Reveal arpeggio (for gift opening)
function playMagicRevealSFX() {
    initAudio();
    const now = audioCtx.currentTime;
    const chords = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51];
    
    chords.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.1, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.6);
        
        const vibrato = audioCtx.createOscillator();
        vibrato.frequency.value = 8;
        const vibratoGain = audioCtx.createGain();
        vibratoGain.gain.value = 5;
        
        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc.frequency);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        vibrato.start(now + idx * 0.06);
        osc.start(now + idx * 0.06);
        vibrato.stop(now + idx * 0.06 + 0.7);
        osc.stop(now + idx * 0.06 + 0.7);
    });
}

/* ================= PAGE ROUTING (NAVIGATION) ================= */
const navItems = document.querySelectorAll('.nav-item');
const pageSections = document.querySelectorAll('.page-section');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const targetPageId = item.getAttribute('data-page');
        
        // Update Nav Menu active state
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Switch Section views
        pageSections.forEach(section => {
            section.classList.remove('active');
            if (section.id === targetPageId) {
                section.classList.add('active');
            }
        });
        
        // Initialize audio context if muted on first click
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    });
});

/* ================= AMBIENT PARTICLES (BALLOONS & HEARTS) ================= */
const particleContainer = document.getElementById('ambient-particles');

const BALLOON_COLORS = [
    'linear-gradient(45deg, #ff4d6d, #ff758f)',
    'linear-gradient(45deg, #ffd166, #ffb703)',
    'linear-gradient(45deg, #4cd137, #44bd32)',
    'linear-gradient(45deg, #00a8ff, #0097e6)',
    'linear-gradient(45deg, #9c27b0, #ab47bc)',
    'linear-gradient(45deg, #e84118, #c23616)'
];

function spawnBalloon() {
    // Only spawn if active tab is first or second (keep clean)
    const currentActiveSection = document.querySelector('.page-section.active');
    if (currentActiveSection.id === 'page-cartoon' && document.getElementById('memoriesSlider').classList.contains('reveal')) {
        // Stop spawning excessive balloons on polaroid gallery
        return;
    }

    const balloon = document.createElement('div');
    balloon.className = 'balloon';
    
    const randomColor = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
    balloon.style.background = randomColor;
    balloon.style.left = Math.random() * 100 + 'vw';
    
    // Scale size slightly
    const scale = Math.random() * 0.4 + 0.8;
    balloon.style.transform = `scale(${scale})`;
    
    // String
    const string = document.createElement('div');
    string.className = 'balloon-string';
    balloon.appendChild(string);
    
    // Physics animation speeds
    const floatDuration = Math.random() * 6 + 9; // 9s to 15s
    balloon.style.animationDuration = floatDuration + 's';
    
    particleContainer.appendChild(balloon);
    
    // Cleanup
    setTimeout(() => {
        balloon.remove();
    }, floatDuration * 1000);
}

function spawnHeart() {
    const heart = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    heart.setAttribute('viewBox', '0 0 32 32');
    heart.setAttribute('class', 'heart-particle');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M16 28.5L4.3 16.8c-2.9-2.9-2.9-7.6 0-10.5 2.9-2.9 7.6-2.9 10.5 0l1.2 1.2 1.2-1.2c2.9-2.9 7.6-2.9 10.5 0 2.9 2.9 2.9 7.6 0 10.5L16 28.5z');
    heart.appendChild(path);
    
    heart.style.left = Math.random() * 100 + 'vw';
    const scale = Math.random() * 0.6 + 0.6;
    heart.style.transform = `scale(${scale})`;
    
    const duration = Math.random() * 5 + 6; // 6s to 11s
    heart.style.animationDuration = duration + 's';
    
    particleContainer.appendChild(heart);
    
    setTimeout(() => {
        heart.remove();
    }, duration * 1000);
}

// Periodically spawn decorations
setInterval(spawnBalloon, 4000);
setInterval(spawnHeart, 3000);

/* ================= SECTION 1: INTERACTIVE ENVELOPE ================= */
const envelope = document.getElementById('envelope');
    const letterEl = document.getElementById('letter');
    envelope.addEventListener('click', () => {
        if (!envelope.classList.contains('open')) {
            playChimeSFX();
            envelope.classList.add('open');
            if (envelopeContentWrapper) envelopeContentWrapper.classList.add('envelope-open');

            // After the opening animation starts, ensure the letter is fully visible in the viewport
            setTimeout(() => {
                if (!letterEl) return;
                const rect = letterEl.getBoundingClientRect();
                const margin = 18; // small breathing room from viewport edge
                if (rect.bottom > window.innerHeight - margin) {
                    const delta = rect.bottom - (window.innerHeight - margin);
                    window.scrollBy({ top: delta, left: 0, behavior: 'smooth' });
                }
            }, 140);
        } else {
            envelope.classList.remove('open');
            if (envelopeContentWrapper) envelopeContentWrapper.classList.remove('envelope-open');
        }
    });

/* ================= CANVAS CONFETTI SYSTEM ================= */
const confettiCanvas = document.getElementById('confetti-canvas');
const confettiCtx = confettiCanvas.getContext('2d');
let activeConfetti = [];

function resizeConfettiCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeConfettiCanvas);
resizeConfettiCanvas();

const CONFETTI_COLORS = ['#ff4d6d', '#ff758f', '#ffd166', '#4cd137', '#00a8ff', '#9c27b0', '#ffccd5'];

class ConfettiParticle {
    constructor(x, y, isHeart = false) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 8 + 6;
        this.color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * -10 - 5; // Launch upward
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 10 - 5;
        this.gravity = 0.22;
        this.isHeart = isHeart;
        this.opacity = 1;
        this.fadeSpeed = Math.random() * 0.005 + 0.005;
    }

    update() {
        this.x += this.speedX;
        this.speedY += this.gravity;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;
        this.opacity -= this.fadeSpeed;
    }

    draw() {
        confettiCtx.save();
        confettiCtx.translate(this.x, this.y);
        confettiCtx.rotate((this.rotation * Math.PI) / 180);
        confettiCtx.globalAlpha = this.opacity;
        
        if (this.isHeart) {
            confettiCtx.fillStyle = '#ff4d6d';
            // Heart draw
            confettiCtx.beginPath();
            confettiCtx.moveTo(0, this.size / 4);
            confettiCtx.bezierCurveTo(-this.size/2, -this.size/2, -this.size, this.size/3, 0, this.size);
            confettiCtx.bezierCurveTo(this.size, this.size/3, this.size/2, -this.size/2, 0, this.size / 4);
            confettiCtx.fill();
        } else {
            confettiCtx.fillStyle = this.color;
            confettiCtx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        }
        
        confettiCtx.restore();
    }
}

function spawnConfettiShower(x, y, count = 120, hearts = false) {
    for (let i = 0; i < count; i++) {
        activeConfetti.push(new ConfettiParticle(x, y, hearts));
    }
}

function animateConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    
    activeConfetti = activeConfetti.filter(p => p.opacity > 0 && p.y < confettiCanvas.height);
    
    activeConfetti.forEach(p => {
        p.update();
        p.draw();
    });
    
    requestAnimationFrame(animateConfetti);
}
animateConfetti();

/* ================= SECTION 2: INTERACTIVE CAKE & WISH ================= */
const candles = document.querySelectorAll('.candle-group');
let blownCandlesCount = 0;
const totalCandles = candles.length;
const wishModal = document.getElementById('wishModal');
const cakeInstruction = document.getElementById('cake-instruction');

candles.forEach(candle => {
    candle.addEventListener('click', () => {
        const flame = candle.querySelector('.flame-element');
        const smoke = candle.querySelector('.smoke-puff');
        
        // Prevent click if already blown out
        if (flame.classList.contains('extinguished')) return;
        
        // Extinguish Flame
        playWhooshSFX();
        flame.classList.remove('flickering');
        flame.classList.add('extinguished');
        
        // Billow Smoke puff
        smoke.classList.add('billow');
        smoke.style.opacity = '1';
        
        blownCandlesCount++;
        
        // Check if all candles are blown out
        if (blownCandlesCount === totalCandles) {
            cakeInstruction.textContent = "You did it! Happy Birthday! ✨";
            cakeInstruction.classList.add('text-glow');
            
            // Spark confetti shower from center of screen
            setTimeout(() => {
                spawnConfettiShower(window.innerWidth / 2, window.innerHeight * 0.4, 150);
                playChimeSFX();
            }, 500);

            // Pop open the Wish modal
            setTimeout(() => {
                wishModal.classList.add('active');
            }, 1600);
        }
    });
});

// Send Wish handler
const sendWishBtn = document.getElementById('sendWishBtn');
const wishInput = document.getElementById('wishInput');

sendWishBtn.addEventListener('click', () => {
    const wish = wishInput.value.trim();
    if (wish === "") return;
    
    // Close Modal
    wishModal.classList.remove('active');
    playChimeSFX();
    
    // Screen confetti splash!
    spawnConfettiShower(window.innerWidth / 2, window.innerHeight / 2, 100, true);
    
    // Update instruction text with sweet response
    cakeInstruction.textContent = "Your wish is swimming through the stars... 🌠";
    
    // Spawn custom magical star stream rising
    let count = 0;
    const wishStream = setInterval(() => {
        spawnHeart();
        count++;
        if (count > 8) clearInterval(wishStream);
    }, 200);
});

/* ================= SECTION 3: BEAR COMPANION & GIFT BOX ================= */
const bearCharacter = document.getElementById('bearCharacter');
const bearSpeech = document.getElementById('bearSpeech');

const bearDialogues = [
    "Hi darling! Tap me for a giant virtual hug! 🧸",
    "Sending you a million virtual hugs and kisses! 💋",
    "You are my absolute favorite person in the entire universe! ✨",
    "My heart does happy flips whenever you're around! 💓",
    "I hope today is filled with your absolute favorite treats! 🧁",
    "Yay, let's celebrate you all day long! 🥳",
    "Remember: You are incredibly special and loved! ❤️"
];
let currentDialogueIdx = 0;

bearCharacter.addEventListener('click', () => {
    // Play sweet bubble chime
    initAudio();
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);

    // Cycle dialogues
    currentDialogueIdx = (currentDialogueIdx + 1) % bearDialogues.length;
    bearSpeech.textContent = bearDialogues[currentDialogueIdx];
    
    // Bear wiggle bounce animation
    bearCharacter.style.transform = 'scale(1.08) translateY(-8px)';
    setTimeout(() => {
        bearCharacter.style.transform = 'none';
    }, 250);
});

// Gift Box Unwrap Handler
const giftBox = document.getElementById('giftBox');
const memoriesSlider = document.getElementById('memoriesSlider');

giftBox.addEventListener('click', () => {
    if (giftBox.classList.contains('opened')) return;
    
    // 1. Shake the box
    giftBox.classList.add('shake');
    
    setTimeout(() => {
        giftBox.classList.remove('shake');
        
        // 2. Play reveal chime + explode hearts
        playMagicRevealSFX();
        giftBox.classList.add('opened');
        
        // 3. Explosion Confetti
        const rect = giftBox.getBoundingClientRect();
        const boxX = rect.left + rect.width / 2;
        const boxY = rect.top + rect.height / 2;
        spawnConfettiShower(boxX, boxY, 80, true);
        
        // 4. Reveal Polaroid scrapbook slides
        setTimeout(() => {
            memoriesSlider.classList.add('reveal');
            
            // Auto scroll memories slider into view on mobile
            memoriesSlider.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            // Enable click-to-zoom for polaroid cards (useful on touch devices)
            setupPolaroidZoom();
        }, 500);
    }, 500);
});

// Add centered overlay preview for polaroid cards (idempotent)
function setupPolaroidZoom() {
    if (window._polaroidZoomSetup) return;
    window._polaroidZoomSetup = true;

    const cards = document.querySelectorAll('.polaroid-card');
    const overlay = document.createElement('div');
    overlay.className = 'polaroid-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = '<button class="polaroid-close-btn" aria-label="Close preview">×</button>';
    document.body.appendChild(overlay);

    const closeOverlay = () => {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('polaroid-body-open');
        document.body.style.overflow = '';
        const previewCard = overlay.querySelector('.polaroid-overlay-card');
        if (previewCard) previewCard.remove();
    };

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.classList.contains('polaroid-close-btn')) {
            closeOverlay();
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeOverlay();
    });

    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.stopPropagation();

            const previewCard = card.cloneNode(true);
            previewCard.classList.add('polaroid-overlay-card');
            previewCard.classList.remove('zoomed');
            previewCard.addEventListener('click', (ev) => ev.stopPropagation());

            const existingPreview = overlay.querySelector('.polaroid-overlay-card');
            if (existingPreview) existingPreview.remove();

            overlay.appendChild(previewCard);
            overlay.classList.add('active');
            overlay.setAttribute('aria-hidden', 'false');
            document.body.classList.add('polaroid-body-open');
            document.body.style.overflow = 'hidden';
        });
    });
}

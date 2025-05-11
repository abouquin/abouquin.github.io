// FlipZone Game JS
import { allTerms } from './terms.js';


// Shuffle and duplicate terms for the game
let selected = allTerms.sort(() => 0.5 - Math.random()).slice(0, 6);
let cardValues = [];
selected.forEach(t => {
    cardValues.push({ type: 'term', text: t.term, pair: t.def });
    cardValues.push({ type: 'def', text: t.def, pair: t.term });
});

// cardValues = cardValues.sort(() => 0.5 - Math.random());
for (let i = cardValues.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cardValues[i], cardValues[j]] = [cardValues[j], cardValues[i]];
}

const game = document.getElementById("game");
let firstCard = null;
let lockBoard = false;

cardValues.forEach(data => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.type = data.type;
    card.dataset.text = data.text;
    card.dataset.pair = data.pair;

    const inner = document.createElement("div");
    inner.classList.add("card-inner");

    const front = document.createElement("div");
    front.classList.add("card-front");
    front.innerText = "?";

    const back = document.createElement("div");
    back.classList.add("card-back");
    back.innerText = data.text;

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);
    game.appendChild(card);

    card.addEventListener("click", () => flipCard(card));
});

// Load sounds
const flipSound = new Audio('../sounds/flip-sound.mp3');
const matchSound = new Audio('../sounds/match-sound.mp3');
const clearedSound = new Audio('../sounds/cleared-sound.mp3');
const restartSound = new Audio('../sounds/restart-sound.mp3');



let flipCount = 0;  // Initialize flip counter
function flipCard(card) {
    if (lockBoard || card.classList.contains("matched") || card === firstCard) return;

    // Play the flip sound
    flipSound.currentTime = 0; // Reset the sound to the beginning
    flipSound.play();

    // Flip the card
    card.classList.add("flipped");

    // Increment flip count
    flipCount++;
    document.getElementById('flip-counter').innerText = flipCount;  // Update the displayed counter

    if (!firstCard) {
        firstCard = card;
        return;
    }

    lockBoard = true;
    if (
        firstCard.dataset.pair === card.dataset.text &&
        card.dataset.pair === firstCard.dataset.text
    ) {
        // Play the match sound
        matchSound.currentTime = 0; // Reset the sound to the beginning
        matchSound.play();

        firstCard.classList.add("matched");
        card.classList.add("matched");
        resetTurn();
    } else {
        setTimeout(() => {
            firstCard.classList.remove("flipped");
            card.classList.remove("flipped");
            resetTurn();
        }, 1000);
    }
}

function resetTurn() {
    const matchedCards = document.querySelectorAll('.card.matched');
    if (matchedCards.length === cardValues.length) {
        // Play the cleared sound
        clearedSound.currentTime = 0; // Reset the sound to the beginning
        clearedSound.play();

        launchConfetti();
    }
    [firstCard, lockBoard] = [null, false];
}

// Space background animation
const canvas = document.getElementById('space-bg');
const ctx = canvas.getContext('2d');
let stars = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

for (let i = 0; i < 150; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random(),
        dAlpha: Math.random() * 0.02 + 0.005
    });
}

function animateStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let star of stars) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fill();

        star.alpha += star.dAlpha;
        if (star.alpha <= 0 || star.alpha >= 1) {
            star.dAlpha = -star.dAlpha;
        }
    }
    requestAnimationFrame(animateStars);
}
animateStars();

// Confetti animation
const confettiCanvas = document.getElementById('confetti-canvas');
const cCtx = confettiCanvas.getContext('2d');
confettiCanvas.width = window.innerWidth;
confettiCanvas.height = window.innerHeight;
window.addEventListener('resize', () => {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
});

let confetti = [];

function launchConfetti() {
    confetti = [];
    for (let i = 0; i < 100; i++) {
        confetti.push({
            x: Math.random() * confettiCanvas.width,
            y: Math.random() * confettiCanvas.height - 200,
            r: Math.random() * 6 + 4,
            d: Math.random() * 0.5 + 0.5,
            color: `hsl(${Math.random() * 360}, 100%, 70%)`,
            tilt: Math.random() * 10 - 5,
            tiltAngle: 0,
            tiltAngleIncrement: Math.random() * 0.1 + 0.05,
        });
    }

    animateConfetti();
}

function animateConfetti() {
    cCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    for (let p of confetti) {
        cCtx.beginPath();
        cCtx.lineWidth = p.r;
        cCtx.strokeStyle = p.color;
        cCtx.moveTo(p.x + p.tilt, p.y);
        cCtx.lineTo(p.x + p.tilt + p.r, p.y + p.r);
        cCtx.stroke();

        p.y += p.d;
        p.tiltAngle += p.tiltAngleIncrement;
        p.tilt = Math.sin(p.tiltAngle) * 15;

        if (p.y > confettiCanvas.height) {
            p.y = -10;
            p.x = Math.random() * confettiCanvas.width;
        }
    }

    if (confetti.length > 0) {
        requestAnimationFrame(animateConfetti);
    }
}

// Restart button functionality
document.getElementById("restart").addEventListener("click", () => {
    // Play the restart sound
    restartSound.currentTime = 0; // Reset the sound to the beginning
    restartSound.play();
    
    game.innerHTML = "";
    firstCard = null;
    lockBoard = false;

    // Reshuffle and rebuild cards
    let newSelected = allTerms.sort(() => 0.5 - Math.random()).slice(0, 6);
    let newCards = [];
    newSelected.forEach(t => {
        newCards.push({ type: 'term', text: t.term, pair: t.def });
        newCards.push({ type: 'def', text: t.def, pair: t.term });
    });
    for (let i = newCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
    }

    newCards.forEach(data => {
        const card = document.createElement("div");
        card.classList.add("card");
        card.dataset.type = data.type;
        card.dataset.text = data.text;
        card.dataset.pair = data.pair;

        const inner = document.createElement("div");
        inner.classList.add("card-inner");

        const front = document.createElement("div");
        front.classList.add("card-front");
        front.innerText = "?";

        const back = document.createElement("div");
        back.classList.add("card-back");
        back.innerText = data.text;

        inner.appendChild(front);
        inner.appendChild(back);
        card.appendChild(inner);
        game.appendChild(card);

        card.addEventListener("click", () => flipCard(card));
    });

    // Clear confetti
    confetti = [];
    confettiCanvas.getContext('2d').clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    // Flash the restart button
    const restartBtn = document.getElementById("restart");
    restartBtn.classList.add("flash");

    setTimeout(() => {
        restartBtn.classList.remove("flash");
    }, 500); // remove flash after 0.5 seconds

    flipCount = 0;  // Reset flip counter
    document.getElementById('flip-counter').innerText = flipCount;  // Update the displayed counter
});

// Home button functionality
document.getElementById("home").addEventListener("click", () => {
    window.location.href = "../../index.html";
});
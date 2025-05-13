function updateLayoutMode() {
    const body = document.getElementById("body");
    if (window.innerWidth > window.innerHeight) {
        body.classList.add("landscape");
        body.classList.remove("portrait");
    } else {
        body.classList.add("portrait");
        body.classList.remove("landscape");
    }
}

// Initial check and respond to resizes
window.addEventListener("load", updateLayoutMode);
window.addEventListener("resize", updateLayoutMode);

let usedImages = [];
let totalImages = 110;
let currentImageNumber = null;
let correctAnswers = 0;
let totalImagesDisplayed = 0;

let answeredCorrectly = {};

function getRandomUnusedImage() {
    if (usedImages.length >= totalImages) return null;

    let index;
    do {
        index = Math.floor(Math.random() * totalImages) + 1;
    } while (usedImages.includes(index));

    usedImages.push(index);
    return index;
}

// Load a new image and update state
function loadNewImage() {
    const newIndex = getRandomUnusedImage();
    if (!newIndex) {
        document.getElementById("feedback").innerText = "All objects completed!";
        document.getElementById("feedback").style.color = "blue";
        return;
    }

    currentImageNumber = newIndex;
    totalImagesDisplayed++;
    updateScoreboard(); // Show initial scoreboard

    document.getElementById("image").style.display = "flex";
    document.getElementById("image").src = `images/M${newIndex}.jpg`;
    document.getElementById("zoom-controls").style.display = "flex";
    document.getElementById("inputnumber").style.display = "flex";
    document.getElementById("inputnumber").style.visibility = "visible";
    document.getElementById("numpad").style.visibility = "visible";

    // Reset input
    const input = document.getElementById("input");
    input.value = "";
    input.style.display = "flex";
    document.getElementById("numpad").style.display = "flex";

    // Hide buttons
    document.getElementById("next").classList.add("hidden");
    document.getElementById("finish").classList.add("hidden");

    // Clear feedback
    document.getElementById("feedback").innerText = "";

    // Clear confetti
    confetti = [];
    confettiCanvas.getContext('2d').clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

}

// Handle Home button
document.getElementById('home').addEventListener('click', () => {
    window.location.href = '../../index.html';
});

// Start Game button
document.getElementById('start-game').addEventListener('click', function () {
    document.querySelectorAll('.hidden').forEach(el => {
        el.classList.remove('hidden');
        el.classList.add('visible');
    });
    this.classList.add('hidden');
    loadNewImage();
});


// Next button
document.getElementById("next").addEventListener("click", () => {
    loadNewImage();
});

// Restart button
document.getElementById("restart").addEventListener("click", () => {
    usedImages = [];
    totalImagesDisplayed = 0;
    currentImageNumber = null;
    correctAnswers = 0;
    answeredCorrectly = {};

    // Hide and clear the thumbnails grid
    const thumbnailsDiv = document.getElementById("thumbnails");
    thumbnailsDiv.innerHTML = ''; // Clear all thumbnails
    thumbnailsDiv.classList.add('hidden'); // Hide the container

    // Optionally clear feedback
    document.getElementById("feedback").innerText = '';
    document.getElementById("feedback").style.color = '';
    document.getElementById("finish-feedback").innerText = '';

    loadNewImage();
});

// Finish button
document.getElementById("finish").addEventListener("click", () => {
    document.getElementById("image").style.display = "none";
    document.getElementById("zoom-controls").style.display = "none";
    document.getElementById("finish").classList.add('hidden');
    document.getElementById("next").classList.add('hidden');
    document.getElementById("inputnumber").style.display = "none";
    document.getElementById("numpad").style.display = "none";
    document.getElementById("feedback").style.display = "none";

    // Clear confetti
    confetti = [];
    confettiCanvas.getContext('2d').clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);


    const feedback = document.getElementById("finish-feedback");
    feedback.innerText = `Game Over! You answered ${correctAnswers} out of ${totalImagesDisplayed} correctly.`;
    feedback.style.color = "cyan";
    feedback.style.marginBottom = "20px";
    feedback.style.display = "block";

    const thumbnailGrid = document.getElementById("thumbnails");
    thumbnailGrid.innerHTML = ''; // Clear all thumbnails

    for (let i = 1; i <= totalImages; i++) {
        const thumbContainer = document.createElement("div");
        thumbContainer.classList.add("thumbnail-container");

        const thumb = document.createElement("img");
        thumb.src = `thumbnails/M${i}_thumb.jpg`;
        thumb.alt = `M${i}`;
        thumb.title = `M${i}`;

        // Create the M# label in top-left corner
        const label = document.createElement("div");
        label.innerText = `M${i}`;
        label.classList.add("label");

        // Append the image and label to the container
        thumbContainer.appendChild(thumb);
        thumbContainer.appendChild(label);

        // Set the border color based on answeredCorrectly
        if (answeredCorrectly.hasOwnProperty(i)) {
            thumb.style.border = answeredCorrectly[i] ? "3px solid green" : "3px solid red";
        } else {
            thumb.style.border = "3px solid black";
        }

        thumbnailGrid.appendChild(thumbContainer);
    }

    thumbnailGrid.classList.remove('hidden');
});

// Disable keyboard typing in input
const input = document.getElementById('input');
input.addEventListener('keydown', function (e) {
    e.preventDefault();
});

// Numpad buttons logic
const numpad = document.getElementById('numpad');
const numpadButtons = document.querySelectorAll('.numpad-button');
numpadButtons.forEach(button => {
    button.addEventListener('click', function () {
        const input = document.getElementById('input');
        const inputnumber = document.getElementById('inputnumber');
        const feedback = document.getElementById('feedback');
        const buttonText = this.innerText;

        if (buttonText === "Del") {
            input.value = input.value.slice(0, -1);
        } else if (buttonText === "Enter") {
            inputnumber.style.visibility = "hidden";
            numpad.style.visibility = "hidden";

            const isCorrect = input.value === currentImageNumber.toString();
            answeredCorrectly[currentImageNumber] = isCorrect;
            if (isCorrect) {
                launchConfetti();
                input.style.display = "none";
                numpad.style.display = "none";
                feedback.style.display = "block";
                feedback.innerText = `Correct! This is M${currentImageNumber.toString()}. Well done!`;
                feedback.style.color = "limegreen";
                feedback.style.fontSize = "1.5em";
                feedback.style.fontWeight = "bold";
                correctAnswers++;
            } else {
                input.style.display = "none";
                numpad.style.display = "none";
                feedback.style.display = "block";
                feedback.innerText = `Wrong! This is M${currentImageNumber.toString()}. Try again.`;
                feedback.style.color = "red";
            }

            // Update the scoreboard
            updateScoreboard();

            // Show finish
            document.getElementById("finish").classList.remove("hidden");

            // Hide next if no images left
            if (usedImages.length >= totalImages) {
                document.getElementById("next").classList.add("hidden");
            } else {
                document.getElementById("next").classList.remove("hidden");
            }
        } else {
            if (input.value.length < 3) {
                input.value += buttonText;
            }
        }
    });
});

function updateScoreboard() {
    const scoreboard = document.getElementById('scoreboard');
    const scoreList = document.getElementById('score');

    // Display the current score: correct answers / total images displayed
    scoreList.innerHTML = `Correct Answers: ${correctAnswers} / ${totalImagesDisplayed}`;

    // Show the scoreboard
    scoreboard.classList.remove('hidden');
}


// Zoom functionality
let currentZoom = 1;
const zoomStep = 1; // Increased zoom step

function applyZoom() {
    document.getElementById("image").style.transform = `scale(${currentZoom})`;
}

document.getElementById("zoom-in").addEventListener("click", () => {
    currentZoom += zoomStep;
    applyZoom();
});

document.getElementById("zoom-out").addEventListener("click", () => {
    currentZoom = Math.max(zoomStep, currentZoom - zoomStep);
    applyZoom();
});

document.getElementById("reset-zoom").addEventListener("click", () => {
    currentZoom = 1;
    applyZoom();
});

// Hint functionality
// Load hints from JSON file
let hintsData = {};

fetch('messier.json')
  .then(response => {
    if (!response.ok) throw new Error('Failed to load hints.json');
    return response.json();
  })
  .then(data => {
    hintsData = data.data; // Store the hints under the 'data' key
    console.log("Hints loaded:", hintsData);
  })
  .catch(error => {
    console.error('Error loading hints:', error);
  });

document.getElementById("hint-button").addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent the global click handler from running
    if (!currentImageNumber || !hintsData[`M${currentImageNumber}`]) return;

    const hint = hintsData[`M${currentImageNumber}`];
    const hintContent = `
        <strong>HINT</strong><br><br>
        <strong>${hint.name}</strong><br>
        NGC: ${hint.NGC}<br>
        Type: ${hint.type}<br>
        Constellation: ${hint.constellation}<br>
        Magnitude: ${hint.magnitude}<br>
        Size: ${hint.size}<br>
        Viewing Season: ${hint.viewingSeason}<br>
        Viewing Difficulty: ${hint.viewingDifficulty}
    `;

    const popup = document.getElementById("hint-popup");
    document.getElementById("hint-content").innerHTML = hintContent;
    popup.classList.remove("hidden");
});

// Close hint popup when clicking outside
document.addEventListener("click", function (e) {
    const popup = document.getElementById("hint-popup");
    if (!popup.classList.contains("hidden")) {
        popup.classList.add("hidden");
    }
});

// Info button functionality
const infoButton = document.getElementById("info-button");
const infoPopup = document.getElementById("info-popup");

infoButton.addEventListener("click", (e) => {
  e.stopPropagation();
  infoPopup.classList.remove("hidden");
});

document.addEventListener("click", (e) => {
  if (!infoPopup.classList.contains("hidden")) {
    infoPopup.classList.add("hidden");
  }
});

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
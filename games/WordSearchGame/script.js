const gridEl = document.getElementById("grid");
const wordListEl = document.getElementById("wordList");
const statusEl = document.getElementById("status");
const newPuzzleBtn = document.getElementById("newPuzzleBtn");
// const resetSelectionBtn = document.getElementById("resetSelectionBtn");
const bonusInput = document.getElementById("bonusInput");
const bonusSubmitBtn = document.getElementById("bonusSubmitBtn");

const rulesBtn = document.getElementById("rulesBtn");
const infoPanelEl = document.querySelector(".info-panel");
const sidebarEl = document.querySelector(".sidebar");

const hiscoreEl = document.getElementById("hiscore");
function getHiScoreKey() {
    return `wordsearch_best_time_seconds_${currentLevel}`;
}

const finishOverlayEl = document.getElementById("finishOverlay");
const finishSparklesEl = document.getElementById("finishSparkles");
const finishTimeEl = document.getElementById("finishTime");

rulesBtn.addEventListener("click", () => {
    playToggleSound();
    infoPanelEl.classList.toggle("hidden");
    sidebarEl.classList.toggle("rules-hidden");
});

const meaningsBtn = document.getElementById("meaningsBtn");
const meaningPanelEl = document.getElementById("meaningPanel");
const meaningContentEl = document.getElementById("meaningContent");

let meaningsVisible = false;
sidebarEl.classList.add("meaning-hidden");

let wordMeanings = new Map();

function formatDefinitions(data, word) {
    const entries = Array.isArray(data) ? data : [];
    const entry = entries[0];

    if (!entry) {
        return word[0] === word[0].toUpperCase()
            ? "A name, nationality, region, or other proper term."
            : "No definition found.";
    }

    const meanings = (entry.meanings || []).map(meaning => ({
        partOfSpeech: (meaning.partOfSpeech || "").toLowerCase(),
        definitions: (meaning.definitions || [])
            .map(def => (def.definition || "").trim())
            .filter(Boolean)
            .slice(0, 2)
    })).filter(m => m.definitions.length > 0);

    if (meanings.length === 0) {
        return word[0] === word[0].toUpperCase()
            ? "A name, nationality, region, or other proper term."
            : "No definition found.";
    }

    return meanings.map(meaning => {
        const defs = meaning.definitions
            .map((def, i) => `${i + 1}. ${def}`)
            .join("<br>");
        return `<strong>${meaning.partOfSpeech}</strong><br>${defs}`;
    }).join("<br><br>");
}

async function fetchMeaning(word) {
    if (wordMeanings.has(word)) {
        return wordMeanings.get(word);
    }

    try {
        const response = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`
        );

        if (!response.ok) {
            const fallback = "No definition found.";
            wordMeanings.set(word, fallback);
            return fallback;
        }

        const data = await response.json();
        const definition = formatDefinitions(data, word);

        wordMeanings.set(word, definition);
        return definition;
    } catch {
        const fallback = "Failed to load definition.";
        wordMeanings.set(word, fallback);
        return fallback;
    }
}

meaningsBtn.addEventListener("click", () => {
    playToggleSound();
    meaningsVisible = !meaningsVisible;
    meaningPanelEl.classList.toggle("hidden", !meaningsVisible);
    sidebarEl.classList.toggle("meaning-hidden", !meaningsVisible);
});

const SIZE = 12;
const levelButtons = document.querySelectorAll(".level-btn");
const levelDisplay = document.getElementById("levelDisplay");

let currentLevel = "normal";
let MIN_WORD_LEN = getMinWordLen();
let MAX_WORD_LEN = getMaxWordLen();

function getMinWordLen() {
    if (currentLevel === "easy") return 6;
    if (currentLevel === "hard") return 4;
    return 4;
}

function getMaxWordLen() {
    const minWordLen = getMinWordLen();
    if (currentLevel === "easy") return Math.max(minWordLen, SIZE - 2);
    if (currentLevel === "hard") return Math.max(minWordLen, SIZE - 6);
    return Math.max(minWordLen, SIZE - 4);
}

levelButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
        levelButtons.forEach((b) => {
            b.classList.remove("active");
            b.setAttribute("aria-pressed", "false");
        });

        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");

        currentLevel = btn.dataset.level;
        MIN_WORD_LEN = getMinWordLen();
        MAX_WORD_LEN = getMaxWordLen();

        levelDisplay.textContent = `Level: ${capitalizeLevel(currentLevel)}`;
        loadHiScore();
        
        await loadDictionary();
        generatePuzzle();
    });
});

function capitalizeLevel(level) {
    return level.charAt(0).toUpperCase() + level.slice(1);
}

const CANDIDATE_SAMPLE_SIZE = 1000;
const MAX_GENERATION_ATTEMPTS = 180;
const MIN_LEFTOVER_CELLS = 4;
const MIN_DIAGONAL_WORDS = 6;

// const DICT_URL =
//     "https://cdn.jsdelivr.net/gh/dwyl/english-words@master/words_alpha.txt";
const DICT_URL =
    "https://raw.githubusercontent.com/MichaelWehar/Public-Domain-Word-Lists/master/5000-more-common.txt";

const DIRECTIONS = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [-1, -1], [1, -1], [-1, 1]
];

const DIAGONAL_DIRECTIONS = DIRECTIONS.filter(([dx, dy]) => dx !== 0 && dy !== 0);
const STRAIGHT_DIRECTIONS = DIRECTIONS.filter(([dx, dy]) => dx === 0 || dy === 0);

let dictionary = [];
let wordsByLength = new Map();

let grid = [];
let activeWords = [];
let bonusWord = "";
let foundWords = new Set();
let bonusSolved = false;

let isDragging = false;
let startCell = null;
let currentPath = [];

let foundWordStyles = new Map();
let selectedCellOriginalStyles = new Map();

const timerEl = document.getElementById("timer");

let timerInterval = null;
let startTime = null;

function formatElapsed(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatSeconds(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function startTimer() {
    clearInterval(timerInterval);
    startTime = Date.now();
    timerEl.textContent = "00:00";

    timerInterval = setInterval(() => {
        timerEl.textContent = formatElapsed(Date.now() - startTime);
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
}

function loadHiScore() {
    const saved = localStorage.getItem(getHiScoreKey())

    if (saved === null) {
        hiscoreEl.textContent = "Best time: --:--";
        return null;
    }

    const bestSeconds = Number(saved);

    if (!Number.isFinite(bestSeconds) || bestSeconds < 0) {
        hiscoreEl.textContent = "Best time: --:--";
        return null;
    }

    hiscoreEl.textContent = `Best time: ${formatSeconds(bestSeconds)}`;
    return bestSeconds;
}

function updateHiScoreIfNeeded() {
    if (!startTime) return;

    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const saved = localStorage.getItem(getHiScoreKey());
    const bestSeconds = saved === null ? null : Number(saved);

    if (bestSeconds === null || !Number.isFinite(bestSeconds) || elapsedSeconds < bestSeconds) {
        localStorage.setItem(getHiScoreKey(), String(elapsedSeconds));
        hiscoreEl.textContent = `Best time: ${formatSeconds(elapsedSeconds)}`;
    } else {
        hiscoreEl.textContent = `Best time: ${formatSeconds(bestSeconds)}`;
    }
}

function randomHighlightStyle() {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70 + Math.floor(Math.random() * 20);
    const lightness = 80 + Math.floor(Math.random() * 8);

    return {
        backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
        borderColor: `hsl(${hue}, ${saturation}%, ${lightness - 18}%)`,
        color: `hsl(${hue}, ${saturation}%, 22%)`
    };
}

function normalizeWord(word) {
    return String(word).toUpperCase().replace(/[^A-Z]/g, "");
}

function reverseString(str) {
    return str.split("").reverse().join("");
}

function wordsConflictByContainment(wordA, wordB) {
    if (wordA === wordB) return true;
    if (wordA.includes(wordB)) return true;
    if (wordB.includes(wordA)) return true;

    const revA = reverseString(wordA);
    const revB = reverseString(wordB);

    if (wordA.includes(revB)) return true;
    if (wordB.includes(revA)) return true;
    if (revA.includes(wordB)) return true;
    if (revB.includes(wordA)) return true;

    return false;
}

function shuffle(array) {
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function inBounds(x, y, size = SIZE) {
    return x >= 0 && x < size && y >= 0 && y < size;
}

function makeEmptyGrid(size) {
    return Array.from({ length: size }, () => Array(size).fill(""));
}

function countEmptyCells(candidateGrid) {
    let count = 0;
    for (let y = 0; y < candidateGrid.length; y++) {
        for (let x = 0; x < candidateGrid[y].length; x++) {
            if (candidateGrid[y][x] === "") count++;
        }
    }
    return count;
}

function getEmptyCellsReadingOrder(candidateGrid) {
    const cells = [];
    for (let y = 0; y < candidateGrid.length; y++) {
        for (let x = 0; x < candidateGrid[y].length; x++) {
            if (candidateGrid[y][x] === "") cells.push({ x, y });
        }
    }
    return cells;
}

function countVowels(word) {
    let n = 0;
    for (const ch of word) {
        if ("AEIOUY".includes(ch)) n++;
    }
    return n;
}

function hasBadTriples(word) {
    for (let i = 0; i < word.length - 2; i++) {
        if (word[i] === word[i + 1] && word[i + 1] === word[i + 2]) return true;
    }
    return false;
}

function passesDictionaryFilter(word) {
    if (!/^[A-Z]+$/.test(word)) return false;
    if (word.length < MIN_WORD_LEN || word.length > MAX_WORD_LEN) return false;
    if (hasBadTriples(word)) return false;
    if (countVowels(word) < 2) return false;

    const uniqueCount = new Set(word).size;
    if (uniqueCount < Math.ceil(word.length * 0.5)) return false;

    return true;
}

async function loadDictionary() {
    statusEl.textContent = "Loading dictionary...";

    const response = await fetch(DICT_URL, { cache: "force-cache" });
    if (!response.ok) {
        throw new Error(`Dictionary fetch failed: HTTP ${response.status}`);
    }

    const text = await response.text();
    const unique = new Set();

    for (const raw of text.split(/\r?\n/)) {
        const word = normalizeWord(raw);
        if (!word) continue;
        if (!passesDictionaryFilter(word)) continue;
        unique.add(word);
    }

    dictionary = [...unique];
    wordsByLength = new Map();

    for (const word of dictionary) {
        if (!wordsByLength.has(word.length)) {
            wordsByLength.set(word.length, []);
        }
        wordsByLength.get(word.length).push(word);
    }
}

function canPlaceWord(candidateGrid, word, x, y, dx, dy) {
    for (let i = 0; i < word.length; i++) {
        const nx = x + i * dx;
        const ny = y + i * dy;

        if (!inBounds(nx, ny, candidateGrid.length)) return false;

        const existing = candidateGrid[ny][nx];
        if (existing !== "" && existing !== word[i]) return false;
    }

    return true;
}

function placeWord(candidateGrid, word, x, y, dx, dy) {
    for (let i = 0; i < word.length; i++) {
        const nx = x + i * dx;
        const ny = y + i * dy;
        candidateGrid[ny][nx] = word[i];
    }
}

function getRandomPositions(size) {
    const positions = [];
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            positions.push([x, y]);
        }
    }
    return shuffle(positions);
}

function getPlacementCandidates(candidateGrid, word, preferDiagonal = false) {
    const candidates = [];
    const positions = getRandomPositions(candidateGrid.length);

    const directions = preferDiagonal
        ? shuffle([...DIAGONAL_DIRECTIONS, ...DIAGONAL_DIRECTIONS, ...STRAIGHT_DIRECTIONS])
        : shuffle(DIRECTIONS);

    for (const [x, y] of positions) {
        for (const [dx, dy] of directions) {
            if (!canPlaceWord(candidateGrid, word, x, y, dx, dy)) continue;

            let overlap = 0;
            for (let i = 0; i < word.length; i++) {
                const nx = x + i * dx;
                const ny = y + i * dy;
                if (candidateGrid[ny][nx] === word[i]) overlap++;
            }

            const isDiagonal = dx !== 0 && dy !== 0;

            candidates.push({
                x, y, dx, dy, overlap, isDiagonal,
                score: overlap * 10 + (isDiagonal ? 4 : 0)
            });
        }
    }

    return candidates.sort((a, b) => b.score - a.score);
}

function countWordOccurrences(candidateGrid, word) {
    let count = 0;
    const size = candidateGrid.length;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            for (const [dx, dy] of DIRECTIONS) {
                let ok = true;

                for (let i = 0; i < word.length; i++) {
                    const nx = x + i * dx;
                    const ny = y + i * dy;

                    if (!inBounds(nx, ny, size) || candidateGrid[ny][nx] !== word[i]) {
                        ok = false;
                        break;
                    }
                }

                if (ok) count++;
            }
        }
    }

    return count;
}

function validateUniqueWordOccurrences(candidateGrid, words) {
    for (const word of words) {
        if (countWordOccurrences(candidateGrid, word) !== 1) return false;
    }
    return true;
}

function fillBonusWordInReadingOrder(candidateGrid, word) {
    const empties = getEmptyCellsReadingOrder(candidateGrid);
    if (empties.length !== word.length) return false;

    for (let i = 0; i < empties.length; i++) {
        const { x, y } = empties[i];
        candidateGrid[y][x] = word[i];
    }

    return true;
}

function wordScore(word) {
    const uniqueCount = new Set(word).size;
    return word.length * 10 + (word.length - uniqueCount);
}

function pickCandidateWords() {
    const sampled = shuffle(dictionary).slice(0, CANDIDATE_SAMPLE_SIZE);
    const sorted = sampled.sort((a, b) => wordScore(b) - wordScore(a));

    const chosen = [];

    for (const word of sorted) {
        const conflicts = chosen.some(existing =>
            wordsConflictByContainment(word, existing)
        );

        if (!conflicts) {
            chosen.push(word);
        }
    }

    return chosen;
}

function pickBonusWord(length, usedWords) {
    const bucket = wordsByLength.get(length);
    if (!bucket || bucket.length === 0) return null;

    const choices = shuffle(bucket).filter(word =>
        !usedWords.some(used => wordsConflictByContainment(word, used))
    );

    return choices.length ? choices[0] : null;
}

function greedyPlaceWords(candidateGrid, words) {
    const placedWords = [];
    let diagonalCount = 0;

    for (const word of words) {
        const needMoreDiagonals = diagonalCount < MIN_DIAGONAL_WORDS;
        const placements = getPlacementCandidates(candidateGrid, word, needMoreDiagonals);

        if (!placements.length) continue;

        const topN = Math.min(12, placements.length);
        const pool = placements.slice(0, topN);

        let chosen;
        if (needMoreDiagonals) {
            const diagonalPool = pool.filter(p => p.isDiagonal);
            chosen = diagonalPool.length
                ? diagonalPool[Math.floor(Math.random() * diagonalPool.length)]
                : pool[Math.floor(Math.random() * pool.length)];
        } else {
            chosen = pool[Math.floor(Math.random() * pool.length)];
        }

        placeWord(candidateGrid, word, chosen.x, chosen.y, chosen.dx, chosen.dy);
        placedWords.push(word);
        if (chosen.isDiagonal) diagonalCount++;
    }

    return { placedWords, diagonalCount };
}

function tryGeneratePuzzle() {
    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
        const candidateGrid = makeEmptyGrid(SIZE);
        const candidateWords = pickCandidateWords();
        const { placedWords, diagonalCount } = greedyPlaceWords(candidateGrid, candidateWords);

        if (!placedWords.length) continue;
        if (diagonalCount < MIN_DIAGONAL_WORDS) continue;

        const leftover = countEmptyCells(candidateGrid);
        if (leftover < MIN_LEFTOVER_CELLS) continue;

        const chosenBonusWord = pickBonusWord(leftover, placedWords);
        if (!chosenBonusWord) continue;

        if (!validateUniqueWordOccurrences(candidateGrid, placedWords)) continue;
        if (!fillBonusWordInReadingOrder(candidateGrid, chosenBonusWord)) continue;
        if (!validateUniqueWordOccurrences(candidateGrid, placedWords)) continue;

        return {
            grid: candidateGrid,
            words: [...placedWords].sort((a, b) =>
                a.localeCompare(b, "en", { sensitivity: "base" })
            ),
            bonusWord: chosenBonusWord
        };
    }

    return null;
}

function renderGrid() {
    gridEl.innerHTML = "";
    gridEl.style.gridTemplateColumns = `repeat(${SIZE}, var(--cell-size))`;

    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.textContent = grid[y][x];
            cell.dataset.x = x;
            cell.dataset.y = y;
            gridEl.appendChild(cell);
        }
    }
}

function renderWordList() {
    wordListEl.innerHTML = "";

    for (const word of activeWords) {
        const li = document.createElement("li");
        li.textContent = word;
        li.dataset.word = word;
        li.style.cursor = "pointer";

        li.addEventListener("click", async () => {
            if (!meaningsVisible) {
                playToggleSound()
                meaningsVisible = true;
                meaningPanelEl.classList.remove("hidden");
            }

            meaningContentEl.textContent = `Loading meaning for ${word}...`;

            const definition = await fetchMeaning(word);
            meaningContentEl.innerHTML = `<strong>${word}</strong><br>${definition}`;
        });

        if (foundWords.has(word)) {
            li.classList.add("found-word");

            const styleObj = foundWordStyles.get(word);
            if (styleObj) {
                li.style.backgroundColor = styleObj.backgroundColor;
                li.style.borderColor = styleObj.borderColor;
                li.style.color = styleObj.color;
            }
        }

        wordListEl.appendChild(li);
    }
}

function getCellEl(x, y) {
    return gridEl.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
}

function clearSelectedCells() {
    document.querySelectorAll(".cell.selected").forEach(cell => {
        const key = `${cell.dataset.x},${cell.dataset.y}`;
        const original = selectedCellOriginalStyles.get(key);

        if (original) {
            cell.style.backgroundColor = original.backgroundColor;
            cell.style.borderColor = original.borderColor;
            cell.style.color = original.color;
        } else {
            cell.style.backgroundColor = "";
            cell.style.borderColor = "";
            cell.style.color = "";
        }

        cell.classList.remove("selected");
    });

    selectedCellOriginalStyles.clear();
}

function markPathSelected(path) {
    clearSelectedCells();

    for (const { x, y } of path) {
        const cell = getCellEl(x, y);
        if (!cell) continue;

        const key = `${x},${y}`;

        selectedCellOriginalStyles.set(key, {
            backgroundColor: cell.style.backgroundColor,
            borderColor: cell.style.borderColor,
            color: cell.style.color
        });

        cell.classList.add("selected");
        cell.style.backgroundColor = "#ffe8a3";
        cell.style.borderColor = "#d1a400";
        cell.style.color = "#1f1f24";
    }
}

function markPathFound(path, styleObj) {
    for (const { x, y } of path) {
        const cell = getCellEl(x, y);
        if (cell) {
            cell.classList.remove("selected");
            cell.classList.add("found");
            cell.style.backgroundColor = styleObj.backgroundColor;
            cell.style.borderColor = styleObj.borderColor;
            cell.style.color = styleObj.color;

            cell.classList.remove("pop-found");
            void cell.offsetWidth;
            cell.classList.add("pop-found");

            cell.addEventListener("animationend", () => {
                cell.classList.remove("pop-found");
            }, { once: true });
        }
    }
}

function getCoordsFromCellEl(cellEl) {
    return {
        x: Number(cellEl.dataset.x),
        y: Number(cellEl.dataset.y)
    };
}

function normalizeStep(delta) {
    if (delta === 0) return 0;
    return delta > 0 ? 1 : -1;
}

function buildStraightPath(start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    const horizontal = dy === 0;
    const vertical = dx === 0;
    const diagonal = absDx === absDy;

    if (!(horizontal || vertical || diagonal)) return null;

    const stepX = normalizeStep(dx);
    const stepY = normalizeStep(dy);
    const steps = Math.max(absDx, absDy);

    const path = [];
    for (let i = 0; i <= steps; i++) {
        path.push({
            x: start.x + i * stepX,
            y: start.y + i * stepY
        });
    }

    return path;
}

function getWordFromPath(path) {
    return path.map(({ x, y }) => grid[y][x]).join("");
}

function getMatchedWordFromPath(path) {
    const selectedWord = getWordFromPath(path);
    const reversedWord = reverseString(selectedWord);

    if (activeWords.includes(selectedWord) && !foundWords.has(selectedWord)) {
        return selectedWord;
    }

    if (activeWords.includes(reversedWord) && !foundWords.has(reversedWord)) {
        return reversedWord;
    }

    return null;
}

function updateSelectionFromPoint(clientX, clientY) {
    if (!isDragging || !startCell) return;

    const el = document.elementFromPoint(clientX, clientY);
    const cellEl = el?.closest?.(".cell");
    if (!cellEl) return;

    const endCell = getCoordsFromCellEl(cellEl);
    const path = buildStraightPath(startCell, endCell);

    if (!path) {
        currentPath = [];
        clearSelectedCells();
        statusEl.textContent = "Selection must be straight";
        return;
    }

    currentPath = path;
    markPathSelected(path);

    const matchedWord = getMatchedWordFromPath(path);

    if (matchedWord) {
        finishSelection();
        return;
    }

    statusEl.textContent = getWordFromPath(path);
}

function maybeFinishGame() {
    const allMainWordsFound = foundWords.size === activeWords.length;
    if (allMainWordsFound && bonusSolved) {
        stopTimer();
        updateHiScoreIfNeeded();
        statusEl.textContent = `Puzzle cleared in ${timerEl.textContent}`;
        showPerfectFinishOverlay(timerEl.textContent);
    } else if (allMainWordsFound) {
        statusEl.textContent = "All words found. Enter the bonus word.";
    }
}

function finishSelection() {
    if (!isDragging) return;
    isDragging = false;

    if (!currentPath.length) {
        startCell = null;
        return;
    }

    const matchedWord = getMatchedWordFromPath(currentPath);

    if (matchedWord) {
        foundWords.add(matchedWord);

        const styleObj = randomHighlightStyle();
        foundWordStyles.set(matchedWord, styleObj);

        markPathFound(currentPath, styleObj);
        renderWordList();

        const allMainWordsFound = foundWords.size === activeWords.length;

        if (allMainWordsFound) {
            isDragging = false;
            startCell = null;
            currentPath = [];
            clearSelectedCells();

            playAllWordsFoundSound();
            statusEl.textContent = "All words found. Enter the bonus word.";
        } else {
            playFoundSound();
            statusEl.textContent = `Found: ${matchedWord}`;
        }

        maybeFinishGame();
    } else {
        clearSelectedCells();
        statusEl.textContent = "Not a target word";
    }

    currentPath = [];
    startCell = null;
}

function submitBonusWord() {
    const guess = normalizeWord(bonusInput.value);

    if (!guess) {
        playBonusWrongSound()
        setBonusFeedback("Please enter a word.", false);
        statusEl.textContent = "Enter the bonus word";
        return;
    }

    if (guess === bonusWord) {
        bonusSolved = true;
        bonusInput.value = bonusWord;
        playBonusFoundSound();
        setBonusFeedback("Correct bonus word.", true);
        maybeFinishGame();

        if (foundWords.size !== activeWords.length) {
            statusEl.textContent = "Bonus word correct. Find the remaining words.";
        }
    } else {
        bonusSolved = false;
        playBonusWrongSound();
        setBonusFeedback("Incorrect bonus word.", false);
        statusEl.textContent = "Incorrect bonus word";
    }
}

function areAllMainWordsFound() {
    return foundWords.size === activeWords.length;
}

function attachEvents() {
    soundToggleBtn.addEventListener("click", toggleSound);

    resetHiScoreBtn.addEventListener("click", showResetHiScoreModal);

    cancelResetHiScoreBtn.addEventListener("click", hideResetHiScoreModal);

    confirmResetHiScoreBtn.addEventListener("click", resetHiScore);

    resetHiScoreModal.addEventListener("pointerdown", event => {
        if (event.target === resetHiScoreModal) {
            hideResetHiScoreModal();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !resetHiScoreModal.classList.contains("hidden")) {
            hideResetHiScoreModal();
        }
    });

    gridEl.addEventListener("pointerdown", event => {
        if (areAllMainWordsFound()) return;

        const cellEl = event.target.closest(".cell");
        if (!cellEl) return;

        isDragging = true;
        startCell = getCoordsFromCellEl(cellEl);
        currentPath = [startCell];
        markPathSelected(currentPath);
        statusEl.textContent = grid[startCell.y][startCell.x];

        if (gridEl.setPointerCapture) {
            gridEl.setPointerCapture(event.pointerId);
        }
    });

    gridEl.addEventListener("pointermove", event => {
        if (areAllMainWordsFound()) return;
        updateSelectionFromPoint(event.clientX, event.clientY);
    });

    gridEl.addEventListener("pointerup", () => {
        if (areAllMainWordsFound()) {
            isDragging = false;
            startCell = null;
            currentPath = [];
            clearSelectedCells();
            return;
        }
        finishSelection();
    });

    gridEl.addEventListener("pointercancel", () => {
        isDragging = false;
        startCell = null;
        currentPath = [];
        clearSelectedCells();
    });

    finishOverlayEl.addEventListener("pointerdown", () => {
        hidePerfectFinishOverlay();
    });

    newPuzzleBtn.addEventListener("click", generatePuzzle);

    // resetSelectionBtn.addEventListener("click", () => {
    //     isDragging = false;
    //     startCell = null;
    //     currentPath = [];
    //     clearSelectedCells();
    //     statusEl.textContent = "Selection cleared";
    // });

    bonusSubmitBtn.addEventListener("click", submitBonusWord);

    bonusInput.addEventListener("keydown", event => {
        if (event.key === "Enter") submitBonusWord();
    });
}

function generatePuzzle() {
    hidePerfectFinishOverlay();
    
    foundWordStyles = new Map();
    foundWords = new Set();
    bonusSolved = false;
    clearSelectedCells();
    bonusInput.value = "";
    setBonusFeedback("", null);

    statusEl.textContent = "Generating puzzle...";

    const result = tryGeneratePuzzle();

    if (!result) {
        statusEl.textContent = "Failed to generate puzzle. Relax constraints a bit.";
        return;
    }

    grid = result.grid;
    activeWords = result.words;
    bonusWord = result.bonusWord;

    renderGrid();
    renderWordList();

    startTimer();
    statusEl.textContent = `Puzzle ready: ${activeWords.length} words`;
    playNewGameSound();
}

async function init() {
    try {
        await loadDictionary();
        attachEvents();
        loadHiScore();
        loadSoundSetting();
        generatePuzzle();
    } catch (err) {
        console.error(err);
        statusEl.textContent = err.message;
    }
}

init();

const bonusFeedbackEl = document.getElementById("bonusFeedback");

function setBonusFeedback(message, isCorrect) {
    bonusFeedbackEl.textContent = message;
    bonusFeedbackEl.classList.remove("correct", "wrong");

    if (isCorrect === true) {
        bonusFeedbackEl.classList.add("correct");
    } else if (isCorrect === false) {
        bonusFeedbackEl.classList.add("wrong");
    }
}

function launchFinishSparkles() {
    finishSparklesEl.innerHTML = "";

    const symbols = ["✦", "✧", "✨", "★"];
    const particleCount = 22;

    for (let i = 0; i < particleCount; i++) {
        const star = document.createElement("div");
        star.className = "finish-star";
        star.textContent = symbols[Math.floor(Math.random() * symbols.length)];

        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() * 0.35 - 0.175);
        const distance = 70 + Math.random() * 120;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;
        const rot = `${-120 + Math.random() * 240}deg`;

        star.style.setProperty("--dx", `${dx}px`);
        star.style.setProperty("--dy", `${dy}px`);
        star.style.setProperty("--rot", rot);
        star.style.animationDelay = `${Math.random() * 120}ms`;

        finishSparklesEl.appendChild(star);
    }
}

function showPerfectFinishOverlay(clearTimeText) {
    finishTimeEl.textContent = `Clear time: ${clearTimeText}`;
    finishOverlayEl.classList.remove("hidden");
    finishOverlayEl.setAttribute("aria-hidden", "false");
    launchFinishSparkles();
}

function hidePerfectFinishOverlay() {
    finishOverlayEl.classList.add("hidden");
    finishOverlayEl.setAttribute("aria-hidden", "true");
    finishSparklesEl.innerHTML = "";
}

function playFoundSound() {
    if (!soundEnabled) return;
    const sfx = new Audio("audio/決定ボタンを押す53.mp3");
    sfx.play().catch(() => { });
}

function playAllWordsFoundSound() {
    if (!soundEnabled) return;
    const sfx = new Audio("audio/決定ボタンを押す8.mp3");
    sfx.play().catch(() => { });
}

function playBonusFoundSound() {
    if (!soundEnabled) return;
    const sfx = new Audio("audio/成功音.mp3");
    sfx.play().catch(() => { });
}

function playBonusWrongSound() {
    if (!soundEnabled) return;
    const sfx = new Audio("audio/クイズ不正解1.mp3");
    sfx.play().catch(() => { });
}

function playToggleSound() {
    if (!soundEnabled) return;
    const sfx = new Audio("audio/決定ボタンを押す44.mp3");
    sfx.play().catch(() => { });
}

function playNewGameSound() {
    if (!soundEnabled) return;
    const sfx = new Audio("audio/決定ボタンを押す37.mp3");
    sfx.play().catch(() => { });
}

const soundToggleBtn = document.getElementById("soundToggleBtn");
const soundIcon = document.getElementById("soundIcon");

const SOUND_ENABLED_KEY = "wordsearch_sound_enabled";
let soundEnabled = true;

function loadSoundSetting() {
    const saved = localStorage.getItem(SOUND_ENABLED_KEY);

    if (saved === null) {
        soundEnabled = true;
    } else {
        soundEnabled = saved === "true";
    }

    updateSoundButton();
}

function updateSoundButton() {
    soundIcon.src = soundEnabled
        ? "icons/speaker-wave.svg"
        : "icons/speaker-x-mark.svg";

    soundIcon.alt = soundEnabled ? "Sound on" : "Sound off";
    soundToggleBtn.title = soundEnabled ? "Sound on" : "Sound off";
    soundToggleBtn.setAttribute("aria-label", soundEnabled ? "Turn sound off" : "Turn sound on");
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem(SOUND_ENABLED_KEY, String(soundEnabled));
    updateSoundButton();
}

const resetHiScoreBtn = document.getElementById("resetHiScoreBtn");
const resetHiScoreModal = document.getElementById("resetHiScoreModal");
const cancelResetHiScoreBtn = document.getElementById("cancelResetHiScoreBtn");
const confirmResetHiScoreBtn = document.getElementById("confirmResetHiScoreBtn");

function showResetHiScoreModal() {
    resetHiScoreModal.classList.remove("hidden");
    resetHiScoreModal.setAttribute("aria-hidden", "false");
}

function hideResetHiScoreModal() {
    resetHiScoreModal.classList.add("hidden");
    resetHiScoreModal.setAttribute("aria-hidden", "true");
}

function resetHiScore() {
    localStorage.removeItem(getHiScoreKey());
    hiscoreEl.textContent = "Best time: --:--";
    hideResetHiScoreModal();
}

const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeIcon = document.getElementById("themeIcon");

function setTheme(mode) {
    const dark = mode === "dark";
    document.body.classList.toggle("dark-mode", dark);

    themeIcon.src = dark ? "icons/sun.svg" : "icons/moon.svg";
    themeIcon.alt = dark ? "Light mode" : "Dark mode";
    themeToggleBtn.setAttribute(
        "aria-label",
        dark ? "Switch to light mode" : "Switch to dark mode"
    );

    localStorage.setItem("theme", mode);
}

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
    setTheme("dark");
} else {
    setTheme("light");
}

themeToggleBtn.addEventListener("click", () => {
    const isDark = document.body.classList.contains("dark-mode");
    setTheme(isDark ? "light" : "dark");
});

const menuToggleBtn = document.getElementById("menuToggleBtn");
const controlsEl = document.querySelector(".controls");

menuToggleBtn.addEventListener("click", () => {
    controlsEl.classList.toggle("open");
});
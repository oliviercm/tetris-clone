/**
 * Author: oliviercm @ https://github.com/oliviercm
 * 
 * This is an HTML+CSS+JS Tetris clone.
 * 
 * No libraries are used in this game's code.
 * 
 * Gameplay is mostly designed around the 2009 Tetris Design Guideline published by the Tetris Company.
 * A copy of the guideline is included next to this file.
 * Some of the Tetris Guideline mechanics included in this clone are:
 * - (3.1) Tetromino shapes & colors
 * - (3.4) Tetromino starting location & orientation
 * - (2.4.4) Ghost tetromino
 * - (2.4.1) Visible playfield size
 * - (10.0) Playfield vertical buffer zone
 * - (3.3) "Bag system" random tetromino generation
 * - (5.3) "Super Rotation System", allowing rotation against walls and surfaces (wall-kicks, t-spins)
 * - (5.4) Hard Drop
 * - (5.5) Soft Drop
 * - (5.6) Hold
 * - (5.7) Extended placement lock down
 */

const canvas = document.getElementById("game-canvas");
const context = canvas.getContext("2d");

const nextCanvas = document.getElementById("next-canvas");
const nextContext = nextCanvas.getContext("2d");

const holdCanvas = document.getElementById("hold-canvas");
const holdContext = holdCanvas.getContext("2d");

// Define core gameplay constants
const PLAYFIELD_WIDTH = 10;
const PLAYFIELD_HEIGHT = 20;
const PLAYFIELD_HEIGHT_BUFFER = 20; // The "buffer zone" above the visible playfield, as described by the Tetris Guideline.
const CELL_WIDTH = canvas.width / PLAYFIELD_WIDTH;
const CELL_HEIGHT = canvas.height / PLAYFIELD_HEIGHT;
const TETROMINO_COLORS = { // Tetromino colors, as described by the Tetris Guideline.
    o: "rgba(255, 255, 0, 255)",
    i: "rgba(0, 255, 255, 255)",
    t: "rgba(128, 0, 128, 255)",
    l: "rgba(255, 165, 0, 255)",
    j: "rgba(0, 0, 139, 255)",
    s: "rgba(0, 128, 0, 255)",
    z: "rgba(255, 0, 0, 255)",
};
const TETROMINOS = { // The shape of each of the 7 tetrominos and their 4 rotations. The shape is described as a matrix where true values are the tetromino and false values are "empty".
    o: {
        [0]: [
            [false, false, false, false],
            [false, true, true, false],
            [false, true, true, false],
        ],
        [1]: [
            [false, false, false, false],
            [false, true, true, false],
            [false, true, true, false],
        ],
        [2]: [
            [false, false, false, false],
            [false, true, true, false],
            [false, true, true, false],
        ],
        [3]: [
            [false, false, false, false],
            [false, true, true, false],
            [false, true, true, false],
        ],
    },
    i: {
        [0]: [
            [false, false, false, false],
            [false, false, false, false],
            [true, true, true, true],
            [false, false, false, false],
        ],
        [1]: [
            [false, false, true, false],
            [false, false, true, false],
            [false, false, true, false],
            [false, false, true, false],
        ],
        [2]: [
            [false, false, false, false],
            [true, true, true, true],
            [false, false, false, false],
            [false, false, false, false],
        ],
        [3]: [
            [false, true, false, false],
            [false, true, false, false],
            [false, true, false, false],
            [false, true, false, false],
        ],
    },
    t: {
        [0]: [
            [false, false, false],
            [true, true, true],
            [false, true, false],
        ],
        [1]: [
            [false, true, false],
            [false, true, true],
            [false, true, false],
        ],
        [2]: [
            [false, true, false],
            [true, true, true],
            [false, false, false],
        ],
        [3]: [
            [false, true, false],
            [true, true, false],
            [false, true, false],
        ],
    },
    l: {
        [0]: [
            [false, false, false],
            [true, true, true],
            [false, false, true],
        ],
        [1]: [
            [false, true, true],
            [false, true, false],
            [false, true, false],
        ],
        [2]: [
            [true, false, false],
            [true, true, true],
            [false, false, false],
        ],
        [3]: [
            [false, true, false],
            [false, true, false],
            [true, true, false],
        ],
    },
    j: {
        [0]: [
            [false, false, false],
            [true, true, true],
            [true, false, false],
        ],
        [1]: [
            [false, true, false],
            [false, true, false],
            [false, true, true],
        ],
        [2]: [
            [false, false, true],
            [true, true, true],
            [false, false, false],
        ],
        [3]: [
            [true, true, false],
            [false, true, false],
            [false, true, false],
        ],
    },
    s: {
        [0]: [
            [false, false, false],
            [true, true, false],
            [false, true, true],
        ],
        [1]: [
            [false, false, true],
            [false, true, true],
            [false, true, false],
        ],
        [2]: [
            [true, true, false],
            [false, true, true],
            [false, false, false],
        ],
        [3]: [
            [false, true, false],
            [true, true, false],
            [true, false, false],
        ],
    },
    z: {
        [0]: [
            [false, false, false],
            [false, true, true],
            [true, true, false],
        ],
        [1]: [
            [false, true, false],
            [false, true, true],
            [false, false, true],
        ],
        [2]: [
            [false, true, true],
            [true, true, false],
            [false, false, false],
        ],
        [3]: [
            [true, false, false],
            [true, true, false],
            [false, true, false],
        ],
    },
};
const KICK_OFFSETS = { // Super Rotation System kick offsets when rotating pieces (allowing rotation against walls and surfaces, t-spins, etc.)
    normal: { // Used for all tetrominos except the I tetromino.
        [0]: {
            [-1]: [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
            [1]: [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
        },
        [1]: {
            [-1]: [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
            [1]: [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
        },
        [2]: {
            [-1]: [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
            [1]: [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
        },
        [3]: {
            [-1]: [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
            [1]: [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
        },
    },
    modified: { // Used for the I tetromino exclusively.
        [0]: {
            [-1]: [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
            [1]: [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
        },
        [1]: {
            [-1]: [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
            [1]: [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
        },
        [2]: {
            [-1]: [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
            [1]: [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
        },
        [3]: {
            [-1]: [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
            [1]: [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
        },
    },
};
const AUDIO = {
    rotate: new Audio("./sounds/rotate.mp3"),
    land: new Audio("./sounds/land.mp3"),
    line: new Audio("./sounds/line.mp3"),
    tetris: new Audio("./sounds/tetris.mp3"),
    move: new Audio("./sounds/move.mp3"),
    gameover: new Audio("./sounds/gameover.mp3"),
    level: new Audio("./sounds/level.mp3"),
    theme: new Audio("./sounds/theme.mp3"),
    pause: new Audio("./sounds/pause.mp3"),
    shift: new Audio("./sounds/shift.mp3"),
};
const TPS = 60; // Frames/ticks per second
const TICKS_PER_LINE = { // Amount of ticks before dropping tetromino 1 line due to gravity based on difficulty
    [1]: 36,
    [2]: 32,
    [3]: 29,
    [4]: 25,
    [5]: 22,
    [6]: 18,
    [7]: 15,
    [8]: 11,
    [9]: 7,
    [10]: 5,
    [11]: 4,
    [12]: 4,
    [13]: 4,
    [14]: 3,
    [15]: 3,
    [16]: 3,
    [17]: 2,
    [18]: 2,
    [19]: 2,
    [20]: 1,
};
const REQUIRED_LINES_PER_LEVEL = { // Amount of cleared lines needed for each level (cumulative)
    [1]: 0,
    [2]: 10,
    [3]: 20,
    [4]: 30,
    [5]: 40,
    [6]: 50,
    [7]: 60,
    [8]: 70,
    [9]: 80,
    [10]: 90,
    [11]: 100,
    [12]: 110,
    [13]: 120,
    [14]: 130,
    [15]: 140,
    [16]: 150,
    [17]: 160,
    [18]: 170,
    [19]: 180,
    [20]: 190,
};

// Core game variables
const gameVars = {
    active: false, // Whether a game is active or not (the game is not active during the loading screen, before the user has clicked on the main canvas, and after a game over)
    paused: false,
    gameOver: false,
    loading: true, // Whether the resources are still loading
    globalTick: 0, // How many ticks have passed since the game has become active. Used to determine when to move tetromino due to gravity
    difficulty: 1, // The overall difficulty. A higher difficulty means gravity will act faster. Valid values are between 1 and 20.
    score: 0, // The player's current score.
    clearedLines: 0, // The amount of lines cleared, used to increase the difficulty level at certain thresholds.
    combo: 0, // Consecutive pieces that have cleared lines (shown as popup feedback)
    tetrominoBag: [], // Stores the bag of tetrominos which the player pulls from. When empty, it is refilled with a shuffled bag of each of the 7 tetrominos.
    highScore: JSON.parse(localStorage.getItem("highscore") || "0"),
};

// Information about the currently controlled tetromino
const playerVars = {
    controlledTetrominoShape: null, // "o", "i", "z", etc.
    controlledTetrominoPositionX: null,
    controlledTetrominoPositionY: null,
    controlledTetrominoRotation: null, // 0 = north, 1 = east, 2 = south, 3 = west
    controlledTetrominoLockDelay: null, // Ticks before the tetromino locks in place (when touching ground)
    controlledTetrominoLockDelayExtensions: null, // The amount of times the player has reset the lock delay by rotating/moving the controlled tetromino. Maximum of 15 times, which is reset when the controlled tetromino reaches a new lowest line.
    controlledTetrominoLowestLine: null, // The lowest line the controlled tetromino has reached. Reaching a new lowest line resets the amount of allowed lock delay extensions to 15.
    spawnTime: null, // When the current tetromino spawned (used for the spawn pop animation)
    heldTetromino: null, // The currently held tetromino.
    hasHeldTetromino: false,
    keyStates: {
        left: {
            pressed: false,
            heldTicks: 0,
        },
        right: {
            pressed: false,
            heldTicks: 0,
        },
        down: {
            pressed: false,
            heldTicks: 0,
        },
        space: {
            pressed: false,
            heldTicks: 0,
        },
    },
};

// Initialize playfield matrix (stores position of locked tetrominos)
// Note that there is a 20 line vertical buffer above the visible playfield.
let playfield = Array(PLAYFIELD_WIDTH).fill().map(() => Array(PLAYFIELD_HEIGHT + PLAYFIELD_HEIGHT_BUFFER).fill(null));

/**
 * GAME FEEL ("JUICE")
 *
 * Presentation-only systems layered on top of the core gameplay:
 * - Screen shake (hard drops, line clears, game over)
 * - Particles (lock dust, hard drop dust, line clear debris)
 * - Full-screen flashes (line clear, tetris, level up, game over)
 * - Floating score/combo/level popups
 * - Hard drop motion trail
 * - Lock flash (locked cells briefly flash white)
 * - Animated line clears (rows flash, shrink away, then collapse with debris)
 * - Ghost tetromino pulse, spawn pop, ambient menu rain
 * - Impact freeze (game logic stalls 1-2 ticks when a piece locks)
 *
 * None of this changes gameplay state; it reads the playfield and draws.
 */
const fx = {
    particles: [],
    shakes: [],
    flashes: [],
    popups: [],
    trails: [],
    lockFlashes: [],
    clears: [], // { rows, rowColors, start, duration }
    rain: [], // ambient tetrominos falling on the menu screen
    freezeUntil: 0, // game logic ticks are skipped until this timestamp (impact freeze)
};
const LINE_CLEAR_DURATION = 260; // ms a line clear animation lasts before the rows collapse

function resetFx() {
    fx.particles = [];
    fx.shakes = [];
    fx.flashes = [];
    fx.popups = [];
    fx.trails = [];
    fx.lockFlashes = [];
    fx.clears = [];
    fx.freezeUntil = 0;
};

function spawnParticle(x, y, color, size, vx, vy, life, gravity) {
    fx.particles.push({ x, y, vx, vy, size, color, gravity, start: performance.now(), life });
    if (fx.particles.length > 400) {
        fx.particles.splice(0, fx.particles.length - 400);
    };
};

function spawnBurst(x, y, color, count, speed, life, gravity) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const s = (0.3 + Math.random() * 0.7) * speed;
        spawnParticle(x, y, color, 2 + Math.random() * 4, Math.cos(angle) * s, Math.sin(angle) * s - speed * 0.4, life * (0.6 + Math.random() * 0.4), gravity);
    };
};

function addShake(magnitude, duration) {
    fx.shakes.push({ start: performance.now(), magnitude, duration });
};

function addFlash(color, alpha, duration) {
    fx.flashes.push({ start: performance.now(), color, alpha, duration });
};

function addPopup(text, x, y, size, color, duration, delay) {
    fx.popups.push({ text, x, y, size, color, start: performance.now() + (delay || 0), duration: duration || 900 });
};

function addLockFlash(cells) {
    fx.lockFlashes.push({ cells, start: performance.now(), duration: 90 });
};

function addTrail(rotation, posX, startY, finalY, color) {
    fx.trails.push({ rotation, posX, startY, finalY, color, start: performance.now(), duration: 150 });
};

function addClear(rows, rowColors) {
    fx.clears.push({ rows, rowColors, start: performance.now(), duration: LINE_CLEAR_DURATION });
};

function makeRainPiece(y) {
    return { shape: ["o", "i", "t", "l", "j", "s", "z"][Math.floor(Math.random() * 7)], x: Math.random() * canvas.width, y, speed: 0.4 + Math.random() };
};

/**
 * Update all presentation effects. Called every render frame.
 */
function updateFx(now, dt) {
    const step = dt / (1000 / TPS);

    fx.particles = fx.particles.filter(p => (now - p.start) < p.life);
    for (const p of fx.particles) {
        p.x += p.vx * step;
        p.y += p.vy * step;
        p.vy += p.gravity * step;
    };
    fx.shakes = fx.shakes.filter(s => (now - s.start) < s.duration);
    fx.flashes = fx.flashes.filter(f => (now - f.start) < f.duration);
    fx.popups = fx.popups.filter(p => (now - p.start) < p.duration);
    fx.trails = fx.trails.filter(t => (now - t.start) < t.duration);
    fx.lockFlashes = fx.lockFlashes.filter(l => (now - l.start) < l.duration);

    // Finish any line clear animations: collapse the rows and spawn the next tetromino
    const finished = fx.clears.filter(c => (now - c.start) >= c.duration);
    if (finished.length > 0) {
        fx.clears = fx.clears.filter(c => (now - c.start) < c.duration);
        for (const clear of finished) {
            finalizeLineClear(clear);
        };
    };

    // Ambient tetromino rain on the menu screen
    if (!gameVars.active && !gameVars.gameOver) {
        while (fx.rain.length < 10) {
            fx.rain.push(makeRainPiece(Math.random() * canvas.height));
        };
        for (const r of fx.rain) {
            r.y += r.speed * step;
            if (r.y > canvas.height + 80) {
                Object.assign(r, makeRainPiece(-80));
            };
        };
    } else {
        fx.rain = [];
    };
};

/**
 * Called when a line clear animation has finished: spawn debris particles,
 * remove the rows from the playfield, and spawn the next tetromino.
 */
function finalizeLineClear(clear) {
    for (const row of clear.rows) {
        for (let x = 0; x < PLAYFIELD_WIDTH; x++) {
            const color = clear.rowColors[row][x];
            if (color) {
                const px = x * CELL_WIDTH + CELL_WIDTH / 2;
                const py = CELL_HEIGHT * (PLAYFIELD_HEIGHT - row - 1) + CELL_HEIGHT / 2;
                spawnBurst(px, py, TETROMINO_COLORS[color], clear.rows.length >= 4 ? 3 : 2, 2.2, 600, 0.12);
            };
        };
    };
    for (const row of [...clear.rows].sort((a, b) => b - a)) {
        removeRow(row);
    };
    createControlledTetromino();
};

/**
 * Remove a single row from the playfield, shifting all rows above it down one line.
 */
function removeRow(row) {
    for (let column = 0; column < PLAYFIELD_WIDTH; column++) {
        playfield[column] = playfield[column].slice(0, row).concat(playfield[column].slice(row + 1), [null]);
    };
};

/**
 * Draws a beveled block (base color, light top/left edges, dark bottom/right edges, black border)
 * on any canvas context.
 */
function drawCellPx(ctx, px, py, w, h, color) {
    ctx.fillStyle = TETROMINO_COLORS[color] || "black";
    ctx.fillRect(px, py, w, h);
    const b = Math.max(2, w * 0.15);
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.fillRect(px, py, w, b);
    ctx.fillRect(px, py, b, h);
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(px, py + h - b, w, b);
    ctx.fillRect(px + w - b, py, b, h);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 1, py + 1, w - 2, h - 2);
};

/**
 * Returns the current screen shake offset in pixels (random jitter that decays over each shake's duration).
 */
function getShakeOffset(now) {
    let dx = 0;
    let dy = 0;
    for (const s of fx.shakes) {
        const decay = 1 - (now - s.start) / s.duration;
        dx += (Math.random() * 2 - 1) * s.magnitude * decay;
        dy += (Math.random() * 2 - 1) * s.magnitude * decay;
    };
    return [Math.round(dx), Math.round(dy)];
};

function drawGrid() {
    context.strokeStyle = "rgba(0, 0, 0, 0.06)";
    context.lineWidth = 1;
    for (let x = 1; x < PLAYFIELD_WIDTH; x++) {
        context.beginPath();
        context.moveTo(x * CELL_WIDTH, 0);
        context.lineTo(x * CELL_WIDTH, canvas.height);
        context.stroke();
    };
    for (let y = 1; y < PLAYFIELD_HEIGHT; y++) {
        context.beginPath();
        context.moveTo(0, y * CELL_HEIGHT);
        context.lineTo(canvas.width, y * CELL_HEIGHT);
        context.stroke();
    };
};

function drawRain() {
    const cell = 24;
    context.globalAlpha = 0.1;
    for (const r of fx.rain) {
        const shape = TETROMINOS[r.shape][0];
        for (let row = 0; row < shape.length; row++) {
            for (let column = 0; column < shape[row].length; column++) {
                if (shape[row][column]) {
                    drawCellPx(context, r.x + column * cell, r.y + row * cell, cell, cell, r.shape);
                };
            };
        };
    };
    context.globalAlpha = 1;
};

function drawClearingRows(now) {
    for (const clear of fx.clears) {
        const progress = (now - clear.start) / clear.duration;
        for (const row of clear.rows) {
            for (let x = 0; x < PLAYFIELD_WIDTH; x++) {
                const color = clear.rowColors[row][x];
                if (!color) {
                    continue;
                };
                const px = x * CELL_WIDTH + 1;
                const py = CELL_HEIGHT * (PLAYFIELD_HEIGHT - row - 1) + 1;
                const w = CELL_WIDTH - 2;
                const h = CELL_HEIGHT - 2;
                if (progress < 0.4) {
                    // Flash white
                    drawCellPx(context, px, py, w, h, color);
                    context.globalAlpha = Math.sin((progress / 0.4) * Math.PI);
                    context.fillStyle = "white";
                    context.fillRect(px, py, w, h);
                    context.globalAlpha = 1;
                } else {
                    // Shrink away toward the row center
                    const shrink = 1 - (progress - 0.4) / 0.6;
                    if (shrink <= 0.03) {
                        continue;
                    };
                    const sw = w * shrink;
                    const sh = h * shrink;
                    context.globalAlpha = shrink;
                    drawCellPx(context, px + (w - sw) / 2, py + (h - sh) / 2, sw, sh, color);
                    context.globalAlpha = 1;
                }
            };
        };
    };
};

function drawTrail(now) {
    for (const t of fx.trails) {
        const remaining = 1 - (now - t.start) / t.duration;
        context.globalAlpha = 0.35 * remaining;
        context.fillStyle = TETROMINO_COLORS[t.color];
        const shape = TETROMINOS[t.color][t.rotation];
        for (let column = 0; column < shape[0].length; column++) {
            let topRow = null;
            let bottomRow = null;
            for (let row = 0; row < shape.length; row++) {
                if (shape[row][column]) {
                    if (topRow === null || row > topRow) {
                        topRow = row;
                    };
                    if (bottomRow === null || row < bottomRow) {
                        bottomRow = row;
                    };
                };
            };
            if (topRow === null) {
                continue;
            };
            const px = (t.posX + column) * CELL_WIDTH;
            const topPy = CELL_HEIGHT * (PLAYFIELD_HEIGHT - (t.startY + topRow) - 1);
            const bottomPy = CELL_HEIGHT * (PLAYFIELD_HEIGHT - (t.finalY + bottomRow));
            context.fillRect(px, topPy, CELL_WIDTH, bottomPy - topPy);
        };
    };
    context.globalAlpha = 1;
};

function drawLockFlashes(now) {
    for (const l of fx.lockFlashes) {
        const remaining = 1 - (now - l.start) / l.duration;
        context.globalAlpha = remaining * 0.7;
        context.fillStyle = "white";
        for (const cell of l.cells) {
            context.fillRect(cell.x * CELL_WIDTH + 1, CELL_HEIGHT * (PLAYFIELD_HEIGHT - cell.y - 1) + 1, CELL_WIDTH - 2, CELL_HEIGHT - 2);
        };
    };
    context.globalAlpha = 1;
};

function drawParticles(now) {
    for (const p of fx.particles) {
        const progress = (now - p.start) / p.life;
        context.globalAlpha = 1 - progress;
        context.fillStyle = p.color;
        const size = p.size * (1 - progress * 0.5);
        context.fillRect(p.x - size / 2, p.y - size / 2, size, size);
    };
    context.globalAlpha = 1;
};

function drawPopups(now) {
    context.textAlign = "center";
    for (const p of fx.popups) {
        if (now < p.start) {
            continue;
        };
        const progress = (now - p.start) / p.duration;
        const y = p.y - 44 * progress;
        context.globalAlpha = progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3;
        context.font = "bold " + p.size + "px PressStart";
        context.lineWidth = 6;
        context.strokeStyle = "white";
        context.strokeText(p.text, p.x, y);
        context.fillStyle = p.color;
        context.fillText(p.text, p.x, y);
    };
    context.globalAlpha = 1;
};

function drawFlashes(now) {
    for (const f of fx.flashes) {
        const remaining = 1 - (now - f.start) / f.duration;
        context.globalAlpha = f.alpha * remaining;
        context.fillStyle = f.color;
        context.fillRect(0, 0, canvas.width, canvas.height);
    };
    context.globalAlpha = 1;
};

/**
 * MAIN GAMEPLAY CODE
 */

async function initialize() {
    drawLoadingScreen();
    drawStoredHighscore();

    requestAnimationFrame(renderLoop);

    await loadResources();
    gameVars.loading = false;

    addEventListeners();

    setInterval(tick, 1000 / TPS);
};

function loadResources() {
    const promises = [];

    const font = new FontFace("PressStart", "url('./fonts/PressStart2P-Regular.ttf')");
    promises.push(font.load().then(() => {
        document.fonts.add(font);
    }));

    for (const audio in AUDIO) {
        let cb;
        promises.push(new Promise((resolve, reject) => {
            cb = resolve;
            AUDIO[audio].addEventListener("canplaythrough", cb);
        }).then(() => {
            AUDIO[audio].removeEventListener("canplaythrough", cb);
        }));
    };

    return Promise.all(promises);
};

function drawLoadingScreen() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.textAlign = "center";
    context.font = "bold 32px sans-serif";
    context.fillText("Loading...", canvas.width / 2, canvas.height / 2);
};

function drawMenuText(now) {
    context.textAlign = "center";
    context.globalAlpha = 0.75 + 0.25 * Math.sin(now / 300);
    context.font = "bold 18px PressStart";
    context.fillStyle = "black";
    context.fillText("Click here to start.", canvas.width / 2, canvas.height / 2);
    context.globalAlpha = 1;
};

function addEventListeners() {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp)
    canvas.addEventListener("click", handleClick);
};

function startGame() {
    gameVars.active = true;
    gameVars.paused = false;
    gameVars.gameOver = false;
    gameVars.globalTick = 0;
    gameVars.difficulty = 1;
    gameVars.score = 0;
    gameVars.clearedLines = 0;
    gameVars.combo = 0;
    gameVars.tetrominoBag = [];

    playerVars.controlledTetrominoShape = null;
    playerVars.controlledTetrominoPositionX = null;
    playerVars.controlledTetrominoPositionY = null;
    playerVars.controlledTetrominoRotation = null;
    playerVars.controlledTetrominoLockDelay = null;
    playerVars.controlledTetrominoLockDelayExtensions = null;
    playerVars.controlledTetrominoLowestLine = null;
    playerVars.heldTetromino = null;
    playerVars.hasHeldTetromino = false;
    for (const key in playerVars.keyStates) {
        playerVars.keyStates[key].pressed = false;
        playerVars.keyStates[key].heldTicks = 0;
    };
    resetFx();

    initializePlayfield();
    drawPlayField(performance.now());
    dealTetrominos();
    createControlledTetromino();
    playTheme();
};

function pauseGame() {
    if (!gameVars.active) {
        return;
    };
    if (gameVars.paused) {
        gameVars.paused = false;
        AUDIO.theme.play();
    } else {
        gameVars.paused = true;
        AUDIO.theme.pause();
    };
    playSound(AUDIO.pause);
};

function tick() {
    if (gameVars.active && !gameVars.paused) {
        if (performance.now() < fx.freezeUntil) {
            return; // Impact freeze: stall the game logic for a few ticks when a piece locks
        };
        gameVars.globalTick += 1;
        handleKeyStates();
        tetrominoGravity();
    };
};

// Render loop: presentation (effects, animations) is drawn every animation frame,
// independent of the game logic tick.
let lastRenderTime = performance.now();
function renderLoop(now) {
    const dt = Math.min(50, now - lastRenderTime);
    lastRenderTime = now;
    updateFx(now, dt);
    drawPlayField(now);
    requestAnimationFrame(renderLoop);
};

function initializePlayfield() {
    playfield = Array(PLAYFIELD_WIDTH).fill().map(() => Array(PLAYFIELD_HEIGHT + PLAYFIELD_HEIGHT_BUFFER).fill(null));
};

function drawPlayField(now) {
    context.clearRect(0, 0, canvas.width, canvas.height);

    if (gameVars.loading) {
        drawLoadingScreen();
        return;
    };

    const inMenu = !gameVars.active && !gameVars.gameOver;

    // Everything below the flashes shakes together
    const [shakeX, shakeY] = getShakeOffset(now);
    context.save();
    context.translate(shakeX, shakeY);

    drawGrid();
    if (inMenu) {
        drawRain();
    };
    drawCells(now);
    drawClearingRows(now);
    drawTrail(now);
    drawGhost(now);
    drawControlledTetromino(now);
    drawLockFlashes(now);
    drawParticles(now);
    drawPopups(now);

    context.restore();

    drawFlashes(now);

    if (inMenu) {
        drawMenuText(now);
    };

    drawNextTetromino();
    drawHeldTetromino();
    drawStats();
    drawGameoverText();
    if (gameVars.paused && gameVars.active) {
        drawPauseText();
    };
};

function drawCells(now) {
    const clearingRows = new Set();
    for (const clear of fx.clears) {
        for (const row of clear.rows) {
            clearingRows.add(row);
        };
    };
    for (let x = 0; x < playfield.length; x++) {
        const column = playfield[x];
        for (let y = 0; y < column.length; y++) {
            const cell = column[y];
            if (cell && !clearingRows.has(y)) {
                drawCell(x, y, cell);
            };
        };
    };
};

function drawCell(x, y, color) {
    const px = CELL_WIDTH * x;
    const py = CELL_HEIGHT * (PLAYFIELD_HEIGHT - y - 1);
    const gap = 1;
    drawCellPx(context, px + gap, py + gap, CELL_WIDTH - gap * 2, CELL_HEIGHT - gap * 2, color);
};

function drawControlledTetromino(now) {
    if (playerVars.controlledTetrominoShape) {
        const tetromino = TETROMINOS[playerVars.controlledTetrominoShape][playerVars.controlledTetrominoRotation];
        // Spawn pop: a new piece scales in over the first 120 ms
        const age = now - (playerVars.spawnTime || 0);
        let scale = 1;
        if (age < 120) {
            scale = 0.8 + 0.2 * (age / 120);
        };
        const pieceCX = (playerVars.controlledTetrominoPositionX + tetromino[0].length / 2) * CELL_WIDTH;
        const pieceCY = CELL_HEIGHT * (PLAYFIELD_HEIGHT - (playerVars.controlledTetrominoPositionY + (tetromino.length - 1) / 2) - 1) + CELL_HEIGHT / 2;
        for (let row = 0; row < tetromino.length; row++) {
            for (let column = 0; column < tetromino[row].length; column++) {
                if (tetromino[row][column]) {
                    const gridX = playerVars.controlledTetrominoPositionX + column;
                    const gridY = playerVars.controlledTetrominoPositionY + row;
                    if (scale === 1) {
                        drawCell(gridX, gridY, playerVars.controlledTetrominoShape);
                    } else {
                        const cellCX = CELL_WIDTH * gridX + CELL_WIDTH / 2;
                        const cellCY = CELL_HEIGHT * (PLAYFIELD_HEIGHT - gridY - 1) + CELL_HEIGHT / 2;
                        const sx = pieceCX + (cellCX - pieceCX) * scale;
                        const sy = pieceCY + (cellCY - pieceCY) * scale;
                        drawCellPx(context, sx - (CELL_WIDTH * scale) / 2, sy - (CELL_HEIGHT * scale) / 2, CELL_WIDTH * scale, CELL_HEIGHT * scale, playerVars.controlledTetrominoShape);
                    };
                };
            };
        };
    };
};

function drawGameoverText() {
    if (gameVars.gameOver) {
        context.fillStyle = "rgba(0, 0, 0, 0.25)";
        context.fillRect(0, 0, canvas.width, canvas.height);
        const borderSize = 4;
        context.fillStyle = "black";
        context.fillRect(12 - borderSize, canvas.height / 2 - 64 - borderSize, canvas.width - 24 + (borderSize * 2), 128 + (borderSize * 2));
        context.fillStyle = "white";
        context.fillRect(12, canvas.height / 2 - 64, canvas.width - 24, 128);
        context.fillStyle = "black";
        context.textAlign = "center";
        context.font = "bold 32px PressStart";
        context.fillText("GAME OVER!", canvas.width / 2, canvas.height / 2);
        context.font = "bold 16px PressStart";
        context.fillText("Click here to restart.", canvas.width / 2, canvas.height / 2 + 40);
    };
};

function drawPauseText() {
    const borderSize = 4;
        context.fillStyle = "black";
        context.fillRect(12 - borderSize, canvas.height / 2 - 64 - borderSize, canvas.width - 24 + (borderSize * 2), 128 + (borderSize * 2));
        context.fillStyle = "white";
        context.fillRect(12, canvas.height / 2 - 64, canvas.width - 24, 128);
        context.fillStyle = "black";
        context.textAlign = "center";
        context.font = "bold 32px PressStart";
        context.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
        context.font = "bold 16px PressStart";
        context.fillText("Press ENTER to start.", canvas.width / 2, canvas.height / 2 + 40);
};

function playTheme() {
    AUDIO.theme.currentTime = 0;
    AUDIO.theme.loop = true;
    AUDIO.theme.play();
};

/**
 * Draws a ghost tetromino by determining where the controlled tetromino will land if left uncontrolled, and drawing a transparent tetromino at the determined position.
 */
function drawGhost(now) {
    if (playerVars.controlledTetrominoShape) {
        const tetromino = TETROMINOS[playerVars.controlledTetrominoShape][playerVars.controlledTetrominoRotation];
        let offsetY = 0;
        while (tryMovement(0, offsetY - 1)) {
            offsetY -= 1;
        };
        context.globalAlpha = 0.22 + 0.1 * Math.sin(now / 180); // Gentle pulse
        for (let row = 0; row < tetromino.length; row++) {
            for (let column = 0; column < tetromino[row].length; column++) {
                if (tetromino[row][column]) {
                    drawCell(playerVars.controlledTetrominoPositionX + column, playerVars.controlledTetrominoPositionY + row + offsetY, playerVars.controlledTetrominoShape);
                };
            };
        };
        context.globalAlpha = 1;
    };
};

// Displays the next tetromino.
function drawNextTetromino() {
    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    const nextTetromino = gameVars.tetrominoBag[gameVars.tetrominoBag.length - 1];
    if (nextTetromino) {
        const tetromino = TETROMINOS[nextTetromino][0];
        const offsetX = tetromino[0].length === 3 ? 20 : 0;
        const offsetY = tetromino.length === 4 ? 20 : 0;
        for (let row = 0; row < tetromino.length; row++) {
            for (let column = 0; column < tetromino[row].length; column++) {
                if (tetromino[row][column]) {
                    const px = CELL_WIDTH * column + offsetX;
                    const py = CELL_HEIGHT * (4 - row - 1) + offsetY;
                    const gap = 1;
                    drawCellPx(nextContext, px + gap, py + gap, CELL_WIDTH - gap * 2, CELL_HEIGHT - gap * 2, nextTetromino);
                };
            };
        };
    };
};

// Displays the held tetromino.
function drawHeldTetromino() {
    holdContext.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
    const heldTetromino = playerVars.heldTetromino;
    if (heldTetromino) {
        const tetromino = TETROMINOS[heldTetromino][0];
        const offsetX = tetromino[0].length === 3 ? 20 : 0;
        const offsetY = tetromino.length === 4 ? 20 : 0;
        for (let row = 0; row < tetromino.length; row++) {
            for (let column = 0; column < tetromino[row].length; column++) {
                if (tetromino[row][column]) {
                    const px = CELL_WIDTH * column + offsetX;
                    const py = CELL_HEIGHT * (4 - row - 1) + offsetY;
                    const gap = 1;
                    drawCellPx(holdContext, px + gap, py + gap, CELL_WIDTH - gap * 2, CELL_HEIGHT - gap * 2, heldTetromino);
                };
            };
        };
    };
};

function drawStoredHighscore() {
    if (localStorage.getItem("highscore")) {
        const highElement = document.getElementById("highscore");
        highElement.textContent = JSON.parse(localStorage.getItem("highscore"));
    };
};

// Displays the current game statistics (score, level).
function drawStats() {
    const highElement = document.getElementById("highscore");
    highElement.textContent = Math.max(gameVars.highScore, gameVars.score);

    const scoreElement = document.getElementById("score");
    scoreElement.textContent = gameVars.score;

    const levelElement = document.getElementById("level");
    levelElement.textContent = gameVars.difficulty;
};

/**
 * Spawn a new tetromino for the player by drawing from the bag.
 * 
 * Following the Tetris Guidelines, the tetrominos:
 * - Are created in the guideline position
 * - Are created in the guideline rotation
 * - Immediately moved down 1 line if possible
 * - Cause a gameover if created inside another tetromino
 */
function createControlledTetromino(override) {
    const tetromino = override || gameVars.tetrominoBag.pop();
    if (gameVars.tetrominoBag.length <= 0) {
        dealTetrominos();
    };
    playerVars.controlledTetrominoShape = tetromino;
    playerVars.controlledTetrominoRotation = 0;
    playerVars.controlledTetrominoPositionX = Math.trunc(((PLAYFIELD_WIDTH - 1) / 2) - 1);
    playerVars.controlledTetrominoPositionY = PLAYFIELD_HEIGHT - 1;
    playerVars.controlledTetrominoLockDelay = TPS / 1.5;
    playerVars.controlledTetrominoLockDelayExtensions = 0;
    playerVars.controlledTetrominoLowestLine = playerVars.controlledTetrominoPositionY;
    playerVars.spawnTime = performance.now();
    if (playerVars.controlledTetrominoShape === "i") {
        playerVars.controlledTetrominoPositionY -= 1;
    };
    if (!tryMovement(0, 0)) {
        gameOver();
    };
    if (tryMovement(0, -1)) {
        playerVars.controlledTetrominoPositionY -= 1;
    };
};

/**
 * Reset the delay before the controlled tetromino locks in place when touching ground.
 * As described by the Tetris Guideline, delaying the lock 15 times or more causes the tetromino to immediately lock the next time it touches ground.
 */
function extendControlledTetrominoLockDelay() {
    playerVars.controlledTetrominoLockDelayExtensions += 1;
    if (playerVars.controlledTetrominoLockDelayExtensions < 15) {
        playerVars.controlledTetrominoLockDelay = playerVars.controlledTetrominoLockDelay = TPS / 1.5;
    } else if (playerVars.controlledTetrominoLockDelayExtensions >= 15) {
        playerVars.controlledTetrominoLockDelay = 0;
    };
};

/**
 * Test whether the controlled tetromino is allowed to be in the passed offset position + rotation.
 * This allows testing:
 * - Whether a movement/rotation will place the controlled tetromino inside another tetromino (not allowed)
 * - Whether a movement/rotation will place the controlled tetromino outside the playfield (not allowed)
 * - Whether the controlled tetromino is touching a surface directly below it (touching ground)
 * @returns {Boolean} ```true``` if the movement is valid, ```false``` if not
 */
function tryMovement(offsetX = 0, offsetY = 0, rotation = playerVars.controlledTetrominoRotation) {
    if (!playerVars.controlledTetrominoShape) {
        return false;
    };
    const tetromino = TETROMINOS[playerVars.controlledTetrominoShape][rotation];
    for (let row = 0; row < tetromino.length; row++) {
        for (let column = 0; column < tetromino[row].length; column++) {
            if (tetromino[row][column]) {
                const absoluteX = playerVars.controlledTetrominoPositionX + column + offsetX;
                const absoluteY = playerVars.controlledTetrominoPositionY + row + offsetY;
                if (absoluteX < 0 || absoluteX > PLAYFIELD_WIDTH - 1) {
                    return false;
                };
                if (absoluteY < 0 || absoluteY > PLAYFIELD_HEIGHT + PLAYFIELD_HEIGHT_BUFFER - 1) {
                    return false;
                };
                if (playfield[absoluteX][absoluteY]) {
                    return false;
                };
            };
        };
    };
    return true;
};

/**
 * Moves the controlled tetromino downwards every few ticks based on difficulty.
 * If the tetromino is moved downwards and reaches a new lowest line, the amount of lock delay extensions allowed is reset.
 * If the tetromino is touching ground, decreases the delay before automatically locking the piece into place.
 */
function tetrominoGravity() {
    if (!playerVars.controlledTetrominoShape) {
        return;
    };
    if (tryMovement(0, -1)) {
        if (gameVars.globalTick % (TICKS_PER_LINE[gameVars.difficulty] || 1) === 0) {
            playerVars.controlledTetrominoPositionY -= 1;
            if (playerVars.controlledTetrominoPositionY < playerVars.controlledTetrominoLowestLine) {
                playerVars.controlledTetrominoLowestLine = playerVars.controlledTetrominoPositionY;
                playerVars.controlledTetrominoLockDelay = TPS / 1.5;
                playerVars.controlledTetrominoLockDelayExtensions = 0;
            };
        };
    } else {
        playerVars.controlledTetrominoLockDelay -= 1;
        if (playerVars.controlledTetrominoLockDelay <= 0) {
            lockControlledPiece();
        };
    };
};

function gameOver() {
    gameVars.active = false;
    gameVars.gameOver = true;
    addShake(8, 400);
    addFlash("red", 0.3, 350);
    drawPlayField(performance.now());
    setTimeout(() => {
        playSound(AUDIO.gameover);
    }, 300);
    AUDIO.theme.pause();
    gameVars.highScore = Math.max(0, gameVars.score, gameVars.highScore || 0);
    if (gameVars.highScore > JSON.parse(localStorage.getItem("highscore") || "0")) {
        localStorage.setItem("highscore", JSON.stringify(gameVars.score));
    };
};

// Locks the controlled tetromino in place by adding it to the playfield.
// Immediately after adding the tetromino, score any filled lines and draw a new tetromino for the player.
// (When lines are cleared, the next tetromino is spawned once the clear animation finishes.)
function lockControlledPiece(hardDropped) {
    const shape = playerVars.controlledTetrominoShape;
    const rotation = playerVars.controlledTetrominoRotation;
    const tetromino = TETROMINOS[shape][rotation];

    const lockedCells = [];
    const pieceCellSet = new Set();
    for (let row = 0; row < tetromino.length; row++) {
        for (let column = 0; column < tetromino[row].length; column++) {
            if (tetromino[row][column]) {
                const absoluteX = playerVars.controlledTetrominoPositionX + column;
                const absoluteY = playerVars.controlledTetrominoPositionY + row;
                lockedCells.push({ x: absoluteX, y: absoluteY });
                pieceCellSet.add(absoluteX + "," + absoluteY);
            };
        };
    };
    for (const cell of lockedCells) {
        playfield[cell.x][cell.y] = shape;
    };
    // Cells with no piece cell and no locked cell directly below them (the "bottom" of the placed piece)
    const bottomCells = lockedCells.filter(cell => {
        if (cell.y === 0) {
            return true;
        };
        if (pieceCellSet.has(cell.x + "," + (cell.y - 1))) {
            return false;
        };
        return !playfield[cell.x][cell.y - 1];
    });

    // Juice: impact freeze, lock flash, landing dust, and (for hard drops) a screen shake
    fx.freezeUntil = performance.now() + (hardDropped ? 33 : 16);
    addLockFlash(lockedCells);
    for (const cell of bottomCells) {
        const px = cell.x * CELL_WIDTH + CELL_WIDTH / 2;
        const py = CELL_HEIGHT * (PLAYFIELD_HEIGHT - cell.y - 1) + CELL_HEIGHT;
        spawnBurst(px, py, "rgba(0, 0, 0, 0.3)", hardDropped ? 3 : 1, hardDropped ? 1.8 : 0.9, 300, 0.05);
    };
    if (hardDropped) {
        addShake(4, 150);
    };

    const clearedRows = scoreLines();
    playSound(AUDIO.land);
    playerVars.hasHeldTetromino = false;
    playerVars.controlledTetrominoShape = null;
    playerVars.controlledTetrominoPositionX = null;
    playerVars.controlledTetrominoPositionY = null;
    playerVars.controlledTetrominoRotation = null;
    playerVars.controlledTetrominoLockDelay = null;
    playerVars.controlledTetrominoLockDelayExtensions = null;
    playerVars.controlledTetrominoLowestLine = null;
    if (clearedRows.length === 0) {
        gameVars.combo = 0;
        setTimeout(createControlledTetromino, 200);
    };
};

function holdTetromino() {
    if (!playerVars.controlledTetrominoShape) {
        return;
    };
    if (!playerVars.hasHeldTetromino) {
        if (!playerVars.heldTetromino) {
            playerVars.heldTetromino = playerVars.controlledTetrominoShape;
            createControlledTetromino();
        } else {
            const temp = playerVars.heldTetromino;
            playerVars.heldTetromino = playerVars.controlledTetrominoShape;
            createControlledTetromino(temp);
        };
        playerVars.hasHeldTetromino = true;
        playSound(AUDIO.shift);
    };
};

function moveLeft() {
    if (!playerVars.controlledTetrominoShape) {
        return;
    };
    if (tryMovement(-1, 0)) {
        playerVars.controlledTetrominoPositionX -= 1;
        if (!tryMovement(0, -1)) {
            extendControlledTetrominoLockDelay();
        };
        playSound(AUDIO.move);
    };
};

function moveRight() {
    if (!playerVars.controlledTetrominoShape) {
        return;
    };
    if (tryMovement(1, 0)) {
        playerVars.controlledTetrominoPositionX += 1;
        if (!tryMovement(0, -1)) {
            extendControlledTetrominoLockDelay();
        };
        playSound(AUDIO.move);
    };
};

function rotateLeft() {
    if (!playerVars.controlledTetrominoShape) {
        return;
    };
    const desiredRotation = mod(playerVars.controlledTetrominoRotation - 1, 4);
    const kickOffsetRules = playerVars.controlledTetrominoShape !== "i" ? "normal" : "modified";
    const kickOffsets = KICK_OFFSETS[kickOffsetRules][playerVars.controlledTetrominoRotation][-1];
    let lockDelayExtended = false;
    for (const kickOffset of kickOffsets) {
        if (tryMovement(kickOffset[0], kickOffset[1], desiredRotation)) {
            if (!lockDelayExtended && !tryMovement(0, -1)) {
                extendControlledTetrominoLockDelay();
            };
            playerVars.controlledTetrominoPositionX += kickOffset[0];
            playerVars.controlledTetrominoPositionY += kickOffset[1];
            playerVars.controlledTetrominoRotation = desiredRotation;
            if (!lockDelayExtended && !tryMovement(0, -1)) {
                extendControlledTetrominoLockDelay();
            };
            playSound(AUDIO.rotate);
            break;
        };
    };
};

function rotateRight() {
    if (!playerVars.controlledTetrominoShape) {
        return;
    };
    const desiredRotation = mod(playerVars.controlledTetrominoRotation + 1, 4);
    const kickOffsetRules = playerVars.controlledTetrominoShape !== "i" ? "normal" : "modified";
    const kickOffsets = KICK_OFFSETS[kickOffsetRules][playerVars.controlledTetrominoRotation][1];
    let lockDelayExtended = false;
    for (const kickOffset of kickOffsets) {
        if (tryMovement(kickOffset[0], kickOffset[1], desiredRotation)) {
            if (!lockDelayExtended && !tryMovement(0, -1)) {
                extendControlledTetrominoLockDelay();
            };
            playerVars.controlledTetrominoPositionX += kickOffset[0];
            playerVars.controlledTetrominoPositionY += kickOffset[1];
            playerVars.controlledTetrominoRotation = desiredRotation;
            if (!lockDelayExtended && !tryMovement(0, -1)) {
                extendControlledTetrominoLockDelay();
            };
            playSound(AUDIO.rotate);
            break;
        };
    };
};

// Move the controlled tetromino 1 line down.
function softDrop() {
    if (!playerVars.controlledTetrominoShape) {
        return;
    };
    if (tryMovement(0, -1)) {
        playerVars.controlledTetrominoPositionY -= 1;
        gameVars.score += 1;
    };
};

// Immediately move the controlled tetromino as far down as it can go and lock it in place.
function hardDrop() {
    if (!playerVars.controlledTetrominoShape) {
        return;
    };
    const startX = playerVars.controlledTetrominoPositionX;
    const startY = playerVars.controlledTetrominoPositionY;
    let linesDropped = 0;
    while (tryMovement(0, -1)) {
        playerVars.controlledTetrominoPositionY -= 1;
        linesDropped++;
    };
    if (linesDropped > 0) {
        addTrail(playerVars.controlledTetrominoRotation, startX, startY, playerVars.controlledTetrominoPositionY, playerVars.controlledTetrominoShape);
    };
    lockControlledPiece(true);
    gameVars.score += 2 * linesDropped;
};

// Check the playfield for filled lines.
// Filled lines are not removed immediately: they play a clear animation (flash, then shrink away)
// before being removed and the rows above them collapse (see finalizeLineClear).
// If a line clear threshold has been met, increase the level.
// Returns the array of cleared rows (empty if none).
function scoreLines() {
    const fullRows = [];
    for (let row = 0; row < (PLAYFIELD_HEIGHT + PLAYFIELD_HEIGHT_BUFFER); row++) {
        if (playfield.every(column => column[row])) {
            fullRows.push(row);
        };
    };
    if (fullRows.length === 0) {
        return [];
    };

    // Remember the colors of the cleared cells now, before the rows are removed
    const rowColors = {};
    for (const row of fullRows) {
        rowColors[row] = playfield.map(column => column[row]);
    };

    const clearedLines = fullRows.length;
    if (clearedLines >= 4) { // If 4 lines are scored at once (tetris), play a special sound.
        playSound(AUDIO.tetris);
        addShake(9, 300);
        addFlash("white", 0.25, 300);
    } else {
        playSound(AUDIO.line);
        addShake(3 + clearedLines, 200);
        addFlash("white", 0.12, 200);
    };
    if (clearedLines === 1) {
        gameVars.score += 100 * gameVars.difficulty;
    };
    if (clearedLines === 2) {
        gameVars.score += 300 * gameVars.difficulty;
    };
    if (clearedLines === 3) {
        gameVars.score += 500 * gameVars.difficulty;
    };
    if (clearedLines >= 4) {
        gameVars.score += 800 * gameVars.difficulty;
    };
    gameVars.clearedLines += clearedLines;

    // Floating score popup at the top-most cleared line
    const topRow = Math.max(...fullRows);
    const py = CELL_HEIGHT * (PLAYFIELD_HEIGHT - topRow - 1) + 8;
    const clearNames = ["", "SINGLE", "DOUBLE", "TRIPLE", "TETRIS!"];
    const clearPoints = [0, 100, 300, 500, 800];
    addPopup(clearNames[clearedLines], canvas.width / 2, py, clearedLines >= 4 ? 24 : 16, clearedLines >= 4 ? "red" : "black");
    addPopup("+" + clearPoints[clearedLines] * gameVars.difficulty, canvas.width / 2, py - 32, 12, "black", 900, 60);

    // Combo feedback: consecutive pieces that clear lines
    gameVars.combo += 1;
    if (gameVars.combo >= 2) {
        addPopup("COMBO x" + gameVars.combo, canvas.width / 2, py - 64, 12, "purple", 900, 120);
    };

    if (REQUIRED_LINES_PER_LEVEL[gameVars.difficulty + 1] && gameVars.clearedLines >= REQUIRED_LINES_PER_LEVEL[gameVars.difficulty + 1]) {
        gameVars.difficulty++;
        playSound(AUDIO.level);
        addFlash("white", 0.15, 250);
        addPopup("LEVEL " + gameVars.difficulty, canvas.width / 2, canvas.height / 2, 20, "black", 1400, 200);
    };

    addClear(fullRows, rowColors);
    return fullRows;
};

// Deal the randomized bag of 7 tetrominos by placing each of the 7 tetrominos in a "bag" and shuffling the bag.
function dealTetrominos() {
    gameVars.tetrominoBag = shuffleArray(["o", "i", "t", "l", "j", "s", "z"]);
};

// Shuffle array using the Fisher-Yates algorithm
function shuffleArray(array) {
    let currentIndex = array.length;
    let temp;
    let randomIndex;

    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temp = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temp;
    };

    return array;
};

// Work-around for modulo operator operating as a remainder
function mod(n, mod) {
    return ((n % mod) + mod) % mod;
};

function playSound(sound) {
    if (sound.paused) {
        sound.play();
    } else {
        sound.currentTime = 0;
    };
};

function handleKeyStates() {
    for (const key in playerVars.keyStates) {
        if (playerVars.keyStates[key].pressed) {
            playerVars.keyStates[key].heldTicks++;
        } else {
            playerVars.keyStates[key].heldTicks = 0;
        };
    };
    const holdDelayTicks = 10;
    if (playerVars.keyStates["left"].heldTicks >= holdDelayTicks && (playerVars.keyStates["left"].heldTicks - holdDelayTicks) % 2 === 0) {
        moveLeft();
    };
    if (playerVars.keyStates["right"].heldTicks >= holdDelayTicks && (playerVars.keyStates["right"].heldTicks - holdDelayTicks) % 2 === 0) {
        moveRight();
    };
    if (playerVars.keyStates["down"].heldTicks >= 2) {
        softDrop();
    };
};

function handleKeyDown(event) {
    if (event.code === "Enter") {
        event.preventDefault();
        pauseGame();
        return;
    };
    if (!gameVars.active || gameVars.paused) {
        return;
    };
    switch (event.code) {
        case "KeyZ": {
            event.preventDefault();
            rotateLeft();
            break;
        };
        case "KeyX": {
            event.preventDefault();
            rotateRight();
            break;
        };
        case "KeyC": {
            event.preventDefault();
            holdTetromino();
            break;
        };
        case "ArrowLeft": {
            event.preventDefault();
            if (!playerVars.keyStates.left.pressed) {
                moveLeft();
            };
            playerVars.keyStates.left.pressed = true;
            break;
        };
        case "ArrowRight": {
            event.preventDefault();
            if (!playerVars.keyStates.right.pressed) {
                moveRight();
            };
            playerVars.keyStates.right.pressed = true;
            break;
        };
        case "ArrowDown": {
            event.preventDefault();
            if (!playerVars.keyStates.down.pressed) {
                softDrop();
            };
            playerVars.keyStates.down.pressed = true;
            break;
        };
        case "Space": {
            event.preventDefault();
            if (!playerVars.keyStates.space.pressed) {
                hardDrop();
            };
            playerVars.keyStates.space.pressed = true;
            break;
        };
    };
};

function handleKeyUp(event) {
    switch (event.code) {
        case "ArrowLeft": {
            playerVars.keyStates.left.pressed = false;
            break;
        };
        case "ArrowRight": {
            playerVars.keyStates.right.pressed = false;
            break;
        };
        case "ArrowDown": {
            playerVars.keyStates.down.pressed = false;
            break;
        };
        case "Space": {
            playerVars.keyStates.space.pressed = false;
            break;
        };
    };
};

function handleClick() {
    if (!gameVars.active) {
        startGame();
    };
};

initialize();
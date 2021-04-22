const canvas = document.getElementById("game-canvas");
const context = canvas.getContext("2d");

// Define core gameplay variables
const BOARD_WIDTH = 8;
const BOARD_HEIGHT = 8;
const CELL_WIDTH = canvas.width / BOARD_WIDTH;
const CELL_HEIGHT = canvas.height / BOARD_HEIGHT;
const PIECE_IMAGES = {
    k: {
        l: "./svg/Chess_kl.svg",
        d: "./svg/Chess_kd.svg",
    },
    q: {
        l: "./svg/Chess_ql.svg",
        d: "./svg/Chess_qd.svg",
    },
    r: {
        l: "./svg/Chess_rl.svg",
        d: "./svg/Chess_rd.svg",
    },
    b: {
        l: "./svg/Chess_bl.svg",
        d: "./svg/Chess_bd.svg",
    },
    n: {
        l: "./svg/Chess_nl.svg",
        d: "./svg/Chess_nd.svg",
    },
    p: {
        l: "./svg/Chess_pl.svg",
        d: "./svg/Chess_pd.svg",
    },
};

const board = [
    ["rd", "nd", "bd", "qd", "kd", "bd", "nd", "rd"],
    ["pd", "pd", "pd", "pd", "pd", "pd", "pd", "pd"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["pl", "pl", "pl", "pl", "pl", "pl", "pl", "pl"],
    ["rl", "nl", "bl", "ql", "kl", "bl", "nl", "rl"],
];

const playerVars = {
    selectedCell: null,
    selectedPiece: null,
};

async function initialize() {
    await Promise.all(initializePieceImages());
    drawBoard();
};

function initializePieceImages() {
    const promises = [];
    for (const piece in PIECE_IMAGES) {
        for (const color in PIECE_IMAGES[piece]) {
            promises.push(new Promise((resolve, reject) => {
                const img = new Image(CELL_WIDTH, CELL_HEIGHT);
                img.onload = function() {
                    resolve();
                };
                img.src = PIECE_IMAGES[piece][color];

                PIECE_IMAGES[piece][color] = img;
            }));
        };
    };
    return promises;
};

function drawBoard() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawCells();
    drawSelectedCell();
    drawValidMoves();
    drawPieces();
};

function drawCells() {
    for (let x = 0; x < BOARD_WIDTH; x++) {
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            drawCell(x, y);
        };
    };
};

function drawCell(x, y) {
    context.fillStyle = (x + y) % 2 ? "rgba(181,136,99,255)" : "rgba(240,217,181,255)"; // dark, light
    context.fillRect(CELL_WIDTH * x, CELL_HEIGHT * y, CELL_WIDTH, CELL_HEIGHT);
};

function drawValidCell(x, y) {
    context.fillStyle = (x + y) % 2 ? "rgba(255,255,255,255)" : "rgba(255,255,255,255)"; // dark, light
    context.fillRect(CELL_WIDTH * x, CELL_HEIGHT * y, CELL_WIDTH, CELL_HEIGHT);
};

function drawSelectedCell() {
    if (playerVars.selectedCell) {
        const x = playerVars.selectedCell.x;
        const y = playerVars.selectedCell.y;
        context.fillStyle = (x + y) % 2 ? "rgba(100,111,64,255)" : "rgba(130,151,105,255)"; // dark, light
        context.fillRect(CELL_WIDTH * x, CELL_HEIGHT * y, CELL_WIDTH, CELL_HEIGHT);
    };
};

function drawPieces() {
    for (let row = 0; row < board.length; row++) {
        for (let column = 0; column < board[row].length; column++) {
            const cell = board[row][column];
            if (cell.length) {
                drawPiece(cell[0], cell[1], column, row);
            };
        };
    };
};

function drawPiece(piece, color, x, y) {
    context.drawImage(PIECE_IMAGES[piece][color], x * CELL_WIDTH, y * CELL_HEIGHT);
};

function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    return {
        x: x,
        y: y,
    };
};

function getCellPosition(canvas, event) {
    const pos = getCursorPosition(canvas, event);

    return {
        x: Math.trunc(pos.x / CELL_WIDTH),
        y: Math.trunc(pos.y / CELL_HEIGHT),
    };
};

function getValidPieceMoves(piece, color, x, y) {
    const validMoves = [
        [false, false, false, false, false, false, false, false],
        [false, false, false, false, false, false, false, false],
        [false, false, false, false, false, false, false, false],
        [false, false, false, false, false, false, false, false],
        [false, false, false, false, false, false, false, false],
        [false, false, false, false, false, false, false, false],
        [false, false, false, false, false, false, false, false],
        [false, false, false, false, false, false, false, false],
    ];
    switch (piece) {
        case "k": {
            for (let row = Math.max(0, x - 1); row <= Math.min(x + 1, BOARD_HEIGHT - 1); row++) {
                for (let col = Math.max(0, y - 1); col <= Math.min(y + 1, BOARD_WIDTH - 1); col++) {
                    console.log(board[row][col], board[row][col][1], color);
                    if (board[row][col][1] !== color) {
                        validMoves[row][col] = true;
                    };
                };
            };
            break;
        };
        case "q": {
            for (let row = 0; row < BOARD_HEIGHT; row++) {

            };
            for (let row = Math.max(0, x - 1); row <= Math.min(x + 1, BOARD_HEIGHT - 1); row++) {
                for (let col = Math.max(0, y - 1); col <= Math.min(y + 1, BOARD_WIDTH - 1); col++) {
                    validMoves[col][row] = true;
                };
            };
            break;
        };
    };
    validMoves[y][x] = false;
    console.log(validMoves)
    return validMoves;
};

function drawValidMoves() {
    if (playerVars.selectedPiece) {
        const pieceType = playerVars.selectedPiece[0];
        const pieceColor = playerVars.selectedPiece[1];
        const validMoves = getValidPieceMoves(pieceType, pieceColor, playerVars.selectedCell.y, playerVars.selectedCell.x);
        for (let row = 0; row < validMoves.length; row++) {
            for (let col = 0; col < validMoves[row].length; col++) {
                if (validMoves[row][col]) {
                    drawValidCell(col, row);
                };
            };
        };
    };
};

canvas.addEventListener("mousedown", function(event) {
    const clickedCell = getCellPosition(canvas, event);
    const clickedPiece = board[clickedCell.y][clickedCell.x];
    if (playerVars.selectedPiece) {
        board[playerVars.selectedCell.y][playerVars.selectedCell.x] = "";
        board[clickedCell.y][clickedCell.x] = playerVars.selectedPiece;
        playerVars.selectedPiece = null;
        playerVars.selectedCell = null;
    } else {
        playerVars.selectedCell = clickedCell;
        playerVars.selectedPiece = clickedPiece;
    };
    
    drawBoard();
});

initialize();
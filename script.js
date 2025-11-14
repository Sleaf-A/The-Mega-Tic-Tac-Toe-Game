// script.js - Mega (Ultimate) Tic Tac Toe logic
// Requires the HTML & CSS from earlier messages.

const MODE_MULTI = "multi";
const MODE_SINGLE = "single";

const bigBoardEl = document.getElementById("big-board");
const miniBoards = Array.from(document.querySelectorAll(".mini-board"));
const cells = Array.from(document.querySelectorAll(".cell"));
const messageEl = document.getElementById("message");
const resetBtn = document.getElementById("resetBtn");
const modeSelect = document.getElementById("modeSelect");
const tutorialBtn = document.getElementById("tutorialBtn");
const tutorialPanel = document.getElementById("tutorialPanel");
const closeTutorial = document.getElementById("closeTutorial");

const xWinsEl = document.getElementById("xWins");
const oWinsEl = document.getElementById("oWins");
const drawsEl = document.getElementById("draws");

// Game state
let boardsState = [];     // 9 arrays of 9 cells: '' / 'X' / 'O'
let miniWinners = [];     // '' / 'X' / 'O' / 'T' (tie)
let currentPlayer = "X";
let nextBoardIndex = null; // null means any board playable
let matchOver = false;     // true when overall winner or full draw
let scores = { X: 0, O: 0, D: 0 };

// AI config
const AI_PLAYER = "O";
const AI_DELAY_MS = 450;

// winning combos
const WIN_COMBOS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

// init handlers & game
function attachHandlers() {
  cells.forEach(cell => {
    cell.addEventListener("click", onCellClick);
  });
  resetBtn.addEventListener("click", resetBoard);
  modeSelect.addEventListener("change", onModeChanged);
  tutorialBtn?.addEventListener("click", () => tutorialPanel.classList.remove("hidden"));
  closeTutorial?.addEventListener("click", () => tutorialPanel.classList.add("hidden"));
}

function initGame() {
  // initialize arrays
  boardsState = Array.from({ length: 9 }, () => Array(9).fill(""));
  miniWinners = Array(9).fill("");
  currentPlayer = "X";
  nextBoardIndex = null;
  matchOver = false;

  // clear UI cells & mini-boards
  miniBoards.forEach((mb, bIndex) => {
    mb.classList.remove("won", "active", "x-winner", "o-winner");
    mb.dataset.winner = "";
    // ensure cells are present (HTML already contains them)
    const innerCells = Array.from(mb.querySelectorAll(".cell"));
    innerCells.forEach(c => {
      c.textContent = "";
      c.classList.remove("x","o","last","disabled");
    });
  });

  updateActiveBoards();
  setMessage(`Player ${currentPlayer} starts — play anywhere`);
  updateScoreboardUI();
}

function setMessage(msg) {
  messageEl.textContent = msg;
}

function updateScoreboardUI() {
  xWinsEl.textContent = scores.X;
  oWinsEl.textContent = scores.O;
  drawsEl.textContent = scores.D;
}

function checkMiniWinner(boardArr) {
  for (const combo of WIN_COMBOS) {
    const [a,b,c] = combo;
    if (boardArr[a] && boardArr[a] === boardArr[b] && boardArr[a] === boardArr[c]) {
      return boardArr[a];
    }
  }
  if (boardArr.every(cell => cell !== "")) return "T";
  return null;
}

function checkOverallWinner() {
  for (const combo of WIN_COMBOS) {
    const [a,b,c] = combo;
    if (miniWinners[a] && miniWinners[a] !== "T" &&
        miniWinners[a] === miniWinners[b] && miniWinners[a] === miniWinners[c]) {
      return miniWinners[a];
    }
  }
  // all decided -> draw
  if (miniWinners.every(m => m !== "")) return "T";
  return null;
}

function updateActiveBoards() {
  miniBoards.forEach((mb, idx) => mb.classList.remove("active"));
  if (nextBoardIndex === null) {
    miniBoards.forEach((mb, idx) => {
      if (!miniWinners[idx]) mb.classList.add("active");
    });
  } else {
    if (!miniWinners[nextBoardIndex]) {
      miniBoards[nextBoardIndex].classList.add("active");
    } else {
      // target decided -> all undecided active
      miniBoards.forEach((mb, idx) => { if (!miniWinners[idx]) mb.classList.add("active"); });
      nextBoardIndex = null;
    }
  }
}

function onCellClick(e) {
  if (matchOver) return;
  const cell = e.currentTarget;
  const bIndex = Number(cell.dataset.board);
  const cIndex = Number(cell.dataset.cell);

  // validity checks
  if (miniWinners[bIndex]) return; // board already decided
  if (boardsState[bIndex][cIndex]) return; // cell taken
  if (nextBoardIndex !== null && bIndex !== nextBoardIndex) return; // wrong board

  // place move
  placeMove(bIndex, cIndex, currentPlayer);

  // after player's move, if single player and opponent is AI, trigger AI
  if (!matchOver && modeSelect.value === MODE_SINGLE && currentPlayer === AI_PLAYER) {
    // already AI moved (if AI is current), otherwise wait for AI turn
  }

  // swap or let AI act
  if (!matchOver) {
    if (modeSelect.value === MODE_SINGLE && currentPlayer !== AI_PLAYER) {
      // Human just played as X (we assume X starts). Now schedule AI for O
      window.setTimeout(() => {
        if (!matchOver && currentPlayer === AI_PLAYER) aiMakeMove();
      }, AI_DELAY_MS);
    }
  }
}

function placeMove(bIndex, cIndex, player) {
  // write state
  boardsState[bIndex][cIndex] = player;

  // update UI cell
  const boardEl = miniBoards[bIndex];
  const cellEl = boardEl.querySelector(`.cell[data-cell="${cIndex}"]`);
  if (!cellEl) return;
  cellEl.textContent = player;
  cellEl.classList.add(player.toLowerCase());
  // mark last
  cells.forEach(c => c.classList.remove("last"));
  cellEl.classList.add("last");

  // check mini-board win or tie
  const miniResult = checkMiniWinner(boardsState[bIndex]);
  if (miniResult) {
    miniWinners[bIndex] = miniResult;
    collapseMiniBoard(bIndex, miniResult);
  }

  // decide next board index
  nextBoardIndex = (miniWinners[cIndex] === "" ) ? cIndex : null;

  // check overall winner/draw
  const overall = checkOverallWinner();
  if (overall) {
    // match over
    matchOver = true;
    if (overall === "T") {
      scores.D++;
      setMessage("Match ended: Draw");
    } else {
      scores[overall]++;
      setMessage(`Match ended: Player ${overall} wins!`);
    }
    updateScoreboardUI();
    updateActiveBoards();
    return;
  }

  // swap player
  currentPlayer = currentPlayer === "X" ? "O" : "X";
  setMessage(nextBoardIndex === null ?
    `Player ${currentPlayer}'s turn — play anywhere` :
    `Player ${currentPlayer}'s turn — play in board ${nextBoardIndex + 1}`);
  updateActiveBoards();
}

// visually collapse a mini-board and show winner or tie
function collapseMiniBoard(bIndex, miniResult) {
  const mb = miniBoards[bIndex];
  mb.classList.add("won");
  // store winner for CSS pseudo content
  if (miniResult === "T") {
    mb.dataset.winner = "-";
  } else {
    mb.dataset.winner = miniResult;
    if (miniResult === "X") mb.classList.add("x-winner");
    if (miniResult === "O") mb.classList.add("o-winner");
  }
  // hide its inner cells (CSS handles .mini-board.won .cell {display:none})
}

// --- AI implementation (simple heuristics) ---
function aiMakeMove() {
  if (matchOver) return;
  // AI plays as AI_PLAYER
  let chosenBoard = null;

  // prefer forced board if available
  if (nextBoardIndex !== null && !miniWinners[nextBoardIndex]) {
    chosenBoard = nextBoardIndex;
  } else {
    // choose any non-won board
    const openBoards = boardsState.map((st, idx) => ({ idx, st }))
      .filter(x => !miniWinners[x.idx]);
    if (openBoards.length === 0) return;
    // choose board with most empty cells? or random
    const idxs = openBoards.map(b => b.idx);
    chosenBoard = idxs[Math.floor(Math.random() * idxs.length)];
  }

  // within chosenBoard, try: win -> block -> center -> random
  const board = boardsState[chosenBoard];

  // try winning move
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = AI_PLAYER;
      if (checkMiniWinner(board) === AI_PLAYER) {
        // undo in array since placeMove will set UI & state properly
        board[i] = "";
        placeMove(chosenBoard, i, AI_PLAYER);
        return;
      }
      board[i] = "";
    }
  }

  // try blocking human (X)
  const human = AI_PLAYER === "X" ? "O" : "X";
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = human;
      if (checkMiniWinner(board) === human) {
        board[i] = "";
        placeMove(chosenBoard, i, AI_PLAYER);
        return;
      }
      board[i] = "";
    }
  }

  // center if free
  if (!board[4]) {
    placeMove(chosenBoard, 4, AI_PLAYER);
    return;
  }

  // otherwise random within board
  const empties = board.map((v,i) => v ? null : i).filter(v => v !== null);
  const pick = empties[Math.floor(Math.random() * empties.length)];
  if (pick !== undefined) {
    placeMove(chosenBoard, pick, AI_PLAYER);
    return;
  }

  // should not reach here, but fallback to any move across boards
  for (let b = 0; b < 9; b++) {
    if (miniWinners[b]) continue;
    for (let i = 0; i < 9; i++) {
      if (!boardsState[b][i]) {
        placeMove(b, i, AI_PLAYER);
        return;
      }
    }
  }
}

// UI & control handlers
function resetBoard() {
  // reset board for a new match but keep scores
  boardsState = Array.from({ length: 9 }, () => Array(9).fill(""));
  miniWinners = Array(9).fill("");
  currentPlayer = "X";
  nextBoardIndex = null;
  matchOver = false;

  // reset DOM
  miniBoards.forEach((mb, idx) => {
    mb.classList.remove("won", "x-winner", "o-winner", "active");
    mb.dataset.winner = "";
    const innerCells = Array.from(mb.querySelectorAll(".cell"));
    innerCells.forEach(c => {
      c.textContent = "";
      c.classList.remove("x","o","last","disabled");
    });
  });

  setMessage(`Player ${currentPlayer} starts — play anywhere`);
  updateActiveBoards();
}

// mode change (single / multi)
function onModeChanged() {
  // when switching to single-player, ensure AI won't act until it's its turn
  resetBoard();
  if (modeSelect.value === MODE_SINGLE && currentPlayer === AI_PLAYER) {
    // if AI should start (rare), schedule move
    setTimeout(aiMakeMove, AI_DELAY_MS);
  }
}

// initial setup
attachHandlers();
initGame();

// If user chooses single mode and AI should respond when it becomes AI turn,
// we need to watch for turns. We'll use a MutationObserver for 'last' class or
// keep it simple: after each placeMove we schedule AI if necessary (already handled).


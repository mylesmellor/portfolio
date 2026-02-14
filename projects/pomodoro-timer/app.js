"use strict";

/* ---- DOM refs ---- */
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");
const btnStart = document.getElementById("btn-start");
const btnReset = document.getElementById("btn-reset");
const btnSkip = document.getElementById("btn-skip");
const iconPlay = btnStart.querySelector(".icon-play");
const iconPause = btnStart.querySelector(".icon-pause");
const ringProgress = document.querySelector(".ring-progress");
const sessionCount = document.getElementById("session-count");
const sessionDots = document.getElementById("session-dots");
const inputWork = document.getElementById("input-work");
const inputBreak = document.getElementById("input-break");
const tabs = document.querySelectorAll(".tab");

const CIRCUMFERENCE = 2 * Math.PI * 120; // matches r="120" in SVG

/* ---- State ---- */
let mode = "work"; // "work" | "break"
let totalSeconds = 25 * 60;
let remaining = totalSeconds;
let running = false;
let intervalId = null;
let sessions = 0;

/* ---- Audio ---- */
function playNotification() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Two-tone chime
    [440, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + i * 0.2 + 0.6);
    });
  } catch {
    // Audio not supported — fail silently
  }
}

/* ---- Rendering ---- */
function updateDisplay() {
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  minutesEl.textContent = String(m).padStart(2, "0");
  secondsEl.textContent = String(s).padStart(2, "0");

  const fraction = 1 - remaining / totalSeconds;
  ringProgress.style.strokeDasharray = CIRCUMFERENCE;
  ringProgress.style.strokeDashoffset = CIRCUMFERENCE * (1 - fraction);

  document.title = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} — Pomodoro`;
}

function updateIcons() {
  iconPlay.classList.toggle("hidden", running);
  iconPause.classList.toggle("hidden", !running);
  btnStart.setAttribute("aria-label", running ? "Pause timer" : "Start timer");
}

function updateTabs() {
  tabs.forEach((tab) => {
    const isActive = tab.dataset.mode === mode;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive);
  });
  document.body.classList.toggle("break-mode", mode === "break");
}

function updateSessions() {
  sessionCount.textContent = sessions;
  sessionDots.innerHTML = "";
  const display = Math.min(sessions, 20); // cap dots at 20
  for (let i = 0; i < display; i++) {
    const dot = document.createElement("span");
    dot.className = "dot";
    sessionDots.appendChild(dot);
  }
}

/* ---- Timer logic ---- */
function tick() {
  remaining--;
  if (remaining < 0) {
    stop();
    playNotification();

    if (mode === "work") {
      sessions++;
      updateSessions();
      switchMode("break");
    } else {
      switchMode("work");
    }
    start();
    return;
  }
  updateDisplay();
}

function start() {
  if (running) return;
  running = true;
  intervalId = setInterval(tick, 1000);
  updateIcons();
}

function stop() {
  running = false;
  clearInterval(intervalId);
  intervalId = null;
  updateIcons();
}

function toggle() {
  running ? stop() : start();
}

function switchMode(newMode) {
  stop();
  mode = newMode;
  totalSeconds = getDuration(mode);
  remaining = totalSeconds;
  updateTabs();
  updateDisplay();
}

function reset() {
  stop();
  remaining = totalSeconds;
  updateDisplay();
  updateIcons();
}

function skip() {
  stop();
  if (mode === "work") {
    sessions++;
    updateSessions();
    switchMode("break");
  } else {
    switchMode("work");
  }
}

function getDuration(m) {
  if (m === "work") return clamp(parseInt(inputWork.value, 10) || 25, 1, 90) * 60;
  return clamp(parseInt(inputBreak.value, 10) || 5, 1, 30) * 60;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/* ---- Event listeners ---- */
btnStart.addEventListener("click", toggle);
btnReset.addEventListener("click", reset);
btnSkip.addEventListener("click", skip);

tabs.forEach((tab) => {
  tab.addEventListener("click", () => switchMode(tab.dataset.mode));
});

inputWork.addEventListener("change", () => {
  if (mode === "work" && !running) {
    totalSeconds = getDuration("work");
    remaining = totalSeconds;
    updateDisplay();
  }
});

inputBreak.addEventListener("change", () => {
  if (mode === "break" && !running) {
    totalSeconds = getDuration("break");
    remaining = totalSeconds;
    updateDisplay();
  }
});

/* Keyboard shortcut: Space to toggle */
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return;
  if (e.code === "Space") {
    e.preventDefault();
    toggle();
  }
});

/* ---- Init ---- */
ringProgress.style.strokeDasharray = CIRCUMFERENCE;
updateDisplay();
updateTabs();
updateSessions();

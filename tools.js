// =========================================
// TOOLS PAGE
// Stopwatch + Timer
// Completely independent from FitSphere
// workout/running/history data
// =========================================

// =========================================
// BACK BUTTON
// =========================================

function goBack() {
  window.location.href = "index.html";
}

// =========================================
// STOPWATCH
// =========================================

let stopwatchInterval = null;
let stopwatchMilliseconds = 0;
let stopwatchRunning = false;

const stopwatchDisplay = document.getElementById("stopwatchDisplay");

const stopwatchStart = document.getElementById("stopwatchStart");

const stopwatchReset = document.getElementById("stopwatchReset");

// Format stopwatch time
function formatStopwatchTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);

  const hours = Math.floor(totalSeconds / 3600);

  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const seconds = totalSeconds % 60;

  return (
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0")
  );
}

// Update stopwatch display
function updateStopwatch() {
  stopwatchDisplay.textContent = formatStopwatchTime(stopwatchMilliseconds);
}

// Start / pause stopwatch
stopwatchStart.addEventListener("click", () => {
  if (!stopwatchRunning) {
    stopwatchRunning = true;

    stopwatchStart.textContent = "Pause";

    const startTime = Date.now() - stopwatchMilliseconds;

    stopwatchInterval = setInterval(() => {
      stopwatchMilliseconds = Date.now() - startTime;

      updateStopwatch();
    }, 100);
  } else {
    stopwatchRunning = false;

    stopwatchStart.textContent = "Start";

    clearInterval(stopwatchInterval);
  }
});

// Reset stopwatch
stopwatchReset.addEventListener("click", () => {
  clearInterval(stopwatchInterval);

  stopwatchRunning = false;

  stopwatchMilliseconds = 0;

  stopwatchStart.textContent = "Start";

  updateStopwatch();
});

// Initial display
updateStopwatch();

// =========================================
// TIMER
// =========================================

let timerMinutes = 5;
let timerSeconds = 0;

let timerInterval = null;
let timerRunning = false;

// DOM
const timerMinutesEl = document.getElementById("timerMinutes");

const timerSecondsEl = document.getElementById("timerSeconds");

const timerDisplay = document.getElementById("timerDisplay");

const timerStart = document.getElementById("timerStart");

const timerReset = document.getElementById("timerReset");

const timerMinPlus = document.getElementById("timerMinPlus");

const timerMinMinus = document.getElementById("timerMinMinus");

const timerSecPlus = document.getElementById("timerSecPlus");

const timerSecMinus = document.getElementById("timerSecMinus");

// =========================================
// UPDATE TIMER UI
// =========================================

function updateTimerUI() {
  timerMinutesEl.textContent = String(timerMinutes).padStart(2, "0");

  timerSecondsEl.textContent = String(timerSeconds).padStart(2, "0");

  timerDisplay.textContent =
    String(timerMinutes).padStart(2, "0") +
    ":" +
    String(timerSeconds).padStart(2, "0");
}

// =========================================
// MINUTE CONTROLS
// =========================================

timerMinPlus.addEventListener("click", () => {
  if (timerRunning) return;

  if (timerMinutes < 99) {
    timerMinutes++;
  }

  updateTimerUI();
});

timerMinMinus.addEventListener("click", () => {
  if (timerRunning) return;

  if (timerMinutes > 0) {
    timerMinutes--;
  }

  updateTimerUI();
});

// =========================================
// SECOND CONTROLS
// =========================================

timerSecPlus.addEventListener("click", () => {
  if (timerRunning) return;

  timerSeconds += 5;

  if (timerSeconds >= 60) {
    timerSeconds = 0;

    if (timerMinutes < 99) {
      timerMinutes++;
    }
  }

  updateTimerUI();
});

timerSecMinus.addEventListener("click", () => {
  if (timerRunning) return;

  timerSeconds -= 5;

  if (timerSeconds < 0) {
    if (timerMinutes > 0) {
      timerMinutes--;

      timerSeconds = 55;
    } else {
      timerSeconds = 0;
    }
  }

  updateTimerUI();
});

// =========================================
// START TIMER
// =========================================

timerStart.addEventListener("click", () => {
  if (timerRunning) {
    // Pause
    timerRunning = false;

    clearInterval(timerInterval);

    timerStart.textContent = "Resume";

    return;
  }

  // Don't start empty timer
  if (timerMinutes === 0 && timerSeconds === 0) {
    return;
  }

  timerRunning = true;

  timerStart.textContent = "Pause";

  timerInterval = setInterval(() => {
    if (timerSeconds === 0) {
      if (timerMinutes === 0) {
        // Finished
        clearInterval(timerInterval);

        timerRunning = false;

        timerStart.textContent = "Start";

        timerDisplay.textContent = "00:00";

        // Small notification
        if ("vibrate" in navigator) {
          navigator.vibrate([300, 150, 300]);
        }

        return;
      }

      timerMinutes--;

      timerSeconds = 59;
    } else {
      timerSeconds--;
    }

    updateTimerUI();
  }, 1000);
});

// =========================================
// RESET TIMER
// =========================================

timerReset.addEventListener("click", () => {
  clearInterval(timerInterval);

  timerRunning = false;

  timerMinutes = 5;
  timerSeconds = 0;

  timerStart.textContent = "Start";

  updateTimerUI();
});

// Initial timer display
updateTimerUI();

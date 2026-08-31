// =========================================
// FITSPHERE - TOOLS.JS
// =========================================
// Stopwatch + Countdown Timer
// Completely independent from:
// - workout.js
// - running.js
// - gymStats
// - gymHistory
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

let stopwatchStartTime = 0;
let stopwatchElapsed = 0;
let stopwatchRunning = false;

let stopwatchInterval = null;

// =========================================
// STOPWATCH DOM
// =========================================

const stopwatchDisplay = document.getElementById("stopwatchDisplay");

const stopwatchStart = document.getElementById("stopwatchStart");

const stopwatchReset = document.getElementById("stopwatchReset");

// =========================================
// FORMAT STOPWATCH TIME
// =========================================

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

// =========================================
// UPDATE STOPWATCH DISPLAY
// =========================================

function updateStopwatch() {
  if (!stopwatchDisplay) {
    return;
  }

  let displayTime = stopwatchElapsed;

  // If running, calculate time from
  // timestamp instead of relying on
  // setInterval accuracy.

  if (stopwatchRunning) {
    displayTime = Date.now() - stopwatchStartTime;
  }

  stopwatchDisplay.textContent = formatStopwatchTime(displayTime);
}

// =========================================
// START STOPWATCH REFRESH
// =========================================

function startStopwatchInterval() {
  clearInterval(stopwatchInterval);

  // The interval is only responsible
  // for refreshing the UI.

  stopwatchInterval = setInterval(updateStopwatch, 100);
}

// =========================================
// STOP STOPWATCH REFRESH
// =========================================

function stopStopwatchInterval() {
  clearInterval(stopwatchInterval);

  stopwatchInterval = null;
}

// =========================================
// STOPWATCH START / PAUSE
// =========================================

if (stopwatchStart) {
  stopwatchStart.addEventListener("click", () => {
    // =================================
    // START / RESUME
    // =================================

    if (!stopwatchRunning) {
      stopwatchRunning = true;

      stopwatchStartTime = Date.now() - stopwatchElapsed;

      stopwatchStart.textContent = "Pause";

      startStopwatchInterval();

      updateStopwatch();

      return;
    }

    // =================================
    // PAUSE
    // =================================

    stopwatchElapsed = Date.now() - stopwatchStartTime;

    stopwatchRunning = false;

    stopwatchStart.textContent = "Start";

    stopStopwatchInterval();

    updateStopwatch();
  });
}

// =========================================
// STOPWATCH RESET
// =========================================

if (stopwatchReset) {
  stopwatchReset.addEventListener("click", () => {
    stopStopwatchInterval();

    stopwatchRunning = false;

    stopwatchStartTime = 0;

    stopwatchElapsed = 0;

    if (stopwatchStart) {
      stopwatchStart.textContent = "Start";
    }

    updateStopwatch();
  });
}

// =========================================
// INITIAL STOPWATCH DISPLAY
// =========================================

updateStopwatch();

// =========================================
// COUNTDOWN TIMER
// =========================================

let timerMinutes = 5;
let timerSeconds = 0;

let timerRemaining = 0;

let timerRunning = false;

let timerEndTime = 0;

let timerInterval = null;

// =========================================
// TIMER DOM
// =========================================

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
  if (timerMinutesEl) {
    timerMinutesEl.textContent = String(timerMinutes).padStart(2, "0");
  }

  if (timerSecondsEl) {
    timerSecondsEl.textContent = String(timerSeconds).padStart(2, "0");
  }

  if (timerDisplay) {
    timerDisplay.textContent =
      String(timerMinutes).padStart(2, "0") +
      ":" +
      String(timerSeconds).padStart(2, "0");
  }
}

// =========================================
// GET TIMER REMAINING
// =========================================
//
// Uses Date.now() so the countdown does
// not depend on setInterval running every
// second.
//
// =========================================

function getTimerRemaining() {
  if (!timerRunning) {
    return timerRemaining;
  }

  const remaining = Math.max(0, timerEndTime - Date.now());

  return Math.ceil(remaining / 1000);
}

// =========================================
// UPDATE TIMER FROM TIMESTAMP
// =========================================

function updateTimerFromClock() {
  if (!timerRunning) {
    return;
  }

  timerRemaining = getTimerRemaining();

  timerMinutes = Math.floor(timerRemaining / 60);

  timerSeconds = timerRemaining % 60;

  updateTimerUI();

  // =================================
  // TIMER FINISHED
  // =================================

  if (timerRemaining <= 0) {
    timerRunning = false;

    timerRemaining = 0;

    timerMinutes = 0;

    timerSeconds = 0;

    stopTimerInterval();

    if (timerStart) {
      timerStart.textContent = "Start";
    }

    updateTimerUI();

    // =================================
    // VIBRATION
    // =================================

    if ("vibrate" in navigator) {
      try {
        navigator.vibrate([300, 150, 300]);
      } catch (error) {
        console.log("Vibration unavailable:", error);
      }
    }
  }
}

// =========================================
// START TIMER REFRESH
// =========================================

function startTimerInterval() {
  clearInterval(timerInterval);

  // Again, this is only a UI refresh.
  // Actual timer calculation uses
  // timerEndTime.

  timerInterval = setInterval(updateTimerFromClock, 250);
}

// =========================================
// STOP TIMER REFRESH
// =========================================

function stopTimerInterval() {
  clearInterval(timerInterval);

  timerInterval = null;
}

// =========================================
// MINUTE PLUS
// =========================================

if (timerMinPlus) {
  timerMinPlus.addEventListener("click", () => {
    if (timerRunning) {
      return;
    }

    if (timerMinutes < 99) {
      timerMinutes++;
    }

    timerRemaining = timerMinutes * 60 + timerSeconds;

    updateTimerUI();
  });
}

// =========================================
// MINUTE MINUS
// =========================================

if (timerMinMinus) {
  timerMinMinus.addEventListener("click", () => {
    if (timerRunning) {
      return;
    }

    if (timerMinutes > 0) {
      timerMinutes--;
    }

    timerRemaining = timerMinutes * 60 + timerSeconds;

    updateTimerUI();
  });
}

// =========================================
// SECOND PLUS
// =========================================

if (timerSecPlus) {
  timerSecPlus.addEventListener("click", () => {
    if (timerRunning) {
      return;
    }

    timerSeconds += 5;

    if (timerSeconds >= 60) {
      timerSeconds = 0;

      if (timerMinutes < 99) {
        timerMinutes++;
      }
    }

    timerRemaining = timerMinutes * 60 + timerSeconds;

    updateTimerUI();
  });
}

// =========================================
// SECOND MINUS
// =========================================

if (timerSecMinus) {
  timerSecMinus.addEventListener("click", () => {
    if (timerRunning) {
      return;
    }

    timerSeconds -= 5;

    if (timerSeconds < 0) {
      if (timerMinutes > 0) {
        timerMinutes--;

        timerSeconds = 55;
      } else {
        timerSeconds = 0;
      }
    }

    timerRemaining = timerMinutes * 60 + timerSeconds;

    updateTimerUI();
  });
}

// =========================================
// START / PAUSE TIMER
// =========================================

if (timerStart) {
  timerStart.addEventListener("click", () => {
    // =================================
    // PAUSE
    // =================================

    if (timerRunning) {
      timerRemaining = getTimerRemaining();

      timerMinutes = Math.floor(timerRemaining / 60);

      timerSeconds = timerRemaining % 60;

      timerRunning = false;

      stopTimerInterval();

      timerStart.textContent = "Resume";

      updateTimerUI();

      return;
    }

    // =================================
    // DON'T START EMPTY TIMER
    // =================================

    if (timerMinutes === 0 && timerSeconds === 0 && timerRemaining === 0) {
      return;
    }

    // =================================
    // RESUME / START
    // =================================

    timerRemaining = timerMinutes * 60 + timerSeconds;

    if (timerRemaining <= 0) {
      return;
    }

    timerEndTime = Date.now() + timerRemaining * 1000;

    timerRunning = true;

    timerStart.textContent = "Pause";

    startTimerInterval();

    updateTimerFromClock();
  });
}

// =========================================
// RESET TIMER
// =========================================

if (timerReset) {
  timerReset.addEventListener("click", () => {
    stopTimerInterval();

    timerRunning = false;

    timerEndTime = 0;

    timerRemaining = 5 * 60;

    timerMinutes = 5;

    timerSeconds = 0;

    if (timerStart) {
      timerStart.textContent = "Start";
    }

    updateTimerUI();
  });
}

// =========================================
// INITIAL TIMER STATE
// =========================================

timerRemaining = timerMinutes * 60 + timerSeconds;

updateTimerUI();

// =========================================
// PAGE VISIBILITY
// =========================================
//
// Android may suspend JavaScript while
// the screen is locked.
//
// When the PWA becomes visible again,
// immediately recalculate both timers.
//
// =========================================

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    // =================================
    // STOPWATCH
    // =================================

    if (stopwatchRunning) {
      updateStopwatch();
      startStopwatchInterval();
    } else {
      updateStopwatch();
    }

    // =================================
    // COUNTDOWN TIMER
    // =================================

    if (timerRunning) {
      updateTimerFromClock();
      startTimerInterval();
    } else {
      updateTimerUI();
    }
  }
});

// =========================================
// PAGE SHOW
// =========================================

window.addEventListener("pageshow", () => {
  if (stopwatchRunning) {
    updateStopwatch();
    startStopwatchInterval();
  } else {
    updateStopwatch();
  }

  if (timerRunning) {
    updateTimerFromClock();
    startTimerInterval();
  } else {
    updateTimerUI();
  }
});

// =========================================
// PAGE HIDE
// =========================================
//
// No timing data is lost because both
// stopwatch and timer use timestamps.
//
// =========================================

window.addEventListener("pagehide", () => {
  if (stopwatchRunning) {
    stopwatchElapsed = Date.now() - stopwatchStartTime;
  }

  if (timerRunning) {
    timerRemaining = getTimerRemaining();
  }
});

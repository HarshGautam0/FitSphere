// ======================================
// FITSPHERE - RUNNING.JS
// ======================================
// Running Tracker
// GPS + Distance + Speed + Pace
// Background/Lock-Screen Safe Timer
// ======================================

// ======================================
// STORAGE
// ======================================

const RUNNING_STATS_KEY = "gymStats";
const RUNNING_HISTORY_KEY = "gymHistory";
const ACTIVE_RUN_KEY = "fitsphereActiveRun";

// ======================================
// RUNNING APP STATE
// ======================================

let map = null;
let routeLine = null;

let path = [];

let watchId = null;

let isRunning = false;
let isPaused = false;

let startTime = 0;

let elapsedTime = 0;

let runningTimerInterval = null;

let totalDistance = 0;

let lastPosition = null;

// ======================================
// PAUSE TIMING
// ======================================

let pausedAt = 0;
let totalPausedTime = 0;

// ======================================
// SPEECH STATE
// ======================================

let lastMinuteSpoken = 0;
let lastDistanceSpoken = 0;

// ======================================
// PROFILE
// ======================================

const profile = JSON.parse(localStorage.getItem("fitnessProfile")) || {};

// ======================================
// DOM ELEMENTS
// ======================================

const timeEl = document.getElementById("time");

const distanceEl = document.getElementById("distance");

const paceEl = document.getElementById("pace");

const speedEl = document.getElementById("speed");

const caloriesEl = document.getElementById("calories");

const stepsEl = document.getElementById("steps");

const startBtn = document.getElementById("startRun");

const pauseBtn = document.getElementById("pauseRun");

const stopBtn = document.getElementById("stopRun");

const runSummary = document.getElementById("runSummary");

const sDistance = document.getElementById("sDistance");

const sTime = document.getElementById("sTime");

const sPace = document.getElementById("sPace");

const sSpeed = document.getElementById("sSpeed");

const sCalories = document.getElementById("sCalories");

// ======================================
// SAFE ELEMENT CHECK
// ======================================

function runningElementExists(element) {
  return !!element;
}

// ======================================
// CALCULATE RUNNING CALORIES
// ======================================

function calculateCalories(distanceKm, durationSec) {
  const weight = Number(profile.weight) || 70;

  const age = Number(profile.age) || 25;

  const gender = profile.gender || "Male";

  const hours = durationSec / 3600;

  if (hours <= 0) {
    return 0;
  }

  const speed = distanceKm / hours;

  // ==================================
  // MET ACCORDING TO RUNNING SPEED
  // ==================================

  let MET = 6;

  if (speed >= 5) {
    MET = 8;
  }

  if (speed >= 8) {
    MET = 9.8;
  }

  if (speed >= 10) {
    MET = 11;
  }

  if (speed >= 12) {
    MET = 12.5;
  }

  // ==================================
  // AGE ADJUSTMENT
  // ==================================

  if (age > 50) {
    MET *= 0.95;
  }

  // ==================================
  // GENDER ADJUSTMENT
  // ==================================

  if (gender.toLowerCase() === "female") {
    MET *= 0.95;
  }

  return Math.round(MET * weight * hours);
}

// ======================================
// INITIALIZE MAP
// ======================================

function initMap() {
  const mapElement = document.getElementById("map");

  if (!mapElement) {
    return;
  }

  // Prevent duplicate map initialization
  if (map) {
    return;
  }

  map = L.map("map").setView([28.6139, 77.2099], 15);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap",
  }).addTo(map);

  routeLine = L.polyline([], {
    color: "blue",
  }).addTo(map);
}

initMap();

// ======================================
// DISTANCE CALCULATION
// ======================================

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;

  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ======================================
// FORMAT TIME
// ======================================

function formatRunningTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds));

  const hours = Math.floor(safeSeconds / 3600);

  const minutes = Math.floor((safeSeconds % 3600) / 60);

  const secondsRemaining = safeSeconds % 60;

  if (hours > 0) {
    return (
      String(hours).padStart(2, "0") +
      ":" +
      String(minutes).padStart(2, "0") +
      ":" +
      String(secondsRemaining).padStart(2, "0")
    );
  }

  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(secondsRemaining).padStart(2, "0")
  );
}

// ======================================
// GET REAL ELAPSED RUN TIME
// ======================================
//
// This is the important part.
//
// We calculate elapsed time from Date.now()
// rather than trusting setInterval().
//
// Therefore, if Android suspends the PWA
// while the screen is locked, reopening the
// app allows us to calculate the correct time.
//
// ======================================

function getCurrentElapsedTime() {
  if (!startTime) {
    return elapsedTime;
  }

  if (isPaused) {
    return elapsedTime;
  }

  const currentTime = Date.now();

  return Math.max(
    0,
    Math.floor((currentTime - startTime - totalPausedTime) / 1000),
  );
}

// ======================================
// UPDATE TIME
// ======================================

function updateTime() {
  if (!isRunning) {
    return;
  }

  if (isPaused) {
    return;
  }

  elapsedTime = getCurrentElapsedTime();

  if (timeEl) {
    timeEl.innerText = formatRunningTime(elapsedTime);
  }

  updateStats();

  // ==================================
  // EVERY MINUTE VOICE
  // ==================================

  const minutes = Math.floor(elapsedTime / 60);

  const seconds = elapsedTime % 60;

  if (minutes > 0 && minutes !== lastMinuteSpoken && seconds === 0) {
    lastMinuteSpoken = minutes;

    if (typeof speak === "function") {
      speak(`${minutes} minute${minutes > 1 ? "s" : ""} completed`);
    }
  }
}

// ======================================
// UPDATE RUNNING STATS
// ======================================

function updateStats() {
  if (distanceEl) {
    distanceEl.innerText = totalDistance.toFixed(2) + " km";
  }

  // ==================================
  // SPEED
  // ==================================

  const hours = elapsedTime / 3600;

  const speed = hours > 0 ? totalDistance / hours : 0;

  if (speedEl) {
    speedEl.innerText = isFinite(speed) ? speed.toFixed(2) + " km/h" : "0 km/h";
  }

  // ==================================
  // PACE
  // ==================================

  const distance = totalDistance;

  const pace = distance > 0 ? elapsedTime / 60 / distance : Infinity;

  if (paceEl) {
    if (isFinite(pace)) {
      const minutes = Math.floor(pace);

      const seconds = Math.floor((pace - minutes) * 60);

      paceEl.innerText = `${minutes}:${String(seconds).padStart(2, "0")} /km`;
    } else {
      paceEl.innerText = "0:00 /km";
    }
  }

  // ==================================
  // CALORIES
  // ==================================

  const calories = calculateCalories(totalDistance, elapsedTime);

  if (caloriesEl) {
    caloriesEl.innerText = calories + " kcal";
  }

  // ==================================
  // ESTIMATED STEPS
  // ==================================

  if (stepsEl) {
    stepsEl.innerText = Math.floor(totalDistance * 1300);
  }
}

// ======================================
// SAVE ACTIVE RUN STATE
// ======================================

function saveActiveRunState() {
  if (!isRunning) {
    return;
  }

  const state = {
    isRunning: true,
    isPaused,

    startTime,

    elapsedTime,

    pausedAt,
    totalPausedTime,

    totalDistance,

    path,

    lastPosition,

    lastMinuteSpoken,
    lastDistanceSpoken,

    savedAt: Date.now(),
  };

  localStorage.setItem(ACTIVE_RUN_KEY, JSON.stringify(state));
}

// ======================================
// CLEAR ACTIVE RUN STATE
// ======================================

function clearActiveRunState() {
  localStorage.removeItem(ACTIVE_RUN_KEY);
}

// ======================================
// RESTORE ACTIVE RUN
// ======================================
//
// This restores the timer state if the
// page is recreated while a run is active.
//
// Note:
//
// GPS tracking itself depends on Android/
// browser background restrictions.
//
// The elapsed clock is timestamp based.
//
// ======================================

function restoreActiveRun() {
  const saved = localStorage.getItem(ACTIVE_RUN_KEY);

  if (!saved) {
    return false;
  }

  try {
    const state = JSON.parse(saved);

    if (!state || !state.isRunning) {
      return false;
    }

    isRunning = true;

    isPaused = !!state.isPaused;

    startTime = Number(state.startTime) || Date.now();

    elapsedTime = Number(state.elapsedTime) || 0;

    pausedAt = Number(state.pausedAt) || 0;

    totalPausedTime = Number(state.totalPausedTime) || 0;

    totalDistance = Number(state.totalDistance) || 0;

    path = Array.isArray(state.path) ? state.path : [];

    lastPosition = state.lastPosition || null;

    lastMinuteSpoken = Number(state.lastMinuteSpoken) || 0;

    lastDistanceSpoken = Number(state.lastDistanceSpoken) || 0;

    // Restore route
    if (routeLine && path.length > 0) {
      routeLine.setLatLngs(path);
    }

    // Update elapsed time
    if (!isPaused) {
      elapsedTime = getCurrentElapsedTime();
    }

    updateStats();

    if (timeEl) {
      timeEl.innerText = formatRunningTime(elapsedTime);
    }

    if (pauseBtn) {
      pauseBtn.innerText = isPaused ? "Resume" : "Pause";
    }

    // Restart GPS watcher
    if (!isPaused) {
      startGPSWatch();
    }

    startRunningInterval();

    return true;
  } catch (error) {
    console.error("Failed to restore active run:", error);

    clearActiveRunState();

    return false;
  }
}

// ======================================
// START GPS WATCH
// ======================================

function startGPSWatch() {
  if (!navigator.geolocation) {
    if (typeof showToast === "function") {
      showToast("GPS is not supported on this device.");
    }

    return;
  }

  // Avoid multiple watches
  if (watchId !== null) {
    return;
  }

  watchId = navigator.geolocation.watchPosition(updatePosition, errorHandler, {
    enableHighAccuracy: true,
    maximumAge: 1000,
    timeout: 10000,
  });
}

// ======================================
// STOP GPS WATCH
// ======================================

function stopGPSWatch() {
  if (watchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);

    watchId = null;
  }
}

// ======================================
// START RUNNING INTERVAL
// ======================================
//
// The interval is only for refreshing
// the screen.
//
// It is NOT responsible for measuring
// the actual elapsed time.
//
// ======================================

function startRunningInterval() {
  clearInterval(runningTimerInterval);

  runningTimerInterval = setInterval(updateTime, 500);
}

// ======================================
// STOP RUNNING INTERVAL
// ======================================

function stopRunningInterval() {
  clearInterval(runningTimerInterval);

  runningTimerInterval = null;
}

// ======================================
// START RUN
// ======================================

if (startBtn) {
  startBtn.onclick = () => {
    if (isRunning) {
      return;
    }

    // ==================================
    // COUNTDOWN
    // ==================================

    if (typeof speak === "function") {
      speak("Ready");

      setTimeout(() => speak("3"), 1000);

      setTimeout(() => speak("2"), 2000);

      setTimeout(() => speak("1"), 3000);
    }

    setTimeout(() => {
      if (typeof speak === "function") {
        speak("Start Running");
      }

      // ==================================
      // RESET RUN STATE
      // ==================================

      isRunning = true;

      isPaused = false;

      startTime = Date.now();

      elapsedTime = 0;

      totalPausedTime = 0;

      pausedAt = 0;

      totalDistance = 0;

      path = [];

      lastPosition = null;

      lastMinuteSpoken = 0;

      lastDistanceSpoken = 0;

      // ==================================
      // RESET MAP LINE
      // ==================================

      if (routeLine) {
        routeLine.setLatLngs([]);
      }

      // ==================================
      // UPDATE UI
      // ==================================

      if (timeEl) {
        timeEl.innerText = "00:00";
      }

      if (distanceEl) {
        distanceEl.innerText = "0.00 km";
      }

      if (speedEl) {
        speedEl.innerText = "0 km/h";
      }

      if (paceEl) {
        paceEl.innerText = "0:00 /km";
      }

      if (caloriesEl) {
        caloriesEl.innerText = "0 kcal";
      }

      if (stepsEl) {
        stepsEl.innerText = "0";
      }

      if (runSummary) {
        runSummary.hidden = true;
      }

      if (pauseBtn) {
        pauseBtn.innerText = "Pause";
      }

      // ==================================
      // SAVE STATE
      // ==================================

      saveActiveRunState();

      // ==================================
      // START GPS
      // ==================================

      startGPSWatch();

      // ==================================
      // START UI TIMER
      // ==================================

      startRunningInterval();
    }, 4000);
  };
}

// ======================================
// PAUSE / RESUME
// ======================================

if (pauseBtn) {
  pauseBtn.onclick = () => {
    if (!isRunning) {
      return;
    }

    // ==================================
    // PAUSE
    // ==================================

    if (!isPaused) {
      // Calculate elapsed time
      // before entering pause.

      elapsedTime = getCurrentElapsedTime();

      pausedAt = Date.now();

      isPaused = true;

      stopRunningInterval();

      stopGPSWatch();

      pauseBtn.innerText = "Resume";

      if (typeof speak === "function") {
        speak("Run paused");
      }

      saveActiveRunState();

      return;
    }

    // ==================================
    // RESUME
    // ==================================

    const now = Date.now();

    if (pausedAt) {
      totalPausedTime += now - pausedAt;
    }

    pausedAt = 0;

    isPaused = false;

    pauseBtn.innerText = "Pause";

    if (typeof speak === "function") {
      speak("Run resumed");
    }

    startGPSWatch();

    startRunningInterval();

    saveActiveRunState();
  };
}

// ======================================
// GPS UPDATE
// ======================================

function updatePosition(position) {
  if (!isRunning || isPaused) {
    return;
  }

  const lat = position.coords.latitude;

  const lng = position.coords.longitude;

  const newPoint = [lat, lng];

  // ==================================
  // ADD POINT TO PATH
  // ==================================

  path.push(newPoint);

  if (routeLine) {
    routeLine.setLatLngs(path);
  }

  // ==================================
  // MOVE MAP
  // ==================================

  if (map) {
    map.panTo(newPoint);
  }

  // ==================================
  // DISTANCE
  // ==================================

  if (lastPosition) {
    const segmentDistance = getDistance(
      lastPosition[0],
      lastPosition[1],
      lat,
      lng,
    );

    // Ignore obviously invalid GPS jumps.
    //
    // A very large jump in one GPS update
    // should not add hundreds of kilometers
    // to the run.

    if (segmentDistance >= 0 && segmentDistance < 0.1) {
      totalDistance += segmentDistance;
    }
  }

  lastPosition = newPoint;

  // ==================================
  // UPDATE TIME
  // ==================================

  elapsedTime = getCurrentElapsedTime();

  // ==================================
  // UPDATE STATS
  // ==================================

  updateStats();

  // ==================================
  // DISTANCE VOICE
  // ==================================

  const wholeKm = Math.floor(totalDistance);

  if (wholeKm > 0 && wholeKm !== lastDistanceSpoken) {
    lastDistanceSpoken = wholeKm;

    if (typeof speak === "function") {
      speak(`${wholeKm} kilometer completed`);
    }
  }

  // ==================================
  // SAVE STATE
  // ==================================

  saveActiveRunState();
}

// ======================================
// SAVE RUN TO HISTORY
// ======================================

function saveRunToHistory() {
  let history = JSON.parse(localStorage.getItem(RUNNING_HISTORY_KEY)) || [];

  const now = new Date();

  const today = now.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const currentTime = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const distance = Number(totalDistance.toFixed(2));

  const calories = calculateCalories(distance, elapsedTime);

  const runTime = Math.max(1, Math.floor(elapsedTime / 60));

  // ==================================
  // AVERAGE SPEED
  // ==================================

  const speed =
    elapsedTime > 0 ? Number((distance / (elapsedTime / 3600)).toFixed(2)) : 0;

  // ==================================
  // FIND TODAY'S ENTRY
  // ==================================

  let todayEntry = history.find((item) => item.date === today);

  // ==================================
  // CREATE ENTRY
  // ==================================

  if (!todayEntry) {
    todayEntry = {
      date: today,

      time: currentTime,

      workout: {
        reps: 0,
        calories: 0,
        time: 0,
      },

      running: {
        distance: 0,
        calories: 0,
        time: 0,
        speeds: [],
      },
    };

    history.push(todayEntry);
  }

  // ==================================
  // ENSURE RUNNING OBJECT
  // ==================================

  if (!todayEntry.running) {
    todayEntry.running = {
      distance: 0,
      calories: 0,
      time: 0,
      speeds: [],
    };
  }

  // ==================================
  // ENSURE SPEED ARRAY
  // ==================================

  if (!Array.isArray(todayEntry.running.speeds)) {
    todayEntry.running.speeds = [];
  }

  // ==================================
  // UPDATE TIME
  // ==================================

  todayEntry.time = currentTime;

  // ==================================
  // ADD RUN TOTALS
  // ==================================

  todayEntry.running.distance += distance;

  todayEntry.running.calories += calories;

  todayEntry.running.time += runTime;

  todayEntry.running.speeds.push(speed);

  // ==================================
  // SAVE
  // ==================================

  localStorage.setItem(RUNNING_HISTORY_KEY, JSON.stringify(history));
}

// ======================================
// FINISH RUN
// ======================================

function finishRun() {
  if (!isRunning) {
    return;
  }

  // ==================================
  // FINAL TIME CALCULATION
  // ==================================

  if (!isPaused) {
    elapsedTime = getCurrentElapsedTime();
  }

  // ==================================
  // STOP RUNNING
  // ==================================

  isRunning = false;

  isPaused = false;

  stopGPSWatch();

  stopRunningInterval();

  // ==================================
  // SAVE FINAL STATE TO UI
  // ==================================

  updateStats();

  if (timeEl) {
    timeEl.innerText = formatRunningTime(elapsedTime);
  }

  // ==================================
  // VOICE
  // ==================================

  if (typeof speak === "function") {
    speak("Run completed. Great job.");
  }

  // ==================================
  // SHOW SUMMARY
  // ==================================

  if (runSummary) {
    runSummary.hidden = false;
  }

  if (sDistance) {
    sDistance.innerText = totalDistance.toFixed(2) + " km";
  }

  if (sTime) {
    sTime.innerText = formatRunningTime(elapsedTime);
  }

  if (sSpeed) {
    sSpeed.innerText = speedEl ? speedEl.innerText : "0 km/h";
  }

  if (sCalories) {
    sCalories.innerText = caloriesEl ? caloriesEl.innerText : "0 kcal";
  }

  if (sPace) {
    sPace.innerText = paceEl ? paceEl.innerText : "0:00 /km";
  }

  // ==================================
  // PERSONAL RECORDS
  // ==================================

  const distance = Number(totalDistance.toFixed(2));

  const speed = parseFloat(speedEl?.innerText) || 0;

  const pace = distance > 0 ? elapsedTime / 60 / distance : 0;

  const runMinutes = Math.max(1, Math.floor(elapsedTime / 60));

  if (typeof updateRunningRecords === "function") {
    updateRunningRecords(distance, speed, pace, runMinutes);
  }

  // ==================================
  // SAVE HISTORY
  // ==================================

  saveRunToHistory();

  // ==================================
  // UPDATE GLOBAL STATS
  // ==================================

  let stats = JSON.parse(localStorage.getItem(RUNNING_STATS_KEY)) || {
    workouts: 0,
    reps: 0,
    calories: 0,
    distance: 0,
    time: 0,
  };

  stats.distance += distance;

  stats.calories += Math.floor(distance * 60);

  stats.time += runMinutes;

  localStorage.setItem(RUNNING_STATS_KEY, JSON.stringify(stats));

  // ==================================
  // UPDATE STREAK
  // ==================================

  if (typeof updateWorkoutStreak === "function") {
    updateWorkoutStreak();
  }

  // ==================================
  // CLEAR ACTIVE RUN
  // ==================================

  clearActiveRunState();

  // ==================================
  // RESET BUTTON
  // ==================================

  if (pauseBtn) {
    pauseBtn.innerText = "Pause";
  }
}

// ======================================
// GPS ERROR
// ======================================

function errorHandler(err) {
  console.error("GPS Error:", err);

  if (typeof showToast === "function") {
    showToast("GPS Error: " + err.message);
  }
}

// ======================================
// PAGE VISIBILITY
// ======================================
//
// When Android locks the screen,
// JavaScript may be suspended.
//
// We do NOT rely on the interval.
//
// When the PWA becomes visible again,
// Date.now() recalculates the real
// elapsed running time.
//
// ======================================

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    if (isRunning) {
      if (!isPaused) {
        elapsedTime = getCurrentElapsedTime();

        updateTime();

        // GPS watcher may have been
        // suspended by Android.

        if (watchId === null) {
          startGPSWatch();
        }

        startRunningInterval();

        saveActiveRunState();
      }
    }
  } else {
    if (isRunning) {
      saveActiveRunState();
    }
  }
});

// ======================================
// PAGE SHOW
// ======================================

window.addEventListener("pageshow", () => {
  if (isRunning) {
    if (!isPaused) {
      elapsedTime = getCurrentElapsedTime();

      updateTime();

      if (watchId === null) {
        startGPSWatch();
      }

      startRunningInterval();
    }

    saveActiveRunState();
  }
});

// ======================================
// PAGE HIDE / APP BACKGROUND
// ======================================

window.addEventListener("pagehide", () => {
  if (isRunning) {
    saveActiveRunState();
  }
});

// ======================================
// INITIAL UI
// ======================================

if (timeEl) {
  timeEl.innerText = "00:00";
}

if (distanceEl) {
  distanceEl.innerText = "0.00 km";
}

if (speedEl) {
  speedEl.innerText = "0 km/h";
}

if (paceEl) {
  paceEl.innerText = "0:00 /km";
}

if (caloriesEl) {
  caloriesEl.innerText = "0 kcal";
}

if (stepsEl) {
  stepsEl.innerText = "0";
}

// ======================================
// RESTORE PREVIOUS RUN
// ======================================
//
// If the PWA was closed/reloaded while
// a run was active, restore it.
//
// ======================================

restoreActiveRun();

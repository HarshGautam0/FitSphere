/* =================================
        RUNNING APP STATE
================================= */
let map;
let routeLine;
let path = [];
let watchId = null;
let isRunning = false;
let isPaused = false;
let startTime = 0;
let elapsedTime = 0;
let timerInterval = null;
let totalDistance = 0;
let lastPosition = null;
/* =================================
        DOM ELEMENTS
================================= */
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
const STATS_KEY = "gymStats";
const profile = JSON.parse(localStorage.getItem("fitnessProfile")) || {};
function calculateCalories(distanceKm, durationSec) {
  const weight = Number(profile.weight) || 70;
  const age = Number(profile.age) || 25;
  const gender = profile.gender || "Male";
  const hours = durationSec / 3600;
  if (hours <= 0) return 0;
  const speed = distanceKm / hours;
  // MET according to running speed
  let MET = 6;
  if (speed >= 5) MET = 8;
  if (speed >= 8) MET = 9.8;
  if (speed >= 10) MET = 11;
  if (speed >= 12) MET = 12.5;
  // Small adjustment for age
  if (age > 50) MET *= 0.95;
  // Small adjustment for gender
  if (gender.toLowerCase() === "female") {
    MET *= 0.95;
  }
  return Math.round(MET * weight * hours);
}
let lastMinuteSpoken = 0;
let lastDistanceSpoken = 0;
/* =================================
        INIT MAP
================================= */
function initMap() {
  map = L.map("map").setView([28.6139, 77.2099], 15);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap",
  }).addTo(map);
  routeLine = L.polyline([], { color: "blue" }).addTo(map);
}
initMap();
/* =================================
        DISTANCE CALC
================================= */
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
/* =================================
        START RUN
================================= */
startBtn.onclick = () => {
  if (isRunning) return;
  speak("Ready");
  setTimeout(() => speak("3"), 1000);
  setTimeout(() => speak("2"), 2000);
  setTimeout(() => speak("1"), 3000);
  setTimeout(() => {
    speak("Start Running");
    isRunning = true;
    isPaused = false;
    startTime = Date.now();
    timerInterval = setInterval(updateTime, 1000);
    watchId = navigator.geolocation.watchPosition(
      updatePosition,
      errorHandler,
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
      },
    );
  }, 4000);
};
/* =================================
        PAUSE
================================= */
pauseBtn.onclick = () => {
  if (!isRunning) return;
  isPaused = !isPaused;
  pauseBtn.innerText = isPaused ? "Resume" : "Pause";
  speak(isPaused ? "Run paused" : "Run resumed");
};
/* =================================
        STOP RUN
================================= */
stopBtn.onclick = () => {
  finishRun();
};
/* =================================
        GPS UPDATE
================================= */
function updatePosition(position) {
  if (isPaused) return;
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  const newPoint = [lat, lng];
  path.push(newPoint);
  routeLine.setLatLngs(path);
  map.panTo(newPoint);
  if (lastPosition) {
    totalDistance += getDistance(lastPosition[0], lastPosition[1], lat, lng);
  }
  lastPosition = newPoint;
  updateStats();
  const wholeKm = Math.floor(totalDistance);
  if (wholeKm > 0 && wholeKm !== lastDistanceSpoken) {
    lastDistanceSpoken = wholeKm;
    speak(`${wholeKm} kilometer completed`);
  }
}
/* =================================
        TIMER
================================= */
function updateTime() {
  if (isPaused) return;
  elapsedTime = Math.floor((Date.now() - startTime) / 1000);
  const m = Math.floor(elapsedTime / 60);
  const s = elapsedTime % 60;
  timeEl.innerText = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  // Every minute
  if (m > 0 && m !== lastMinuteSpoken && s === 0) {
    lastMinuteSpoken = m;
    speak(`${m} minute${m > 1 ? "s" : ""} completed`);
  }
}
/* =================================
        STATS
================================= */
function updateStats() {
  distanceEl.innerText = totalDistance.toFixed(2) + " km";
  const speed = totalDistance / (elapsedTime / 3600);
  speedEl.innerText = isFinite(speed) ? speed.toFixed(2) + " km/h" : "0 km/h";
  const pace = elapsedTime / 60 / totalDistance;
  if (isFinite(pace)) {
    const m = Math.floor(pace);
    const s = Math.floor((pace - m) * 60);
    paceEl.innerText = `${m}:${String(s).padStart(2, "0")} /km`;
  } else {
    paceEl.innerText = "0:00 /km";
  }
  const calories = calculateCalories(totalDistance, elapsedTime);
  caloriesEl.innerText = calories + " kcal";
  stepsEl.innerText = Math.floor(totalDistance * 1300);
}
/* =================================
        SAVE RUN TO HISTORY
================================= */
/* =================================
        SAVE RUN TO HISTORY
================================= */
function saveRunToHistory() {
  let history = JSON.parse(localStorage.getItem("gymHistory")) || [];
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
  // Average speed (km/h)
  const speed =
    runTime > 0 ? Number((distance / (runTime / 60)).toFixed(2)) : 0;
  // Find today's history
  let todayEntry = history.find((item) => item.date === today);
  // Create today's entry if it doesn't exist
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
        speed: [],
      },
    };
    history.push(todayEntry);
  }
  // Ensure running object exists
  if (!todayEntry.running) {
    todayEntry.running = {
      distance: 0,
      calories: 0,
      time: 0,
      speed: 0,
    };
  }
  // Update latest activity time
  todayEntry.time = currentTime;
  // Add today's totals
  todayEntry.running.distance += distance;
  todayEntry.running.calories += calories;
  todayEntry.running.time += runTime;
  // Store latest average speed
  if (!todayEntry.running.speeds) {
    todayEntry.running.speeds = [];
  }
  todayEntry.running.speeds.push(speed);
  localStorage.setItem("gymHistory", JSON.stringify(history));
}
/* =================================
        FINISH RUN
================================= */
function finishRun() {
  speak("Run completed. Great job.");
  isRunning = false;
  navigator.geolocation.clearWatch(watchId);
  clearInterval(timerInterval);
  runSummary.hidden = false;
  sDistance.innerText = totalDistance.toFixed(2) + " km";
  sTime.innerText = timeEl.innerText;
  sSpeed.innerText = speedEl.innerText;
  sCalories.innerText = caloriesEl.innerText;
  sPace.innerText = paceEl.innerText;
  const distance = Number(totalDistance.toFixed(2));
  const speed = parseFloat(speedEl.innerText) || 0;
  const pace = elapsedTime / 60 / distance;
  const runMinutes = Math.max(1, Math.floor(elapsedTime / 60));
  // Update Personal Records
  updateRunningRecords(distance, speed, pace, runMinutes);
  // Save today's run in history
  saveRunToHistory();
  // ============================
  // UPDATE GLOBAL STATS
  // ============================
  let stats = JSON.parse(localStorage.getItem(STATS_KEY)) || {
    workouts: 0,
    reps: 0,
    calories: 0,
    distance: 0,
    time: 0,
  };
  stats.distance += distance;
  stats.calories += Math.floor(distance * 60);
  stats.time += runMinutes;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  pauseBtn.innerText = "Pause";
  updateWorkoutStreak();
}
/* =================================
        ERROR
================================= */
function errorHandler(err) {
  showToast("GPS Error: " + err.message);
}

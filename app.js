// ======================================
// app.js (HOME PAGE ONLY)
// ======================================
// Storage Keys

const STATS_KEY = "gymStats";
const HISTORY_KEY = "gymHistory";
// ======================================
// GREETING
// ======================================
function loadGreeting() {
  const greeting = document.getElementById("greeting");
  if (!greeting) return;
  const profile = JSON.parse(localStorage.getItem("fitnessProfile"));
  if (!profile) return;
  const hour = new Date().getHours();
  let text = "Good Evening";
  if (hour < 12) text = "Good Morning";
  else if (hour < 17) text = "Good Afternoon";
  greeting.innerHTML = `👋 ${text}, ${profile.name}`;
}
// ======================================
// TODAY'S STATS
// ======================================
function getTodayStats() {
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return history
    .filter((item) => item.date === today)
    .reduce(
      (acc, cur) => {
        acc.workouts++;
        acc.reps += cur.workout?.reps || 0;
        acc.calories += cur.workout?.calories || 0;
        acc.distance += cur.running?.distance || 0;
        return acc;
      },
      {
        workouts: 0,
        reps: 0,
        calories: 0,
        distance: 0,
      },
    );
}
// ======================================
// UPDATE HOME DASHBOARD
// ======================================
function updateHomeStats() {
  const stats = getTodayStats();
  const workouts = document.getElementById("todayWorkouts");
  const calories = document.getElementById("todayCalories");
  const distance = document.getElementById("todayDistance");
  if (workouts) workouts.innerText = stats.workouts;
  if (calories) calories.innerText = stats.calories;
  if (distance) distance.innerText = stats.distance + " km";
}
// =======================================
// REGISTER SERVICE WORKER
// =======================================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then(() => {
        console.log("✅ Service Worker Registered");
      })
      .catch((err) => {
        console.error("Service Worker Error:", err);
      });
  });
}
// =======================================
// SPLASH SCREEN
// =======================================
document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splashScreen");
  if (!splash) return;

  const nav = performance.getEntriesByType("navigation")[0];

  // Hide splash by default
  splash.style.display = "none";

  // Don't show when coming from another page in the app
  if (document.referrer.startsWith(location.origin) && nav.type !== "reload") {
    splash.remove();
    return;
  }

  splash.style.display = "flex";

  setTimeout(() => {
    splash.classList.add("hide");
    setTimeout(() => splash.remove(), 500);
  }, 2500);
});
// ======================================
// INITIALIZE
// ======================================
updateHomeStats();
loadGreeting();

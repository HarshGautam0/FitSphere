/* ======================================
        WORKOUT STREAK SYSTEM
====================================== */

const STREAK_KEY = "fitnessStreak";

/* -----------------------------
   Load streak
----------------------------- */

function getStreakData() {
  return (
    JSON.parse(localStorage.getItem(STREAK_KEY)) || {
      current: 0,
      best: 0,
      lastDate: null,
    }
  );
}

/* -----------------------------
   Save streak
----------------------------- */

function saveStreakData(data) {
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
}

/* -----------------------------
   Update streak
Call after workout or run finishes.
----------------------------- */

function updateWorkoutStreak() {
  const today = new Date();
  const todayString = today.toDateString();

  let streak = getStreakData();

  if (streak.lastDate === todayString) {
    return;
  }

  if (streak.lastDate) {
    const last = new Date(streak.lastDate);

    const diff = Math.floor((today - last) / (1000 * 60 * 60 * 24));

    if (diff === 1) {
      streak.current++;
    } else if (diff > 1) {
      streak.current = 1;
    }
  } else {
    streak.current = 1;
  }

  streak.lastDate = todayString;

  if (streak.current > streak.best) {
    streak.best = streak.current;
  }

  saveStreakData(streak);

  renderStreak();
}

/* -----------------------------
   Display on Home page
----------------------------- */

function renderStreak() {
  const streak = getStreakData();

  const current = document.getElementById("currentStreak");
  const best = document.getElementById("bestStreak");

  if (current) current.innerText = streak.current;

  if (best) best.innerText = streak.best;
}

document.addEventListener("DOMContentLoaded", renderStreak);

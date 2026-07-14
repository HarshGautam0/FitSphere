/* ==========================================
        LOAD USER DATA
========================================== */
const stats = JSON.parse(localStorage.getItem("gymStats")) || {
  workouts: 0,
  reps: 0,
  calories: 0,
  distance: 0,
  time: 0,
};
const streak = JSON.parse(localStorage.getItem("fitnessStreak")) || {
  current: 0,
  best: 0,
};
/* ==========================================
        ACHIEVEMENTS
========================================== */
const achievements = [
  /* ---------- Beginner ---------- */
  {
    title: "First Workout",
    icon: "🏅",
    description: "Complete your first workout.",
    unlocked: stats.workouts >= 1,
    category: "beginner",
  },
  {
    title: "First Run",
    icon: "🏃",
    description: "Complete your first running session.",
    unlocked: stats.distance > 0,
    category: "beginner",
  },
  /* ---------- Workout ---------- */
  {
    title: "100 Reps",
    icon: "💯",
    description: "Complete 100 total reps.",
    unlocked: stats.reps >= 100,
    category: "workout",
  },
  {
    title: "1000 Reps",
    icon: "💪",
    description: "Complete 1000 total reps.",
    unlocked: stats.reps >= 1000,
    category: "workout",
  },
  {
    title: "5000 Reps",
    icon: "🏋️",
    description: "Complete 5000 total reps.",
    unlocked: stats.reps >= 5000,
    category: "workout",
  },
  {
    title: "10 Workouts",
    icon: "🔥",
    description: "Finish 10 workouts.",
    unlocked: stats.workouts >= 10,
    category: "workout",
  },
  {
    title: "50 Workouts",
    icon: "🏆",
    description: "Finish 50 workouts.",
    unlocked: stats.workouts >= 50,
    category: "workout",
  },
  /* ---------- Running ---------- */
  {
    title: "5 km Runner",
    icon: "🏃",
    description: "Run a total of 5 km.",
    unlocked: stats.distance >= 5,
    category: "running",
  },
  {
    title: "25 km Runner",
    icon: "🚀",
    description: "Run a total of 25 km.",
    unlocked: stats.distance >= 25,
    category: "running",
  },
  {
    title: "50 km Runner",
    icon: "🌍",
    description: "Run a total of 50 km.",
    unlocked: stats.distance >= 50,
    category: "running",
  },
  {
    title: "100 km Runner",
    icon: "⚡",
    description: "Run a total of 100 km.",
    unlocked: stats.distance >= 100,
    category: "running",
  },
  /* ---------- Streak ---------- */
  {
    title: "3 Day Streak",
    icon: "🔥",
    description: "Workout 3 days in a row.",
    unlocked: streak.best >= 3,
    category: "streak",
  },
  {
    title: "7 Day Streak",
    icon: "🏅",
    description: "Workout 7 days in a row.",
    unlocked: streak.best >= 7,
    category: "streak",
  },
  {
    title: "30 Day Streak",
    icon: "👑",
    description: "Workout 30 days in a row.",
    unlocked: streak.best >= 30,
    category: "streak",
  },
];
function updateHomeAchievementCard() {
  const unlocked = achievements.filter((a) => a.unlocked).length;
  const total = achievements.length;
  const percent = (unlocked / total) * 100;
  const unlockedEl = document.getElementById("homeUnlocked");
  const totalEl = document.getElementById("homeTotal");
  const progressEl = document.getElementById("homeAchievementProgress");
  if (unlockedEl) unlockedEl.innerText = unlocked;
  if (totalEl) totalEl.innerText = total;
  if (progressEl) progressEl.style.width = percent + "%";
}

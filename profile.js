const PROFILE_KEY = "fitnessProfile";
const STATS_KEY = "gymStats";
const HISTORY_KEY = "gymHistory";
// const RECORD_KEY = "fitnessRecords";
// const STREAK_KEY = "fitnessStreak";
const form = document.getElementById("profileForm");
const avatar = document.getElementById("profileAvatar");
const genderSelect = document.getElementById("gender");
function updateAvatar() {
  switch (genderSelect.value) {
    case "Female":
      avatar.src = "assets/female.png";
      break;
    case "Other":
      avatar.src = "assets/other.png";
      break;
    default:
      avatar.src = "assets/male.png";
  }
}
genderSelect.addEventListener("change", updateAvatar);
/* ===========================
      LOAD PROFILE
=========================== */
function loadProfile() {
  const profile = JSON.parse(localStorage.getItem(PROFILE_KEY));
  if (!profile) return;
  name.value = profile.name;
  age.value = profile.age;
  gender.value = profile.gender;
  weight.value = profile.weight;
  height.value = profile.height;
  updateAvatar();
  document.getElementById("displayName").innerText =
    profile.name || "Fitness User";
  calculateBMI(profile.weight, profile.height);
}
/* ===========================
      SAVE PROFILE
=========================== */
form.addEventListener("submit", function (e) {
  e.preventDefault();

  const profile = {
    name: document.getElementById("name").value,
    age: Number(document.getElementById("age").value),
    gender: document.getElementById("gender").value,
    weight: Number(document.getElementById("weight").value),
    height: Number(document.getElementById("height").value),
  };

  localStorage.setItem("fitnessProfile", JSON.stringify(profile));

  loadProfile();

  showToast("Profile Updated Successfully.");
});
/* ===========================
      BMI
=========================== */
function calculateBMI(weight, height) {
  const bmi = weight / Math.pow(height / 100, 2);
  document.getElementById("profileBMI").innerText = bmi.toFixed(1);
  let status = "";
  if (bmi < 18.5) status = "Underweight";
  else if (bmi < 25) status = "Normal";
  else if (bmi < 30) status = "Overweight";
  else status = "Obese";
  document.getElementById("bmiStatus").innerText = status;
}
/* ===========================
      FITNESS STATS
=========================== */
function loadStats() {
  const stats = JSON.parse(localStorage.getItem(STATS_KEY)) || {
    workouts: 0,
    reps: 0,
    calories: 0,
    distance: 0,
    time: 0,
  };
  document.getElementById("profileWorkouts").innerText = stats.workouts;
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  document.getElementById("profileRuns").innerText = history.filter(
    (h) => h.running && h.running.distance > 0,
  ).length;
  document.getElementById("profileCalories").innerText = stats.calories;
  document.getElementById("profileDistance").innerText =
    stats.distance.toFixed(2) + " km";
  document.getElementById("profileReps").innerText = stats.reps;
  document.getElementById("profileTime").innerText = stats.time + " min";
}
/* ===========================
      RECORDS
=========================== */
function loadRecords() {
  const records = JSON.parse(localStorage.getItem(RECORD_KEY));
  if (!records) return;
  document.getElementById("prReps").innerText =
    records.workout.maxReps + " reps";
  document.getElementById("prDistance").innerText =
    records.running.longestDistance.toFixed(2) + " km";
  document.getElementById("prSpeed").innerText =
    records.running.fastestSpeed.toFixed(2) + " km/h";
  if (records.running.bestPace != null) {
    const m = Math.floor(records.running.bestPace);
    const s = Math.round((records.running.bestPace - m) * 60);
    document.getElementById("prPace").innerText =
      `${m}:${String(s).padStart(2, "0")} /km`;
  }
}
/* ===========================
      STREAK
=========================== */
function loadStreak() {
  const streak = JSON.parse(localStorage.getItem(STREAK_KEY));
  if (!streak) return;
  document.getElementById("profileCurrentStreak").innerText = streak.current;
  document.getElementById("profileBestStreak").innerText = streak.best;
}
/* ===========================
      ACHIEVEMENTS
=========================== */
function loadAchievements() {
  if (typeof achievements === "undefined") return;
  const container = document.getElementById("recentAchievements");
  container.innerHTML = "";
  achievements
    .filter((a) => a.unlocked)
    .slice(-3)
    .forEach((a) => {
      const badge = document.createElement("div");
      badge.className = "badge";
      badge.innerHTML = a.icon + " " + a.title;
      container.appendChild(badge);
    });
  if (container.innerHTML === "") container.innerHTML = "No achievements yet.";
}
/* ===========================
      WEEKLY GRAPH
=========================== */
function drawWeeklyChart() {
  const canvas = document.getElementById("weeklyChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = canvas.offsetWidth;
  canvas.height = 220;
  const history = JSON.parse(localStorage.getItem("gymHistory")) || [];
  const values = [0, 0, 0, 0, 0, 0, 0];
  history.slice(-7).forEach((h, i) => {
    values[i] = (h.workout?.calories || 0) + (h.running?.calories || 0);
  });
  const max = Math.max(...values, 1);
  const width = 40;
  const gap = 25;
  values.forEach((v, i) => {
    const h = (v / max) * 160;
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(25 + i * (width + gap), 180 - h, width, h);
    ctx.fillStyle = "#888";
    ctx.fillText(
      ["M", "T", "W", "T", "F", "S", "S"][i],
      35 + i * (width + gap),
      200,
    );
  });
}
/* ===========================
      INIT
=========================== */
loadProfile();
loadStats();
loadRecords();
loadStreak();
loadAchievements();
drawWeeklyChart();

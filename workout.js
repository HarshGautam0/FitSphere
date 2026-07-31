// ======================================
// workout.js
// ======================================
// ======================================
// GLOBAL VARIABLES
// ======================================
const STATS_KEY = "gymStats";
const HISTORY_KEY = "gymHistory";
let selectedExerciseForConfig = null;
let selectedExercises = [];
let workoutQueue = [];
let currentWorkout = null;
let exerciseIndex = 0;
let currentSet = 1;
let workoutStartTime = 0;
let completedReps = 0;
let completedCalories = 0;
let autoInterval = null;
let timerInterval = null;
let restInterval = null;
let pendingAction = null;
let isPaused = false;
// ==========================================
// MODAL VALUES
// ==========================================
let modalSets = 3;
let modalReps = 10;
let modalMinutes = 0;
let modalSeconds = 30;
function updateModalUI() {
  document.getElementById("setsValue").textContent = modalSets;
  document.getElementById("repsValue").textContent = modalReps;
  document.getElementById("minuteValue").textContent = modalMinutes;
  document.getElementById("secondValue").textContent = String(
    modalSeconds,
  ).padStart(2, "0");
  document.getElementById("durationPreview").textContent =
    `${modalMinutes}:${String(modalSeconds).padStart(2, "0")}`;
}
const plusSets = document.getElementById("plusSets");
if (plusSets) {
  plusSets.onclick = () => {
    modalSets++;
    updateModalUI();
  };
}
const minusSets = document.getElementById("minusSets");
if (minusSets) {
  minusSets.onclick = () => {
    if (modalSets > 1) {
      modalSets--;
      updateModalUI();
    }
  };
}
const plusReps = document.getElementById("plusReps");
if (plusReps) {
  plusReps.onclick = () => {
    modalReps++;
    updateModalUI();
  };
}
const minusReps = document.getElementById("minusReps");
if (minusReps) {
  minusReps.onclick = () => {
    if (modalReps > 1) {
      modalReps--;
      updateModalUI();
    }
  };
}
const plusMin = document.getElementById("plusMin");
if (plusMin) {
  plusMin.onclick = () => {
    if (modalMinutes < 59) {
      modalMinutes++;
      updateModalUI();
    }
  };
}
const minusMin = document.getElementById("minusMin");
if (minusMin) {
  minusMin.onclick = () => {
    if (modalMinutes > 0) {
      modalMinutes--;
      updateModalUI();
    }
  };
}
const plusSec = document.getElementById("plusSec");
if (plusSec) {
  plusSec.onclick = () => {
    modalSeconds += 5;
    if (modalSeconds >= 60) {
      modalSeconds = 0;
      if (modalMinutes < 59) {
        modalMinutes++;
      }
    }
    updateModalUI();
  };
}
const minusSec = document.getElementById("minusSec");
if (minusSec) {
  minusSec.onclick = () => {
    modalSeconds -= 5;
    if (modalSeconds < 0) {
      if (modalMinutes > 0) {
        modalMinutes--;
        modalSeconds = 55;
      } else {
        modalSeconds = 0;
      }
    }
    updateModalUI();
  };
}
// ======================================
// RESTORE SAVED WORKOUT
// ======================================
// const savedExercises = sessionStorage.getItem("selectedExercises");
// if (savedExercises) {
//   selectedExercises = JSON.parse(savedExercises);
// }
const savedExercises = sessionStorage.getItem("selectedExercises");
if (savedExercises) {
  selectedExercises = JSON.parse(savedExercises);
}
// ======================================
// PACE
// ======================================
let pace = 1000;
const paceSelect = document.getElementById("paceSelect");
if (paceSelect) {
  paceSelect.addEventListener("change", () => {
    pace = Number(paceSelect.value);
  });
}
// ======================================
// EXERCISE LIBRARY
// ======================================
const exerciseLibrary = [
  {
    id: 1,
    name: "Push ups",
    voice: "Pushups",
    type: "counter",
    svg: "assets/pushup.png",
  },
  {
    id: 2,
    name: "Squats",
    type: "counter",
    svg: "assets/squat.png",
  },
  {
    id: 3,
    name: "Jumping Jacks",
    type: "counter",
    svg: "assets/jumping-jack.png",
  },
  {
    id: 4,
    name: "Crunches",
    type: "counter",
    svg: "assets/crunch.png",
  },
  {
    id: 5,
    name: "Pull ups",
    voice: "Pullups",
    type: "counter",
    svg: "assets/pullup.png",
  },
  {
    id: 6,
    name: "Plank",
    type: "timer",
    svg: "assets/plank.png",
  },
];
// ======================================
// DOM
// ======================================
const exerciseContainer = document.getElementById("exerciseContainer");
const selectedList = document.getElementById("selectedExercises");
const searchInput = document.getElementById("searchExercise");
const startWorkoutBtn = document.getElementById("startWorkout");
const builderSection = document.querySelector(".workout-container");
const workoutScreen = document.getElementById("workoutScreen");
const summaryScreen = document.getElementById("summary");
// ======================================
// INIT
// ======================================
if (exerciseContainer) {
  renderExercises(exerciseLibrary);
}
if (selectedList) {
  renderSelected();
}
// ======================================
// SEARCH
// ======================================
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const value = e.target.value.toLowerCase();
    renderExercises(
      exerciseLibrary.filter((ex) => ex.name.toLowerCase().includes(value)),
    );
  });
}
// ======================================
// RENDER EXERCISES
// ======================================
function renderExercises(list) {
  if (!exerciseContainer) return;
  exerciseContainer.innerHTML = "";
  list.forEach((ex) => {
    const card = document.createElement("div");
    card.className = "exercise-card";
    card.innerHTML = `
      <img src="${ex.svg}">
      <h3>${ex.name}</h3>
      <button onclick="openSettings(${ex.id})">
        Add
      </button>
    `;
    exerciseContainer.appendChild(card);
  });
}
// ======================================
// SELECTED LIST
// ======================================
function renderSelected() {
  if (!selectedList) return;
  selectedList.innerHTML = "";
  if (selectedExercises.length === 0) {
    selectedList.innerHTML = "<li>No exercises selected</li>";
    return;
  }
  selectedExercises.forEach((ex, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <strong>${ex.name}</strong>
        <small>
          ${ex.sets} Sets
          ${
            ex.type === "counter"
              ? " • " + ex.reps + " Reps"
              : " • " + ex.duration + " sec"
          }
        </small>
      </div>
      <button onclick="removeExercise(${index})">
        ✕
      </button>
    `;
    selectedList.appendChild(li);
  });
}
// ======================================
// ADD EXERCISE
// ======================================
function addExercise(ex) {
  selectedExercises.push(ex);
  sessionStorage.setItem(
    "selectedExercises",
    JSON.stringify(selectedExercises),
  );
  renderSelected();
}
// ======================================
// REMOVE EXERCISE
// ======================================
function removeExercise(index) {
  selectedExercises.splice(index, 1);
  sessionStorage.setItem(
    "selectedExercises",
    JSON.stringify(selectedExercises),
  );
  renderSelected();
}
// ======================================
// SETTINGS MODAL
// ======================================
function openSettings(id) {
  selectedExerciseForConfig = exerciseLibrary.find((e) => e.id === id);
  if (!selectedExerciseForConfig) return;
  modalSets = selectedExerciseForConfig.sets || 3;
  modalReps = selectedExerciseForConfig.reps || 10;
  const duration = selectedExerciseForConfig.duration || 30;
  modalMinutes = Math.floor(duration / 60);
  modalSeconds = duration % 60;
  document.getElementById("modalRest").value =
    selectedExerciseForConfig.rest || 30;
  if (selectedExerciseForConfig.type === "timer") {
    document.getElementById("repLabel").style.display = "none";
    document.getElementById("durationLabel").style.display = "block";
  } else {
    document.getElementById("repLabel").style.display = "block";
    document.getElementById("durationLabel").style.display = "none";
  }
  updateModalUI();
  document.getElementById("exerciseModal").classList.remove("hidden");
}
// ======================================
// SAVE EXERCISE
// ======================================
const saveExerciseBtn = document.getElementById("saveExerciseBtn");
if (saveExerciseBtn) {
  saveExerciseBtn.onclick = () => {
    if (!selectedExerciseForConfig) return;
    const rest = Number(document.getElementById("modalRest").value);
    addExercise({
      ...selectedExerciseForConfig,
      voice: selectedExerciseForConfig.voice || selectedExerciseForConfig.name,
      sets: modalSets,
      reps: selectedExerciseForConfig.type === "counter" ? modalReps : 0,
      duration:
        selectedExerciseForConfig.type === "timer"
          ? modalMinutes * 60 + modalSeconds
          : 0,
      rest,
    });
    document.getElementById("exerciseModal").classList.add("hidden");
  };
}
// ======================================
// CLOSE MODAL
// ======================================
const closeModalBtn = document.getElementById("closeModalBtn");
if (closeModalBtn) {
  closeModalBtn.onclick = () => {
    document.getElementById("exerciseModal").classList.add("hidden");
  };
}
// ======================================
// START WORKOUT
// ======================================
if (startWorkoutBtn) {
  startWorkoutBtn.onclick = () => {
    if (selectedExercises.length === 0) {
      showToast("Add exercises first");
      return;
    }
    workoutQueue = [...selectedExercises];
    exerciseIndex = 0;
    currentSet = 1;
    workoutStartTime = Date.now();
    builderSection.style.display = "none";
    summaryScreen.style.display = "none";
    workoutScreen.style.display = "block";
    currentWorkout = workoutQueue[0];
    document.getElementById("currentExercise").innerText = currentWorkout.name;
    document.getElementById("exerciseImage").src = currentWorkout.svg;
    document.getElementById("currentSet").innerText =
      `Exercise 1 of ${workoutQueue.length}
• Set 1/${currentWorkout.sets}`;
  };
}
// ======================================
// START CURRENT WORKOUT
// ======================================
const startCurrentWorkoutBtn = document.getElementById("startCurrentWorkout");
if (startCurrentWorkoutBtn) {
  startCurrentWorkoutBtn.onclick = () => {
    startCurrentWorkoutBtn.style.display = "none";
    loadExercise();
  };
}
// ======================================
// CANCEL START
// ======================================
const cancelStartWorkoutBtn = document.getElementById("cancelStartWorkout");
const startWorkoutModal = document.getElementById("startWorkoutModal");
if (cancelStartWorkoutBtn && startWorkoutModal) {
  cancelStartWorkoutBtn.onclick = () => {
    startWorkoutModal.classList.add("hidden");
  };
}
// ======================================
// LOAD EXERCISE
// ======================================
function loadExercise() {
  if (exerciseIndex >= workoutQueue.length) {
    finishWorkout();
    return;
  }
  currentWorkout = workoutQueue[exerciseIndex];
  currentSet = 1;
  document.getElementById("currentExercise").innerText = currentWorkout.name;
  document.getElementById("exerciseImage").src = currentWorkout.svg;
  updateProgress();
  startSet();
}
// ======================================
// START SET
// ======================================
function startSet() {
  clearInterval(autoInterval);
  clearInterval(timerInterval);
  isPaused = false;
  document.getElementById("currentExercise").innerText = currentWorkout.name;
  document.getElementById("exerciseImage").src = currentWorkout.svg;
  document.getElementById("currentSet").innerText =
    `Exercise ${exerciseIndex + 1} / ${workoutQueue.length}
• Set ${currentSet} / ${currentWorkout.sets}`;
  document.getElementById("restTimer").innerText = currentWorkout.rest + " sec";
  const counter = document.getElementById("counterSection");
  const timer = document.getElementById("timerSection");
  if (currentWorkout.type === "counter") {
    counter.style.display = "block";
    timer.style.display = "none";
    document.getElementById("counterValue").innerText = "0";
    speak("Start " + (currentWorkout.voice || currentWorkout.name), () => {
      startCounter();
    });
  } else {
    counter.style.display = "none";
    timer.style.display = "block";
    document.getElementById("timer").innerText = currentWorkout.duration;
    speak("Set " + currentSet);
    startTimer();
  }
}
// ======================================
// PROGRESS BAR
// ======================================
function updateProgress() {
  const total = workoutQueue.length;
  const percent = (exerciseIndex / total) * 100;
  document.getElementById("progressBar").style.width = percent + "%";
}
// ======================================
// AUTO COUNTER
// ======================================
function startCounter() {
  let rep = 0;
  const target = currentWorkout.reps;
  autoInterval = setInterval(() => {
    if (isPaused) return;
    rep++;
    completedReps++;
    completedCalories += 0.4;
    document.getElementById("counterValue").innerText = rep;
    speak(rep.toString());
    if (rep >= target) {
      clearInterval(autoInterval);
      speak("Done", () => {
        advanceSet();
      });
    }
  }, pace);
}
// ======================================
// TIMER EXERCISE
// ======================================
function startTimer() {
  let time = currentWorkout.duration;
  document.getElementById("timer").innerText = time;
  timerInterval = setInterval(() => {
    if (isPaused) return;
    time--;
    document.getElementById("timer").innerText = time;
    if (time > 0 && time <= 5) {
      speak(String(time));
    }
    if (time <= 0) {
      clearInterval(timerInterval);
      completedCalories += currentWorkout.duration * 0.15;
      speak("Done");
      setTimeout(() => {
        advanceSet();
      }, 500);
    }
  }, 1000);
} // ======================================
// ADVANCE SET / EXERCISE
// ======================================
function advanceSet() {
  clearInterval(autoInterval);
  clearInterval(timerInterval);
  // More sets remaining
  if (currentSet < currentWorkout.sets) {
    currentSet++;
    showRest(currentWorkout.rest, () => {
      startSet();
    });
    return;
  }
  // Exercise finished
  exerciseIndex++;
  // Workout finished
  if (exerciseIndex >= workoutQueue.length) {
    finishWorkout();
    return;
  }
  // Rest before next exercise
  showRest(currentWorkout.rest, () => {
    loadExercise();
  });
}
// ======================================
// REST MODAL
// ======================================
function showRest(seconds, callback) {
  const modal = document.getElementById("restModal");
  const countdown = document.getElementById("restCountdown");
  const title = document.getElementById("restTitle");
  const image = document.getElementById("nextExerciseImage");
  const name = document.getElementById("nextExerciseName");
  const info = document.getElementById("nextExerciseInfo");
  pendingAction = callback;
  // ==================================
  // REST BETWEEN SETS
  // ==================================
  if (currentSet <= currentWorkout.sets) {
    title.innerText = "✔ Set Completed";
    image.src = currentWorkout.svg;
    name.innerText = currentWorkout.name;
    info.innerText = `Next Set ${currentSet} of ${currentWorkout.sets}
• Rest ${currentWorkout.rest} sec`;
  } else {
    // ==================================
    // REST BETWEEN EXERCISES
    // ==================================
    const next = workoutQueue[exerciseIndex];
    title.innerText = "✔ Exercise Completed";
    image.src = next.svg;
    name.innerText = next.name;
    if (next.type === "counter") {
      info.innerText = `${next.sets} Sets • ${next.reps} Reps`;
    } else {
      info.innerText = `${next.sets} Sets • ${next.duration} sec`;
    }
  }
  modal.classList.remove("hidden");
  let left = seconds;
  countdown.innerText = left;
  clearInterval(restInterval);
  restInterval = setInterval(() => {
    if (isPaused) return;
    left--;
    countdown.innerText = left;
    if (left <= 0) {
      clearInterval(restInterval);
      modal.classList.add("hidden");
      if (pendingAction) {
        pendingAction();
        pendingAction = null;
      }
    }
  }, 1000);
  document.getElementById("skipRest").onclick = () => {
    clearInterval(restInterval);
    modal.classList.add("hidden");
    if (pendingAction) {
      pendingAction();
      pendingAction = null;
    }
  };
}
// ======================================
// PAUSE / RESUME
// ======================================
const pauseWorkoutBtn = document.getElementById("pauseWorkout");
if (pauseWorkoutBtn) {
  pauseWorkoutBtn.onclick = () => {
    isPaused = !isPaused;
    pauseWorkoutBtn.innerText = isPaused ? "Resume" : "Pause";
  };
}
// ======================================
// NEXT EXERCISE
// ======================================
const nextExerciseBtn = document.getElementById("nextExercise");
if (nextExerciseBtn) {
  nextExerciseBtn.onclick = () => {
    clearInterval(autoInterval);
    clearInterval(timerInterval);
    exerciseIndex++;
    loadExercise();
  };
}
// ======================================
// FINISH BUTTON
// ======================================
const finishWorkoutBtn = document.getElementById("finishWorkout");
if (finishWorkoutBtn) {
  finishWorkoutBtn.onclick = finishWorkout;
}
// ======================================
// FINISH WORKOUT
// ======================================
function finishWorkout() {
  clearInterval(autoInterval);
  clearInterval(timerInterval);
  clearInterval(restInterval);
  speak("Workout Complete. Great Job!");
  const workoutTime = Math.max(
    1,
    Math.round((Date.now() - workoutStartTime) / 60000),
  );
  const calories = Math.round(completedCalories);
  // ============================
  // SAVE HISTORY
  // ============================
  let history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
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
  let todayEntry = history.find((h) => h.date === today);
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
      },
    };
    history.push(todayEntry);
  }
  todayEntry.time = currentTime;
  todayEntry.workout.reps += completedReps;
  todayEntry.workout.calories += calories;
  todayEntry.workout.time += workoutTime;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
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
  stats.workouts++;
  stats.reps += completedReps;
  stats.calories += calories;
  stats.time += workoutTime;
  console.log("completedReps =", completedReps);
  console.log("calories =", calories);
  console.log("workoutTime =", workoutTime);
  console.log("stats before save =", stats);
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  // ============================
  // UPDATE HOME CARDS
  // ============================
  if (typeof updateHomeStats === "function") {
    updateHomeStats();
  }
  // ============================
  // SHOW SUMMARY
  // ============================
  workoutScreen.style.display = "none";
  summaryScreen.style.display = "block";
  const progressBar = document.getElementById("progressBar");
  if (progressBar) progressBar.style.width = "100%";
  const completedExercisesEl = document.getElementById("completedExercises");
  const completedRepsEl = document.getElementById("completedReps");
  const totalTimeEl = document.getElementById("totalTime");
  if (completedExercisesEl)
    completedExercisesEl.innerText = selectedExercises.length;
  if (completedRepsEl) completedRepsEl.innerText = completedReps;
  if (totalTimeEl) totalTimeEl.innerText = workoutTime + " min";
  // ============================
  // RESET WORKOUT
  // ============================
  const startBtn = document.getElementById("startCurrentWorkout");
  if (startBtn) {
    startBtn.style.display = "inline-block";
  }
  // Save records first
  updateWorkoutStreak();
  updateWorkoutRecords(completedReps, calories, workoutTime);
  if (typeof updateHomeRecords === "function") {
    updateHomeRecords();
  }
  // Now reset
  selectedExercises = [];
  sessionStorage.removeItem("selectedExercises");
  workoutQueue = [];
  exerciseIndex = 0;
  currentSet = 1;
  completedReps = 0;
  completedCalories = 0;
}
if (typeof updateHomeAchievementCard === "function") {
  updateHomeAchievementCard();
}

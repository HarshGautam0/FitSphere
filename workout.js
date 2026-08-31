// ======================================
// FITSPHERE - WORKOUT.JS
// ======================================
// Workout Builder + Workout Execution
// Background/Lock-Screen Safe Timing
// ======================================

// ======================================
// GLOBAL VARIABLES
// ======================================

const STATS_KEY = "gymStats";
const HISTORY_KEY = "gymHistory";
const ACTIVE_WORKOUT_KEY = "fitsphereActiveWorkout";

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

// ======================================
// BACKGROUND-SAFE PHASE STATE
// ======================================

// Current active phase:
// "counter" = automatic rep counter
// "timer"   = timed exercise such as plank
// "rest"    = rest countdown
// null      = nothing active

let activePhase = null;

let phaseStartTime = 0;
let phaseElapsedBeforePause = 0;

let restDuration = 0;
let restStartTime = 0;
let restElapsedBeforePause = 0;

// ======================================
// MODAL VALUES
// ======================================

let modalSets = 3;
let modalReps = 10;
let modalMinutes = 0;
let modalSeconds = 30;

// ======================================
// SAFE DOM HELPER
// ======================================

function getWorkoutElement(id) {
  return document.getElementById(id);
}

// ======================================
// MODAL UI
// ======================================

function updateModalUI() {
  const setsValue = getWorkoutElement("setsValue");
  const repsValue = getWorkoutElement("repsValue");
  const minuteValue = getWorkoutElement("minuteValue");
  const secondValue = getWorkoutElement("secondValue");
  const durationPreview = getWorkoutElement("durationPreview");

  if (setsValue) {
    setsValue.textContent = modalSets;
  }

  if (repsValue) {
    repsValue.textContent = modalReps;
  }

  if (minuteValue) {
    minuteValue.textContent = modalMinutes;
  }

  if (secondValue) {
    secondValue.textContent = String(modalSeconds).padStart(2, "0");
  }

  if (durationPreview) {
    durationPreview.textContent = `${modalMinutes}:${String(modalSeconds).padStart(2, "0")}`;
  }
}

// ======================================
// MODAL CONTROLS
// ======================================

const plusSets = getWorkoutElement("plusSets");

if (plusSets) {
  plusSets.onclick = () => {
    modalSets++;
    updateModalUI();
  };
}

const minusSets = getWorkoutElement("minusSets");

if (minusSets) {
  minusSets.onclick = () => {
    if (modalSets > 1) {
      modalSets--;
      updateModalUI();
    }
  };
}

const plusReps = getWorkoutElement("plusReps");

if (plusReps) {
  plusReps.onclick = () => {
    modalReps++;
    updateModalUI();
  };
}

const minusReps = getWorkoutElement("minusReps");

if (minusReps) {
  minusReps.onclick = () => {
    if (modalReps > 1) {
      modalReps--;
      updateModalUI();
    }
  };
}

const plusMin = getWorkoutElement("plusMin");

if (plusMin) {
  plusMin.onclick = () => {
    if (modalMinutes < 59) {
      modalMinutes++;
      updateModalUI();
    }
  };
}

const minusMin = getWorkoutElement("minusMin");

if (minusMin) {
  minusMin.onclick = () => {
    if (modalMinutes > 0) {
      modalMinutes--;
      updateModalUI();
    }
  };
}

const plusSec = getWorkoutElement("plusSec");

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

const minusSec = getWorkoutElement("minusSec");

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

const savedExercises = sessionStorage.getItem("selectedExercises");

if (savedExercises) {
  try {
    selectedExercises = JSON.parse(savedExercises);
  } catch (error) {
    console.error("Failed to restore selected exercises:", error);

    selectedExercises = [];
  }
}

// ======================================
// PACE
// ======================================

let pace = 1000;

const paceSelect = getWorkoutElement("paceSelect");

if (paceSelect) {
  pace = Number(paceSelect.value) || 1000;

  paceSelect.addEventListener("change", () => {
    pace = Number(paceSelect.value) || 1000;
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

const exerciseContainer = getWorkoutElement("exerciseContainer");

const selectedList = getWorkoutElement("selectedExercises");

const searchInput = getWorkoutElement("searchExercise");

const startWorkoutBtn = getWorkoutElement("startWorkout");

const builderSection = document.querySelector(".workout-container");

const workoutScreen = getWorkoutElement("workoutScreen");

const summaryScreen = getWorkoutElement("summary");

// ======================================
// INIT
// ======================================

if (exerciseContainer) {
  renderExercises(exerciseLibrary);
}

if (selectedList) {
  renderSelected();
}

updateModalUI();

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
// RENDER SELECTED EXERCISES
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
// ADD / UPDATE EXERCISE
// ======================================

function addExercise(ex) {
  const existingIndex = selectedExercises.findIndex(
    (item) => item.id === ex.id,
  );

  if (existingIndex !== -1) {
    selectedExercises[existingIndex] = ex;
  } else {
    selectedExercises.push(ex);
  }

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
  const libraryExercise = exerciseLibrary.find((e) => e.id === id);

  if (!libraryExercise) return;

  // IMPORTANT:
  // If exercise already exists, load its saved values.
  // Otherwise use defaults.

  const savedExercise = selectedExercises.find(
    (exercise) => exercise.id === id,
  );

  selectedExerciseForConfig = savedExercise || libraryExercise;

  modalSets = selectedExerciseForConfig.sets || 3;

  modalReps = selectedExerciseForConfig.reps || 10;

  const duration = selectedExerciseForConfig.duration || 30;

  modalMinutes = Math.floor(duration / 60);

  modalSeconds = duration % 60;

  const modalRest = getWorkoutElement("modalRest");

  if (modalRest) {
    modalRest.value = selectedExerciseForConfig.rest || 30;
  }

  const repLabel = getWorkoutElement("repLabel");

  const durationLabel = getWorkoutElement("durationLabel");

  if (selectedExerciseForConfig.type === "timer") {
    if (repLabel) {
      repLabel.style.display = "none";
    }

    if (durationLabel) {
      durationLabel.style.display = "block";
    }
  } else {
    if (repLabel) {
      repLabel.style.display = "block";
    }

    if (durationLabel) {
      durationLabel.style.display = "none";
    }
  }

  updateModalUI();

  const modal = getWorkoutElement("exerciseModal");

  if (modal) {
    modal.classList.remove("hidden");
  }
}

// ======================================
// SAVE EXERCISE
// ======================================

const saveExerciseBtn = getWorkoutElement("saveExerciseBtn");

if (saveExerciseBtn) {
  saveExerciseBtn.onclick = () => {
    if (!selectedExerciseForConfig) return;

    const modalRest = getWorkoutElement("modalRest");

    const rest = Number(modalRest?.value) || 30;

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

    const modal = getWorkoutElement("exerciseModal");

    if (modal) {
      modal.classList.add("hidden");
    }
  };
}

// ======================================
// CLOSE MODAL
// ======================================

const closeModalBtn = getWorkoutElement("closeModalBtn");

if (closeModalBtn) {
  closeModalBtn.onclick = () => {
    const modal = getWorkoutElement("exerciseModal");

    if (modal) {
      modal.classList.add("hidden");
    }
  };
}

// ======================================
// SAVE ACTIVE WORKOUT STATE
// ======================================

function saveActiveWorkoutState() {
  if (!currentWorkout || workoutQueue.length === 0) {
    return;
  }

  const state = {
    workoutQueue,
    exerciseIndex,
    currentSet,

    workoutStartTime,

    completedReps,
    completedCalories,

    isPaused,

    activePhase,

    phaseStartTime,
    phaseElapsedBeforePause,

    restDuration,
    restStartTime,
    restElapsedBeforePause,

    savedAt: Date.now(),
  };

  localStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify(state));
}

// ======================================
// CLEAR ACTIVE WORKOUT STATE
// ======================================

function clearActiveWorkoutState() {
  localStorage.removeItem(ACTIVE_WORKOUT_KEY);
}

// ======================================
// START WORKOUT
// ======================================

if (startWorkoutBtn) {
  startWorkoutBtn.onclick = () => {
    if (selectedExercises.length === 0) {
      if (typeof showToast === "function") {
        showToast("Add exercises first");
      }

      return;
    }

    workoutQueue = [...selectedExercises];

    exerciseIndex = 0;
    currentSet = 1;

    completedReps = 0;
    completedCalories = 0;

    workoutStartTime = Date.now();

    activePhase = null;

    isPaused = false;

    saveActiveWorkoutState();

    if (builderSection) {
      builderSection.style.display = "none";
    }

    if (summaryScreen) {
      summaryScreen.style.display = "none";
    }

    if (workoutScreen) {
      workoutScreen.style.display = "block";
    }

    currentWorkout = workoutQueue[0];

    const currentExercise = getWorkoutElement("currentExercise");

    const exerciseImage = getWorkoutElement("exerciseImage");

    const currentSetEl = getWorkoutElement("currentSet");

    if (currentExercise) {
      currentExercise.innerText = currentWorkout.name;
    }

    if (exerciseImage) {
      exerciseImage.src = currentWorkout.svg;
    }

    if (currentSetEl) {
      currentSetEl.innerText = `Exercise 1 of ${workoutQueue.length}
• Set 1/${currentWorkout.sets}`;
    }
  };
}

// ======================================
// START CURRENT WORKOUT
// ======================================

const startCurrentWorkoutBtn = getWorkoutElement("startCurrentWorkout");

if (startCurrentWorkoutBtn) {
  startCurrentWorkoutBtn.onclick = () => {
    startCurrentWorkoutBtn.style.display = "none";

    loadExercise();
  };
}

// ======================================
// CANCEL START
// ======================================

const cancelStartWorkoutBtn = getWorkoutElement("cancelStartWorkout");

const startWorkoutModal = getWorkoutElement("startWorkoutModal");

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

  const currentExercise = getWorkoutElement("currentExercise");

  const exerciseImage = getWorkoutElement("exerciseImage");

  if (currentExercise) {
    currentExercise.innerText = currentWorkout.name;
  }

  if (exerciseImage) {
    exerciseImage.src = currentWorkout.svg;
  }

  updateProgress();

  saveActiveWorkoutState();

  startSet();
}

// ======================================
// START SET
// ======================================

function startSet() {
  clearInterval(autoInterval);
  clearInterval(timerInterval);

  isPaused = false;

  activePhase = null;

  phaseStartTime = 0;
  phaseElapsedBeforePause = 0;

  const currentExercise = getWorkoutElement("currentExercise");

  const exerciseImage = getWorkoutElement("exerciseImage");

  const currentSetEl = getWorkoutElement("currentSet");

  const restTimer = getWorkoutElement("restTimer");

  if (currentExercise) {
    currentExercise.innerText = currentWorkout.name;
  }

  if (exerciseImage) {
    exerciseImage.src = currentWorkout.svg;
  }

  if (currentSetEl) {
    currentSetEl.innerText = `Exercise ${exerciseIndex + 1} / ${workoutQueue.length}
• Set ${currentSet} / ${currentWorkout.sets}`;
  }

  if (restTimer) {
    restTimer.innerText = currentWorkout.rest + " sec";
  }

  const counter = getWorkoutElement("counterSection");

  const timer = getWorkoutElement("timerSection");

  if (currentWorkout.type === "counter") {
    if (counter) {
      counter.style.display = "block";
    }

    if (timer) {
      timer.style.display = "none";
    }

    const counterValue = getWorkoutElement("counterValue");

    if (counterValue) {
      counterValue.innerText = "0";
    }

    speak("Start " + (currentWorkout.voice || currentWorkout.name), () => {
      startCounter();
    });
  } else {
    if (counter) {
      counter.style.display = "none";
    }

    if (timer) {
      timer.style.display = "block";
    }

    const timerEl = getWorkoutElement("timer");

    if (timerEl) {
      timerEl.innerText = currentWorkout.duration;
    }

    speak("Set " + currentSet);

    startTimer();
  }

  saveActiveWorkoutState();
}

// ======================================
// PROGRESS BAR
// ======================================

function updateProgress() {
  const total = workoutQueue.length;

  if (total <= 0) return;

  const percent = (exerciseIndex / total) * 100;

  const progressBar = getWorkoutElement("progressBar");

  if (progressBar) {
    progressBar.style.width = percent + "%";
  }
}

// ======================================
// AUTO COUNTER
// ======================================

function startCounter() {
  clearInterval(autoInterval);

  activePhase = "counter";

  phaseStartTime = Date.now();

  phaseElapsedBeforePause = 0;

  let rep = 0;

  const target = Number(currentWorkout.reps) || 0;

  if (target <= 0) {
    advanceSet();
    return;
  }

  function updateCounter() {
    if (isPaused) return;

    const elapsed = Date.now() - phaseStartTime;

    const totalElapsed = phaseElapsedBeforePause + elapsed;

    const calculatedRep = Math.min(target, Math.floor(totalElapsed / pace));

    if (calculatedRep > rep) {
      const newReps = calculatedRep - rep;

      rep = calculatedRep;

      completedReps += newReps;

      completedCalories += newReps * 0.4;

      const counterValue = getWorkoutElement("counterValue");

      if (counterValue) {
        counterValue.innerText = rep;
      }

      if (rep <= target) {
        speak(rep.toString());
      }
    }

    if (rep >= target) {
      clearInterval(autoInterval);

      activePhase = null;

      phaseStartTime = 0;

      phaseElapsedBeforePause = 0;

      saveActiveWorkoutState();

      speak("Done", () => {
        advanceSet();
      });
    }
  }

  // Immediate update
  updateCounter();

  // UI update while page is active
  autoInterval = setInterval(updateCounter, 100);
}

// ======================================
// TIMER EXERCISE
// ======================================

function startTimer() {
  clearInterval(timerInterval);

  activePhase = "timer";

  phaseStartTime = Date.now();

  phaseElapsedBeforePause = 0;

  const duration = Number(currentWorkout.duration) || 0;

  const timerEl = getWorkoutElement("timer");

  if (timerEl) {
    timerEl.innerText = duration;
  }

  function updateTimer() {
    if (isPaused) return;

    const elapsed = Math.floor(
      (phaseElapsedBeforePause + Date.now() - phaseStartTime) / 1000,
    );

    const remaining = Math.max(0, duration - elapsed);

    if (timerEl) {
      timerEl.innerText = remaining;
    }

    if (remaining > 0 && remaining <= 5) {
      const previousSecond = Number(timerEl?.dataset?.spokenSecond || 0);

      if (previousSecond !== remaining) {
        if (timerEl) {
          timerEl.dataset.spokenSecond = remaining;
        }

        speak(String(remaining));
      }
    }

    if (remaining <= 0) {
      clearInterval(timerInterval);

      activePhase = null;

      phaseStartTime = 0;

      phaseElapsedBeforePause = 0;

      completedCalories += duration * 0.15;

      saveActiveWorkoutState();

      speak("Done");

      setTimeout(() => {
        advanceSet();
      }, 500);
    }
  }

  updateTimer();

  timerInterval = setInterval(updateTimer, 250);
}

// ======================================
// ADVANCE SET / EXERCISE
// ======================================

function advanceSet() {
  clearInterval(autoInterval);
  clearInterval(timerInterval);
  clearInterval(restInterval);

  activePhase = null;

  phaseStartTime = 0;
  phaseElapsedBeforePause = 0;

  // ==================================
  // MORE SETS REMAINING
  // ==================================

  if (currentSet < currentWorkout.sets) {
    currentSet++;

    showRest(
      currentWorkout.rest,
      () => {
        startSet();
      },
      "set",
    );

    return;
  }

  // ==================================
  // CURRENT EXERCISE COMPLETED
  // ==================================

  exerciseIndex++;

  // ==================================
  // ENTIRE WORKOUT COMPLETED
  // ==================================

  if (exerciseIndex >= workoutQueue.length) {
    finishWorkout();
    return;
  }

  // ==================================
  // NEXT EXERCISE
  // ==================================

  showRest(
    currentWorkout.rest,
    () => {
      loadExercise();
    },
    "exercise",
  );
}

// ======================================
// REST MODAL
// ======================================

function showRest(seconds, callback, restType) {
  const modal = getWorkoutElement("restModal");

  const countdown = getWorkoutElement("restCountdown");

  const title = getWorkoutElement("restTitle");

  const image = getWorkoutElement("nextExerciseImage");

  const name = getWorkoutElement("nextExerciseName");

  const info = getWorkoutElement("nextExerciseInfo");

  pendingAction = callback;

  restDuration = Math.max(0, Number(seconds) || 0);

  restStartTime = Date.now();

  restElapsedBeforePause = 0;

  activePhase = "rest";

  // ==================================
  // REST BETWEEN SETS
  // ==================================

  if (restType === "set") {
    if (title) {
      title.innerText = "✔ Set Completed";
    }

    if (image) {
      image.src = currentWorkout.svg;
    }

    if (name) {
      name.innerText = currentWorkout.name;
    }

    if (info) {
      info.innerText =
        `Next Set ${currentSet} of ${currentWorkout.sets}\n` +
        `• Rest ${currentWorkout.rest} sec`;
    }
  }

  // ==================================
  // REST BEFORE NEXT EXERCISE
  // ==================================
  else if (restType === "exercise") {
    const next = workoutQueue[exerciseIndex];

    if (title) {
      title.innerText = "✔ Exercise Completed";
    }

    if (image) {
      image.src = next.svg;
    }

    if (name) {
      name.innerText = next.name;
    }

    if (info) {
      if (next.type === "counter") {
        info.innerText =
          `Next Exercise\n` +
          `${next.sets} Sets • ${next.reps} Reps\n` +
          `• Rest ${currentWorkout.rest} sec`;
      } else {
        info.innerText =
          `Next Exercise\n` +
          `${next.sets} Sets • ${next.duration} sec\n` +
          `• Rest ${currentWorkout.rest} sec`;
      }
    }

    speak("Next exercise " + (next.voice || next.name));
  }

  // ==================================
  // SHOW MODAL
  // ==================================

  if (modal) {
    modal.classList.remove("hidden");
  }

  function updateRest() {
    if (isPaused) return;

    const elapsed = Math.floor(
      (restElapsedBeforePause + Date.now() - restStartTime) / 1000,
    );

    const left = Math.max(0, restDuration - elapsed);

    if (countdown) {
      countdown.innerText = left;
    }

    if (left <= 0) {
      clearInterval(restInterval);

      activePhase = null;

      if (modal) {
        modal.classList.add("hidden");
      }

      const action = pendingAction;

      pendingAction = null;

      saveActiveWorkoutState();

      if (action) {
        action();
      }
    }
  }

  updateRest();

  restInterval = setInterval(updateRest, 250);

  // ==================================
  // SKIP REST
  // ==================================

  const skipRest = getWorkoutElement("skipRest");

  if (skipRest) {
    skipRest.onclick = () => {
      clearInterval(restInterval);

      activePhase = null;

      if (modal) {
        modal.classList.add("hidden");
      }

      const action = pendingAction;

      pendingAction = null;

      saveActiveWorkoutState();

      if (action) {
        action();
      }
    };
  }

  saveActiveWorkoutState();
}

// ======================================
// PAUSE / RESUME
// ======================================

const pauseWorkoutBtn = getWorkoutElement("pauseWorkout");

if (pauseWorkoutBtn) {
  pauseWorkoutBtn.onclick = () => {
    if (!currentWorkout) return;

    if (!isPaused) {
      // ==============================
      // PAUSE
      // ==============================

      const now = Date.now();

      if (activePhase === "counter") {
        phaseElapsedBeforePause += now - phaseStartTime;
      }

      if (activePhase === "timer") {
        phaseElapsedBeforePause += now - phaseStartTime;
      }

      if (activePhase === "rest") {
        restElapsedBeforePause += now - restStartTime;
      }

      isPaused = true;

      clearInterval(autoInterval);
      clearInterval(timerInterval);
      clearInterval(restInterval);

      pauseWorkoutBtn.innerText = "Resume";

      saveActiveWorkoutState();
    } else {
      // ==============================
      // RESUME
      // ==============================

      isPaused = false;

      if (activePhase === "counter") {
        phaseStartTime = Date.now();

        startCounter();
      } else if (activePhase === "timer") {
        phaseStartTime = Date.now();

        startTimer();
      } else if (activePhase === "rest") {
        restStartTime = Date.now();

        resumeRestTimer();
      }

      pauseWorkoutBtn.innerText = "Pause";

      saveActiveWorkoutState();
    }
  };
}

// ======================================
// RESUME REST TIMER
// ======================================

function resumeRestTimer() {
  clearInterval(restInterval);

  const modal = getWorkoutElement("restModal");

  const countdown = getWorkoutElement("restCountdown");

  function updateRest() {
    if (isPaused) return;

    const elapsed = Math.floor(
      (restElapsedBeforePause + Date.now() - restStartTime) / 1000,
    );

    const left = Math.max(0, restDuration - elapsed);

    if (countdown) {
      countdown.innerText = left;
    }

    if (left <= 0) {
      clearInterval(restInterval);

      activePhase = null;

      if (modal) {
        modal.classList.add("hidden");
      }

      const action = pendingAction;

      pendingAction = null;

      saveActiveWorkoutState();

      if (action) {
        action();
      }
    }
  }

  updateRest();

  restInterval = setInterval(updateRest, 250);
}

// ======================================
// NEXT EXERCISE
// ======================================

const nextExerciseBtn = getWorkoutElement("nextExercise");

if (nextExerciseBtn) {
  nextExerciseBtn.onclick = () => {
    clearInterval(autoInterval);
    clearInterval(timerInterval);
    clearInterval(restInterval);

    activePhase = null;

    exerciseIndex++;

    if (exerciseIndex >= workoutQueue.length) {
      finishWorkout();
      return;
    }

    loadExercise();
  };
}

// ======================================
// FINISH BUTTON
// ======================================

const finishWorkoutBtn = getWorkoutElement("finishWorkout");

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

  activePhase = null;

  isPaused = false;

  clearActiveWorkoutState();

  speak("Workout Complete. Great Job!");

  const workoutTime = Math.max(
    1,
    Math.round((Date.now() - workoutStartTime) / 60000),
  );

  const calories = Math.round(completedCalories);

  // ==================================
  // SAVE HISTORY
  // ==================================

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

  if (!todayEntry.workout) {
    todayEntry.workout = {
      reps: 0,
      calories: 0,
      time: 0,
    };
  }

  todayEntry.workout.reps += completedReps;

  todayEntry.workout.calories += calories;

  todayEntry.workout.time += workoutTime;

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

  // ==================================
  // UPDATE GLOBAL STATS
  // ==================================

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

  localStorage.setItem(STATS_KEY, JSON.stringify(stats));

  // ==================================
  // UPDATE HOME CARDS
  // ==================================

  if (typeof updateHomeStats === "function") {
    updateHomeStats();
  }

  // ==================================
  // SHOW SUMMARY
  // ==================================

  if (workoutScreen) {
    workoutScreen.style.display = "none";
  }

  if (summaryScreen) {
    summaryScreen.style.display = "block";
  }

  const progressBar = getWorkoutElement("progressBar");

  if (progressBar) {
    progressBar.style.width = "100%";
  }

  const completedExercisesEl = getWorkoutElement("completedExercises");

  const completedRepsEl = getWorkoutElement("completedReps");

  const totalTimeEl = getWorkoutElement("totalTime");

  if (completedExercisesEl) {
    completedExercisesEl.innerText = selectedExercises.length;
  }

  if (completedRepsEl) {
    completedRepsEl.innerText = completedReps;
  }

  if (totalTimeEl) {
    totalTimeEl.innerText = workoutTime + " min";
  }

  // ==================================
  // RESET START BUTTON
  // ==================================

  const startBtn = getWorkoutElement("startCurrentWorkout");

  if (startBtn) {
    startBtn.style.display = "inline-block";
  }

  // ==================================
  // SAVE RECORDS
  // ==================================

  if (typeof updateWorkoutStreak === "function") {
    updateWorkoutStreak();
  }

  if (typeof updateWorkoutRecords === "function") {
    updateWorkoutRecords(completedReps, calories, workoutTime);
  }

  if (typeof updateHomeRecords === "function") {
    updateHomeRecords();
  }

  // ==================================
  // RESET WORKOUT
  // ==================================

  selectedExercises = [];

  sessionStorage.removeItem("selectedExercises");

  workoutQueue = [];

  exerciseIndex = 0;
  currentSet = 1;

  currentWorkout = null;

  workoutStartTime = 0;

  completedReps = 0;
  completedCalories = 0;

  activePhase = null;
  phaseStartTime = 0;
  phaseElapsedBeforePause = 0;

  restDuration = 0;
  restStartTime = 0;
  restElapsedBeforePause = 0;

  pendingAction = null;

  renderSelected();
}

// ======================================
// PAGE VISIBILITY HANDLING
// ======================================
//
// Android can suspend JavaScript when
// the PWA is locked/backgrounded.
//
// The timers themselves are timestamp based,
// so when the page becomes active again,
// the displayed time is recalculated from
// Date.now().
//
// ======================================

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    refreshWorkoutAfterBackground();
  } else {
    saveActiveWorkoutState();
  }
});

// ======================================
// PAGE SHOW
// ======================================

window.addEventListener("pageshow", () => {
  refreshWorkoutAfterBackground();
});

// ======================================
// REFRESH AFTER BACKGROUND
// ======================================

function refreshWorkoutAfterBackground() {
  if (!currentWorkout) {
    return;
  }

  if (isPaused) {
    return;
  }

  // Timer exercise
  if (activePhase === "timer") {
    updateTimerAfterBackground();
  }

  // Rest
  else if (activePhase === "rest") {
    updateRestAfterBackground();
  }

  // Counter
  else if (activePhase === "counter") {
    updateCounterAfterBackground();
  }
}

// ======================================
// BACKGROUND TIMER REFRESH
// ======================================

function updateTimerAfterBackground() {
  const timerEl = getWorkoutElement("timer");

  if (!timerEl || !currentWorkout) {
    return;
  }

  const duration = Number(currentWorkout.duration) || 0;

  const elapsed = Math.floor(
    (phaseElapsedBeforePause + Date.now() - phaseStartTime) / 1000,
  );

  const remaining = Math.max(0, duration - elapsed);

  timerEl.innerText = remaining;

  if (remaining <= 0) {
    clearInterval(timerInterval);

    activePhase = null;

    completedCalories += duration * 0.15;

    saveActiveWorkoutState();

    speak("Done");

    setTimeout(() => {
      advanceSet();
    }, 100);
  }
}

// ======================================
// BACKGROUND REST REFRESH
// ======================================

function updateRestAfterBackground() {
  const countdown = getWorkoutElement("restCountdown");

  const modal = getWorkoutElement("restModal");

  const elapsed = Math.floor(
    (restElapsedBeforePause + Date.now() - restStartTime) / 1000,
  );

  const left = Math.max(0, restDuration - elapsed);

  if (countdown) {
    countdown.innerText = left;
  }

  if (left <= 0) {
    clearInterval(restInterval);

    activePhase = null;

    if (modal) {
      modal.classList.add("hidden");
    }

    const action = pendingAction;

    pendingAction = null;

    if (action) {
      action();
    }
  }
}

// ======================================
// BACKGROUND COUNTER REFRESH
// ======================================

function updateCounterAfterBackground() {
  if (!currentWorkout) {
    return;
  }

  const target = Number(currentWorkout.reps) || 0;

  if (target <= 0) {
    return;
  }

  const elapsed = Date.now() - phaseStartTime;

  const totalElapsed = phaseElapsedBeforePause + elapsed;

  const calculatedRep = Math.min(target, Math.floor(totalElapsed / pace));

  const counterValue = getWorkoutElement("counterValue");

  if (counterValue) {
    counterValue.innerText = calculatedRep;
  }

  if (calculatedRep >= target) {
    clearInterval(autoInterval);

    activePhase = null;

    saveActiveWorkoutState();

    // Avoid adding all reps again here.
    // The active counter interval normally
    // catches up when the page resumes.
  }
}

// ======================================
// ACHIEVEMENT CARD UPDATE
// ======================================

if (typeof updateHomeAchievementCard === "function") {
  updateHomeAchievementCard();
}

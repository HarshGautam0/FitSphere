const RECORD_KEY = "fitnessRecords";
function getRecords() {
  return (
    JSON.parse(localStorage.getItem(RECORD_KEY)) || {
      workout: {
        maxReps: 0,
        longestWorkout: 0,
        mostCalories: 0,
      },
      running: {
        longestDistance: 0,
        fastestSpeed: 0,
        bestPace: null,
        longestRun: 0,
      },
    }
  );
}
function saveRecords(records) {
  localStorage.setItem(RECORD_KEY, JSON.stringify(records));
}
/* ==========================
      WORKOUT RECORDS
========================== */
function updateWorkoutRecords(reps, calories, minutes) {
  const records = getRecords();
  if (reps > records.workout.maxReps) records.workout.maxReps = reps;
  if (calories > records.workout.mostCalories)
    records.workout.mostCalories = calories;
  if (minutes > records.workout.longestWorkout)
    records.workout.longestWorkout = minutes;
  saveRecords(records);
}
/* ==========================
      RUNNING RECORDS
========================== */
function updateRunningRecords(distance, speed, pace, minutes) {
  const records = getRecords();
  if (distance > records.running.longestDistance)
    records.running.longestDistance = distance;
  if (speed > records.running.fastestSpeed)
    records.running.fastestSpeed = speed;
  if (records.running.bestPace === null || pace < records.running.bestPace) {
    records.running.bestPace = pace;
  }
  if (minutes > records.running.longestRun)
    records.running.longestRun = minutes;
  saveRecords(records);
}
/* ==========================
      HOME PAGE
========================== */
function updateHomeRecords() {
  const records = getRecords();
  const reps = document.getElementById("bestWorkoutReps");
  const run = document.getElementById("longestRun");
  const pace = document.getElementById("fastestPace");
  if (reps) {
    reps.innerText = records.workout.maxReps + " reps";
  }
  if (run) {
    run.innerText = records.running.longestDistance.toFixed(2) + " km";
  }
  if (pace) {
    if (records.running.bestPace == null) {
      pace.innerText = "--";
    } else {
      const min = Math.floor(records.running.bestPace);
      const sec = Math.round((records.running.bestPace - min) * 60);
      pace.innerText = `${min}:${String(sec).padStart(2, "0")} /km`;
    }
  }
}
document.addEventListener("DOMContentLoaded", () => {
  updateHomeRecords();
});

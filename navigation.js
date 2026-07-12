const page = window.location.pathname.split("/").pop();

const navMap = {
  "index.html": "navHome",
  "workout.html": "navWorkout",
  "running.html": "navRunning",
  "history.html": "navHistory",
  "profile.html": "navProfile",
};

const active = document.getElementById(navMap[page]);

if (active) {
  active.classList.add("active");
}

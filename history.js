const HISTORY_KEY = "gymHistory";
const historyList = document.getElementById("historyList");
const emptyState = document.getElementById("emptyState");
const clearBtn = document.getElementById("clearHistoryBtn");
/* ================================
        LOAD HISTORY
================================ */
function loadHistory() {
  return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
}
/* ================================
        SAVE HISTORY
================================ */
function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}
/* ================================
        DELETE SINGLE DAY
================================ */
function deleteHistory(index) {
  let history = loadHistory();
  history.splice(index, 1);
  saveHistory(history);
  renderHistory();
}
/* ================================
        CLEAR HISTORY
================================ */
const deleteHistoryModal = document.getElementById("deleteHistoryModal");
if (clearBtn) {
  clearBtn.onclick = () => {
    deleteHistoryModal.classList.remove("hidden");
  };
}
document.getElementById("cancelDeleteHistory").onclick = () => {
  deleteHistoryModal.classList.add("hidden");
};
document.getElementById("confirmDeleteHistory").onclick = () => {
  localStorage.removeItem(HISTORY_KEY);
  // If you also clear stats, uncomment this
  // localStorage.removeItem(STATS_KEY);
  deleteHistoryModal.classList.add("hidden");
  renderHistory();
  if (typeof showToast === "function") {
    showToast("History cleared successfully 🗑");
  }
};
/* ================================
        RENDER HISTORY
================================ */
function renderHistory() {
  const history = loadHistory();
  historyList.innerHTML = "";
  if (history.length === 0) {
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";
  history
    .slice()
    .reverse()
    .forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "history-card";
      let html = `
        <div class="history-top">
            <h2>📅 ${item.date}</h2>
            <span>${item.time || ""}</span>
        </div>
        <div class="history-body">
      `;
      /* Workout section */
      if (
        item.workout &&
        (item.workout.reps > 0 ||
          item.workout.calories > 0 ||
          item.workout.time > 0)
      ) {
        html += `
          <div class="history-section">
              <h3>💪 Workout</h3>
              <p><strong>Reps:</strong> ${item.workout.reps}</p>
              <p><strong>Calories:</strong> ${item.workout.calories} kcal</p>
              <p><strong>Time:</strong> ${item.workout.time} min</p>
          </div>
        `;
      }
      /* Running section */
      if (
        item.running &&
        (item.running.distance > 0 ||
          item.running.calories > 0 ||
          item.running.time > 0)
      ) {
        html += `
          <div class="history-section">
              <h3>🏃 Running</h3>
              <p><strong>Distance:</strong> ${item.running.distance.toFixed(2)} km</p>
              <p><strong>Speeds:</strong>
${
  item.running.speeds && item.running.speeds.length
    ? item.running.speeds.map((s) => s + " km/h").join(", ")
    : "-"
}
</p>
              <p><strong>Calories:</strong> ${item.running.calories} kcal</p>
              <p><strong>Time:</strong> ${item.running.time} min</p>
          </div>
        `;
      }
      html += `
        </div>
        <button class="delete-entry" onclick="deleteHistory(${history.length - 1 - index})">
            🗑 Delete Day
        </button>
      `;
      card.innerHTML = html;
      historyList.appendChild(card);
    });
}
renderHistory();

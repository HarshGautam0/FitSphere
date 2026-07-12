/* ==========================================
        RENDER
========================================== */
function renderAchievements(category, id) {
  const container = document.getElementById(id);
  if (!container) return;
  container.innerHTML = "";
  achievements
    .filter((a) => a.category === category)
    .forEach((a) => {
      const card = document.createElement("div");
      card.className =
        "achievement-card " + (a.unlocked ? "unlocked" : "locked");
      card.innerHTML = `
                <div class="badge-icon">
                    ${a.icon}
                </div>
                <h3>${a.title}</h3>
                <p>${a.description}</p>
            `;
      card.onclick = () => showAchievement(a);
      container.appendChild(card);
    });
}
/* ==========================================
        POPUP
========================================== */
function showAchievement(a) {
  showToast(
    `${a.icon} ${a.title}
${a.description}
Status : ${a.unlocked ? "Unlocked ✅" : "Locked 🔒"}`,
  );
}
/* ==========================================
        PROGRESS
========================================== */
function updateProgress() {
  const unlocked = achievements.filter((a) => a.unlocked).length;
  document.getElementById("unlockedCount").innerText = unlocked;
  document.getElementById("totalAchievements").innerText = achievements.length;
  document.getElementById("overallProgress").style.width =
    (unlocked / achievements.length) * 100 + "%";
}
/* ==========================================
        INIT
========================================== */
renderAchievements("beginner", "beginnerAchievements");
renderAchievements("workout", "workoutAchievements");
renderAchievements("running", "runningAchievements");
renderAchievements("streak", "streakAchievements");
updateProgress();

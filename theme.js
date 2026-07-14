const themeBtn = document.getElementById("themeToggle");
const root = document.documentElement;
// Load saved theme
const savedTheme = localStorage.getItem("fitness-theme") || "light";
if (savedTheme === "dark") {
  root.classList.add("dark");
} else {
  root.classList.remove("dark");
}
updateIcon();
// Toggle theme
themeBtn?.addEventListener("click", () => {
  root.classList.toggle("dark");
  localStorage.setItem(
    "fitness-theme",
    root.classList.contains("dark") ? "dark" : "light",
  );
  updateIcon();
});
function updateIcon() {
  if (!themeBtn) return;
  themeBtn.textContent = root.classList.contains("dark") ? "☀️" : "🌙";
}

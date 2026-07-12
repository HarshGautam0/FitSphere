/* ======================================
        DAILY MOTIVATION
====================================== */

const quotes = [
  "Success starts with self discipline.",

  "The only bad workout is the one you didn't do.",

  "Push yourself because nobody else will.",

  "Small progress is still progress.",

  "Consistency beats motivation.",

  "Your body can stand almost anything. It's your mind you have to convince.",

  "Train insane or remain the same.",

  "Discipline creates freedom.",

  "Wake up with determination. Go to bed with satisfaction.",

  "Every workout counts.",

  "Don't limit your challenges. Challenge your limits.",

  "Sweat today. Smile tomorrow.",

  "Make yourself proud.",

  "Fitness is not a destination. It is a lifestyle.",

  "Strong today. Stronger tomorrow.",
];

/* -----------------------------
   Show quote
----------------------------- */

function loadDailyQuote() {
  const quoteBox = document.getElementById("dailyQuote");

  if (!quoteBox) return;

  const today = new Date();

  const day =
    today.getFullYear() * 1000 + today.getMonth() * 50 + today.getDate();

  quoteBox.innerText = quotes[day % quotes.length];
}

document.addEventListener("DOMContentLoaded", loadDailyQuote);

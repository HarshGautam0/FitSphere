let voiceEnabled = true;
function speak(text, callback) {
  if (!voiceEnabled) {
    if (callback) callback();
    return;
  }
  // make absolutely sure we have a normal string
  text = String(text);
  // pronunciation fixes
  const fixes = {
    Pushups: "Pushups",
    Pushup: "Pushups",
    "Start Pushup": "Start Pushups",
    "Pull-ups": "Pull ups",
    Pullup: "Pull up",
    "Jumping Jacks": "Jumping Jacks",
    Crunches: "Crunches",
    Squats: "Squats",
    Plank: "Plank",
  };
  if (fixes[text]) {
    text = fixes[text];
  }
  speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.rate = 1;
  msg.pitch = 1;
  msg.volume = 1;
  const voices = speechSynthesis.getVoices();
  msg.voice =
    voices.find(
      (v) => v.name === "Microsoft David - English (United States)",
    ) ||
    voices.find((v) => v.name === "Google US English") ||
    voices[0];
  msg.onend = () => {
    if (callback) callback();
  };
  speechSynthesis.speak(msg);
}

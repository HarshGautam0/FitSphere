let voiceEnabled = true;
function speak(text) {
  if (!voiceEnabled) return;
  speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.rate = 1;
  msg.pitch = 1;
  msg.volume = 1;
  speechSynthesis.speak(msg);
}

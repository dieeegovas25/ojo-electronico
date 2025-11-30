export const speakText = (text: string, onEnd?: () => void) => {
  if (!('speechSynthesis' in window)) {
    console.warn("Web Speech API not supported");
    if (onEnd) onEnd();
    return;
  }

  // Cancel any currently playing audio
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES'; // Force Spanish
  utterance.rate = 1.1; // Slightly faster is often preferred by frequent screen reader users
  utterance.pitch = 1.0;

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    console.error("TTS Error:", e);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
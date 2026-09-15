/**
 * Kids Learning Adventure — Mascot "Buddy"
 * Interactive animated companion who encourages, guides, and celebrates with children.
 */

window.Buddy = (function () {
  'use strict';

  let mascotEl = null;
  let bubbleEl = null;
  let bubbleTimeout = null;

  function init() {
    mascotEl = document.getElementById('mascot-buddy');
    bubbleEl = document.getElementById('mascot-bubble');
  }

  // Set visual mood/animation class
  function setMood(mood) {
    if (!mascotEl) mascotEl = document.getElementById('mascot-buddy');
    if (!mascotEl) return;

    mascotEl.classList.remove('mood-happy', 'mood-jump', 'mood-wave', 'mood-think', 'mood-encourage');
    mascotEl.classList.add(`mood-${mood}`);

    if (mood === 'jump') {
      setTimeout(() => {
        if (mascotEl) mascotEl.classList.remove('mood-jump');
      }, 900);
    }
  }

  // Display speech bubble and speak aloud
  function say(text, autoSpeak = true, duration = 4000) {
    if (!bubbleEl) bubbleEl = document.getElementById('mascot-bubble');
    if (!mascotEl) mascotEl = document.getElementById('mascot-buddy');

    if (bubbleEl) {
      bubbleEl.textContent = text;
      bubbleEl.classList.add('visible');

      if (bubbleTimeout) clearTimeout(bubbleTimeout);
      if (duration > 0) {
        bubbleTimeout = setTimeout(() => {
          bubbleEl.classList.remove('visible');
        }, duration);
      }
    }

    setMood('wave');
    if (autoSpeak && window.AudioSystem) {
      window.AudioSystem.speak(text);
    }
  }

  function celebrate(customMessage) {
    const messages = [
      'Awesome job! You did it! 🎉',
      'Superstar! You are so smart! ⭐',
      'Wonderful! High five! ✋',
      'Hooray! Fantastic! 🎈',
      'Great work! You are rocking! 🚀'
    ];
    const msg = customMessage || messages[Math.floor(Math.random() * messages.length)];
    setMood('jump');
    say(msg, true, 3500);
  }

  function tryAgain(customMessage) {
    const messages = [
      "Almost! Let's try again! 😊",
      "Good try! Give it another shot! 🌟",
      "You can do it! Try one more time! 💪",
      "Keep going! You are doing great! ✨"
    ];
    const msg = customMessage || messages[Math.floor(Math.random() * messages.length)];
    setMood('encourage');
    say(msg, true, 3000);
  }

  function greet() {
    setMood('wave');
    say("Hi! I'm Buddy! Let's learn and play together! 🌈", true, 4500);
  }

  return {
    init,
    setMood,
    say,
    celebrate,
    tryAgain,
    greet
  };
})();

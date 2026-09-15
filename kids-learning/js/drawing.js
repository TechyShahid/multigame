/**
 * Kids Learning Adventure — Canvas Drawing & Letter Tracing Engine
 * Responsive pointer-based drawing with guide checkpoints, rainbow brush,
 * stroke coverage detection, and 3-letter word assembly animation.
 */

window.DrawingEngine = (function () {
  'use strict';

  let currentCanvasId = 'draw-letter-canvas';
  let canvas = null;
  let ctx = null;
  let isDrawing = false;
  let currentColor = '#FF4D6D';
  let brushSize = 24;
  let isRainbow = false;
  let rainbowHue = 0;
  let strokesHistory = [];
  let currentStroke = [];

  // Active target
  let currentTargetType = 'letter'; // 'letter' or 'word'
  let currentTargetLetter = 'A';
  let currentTargetWord = 'CAT';
  let currentWordLetterIndex = 0;

  // Guide checkpoints for coverage scoring
  let guidePoints = [];
  let hitPoints = new Set();
  let hasCompletedCurrent = false;

  // Stroke guide animation
  let guideAnimFrame = null;
  let guideAnimStep = 0;

  function setCanvas(canvasId) {
    currentCanvasId = canvasId;
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    setupCanvasSizing();
    setupEvents();
  }

  function setupCanvasSizing() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(300, rect.width || 600);
    const height = Math.max(200, rect.height || 420);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  function setupEvents() {
    if (!canvas) return;
    canvas.style.touchAction = 'none';

    // Remove any previous handlers if re-attaching
    canvas.onpointerdown = handlePointerDown;
    canvas.onpointermove = handlePointerMove;
    canvas.onpointerup = handlePointerUp;
    canvas.onpointercancel = handlePointerUp;
  }

  function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function handlePointerDown(e) {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    isDrawing = true;

    const coords = getCanvasCoords(e);
    const strokeColor = isRainbow ? `hsl(${rainbowHue}, 90%, 55%)` : currentColor;

    currentStroke = [{
      x: coords.x,
      y: coords.y,
      color: strokeColor,
      size: brushSize
    }];

    checkCheckpointHit(coords.x, coords.y);
    drawStrokeSegment(coords.x, coords.y, coords.x, coords.y, strokeColor, brushSize);
  }

  function handlePointerMove(e) {
    if (!isDrawing) return;
    e.preventDefault();

    const coords = getCanvasCoords(e);
    if (currentStroke.length > 0) {
      const lastPoint = currentStroke[currentStroke.length - 1];

      if (isRainbow) {
        rainbowHue = (rainbowHue + 4) % 360;
      }
      const strokeColor = isRainbow ? `hsl(${rainbowHue}, 90%, 55%)` : currentColor;

      currentStroke.push({
        x: coords.x,
        y: coords.y,
        color: strokeColor,
        size: brushSize
      });

      drawStrokeSegment(lastPoint.x, lastPoint.y, coords.x, coords.y, strokeColor, brushSize);
      checkCheckpointHit(coords.x, coords.y);
    }
  }

  function handlePointerUp(e) {
    if (!isDrawing) return;
    isDrawing = false;

    if (currentStroke.length > 0) {
      strokesHistory.push([...currentStroke]);
      currentStroke = [];
    }

    evaluateTracingProgress();
  }

  function drawStrokeSegment(x1, y1, x2, y2, color, size) {
    if (!ctx) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function drawGuideBackground(textToDraw) {
    if (!ctx || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    ctx.save();

    // 1. Draw preschool handwriting guidelines (top, dashed mid, baseline)
    const midY = h / 2 + 10;
    const lineSpacing = Math.min(w * 0.22, h * 0.28);
    const topY = midY - lineSpacing;
    const bottomY = midY + lineSpacing;

    // Top guide line
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, topY);
    ctx.lineTo(w - 20, topY);
    ctx.stroke();

    // Midline (dashed)
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(20, midY);
    ctx.lineTo(w - 20, midY);
    ctx.stroke();

    // Bottom guideline
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(20, bottomY);
    ctx.lineTo(w - 20, bottomY);
    ctx.stroke();

    // 2. Draw bold, kid-friendly letter outline
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const fontSize = textToDraw.length > 1 ? Math.min(w * 0.28, 140) : Math.min(w * 0.52, h * 0.65);
    ctx.font = `900 ${fontSize}px "Fredoka", "Quicksand", sans-serif`;

    const cx = w / 2;
    const cy = midY;

    // Inner pleasant soft tint fill
    ctx.fillStyle = 'rgba(224, 231, 255, 0.55)';
    ctx.fillText(textToDraw, cx, cy);

    // High contrast dotted outline
    ctx.strokeStyle = 'rgba(79, 70, 229, 0.75)';
    ctx.lineWidth = 14;
    ctx.setLineDash([12, 14]);
    ctx.strokeText(textToDraw, cx, cy);

    ctx.restore();
  }

  function generateGuideCheckpoints(textToDraw) {
    guidePoints = [];
    hitPoints.clear();
    hasCompletedCurrent = false;

    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);

    const offCanvas = document.createElement('canvas');
    offCanvas.width = w;
    offCanvas.height = h;
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });

    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    const fontSize = textToDraw.length > 1 ? Math.min(w * 0.28, 140) : Math.min(w * 0.55, h * 0.65);
    offCtx.font = `900 ${fontSize}px "Fredoka", "Quicksand", sans-serif`;

    const cx = w / 2;
    const cy = h / 2 + 10;

    offCtx.fillStyle = '#000000';
    offCtx.fillText(textToDraw, cx, cy);

    try {
      const imgData = offCtx.getImageData(0, 0, w, h).data;
      const step = Math.max(18, Math.floor(w / 28));

      for (let y = 20; y < h - 20; y += step) {
        for (let x = 20; x < w - 20; x += step) {
          const alpha = imgData[(y * w + x) * 4 + 3];
          if (alpha > 120) {
            guidePoints.push({ x, y });
          }
        }
      }
    } catch (e) {
      console.warn('Checkpoints fallback:', e);
      guidePoints = [
        { x: cx, y: cy - 60 },
        { x: cx, y: cy },
        { x: cx, y: cy + 60 }
      ];
    }
  }

  function checkCheckpointHit(x, y) {
    const radius = brushSize * 1.35;
    for (let i = 0; i < guidePoints.length; i++) {
      if (!hitPoints.has(i)) {
        const pt = guidePoints[i];
        const dist = Math.hypot(pt.x - x, pt.y - y);
        if (dist <= radius) {
          hitPoints.add(i);
        }
      }
    }
    updateProgressIndicator();
  }

  function updateProgressIndicator() {
    const progressId = currentTargetType === 'letter' ? 'draw-progress-fill' : 'draw-words-progress-fill';
    const progressEl = document.getElementById(progressId);
    if (!progressEl || guidePoints.length === 0) return;
    const percent = Math.min(100, Math.round((hitPoints.size / guidePoints.length) * 100));
    progressEl.style.width = `${percent}%`;
  }

  function evaluateTracingProgress() {
    if (hasCompletedCurrent || guidePoints.length === 0) return;

    const currentLetter = (currentTargetType === 'letter'
      ? currentTargetLetter
      : (currentTargetWord && currentTargetWord[currentWordLetterIndex]) || ''
    ).toUpperCase();

    // Multi-stroke letters that require at least 2 distinct strokes to be legitimately complete
    // (e.g. 'X' needs both diagonal lines, 'T' needs bar and stem, 'F' needs stem and bars, etc.)
    const multiStrokeLetters = ['X', 'H', 'F', 'T', 'E', 'K', 'A'];
    const minStrokesNeeded = multiStrokeLetters.includes(currentLetter) ? 2 : 1;

    const coverage = (hitPoints.size / guidePoints.length) * 100;

    // Must reach at least 70% total letter coverage,
    // AND multi-stroke letters must have at least 2 strokes (unless coverage >= 88% from one continuous stroke)
    const hasEnoughStrokes = strokesHistory.length >= minStrokesNeeded || coverage >= 88;

    if (coverage >= 70 && hasEnoughStrokes) {
      hasCompletedCurrent = true;
      triggerSuccessCelebration();
    }
  }

  function triggerSuccessCelebration() {
    if (window.AudioSystem) {
      window.AudioSystem.playCorrect();
      setTimeout(() => window.AudioSystem.playStar(), 300);
    }

    if (currentTargetType === 'letter') {
      const msg = `Wonderful! You traced the letter ${currentTargetLetter}! ⭐⭐⭐`;
      if (window.Buddy) window.Buddy.celebrate(msg);
      if (window.RewardSystem) {
        window.RewardSystem.addStars(3);
        window.RewardSystem.recordProgress('super_writer');
        window.RewardSystem.recordProgress('abc_explorer');
      }
      showTracingCompleteModal(`Letter ${currentTargetLetter}!`, '3 Stars Earned!');
    } else if (currentTargetType === 'word') {
      currentWordLetterIndex++;
      const wordObj = window.GameData.threeLetterWords.find(w => w.word === currentTargetWord);

      if (currentWordLetterIndex < wordObj.letters.length) {
        const nextLetter = wordObj.letters[currentWordLetterIndex];
        if (window.AudioSystem) {
          window.AudioSystem.speak(`Great! Now trace ${nextLetter}!`);
        }
        setTimeout(() => {
          loadWordLetter(currentTargetWord, currentWordLetterIndex);
        }, 1200);
      } else {
        assembleTracedWord(wordObj);
      }
    }
  }

  function assembleTracedWord(wordObj) {
    if (window.AudioSystem) {
      window.AudioSystem.playCelebration();
      window.AudioSystem.speak(wordObj.phonics);
    }
    if (window.Buddy) {
      window.Buddy.celebrate(`Fantastic! ${wordObj.letters.join(' - ')} makes ${wordObj.word}!`);
    }
    if (window.RewardSystem) {
      window.RewardSystem.addStars(5);
      window.RewardSystem.recordProgress('super_writer');
    }

    const assemblyModal = document.getElementById('modal-word-assembly');
    if (assemblyModal) {
      const lettersContainer = document.getElementById('assembly-letters');
      const resultContainer = document.getElementById('assembly-result');
      const emojiContainer = document.getElementById('assembly-emoji');

      if (emojiContainer) emojiContainer.textContent = wordObj.emoji;
      if (lettersContainer) {
        lettersContainer.innerHTML = wordObj.letters
          .map((ltr, i) => `<span class="bounce-letter" style="animation-delay:${i * 0.25}s">${ltr}</span>`)
          .join('<span class="assembly-plus">+</span>');
      }
      if (resultContainer) {
        resultContainer.textContent = wordObj.word;
      }

      assemblyModal.classList.add('visible');
      if (window.App && window.App.launchConfetti) {
        window.App.launchConfetti();
      }
    }
  }

  function showTracingCompleteModal(title, subtitle) {
    const modal = document.getElementById('modal-tracing-success');
    if (!modal) return;
    const titleEl = document.getElementById('tracing-modal-title');
    const subEl = document.getElementById('tracing-modal-sub');
    if (titleEl) titleEl.textContent = title;
    if (subEl) subEl.textContent = subtitle;
    modal.classList.add('visible');

    if (window.App && window.App.launchConfetti) {
      window.App.launchConfetti();
    }
  }

  function redrawAll() {
    if (!ctx) return;
    const textToDraw = currentTargetType === 'letter' ? currentTargetLetter : currentTargetWord[currentWordLetterIndex];
    drawGuideBackground(textToDraw);

    strokesHistory.forEach(stroke => {
      for (let i = 1; i < stroke.length; i++) {
        drawStrokeSegment(
          stroke[i - 1].x, stroke[i - 1].y,
          stroke[i].x, stroke[i].y,
          stroke[i].color, stroke[i].size
        );
      }
    });

    if (currentStroke.length > 1) {
      for (let i = 1; i < currentStroke.length; i++) {
        drawStrokeSegment(
          currentStroke[i - 1].x, currentStroke[i - 1].y,
          currentStroke[i].x, currentStroke[i].y,
          currentStroke[i].color, currentStroke[i].size
        );
      }
    }
  }

  function loadLetter(letter) {
    setCanvas('draw-letter-canvas');
    currentTargetType = 'letter';
    currentTargetLetter = letter;
    strokesHistory = [];
    currentStroke = [];
    hasCompletedCurrent = false;

    setupCanvasSizing();
    generateGuideCheckpoints(letter);
    drawGuideBackground(letter);
    updateProgressIndicator();

    if (window.AudioSystem) {
      window.AudioSystem.speak(`Trace the letter ${letter}`);
    }
    startGuideHandAnimation('tracing-guide-hand');
  }

  function loadWord(word) {
    setCanvas('draw-words-canvas');
    currentTargetType = 'word';
    currentTargetWord = word;
    currentWordLetterIndex = 0;
    loadWordLetter(word, 0);
  }

  function loadWordLetter(word, index) {
    setCanvas('draw-words-canvas');
    currentTargetType = 'word';
    currentTargetWord = word;
    currentWordLetterIndex = index;
    strokesHistory = [];
    currentStroke = [];
    hasCompletedCurrent = false;

    const letter = word[index];
    setupCanvasSizing();
    generateGuideCheckpoints(letter);
    drawGuideBackground(letter);
    updateProgressIndicator();

    const wordObj = window.GameData.threeLetterWords.find(w => w.word === word);
    const subTitle = document.getElementById('draw-word-indicator');
    if (subTitle && wordObj) {
      subTitle.innerHTML = wordObj.letters.map((l, i) => {
        const cls = i === index ? 'active-letter' : (i < index ? 'completed-letter' : '');
        return `<button class="word-step-pill ${cls}" data-letter-idx="${i}" title="Trace ${l}">${l}</button>`;
      }).join('');

      subTitle.querySelectorAll('.word-step-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          const ltrIdx = parseInt(pill.getAttribute('data-letter-idx'), 10);
          if (!isNaN(ltrIdx)) {
            loadWordLetter(currentTargetWord, ltrIdx);
          }
        });
      });
    }

    if (window.AudioSystem) {
      window.AudioSystem.speak(`Trace ${letter} for ${word}`);
    }
    startGuideHandAnimation('words-guide-hand');
  }

  function advanceWordLetter() {
    if (currentTargetType !== 'word') return;
    const wordObj = window.GameData.threeLetterWords.find(w => w.word === currentTargetWord);
    if (!wordObj) return;

    if (currentWordLetterIndex + 1 < wordObj.letters.length) {
      if (window.AudioSystem) window.AudioSystem.playCorrect();
      loadWordLetter(currentTargetWord, currentWordLetterIndex + 1);
    } else {
      assembleTracedWord(wordObj);
    }
  }

  function startGuideHandAnimation(handId) {
    const hand = document.getElementById(handId);
    if (!hand || !canvas) return;

    if (guideAnimFrame) cancelAnimationFrame(guideAnimFrame);
    if (guidePoints.length < 2) {
      hand.style.display = 'none';
      return;
    }

    hand.style.display = 'block';
    guideAnimStep = 0;

    function anim() {
      if (hasCompletedCurrent || isDrawing) {
        hand.style.opacity = '0';
      } else {
        hand.style.opacity = '0.9';
        guideAnimStep = (guideAnimStep + 0.012) % 1;
        const ptIdx = Math.floor(guideAnimStep * (guidePoints.length - 1));
        const pt = guidePoints[ptIdx] || guidePoints[0];
        hand.style.transform = `translate(${pt.x}px, ${pt.y}px)`;
      }
      guideAnimFrame = requestAnimationFrame(anim);
    }
    anim();
  }

  function clearCanvas() {
    strokesHistory = [];
    currentStroke = [];
    hitPoints.clear();
    hasCompletedCurrent = false;
    redrawAll();
    updateProgressIndicator();
    if (window.AudioSystem) window.AudioSystem.playClick();
  }

  function undoLastStroke() {
    if (strokesHistory.length > 0) {
      strokesHistory.pop();
      hitPoints.clear();
      strokesHistory.forEach(stroke => {
        stroke.forEach(pt => checkCheckpointHit(pt.x, pt.y));
      });
      redrawAll();
      updateProgressIndicator();
      if (window.AudioSystem) window.AudioSystem.playClick();
    }
  }

  function setColor(color) {
    if (color === 'rainbow') {
      isRainbow = true;
    } else {
      isRainbow = false;
      currentColor = color;
    }
    if (window.AudioSystem) window.AudioSystem.playClick();
  }

  function setSize(size) {
    brushSize = size;
  }

  // Window resize handler
  window.addEventListener('resize', () => {
    if (canvas) {
      setupCanvasSizing();
      redrawAll();
    }
  });

  return {
    setCanvas,
    loadLetter,
    loadWord,
    loadWordLetter,
    advanceWordLetter,
    clearCanvas,
    undoLastStroke,
    setColor,
    setSize,
    get currentTargetLetter() { return currentTargetLetter; },
    get currentTargetWord() { return currentTargetWord; },
    get currentWordLetterIndex() { return currentWordLetterIndex; }
  };
})();

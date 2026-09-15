import { LKG_QUESTIONS } from './questions-lkg.js';
import { CLASS1_QUESTIONS } from './questions-class1.js';

const recentQuestionIds = new Set();
const MAX_RECENT_TRACK = 40;

function trackRecent(id) {
  recentQuestionIds.add(id);
  if (recentQuestionIds.size > MAX_RECENT_TRACK) {
    const first = recentQuestionIds.values().next().value;
    if (first) recentQuestionIds.delete(first);
  }
}

export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateDynamicQuestion(grade, preferredCategory) {
  const isLkg = grade === 'lkg';
  const categories = isLkg
    ? ['counting', 'addition', 'subtraction', 'numbers', 'shapes', 'patterns']
    : ['numbers', 'addition', 'subtraction', 'multiplication', 'shapes', 'patterns', 'money', 'time', 'coding'];

  const category = preferredCategory || categories[Math.floor(Math.random() * categories.length)];
  const qId = `dyn-${grade}-${category}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  if (category === 'addition') {
    const emojiList = ['🍎', '🍓', '🎈', '⭐', '🐱', '🍬', '🚗', '🌸', '🐥', '🧁'];
    const emoji = emojiList[Math.floor(Math.random() * emojiList.length)];
    const maxVal = isLkg ? 4 : 12;
    const a = Math.floor(Math.random() * maxVal) + 1;
    const b = Math.floor(Math.random() * maxVal) + 1;
    const sum = a + b;

    const optA = String(sum);
    const optB = String(sum + 1);
    const optC = String(Math.max(1, sum - 1));
    const optD = String(sum + 2);
    const rawOptions = isLkg ? [optA, optB, optC] : [optA, optB, optC, optD];
    const uniqueOptions = Array.from(new Set(rawOptions));
    while (uniqueOptions.length < (isLkg ? 3 : 4)) {
      uniqueOptions.push(String(sum + uniqueOptions.length + 2));
    }

    return {
      id: qId,
      grade,
      category: 'addition',
      questionType: isLkg ? 'picture-addition' : 'multiple-choice',
      difficulty: sum <= 6 ? 'easy' : sum <= 12 ? 'medium' : 'hard',
      questionText: isLkg ? `${emoji.repeat(a)} + ${emoji.repeat(b)} = ?` : `What is ${a} + ${b}?`,
      narrationText: `${a} plus ${b} equals how many?`,
      visualData: {
        type: 'emojis',
        items: isLkg ? [emoji.repeat(a), '+', emoji.repeat(b)] : [String(a), '+', String(b)],
        countA: a,
        countB: b,
        emojiA: emoji,
      },
      options: shuffleArray(uniqueOptions),
      correctAnswer: optA,
      explanation: `${a} plus ${b} equals ${sum}! Fabulous math work! 🌟`,
      hint: `Start at ${a} and count forward ${b} more!`,
      points: 10,
    };
  }

  if (category === 'subtraction') {
    const emojiList = ['🐟', '🧁', '🍎', '🎈', '🍪', '🌸', '🐥'];
    const emoji = emojiList[Math.floor(Math.random() * emojiList.length)];
    const maxA = isLkg ? 6 : 18;
    const a = Math.floor(Math.random() * (maxA - 2)) + 3;
    const b = Math.floor(Math.random() * (a - 1)) + 1;
    const diff = a - b;

    const optA = String(diff);
    const optB = String(diff + 1);
    const optC = String(Math.max(0, diff - 1));
    const rawOptions = Array.from(new Set([optA, optB, optC]));
    while (rawOptions.length < 3) rawOptions.push(String(diff + rawOptions.length + 1));

    return {
      id: qId,
      grade,
      category: 'subtraction',
      questionType: isLkg ? 'picture-subtraction' : 'multiple-choice',
      difficulty: diff <= 4 ? 'easy' : 'medium',
      questionText: isLkg
        ? `${emoji.repeat(a)} - ${b} taken away = ?`
        : `Solve: ${a} - ${b} = ?`,
      narrationText: `${a} take away ${b} equals how many?`,
      visualData: {
        type: 'emojis',
        items: isLkg
          ? [...Array(diff).fill(emoji), ...Array(b).fill('❌')]
          : [String(a), '-', String(b)],
        countA: a,
        subtractionCrossCount: b,
        emojiA: emoji,
      },
      options: shuffleArray(rawOptions),
      correctAnswer: optA,
      explanation: `${a} minus ${b} leaves ${diff}! Wonderful job! 🎉`,
      hint: `Count backwards ${b} steps from ${a}.`,
      points: 10,
    };
  }

  // Counting fallback
  const count = Math.floor(Math.random() * (isLkg ? 10 : 20)) + 1;
  const emojiList = ['⭐', '🍎', '🐶', '🚗', '🍭', '🎈', '🦋', '🍓', '🐸', '⚽', '🍦'];
  const emoji = emojiList[Math.floor(Math.random() * emojiList.length)];
  const items = Array.from({ length: count }, () => emoji);
  const optA = String(count);
  const optB = String(count + 1);
  const optC = String(Math.max(1, count - 1));
  const rawOptions = Array.from(new Set([optA, optB, optC]));

  return {
    id: qId,
    grade,
    category: 'counting',
    questionType: 'visual-counting',
    difficulty: count <= 5 ? 'easy' : count <= 10 ? 'medium' : 'hard',
    questionText: `How many ${emoji} can you count?`,
    narrationText: `Count the items. How many are there in total?`,
    visualData: { type: 'emojis', items },
    options: shuffleArray(rawOptions),
    correctAnswer: optA,
    explanation: `There are exactly ${count} ${emoji}! Great counting! 🌟`,
    hint: `Tap and count each one carefully from 1 to ${count}!`,
    points: 10,
  };
}

export function getQuestionsForSession(grade, category, count = 5, difficulty) {
  const pool = grade === 'lkg' ? LKG_QUESTIONS : CLASS1_QUESTIONS;
  let filtered = pool.filter((q) => {
    if (category && q.category !== category) return false;
    if (difficulty && q.difficulty !== difficulty) return false;
    return true;
  });

  if (filtered.length < count) {
    filtered = pool.filter((q) => (category ? q.category === category : true));
  }
  if (filtered.length < count) {
    filtered = pool;
  }

  const fresh = filtered.filter((q) => !recentQuestionIds.has(q.id));
  const candidatePool = fresh.length >= count ? fresh : filtered;
  const shuffled = shuffleArray(candidatePool);

  const results = [];
  for (let i = 0; i < count; i++) {
    if (i < shuffled.length) {
      const q = shuffled[i];
      trackRecent(q.id);
      results.push({
        ...q,
        options: shuffleArray([...q.options]),
      });
    } else {
      const gen = generateDynamicQuestion(grade, category);
      trackRecent(gen.id);
      results.push(gen);
    }
  }

  return results;
}

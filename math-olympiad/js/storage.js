// LocalStorage and Analytics Service

const STORAGE_KEY = 'kids_math_olympiad_profile_v3';

const DEFAULT_PROFILE = {
  childName: 'Little Explorer',
  grade: 'lkg',
  stars: 35,
  gems: 80,
  trophies: 2,
  currentStreak: 3,
  lastActiveDate: new Date().toISOString().split('T')[0],
  mascot: 'robot',
  unlockedWorlds: ['number-land', 'addition-forest'],
  completedLevels: {
    'lkg-number-land-1': { stars: 3, highscore: 50 },
    'lkg-number-land-2': { stars: 3, highscore: 50 },
    'lkg-number-land-3': { stars: 2, highscore: 40 },
  },
  badges: ['first-steps', 'number-ninja'],
  dailyChallenge: {
    date: '',
    completed: false,
    score: 0,
  },
  olympiadResults: [
    {
      id: 'demo-oly-1',
      date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      grade: 'lkg',
      score: 190,
      totalQuestions: 20,
      correctAnswers: 19,
      stars: 3,
      rankTitle: 'Junior Math Wizard',
      topicsToPractice: ['Patterns'],
      timeSeconds: 240,
    },
  ],
  analytics: {
    totalQuestions: 38,
    correctQuestions: 34,
    totalTimeSeconds: 650,
    topicStats: {
      counting: { attempted: 14, correct: 14 },
      shapes: { attempted: 8, correct: 7 },
      addition: { attempted: 10, correct: 8 },
      patterns: { attempted: 6, correct: 5 },
    },
  },
  soundEnabled: true,
  musicEnabled: false,
  speechEnabled: true,
};

export const storage = {
  getProfile() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        const today = new Date().toISOString().split('T')[0];
        if (parsed.lastActiveDate && parsed.lastActiveDate !== today) {
          const lastDate = new Date(parsed.lastActiveDate);
          const currDate = new Date(today);
          const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
          if (diffDays === 1) {
            parsed.currentStreak = (parsed.currentStreak || 1) + 1;
          } else if (diffDays > 1) {
            parsed.currentStreak = 1;
          }
          parsed.lastActiveDate = today;
          storage.saveProfile(parsed);
        }
        return { ...DEFAULT_PROFILE, ...parsed };
      }
    } catch (e) {}
    return DEFAULT_PROFILE;
  },

  saveProfile(profile) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {}
  },

  recordQuestionAnswer(category, isCorrect, timeSeconds = 5) {
    const profile = storage.getProfile();
    profile.analytics.totalQuestions += 1;
    if (isCorrect) {
      profile.analytics.correctQuestions += 1;
      profile.gems += 2;
    }
    profile.analytics.totalTimeSeconds += Math.max(1, timeSeconds);

    if (!profile.analytics.topicStats[category]) {
      profile.analytics.topicStats[category] = { attempted: 0, correct: 0 };
    }
    profile.analytics.topicStats[category].attempted += 1;
    if (isCorrect) {
      profile.analytics.topicStats[category].correct += 1;
    }

    storage.saveProfile(profile);
    return profile;
  },

  completeLevel(worldId, levelNum, grade, starsEarned, score) {
    const profile = storage.getProfile();
    const levelKey = `${grade}-${worldId}-${levelNum}`;
    const prev = profile.completedLevels[levelKey];
    const prevStars = prev ? prev.stars : 0;
    const extraStars = Math.max(0, starsEarned - prevStars);

    profile.stars += extraStars;
    profile.gems += score;
    profile.completedLevels[levelKey] = {
      stars: Math.max(prevStars, starsEarned),
      highscore: Math.max(prev ? prev.highscore : 0, score),
    };

    if (levelNum >= 5 && !profile.unlockedWorlds.includes(worldId)) {
      profile.unlockedWorlds.push(worldId);
      profile.trophies += 1;
    }

    storage.saveProfile(profile);
    return profile;
  },

  completeOlympiad(result) {
    const profile = storage.getProfile();
    profile.olympiadResults.unshift(result);
    profile.trophies += 1;
    profile.stars += result.stars * 5;
    profile.gems += 50;

    if (!profile.badges.includes('olympiad-champion')) {
      profile.badges.push('olympiad-champion');
    }

    storage.saveProfile(profile);
    return profile;
  },

  setMascot(mascot) {
    const profile = storage.getProfile();
    profile.mascot = mascot;
    storage.saveProfile(profile);
    return profile;
  },

  setChildName(name) {
    const profile = storage.getProfile();
    profile.childName = name;
    storage.saveProfile(profile);
    return profile;
  },

  setGrade(grade) {
    const profile = storage.getProfile();
    profile.grade = grade;
    storage.saveProfile(profile);
    return profile;
  },

  resetProgress() {
    const clean = {
      ...DEFAULT_PROFILE,
      childName: 'Little Explorer',
      stars: 0,
      gems: 0,
      trophies: 0,
      currentStreak: 1,
      unlockedWorlds: ['number-land'],
      completedLevels: {},
      badges: ['first-steps'],
      olympiadResults: [],
      analytics: {
        totalQuestions: 0,
        correctQuestions: 0,
        totalTimeSeconds: 0,
        topicStats: {},
      },
    };
    storage.saveProfile(clean);
    return clean;
  },
};

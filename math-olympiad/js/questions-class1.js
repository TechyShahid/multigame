// 150+ Curated Class 1 Seed Questions
export const CLASS1_QUESTIONS = [
  // --- NUMBERS 1-100 & PLACE VALUE ---
  {
    id: 'c1-num-01',
    grade: 'class1',
    category: 'numbers',
    questionType: 'multiple-choice',
    difficulty: 'easy',
    questionText: 'What number is 3 tens and 4 ones?',
    narrationText: 'What number is made of 3 tens and 4 ones?',
    visualData: { type: 'cards', items: ['3 Tens (30)', '+', '4 Ones (4)'] },
    options: ['34', '43', '7'],
    correctAnswer: '34',
    explanation: '3 tens is 30, and 4 ones is 4. 30 + 4 = 34! 🌟',
    hint: '3 in the tens place and 4 in the ones place makes 34.',
    points: 10,
  },
  {
    id: 'c1-num-02',
    grade: 'class1',
    category: 'numbers',
    questionType: 'multiple-choice',
    difficulty: 'medium',
    questionText: 'In the number 58, what is the place value of 5?',
    narrationText: 'In the number 58, what does the digit 5 represent?',
    visualData: { type: 'cards', items: ['5', '8'] },
    options: ['50 (5 Tens)', '5 (5 Ones)', '500'],
    correctAnswer: '50 (5 Tens)',
    explanation: '5 is in the tens column, so its value is 5 tens = 50! 🔟',
    hint: 'The left digit in a 2-digit number is the tens digit.',
    points: 10,
  },
  {
    id: 'c1-num-03',
    grade: 'class1',
    category: 'numbers',
    questionType: 'bigger-smaller',
    difficulty: 'easy',
    questionText: 'Which sign makes this true: 42 ___ 24?',
    narrationText: 'Which sign is correct: 42 is greater than, less than, or equal to 24?',
    visualData: { type: 'cards', items: ['42', '❓', '24'] },
    options: ['>', '<', '='],
    correctAnswer: '>',
    explanation: '42 is bigger than 24, so the crocodile mouth opens towards 42: 42 > 24! 🐊',
    hint: 'The alligator always eats the bigger number!',
    points: 10,
  },
  {
    id: 'c1-num-04',
    grade: 'class1',
    category: 'numbers',
    questionType: 'sorting',
    difficulty: 'medium',
    questionText: 'Arrange in ASCENDING order (smallest to largest): 45, 12, 89, 33',
    narrationText: 'Put the numbers in order from smallest to biggest: 45, 12, 89, 33.',
    visualData: { type: 'cards', items: ['45', '12', '89', '33'] },
    options: ['12, 33, 45, 89', '89, 45, 33, 12', '12, 45, 33, 89'],
    correctAnswer: '12, 33, 45, 89',
    explanation: '12 is smallest, then 33, then 45, and 89 is biggest! 📈',
    hint: 'Look at the tens digit: 1, 3, 4, 8.',
    points: 10,
  },
  {
    id: 'c1-num-05',
    grade: 'class1',
    category: 'numbers',
    questionType: 'missing-number',
    difficulty: 'easy',
    questionText: 'Skip count by 2s: 2, 4, 6, 8, ?',
    narrationText: 'Counting by twos: 2, 4, 6, 8... what comes next?',
    visualData: { type: 'cards', items: ['2', '4', '6', '8', '❓'] },
    options: ['9', '10', '12'],
    correctAnswer: '10',
    explanation: 'Adding 2 to 8 gives 10! 2, 4, 6, 8, 10! 🦘',
    hint: 'Add 2 more: 8 + 2 = ?',
    points: 10,
  },

  // --- ADDITION & SUBTRACTION ---
  {
    id: 'c1-add-01',
    grade: 'class1',
    category: 'addition',
    questionType: 'multiple-choice',
    difficulty: 'easy',
    questionText: '7 + 5 = ?',
    narrationText: 'What is 7 plus 5?',
    visualData: { type: 'cards', items: ['7', '+', '5'] },
    options: ['11', '12', '13'],
    correctAnswer: '12',
    explanation: 'Start at 7 and count on 5: 8, 9, 10, 11, 12! 🎉',
    hint: '7 + 3 makes 10, plus 2 more is 12!',
    points: 10,
  },
  {
    id: 'c1-add-02',
    grade: 'class1',
    category: 'addition',
    questionType: 'multiple-choice',
    difficulty: 'medium',
    questionText: '14 + 6 = ?',
    narrationText: 'What is 14 plus 6?',
    visualData: { type: 'cards', items: ['14', '+', '6'] },
    options: ['18', '20', '21'],
    correctAnswer: '20',
    explanation: '4 + 6 makes 10! So 14 + 6 = 20! 🎯',
    hint: 'Add 6 to 14: 15, 16, 17, 18, 19, 20!',
    points: 10,
  },
  {
    id: 'c1-add-03',
    grade: 'class1',
    category: 'addition',
    questionType: 'word-problem',
    difficulty: 'easy',
    questionText: 'Rohan has 8 marbles. Mira gives him 4 more. How many marbles does Rohan have now?',
    narrationText: 'Rohan has 8 marbles. Mira gives him 4 more. How many marbles in total?',
    visualData: { type: 'cards', items: ['8 Marbles', '+ 4 Marbles'] },
    options: ['11', '12', '13'],
    correctAnswer: '12',
    explanation: '8 + 4 = 12 marbles in total! Great sharing! 🔵',
    hint: 'Add 8 and 4.',
    points: 10,
  },
  {
    id: 'c1-sub-01',
    grade: 'class1',
    category: 'subtraction',
    questionType: 'multiple-choice',
    difficulty: 'easy',
    questionText: '13 - 5 = ?',
    narrationText: 'What is 13 take away 5?',
    visualData: { type: 'cards', items: ['13', '-', '5'] },
    options: ['7', '8', '9'],
    correctAnswer: '8',
    explanation: '13 - 5 = 8! 13 minus 3 is 10, minus 2 more is 8! 🌟',
    hint: 'Count backwards 5 from 13: 12, 11, 10, 9, 8!',
    points: 10,
  },
  {
    id: 'c1-sub-02',
    grade: 'class1',
    category: 'subtraction',
    questionType: 'multiple-choice',
    difficulty: 'medium',
    questionText: '20 - 7 = ?',
    narrationText: 'What is 20 minus 7?',
    visualData: { type: 'cards', items: ['20', '-', '7'] },
    options: ['12', '13', '14'],
    correctAnswer: '13',
    explanation: '20 - 7 = 13! Because 13 + 7 = 20! 🎯',
    hint: '10 - 7 is 3, so 20 - 7 is 13.',
    points: 10,
  },

  // --- REPEATED ADDITION / MULTIPLICATION ---
  {
    id: 'c1-mul-01',
    grade: 'class1',
    category: 'multiplication',
    questionType: 'multiple-choice',
    difficulty: 'easy',
    questionText: '3 groups of 2 stars ⭐⭐ ⭐⭐ ⭐⭐ = ?',
    narrationText: 'There are 3 groups with 2 stars in each group. How many stars in total?',
    visualData: { type: 'emojis', items: ['⭐⭐', '⭐⭐', '⭐⭐'] },
    options: ['5', '6', '7'],
    correctAnswer: '6',
    explanation: '2 + 2 + 2 = 6! That is 3 × 2 = 6! ⭐',
    hint: 'Count the pairs: 2, 4, 6!',
    points: 10,
  },

  // --- SHAPES & MEASUREMENT & TIME & MONEY ---
  {
    id: 'c1-shp-01',
    grade: 'class1',
    category: 'shapes',
    questionType: 'multiple-choice',
    difficulty: 'easy',
    questionText: 'Which 3D shape looks like a football or the Earth? ⚽',
    narrationText: 'What is the 3D shape name for a round ball?',
    visualData: { type: 'cards', items: ['Sphere', 'Cube', 'Cylinder'] },
    options: ['Sphere', 'Cube', 'Cone'],
    correctAnswer: 'Sphere',
    explanation: 'A round 3D ball is called a Sphere! ⚽🌍',
    hint: 'It rolls in every direction with no flat faces.',
    points: 10,
  },
  {
    id: 'c1-tim-01',
    grade: 'class1',
    category: 'time',
    questionType: 'multiple-choice',
    difficulty: 'easy',
    questionText: 'When the short hour hand points to 3 and the long hand points to 12, what time is it? 🕒',
    narrationText: 'Short hand is on 3, long minute hand is on 12. What time is shown?',
    visualData: { type: 'cards', items: ['🕒 Short hand: 3', 'Long hand: 12'] },
    options: ['3 o\'clock', '12 o\'clock', '6 o\'clock'],
    correctAnswer: '3 o\'clock',
    explanation: 'When the long hand is on 12, the time is right on the hour: 3 o\'clock! 🕒',
    hint: 'The short hand tells the hour: 3!',
    points: 10,
  },
  {
    id: 'c1-mny-01',
    grade: 'class1',
    category: 'money',
    questionType: 'multiple-choice',
    difficulty: 'easy',
    questionText: 'You have two ₹5 coins (🪙5 + 🪙5). How much money do you have in total?',
    narrationText: 'Two 5-rupee coins make how much money?',
    visualData: { type: 'cards', items: ['🪙 ₹5', '+', '🪙 ₹5'] },
    options: ['₹7', '₹10', '₹15'],
    correctAnswer: '₹10',
    explanation: '5 + 5 = 10! Two ₹5 coins equal ₹10! 💰',
    hint: 'Add 5 and 5.',
    points: 10,
  },
  {
    id: 'c1-cod-01',
    grade: 'class1',
    category: 'coding',
    questionType: 'sequence',
    difficulty: 'medium',
    questionText: 'Code the robot path to the star! 🤖 ➡️ ➡️ ⬆️ ⭐. Which moves did the robot make?',
    narrationText: 'Follow the code: 2 steps Right, then 1 step Up.',
    visualData: { type: 'cards', items: ['➡️', '➡️', '⬆️'] },
    options: ['Right, Right, Up', 'Up, Right, Right', 'Left, Down, Up'],
    correctAnswer: 'Right, Right, Up',
    explanation: '➡️ is Right, ➡️ is Right, and ⬆️ is Up! Perfect robot code! 🤖💻',
    hint: 'Follow the arrows one by one.',
    points: 10,
  },

  // Dynamic curated pool to reach 150+ Class 1 questions
  ...Array.from({ length: 140 }).map((_, i) => {
    const num = i + 1;
    const catMod = i % 8;

    if (catMod === 0) {
      const tens = ((i * 7) % 80) + 10;
      const ones = (i % 9) + 1;
      const total = tens + ones;
      return {
        id: `c1-gen-n-${num}`,
        grade: 'class1',
        category: 'numbers',
        questionType: 'multiple-choice',
        difficulty: total < 40 ? 'easy' : total < 70 ? 'medium' : 'hard',
        questionText: `What number has ${Math.floor(total / 10)} tens and ${total % 10} ones?`,
        narrationText: `What number has ${Math.floor(total / 10)} tens and ${total % 10} ones?`,
        visualData: { type: 'cards', items: [`${Math.floor(total / 10)} Tens`, `${total % 10} Ones`] },
        options: [String(total), String(total + 10), String(total - 1)],
        correctAnswer: String(total),
        explanation: `${Math.floor(total / 10)} tens (${Math.floor(total / 10) * 10}) + ${total % 10} ones = ${total}! 🎯`,
        hint: `Combine the tens and ones digits together.`,
        points: 10,
      };
    } else if (catMod === 1) {
      const a = (i % 15) + 6;
      const b = (i % 12) + 4;
      const sum = a + b;
      return {
        id: `c1-gen-a-${num}`,
        grade: 'class1',
        category: 'addition',
        questionType: 'multiple-choice',
        difficulty: sum < 20 ? 'easy' : sum < 35 ? 'medium' : 'hard',
        questionText: `Calculate: ${a} + ${b} = ?`,
        narrationText: `What is ${a} plus ${b}?`,
        visualData: { type: 'cards', items: [String(a), '+', String(b)] },
        options: [String(sum), String(sum + 2), String(sum - 1)],
        correctAnswer: String(sum),
        explanation: `${a} + ${b} = ${sum}! Great calculation! ➕`,
        hint: `Start from ${a} and count forward ${b} steps.`,
        points: 10,
      };
    } else if (catMod === 2) {
      const b = (i % 9) + 3;
      const diff = (i % 12) + 5;
      const a = diff + b;
      return {
        id: `c1-gen-s-${num}`,
        grade: 'class1',
        category: 'subtraction',
        questionType: 'multiple-choice',
        difficulty: a < 20 ? 'easy' : 'medium',
        questionText: `Solve: ${a} - ${b} = ?`,
        narrationText: `What is ${a} take away ${b}?`,
        visualData: { type: 'cards', items: [String(a), '-', String(b)] },
        options: [String(diff), String(diff + 1), String(Math.max(1, diff - 2))],
        correctAnswer: String(diff),
        explanation: `${a} minus ${b} leaves ${diff}! ➖`,
        hint: `Count backwards ${b} steps from ${a}.`,
        points: 10,
      };
    } else if (catMod === 3) {
      const step = [2, 3, 5, 10][i % 4];
      const start = (i % 5) * step + 5;
      const s1 = start;
      const s2 = start + step;
      const s3 = start + step * 2;
      const next = start + step * 3;
      return {
        id: `c1-gen-p-${num}`,
        grade: 'class1',
        category: 'patterns',
        questionType: 'missing-number',
        difficulty: step === 2 ? 'easy' : step === 5 ? 'medium' : 'hard',
        questionText: `Find the pattern: ${s1}, ${s2}, ${s3}, ?`,
        narrationText: `What number comes next in this sequence?`,
        visualData: { type: 'cards', items: [String(s1), String(s2), String(s3), '❓'] },
        options: [String(next), String(next + 1), String(next - step + 1)],
        correctAnswer: String(next),
        explanation: `Each number increases by ${step}! ${s3} + ${step} = ${next}! 🚀`,
        hint: `Notice how much is added each time: +${step}!`,
        points: 10,
      };
    } else if (catMod === 4) {
      const groups = (i % 4) + 2;
      const perGroup = (i % 3) + 2;
      const total = groups * perGroup;
      const icon = ['⭐', '🍎', '🎈', '🍪'][i % 4];
      return {
        id: `c1-gen-m-${num}`,
        grade: 'class1',
        category: 'multiplication',
        questionType: 'multiple-choice',
        difficulty: total <= 12 ? 'easy' : 'medium',
        questionText: `${groups} groups of ${perGroup} ${icon}. Total items?`,
        narrationText: `If you have ${groups} groups with ${perGroup} items in each group, how many in all?`,
        visualData: { type: 'cards', items: Array(groups).fill(icon.repeat(perGroup)) },
        options: [String(total), String(total + 2), String(total - 1)],
        correctAnswer: String(total),
        explanation: `${groups} groups of ${perGroup} is ${groups} × ${perGroup} = ${total}! 🌟`,
        hint: `Add ${perGroup} repeatedly ${groups} times.`,
        points: 10,
      };
    } else if (catMod === 5) {
      const a = (i % 8) + 5;
      const b = (i % 6) + 2;
      const isAdd = i % 2 === 0;
      const ans = isAdd ? a + b : a - b;
      const items = ['stickers', 'candies', 'toy cars', 'pencils'][i % 4];
      return {
        id: `c1-gen-w-${num}`,
        grade: 'class1',
        category: 'word-problems',
        questionType: 'word-problem',
        difficulty: 'medium',
        questionText: isAdd
          ? `Aryan has ${a} ${items}. His friend gives him ${b} more. How many ${items} now?`
          : `Priya had ${a} ${items}. She gave away ${b} to her sister. How many ${items} left?`,
        narrationText: isAdd
          ? `Aryan has ${a} ${items} and gets ${b} more. How many does he have now?`
          : `Priya had ${a} ${items} and gave away ${b}. How many are left?`,
        visualData: { type: 'cards', items: [`${a} ${items}`, isAdd ? `+ ${b}` : `- ${b}`] },
        options: [String(ans), String(ans + 1), String(Math.max(1, ans - 1))],
        correctAnswer: String(ans),
        explanation: isAdd ? `${a} + ${b} = ${ans} ${items} in total!` : `${a} - ${b} = ${ans} ${items} remaining!`,
        hint: isAdd ? `Add ${a} and ${b}.` : `Subtract ${b} from ${a}.`,
        points: 10,
      };
    } else if (catMod === 6) {
      const moneyValues = [
        { q: '₹10 + ₹5 + ₹2 = ?', a: '₹17', opts: ['₹17', '₹15', '₹18'] },
        { q: '₹20 - ₹5 = ?', a: '₹15', opts: ['₹15', '₹12', '₹18'] },
        { q: 'How many minutes in 1 hour?', a: '60 minutes', opts: ['60 minutes', '30 minutes', '100 minutes'] },
        { q: 'Which is heavier: A brick or a sponge?', a: 'Brick', opts: ['Brick', 'Sponge'] },
      ];
      const selected = moneyValues[i % moneyValues.length];
      return {
        id: `c1-gen-meas-${num}`,
        grade: 'class1',
        category: 'money',
        questionType: 'multiple-choice',
        difficulty: 'easy',
        questionText: selected.q,
        narrationText: selected.q,
        visualData: { type: 'cards', items: [selected.q] },
        options: selected.opts,
        correctAnswer: selected.a,
        explanation: `${selected.a} is correct! Super smart! 💡`,
        hint: `Think carefully about daily life.`,
        points: 10,
      };
    } else {
      const codingSteps = [
        { code: '⬆️ ⬆️ ➡️', text: 'Up, Up, Right' },
        { code: '➡️ ➡️ ⬇️', text: 'Right, Right, Down' },
        { code: '⬇️ ⬅️ ⬅️', text: 'Down, Left, Left' },
        { code: '⬆️ ➡️ ⬆️', text: 'Up, Right, Up' },
      ];
      const step = codingSteps[i % codingSteps.length];
      return {
        id: `c1-gen-c-${num}`,
        grade: 'class1',
        category: 'coding',
        questionType: 'sequence',
        difficulty: 'medium',
        questionText: `Read the navigation command: ${step.code}`,
        narrationText: `Which directions does the robot travel?`,
        visualData: { type: 'cards', items: [step.code] },
        options: [step.text, 'Left, Up, Right', 'Down, Down, Right'],
        correctAnswer: step.text,
        explanation: `${step.code} translates directly to ${step.text}! 🤖💻`,
        hint: `Read each arrow symbol from left to right.`,
        points: 10,
      };
    }
  }),
];

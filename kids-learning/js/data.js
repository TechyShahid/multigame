/**
 * Kids Learning Adventure — Curriculum Data
 * Age group: 3-6 years (Preschool & Kindergarten)
 */

window.GameData = (function () {
  'use strict';

  // 1. Alphabets A-Z
  const alphabets = [
    { letter: 'A', word: 'Apple', emoji: '🍎', phonics: 'A is for Apple! Crunchy sweet apple!', color: '#FF4D6D' },
    { letter: 'B', word: 'Ball', emoji: '⚽', phonics: 'B is for Ball! Bounce the bouncy ball!', color: '#4EA8DE' },
    { letter: 'C', word: 'Cat', emoji: '🐱', phonics: 'C is for Cat! Meow says the kitty cat!', color: '#FFB703' },
    { letter: 'D', word: 'Dog', emoji: '🐶', phonics: 'D is for Dog! Woof woof says the friendly dog!', color: '#9B5DE5' },
    { letter: 'E', word: 'Elephant', emoji: '🐘', phonics: 'E is for Elephant! Huge friendly elephant!', color: '#00BBF9' },
    { letter: 'F', word: 'Fish', emoji: '🐠', phonics: 'F is for Fish! Swimming in the water!', color: '#06D6A0' },
    { letter: 'G', word: 'Grapes', emoji: '🍇', phonics: 'G is for Grapes! Juicy purple grapes!', color: '#8338EC' },
    { letter: 'H', word: 'Hat', emoji: '👒', phonics: 'H is for Hat! A pretty summer hat!', color: '#FB5607' },
    { letter: 'I', word: 'Ice Cream', emoji: '🍦', phonics: 'I is for Ice cream! Yummy cold ice cream!', color: '#FF006E' },
    { letter: 'J', word: 'Juice', emoji: '🧃', phonics: 'J is for Juice! Delicious fruity juice!', color: '#FF9E00' },
    { letter: 'K', word: 'Kite', emoji: '🪁', phonics: 'K is for Kite! Flying high up in the sky!', color: '#3A86FF' },
    { letter: 'L', word: 'Lion', emoji: '🦁', phonics: 'L is for Lion! Roar says the brave lion!', color: '#E76F51' },
    { letter: 'M', word: 'Monkey', emoji: '🐵', phonics: 'M is for Monkey! Playful little monkey!', color: '#90BE6D' },
    { letter: 'N', word: 'Nest', emoji: '🪺', phonics: 'N is for Nest! Birds sleep in a cozy nest!', color: '#B5838D' },
    { letter: 'O', word: 'Orange', emoji: '🍊', phonics: 'O is for Orange! Sweet citrus orange!', color: '#F77F00' },
    { letter: 'P', word: 'Penguin', emoji: '🐧', phonics: 'P is for Penguin! Waddle waddle penguin!', color: '#2A9D8F' },
    { letter: 'Q', word: 'Queen', emoji: '👑', phonics: 'Q is for Queen! Wearing a shiny crown!', color: '#7209B7' },
    { letter: 'R', word: 'Rabbit', emoji: '🐰', phonics: 'R is for Rabbit! Hop hop goes the rabbit!', color: '#F72585' },
    { letter: 'S', word: 'Sun', emoji: '☀️', phonics: 'S is for Sun! Shining bright and warm!', color: '#FFD166' },
    { letter: 'T', word: 'Tiger', emoji: '🐯', phonics: 'T is for Tiger! Fast and striped tiger!', color: '#F3722C' },
    { letter: 'U', word: 'Umbrella', emoji: '☂️', phonics: 'U is for Umbrella! Keeps us dry in the rain!', color: '#4361EE' },
    { letter: 'V', word: 'Van', emoji: '🚐', phonics: 'V is for Van! Beep beep goes the van!', color: '#4D908E' },
    { letter: 'W', word: 'Watermelon', emoji: '🍉', phonics: 'W is for Watermelon! Fresh pink watermelon!', color: '#2EC4B6' },
    { letter: 'X', word: 'Xylophone', emoji: '🎵', phonics: 'X is for Xylophone! Playing cheerful tunes!', color: '#E63946' },
    { letter: 'Y', word: 'Yo-yo', emoji: '🪀', phonics: 'Y is for Yo-yo! Spinning up and down!', color: '#9D4EDD' },
    { letter: 'Z', word: 'Zebra', emoji: '🦓', phonics: 'Z is for Zebra! Black and white stripes zebra!', color: '#577590' }
  ];

  // 2. Three Letter Words
  const threeLetterWords = [
    { word: 'CAT', letters: ['C', 'A', 'T'], emoji: '🐱', phonics: 'C - A - T makes Cat! Meow!', color: '#FF9F1C' },
    { word: 'DOG', letters: ['D', 'O', 'G'], emoji: '🐶', phonics: 'D - O - G makes Dog! Woof woof!', color: '#2EC4B6' },
    { word: 'SUN', letters: ['S', 'U', 'N'], emoji: '☀️', phonics: 'S - U - N makes Sun! Bright sun!', color: '#E71D36' },
    { word: 'BAT', letters: ['B', 'A', 'T'], emoji: '🦇', phonics: 'B - A - T makes Bat!', color: '#6A0572' },
    { word: 'HAT', letters: ['H', 'A', 'T'], emoji: '👒', phonics: 'H - A - T makes Hat! Wear a hat!', color: '#F77F00' },
    { word: 'PEN', letters: ['P', 'E', 'N'], emoji: '🖊️', phonics: 'P - E - N makes Pen! Write with pen!', color: '#3A86FF' },
    { word: 'CUP', letters: ['C', 'U', 'P'], emoji: '🥤', phonics: 'C - U - P makes Cup! Drink from a cup!', color: '#06D6A0' },
    { word: 'BUS', letters: ['B', 'U', 'S'], emoji: '🚌', phonics: 'B - U - S makes Bus! Wheels on the bus!', color: '#FFB703' },
    { word: 'CAR', letters: ['C', 'A', 'R'], emoji: '🚗', phonics: 'C - A - R makes Car! Vroom vroom!', color: '#E63946' },
    { word: 'FOX', letters: ['F', 'O', 'X'], emoji: '🦊', phonics: 'F - O - X makes Fox! Clever fox!', color: '#F3722C' },
    { word: 'PIG', letters: ['P', 'I', 'G'], emoji: '🐷', phonics: 'P - I - G makes Pig! Oink oink!', color: '#FF70A6' },
    { word: 'HEN', letters: ['H', 'E', 'N'], emoji: '🐔', phonics: 'H - E - N makes Hen! Cluck cluck!', color: '#B5838D' }
  ];

  // 3. Animals (16 animals) with sound profiles
  const animals = [
    { name: 'Dog', emoji: '🐶', soundType: 'dog', soundName: 'Woof Woof', fact: 'Dogs love to wag their tails!' },
    { name: 'Cat', emoji: '🐱', soundType: 'cat', soundName: 'Meow Meow', fact: 'Cats purr gently when happy!' },
    { name: 'Cow', emoji: '🐮', soundType: 'cow', soundName: 'Moo Moo', fact: 'Cows give us healthy milk!' },
    { name: 'Duck', emoji: '🦆', soundType: 'duck', soundName: 'Quack Quack', fact: 'Ducks love swimming in water!' },
    { name: 'Sheep', emoji: '🐑', soundType: 'sheep', soundName: 'Baa Baa', fact: 'Sheep have warm fluffy wool!' },
    { name: 'Lion', emoji: '🦁', soundType: 'lion', soundName: 'Roaaar', fact: 'Lion is the king of the jungle!' },
    { name: 'Elephant', emoji: '🐘', soundType: 'elephant', soundName: 'Trumpet', fact: 'Elephants have long trunks!' },
    { name: 'Monkey', emoji: '🐵', soundType: 'monkey', soundName: 'Ooh Aah', fact: 'Monkeys love swinging on trees!' },
    { name: 'Rabbit', emoji: '🐰', soundType: 'rabbit', soundName: 'Sniff Sniff', fact: 'Rabbits love eating orange carrots!' },
    { name: 'Horse', emoji: '🐴', soundType: 'horse', soundName: 'Neigh Neigh', fact: 'Horses can gallop super fast!' },
    { name: 'Pig', emoji: '🐷', soundType: 'pig', soundName: 'Oink Oink', fact: 'Pigs enjoy splashing in puddles!' },
    { name: 'Tiger', emoji: '🐯', soundType: 'tiger', soundName: 'Grrr Roar', fact: 'Tigers have beautiful orange stripes!' },
    { name: 'Goat', emoji: '🐐', soundType: 'goat', soundName: 'Maaa Maaa', fact: 'Goats are great at climbing rocks!' },
    { name: 'Bird', emoji: '🐦', soundType: 'bird', soundName: 'Tweet Tweet', fact: 'Birds sing sweet songs in trees!' },
    { name: 'Fish', emoji: '🐟', soundType: 'fish', soundName: 'Glub Glub', fact: 'Fish breathe and swim underwater!' },
    { name: 'Zebra', emoji: '🦓', soundType: 'zebra', soundName: 'Whinny', fact: 'Zebras have black and white stripes!' }
  ];

  // 4. Fruits
  const fruits = [
    { name: 'Apple', emoji: '🍎', color: '#FF3B30', fact: 'An apple a day keeps the doctor away!' },
    { name: 'Banana', emoji: '🍌', color: '#FFCC00', fact: 'Bananas are sweet, soft and yellow!' },
    { name: 'Orange', emoji: '🍊', color: '#FF9500', fact: 'Oranges are full of Vitamin C!' },
    { name: 'Grapes', emoji: '🍇', color: '#AF52DE', fact: 'Grapes grow in big juicy bunches!' },
    { name: 'Watermelon', emoji: '🍉', color: '#FF2D55', fact: 'Watermelon is sweet and so refreshing!' },
    { name: 'Mango', emoji: '🥭', color: '#FF9500', fact: 'Mango is the sweet king of fruits!' },
    { name: 'Strawberry', emoji: '🍓', color: '#FF2D55', fact: 'Strawberries have tiny seeds on top!' },
    { name: 'Pineapple', emoji: '🍍', color: '#FFCC00', fact: 'Pineapples wear a leafy crown!' },
    { name: 'Kiwi', emoji: '🥝', color: '#34C759', fact: 'Kiwis are fuzzy outside and green inside!' },
    { name: 'Pear', emoji: '🍐', color: '#A8DADC', fact: 'Pears are soft, juicy, and delicious!' }
  ];

  // 5. Vegetables
  const vegetables = [
    { name: 'Carrot', emoji: '🥕', color: '#FF9500', fact: 'Carrots are crunchy and great for eyes!' },
    { name: 'Potato', emoji: '🥔', color: '#C89666', fact: 'Potatoes make yummy mashed potatoes!' },
    { name: 'Tomato', emoji: '🍅', color: '#FF3B30', fact: 'Juicy red tomatoes are used in pasta!' },
    { name: 'Corn', emoji: '🌽', color: '#FFD60A', fact: 'Sweet golden corn pops into popcorn!' },
    { name: 'Broccoli', emoji: '🥦', color: '#34C759', fact: 'Broccoli looks like cute little green trees!' },
    { name: 'Cucumber', emoji: '🥒', color: '#30D158', fact: 'Cucumbers are cool, fresh and crunchy!' },
    { name: 'Onion', emoji: '🧅', color: '#BF5AF2', fact: 'Onions add wonderful flavor to yummy dishes!' },
    { name: 'Peas', emoji: '🫛', color: '#32D74B', fact: 'Tiny round green peas pop inside a pod!' },
    { name: 'Eggplant', emoji: '🍆', color: '#5856D6', fact: 'Eggplants have shiny deep purple skin!' },
    { name: 'Spinach', emoji: '🥬', color: '#28CD41', fact: 'Spinach gives lots of power and energy!' }
  ];

  // 6. Colors
  const colors = [
    { name: 'Red', hex: '#E63946', emoji: '🔴', items: '🍎 🍓 🚗' },
    { name: 'Blue', hex: '#3A86FF', emoji: '🔵', items: '🌊 🚙 🫐' },
    { name: 'Green', hex: '#2EC4B6', emoji: '🟢', items: '🥦 🐸 🍃' },
    { name: 'Yellow', hex: '#FFB703', emoji: '🟡', items: '☀️ 🍌 🐥' },
    { name: 'Orange', hex: '#FB5607', emoji: '🟠', items: '🍊 🥕 🦊' },
    { name: 'Purple', hex: '#8338EC', emoji: '🟣', items: '🍇 🍆 🔮' },
    { name: 'Pink', hex: '#FF006E', emoji: '🌸', items: '🦩 🎀 🧁' },
    { name: 'Brown', hex: '#8D5B4C', emoji: '🟤', items: '🐻 🥔 🪵' },
    { name: 'Black', hex: '#222222', emoji: '⚫', items: '🐈‍⬛ 🛞 🎩' },
    { name: 'White', hex: '#F8F9FA', emoji: '⚪', items: '🐇 ☁️ 🥛' }
  ];

  // 7. Shapes
  const shapes = [
    { name: 'Circle', emoji: '⚪', shapeClass: 'shape-circle', desc: 'Round like the full moon!', color: '#FF5733' },
    { name: 'Square', emoji: '⬛', shapeClass: 'shape-square', desc: 'Has 4 equal straight sides!', color: '#33A1FD' },
    { name: 'Triangle', emoji: '🔺', shapeClass: 'shape-triangle', desc: 'Has 3 pointy corners!', color: '#2EC4B6' },
    { name: 'Rectangle', emoji: '🟨', shapeClass: 'shape-rectangle', desc: 'Like a door or a picture frame!', color: '#FFB703' },
    { name: 'Star', emoji: '⭐', shapeClass: 'shape-star', desc: 'Twinkling up in the night sky!', color: '#FFD166' },
    { name: 'Heart', emoji: '💖', shapeClass: 'shape-heart', desc: 'Full of love and kindness!', color: '#FF4D6D' },
    { name: 'Oval', emoji: '🥚', shapeClass: 'shape-oval', desc: 'Shaped like a smooth egg!', color: '#8338EC' }
  ];

  // 8. Numbers (1-20)
  const numbers = [
    { num: 1, word: 'One', emoji: '🌟', count: 1 },
    { num: 2, word: 'Two', emoji: '🍎', count: 2 },
    { num: 3, word: 'Three', emoji: '🎈', count: 3 },
    { num: 4, word: 'Four', emoji: '🐶', count: 4 },
    { num: 5, word: 'Five', emoji: '⭐', count: 5 },
    { num: 6, word: 'Six', emoji: '🍓', count: 6 },
    { num: 7, word: 'Seven', emoji: '🌈', count: 7 },
    { num: 8, word: 'Eight', emoji: '🍦', count: 8 },
    { num: 9, word: 'Nine', emoji: '🐥', count: 9 },
    { num: 10, word: 'Ten', emoji: '🎉', count: 10 },
    { num: 11, word: 'Eleven', emoji: '🍭', count: 11 },
    { num: 12, word: 'Twelve', emoji: '🌸', count: 12 },
    { num: 13, word: 'Thirteen', emoji: '🍇', count: 13 },
    { num: 14, word: 'Fourteen', emoji: '🚗', count: 14 },
    { num: 15, word: 'Fifteen', emoji: '🍊', count: 15 },
    { num: 16, word: 'Sixteen', emoji: '⚽', count: 16 },
    { num: 17, word: 'Seventeen', emoji: '🦋', count: 17 },
    { num: 18, word: 'Eighteen', emoji: '💎', count: 18 },
    { num: 19, word: 'Nineteen', emoji: '🍉', count: 19 },
    { num: 20, word: 'Twenty', emoji: '🏆', count: 20 }
  ];

  // 9. Preschool General Knowledge Questions
  const gkQuestions = [
    {
      question: 'Which animal gives us healthy milk?',
      emoji: '🥛',
      options: [
        { text: 'Cow', emoji: '🐄', correct: true },
        { text: 'Dog', emoji: '🐶', correct: false },
        { text: 'Cat', emoji: '🐱', correct: false }
      ],
      explanation: 'Cow gives us tasty and healthy milk!'
    },
    {
      question: 'Which one can fly high in the sky?',
      emoji: '☁️',
      options: [
        { text: 'Bird', emoji: '🐦', correct: true },
        { text: 'Elephant', emoji: '🐘', correct: false },
        { text: 'Cow', emoji: '🐄', correct: false }
      ],
      explanation: 'Birds have wings to fly high in the sky!'
    },
    {
      question: 'Where do fish live and swim?',
      emoji: '🌊',
      options: [
        { text: 'Water', emoji: '💧', correct: true },
        { text: 'Tree', emoji: '🌳', correct: false },
        { text: 'House', emoji: '🏠', correct: false }
      ],
      explanation: 'Fish breathe and swim in the water!'
    },
    {
      question: 'What color is the sun usually drawn as?',
      emoji: '☀️',
      options: [
        { text: 'Yellow', emoji: '🟡', correct: true },
        { text: 'Blue', emoji: '🔵', correct: false },
        { text: 'Green', emoji: '🟢', correct: false }
      ],
      explanation: 'The sun shines with bright yellow light!'
    },
    {
      question: 'Which animal is called the king of the jungle?',
      emoji: '👑',
      options: [
        { text: 'Lion', emoji: '🦁', correct: true },
        { text: 'Rabbit', emoji: '🐰', correct: false },
        { text: 'Goat', emoji: '🐐', correct: false }
      ],
      explanation: 'The brave roaring Lion is king of the jungle!'
    },
    {
      question: 'What do bees make that is sweet to eat?',
      emoji: '🐝',
      options: [
        { text: 'Honey', emoji: '🍯', correct: true },
        { text: 'Water', emoji: '💧', correct: false },
        { text: 'Sand', emoji: '🏖️', correct: false }
      ],
      explanation: 'Busy honeybees make sweet golden honey!'
    },
    {
      question: 'How many legs does a dog have?',
      emoji: '🐶',
      options: [
        { text: '4 Legs', emoji: '🐾', correct: true },
        { text: '2 Legs', emoji: '✌️', correct: false },
        { text: '6 Legs', emoji: '🪲', correct: false }
      ],
      explanation: 'Dogs have 4 paws to run and play!'
    },
    {
      question: 'Which season is very cold and has snow?',
      emoji: '☃️',
      options: [
        { text: 'Winter', emoji: '❄️', correct: true },
        { text: 'Summer', emoji: '☀️', correct: false },
        { text: 'Spring', emoji: '🌸', correct: false }
      ],
      explanation: 'Winter brings chilly winds and snow!'
    },
    {
      question: 'What do we open when it rains?',
      emoji: '🌧️',
      options: [
        { text: 'Umbrella', emoji: '☂️', correct: true },
        { text: 'Book', emoji: '📖', correct: false },
        { text: 'Box', emoji: '📦', correct: false }
      ],
      explanation: 'An umbrella keeps us dry in the rain!'
    },
    {
      question: 'What fruit is red, sweet, and starts with A?',
      emoji: '🍎',
      options: [
        { text: 'Apple', emoji: '🍎', correct: true },
        { text: 'Banana', emoji: '🍌', correct: false },
        { text: 'Grapes', emoji: '🍇', correct: false }
      ],
      explanation: 'A is for crunchy red Apple!'
    }
  ];

  // 10. Badges
  const badges = [
    { id: 'abc_explorer', title: 'ABC Explorer', icon: '🌟', desc: 'Discovered letters in Learn ABC', target: 5 },
    { id: 'super_writer', title: 'Super Writer', icon: '✏️', desc: 'Traced letters & 3-letter words', target: 3 },
    { id: 'animal_expert', title: 'Animal Expert', icon: '🐾', desc: 'Identified friendly animals', target: 5 },
    { id: 'sound_master', title: 'Sound Detective', icon: '🔊', desc: 'Guessed animal sounds correctly', target: 3 },
    { id: 'fruit_friend', title: 'Fruit Friend', icon: '🍎', desc: 'Discovered colorful fruits', target: 5 },
    { id: 'veggie_hero', title: 'Veggie Hero', icon: '🥕', desc: 'Learned healthy vegetables', target: 5 },
    { id: 'color_master', title: 'Color Master', icon: '🎨', desc: 'Recognized bright colors', target: 5 },
    { id: 'number_star', title: 'Number Star', icon: '🔢', desc: 'Counted stars & solved numbers', target: 5 },
    { id: 'shape_wizard', title: 'Shape Wizard', icon: '🔺', desc: 'Matched geometric shapes', target: 5 },
    { id: 'little_genius', title: 'Little Genius', icon: '🧠', desc: 'Answered preschool GK quizzes', target: 5 }
  ];

  return {
    alphabets,
    threeLetterWords,
    animals,
    fruits,
    vegetables,
    colors,
    shapes,
    numbers,
    gkQuestions,
    badges
  };
})();

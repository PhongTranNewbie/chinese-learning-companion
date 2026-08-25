import type { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/db";

const levels = [
  { code: "HSK1", name: "HSK 1", sortOrder: 1 },
  { code: "HSK2", name: "HSK 2", sortOrder: 2 },
  { code: "HSK3", name: "HSK 3", sortOrder: 3 },
  { code: "HSK4", name: "HSK 4", sortOrder: 4 },
  { code: "HSK5", name: "HSK 5", sortOrder: 5 },
  { code: "HSK6", name: "HSK 6", sortOrder: 6 },
];

type DemoVocabulary = {
  hanzi: string;
  pinyin: string;
  meaning: string;
  deckName?: string;
  levelCode: string;
  partOfSpeech?: string;
  measureWord?: string;
  exampleChinese: string;
  examplePinyin: string;
  exampleEnglish: string;
  characterBreakdown?: string;
  wordFormationNote?: string;
  memoryMnemonic?: string;
  notes?: string;
  dueOffsetDays: number;
  intervalDays: number;
  easeFactor?: number;
  reviewCount?: number;
  lapseCount?: number;
  isArchived?: boolean;
  reviewStatus?: "ACTIVE" | "ARCHIVED";
  characterNotes?: {
    character: string;
    components?: string;
    componentMeanings?: string;
    mnemonicStory?: string;
    sortOrder: number;
  }[];
};

const demoDecks = [
  {
    name: "HSK 1 Starter Path",
    description: "Core beginner words for short daily review sessions.",
    isArchived: false,
  },
  {
    name: "Daily Mini Practice",
    description: "Useful everyday words with examples and memory clues.",
    isArchived: false,
  },
  {
    name: "Family Words",
    description: "Simple people and family vocabulary for warm-up study.",
    isArchived: false,
  },
  {
    name: "Archived Practice Set",
    description: "Archived local edge-case deck hidden from active study flows.",
    isArchived: true,
  },
];

const demoCourses = [
  {
    title: "HSK 1 Starter Path",
    description: "A compact course for reviewing beginner vocabulary in order.",
    lessons: [
      {
        title: "Greetings and daily rhythm",
        description: "Start with words that make short conversations feel usable.",
        deckName: "Daily Mini Practice",
        sortOrder: 1,
      },
      {
        title: "People around you",
        description: "Practice family and people words before moving into review.",
        deckName: "Family Words",
        sortOrder: 2,
      },
      {
        title: "Starter review loop",
        description: "Use the HSK starter deck as a focused flashcard session.",
        deckName: "HSK 1 Starter Path",
        sortOrder: 3,
      },
    ],
  },
];

function zh(...codePoints: number[]) {
  return String.fromCodePoint(...codePoints);
}

const demoVocabulary: DemoVocabulary[] = [
  {
    hanzi: zh(0x4f60, 0x597d),
    pinyin: "ni3 hao3",
    meaning: "hello",
    deckName: "Daily Mini Practice",
    levelCode: "HSK1",
    partOfSpeech: "phrase",
    exampleChinese: zh(0x4f60, 0x597d, 0xff0c, 0x6211, 0x53eb, 0x5b89, 0x5a1c, 0x3002),
    examplePinyin: "ni3 hao3, wo3 jiao4 an1 na4.",
    exampleEnglish: "Hello, my name is Anna.",
    characterBreakdown: zh(0x4f60) + " + " + zh(0x597d),
    wordFormationNote: zh(0x4f60) + " = you; " + zh(0x597d) + " = good",
    memoryMnemonic: "A greeting starts by wishing good toward you.",
    dueOffsetDays: -1,
    intervalDays: 1,
    reviewCount: 2,
    characterNotes: [
      {
        character: zh(0x4f60),
        components: zh(0x4ebb) + " + " + zh(0x5c14),
        componentMeanings: zh(0x4ebb) + " = person; " + zh(0x5c14) + " gives a sound clue",
        mnemonicStory: "A person component points toward you.",
        sortOrder: 1,
      },
      {
        character: zh(0x597d),
        components: zh(0x5973) + " + " + zh(0x5b50),
        componentMeanings: zh(0x5973) + " = woman/female; " + zh(0x5b50) + " = child",
        mnemonicStory: "Imagine a caring woman and child together for something good.",
        sortOrder: 2,
      },
    ],
  },
  {
    hanzi: zh(0x8c22, 0x8c22),
    pinyin: "xie4 xie5",
    meaning: "thanks; thank you",
    deckName: "Daily Mini Practice",
    levelCode: "HSK1",
    partOfSpeech: "phrase",
    exampleChinese: zh(0x8c22, 0x8c22, 0x4f60, 0x7684, 0x5e2e, 0x52a9, 0x3002),
    examplePinyin: "xie4 xie5 ni3 de5 bang1 zhu4.",
    exampleEnglish: "Thank you for your help.",
    characterBreakdown: zh(0x8c22) + " + " + zh(0x8c22),
    wordFormationNote: "Repeating the character creates the everyday polite phrase.",
    memoryMnemonic: "Say thanks twice to make the gratitude feel complete.",
    dueOffsetDays: 0,
    intervalDays: 2,
    reviewCount: 3,
  },
  {
    hanzi: zh(0x5b66, 0x4e60),
    pinyin: "xue2 xi2",
    meaning: "to study; to learn",
    deckName: "HSK 1 Starter Path",
    levelCode: "HSK1",
    partOfSpeech: "verb",
    exampleChinese: zh(0x6211, 0x6bcf, 0x5929, 0x5b66, 0x4e60, 0x4e2d, 0x6587, 0x3002),
    examplePinyin: "wo3 mei3 tian1 xue2 xi2 zhong1 wen2.",
    exampleEnglish: "I study Chinese every day.",
    characterBreakdown: zh(0x5b66) + " + " + zh(0x4e60),
    wordFormationNote: zh(0x5b66) + " = study; " + zh(0x4e60) + " = practice/habit",
    memoryMnemonic: "Learning sticks when study becomes practice.",
    dueOffsetDays: -2,
    intervalDays: 3,
    reviewCount: 4,
    characterNotes: [
      {
        character: zh(0x5b66),
        components: "top learning shape + " + zh(0x5b50),
        componentMeanings: zh(0x5b50) + " = child/learner",
        mnemonicStory: "A learner under a study roof reminds you of school and learning.",
        sortOrder: 1,
      },
      {
        character: zh(0x4e60),
        components: zh(0x5201) + " + small strokes",
        componentMeanings: "Use this as a visual memory aid for repeated practice.",
        mnemonicStory: "Practice is a repeated motion until it feels familiar.",
        sortOrder: 2,
      },
    ],
  },
  {
    hanzi: zh(0x670b, 0x53cb),
    pinyin: "peng2 you3",
    meaning: "friend",
    deckName: "Family Words",
    levelCode: "HSK1",
    partOfSpeech: "noun",
    measureWord: zh(0x4e2a),
    exampleChinese: zh(0x4ed6, 0x662f, 0x6211, 0x7684, 0x670b, 0x53cb, 0x3002),
    examplePinyin: "ta1 shi4 wo3 de5 peng2 you3.",
    exampleEnglish: "He is my friend.",
    characterBreakdown: zh(0x670b) + " + " + zh(0x53cb),
    wordFormationNote: "A common two-character noun for someone close to you.",
    memoryMnemonic: "Picture two companions standing side by side.",
    dueOffsetDays: 2,
    intervalDays: 4,
    reviewCount: 5,
    characterNotes: [
      {
        character: zh(0x670b),
        components: zh(0x6708) + " + " + zh(0x6708),
        componentMeanings: zh(0x6708) + " can mean moon/month; here it is a visual memory cue.",
        mnemonicStory: "Two moon-like shapes side by side can remind you of companionship.",
        sortOrder: 1,
      },
      {
        character: zh(0x53cb),
        components: zh(0x53c8) + " + hand shape",
        componentMeanings: zh(0x53c8) + " can suggest a hand or repeated action.",
        mnemonicStory: "A friend's hand reaches out again.",
        sortOrder: 2,
      },
    ],
  },
  {
    hanzi: zh(0x5988, 0x5988),
    pinyin: "ma1 ma5",
    meaning: "mom; mother",
    deckName: "Family Words",
    levelCode: "HSK1",
    partOfSpeech: "noun",
    measureWord: zh(0x4e2a),
    exampleChinese: zh(0x6211, 0x5988, 0x5988, 0x559c, 0x6b22, 0x559d, 0x8336, 0x3002),
    examplePinyin: "wo3 ma1 ma5 xi3 huan5 he1 cha2.",
    exampleEnglish: "My mom likes drinking tea.",
    characterBreakdown: zh(0x5988) + " + " + zh(0x5988),
    wordFormationNote: zh(0x5988) + " means mother; repeating it makes the family word natural.",
    memoryMnemonic: "The mother character repeats like a child calling mom.",
    dueOffsetDays: -1,
    intervalDays: 1,
    reviewCount: 1,
    characterNotes: [
      {
        character: zh(0x5988),
        components: zh(0x5973) + " + " + zh(0x9a6c),
        componentMeanings: zh(0x5973) + " = woman/female; " + zh(0x9a6c) + " gives the ma sound clue",
        mnemonicStory: "Picture a mother calmly guiding a horse.",
        sortOrder: 1,
      },
    ],
  },
  {
    hanzi: zh(0x7238, 0x7238),
    pinyin: "ba4 ba5",
    meaning: "dad; father",
    deckName: "Family Words",
    levelCode: "HSK1",
    partOfSpeech: "noun",
    measureWord: zh(0x4e2a),
    exampleChinese: zh(0x7238, 0x7238, 0x4eca, 0x5929, 0x5f88, 0x5fd9, 0x3002),
    examplePinyin: "ba4 ba5 jin1 tian1 hen3 mang2.",
    exampleEnglish: "Dad is very busy today.",
    characterBreakdown: zh(0x7238) + " + " + zh(0x7238),
    wordFormationNote: zh(0x7238) + " means father; repetition makes the everyday word.",
    memoryMnemonic: "The repeated sound feels like calling dad across the room.",
    dueOffsetDays: 3,
    intervalDays: 5,
    reviewCount: 2,
    characterNotes: [
      {
        character: zh(0x7238),
        components: zh(0x7236) + " + " + zh(0x5df4),
        componentMeanings: zh(0x7236) + " = father; " + zh(0x5df4) + " gives the ba sound clue",
        mnemonicStory: "Father plus the ba sound gives you dad.",
        sortOrder: 1,
      },
    ],
  },
  {
    hanzi: zh(0x559d, 0x8336),
    pinyin: "he1 cha2",
    meaning: "to drink tea",
    deckName: "Daily Mini Practice",
    levelCode: "HSK1",
    partOfSpeech: "verb phrase",
    exampleChinese: zh(0x4e0b, 0x5348, 0x6211, 0x4eec, 0x4e00, 0x8d77, 0x559d, 0x8336, 0x3002),
    examplePinyin: "xia4 wu3 wo3 men5 yi4 qi3 he1 cha2.",
    exampleEnglish: "In the afternoon we drink tea together.",
    characterBreakdown: zh(0x559d) + " + " + zh(0x8336),
    wordFormationNote: zh(0x559d) + " = drink; " + zh(0x8336) + " = tea",
    memoryMnemonic: "The action and the drink sit together: drink + tea.",
    dueOffsetDays: 7,
    intervalDays: 10,
    reviewCount: 6,
    characterNotes: [
      {
        character: zh(0x559d),
        components: zh(0x53e3) + " + sound component",
        componentMeanings: zh(0x53e3) + " = mouth; the right side gives a sound clue",
        mnemonicStory: "A mouth component reminds you this is something you do with your mouth.",
        sortOrder: 1,
      },
      {
        character: zh(0x8336),
        components: zh(0x8279) + " + " + zh(0x4eba) + " + " + zh(0x6728),
        componentMeanings: zh(0x8279) + " = grass/plant; " + zh(0x4eba) + " = person; " + zh(0x6728) + " = tree/wood",
        mnemonicStory: "A person gathers leaves from a plant or tree for tea.",
        sortOrder: 2,
      },
    ],
  },
  {
    hanzi: zh(0x65e7, 0x8bcd),
    pinyin: "jiu4 ci2",
    meaning: "old word",
    deckName: "Archived Practice Set",
    levelCode: "HSK2",
    partOfSpeech: "noun",
    exampleChinese: zh(0x8fd9, 0x4e2a, 0x65e7, 0x8bcd, 0x5df2, 0x7ecf, 0x5f52, 0x6863, 0x4e86, 0x3002),
    examplePinyin: "zhe4 ge4 jiu4 ci2 yi3 jing1 gui1 dang4 le5.",
    exampleEnglish: "This old word has already been archived.",
    characterBreakdown: zh(0x65e7) + " + " + zh(0x8bcd),
    wordFormationNote: zh(0x65e7) + " = old; " + zh(0x8bcd) + " = word",
    memoryMnemonic: "An old word belongs in the archived practice set.",
    dueOffsetDays: -10,
    intervalDays: 1,
    reviewCount: 1,
    isArchived: true,
    reviewStatus: "ARCHIVED",
  },
];

const additionalDemoVocabulary: DemoVocabulary[] = [
  { hanzi: zh(0x6211), pinyin: "wo3", meaning: "I; me", deckName: "HSK 1 Starter Path", levelCode: "HSK1", partOfSpeech: "pronoun", exampleChinese: zh(0x6211, 0x662f, 0x5b66, 0x751f, 0x3002), examplePinyin: "wo3 shi4 xue2 sheng1.", exampleEnglish: "I am a student.", characterBreakdown: zh(0x6211), wordFormationNote: "A core pronoun for talking about yourself.", memoryMnemonic: "Use wo3 as your anchor whenever a sentence starts with I.", dueOffsetDays: -3, intervalDays: 1, reviewCount: 2 },
  { hanzi: zh(0x662f), pinyin: "shi4", meaning: "to be; is/am/are", deckName: "HSK 1 Starter Path", levelCode: "HSK1", partOfSpeech: "verb", exampleChinese: zh(0x4ed6, 0x662f, 0x6211, 0x7684, 0x670b, 0x53cb, 0x3002), examplePinyin: "ta1 shi4 wo3 de5 peng2 you3.", exampleEnglish: "He is my friend.", characterBreakdown: zh(0x662f), wordFormationNote: "A basic linking verb for identity sentences.", memoryMnemonic: "Think of shi4 as the bridge between a person and what they are.", dueOffsetDays: -1, intervalDays: 2, reviewCount: 3 },
  { hanzi: zh(0x4e0d), pinyin: "bu4", meaning: "not; no", deckName: "HSK 1 Starter Path", levelCode: "HSK1", partOfSpeech: "adverb", exampleChinese: zh(0x6211, 0x4e0d, 0x559d, 0x5496, 0x5561, 0x3002), examplePinyin: "wo3 bu4 he1 ka1 fei1.", exampleEnglish: "I do not drink coffee.", characterBreakdown: zh(0x4e0d), wordFormationNote: "A common negation before many verbs and adjectives.", memoryMnemonic: "Bu4 is a short stop sign before the action.", dueOffsetDays: 4, intervalDays: 5, reviewCount: 4 },
  { hanzi: zh(0x6709), pinyin: "you3", meaning: "to have; there is", deckName: "HSK 1 Starter Path", levelCode: "HSK1", partOfSpeech: "verb", exampleChinese: zh(0x6211, 0x6709, 0x4e00, 0x672c, 0x4e66, 0x3002), examplePinyin: "wo3 you3 yi4 ben3 shu1.", exampleEnglish: "I have a book.", characterBreakdown: zh(0x6709), wordFormationNote: "Use you3 for possession and for saying something exists.", memoryMnemonic: "You3 puts something into your hand or into the scene.", dueOffsetDays: 8, intervalDays: 10, reviewCount: 5 },
  { hanzi: zh(0x5728), pinyin: "zai4", meaning: "at; in; to be located", deckName: "HSK 1 Starter Path", levelCode: "HSK1", partOfSpeech: "verb/preposition", exampleChinese: zh(0x6211, 0x5728, 0x5bb6, 0x3002), examplePinyin: "wo3 zai4 jia1.", exampleEnglish: "I am at home.", characterBreakdown: zh(0x5728), wordFormationNote: "Zai4 places someone or something in a location.", memoryMnemonic: "Zai4 pins the person to a place on your mental map.", dueOffsetDays: -2, intervalDays: 1, reviewCount: 1 },
  { hanzi: zh(0x53bb), pinyin: "qu4", meaning: "to go", deckName: "HSK 1 Starter Path", levelCode: "HSK1", partOfSpeech: "verb", exampleChinese: zh(0x6211, 0x4eec, 0x53bb, 0x5b66, 0x6821, 0x3002), examplePinyin: "wo3 men5 qu4 xue2 xiao4.", exampleEnglish: "We go to school.", characterBreakdown: zh(0x53bb), wordFormationNote: "A basic movement verb for going away or toward a place.", memoryMnemonic: "Qu4 moves the sentence forward toward a destination.", dueOffsetDays: 2, intervalDays: 3, reviewCount: 2 },
  { hanzi: zh(0x6765), pinyin: "lai2", meaning: "to come", deckName: "HSK 1 Starter Path", levelCode: "HSK1", partOfSpeech: "verb", exampleChinese: zh(0x8bf7, 0x6765, 0x6211, 0x5bb6, 0x3002), examplePinyin: "qing3 lai2 wo3 jia1.", exampleEnglish: "Please come to my home.", characterBreakdown: zh(0x6765), wordFormationNote: "A movement verb for coming toward the speaker or place.", memoryMnemonic: "Lai2 pulls the action toward you.", dueOffsetDays: 6, intervalDays: 8, reviewCount: 4 },
  { hanzi: zh(0x770b), pinyin: "kan4", meaning: "to look; to watch; to read", deckName: "HSK 1 Starter Path", levelCode: "HSK1", partOfSpeech: "verb", exampleChinese: zh(0x6211, 0x770b, 0x4e2d, 0x6587, 0x4e66, 0x3002), examplePinyin: "wo3 kan4 zhong1 wen2 shu1.", exampleEnglish: "I read a Chinese book.", characterBreakdown: `${zh(0x624b)} + ${zh(0x76ee)}`, wordFormationNote: "Hand plus eye makes a useful memory aid for looking.", memoryMnemonic: "A hand shading an eye helps you remember looking carefully.", dueOffsetDays: -4, intervalDays: 1, reviewCount: 3, characterNotes: [{ character: zh(0x770b), components: `${zh(0x624b)} + ${zh(0x76ee)}`, componentMeanings: "hand + eye", mnemonicStory: "Put a hand above your eye to look into the distance.", sortOrder: 1 }] },
  { hanzi: zh(0x5403), pinyin: "chi1", meaning: "to eat", deckName: "HSK 1 Starter Path", levelCode: "HSK1", partOfSpeech: "verb", exampleChinese: zh(0x6211, 0x5403, 0x7c73, 0x996d, 0x3002), examplePinyin: "wo3 chi1 mi3 fan4.", exampleEnglish: "I eat rice.", characterBreakdown: `${zh(0x53e3)} + ${zh(0x4e5e)}`, wordFormationNote: "Mouth plus a sound clue makes a useful memory aid.", memoryMnemonic: "The mouth component tells you this action belongs to eating.", dueOffsetDays: 1, intervalDays: 3, reviewCount: 2, characterNotes: [{ character: zh(0x5403), components: `${zh(0x53e3)} + ${zh(0x4e5e)}`, componentMeanings: "mouth + sound clue", mnemonicStory: "The mouth side reminds you to open your mouth to eat.", sortOrder: 1 }] },
  { hanzi: zh(0x4e2d, 0x56fd), pinyin: "zhong1 guo2", meaning: "China", deckName: "HSK 1 Starter Path", levelCode: "HSK1", partOfSpeech: "proper noun", exampleChinese: zh(0x5979, 0x6765, 0x81ea, 0x4e2d, 0x56fd, 0x3002), examplePinyin: "ta1 lai2 zi4 zhong1 guo2.", exampleEnglish: "She comes from China.", characterBreakdown: `${zh(0x4e2d)} + ${zh(0x56fd)}`, wordFormationNote: "Middle or central plus country makes a useful memory aid.", memoryMnemonic: "Think central country: zhong1 plus guo2 gives China.", dueOffsetDays: 9, intervalDays: 12, reviewCount: 5 },
  { hanzi: zh(0x4e2d, 0x6587), pinyin: "zhong1 wen2", meaning: "Chinese language", deckName: "HSK 1 Starter Path", levelCode: "HSK1", partOfSpeech: "noun", exampleChinese: zh(0x6211, 0x5b66, 0x4e60, 0x4e2d, 0x6587, 0x3002), examplePinyin: "wo3 xue2 xi2 zhong1 wen2.", exampleEnglish: "I study Chinese.", characterBreakdown: `${zh(0x4e2d)} + ${zh(0x6587)}`, wordFormationNote: "China plus writing/language makes Chinese language.", memoryMnemonic: "Chinese language is China plus written language.", dueOffsetDays: -1, intervalDays: 2, reviewCount: 3 },
  { hanzi: zh(0x4eca, 0x5929), pinyin: "jin1 tian1", meaning: "today", deckName: "Daily Mini Practice", levelCode: "HSK1", partOfSpeech: "time word", exampleChinese: zh(0x4eca, 0x5929, 0x6211, 0x5f88, 0x5fd9, 0x3002), examplePinyin: "jin1 tian1 wo3 hen3 mang2.", exampleEnglish: "Today I am very busy.", characterBreakdown: `${zh(0x4eca)} + ${zh(0x5929)}`, wordFormationNote: "Current or now plus day gives today.", memoryMnemonic: "The current day is today.", dueOffsetDays: -2, intervalDays: 1, reviewCount: 2 },
  { hanzi: zh(0x660e, 0x5929), pinyin: "ming2 tian1", meaning: "tomorrow", deckName: "Daily Mini Practice", levelCode: "HSK1", partOfSpeech: "time word", exampleChinese: zh(0x660e, 0x5929, 0x6211, 0x4eec, 0x53bb, 0x5b66, 0x6821, 0x3002), examplePinyin: "ming2 tian1 wo3 men5 qu4 xue2 xiao4.", exampleEnglish: "Tomorrow we go to school.", characterBreakdown: `${zh(0x660e)} + ${zh(0x5929)}`, wordFormationNote: "Bright or next plus day gives tomorrow.", memoryMnemonic: "A bright next day helps you remember tomorrow.", dueOffsetDays: 3, intervalDays: 4, reviewCount: 2, characterNotes: [{ character: zh(0x660e), components: `${zh(0x65e5)} + ${zh(0x6708)}`, componentMeanings: "sun + moon", mnemonicStory: "Sun and moon together make the day feel bright.", sortOrder: 1 }] },
  { hanzi: zh(0x73b0, 0x5728), pinyin: "xian4 zai4", meaning: "now", deckName: "Daily Mini Practice", levelCode: "HSK1", partOfSpeech: "time word", exampleChinese: zh(0x73b0, 0x5728, 0x6211, 0x5728, 0x5bb6, 0x3002), examplePinyin: "xian4 zai4 wo3 zai4 jia1.", exampleEnglish: "Now I am at home.", characterBreakdown: `${zh(0x73b0)} + ${zh(0x5728)}`, wordFormationNote: "Present plus being in a place makes now.", memoryMnemonic: "Xian4 zai4 locates you in the present moment.", dueOffsetDays: 5, intervalDays: 7, reviewCount: 4 },
  { hanzi: zh(0x6c34), pinyin: "shui3", meaning: "water", deckName: "Daily Mini Practice", levelCode: "HSK1", partOfSpeech: "noun", exampleChinese: zh(0x8bf7, 0x7ed9, 0x6211, 0x4e00, 0x676f, 0x6c34, 0x3002), examplePinyin: "qing3 gei3 wo3 yi4 bei1 shui3.", exampleEnglish: "Please give me a cup of water.", characterBreakdown: zh(0x6c34), wordFormationNote: "A basic noun for drinks and daily needs.", memoryMnemonic: "Water is the word you reach for when you need a simple drink.", dueOffsetDays: -1, intervalDays: 1, reviewCount: 1 },
  { hanzi: zh(0x7c73, 0x996d), pinyin: "mi3 fan4", meaning: "cooked rice; rice meal", deckName: "Daily Mini Practice", levelCode: "HSK1", partOfSpeech: "noun", exampleChinese: zh(0x6211, 0x4e2d, 0x5348, 0x5403, 0x7c73, 0x996d, 0x3002), examplePinyin: "wo3 zhong1 wu3 chi1 mi3 fan4.", exampleEnglish: "At noon I eat rice.", characterBreakdown: `${zh(0x7c73)} + ${zh(0x996d)}`, wordFormationNote: "Rice grain plus cooked rice/meal makes a useful memory aid.", memoryMnemonic: "Rice grains become the cooked rice meal.", dueOffsetDays: 4, intervalDays: 6, reviewCount: 3 },
  { hanzi: zh(0x5de5, 0x4f5c), pinyin: "gong1 zuo4", meaning: "work; job", deckName: "Daily Mini Practice", levelCode: "HSK1", partOfSpeech: "noun/verb", exampleChinese: zh(0x5979, 0x4eca, 0x5929, 0x5de5, 0x4f5c, 0x3002), examplePinyin: "ta1 jin1 tian1 gong1 zuo4.", exampleEnglish: "She works today.", characterBreakdown: `${zh(0x5de5)} + ${zh(0x4f5c)}`, wordFormationNote: "Labor or skill plus doing/making makes work.", memoryMnemonic: "Work is skilled doing.", dueOffsetDays: 10, intervalDays: 12, reviewCount: 5 },
  { hanzi: zh(0x4e70), pinyin: "mai3", meaning: "to buy", deckName: "Daily Mini Practice", levelCode: "HSK1", partOfSpeech: "verb", exampleChinese: zh(0x6211, 0x60f3, 0x4e70, 0x8336, 0x3002), examplePinyin: "wo3 xiang3 mai3 cha2.", exampleEnglish: "I want to buy tea.", characterBreakdown: zh(0x4e70), wordFormationNote: "A practical shopping verb.", memoryMnemonic: "Use mai3 whenever money turns into something you take home.", dueOffsetDays: -3, intervalDays: 2, reviewCount: 2 },
  { hanzi: zh(0x591a, 0x5c11), pinyin: "duo1 shao3", meaning: "how many; how much", deckName: "Daily Mini Practice", levelCode: "HSK1", partOfSpeech: "question word", exampleChinese: zh(0x8fd9, 0x4e2a, 0x591a, 0x5c11, 0x94b1, 0xff1f), examplePinyin: "zhe4 ge4 duo1 shao3 qian2?", exampleEnglish: "How much is this?", characterBreakdown: `${zh(0x591a)} + ${zh(0x5c11)}`, wordFormationNote: "Many plus few makes a quantity question.", memoryMnemonic: "Asking quantity balances many and few.", dueOffsetDays: 1, intervalDays: 3, reviewCount: 1 },
  { hanzi: zh(0x5bb6), pinyin: "jia1", meaning: "home; family", deckName: "Family Words", levelCode: "HSK1", partOfSpeech: "noun", measureWord: "ge4", exampleChinese: zh(0x6211, 0x5bb6, 0x6709, 0x56db, 0x4e2a, 0x4eba, 0x3002), examplePinyin: "wo3 jia1 you3 si4 ge4 ren2.", exampleEnglish: "My family has four people.", characterBreakdown: `${zh(0x5b80)} + ${zh(0x8c55)}`, wordFormationNote: "Roof plus household component makes a memory aid for home.", memoryMnemonic: "A roof over living things gives the feeling of home.", dueOffsetDays: -1, intervalDays: 1, reviewCount: 2 },
  { hanzi: zh(0x4eba), pinyin: "ren2", meaning: "person; people", deckName: "Family Words", levelCode: "HSK1", partOfSpeech: "noun", measureWord: "ge4", exampleChinese: zh(0x90a3, 0x4e2a, 0x4eba, 0x662f, 0x8001, 0x5e08, 0x3002), examplePinyin: "na4 ge5 ren2 shi4 lao3 shi1.", exampleEnglish: "That person is a teacher.", characterBreakdown: zh(0x4eba), wordFormationNote: "A core character for people and person words.", memoryMnemonic: "The simple shape stands for a person in your sentence.", dueOffsetDays: 2, intervalDays: 4, reviewCount: 3 },
  { hanzi: zh(0x8001, 0x5e08), pinyin: "lao3 shi1", meaning: "teacher", deckName: "Family Words", levelCode: "HSK1", partOfSpeech: "noun", measureWord: "ge4", exampleChinese: zh(0x738b, 0x8001, 0x5e08, 0x6559, 0x4e2d, 0x6587, 0x3002), examplePinyin: "wang2 lao3 shi1 jiao1 zhong1 wen2.", exampleEnglish: "Teacher Wang teaches Chinese.", characterBreakdown: `${zh(0x8001)} + ${zh(0x5e08)}`, wordFormationNote: "Respectful old plus teacher/master makes teacher.", memoryMnemonic: "A respected teacher guides the class.", dueOffsetDays: 6, intervalDays: 8, reviewCount: 4 },
  { hanzi: zh(0x5b66, 0x751f), pinyin: "xue2 sheng1", meaning: "student", deckName: "Family Words", levelCode: "HSK1", partOfSpeech: "noun", measureWord: "ge4", exampleChinese: zh(0x6211, 0x662f, 0x4e2d, 0x6587, 0x5b66, 0x751f, 0x3002), examplePinyin: "wo3 shi4 zhong1 wen2 xue2 sheng1.", exampleEnglish: "I am a Chinese-language student.", characterBreakdown: `${zh(0x5b66)} + ${zh(0x751f)}`, wordFormationNote: "Learn plus person/life makes student.", memoryMnemonic: "A student is a person whose role is learning.", dueOffsetDays: -2, intervalDays: 1, reviewCount: 2 },
  { hanzi: zh(0x513f, 0x5b50), pinyin: "er2 zi5", meaning: "son", deckName: "Family Words", levelCode: "HSK1", partOfSpeech: "noun", measureWord: "ge4", exampleChinese: zh(0x4ed6, 0x7684, 0x513f, 0x5b50, 0x4e09, 0x5c81, 0x3002), examplePinyin: "ta1 de5 er2 zi5 san1 sui4.", exampleEnglish: "His son is three years old.", characterBreakdown: `${zh(0x513f)} + ${zh(0x5b50)}`, wordFormationNote: "Two child-related characters make son.", memoryMnemonic: "Two child-related characters make son easy to remember.", dueOffsetDays: 5, intervalDays: 6, reviewCount: 2 },
  { hanzi: zh(0x5973, 0x513f), pinyin: "nv3 er2", meaning: "daughter", deckName: "Family Words", levelCode: "HSK1", partOfSpeech: "noun", measureWord: "ge4", exampleChinese: zh(0x5979, 0x5973, 0x513f, 0x559c, 0x6b22, 0x5b66, 0x4e60, 0x3002), examplePinyin: "ta1 nv3 er2 xi3 huan5 xue2 xi2.", exampleEnglish: "Her daughter likes studying.", characterBreakdown: `${zh(0x5973)} + ${zh(0x513f)}`, wordFormationNote: "Female plus child/person makes daughter.", memoryMnemonic: "Female plus child gives daughter.", dueOffsetDays: 7, intervalDays: 9, reviewCount: 3 },
];

async function main() {
  const now = new Date();

  for (const level of levels) {
    await prisma.level.upsert({
      where: { code: level.code },
      update: {
        name: level.name,
        sortOrder: level.sortOrder,
      },
      create: level,
    });
  }

  const deckByName = new Map<string, { id: string }>();
  for (const deck of demoDecks) {
    deckByName.set(deck.name, await upsertDeck(deck));
  }

  for (const item of [...demoVocabulary, ...additionalDemoVocabulary]) {
    await upsertVocabularyItem({ item, deckByName, now });
  }

  for (const course of demoCourses) {
    await upsertCourse({ course, deckByName });
  }
}

async function upsertDeck(deck: {
  name: string;
  description: string;
  isArchived: boolean;
}) {
  const existing = await prisma.deck.findFirst({
    where: {
      name: deck.name,
    },
  });

  if (existing) {
    return prisma.deck.update({
      where: {
        id: existing.id,
      },
      data: deck,
      select: {
        id: true,
      },
    });
  }

  return prisma.deck.create({
    data: deck,
    select: {
      id: true,
    },
  });
}

async function upsertVocabularyItem({
  item,
  deckByName,
  now,
}: {
  item: DemoVocabulary;
  deckByName: Map<string, { id: string }>;
  now: Date;
}) {
  const level = await prisma.level.findUnique({
    where: {
      code: item.levelCode,
    },
    select: {
      id: true,
    },
  });
  const deck = item.deckName ? deckByName.get(item.deckName) : null;
  const dueAt = addDays(now, item.dueOffsetDays);
  const reviewStatus = item.reviewStatus ?? "ACTIVE";

  const data = {
    hanzi: item.hanzi,
    pinyin: item.pinyin,
    meaning: item.meaning,
    deckId: deck?.id ?? null,
    levelId: level?.id ?? null,
    partOfSpeech: item.partOfSpeech ?? null,
    measureWord: item.measureWord ?? null,
    exampleChinese: item.exampleChinese,
    examplePinyin: item.examplePinyin,
    exampleEnglish: item.exampleEnglish,
    characterBreakdown: item.characterBreakdown ?? null,
    wordFormationNote: item.wordFormationNote ?? null,
    memoryMnemonic: item.memoryMnemonic ?? null,
    notes: item.notes ?? null,
    isArchived: item.isArchived ?? false,
  };

  // Look up by (hanzi, pinyin) only. Including `meaning` here meant that
  // editing a seed word's meaning created a second row instead of updating the
  // first, which is where most duplicate catalog rows came from.
  // `userId: null` keeps the seed inside the catalog rows it owns: without it,
  // the wider lookup could match a row a user has made their own and overwrite
  // their meaning, deck, mnemonic, notes and character notes.
  const existing = await prisma.vocabularyItem.findFirst({
    where: {
      hanzi: item.hanzi,
      pinyin: item.pinyin,
      userId: null,
    },
    include: {
      reviewCard: true,
    },
  });

  if (existing) {
    await prisma.$transaction(async (tx) => {
      await tx.vocabularyItem.update({
        where: {
          id: existing.id,
        },
        data: {
          ...data,
          reviewCard: existing.reviewCard
            ? {
                update: {
                  dueAt,
                  intervalDays: item.intervalDays,
                  easeFactor: item.easeFactor ?? 2.5,
                  reviewCount: item.reviewCount ?? 0,
                  lapseCount: item.lapseCount ?? 0,
                  status: reviewStatus,
                },
              }
            : {
                create: {
                  dueAt,
                  intervalDays: item.intervalDays,
                  easeFactor: item.easeFactor ?? 2.5,
                  reviewCount: item.reviewCount ?? 0,
                  lapseCount: item.lapseCount ?? 0,
                  status: reviewStatus,
                },
              },
        },
      });
      await replaceCharacterNotes({
        tx,
        vocabularyItemId: existing.id,
        notes: item.characterNotes ?? [],
      });
    });
    return;
  }

  await prisma.$transaction(async (tx) => {
    const created = await tx.vocabularyItem.create({
      data: {
        ...data,
        reviewCard: {
          create: {
            dueAt,
            intervalDays: item.intervalDays,
            easeFactor: item.easeFactor ?? 2.5,
            reviewCount: item.reviewCount ?? 0,
            lapseCount: item.lapseCount ?? 0,
            status: reviewStatus,
          },
        },
      },
      select: {
        id: true,
      },
    });
    await replaceCharacterNotes({
      tx,
      vocabularyItemId: created.id,
      notes: item.characterNotes ?? [],
    });
  });
}

async function replaceCharacterNotes({
  tx,
  vocabularyItemId,
  notes,
}: {
  tx: Prisma.TransactionClient;
  vocabularyItemId: string;
  notes: NonNullable<DemoVocabulary["characterNotes"]>;
}) {
  await tx.vocabularyCharacterNote.deleteMany({
    where: {
      vocabularyItemId,
    },
  });

  if (notes.length === 0) {
    return;
  }

  await tx.vocabularyCharacterNote.createMany({
    data: notes.map((note) => ({
      vocabularyItemId,
      character: note.character,
      components: note.components ?? null,
      componentMeanings: note.componentMeanings ?? null,
      mnemonicStory: note.mnemonicStory ?? null,
      sortOrder: note.sortOrder,
    })),
  });
}

async function upsertCourse({
  course,
  deckByName,
}: {
  course: {
    title: string;
    description: string;
    lessons: {
      title: string;
      description: string;
      deckName: string;
      sortOrder: number;
    }[];
  };
  deckByName: Map<string, { id: string }>;
}) {
  const existing = await prisma.course.findFirst({
    where: {
      title: course.title,
    },
  });
  const courseRecord = existing
    ? await prisma.course.update({
        where: {
          id: existing.id,
        },
        data: {
          description: course.description,
          isArchived: false,
        },
        select: {
          id: true,
        },
      })
    : await prisma.course.create({
        data: {
          title: course.title,
          description: course.description,
        },
        select: {
          id: true,
        },
      });

  for (const lesson of course.lessons) {
    const deck = deckByName.get(lesson.deckName);
    const existingLesson = await prisma.lesson.findFirst({
      where: {
        courseId: courseRecord.id,
        title: lesson.title,
      },
    });

    const lessonData = {
      title: lesson.title,
      description: lesson.description,
      sortOrder: lesson.sortOrder,
      deckId: deck?.id ?? null,
      isArchived: false,
    };

    if (existingLesson) {
      await prisma.lesson.update({
        where: {
          id: existingLesson.id,
        },
        data: lessonData,
      });
    } else {
      await prisma.lesson.create({
        data: {
          ...lessonData,
          courseId: courseRecord.id,
        },
      });
    }
  }
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

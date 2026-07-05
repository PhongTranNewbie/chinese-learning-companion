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

const demoVocabulary: DemoVocabulary[] = [
  {
    hanzi: "你好",
    pinyin: "ni3 hao3",
    meaning: "hello",
    deckName: "Daily Mini Practice",
    levelCode: "HSK1",
    partOfSpeech: "phrase",
    exampleChinese: "你好，我叫安娜。",
    examplePinyin: "ni3 hao3, wo3 jiao4 an1 na4.",
    exampleEnglish: "Hello, my name is Anna.",
    characterBreakdown: "你 + 好",
    wordFormationNote: "你 = you; 好 = good",
    memoryMnemonic: "A greeting starts by wishing good toward you.",
    dueOffsetDays: -1,
    intervalDays: 1,
    reviewCount: 2,
    characterNotes: [
      {
        character: "你",
        components: "亻 + 尔",
        componentMeanings: "亻 = person; 尔 = you/that",
        mnemonicStory: "A person component points toward you.",
        sortOrder: 1,
      },
      {
        character: "好",
        components: "女 + 子",
        componentMeanings: "女 = woman; 子 = child",
        mnemonicStory: "A calm family image helps you remember good.",
        sortOrder: 2,
      },
    ],
  },
  {
    hanzi: "谢谢",
    pinyin: "xie4 xie5",
    meaning: "thank you",
    deckName: "Daily Mini Practice",
    levelCode: "HSK1",
    partOfSpeech: "phrase",
    exampleChinese: "谢谢你的帮助。",
    examplePinyin: "xie4 xie5 ni3 de5 bang1 zhu4.",
    exampleEnglish: "Thank you for your help.",
    characterBreakdown: "谢 + 谢",
    wordFormationNote: "谢 carries the idea of thanks or apology.",
    memoryMnemonic: "Say thanks twice to make the gratitude easy to hear.",
    dueOffsetDays: 2,
    intervalDays: 4,
    reviewCount: 3,
    characterNotes: [
      {
        character: "谢",
        components: "讠 + 身 + 寸",
        componentMeanings: "讠 = speech; 身 = body; 寸 = small measure/hand",
        mnemonicStory: "Use speech, body, and a small gesture to show thanks.",
        sortOrder: 1,
      },
    ],
  },
  {
    hanzi: "学习",
    pinyin: "xue2 xi2",
    meaning: "to study; to learn",
    deckName: "HSK 1 Starter Path",
    levelCode: "HSK1",
    partOfSpeech: "verb",
    exampleChinese: "我每天学习中文。",
    examplePinyin: "wo3 mei3 tian1 xue2 xi2 zhong1 wen2.",
    exampleEnglish: "I study Chinese every day.",
    characterBreakdown: "学 + 习",
    wordFormationNote: "学 = learn; 习 = practice/repeat",
    memoryMnemonic: "Learning becomes real when study turns into repeated practice.",
    dueOffsetDays: -2,
    intervalDays: 2,
    reviewCount: 4,
    characterNotes: [
      {
        character: "学",
        components: "⺍ + 冖 + 子",
        componentMeanings: "⺍ = small marks; 冖 = cover; 子 = child",
        mnemonicStory: "A child under a study cover gathers little marks of knowledge.",
        sortOrder: 1,
      },
      {
        character: "习",
        components: "羽 simplified",
        componentMeanings: "羽 suggests wings or repeated movement.",
        mnemonicStory: "Practice is like wings flapping again and again.",
        sortOrder: 2,
      },
    ],
  },
  {
    hanzi: "朋友",
    pinyin: "peng2 you3",
    meaning: "friend",
    deckName: "HSK 1 Starter Path",
    levelCode: "HSK1",
    partOfSpeech: "noun",
    measureWord: "个",
    exampleChinese: "他是我的朋友。",
    examplePinyin: "ta1 shi4 wo3 de5 peng2 you3.",
    exampleEnglish: "He is my friend.",
    characterBreakdown: "朋 + 友",
    wordFormationNote: "朋 suggests companions; 友 means friend.",
    memoryMnemonic: "A friend is a companion who stands beside you.",
    dueOffsetDays: 5,
    intervalDays: 7,
    reviewCount: 5,
    characterNotes: [
      {
        character: "朋",
        components: "月 + 月",
        componentMeanings: "Two matching moon-like parts side by side.",
        mnemonicStory: "Two moons side by side feel like companions.",
        sortOrder: 1,
      },
      {
        character: "友",
        components: "又 + hand shape",
        componentMeanings: "又 can suggest a hand or repeated action.",
        mnemonicStory: "A friend's hand reaches out again.",
        sortOrder: 2,
      },
    ],
  },
  {
    hanzi: "妈妈",
    pinyin: "ma1 ma5",
    meaning: "mom; mother",
    deckName: "Family Words",
    levelCode: "HSK1",
    partOfSpeech: "noun",
    measureWord: "个",
    exampleChinese: "我妈妈喜欢喝茶。",
    examplePinyin: "wo3 ma1 ma5 xi3 huan5 he1 cha2.",
    exampleEnglish: "My mom likes drinking tea.",
    characterBreakdown: "妈 + 妈",
    wordFormationNote: "妈 means mother; repeating it makes the family word natural.",
    memoryMnemonic: "The mother character repeats like a child calling mom.",
    dueOffsetDays: -1,
    intervalDays: 1,
    reviewCount: 1,
    characterNotes: [
      {
        character: "妈",
        components: "女 + 马",
        componentMeanings: "女 = woman/female; 马 = horse",
        mnemonicStory: "Picture a mother calmly guiding a horse.",
        sortOrder: 1,
      },
    ],
  },
  {
    hanzi: "爸爸",
    pinyin: "ba4 ba5",
    meaning: "dad; father",
    deckName: "Family Words",
    levelCode: "HSK1",
    partOfSpeech: "noun",
    measureWord: "个",
    exampleChinese: "爸爸今天很忙。",
    examplePinyin: "ba4 ba5 jin1 tian1 hen3 mang2.",
    exampleEnglish: "Dad is very busy today.",
    characterBreakdown: "爸 + 爸",
    wordFormationNote: "爸 means father; repetition makes the everyday word.",
    memoryMnemonic: "The repeated sound feels like calling dad across the room.",
    dueOffsetDays: 3,
    intervalDays: 5,
    reviewCount: 2,
    characterNotes: [
      {
        character: "爸",
        components: "父 + 巴",
        componentMeanings: "父 = father; 巴 gives the ba sound clue",
        mnemonicStory: "Father plus the ba sound gives you dad.",
        sortOrder: 1,
      },
    ],
  },
  {
    hanzi: "喝茶",
    pinyin: "he1 cha2",
    meaning: "to drink tea",
    deckName: "Daily Mini Practice",
    levelCode: "HSK1",
    partOfSpeech: "verb phrase",
    exampleChinese: "下午我们一起喝茶。",
    examplePinyin: "xia4 wu3 wo3 men5 yi4 qi3 he1 cha2.",
    exampleEnglish: "In the afternoon we drink tea together.",
    characterBreakdown: "喝 + 茶",
    wordFormationNote: "喝 = drink; 茶 = tea",
    memoryMnemonic: "The action and the drink sit together: drink + tea.",
    dueOffsetDays: 7,
    intervalDays: 10,
    reviewCount: 6,
    characterNotes: [
      {
        character: "喝",
        components: "口 + 曷",
        componentMeanings: "口 = mouth; 曷 gives a sound clue",
        mnemonicStory: "A mouth component reminds you this is something you do with your mouth.",
        sortOrder: 1,
      },
      {
        character: "茶",
        components: "艹 + 人 + 木",
        componentMeanings: "艹 = grass/plant; 人 = person; 木 = tree/wood",
        mnemonicStory: "A person gathers leaves from a plant or tree for tea.",
        sortOrder: 2,
      },
    ],
  },
  {
    hanzi: "旧词",
    pinyin: "jiu4 ci2",
    meaning: "old word",
    deckName: "Archived Practice Set",
    levelCode: "HSK2",
    partOfSpeech: "noun",
    exampleChinese: "这个旧词已经归档了。",
    examplePinyin: "zhe4 ge4 jiu4 ci2 yi3 jing1 gui1 dang4 le5.",
    exampleEnglish: "This old word has already been archived.",
    characterBreakdown: "旧 + 词",
    wordFormationNote: "旧 = old; 词 = word",
    memoryMnemonic: "An old word belongs in the archived practice set.",
    dueOffsetDays: -10,
    intervalDays: 1,
    reviewCount: 1,
    isArchived: true,
    reviewStatus: "ARCHIVED",
  },
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

  for (const item of demoVocabulary) {
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

  const existing = await prisma.vocabularyItem.findFirst({
    where: {
      hanzi: item.hanzi,
      pinyin: item.pinyin,
      meaning: item.meaning,
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

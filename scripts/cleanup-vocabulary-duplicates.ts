import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface VocabularyWithRelations {
  id: string;
  userId: string | null;
  hanzi: string;
  pinyin: string;
  meaning: string;
  partOfSpeech: string | null;
  measureWord: string | null;
  exampleChinese: string | null;
  examplePinyin: string | null;
  exampleEnglish: string | null;
  characterBreakdown: string | null;
  wordFormationNote: string | null;
  memoryMnemonic: string | null;
  notes: string | null;
  createdAt: Date;
  deckId: string | null;
  levelId: string | null;
  isArchived: boolean;
  reviewCard: {
    id: string;
    reviewEvents: {
      id: string;
      reviewCardId: string;
    }[];
  } | null;
}

async function cleanupDuplicates() {
  console.log('='.repeat(70));
  console.log('🧹 VOCABULARY DUPLICATE CLEANUP');
  console.log('='.repeat(70));
  console.log();

  // Get all users
  const users = await prisma.user.findMany({
    select: { id: true, email: true },
  });

  console.log(`Found ${users.length} user(s) to check\n`);

  let totalDuplicateGroups = 0;
  let totalItemsDeleted = 0;
  let totalItemsMerged = 0;
  let totalReviewEventsMoved = 0;

  for (const user of users) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`Processing user: ${user.email || user.id}`);
    console.log('─'.repeat(70));

    // Get all vocabulary items for this user
    const vocabularyItems = await prisma.vocabularyItem.findMany({
      where: { userId: user.id },
      include: {
        reviewCard: {
          include: {
            reviewEvents: {
              select: { id: true, reviewCardId: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' }, // Keep oldest
    });

    // Group by (hanzi, pinyin)
    const groups = new Map<string, VocabularyWithRelations[]>();
    
    for (const item of vocabularyItems) {
      const key = `${item.hanzi}|${item.pinyin}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    }

    // Find duplicates
    const duplicateGroups = Array.from(groups.entries())
      .filter(([, items]) => items.length > 1);

    if (duplicateGroups.length === 0) {
      console.log('✅ No duplicates found for this user');
      continue;
    }

    console.log(`\n⚠️  Found ${duplicateGroups.length} duplicate group(s):\n`);

    for (const [key, duplicates] of duplicateGroups) {
      const [hanzi, pinyin] = key.split('|');
      console.log(`\n📦 Processing: ${hanzi} (${pinyin})`);
      console.log(`   Found ${duplicates.length} duplicate(s)`);

      // Choose survivor (oldest entry)
      const survivor = duplicates[0];
      const toDelete = duplicates.slice(1);

      console.log(`   ✅ Survivor: ID ${survivor.id.slice(0, 8)}... (created ${survivor.createdAt.toISOString().split('T')[0]})`);

      // Merge data from duplicates into survivor
      let mergedMeaning = survivor.meaning;
      let mergedPartOfSpeech = survivor.partOfSpeech;
      let mergedMeasureWord = survivor.measureWord;
      let mergedExampleChinese = survivor.exampleChinese;
      let mergedExamplePinyin = survivor.examplePinyin;
      let mergedExampleEnglish = survivor.exampleEnglish;
      let mergedCharacterBreakdown = survivor.characterBreakdown;
      let mergedWordFormationNote = survivor.wordFormationNote;
      let mergedMemoryMnemonic = survivor.memoryMnemonic;
      let mergedNotes = survivor.notes;

      for (const dup of toDelete) {
        // Merge meaning (prefer longer/richer)
        if (dup.meaning && dup.meaning.length > mergedMeaning.length) {
          mergedMeaning = dup.meaning;
          console.log(`   📝 Merging longer meaning from ID ${dup.id.slice(0, 8)}...`);
        }

        // Merge optional fields (prefer non-null)
        if (dup.partOfSpeech && !mergedPartOfSpeech) {
          mergedPartOfSpeech = dup.partOfSpeech;
        }

        if (dup.measureWord && !mergedMeasureWord) {
          mergedMeasureWord = dup.measureWord;
        }

        if (dup.exampleChinese && (!mergedExampleChinese || dup.exampleChinese.length > mergedExampleChinese.length)) {
          mergedExampleChinese = dup.exampleChinese;
          console.log(`   📝 Merging better Chinese example from ID ${dup.id.slice(0, 8)}...`);
        }

        if (dup.examplePinyin && (!mergedExamplePinyin || dup.examplePinyin.length > mergedExamplePinyin.length)) {
          mergedExamplePinyin = dup.examplePinyin;
        }

        if (dup.exampleEnglish && (!mergedExampleEnglish || dup.exampleEnglish.length > mergedExampleEnglish.length)) {
          mergedExampleEnglish = dup.exampleEnglish;
        }

        if (dup.characterBreakdown && (!mergedCharacterBreakdown || dup.characterBreakdown.length > mergedCharacterBreakdown.length)) {
          mergedCharacterBreakdown = dup.characterBreakdown;
        }

        if (dup.wordFormationNote && (!mergedWordFormationNote || dup.wordFormationNote.length > mergedWordFormationNote.length)) {
          mergedWordFormationNote = dup.wordFormationNote;
        }

        if (dup.memoryMnemonic && (!mergedMemoryMnemonic || dup.memoryMnemonic.length > mergedMemoryMnemonic.length)) {
          mergedMemoryMnemonic = dup.memoryMnemonic;
        }

        // Merge notes (combine if both exist)
        if (dup.notes) {
          if (!mergedNotes) {
            mergedNotes = dup.notes;
          } else if (!mergedNotes.includes(dup.notes)) {
            mergedNotes = `${mergedNotes}\n\n--- Merged from duplicate ---\n${dup.notes}`;
            console.log(`   📝 Combining notes from ID ${dup.id.slice(0, 8)}...`);
          }
        }
      }

      // Use transaction for atomic operations
      const reviewEventsMoved = await prisma.$transaction(async (tx) => {
        // Update survivor with merged data
        await tx.vocabularyItem.update({
          where: { id: survivor.id },
          data: {
            meaning: mergedMeaning,
            partOfSpeech: mergedPartOfSpeech,
            measureWord: mergedMeasureWord,
            exampleChinese: mergedExampleChinese,
            examplePinyin: mergedExamplePinyin,
            exampleEnglish: mergedExampleEnglish,
            characterBreakdown: mergedCharacterBreakdown,
            wordFormationNote: mergedWordFormationNote,
            memoryMnemonic: mergedMemoryMnemonic,
            notes: mergedNotes,
          },
        });

        console.log(`   ✏️  Updated survivor with merged data`);

        // Reassign ReviewEvents from duplicate ReviewCards to survivor's ReviewCard
        let eventsMoved = 0;

        for (const dup of toDelete) {
          if (dup.reviewCard && dup.reviewCard.reviewEvents.length > 0) {
            // Ensure survivor has a review card
            let survivorReviewCardId = survivor.reviewCard?.id;

            if (!survivorReviewCardId) {
              // Create review card for survivor if it doesn't exist
              const newReviewCard = await tx.reviewCard.create({
                data: {
                  vocabularyItemId: survivor.id,
                  dueAt: new Date(),
                },
              });
              survivorReviewCardId = newReviewCard.id;
              console.log(`   🆕 Created review card for survivor`);
            }

            // Move review events to survivor's review card
            const result = await tx.reviewEvent.updateMany({
              where: { reviewCardId: dup.reviewCard.id },
              data: { reviewCardId: survivorReviewCardId },
            });

            eventsMoved += result.count;
            console.log(`   🔄 Moved ${result.count} review event(s) from duplicate ID ${dup.id.slice(0, 8)}...`);
          }

          // Delete duplicate's review card (if exists)
          if (dup.reviewCard) {
            await tx.reviewCard.delete({
              where: { id: dup.reviewCard.id },
            });
          }

          // Delete duplicate vocabulary item
          await tx.vocabularyItem.delete({
            where: { id: dup.id },
          });
        }

        console.log(`   🗑️  Deleted ${toDelete.length} duplicate(s)`);

        return eventsMoved;
      });

      if (reviewEventsMoved > 0) {
        console.log(`   ✅ Total review events preserved: ${reviewEventsMoved}`);
      }

      totalDuplicateGroups += 1;
      totalItemsDeleted += toDelete.length;
      totalItemsMerged += 1;
      totalReviewEventsMoved += reviewEventsMoved;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ CLEANUP COMPLETE');
  console.log('='.repeat(70));
  console.log(`\n📊 Summary:`);
  console.log(`   Duplicate groups processed: ${totalDuplicateGroups}`);
  console.log(`   Vocabulary items merged: ${totalItemsMerged}`);
  console.log(`   Duplicate items deleted: ${totalItemsDeleted}`);
  console.log(`   Review events preserved: ${totalReviewEventsMoved}`);
  console.log();

  // Verify no duplicates remain
  console.log('🔍 Verifying cleanup...\n');
  
  let remainingDuplicates = 0;
  
  for (const user of users) {
    const items = await prisma.vocabularyItem.findMany({
      where: { userId: user.id },
      select: { hanzi: true, pinyin: true },
    });

    const keys = new Map<string, number>();
    for (const item of items) {
      const key = `${item.hanzi}|${item.pinyin}`;
      keys.set(key, (keys.get(key) || 0) + 1);
    }

    const dupes = Array.from(keys.entries()).filter(([, count]) => count > 1);
    remainingDuplicates += dupes.length;
  }

  if (remainingDuplicates === 0) {
    console.log('✅ Verification passed: No duplicates remain');
    console.log('✅ Database is ready for unique constraint migration\n');
  } else {
    console.log(`⚠️  Warning: ${remainingDuplicates} duplicate group(s) still remain\n`);
  }
}

cleanupDuplicates()
  .then(() => {
    console.log('✅ Script completed successfully\n');
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    prisma.$disconnect();
    process.exit(1);
  });
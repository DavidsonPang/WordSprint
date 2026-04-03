import { addDays } from 'date-fns'

/**
 * 艾宾浩斯遗忘曲线复习间隔
 * masteryLevel: 0=不会, 1=模糊, 2=掌握
 */
export function getReviewInterval(reviewCount: number, masteryLevel: number): number {
  if (masteryLevel === 0) {
    // 不会：重置为1天后复习
    return 1
  }

  if (masteryLevel === 1) {
    // 模糊：缩短间隔
    const intervals = [1, 2, 3, 5, 10]
    return intervals[Math.min(reviewCount, intervals.length - 1)]
  }

  // 掌握：标准艾宾浩斯曲线
  const intervals = [1, 2, 4, 7, 15, 30]
  return intervals[Math.min(reviewCount, intervals.length - 1)]
}

/**
 * 计算下次复习日期
 */
export function calculateNextReviewDate(
  currentDate: Date,
  reviewCount: number,
  masteryLevel: number
): Date {
  const interval = getReviewInterval(reviewCount, masteryLevel)
  return addDays(currentDate, interval)
}

/**
 * 更新单词的复习计划
 */
export async function updateReviewSchedule(
  db: any,
  learnerId: number,
  wordId: number,
  masteryLevel: number
) {
  // 查找现有复习计划
  const existing = await db.reviewSchedule.findUnique({
    where: {
      learnerId_wordId: {
        learnerId,
        wordId,
      },
    },
  })

  const now = new Date()
  const reviewCount = existing ? existing.reviewCount + 1 : 0
  const nextReviewDate = calculateNextReviewDate(now, reviewCount, masteryLevel)

  // 如果标记为"不会"，重置复习次数
  const finalReviewCount = masteryLevel === 0 ? 0 : reviewCount

  await db.reviewSchedule.upsert({
    where: {
      learnerId_wordId: {
        learnerId,
        wordId,
      },
    },
    create: {
      learnerId,
      wordId,
      nextReviewDate,
      reviewCount: finalReviewCount,
      lastReviewDate: now,
    },
    update: {
      nextReviewDate,
      reviewCount: finalReviewCount,
      lastReviewDate: now,
    },
  })

  // 同时更新单词的掌握程度
  await db.word.update({
    where: { id: wordId },
    data: { masteryLevel },
  })

  return nextReviewDate
}

import { db } from '@/lib/db'
import { addDays, subDays } from 'date-fns'

describe('Review Due Words API', () => {
  let testLearnerId: number
  let testWordbookId: number
  let testWordId1: number
  let testWordId2: number
  let testWordId3: number

  beforeAll(async () => {
    // Create test data
    const learner = await db.learner.create({ data: { name: 'Test Learner - Due' } })
    testLearnerId = learner.id

    const wordbook = await db.wordbook.create({
      data: { name: 'Test Wordbook - Due', type: 'custom' },
    })
    testWordbookId = wordbook.id

    const word1 = await db.word.create({
      data: {
        learnerId: testLearnerId,
        wordbookId: testWordbookId,
        word: 'apple',
        meaningCn: 'n. 苹果',
        masteryLevel: 0,
      },
    })
    testWordId1 = word1.id

    const word2 = await db.word.create({
      data: {
        learnerId: testLearnerId,
        wordbookId: testWordbookId,
        word: 'book',
        meaningCn: 'n. 书',
        masteryLevel: 1,
      },
    })
    testWordId2 = word2.id

    const word3 = await db.word.create({
      data: {
        learnerId: testLearnerId,
        wordbookId: testWordbookId,
        word: 'cat',
        meaningCn: 'n. 猫',
        masteryLevel: 2,
      },
    })
    testWordId3 = word3.id
  })

  beforeEach(async () => {
    // Clean up review schedules before each test
    await db.reviewSchedule.deleteMany({
      where: { learnerId: testLearnerId },
    })
  })

  describe('GET /api/review/due', () => {
    it('should return words due for review', async () => {
      const now = new Date()

      // Create schedules with different due dates
      await db.reviewSchedule.create({
        data: {
          learnerId: testLearnerId,
          wordId: testWordId1,
          nextReviewDate: subDays(now, 1), // Due yesterday
          reviewCount: 2,
          lastReviewDate: subDays(now, 3),
        },
      })

      await db.reviewSchedule.create({
        data: {
          learnerId: testLearnerId,
          wordId: testWordId2,
          nextReviewDate: now, // Due today
          reviewCount: 1,
          lastReviewDate: subDays(now, 2),
        },
      })

      await db.reviewSchedule.create({
        data: {
          learnerId: testLearnerId,
          wordId: testWordId3,
          nextReviewDate: addDays(now, 1), // Due tomorrow (not yet)
          reviewCount: 0,
          lastReviewDate: now,
        },
      })

      const response = await fetch(
        `http://localhost:3000/api/review/due?learnerId=${testLearnerId}`
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.words).toBeDefined()
      expect(data.words.length).toBe(2) // Only word1 and word2 are due
      expect(data.words.some((w: any) => w.word === 'apple')).toBe(true)
      expect(data.words.some((w: any) => w.word === 'book')).toBe(true)
      expect(data.words.some((w: any) => w.word === 'cat')).toBe(false)
    })

    it('should return words ordered by nextReviewDate ascending', async () => {
      const now = new Date()

      await db.reviewSchedule.create({
        data: {
          learnerId: testLearnerId,
          wordId: testWordId1,
          nextReviewDate: subDays(now, 5),
          reviewCount: 2,
          lastReviewDate: subDays(now, 10),
        },
      })

      await db.reviewSchedule.create({
        data: {
          learnerId: testLearnerId,
          wordId: testWordId2,
          nextReviewDate: subDays(now, 1),
          reviewCount: 1,
          lastReviewDate: subDays(now, 3),
        },
      })

      const response = await fetch(
        `http://localhost:3000/api/review/due?learnerId=${testLearnerId}`
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.words).toHaveLength(2)
      // First word should be the one due longer ago (word1)
      expect(data.words[0].word).toBe('apple')
      expect(data.words[1].word).toBe('book')
    })

    it('should filter by wordbookId when provided', async () => {
      const now = new Date()

      // Create another wordbook
      const wordbook2 = await db.wordbook.create({
        data: { name: 'Another Wordbook', type: 'custom' },
      })

      const word4 = await db.word.create({
        data: {
          learnerId: testLearnerId,
          wordbookId: wordbook2.id,
          word: 'dog',
          meaningCn: 'n. 狗',
          masteryLevel: 0,
        },
      })

      // Create schedules for both wordbooks
      await db.reviewSchedule.create({
        data: {
          learnerId: testLearnerId,
          wordId: testWordId1,
          nextReviewDate: subDays(now, 1),
          reviewCount: 0,
          lastReviewDate: subDays(now, 2),
        },
      })

      await db.reviewSchedule.create({
        data: {
          learnerId: testLearnerId,
          wordId: word4.id,
          nextReviewDate: subDays(now, 1),
          reviewCount: 0,
          lastReviewDate: subDays(now, 2),
        },
      })

      // Query with specific wordbookId
      const response = await fetch(
        `http://localhost:3000/api/review/due?learnerId=${testLearnerId}&wordbookId=${testWordbookId}`
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.words).toHaveLength(1)
      expect(data.words[0].word).toBe('apple')

      // Clean up
      await db.reviewSchedule.deleteMany({ where: { wordId: word4.id } })
      await db.word.delete({ where: { id: word4.id } })
      await db.wordbook.delete({ where: { id: wordbook2.id } })
    })

    it('should include word details and wordbook name', async () => {
      const now = new Date()

      await db.reviewSchedule.create({
        data: {
          learnerId: testLearnerId,
          wordId: testWordId1,
          nextReviewDate: subDays(now, 1),
          reviewCount: 3,
          lastReviewDate: subDays(now, 8),
        },
      })

      const response = await fetch(
        `http://localhost:3000/api/review/due?learnerId=${testLearnerId}`
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.words).toHaveLength(1)
      const word = data.words[0]
      expect(word.word).toBe('apple')
      expect(word.meaningCn).toBe('n. 苹果')
      expect(word.nextReviewDate).toBeDefined()
      expect(word.reviewCount).toBe(3)
      expect(word.wordbook).toBeDefined()
      expect(word.wordbook.name).toBe('Test Wordbook - Due')
    })

    it('should return empty array if no words are due', async () => {
      const now = new Date()

      // All schedules in the future
      await db.reviewSchedule.create({
        data: {
          learnerId: testLearnerId,
          wordId: testWordId1,
          nextReviewDate: addDays(now, 1),
          reviewCount: 0,
          lastReviewDate: now,
        },
      })

      const response = await fetch(
        `http://localhost:3000/api/review/due?learnerId=${testLearnerId}`
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.words).toEqual([])
    })

    it('should return 400 if learnerId is missing', async () => {
      const response = await fetch('http://localhost:3000/api/review/due')
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('learnerId is required')
    })

    it('should return 400 if learnerId is invalid', async () => {
      const response = await fetch('http://localhost:3000/api/review/due?learnerId=invalid')
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid learnerId')
    })

    it('should return 400 if wordbookId is invalid', async () => {
      const response = await fetch(
        `http://localhost:3000/api/review/due?learnerId=${testLearnerId}&wordbookId=invalid`
      )
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid wordbookId')
    })

    it('should return empty array for non-existent learnerId', async () => {
      const response = await fetch('http://localhost:3000/api/review/due?learnerId=99999')
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.words).toEqual([])
    })
  })

  afterAll(async () => {
    // Clean up test data
    await db.reviewSchedule.deleteMany({ where: { learnerId: testLearnerId } })
    await db.word.deleteMany({ where: { learnerId: testLearnerId } })
    await db.wordbook.delete({ where: { id: testWordbookId } })
    await db.learner.delete({ where: { id: testLearnerId } })
    await db.$disconnect()
  })
})

import { db } from '@/lib/db'
import { subDays } from 'date-fns'

describe('Learning Stats API', () => {
  let testLearnerId: number
  let testWordId1: number
  let testWordId2: number
  let testWordId3: number
  let testWordbookId: number

  beforeAll(async () => {
    // Create test data
    const learner = await db.learner.create({ data: { name: 'Test Learner - Stats' } })
    testLearnerId = learner.id

    const wordbook = await db.wordbook.create({
      data: { name: 'Test Wordbook - Stats', type: 'custom' },
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
    // Clean up learning records before each test
    await db.learningRecord.deleteMany({
      where: { learnerId: testLearnerId },
    })
  })

  describe('GET /api/learning/stats', () => {
    it('should return basic statistics', async () => {
      const now = new Date()

      // Create various learning records
      await db.learningRecord.create({
        data: {
          learnerId: testLearnerId,
          wordId: testWordId1,
          studyType: 'card',
          timestamp: now,
        },
      })

      await db.learningRecord.create({
        data: {
          learnerId: testLearnerId,
          wordId: testWordId1,
          studyType: 'test',
          testType: 'word2meaning',
          isCorrect: true,
          timestamp: now,
        },
      })

      await db.learningRecord.create({
        data: {
          learnerId: testLearnerId,
          wordId: testWordId2,
          studyType: 'test',
          testType: 'spell',
          isCorrect: false,
          timestamp: now,
        },
      })

      const response = await fetch(
        `http://localhost:3000/api/learning/stats?learnerId=${testLearnerId}`
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.stats).toBeDefined()
      expect(data.stats.totalSessions).toBe(3)
      expect(data.stats.totalWords).toBe(2) // word1 and word2
      expect(data.stats.testAccuracy).toBeDefined()
      expect(data.stats.testAccuracy.correct).toBe(1)
      expect(data.stats.testAccuracy.total).toBe(2)
      expect(data.stats.testAccuracy.percentage).toBe(50)
    })

    it('should calculate test accuracy correctly with all correct', async () => {
      await db.learningRecord.create({
        data: {
          learnerId: testLearnerId,
          wordId: testWordId1,
          studyType: 'test',
          testType: 'word2meaning',
          isCorrect: true,
        },
      })

      await db.learningRecord.create({
        data: {
          learnerId: testLearnerId,
          wordId: testWordId2,
          studyType: 'test',
          testType: 'spell',
          isCorrect: true,
        },
      })

      const response = await fetch(
        `http://localhost:3000/api/learning/stats?learnerId=${testLearnerId}`
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.stats.testAccuracy.correct).toBe(2)
      expect(data.stats.testAccuracy.total).toBe(2)
      expect(data.stats.testAccuracy.percentage).toBe(100)
    })

    it('should return zero test accuracy when no tests', async () => {
      await db.learningRecord.create({
        data: {
          learnerId: testLearnerId,
          wordId: testWordId1,
          studyType: 'card',
        },
      })

      const response = await fetch(
        `http://localhost:3000/api/learning/stats?learnerId=${testLearnerId}`
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.stats.testAccuracy.correct).toBe(0)
      expect(data.stats.testAccuracy.total).toBe(0)
      expect(data.stats.testAccuracy.percentage).toBe(0)
    })

    it('should include recent activity for last 7 days', async () => {
      const now = new Date()

      // Records from different days
      await db.learningRecord.create({
        data: {
          learnerId: testLearnerId,
          wordId: testWordId1,
          studyType: 'card',
          timestamp: now,
        },
      })

      await db.learningRecord.create({
        data: {
          learnerId: testLearnerId,
          wordId: testWordId2,
          studyType: 'test',
          testType: 'word2meaning',
          isCorrect: true,
          timestamp: subDays(now, 2),
        },
      })

      await db.learningRecord.create({
        data: {
          learnerId: testLearnerId,
          wordId: testWordId3,
          studyType: 'card',
          timestamp: subDays(now, 5),
        },
      })

      // This should not be included (8 days ago)
      await db.learningRecord.create({
        data: {
          learnerId: testLearnerId,
          wordId: testWordId1,
          studyType: 'card',
          timestamp: subDays(now, 8),
        },
      })

      const response = await fetch(
        `http://localhost:3000/api/learning/stats?learnerId=${testLearnerId}`
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.stats.recentActivity).toBeDefined()
      expect(data.stats.recentActivity.last7Days).toBe(3)
    })

    it('should filter by date range', async () => {
      const now = new Date()

      await db.learningRecord.create({
        data: {
          learnerId: testLearnerId,
          wordId: testWordId1,
          studyType: 'card',
          timestamp: subDays(now, 1),
        },
      })

      await db.learningRecord.create({
        data: {
          learnerId: testLearnerId,
          wordId: testWordId2,
          studyType: 'test',
          testType: 'word2meaning',
          isCorrect: true,
          timestamp: subDays(now, 5),
        },
      })

      await db.learningRecord.create({
        data: {
          learnerId: testLearnerId,
          wordId: testWordId3,
          studyType: 'card',
          timestamp: subDays(now, 10),
        },
      })

      const startDate = subDays(now, 7).toISOString()
      const endDate = now.toISOString()

      const response = await fetch(
        `http://localhost:3000/api/learning/stats?learnerId=${testLearnerId}&startDate=${startDate}&endDate=${endDate}`
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      // Should only include records from last 7 days (2 records)
      expect(data.stats.totalSessions).toBe(2)
      expect(data.stats.totalWords).toBe(2)
    })

    it('should return empty stats for non-existent learner', async () => {
      const response = await fetch('http://localhost:3000/api/learning/stats?learnerId=99999')

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.stats.totalSessions).toBe(0)
      expect(data.stats.totalWords).toBe(0)
      expect(data.stats.testAccuracy.total).toBe(0)
    })

    it('should return 400 if learnerId is missing', async () => {
      const response = await fetch('http://localhost:3000/api/learning/stats')
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('learnerId is required')
    })

    it('should return 400 if learnerId is invalid', async () => {
      const response = await fetch('http://localhost:3000/api/learning/stats?learnerId=invalid')
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid learnerId')
    })

    it('should return 400 if startDate is invalid', async () => {
      const response = await fetch(
        `http://localhost:3000/api/learning/stats?learnerId=${testLearnerId}&startDate=invalid`
      )
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid startDate')
    })

    it('should return 400 if endDate is invalid', async () => {
      const response = await fetch(
        `http://localhost:3000/api/learning/stats?learnerId=${testLearnerId}&endDate=invalid`
      )
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid endDate')
    })
  })

  afterAll(async () => {
    // Clean up test data
    await db.learningRecord.deleteMany({ where: { learnerId: testLearnerId } })
    await db.word.deleteMany({ where: { learnerId: testLearnerId } })
    await db.wordbook.delete({ where: { id: testWordbookId } })
    await db.learner.delete({ where: { id: testLearnerId } })
    await db.$disconnect()
  })
})

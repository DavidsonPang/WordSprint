import { db } from '@/lib/db'
import { addDays } from 'date-fns'

describe('Review Schedule API', () => {
  let testLearnerId: number
  let testWordbookId: number
  let testWordId: number

  beforeAll(async () => {
    // Create test data
    const learner = await db.learner.create({ data: { name: 'Test Learner - Schedule' } })
    testLearnerId = learner.id

    const wordbook = await db.wordbook.create({
      data: { name: 'Test Wordbook - Schedule', type: 'custom' },
    })
    testWordbookId = wordbook.id

    const word = await db.word.create({
      data: {
        learnerId: testLearnerId,
        wordbookId: testWordbookId,
        word: 'apple',
        meaningCn: 'n. 苹果',
        masteryLevel: 0,
      },
    })
    testWordId = word.id
  })

  beforeEach(async () => {
    // Clean up review schedules before each test
    await db.reviewSchedule.deleteMany({
      where: { learnerId: testLearnerId },
    })
  })

  describe('POST /api/review/schedule', () => {
    it('should create a new review schedule', async () => {
      const response = await fetch('http://localhost:3000/api/review/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learnerId: testLearnerId,
          wordId: testWordId,
          masteryLevel: 2,
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.nextReviewDate).toBeDefined()

      // Verify the schedule was created
      const schedule = await db.reviewSchedule.findUnique({
        where: {
          learnerId_wordId: {
            learnerId: testLearnerId,
            wordId: testWordId,
          },
        },
      })
      expect(schedule).not.toBeNull()
      expect(schedule?.reviewCount).toBe(0)
    })

    it('should update existing review schedule', async () => {
      // Create initial schedule
      await fetch('http://localhost:3000/api/review/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learnerId: testLearnerId,
          wordId: testWordId,
          masteryLevel: 2,
        }),
      })

      // Update with another review
      const response = await fetch('http://localhost:3000/api/review/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learnerId: testLearnerId,
          wordId: testWordId,
          masteryLevel: 2,
        }),
      })

      expect(response.status).toBe(200)

      // Verify review count was incremented
      const schedule = await db.reviewSchedule.findUnique({
        where: {
          learnerId_wordId: {
            learnerId: testLearnerId,
            wordId: testWordId,
          },
        },
      })
      expect(schedule?.reviewCount).toBe(1)
    })

    it('should reset reviewCount when masteryLevel is 0', async () => {
      // Create schedule with some review count
      await db.reviewSchedule.create({
        data: {
          learnerId: testLearnerId,
          wordId: testWordId,
          reviewCount: 5,
          nextReviewDate: addDays(new Date(), 15),
          lastReviewDate: new Date(),
        },
      })

      // Mark as "不会" (masteryLevel=0)
      const response = await fetch('http://localhost:3000/api/review/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learnerId: testLearnerId,
          wordId: testWordId,
          masteryLevel: 0,
        }),
      })

      expect(response.status).toBe(200)

      // Verify review count was reset
      const schedule = await db.reviewSchedule.findUnique({
        where: {
          learnerId_wordId: {
            learnerId: testLearnerId,
            wordId: testWordId,
          },
        },
      })
      expect(schedule?.reviewCount).toBe(0)
    })

    it('should update word masteryLevel', async () => {
      const response = await fetch('http://localhost:3000/api/review/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learnerId: testLearnerId,
          wordId: testWordId,
          masteryLevel: 2,
        }),
      })

      expect(response.status).toBe(200)

      // Verify word's masteryLevel was updated
      const word = await db.word.findUnique({
        where: { id: testWordId },
      })
      expect(word?.masteryLevel).toBe(2)
    })

    it('should return 400 if learnerId is missing', async () => {
      const response = await fetch('http://localhost:3000/api/review/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordId: testWordId,
          masteryLevel: 2,
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('should return 400 if wordId is missing', async () => {
      const response = await fetch('http://localhost:3000/api/review/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learnerId: testLearnerId,
          masteryLevel: 2,
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Validation failed')
    })

    it('should return 400 if masteryLevel is missing', async () => {
      const response = await fetch('http://localhost:3000/api/review/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learnerId: testLearnerId,
          wordId: testWordId,
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Validation failed')
    })

    it('should return 400 if masteryLevel is out of range', async () => {
      const response = await fetch('http://localhost:3000/api/review/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learnerId: testLearnerId,
          wordId: testWordId,
          masteryLevel: 5,
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('should return 400 if masteryLevel is negative', async () => {
      const response = await fetch('http://localhost:3000/api/review/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learnerId: testLearnerId,
          wordId: testWordId,
          masteryLevel: -1,
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Validation failed')
    })
  })

  afterAll(async () => {
    // Clean up test data
    await db.reviewSchedule.deleteMany({ where: { learnerId: testLearnerId } })
    await db.word.delete({ where: { id: testWordId } })
    await db.wordbook.delete({ where: { id: testWordbookId } })
    await db.learner.delete({ where: { id: testLearnerId } })
    await db.$disconnect()
  })
})

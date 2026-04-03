import { db } from '@/lib/db'

describe('Learning Records API', () => {
  let testLearnerId: number
  let testWordId1: number
  let testWordId2: number
  let testWordbookId: number

  beforeAll(async () => {
    // Create test data
    const learner = await db.learner.create({ data: { name: 'Test Learner - Records' } })
    testLearnerId = learner.id

    const wordbook = await db.wordbook.create({
      data: { name: 'Test Wordbook - Records', type: 'custom' },
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
  })

  beforeEach(async () => {
    // Clean up learning records before each test
    await db.learningRecord.deleteMany({
      where: { learnerId: testLearnerId },
    })
  })

  describe('POST /api/learning/records', () => {
    it('should create a card learning record', async () => {
      const response = await fetch('http://localhost:3000/api/learning/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learnerId: testLearnerId,
          wordId: testWordId1,
          studyType: 'card',
        }),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.record).toHaveProperty('id')
      expect(data.record.learnerId).toBe(testLearnerId)
      expect(data.record.wordId).toBe(testWordId1)
      expect(data.record.studyType).toBe('card')
      expect(data.record.testType).toBeNull()
      expect(data.record.isCorrect).toBeNull()
    })

    it('should create a test learning record with all fields', async () => {
      const response = await fetch('http://localhost:3000/api/learning/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learnerId: testLearnerId,
          wordId: testWordId1,
          studyType: 'test',
          testType: 'word2meaning',
          isCorrect: true,
        }),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.record.studyType).toBe('test')
      expect(data.record.testType).toBe('word2meaning')
      expect(data.record.isCorrect).toBe(true)
    })

    it('should return 400 if learnerId is missing', async () => {
      const response = await fetch('http://localhost:3000/api/learning/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordId: testWordId1,
          studyType: 'card',
        }),
      })

      expect(response.status).toBe(400)
    })

    it('should return 400 if wordId is missing', async () => {
      const response = await fetch('http://localhost:3000/api/learning/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learnerId: testLearnerId,
          studyType: 'card',
        }),
      })

      expect(response.status).toBe(400)
    })

    it('should return 400 if studyType is invalid', async () => {
      const response = await fetch('http://localhost:3000/api/learning/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learnerId: testLearnerId,
          wordId: testWordId1,
          studyType: 'invalid',
        }),
      })

      expect(response.status).toBe(400)
    })

    it('should return 400 if testType is invalid', async () => {
      const response = await fetch('http://localhost:3000/api/learning/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learnerId: testLearnerId,
          wordId: testWordId1,
          studyType: 'test',
          testType: 'invalid',
        }),
      })

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/learning/records', () => {
    beforeEach(async () => {
      // Create test records
      await db.learningRecord.create({
        data: {
          learnerId: testLearnerId,
          wordId: testWordId1,
          studyType: 'card',
        },
      })

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
          isCorrect: false,
        },
      })
    })

    it('should return all records for a learner', async () => {
      const response = await fetch(
        `http://localhost:3000/api/learning/records?learnerId=${testLearnerId}`
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.records).toBeDefined()
      expect(data.records.length).toBe(3)
    })

    it('should filter records by wordId', async () => {
      const response = await fetch(
        `http://localhost:3000/api/learning/records?learnerId=${testLearnerId}&wordId=${testWordId1}`
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.records).toHaveLength(2)
      expect(data.records.every((r: any) => r.wordId === testWordId1)).toBe(true)
    })

    it('should filter records by studyType', async () => {
      const response = await fetch(
        `http://localhost:3000/api/learning/records?learnerId=${testLearnerId}&studyType=test`
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.records).toHaveLength(2)
      expect(data.records.every((r: any) => r.studyType === 'test')).toBe(true)
    })

    it('should return records ordered by timestamp descending', async () => {
      const response = await fetch(
        `http://localhost:3000/api/learning/records?learnerId=${testLearnerId}`
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.records.length).toBeGreaterThan(1)

      // Check that timestamps are in descending order
      for (let i = 0; i < data.records.length - 1; i++) {
        const current = new Date(data.records[i].timestamp)
        const next = new Date(data.records[i + 1].timestamp)
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime())
      }
    })

    it('should include word details in records', async () => {
      const response = await fetch(
        `http://localhost:3000/api/learning/records?learnerId=${testLearnerId}`
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.records[0].word).toBeDefined()
      expect(data.records[0].word.word).toBeDefined()
      expect(data.records[0].word.meaningCn).toBeDefined()
    })

    it('should return 400 if learnerId is missing', async () => {
      const response = await fetch('http://localhost:3000/api/learning/records')
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('learnerId is required')
    })

    it('should return 400 if learnerId is invalid', async () => {
      const response = await fetch('http://localhost:3000/api/learning/records?learnerId=invalid')
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid learnerId')
    })

    it('should return 400 if wordId is invalid', async () => {
      const response = await fetch(
        `http://localhost:3000/api/learning/records?learnerId=${testLearnerId}&wordId=invalid`
      )
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid wordId')
    })

    it('should return empty array for non-existent learnerId', async () => {
      const response = await fetch('http://localhost:3000/api/learning/records?learnerId=99999')
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.records).toEqual([])
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

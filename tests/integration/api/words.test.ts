import { db } from '@/lib/db'

describe('Words API', () => {
  let testWordbookId: number
  let testLearnerId: number
  let testWordId: number

  beforeAll(async () => {
    // Create test data
    const learner = await db.learner.create({ data: { name: 'Test Learner' } })
    testLearnerId = learner.id

    const wordbook = await db.wordbook.create({
      data: { name: 'Test Wordbook', type: 'custom' },
    })
    testWordbookId = wordbook.id
  })

  beforeEach(async () => {
    // Clean up words before each test
    await db.word.deleteMany({
      where: { learnerId: testLearnerId },
    })
  })

  describe('POST /api/words', () => {
    it('should create a new word', async () => {
      const response = await fetch('http://localhost:3000/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordbookId: testWordbookId,
          learnerId: testLearnerId,
          word: 'apple',
          phoneticUs: '/ˈæpl/',
          phoneticUk: '/ˈæpl/',
          meaningCn: 'n. 苹果',
          meaningEn: 'n. a round fruit',
          examples: JSON.stringify([{ en: 'I ate an apple.', cn: '我吃了一个苹果。' }]),
          masteryLevel: 0,
        }),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.word.word).toBe('apple')
      expect(data.word.learnerId).toBe(testLearnerId)
      expect(data.word.wordbookId).toBe(testWordbookId)
      expect(data.word.masteryLevel).toBe(0)
      testWordId = data.word.id
    })

    it('should return 400 if word is missing', async () => {
      const response = await fetch('http://localhost:3000/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordbookId: testWordbookId,
          learnerId: testLearnerId,
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('should return 400 if learnerId is missing', async () => {
      const response = await fetch('http://localhost:3000/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordbookId: testWordbookId,
          word: 'apple',
        }),
      })

      expect(response.status).toBe(400)
    })

    it('should return 400 if wordbookId is missing', async () => {
      const response = await fetch('http://localhost:3000/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learnerId: testLearnerId,
          word: 'apple',
        }),
      })

      expect(response.status).toBe(400)
    })

    it('should default masteryLevel to 0 if not provided', async () => {
      const response = await fetch('http://localhost:3000/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordbookId: testWordbookId,
          learnerId: testLearnerId,
          word: 'book',
        }),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.word.masteryLevel).toBe(0)
    })

    it('should reject invalid JSON in examples', async () => {
      const response = await fetch('http://localhost:3000/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordbookId: testWordbookId,
          learnerId: testLearnerId,
          word: 'test',
          examples: 'not valid json',
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
      expect(data.error).toContain('valid JSON')
    })

    it('should return 404 when creating word with non-existent wordbookId', async () => {
      const response = await fetch('http://localhost:3000/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordbookId: 99999,
          learnerId: testLearnerId,
          word: 'test',
        }),
      })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Wordbook not found')
    })

    it('should return 404 when creating word with non-existent learnerId', async () => {
      const response = await fetch('http://localhost:3000/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordbookId: testWordbookId,
          learnerId: 99999,
          word: 'test',
        }),
      })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Learner not found')
    })
  })

  describe('GET /api/words', () => {
    beforeEach(async () => {
      // Create test words
      await db.word.create({
        data: {
          learnerId: testLearnerId,
          wordbookId: testWordbookId,
          word: 'apple',
          meaningCn: '苹果',
          masteryLevel: 0,
        },
      })
      await db.word.create({
        data: {
          learnerId: testLearnerId,
          wordbookId: testWordbookId,
          word: 'book',
          meaningCn: '书',
          masteryLevel: 1,
        },
      })
      await db.word.create({
        data: {
          learnerId: testLearnerId,
          wordbookId: testWordbookId,
          word: 'cat',
          meaningCn: '猫',
          masteryLevel: 2,
        },
      })
    })

    it('should return all words for a wordbook and learner', async () => {
      const response = await fetch(
        `http://localhost:3000/api/words?wordbookId=${testWordbookId}&learnerId=${testLearnerId}`
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.words).toHaveLength(3)
      expect(data.words[0].word).toBeDefined()
    })

    it('should filter by masteryLevel', async () => {
      const response = await fetch(
        `http://localhost:3000/api/words?wordbookId=${testWordbookId}&learnerId=${testLearnerId}&masteryLevel=2`
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.words).toHaveLength(1)
      expect(data.words[0].word).toBe('cat')
      expect(data.words[0].masteryLevel).toBe(2)
    })

    it('should require wordbookId parameter', async () => {
      const response = await fetch(`http://localhost:3000/api/words?learnerId=${testLearnerId}`)
      expect(response.status).toBe(400)
    })

    it('should require learnerId parameter', async () => {
      const response = await fetch(`http://localhost:3000/api/words?wordbookId=${testWordbookId}`)
      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/words/[id]', () => {
    beforeEach(async () => {
      const word = await db.word.create({
        data: {
          learnerId: testLearnerId,
          wordbookId: testWordbookId,
          word: 'apple',
          phoneticUs: '/ˈæpl/',
          phoneticUk: '/ˈæpl/',
          meaningCn: 'n. 苹果',
          meaningEn: 'n. a round fruit',
          examples: JSON.stringify([
            { en: 'I ate an apple.', cn: '我吃了一个苹果。' },
            { en: 'The apple is red.', cn: '这个苹果是红色的。' },
          ]),
          masteryLevel: 0,
        },
      })
      testWordId = word.id
    })

    it('should return a single word with examples parsed', async () => {
      const response = await fetch(`http://localhost:3000/api/words/${testWordId}`)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.word.id).toBe(testWordId)
      expect(data.word.word).toBe('apple')
      expect(data.word.meaningCn).toBe('n. 苹果')
      expect(Array.isArray(data.word.examples)).toBe(true)
      expect(data.word.examples).toHaveLength(2)
      expect(data.word.examples[0].en).toBe('I ate an apple.')
      expect(data.word.examples[0].cn).toBe('我吃了一个苹果。')
    })

    it('should handle null examples gracefully', async () => {
      const word = await db.word.create({
        data: {
          learnerId: testLearnerId,
          wordbookId: testWordbookId,
          word: 'test',
          examples: null,
        },
      })

      const response = await fetch(`http://localhost:3000/api/words/${word.id}`)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.word.examples).toBe(null)
    })

    it('should return 404 if word not found', async () => {
      const response = await fetch('http://localhost:3000/api/words/99999')
      expect(response.status).toBe(404)
    })
  })

  describe('PATCH /api/words/[id]', () => {
    beforeEach(async () => {
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

    it('should update word information', async () => {
      const response = await fetch(`http://localhost:3000/api/words/${testWordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meaningCn: 'n. 苹果（更新）',
          phoneticUs: '/ˈæpl/',
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.word.meaningCn).toBe('n. 苹果（更新）')
      expect(data.word.phoneticUs).toBe('/ˈæpl/')
    })

    it('should update masteryLevel', async () => {
      const response = await fetch(`http://localhost:3000/api/words/${testWordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masteryLevel: 2,
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.word.masteryLevel).toBe(2)
    })

    it('should validate masteryLevel range', async () => {
      const response = await fetch(`http://localhost:3000/api/words/${testWordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masteryLevel: 5,
        }),
      })

      expect(response.status).toBe(400)
    })

    it('should handle examples JSON update', async () => {
      const newExamples = JSON.stringify([{ en: 'Updated example', cn: '更新后的例句' }])

      const response = await fetch(`http://localhost:3000/api/words/${testWordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examples: newExamples,
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      // Examples are parsed and returned as an array
      expect(Array.isArray(data.word.examples)).toBe(true)
      expect(data.word.examples).toHaveLength(1)
      expect(data.word.examples[0].en).toBe('Updated example')
      expect(data.word.examples[0].cn).toBe('更新后的例句')
    })

    it('should return 404 if word not found', async () => {
      const response = await fetch('http://localhost:3000/api/words/99999', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meaningCn: 'test' }),
      })

      expect(response.status).toBe(404)
    })

    it('should reject invalid JSON in examples when updating', async () => {
      const response = await fetch(`http://localhost:3000/api/words/${testWordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examples: 'not valid json at all',
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
      expect(data.error).toContain('valid JSON')
    })
  })

  describe('DELETE /api/words/[id]', () => {
    beforeEach(async () => {
      const word = await db.word.create({
        data: {
          learnerId: testLearnerId,
          wordbookId: testWordbookId,
          word: 'apple',
          meaningCn: 'n. 苹果',
        },
      })
      testWordId = word.id
    })

    it('should delete a word', async () => {
      const response = await fetch(`http://localhost:3000/api/words/${testWordId}`, {
        method: 'DELETE',
      })

      expect(response.status).toBe(200)
      expect(response.json).toBeDefined()

      // Verify deletion
      const word = await db.word.findUnique({ where: { id: testWordId } })
      expect(word).toBeNull()
    })

    it('should return 404 if word not found', async () => {
      const response = await fetch('http://localhost:3000/api/words/99999', {
        method: 'DELETE',
      })

      expect(response.status).toBe(404)
    })
  })

  afterAll(async () => {
    // Clean up test data
    await db.word.deleteMany({ where: { learnerId: testLearnerId } })
    await db.wordbook.delete({ where: { id: testWordbookId } })
    await db.learner.delete({ where: { id: testLearnerId } })
    await db.$disconnect()
  })
})

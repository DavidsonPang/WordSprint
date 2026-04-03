import { db } from '@/lib/db'

describe('Wordbooks API', () => {
  beforeEach(async () => {
    await db.wordbook.deleteMany({ where: { isBuiltin: false } })
  })

  describe('POST /api/wordbooks', () => {
    it('should create a custom wordbook', async () => {
      const response = await fetch('http://localhost:3000/api/wordbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '三年级上册',
          type: 'custom',
          category: '课内',
          description: '小学三年级上册单词',
        }),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.wordbook.name).toBe('三年级上册')
      expect(data.wordbook.type).toBe('custom')
    })

    it('should return 400 if name is missing', async () => {
      const response = await fetch('http://localhost:3000/api/wordbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'custom' }),
      })

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/wordbooks', () => {
    it('should return all wordbooks including presets', async () => {
      const response = await fetch('http://localhost:3000/api/wordbooks')
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.wordbooks.length).toBeGreaterThanOrEqual(2) // At least Ket and Pet
    })

    it('should return 400 if learnerId is not a valid number', async () => {
      const response = await fetch('http://localhost:3000/api/wordbooks?learnerId=abc')
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Invalid')
    })
  })

  afterAll(async () => {
    await db.$disconnect()
  })
})

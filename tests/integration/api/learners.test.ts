import { db } from '@/lib/db'

describe('Learners API', () => {
  beforeEach(async () => {
    // Clean up test data
    await db.learner.deleteMany()
  })

  describe('POST /api/learners', () => {
    it('should create a new learner', async () => {
      const response = await fetch('http://localhost:3000/api/learners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Learner', avatar: '👦' }),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.learner).toHaveProperty('id')
      expect(data.learner.name).toBe('Test Learner')
    })

    it('should return 400 if name is missing', async () => {
      const response = await fetch('http://localhost:3000/api/learners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: '👦' }),
      })

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/learners', () => {
    it('should return all learners', async () => {
      // Create test learners
      const learner1 = await db.learner.create({ data: { name: 'Learner 1' } })
      const learner2 = await db.learner.create({ data: { name: 'Learner 2' } })

      const response = await fetch('http://localhost:3000/api/learners')
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.learners).toContainEqual(expect.objectContaining({ id: learner1.id }))
      expect(data.learners).toContainEqual(expect.objectContaining({ id: learner2.id }))
      expect(data.learners.length).toBeGreaterThanOrEqual(2)
    })
  })

  afterAll(async () => {
    await db.$disconnect()
  })
})

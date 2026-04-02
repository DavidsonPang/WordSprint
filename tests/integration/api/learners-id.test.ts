import { db } from '@/lib/db'

describe('Learners API - Single Learner', () => {
  let testLearnerId: number

  beforeEach(async () => {
    await db.learner.deleteMany()
    const learner = await db.learner.create({ data: { name: 'Test Learner' } })
    testLearnerId = learner.id
  })

  describe('GET /api/learners/[id]', () => {
    it('should return a single learner', async () => {
      const response = await fetch(`http://localhost:3000/api/learners/${testLearnerId}`)

      if (response.status === 404) {
        console.log(`Learner ${testLearnerId} not found. Available learners:`)
        const allResponse = await fetch('http://localhost:3000/api/learners')
        const allData = await allResponse.json()
        console.log('All learners:', allData.learners)
      }

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.learner.id).toBe(testLearnerId)
      expect(data.learner.name).toBe('Test Learner')
    })

    it('should return 404 if learner not found', async () => {
      const response = await fetch('http://localhost:3000/api/learners/99999')
      expect(response.status).toBe(404)
    })
  })

  describe('PATCH /api/learners/[id]', () => {
    it('should update learner name', async () => {
      const response = await fetch(`http://localhost:3000/api/learners/${testLearnerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Name' }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.learner.name).toBe('Updated Name')
    })
  })

  describe('DELETE /api/learners/[id]', () => {
    it('should delete a learner', async () => {
      const response = await fetch(`http://localhost:3000/api/learners/${testLearnerId}`, {
        method: 'DELETE',
      })

      expect(response.status).toBe(200)

      const learner = await db.learner.findUnique({ where: { id: testLearnerId } })
      expect(learner).toBeNull()
    })
  })

  afterAll(async () => {
    await db.$disconnect()
  })
})

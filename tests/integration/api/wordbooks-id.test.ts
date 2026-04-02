import { db } from '@/lib/db'

describe('Wordbooks API - Single Wordbook', () => {
  let testWordbookId: number

  beforeEach(async () => {
    await db.wordbook.deleteMany({ where: { isBuiltin: false } })
    const wordbook = await db.wordbook.create({
      data: { name: 'Test Wordbook', type: 'custom' },
    })
    testWordbookId = wordbook.id
  })

  afterEach(async () => {
    await db.wordbook.deleteMany({ where: { isBuiltin: false } })
  })

  describe('GET /api/wordbooks/[id]', () => {
    it('should return a single wordbook', async () => {
      const response = await fetch(`http://localhost:3000/api/wordbooks/${testWordbookId}`)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.wordbook.id).toBe(testWordbookId)
    })

    it('should return 404 if wordbook not found', async () => {
      const response = await fetch('http://localhost:3000/api/wordbooks/99999')
      expect(response.status).toBe(404)
    })
  })

  describe('PATCH /api/wordbooks/[id]', () => {
    it('should update wordbook name', async () => {
      const response = await fetch(`http://localhost:3000/api/wordbooks/${testWordbookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Wordbook' }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.wordbook.name).toBe('Updated Wordbook')
    })

    it('should not allow updating builtin wordbooks', async () => {
      const builtinWordbook = await db.wordbook.findFirst({
        where: { isBuiltin: true },
      })

      const response = await fetch(`http://localhost:3000/api/wordbooks/${builtinWordbook!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Hacked Name' }),
      })

      expect(response.status).toBe(403)
    })
  })

  describe('DELETE /api/wordbooks/[id]', () => {
    it('should delete a custom wordbook', async () => {
      const response = await fetch(`http://localhost:3000/api/wordbooks/${testWordbookId}`, {
        method: 'DELETE',
      })

      expect(response.status).toBe(200)
    })

    it('should not allow deleting builtin wordbooks', async () => {
      const builtinWordbook = await db.wordbook.findFirst({
        where: { isBuiltin: true },
      })

      const response = await fetch(`http://localhost:3000/api/wordbooks/${builtinWordbook!.id}`, {
        method: 'DELETE',
      })

      expect(response.status).toBe(403)
    })
  })

  afterAll(async () => {
    await db.$disconnect()
  })
})

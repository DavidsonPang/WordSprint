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

    it('should return 400 if ID is not a valid number', async () => {
      const response = await fetch('http://localhost:3000/api/wordbooks/abc')
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Invalid')
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

    it('should return 400 if ID is not a valid number', async () => {
      const response = await fetch('http://localhost:3000/api/wordbooks/abc', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      })
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Invalid')
    })

    it('should return 400 if PATCH body is empty', async () => {
      const response = await fetch(`http://localhost:3000/api/wordbooks/${testWordbookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('At least one field')
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

    it('should return 400 if name is an empty string', async () => {
      const response = await fetch(`http://localhost:3000/api/wordbooks/${testWordbookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' }),
      })
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('cannot be empty')
    })
  })

  describe('DELETE /api/wordbooks/[id]', () => {
    it('should delete a custom wordbook', async () => {
      const response = await fetch(`http://localhost:3000/api/wordbooks/${testWordbookId}`, {
        method: 'DELETE',
      })

      expect(response.status).toBe(200)
    })

    it('should return 400 if ID is not a valid number', async () => {
      const response = await fetch('http://localhost:3000/api/wordbooks/abc', {
        method: 'DELETE',
      })
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Invalid')
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

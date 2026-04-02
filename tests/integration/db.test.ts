import { db } from '@/lib/db'

describe('Database Connection', () => {
  it('should connect to database successfully', async () => {
    const result = await db.$queryRaw`SELECT 1 as value`
    expect(result).toBeDefined()
  })

  afterAll(async () => {
    await db.$disconnect()
  })
})

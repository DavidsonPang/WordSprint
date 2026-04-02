import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  try {
    // Check if KET wordbook already exists (idempotent)
    let ketWordbook = await prisma.wordbook.findFirst({
      where: { category: 'ket' },
    })

    if (!ketWordbook) {
      ketWordbook = await prisma.wordbook.create({
        data: {
          name: 'KET词库',
          type: 'preset',
          category: 'ket',
          description: 'Cambridge KET考试词库',
          isBuiltin: true,
        },
      })
      console.log(`✅ Created KET wordbook: ${ketWordbook.id}`)
    } else {
      console.log(`✅ KET wordbook already exists: ${ketWordbook.id}`)
    }

    // Validate KET wordbook ID
    if (!ketWordbook.id) {
      throw new Error('Failed to create/retrieve KET wordbook: invalid ID')
    }

    // Check if PET wordbook already exists (idempotent)
    let petWordbook = await prisma.wordbook.findFirst({
      where: { category: 'pet' },
    })

    if (!petWordbook) {
      petWordbook = await prisma.wordbook.create({
        data: {
          name: 'PET词库',
          type: 'preset',
          category: 'pet',
          description: 'Cambridge PET考试词库',
          isBuiltin: true,
        },
      })
      console.log(`✅ Created PET wordbook: ${petWordbook.id}`)
    } else {
      console.log(`✅ PET wordbook already exists: ${petWordbook.id}`)
    }

    // Validate PET wordbook ID
    if (!petWordbook.id) {
      throw new Error('Failed to create/retrieve PET wordbook: invalid ID')
    }

    // Note: Words will be added when a learner is created and selects these wordbooks
    console.log('🌱 Seed completed!')
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint failed')) {
        console.error('Database error: Duplicate wordbook entry detected')
      } else if (error.message.includes('invalid ID')) {
        console.error(`Validation error: ${error.message}`)
      } else if (error.message.includes('Foreign key constraint failed')) {
        console.error('Database error: Foreign key constraint violation')
      } else {
        console.error(`Database error: ${error.message}`)
      }
    } else {
      console.error('Unknown error during seed:', error)
    }
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

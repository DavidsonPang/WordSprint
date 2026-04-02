import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const KET_WORDS = [
  { word: 'apple', phoneticUs: '/ˈæpl/', phoneticUk: '/ˈæpl/', meaningCn: 'n. 苹果；苹果树', meaningEn: 'n. a round fruit with red, green, or yellow skin', examples: JSON.stringify([{ en: 'I ate an apple for breakfast.', cn: '我早餐吃了一个苹果。' }]) },
  { word: 'book', phoneticUs: '/bʊk/', phoneticUk: '/bʊk/', meaningCn: 'n. 书；书籍', meaningEn: 'n. a set of printed pages fastened together inside a cover', examples: JSON.stringify([{ en: 'She is reading a book.', cn: '她正在读一本书。' }]) },
  { word: 'cat', phoneticUs: '/kæt/', phoneticUk: '/kæt/', meaningCn: 'n. 猫', meaningEn: 'n. a small furry animal with four legs and a tail', examples: JSON.stringify([{ en: 'The cat is sleeping.', cn: '猫正在睡觉。' }]) },
  { word: 'dog', phoneticUs: '/dɔːɡ/', phoneticUk: '/dɒɡ/', meaningCn: 'n. 狗', meaningEn: 'n. an animal with four legs and a tail', examples: JSON.stringify([{ en: 'I have a dog.', cn: '我有一只狗。' }]) },
  { word: 'egg', phoneticUs: '/eɡ/', phoneticUk: '/eɡ/', meaningCn: 'n. 蛋；鸡蛋', meaningEn: 'n. an oval object laid by birds', examples: JSON.stringify([{ en: 'I had eggs for breakfast.', cn: '我早餐吃了鸡蛋。' }]) },
]

const PET_WORDS = [
  { word: 'abandon', phoneticUs: '/əˈbændən/', phoneticUk: '/əˈbændən/', meaningCn: 'v. 放弃；遗弃', meaningEn: 'v. to leave someone or something', examples: JSON.stringify([{ en: 'They had to abandon the car.', cn: '他们不得不弃车。' }]) },
  { word: 'ability', phoneticUs: '/əˈbɪləti/', phoneticUk: '/əˈbɪləti/', meaningCn: 'n. 能力；才能', meaningEn: 'n. the power or skill to do something', examples: JSON.stringify([{ en: 'She has the ability to speak three languages.', cn: '她有能力说三种语言。' }]) },
  { word: 'abroad', phoneticUs: '/əˈbrɔːd/', phoneticUk: '/əˈbrɔːd/', meaningCn: 'adv. 在国外；到国外', meaningEn: 'adv. in or to a foreign country', examples: JSON.stringify([{ en: 'He is studying abroad.', cn: '他在国外学习。' }]) },
]

async function main() {
  console.log('🌱 Starting seed...')

  // Create Ket Wordbook
  const ketWordbook = await prisma.wordbook.create({
    data: {
      name: 'Ket词库',
      type: 'preset',
      category: 'ket',
      description: 'Cambridge KET考试词库',
      isBuiltin: true,
    },
  })

  console.log(`✅ Created Ket wordbook: ${ketWordbook.id}`)

  // Create Pet Wordbook
  const petWordbook = await prisma.wordbook.create({
    data: {
      name: 'Pet词库',
      type: 'preset',
      category: 'pet',
      description: 'Cambridge PET考试词库',
      isBuiltin: true,
    },
  })

  console.log(`✅ Created Pet wordbook: ${petWordbook.id}`)

  // Note: Words will be added when a learner is created and selects these wordbooks
  console.log('🌱 Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

export { KET_WORDS, PET_WORDS }

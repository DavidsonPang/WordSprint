export type MasteryLevel = 0 | 1 | 2 // 0:不会 1:模糊 2:掌握

export type StudyType = 'card' | 'test'

export type TestType = 'word2meaning' | 'meaning2word' | 'listen' | 'spell'

export type WordbookType = 'preset' | 'custom'

export type WordbookCategory = 'ket' | 'pet' | '课内' | '课外'

export interface WordExample {
  en: string
  cn: string
}

export interface LearnerProfile {
  id: number
  name: string
  avatar?: string
}

export interface WordDetail {
  id: number
  word: string
  phoneticUs?: string
  phoneticUk?: string
  meaningCn?: string
  meaningEn?: string
  examples?: WordExample[]
  imageUrl?: string
  source?: string
  masteryLevel: MasteryLevel
  wordbookId: number
  learnerId: number
}

export interface WordbookInfo {
  id: number
  name: string
  type: WordbookType
  category?: WordbookCategory
  description?: string
  isBuiltin: boolean
  wordCount?: number
  masteredCount?: number
}

export interface StatisticsData {
  totalWords: number
  masteredWords: number
  reviewDueWords: number
  masteryRate: number
  dailyLearning: { date: string; count: number }[]
  categoryStats: { category: string; total: number; mastered: number }[]
}

import { calculateNextReviewDate, getReviewInterval } from '@/lib/review-schedule'
import { addDays, format } from 'date-fns'

describe('Review Schedule Algorithm', () => {
  const baseDate = new Date('2026-04-02')

  describe('getReviewInterval', () => {
    it('should return 1 day for first review (mastery=2)', () => {
      expect(getReviewInterval(0, 2)).toBe(1)
    })

    it('should follow Ebbinghaus curve for mastered words', () => {
      expect(getReviewInterval(0, 2)).toBe(1) // 第1次
      expect(getReviewInterval(1, 2)).toBe(2) // 第2次
      expect(getReviewInterval(2, 2)).toBe(4) // 第3次
      expect(getReviewInterval(3, 2)).toBe(7) // 第4次
      expect(getReviewInterval(4, 2)).toBe(15) // 第5次
      expect(getReviewInterval(5, 2)).toBe(30) // 第6次
    })

    it('should reset interval for words marked as "不会" (mastery=0)', () => {
      expect(getReviewInterval(3, 0)).toBe(1) // 重置为1天
    })

    it('should shorten interval for words marked as "模糊" (mastery=1)', () => {
      expect(getReviewInterval(0, 1)).toBe(1)
      expect(getReviewInterval(1, 1)).toBe(2)
      expect(getReviewInterval(2, 1)).toBe(3)
      expect(getReviewInterval(3, 1)).toBe(5)
    })
  })

  describe('calculateNextReviewDate', () => {
    it('should calculate next review date correctly', () => {
      const nextDate = calculateNextReviewDate(baseDate, 0, 2)
      const expected = addDays(baseDate, 1)

      expect(format(nextDate, 'yyyy-MM-dd')).toBe(format(expected, 'yyyy-MM-dd'))
    })

    it('should handle review count progression', () => {
      const date1 = calculateNextReviewDate(baseDate, 0, 2)
      const date2 = calculateNextReviewDate(date1, 1, 2)
      const date3 = calculateNextReviewDate(date2, 2, 2)

      // 1天后 -> +2天 -> +4天
      expect(format(date3, 'yyyy-MM-dd')).toBe('2026-04-09')
    })
  })
})

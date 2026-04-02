import { describe, it, expect } from '@jest/globals'
import * as openaiModule from '../../../lib/openai'

describe('openai library', () => {
  describe('lookupWord', () => {
    it('should export lookupWord function', () => {
      expect(typeof openaiModule.lookupWord).toBe('function')
    })

    it('should export lookupWordFallback function', () => {
      expect(typeof openaiModule.lookupWordFallback).toBe('function')
    })

    it('should export openai client', () => {
      expect(openaiModule.openai).toBeDefined()
    })
  })
})

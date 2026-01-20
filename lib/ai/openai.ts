/**
 * OpenAI API integration for text comparison and relevance scoring
 */

import OpenAI from 'openai'
import { SearchResult } from '../search/google'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!OPENAI_API_KEY)
{
  throw new Error('OPENAI_API_KEY is not set')
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
})

export interface ScoredResult extends SearchResult
{
  confidence: number
  explanation: string
}

/**
 * Compare original text with search results and score relevance
 * @param {string} originalText - Original text from user
 * @param {SearchResult[]} searchResults - Search results to analyze
 * @returns {Promise<ScoredResult[]>} - Results with confidence scores
 */
export async function analyzeRelevance(
  originalText: string,
  searchResults: SearchResult[]
): Promise<ScoredResult[]>
{
  if (searchResults.length === 0)
  {
    return []
  }

  // Limit to top 10 results for analysis (to avoid token limits and costs)
  const resultsToAnalyze = searchResults.slice(0, 10)

  // Prepare context for AI
  const resultsContext = resultsToAnalyze.map((result, index) =>
  {
    return `[${index + 1}] ${result.title}\nURL: ${result.link}\nSnippet: ${result.snippet || 'No snippet'}`
  }).join('\n\n')

  const prompt = `You are analyzing search results to find sources for the following text. Compare the MEANING and CONTEXT, not just literal text matches. The text might be paraphrased or translated.

Original text:
"""
${originalText}
"""

Search results:
"""
${resultsContext}
"""

For each search result, provide:
1. Confidence score (0-100) - how well the source matches the meaning of the original text
2. Brief explanation (1-2 sentences) - why this source is relevant or not

Consider:
- Semantic similarity (meaning, not exact words)
- Contextual relevance
- Factual alignment
- Source reliability (official sites, news, research are preferred)

Respond in JSON format:
{
  "results": [
    {
      "index": 1,
      "confidence": 85,
      "explanation": "This source directly discusses the same topic with matching facts and context."
    },
    ...
  ]
}`

  try
  {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing text sources and determining relevance. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content)
    {
      throw new Error('No response from OpenAI')
    }

    const analysis = JSON.parse(content)

    // Map AI scores to results
    const scoredResults: ScoredResult[] = resultsToAnalyze.map((result, index) =>
    {
      const analysisItem = analysis.results?.find((r: any) => r.index === index + 1)
      
      return {
        ...result,
        confidence: analysisItem?.confidence || 0,
        explanation: analysisItem?.explanation || 'No explanation provided',
      }
    })

    // Sort by confidence (highest first)
    scoredResults.sort((a, b) => b.confidence - a.confidence)

    return scoredResults
  }
  catch (error)
  {
    console.error('Error analyzing relevance with AI:', error)
    
    // Fallback: return results with default confidence
    return resultsToAnalyze.map(result => ({
      ...result,
      confidence: 50,
      explanation: 'AI analysis unavailable, showing search result',
    }))
  }
}

/**
 * Get top N results based on confidence score
 * @param {ScoredResult[]} scoredResults - Results with confidence scores
 * @param {number} topN - Number of top results to return
 * @returns {ScoredResult[]} - Top N results
 */
export function getTopResults(scoredResults: ScoredResult[], topN: number = 3): ScoredResult[]
{
  return scoredResults.slice(0, topN).filter(result => result.confidence > 0)
}

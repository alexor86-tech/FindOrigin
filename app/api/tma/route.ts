/**
 * API endpoint for Telegram Mini App
 */

import { NextRequest, NextResponse } from 'next/server'
import { extractText, validateInput } from '@/lib/text/extractor'
import { searchGoogle, SearchResult } from '@/lib/search/google'
import { analyzeRelevance, getTopResults, ScoredResult } from '@/lib/ai/openai'

export interface TmaSearchRequest
{
  text: string
}

export interface TmaSearchResponse
{
  success: boolean
  results?: ScoredResult[]
  error?: string
  status?: string
}

/**
 * Process search request from Mini App
 * @param {NextRequest} request - Request object [in]
 * @returns {Promise<NextResponse>} - Response with search results [out]
 */
export async function POST(request: NextRequest)
{
  try
  {
    const body: TmaSearchRequest = await request.json()
    const { text } = body

    if (!text || (!validateInput(text)))
    {
      return NextResponse.json<TmaSearchResponse>({
        success: false,
        error: 'Пожалуйста, отправьте текст или ссылку на Telegram-пост.',
      }, { status: 400 })
    }

    // Extract text from message or URL
    let extractedText: string
    try
    {
      extractedText = await extractText(text)
    }
    catch (error)
    {
      return NextResponse.json<TmaSearchResponse>({
        success: false,
        error: 'Не удалось извлечь текст из сообщения.',
      }, { status: 400 })
    }

    // Search for sources
    let searchResults: SearchResult[] = []
    
    try
    {
      searchResults = await searchGoogle(extractedText, 10)
    }
    catch (error)
    {
      console.error('Search error:', error)
      
      let errorMessage = 'Ошибка при поиске источников.'
      
      if (error instanceof Error)
      {
        const errorText = error.message.toLowerCase()
        
        if ((errorText.includes('not set')) || (errorText.includes('not properly configured')))
        {
          errorMessage = 'Google Search API не настроен. Проверьте переменные окружения.'
        }
        else if ((errorText.includes('quota exceeded')) || (errorText.includes('quota')))
        {
          errorMessage = 'Превышен лимит запросов Google Search API. Попробуйте позже.'
        }
        else if ((errorText.includes('access denied')) || (errorText.includes('authentication failed')) || (errorText.includes('invalid')))
        {
          errorMessage = 'Ошибка авторизации Google Search API.'
        }
        else
        {
          errorMessage = `Ошибка при поиске источников: ${error.message}`
        }
      }
      
      return NextResponse.json<TmaSearchResponse>({
        success: false,
        error: errorMessage,
      }, { status: 500 })
    }

    if (searchResults.length === 0)
    {
      return NextResponse.json<TmaSearchResponse>({
        success: false,
        error: 'Не удалось найти источники для данного запроса. Попробуйте переформулировать вопрос.',
      }, { status: 404 })
    }

    // Analyze relevance
    let scoredResults: ScoredResult[] = []
    
    try
    {
      scoredResults = await analyzeRelevance(extractedText, searchResults)
    }
    catch (error)
    {
      console.error('AI analysis error:', error)
      
      // Fallback to search results without scoring
      scoredResults = searchResults.slice(0, 3).map(result => ({
        ...result,
        confidence: 50,
        explanation: 'Результат поиска',
      }))
    }

    const topResults = getTopResults(scoredResults, 3)

    if (topResults.length === 0)
    {
      return NextResponse.json<TmaSearchResponse>({
        success: false,
        error: 'Не найдено релевантных источников для данного запроса.',
      }, { status: 404 })
    }

    return NextResponse.json<TmaSearchResponse>({
      success: true,
      results: topResults,
    })
  }
  catch (error)
  {
    console.error('Error processing TMA request:', error)
    return NextResponse.json<TmaSearchResponse>({
      success: false,
      error: 'Произошла ошибка при обработке запроса. Попробуйте позже.',
    }, { status: 500 })
  }
}

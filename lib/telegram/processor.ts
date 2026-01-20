/**
 * Message processing logic
 */

import { TelegramMessage } from './types'
import { sendMessage } from './api'
import { extractText, validateInput } from '../text/extractor'
import { searchGoogle, SearchResult } from '../search/google'
import { analyzeRelevance, getTopResults, ScoredResult } from '../ai/openai'

/**
 * Process incoming message
 * @param {number} chatId - Chat ID
 * @param {string} messageText - Message text
 * @param {TelegramMessage} message - Full message object
 */
export async function processMessage(
  chatId: number,
  messageText: string | undefined,
  message: TelegramMessage
): Promise<void>
{
  try
  {
    // Send "processing" message
    await sendMessage(chatId, '🔍 Обрабатываю запрос...')

    // Extract text from message or Telegram post
    const text = await extractText(messageText, message)

    // Validate input
    if (!validateInput(text))
    {
      await sendMessage(chatId, '❌ Пожалуйста, отправьте текст или ссылку на Telegram-пост.')
      return
    }

    // Use text directly as search query (no entity extraction)
    await sendMessage(chatId, '🔎 Ищу источники...')
    
    let searchResults: SearchResult[] = []
    
    try
    {
      // Search with original text (get up to 10 results for AI analysis)
      searchResults = await searchGoogle(text, 10)
    }
    catch (error)
    {
      console.error('Search error:', error)
      await sendMessage(
        chatId,
        '⚠️ Ошибка при поиске источников. Проверьте настройку Google Search API.'
      )
      return
    }

    if (searchResults.length === 0)
    {
      await sendMessage(
        chatId,
        '❌ Не удалось найти источники для данного запроса. Попробуйте переформулировать вопрос.'
      )
      return
    }

    // Analyze relevance with AI
    await sendMessage(chatId, '🤖 Анализирую релевантность источников...')
    
    let scoredResults: ScoredResult[] = []
    
    try
    {
      scoredResults = await analyzeRelevance(text, searchResults)
    }
    catch (error)
    {
      console.error('AI analysis error:', error)
      await sendMessage(
        chatId,
        '⚠️ Ошибка при анализе источников. Показываю результаты поиска без оценки.'
      )
      
      // Fallback: show top 3 results without scoring
      scoredResults = searchResults.slice(0, 3).map(result => ({
        ...result,
        confidence: 50,
        explanation: 'Результат поиска',
      }))
    }

    // Get top 3 results
    const topResults = getTopResults(scoredResults, 3)

    if (topResults.length === 0)
    {
      await sendMessage(
        chatId,
        '❌ Не найдено релевантных источников для данного запроса.'
      )
      return
    }

    // Format response with confidence scores
    let responseText = '📚 Найденные источники:\n\n'
    
    for (let i = 0; i < topResults.length; i++)
    {
      const result = topResults[i]
      const confidenceEmoji = result.confidence >= 80 ? '🟢' : result.confidence >= 60 ? '🟡' : '🔴'
      
      responseText += `${i + 1}. ${result.title}\n`
      responseText += `${result.link}\n`
      responseText += `${confidenceEmoji} Уверенность: ${result.confidence}%\n`
      
      if (result.explanation)
      {
        responseText += `💡 ${result.explanation}\n`
      }
      
      if (result.snippet)
      {
        responseText += `📄 ${result.snippet.substring(0, 150)}${result.snippet.length > 150 ? '...' : ''}\n`
      }
      
      responseText += '\n'
    }

    // Send response
    await sendMessage(chatId, responseText)
  }
  catch (error)
  {
    console.error('Error processing message:', error)
    await sendMessage(
      chatId,
      '❌ Произошла ошибка при обработке запроса. Попробуйте позже.'
    )
  }
}

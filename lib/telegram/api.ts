/**
 * Telegram Bot API client
 */

// Lazy initialization to avoid errors during build
function getApiBaseUrl(): string
{
  const apiUrl = process.env.TELEGRAM_API_URL || 'https://api.telegram.org/bot'
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  
  if (!botToken)
  {
    throw new Error('TELEGRAM_BOT_TOKEN is not set')
  }
  
  // Ensure URL is properly formatted
  const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl
  const fullUrl = `${baseUrl}${botToken}`
  
  console.log('Telegram API URL constructed:', {
    apiUrl: baseUrl,
    hasToken: !!botToken,
    tokenLength: botToken.length,
  })
  
  return fullUrl
}

/**
 * Send message to Telegram chat
 * @param {number} chatId - Chat ID
 * @param {string} text - Message text
 * @param {object} options - Additional options
 * @returns {Promise<object>} - API response
 */
export async function sendMessage(
  chatId: number,
  text: string,
  options: {
    parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2'
    reply_to_message_id?: number
  } = {}
): Promise<object>
{
  const apiBaseUrl = getApiBaseUrl()
  const url = `${apiBaseUrl}/sendMessage`
  const body = {
    chat_id: chatId,
    text,
    ...options,
  }

  console.log('Sending message to Telegram:', {
    chatId,
    textLength: text.length,
    url: url.replace(/\/bot[^\/]+/, '/bot***'), // Hide token in logs
    hasToken: !!process.env.TELEGRAM_BOT_TOKEN,
  })

  // Add timeout and better error handling for Vercel serverless
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

  try
  {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FindOrigin-Bot/1.0',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)

    if (!response.ok)
    {
      const errorText = await response.text()
      let errorData
      try
      {
        errorData = JSON.parse(errorText)
      }
      catch
      {
        errorData = { raw: errorText }
      }
      
      console.error('Telegram API error response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      })
      
      throw new Error(`Telegram API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
    }

    const result = await response.json()
    console.log('Message sent successfully:', {
      chatId,
      messageId: result.result?.message_id,
    })
    
    return result
  }
  catch (fetchError)
  {
    clearTimeout(timeoutId)
    
    // Handle abort (timeout)
    if (fetchError instanceof Error && fetchError.name === 'AbortError')
    {
      console.error('Request timeout:', {
        chatId,
        url: url.replace(/\/bot[^\/]+/, '/bot***'),
      })
      throw new Error('Request timeout: Telegram API did not respond within 10 seconds')
    }
    
    // Handle network errors
    if (fetchError instanceof Error && (fetchError.message.includes('fetch failed') || fetchError.message.includes('ECONNREFUSED')))
    {
      console.error('Network error when calling Telegram API:', {
        url: url.replace(/\/bot[^\/]+/, '/bot***'),
        error: fetchError.message,
        chatId,
      })
      throw new Error(`Network error: Unable to reach Telegram API. ${fetchError.message}`)
    }
    
    // Re-throw other errors
    console.error('Error sending message to Telegram:', {
      chatId,
      error: fetchError instanceof Error ? fetchError.message : String(fetchError),
      stack: fetchError instanceof Error ? fetchError.stack : undefined,
      url: url.replace(/\/bot[^\/]+/, '/bot***'),
    })
    throw fetchError
  }
}

/**
 * Get message from Telegram channel/post
 * @param {string} chatId - Chat/channel ID
 * @param {number} messageId - Message ID
 * @returns {Promise<object>} - Message object
 */
export async function getMessage(chatId: string, messageId: number): Promise<object>
{
  const apiBaseUrl = getApiBaseUrl()
  const url = `${apiBaseUrl}/forwardMessage`
  // Note: This is a workaround - Telegram Bot API doesn't allow direct access to channel posts
  // In production, you might need to use Telegram Client API or store messages when bot is added to channel
  throw new Error('Direct message retrieval not supported via Bot API')
}

/**
 * Extract text from Telegram post URL
 * @param {string} url - Telegram post URL (e.g., t.me/channel/123)
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextFromTelegramUrl(url: string): Promise<string>
{
  // Parse URL format: t.me/channel/123 or t.me/channel/123?thread=456
  const match = url.match(/t\.me\/([^\/]+)\/(\d+)/)
  if (!match)
  {
    throw new Error('Invalid Telegram URL format')
  }

  const [, channel, messageId] = match
  // Note: Telegram Bot API limitations - cannot directly fetch channel posts
  // This would require Telegram Client API or web scraping
  // For now, return error message
  throw new Error('Telegram post extraction requires additional setup (Client API or web scraping)')
}

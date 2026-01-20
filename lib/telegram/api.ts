/**
 * Telegram Bot API client
 */

import https from 'https'
import { URL } from 'url'

/**
 * Make HTTPS request using Node.js https module
 * @param {string} urlString - Full URL
 * @param {object} body - Request body
 * @param {AbortSignal} signal - Abort signal
 * @returns {Promise<{status: number, statusText: string, data: any}>} - Response data
 */
async function httpsRequest(
  urlString: string,
  body: object,
  signal: AbortSignal
): Promise<{ status: number; statusText: string; data: any }>
{
  return new Promise((resolve, reject) =>
  {
    const url = new URL(urlString)
    const postData = JSON.stringify(body)

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'FindOrigin-Bot/1.0',
      },
      timeout: 10000, // 10 second timeout
    }

    const req = https.request(options, (res) =>
    {
      let data = ''

      res.on('data', (chunk) =>
      {
        data += chunk
      })

      res.on('end', () =>
      {
        try
        {
          const jsonData = JSON.parse(data)
          resolve({
            status: res.statusCode || 500,
            statusText: res.statusMessage || 'OK',
            data: jsonData,
          })
        }
        catch (error)
        {
          resolve({
            status: res.statusCode || 500,
            statusText: res.statusMessage || 'OK',
            data: { raw: data },
          })
        }
      })
    })

    req.on('error', (error) =>
    {
      console.error('HTTPS request error:', error)
      reject(error)
    })

    req.on('timeout', () =>
    {
      req.destroy()
      reject(new Error('Request timeout'))
    })

    if (signal.aborted)
    {
      req.destroy()
      reject(new Error('Request aborted'))
      return
    }

    signal.addEventListener('abort', () =>
    {
      req.destroy()
    })

    req.write(postData)
    req.end()
  })
}

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

  // Use https module directly for better reliability in Vercel serverless
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

  try
  {
    console.log('Attempting HTTPS request to Telegram API...', {
      url: url.replace(/\/bot[^\/]+/, '/bot***'),
      method: 'POST',
      bodySize: JSON.stringify(body).length,
    })

    const response = await httpsRequest(url, body, controller.signal)
    
    clearTimeout(timeoutId)
    
    console.log('Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.status >= 200 && response.status < 300,
    })

    if (response.status < 200 || response.status >= 300)
    {
      console.error('Telegram API error response:', {
        status: response.status,
        statusText: response.statusText,
        error: response.data,
      })
      
      throw new Error(`Telegram API error: ${response.status} ${response.statusText} - ${JSON.stringify(response.data)}`)
    }

    console.log('Message sent successfully:', {
      chatId,
      messageId: response.data.result?.message_id,
    })
    
    return response.data
  }
  catch (error)
  {
    clearTimeout(timeoutId)
    
    console.error('Error sending message to Telegram:', {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      chatId,
      url: url.replace(/\/bot[^\/]+/, '/bot***'),
    })
    
    // Handle abort (timeout)
    if (error instanceof Error && (error.name === 'AbortError' || error.message === 'Request aborted'))
    {
      throw new Error('Request timeout: Telegram API did not respond within 10 seconds')
    }
    
    // Handle network errors
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isNetworkError = 
      errorMessage.includes('fetch failed') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('ETIMEDOUT') ||
      errorMessage.includes('ECONNRESET') ||
      errorMessage.includes('timeout')
    
    if (isNetworkError)
    {
      throw new Error(`Network error: Unable to reach Telegram API. ${errorMessage}`)
    }
    
    throw error
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

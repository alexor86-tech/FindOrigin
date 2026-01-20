/**
 * Telegram Bot API client
 */

import https from 'https'
import { URL } from 'url'

/**
 * Make HTTPS request using Node.js https module
 * @param {string} urlString - Full URL
 * @param {object} body - Request body
 * @returns {Promise<{status: number, statusText: string, data: any}>} - Response data
 */
async function httpsRequest(
  urlString: string,
  body: object
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
      },
      timeout: 10000,
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
          
          if (jsonData.error_code)
          {
            console.error('[Telegram API] Error:', {
              code: jsonData.error_code,
              description: jsonData.description,
            })
          }
          
          resolve({
            status: res.statusCode || 200,
            statusText: res.statusMessage || 'OK',
            data: jsonData,
          })
        }
        catch (error)
        {
          console.error('[Telegram API] JSON parse error:', error)
          resolve({
            status: res.statusCode || 200,
            statusText: res.statusMessage || 'OK',
            data: { raw: data.substring(0, 200) },
          })
        }
      })
    })

    req.on('error', (error) =>
    {
      console.error('[Telegram API] Request error:', {
        message: error.message,
        code: (error as any).code,
      })
      reject(error)
    })

    req.on('timeout', () =>
    {
      req.destroy()
      reject(new Error('Request timeout'))
    })

    req.write(postData)
    req.end()
  })
}

/**
 * Get Telegram API base URL
 * @returns {string} - API base URL with token
 */
function getApiBaseUrl(): string
{
  const apiUrl = process.env.TELEGRAM_API_URL || 'https://api.telegram.org/bot'
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  
  if (!botToken)
  {
    throw new Error('TELEGRAM_BOT_TOKEN is not set')
  }
  
  const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl
  return `${baseUrl}${botToken}`
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

  try
  {
    const response = await Promise.race([
      httpsRequest(url, body),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout after 15s')), 15000)
      ),
    ])

    if (response.status < 200 || response.status >= 300)
    {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`)
    }

    if (!response.data.ok)
    {
      throw new Error(`Telegram API error: ${response.data.error_code} - ${response.data.description}`)
    }

    return response.data
  }
  catch (error)
  {
    console.error('[Telegram API] Send message error:', {
      error: error instanceof Error ? error.message : String(error),
      chatId,
    })
    throw error
  }
}

/**
 * Extract text from Telegram post URL (not implemented)
 * @param {string} url - Telegram post URL
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextFromTelegramUrl(url: string): Promise<string>
{
  throw new Error('Telegram post extraction requires additional setup')
}

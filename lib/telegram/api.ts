/**
 * Telegram Bot API client
 */

import https from 'https'
import { URL } from 'url'

/**
 * Make HTTPS request using Node.js https module
 */
async function httpsRequest(
  urlString: string,
  body: object
): Promise<{ status: number; statusText: string; data: any }>
{
  return new Promise((resolve, reject) =>
  {
    console.log('[HTTPS] Starting request...')
    
    let url: URL
    try
    {
      url = new URL(urlString)
      console.log('[HTTPS] URL parsed successfully:', {
        hostname: url.hostname,
        path: url.pathname + url.search,
      })
    }
    catch (urlError)
    {
      console.error('[HTTPS] ❌ URL parse error:', {
        error: urlError instanceof Error ? urlError.message : String(urlError),
        urlString: urlString.replace(/\/bot[^\/]+/, '/bot***'),
      })
      reject(new Error(`Invalid URL: ${urlError instanceof Error ? urlError.message : String(urlError)}`))
      return
    }

    let postData: string
    try
    {
      postData = JSON.stringify(body)
      console.log('[HTTPS] Body stringified, length:', postData.length)
    }
    catch (stringifyError)
    {
      console.error('[HTTPS] ❌ JSON stringify error:', {
        error: stringifyError instanceof Error ? stringifyError.message : String(stringifyError),
      })
      reject(new Error(`Failed to stringify body: ${stringifyError instanceof Error ? stringifyError.message : String(stringifyError)}`))
      return
    }

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

    console.log('[HTTPS] Request options prepared:', {
      hostname: options.hostname,
      port: options.port,
      path: options.path.substring(0, 50) + '...',
      method: options.method,
      contentLength: options.headers['Content-Length'],
      timeout: options.timeout,
    })
    
    console.log('[HTTPS] Creating https.request...')
    const req = https.request(options, (res) =>
      {
        console.log('[HTTPS] ✅ Response callback fired!', {
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headersCount: Object.keys(res.headers || {}).length,
        })

        let data = ''
        let chunkCount = 0

        res.on('data', (chunk) =>
        {
          chunkCount++
          data += chunk
          console.log(`[HTTPS] Data chunk #${chunkCount} received, total length: ${data.length}`)
        })

        res.on('end', () =>
        {
          console.log('[HTTPS] Response end event fired, total chunks:', chunkCount, 'total length:', data.length)
          
          if (!data)
          {
            console.warn('[HTTPS] ⚠️ Empty response body')
          }
          
          try
          {
            const jsonData = JSON.parse(data)
            console.log('[HTTPS] ✅ JSON parsed successfully:', {
              ok: jsonData.ok,
              hasResult: !!jsonData.result,
              hasError: !!jsonData.error_code,
            })
            
            if (jsonData.error_code)
            {
              console.error('[HTTPS] ⚠️ Telegram API returned error:', {
                errorCode: jsonData.error_code,
                description: jsonData.description,
                parameters: jsonData.parameters,
              })
            }
            
            resolve({
              status: res.statusCode || 200,
              statusText: res.statusMessage || 'OK',
              data: jsonData,
            })
          }
          catch (parseError)
          {
            console.error('[HTTPS] ❌ JSON parse error:', {
              error: parseError instanceof Error ? parseError.message : String(parseError),
              dataPreview: data.substring(0, 500),
              dataLength: data.length,
            })
            resolve({
              status: res.statusCode || 200,
              statusText: res.statusMessage || 'OK',
              data: { raw: data.substring(0, 500), parseError: parseError instanceof Error ? parseError.message : String(parseError) },
            })
          }
        })

        res.on('error', (resError) =>
        {
          console.error('[HTTPS] ❌ Response stream error:', {
            error: resError.message,
            code: (resError as any).code,
          })
          reject(resError)
        })

        res.on('aborted', () =>
        {
          console.error('[HTTPS] ❌ Response aborted')
          reject(new Error('Response aborted'))
        })
      })
      
    console.log('[HTTPS] Request object created')
    
    req.on('error', (error) =>
    {
      console.error('[HTTPS] ❌ Request error event:', {
        message: error.message,
        code: (error as any).code,
        errno: (error as any).errno,
        syscall: (error as any).syscall,
        hostname: (error as any).hostname,
        port: (error as any).port,
      })
      reject(error)
    })

    req.on('timeout', () =>
    {
      console.error('[HTTPS] ❌ Request timeout after', options.timeout, 'ms')
      console.error('[HTTPS] Request state:', {
        destroyed: req.destroyed,
        socketExists: !!req.socket,
        socketDestroyed: req.socket?.destroyed,
      })
      req.destroy()
      reject(new Error(`Request timeout after ${options.timeout}ms`))
    })

    req.on('close', () =>
    {
      console.log('[HTTPS] Request closed event')
    })

    req.on('connect', () =>
    {
      console.log('[HTTPS] Request connected')
    })

    req.on('socket', (socket) =>
    {
      console.log('[HTTPS] Socket assigned:', {
        remoteAddress: socket.remoteAddress,
        remotePort: socket.remotePort,
      })
      
      socket.on('error', (socketError) =>
      {
        console.error('[HTTPS] ❌ Socket error:', {
          error: socketError.message,
          code: (socketError as any).code,
        })
      })
      
      socket.on('timeout', () =>
      {
        console.error('[HTTPS] ❌ Socket timeout')
      })
    })

    try
    {
      console.log('[HTTPS] Writing request data...')
      req.write(postData)
      console.log('[HTTPS] Data written, ending request...')
      req.end()
      console.log('[HTTPS] Request ended, waiting for response...')
      
      // Diagnostic: check if request is still alive after 2 seconds
      setTimeout(() =>
      {
        if (!req.destroyed)
        {
          console.log('[HTTPS] Diagnostic: Request still pending after 2s', {
            destroyed: req.destroyed,
            socketExists: !!req.socket,
            socketDestroyed: req.socket?.destroyed,
          })
        }
      }, 2000)
    }
    catch (writeError)
    {
      console.error('[HTTPS] ❌ Error writing/ending request:', {
        error: writeError instanceof Error ? writeError.message : String(writeError),
        stack: writeError instanceof Error ? writeError.stack : undefined,
      })
      reject(writeError)
    }
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
  
  const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl
  return `${baseUrl}${botToken}`
}

/**
 * Send message to Telegram chat
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

  console.log('[SEND] Starting sendMessage:', {
    chatId,
    textLength: text.length,
    url: url.replace(/\/bot[^\/]+/, '/bot***'),
    hasToken: !!process.env.TELEGRAM_BOT_TOKEN,
    tokenLength: process.env.TELEGRAM_BOT_TOKEN?.length || 0,
  })

  try
  {
    console.log('[SEND] Calling httpsRequest...')
    
    // Add timeout wrapper
    const requestPromise = httpsRequest(url, body)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('SendMessage timeout after 15s')), 15000)
    )
    
    console.log('[SEND] Waiting for response with 15s timeout...')
    const response = await Promise.race([requestPromise, timeoutPromise])
    
    console.log('[SEND] ✅ Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.status >= 200 && response.status < 300,
      hasData: !!response.data,
      dataOk: response.data?.ok,
    })

    if (response.status < 200 || response.status >= 300)
    {
      console.error('[SEND] ❌ HTTP status error:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
      })
      throw new Error(`Telegram API HTTP error: ${response.status} ${response.statusText} - ${JSON.stringify(response.data)}`)
    }

    if (!response.data.ok)
    {
      console.error('[SEND] ❌ Telegram API returned error:', {
        errorCode: response.data.error_code,
        description: response.data.description,
        parameters: response.data.parameters,
        fullResponse: response.data,
      })
      throw new Error(`Telegram API error: ${response.data.error_code} - ${response.data.description}`)
    }

    console.log('[SEND] ✅ Message sent successfully!', {
      messageId: response.data.result?.message_id,
      chatId: response.data.result?.chat?.id,
      date: response.data.result?.date,
    })
    
    return response.data
  }
  catch (error)
  {
    console.error('[SEND] ❌ Fatal error in sendMessage:', {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      chatId,
      url: url.replace(/\/bot[^\/]+/, '/bot***'),
    })
    throw error
  }
}

/**
 * Get message from Telegram channel/post
 */
export async function getMessage(chatId: string, messageId: number): Promise<object>
{
  throw new Error('Direct message retrieval not supported via Bot API')
}

/**
 * Extract text from Telegram post URL
 */
export async function extractTextFromTelegramUrl(url: string): Promise<string>
{
  const match = url.match(/t\.me\/([^\/]+)\/(\d+)/)
  if (!match)
  {
    throw new Error('Invalid Telegram URL format')
  }
  throw new Error('Telegram post extraction requires additional setup')
}

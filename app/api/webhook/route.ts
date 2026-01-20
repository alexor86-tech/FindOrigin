import { NextRequest, NextResponse } from 'next/server'
import { processMessage } from '@/lib/telegram/processor'
import { handleStartCommand, handleHelpCommand } from '@/lib/telegram/commands'

/**
 * Handle GET requests (webhook verification, health check)
 * @param {NextRequest} request - Incoming request
 * @returns {NextResponse} - Response
 */
export async function GET(request: NextRequest)
{
  // Health check or webhook verification
  return NextResponse.json({ 
    status: 'ok', 
    message: 'FindOrigin bot webhook is running',
    timestamp: new Date().toISOString()
  })
}

/**
 * Webhook endpoint for receiving Telegram updates
 * @param {NextRequest} request - Incoming request with Telegram update
 * @returns {NextResponse} - 200 OK response
 */
export async function POST(request: NextRequest)
{
  // Log incoming request
  console.log('Received webhook request:', {
    method: request.method,
    url: request.url,
    contentType: request.headers.get('content-type'),
    contentLength: request.headers.get('content-length'),
  })

  // Read and parse body first (can only be read once)
  let update: any
  try
  {
    console.log('Reading request body...')
    const bodyText = await Promise.race([
      request.text(),
      new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error('Read timeout after 5s')), 5000)
      )
    ]) as string
    
    console.log('Body read, length:', bodyText.length)
    
    update = JSON.parse(bodyText)
    console.log('JSON parsed successfully, update_id:', update?.update_id)
  }
  catch (error)
  {
    console.error('Error reading/parsing request:', {
      error: error instanceof Error ? error.message : String(error),
    })
    // Return 200 OK even on error to prevent Telegram retries
    return NextResponse.json({ ok: false, error: 'Failed to process request' }, { status: 200 })
  }

  // Return 200 OK immediately to prevent Telegram from retrying
  const response = NextResponse.json({ ok: true })
  
  // Process update asynchronously (don't await)
  ;(async () =>
  {
    try
    {
      // Quick validation
      if (!update)
      {
        console.warn('Empty update received')
        return
      }

      // Handle different update types
      if (!update.message && !update.callback_query && !update.edited_message)
      {
        console.log('Update without message:', update.update_id)
        return
      }

      const message = update.message || update.edited_message
      if (!message)
      {
        console.log('No message in update')
        return
      }

      const chatId = message.chat?.id
      const messageText = message.text

      if (!chatId)
      {
        console.warn('No chat ID in message')
        return
      }

      console.log('Processing message:', { chatId, messageText })

      // Handle commands
      if (messageText?.startsWith('/'))
      {
        const command = messageText.split(' ')[0]
        console.log('Command received:', command)
        
        if (command === '/start')
        {
          console.log('Calling handleStartCommand...')
          await handleStartCommand(chatId)
          console.log('handleStartCommand completed')
        }
        else if (command === '/help')
        {
          console.log('Calling handleHelpCommand...')
          await handleHelpCommand(chatId)
          console.log('handleHelpCommand completed')
        }
        else
        {
          console.log('Processing unknown command as regular message...')
          await processMessage(chatId, messageText, message)
          console.log('processMessage completed')
        }
      }
      else
      {
        console.log('Processing regular message...')
        await processMessage(chatId, messageText, message)
        console.log('processMessage completed')
      }
    }
    catch (error)
    {
      console.error('Error in async message processing:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
    }
  })()

  // Return response immediately
  console.log('Returning 200 OK to Telegram')
  return response
}

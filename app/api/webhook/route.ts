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
  try
  {
    // Log incoming request for debugging
    console.log('Received webhook request:', {
      method: request.method,
      url: request.url,
    })

    const update = await request.json()
    
    console.log('Webhook update:', JSON.stringify(update, null, 2))

    // Quick validation
    if (!update)
    {
      console.warn('Empty update received')
      return NextResponse.json({ ok: false, error: 'Invalid update' }, { status: 400 })
    }

    // Handle different update types
    if (!update.message && !update.callback_query && !update.edited_message)
    {
      console.log('Update without message (might be other update type):', update.update_id)
      // Return 200 OK for other update types (e.g., channel posts, edits)
      return NextResponse.json({ ok: true, message: 'Update received but not processed' })
    }

    const message = update.message || update.edited_message
    if (!message)
    {
      return NextResponse.json({ ok: true, message: 'No message in update' })
    }

    const chatId = message.chat?.id
    const messageText = message.text

    if (!chatId)
    {
      console.warn('No chat ID in message:', message)
      return NextResponse.json({ ok: false, error: 'No chat ID' }, { status: 400 })
    }

    console.log('Processing message:', { chatId, messageText })

    // Return 200 OK immediately
    const response = NextResponse.json({ ok: true })

    // Handle commands
    if (messageText?.startsWith('/'))
    {
      const command = messageText.split(' ')[0]
      console.log('Command received:', command)
      
      if (command === '/start')
      {
        handleStartCommand(chatId).catch((error) =>
        {
          console.error('Error handling start command:', error)
        })
      }
      else if (command === '/help')
      {
        handleHelpCommand(chatId).catch((error) =>
        {
          console.error('Error handling help command:', error)
        })
      }
      else
      {
        // Unknown command - process as regular message
        processMessage(chatId, messageText, message).catch((error) =>
        {
          console.error('Error processing message:', error)
        })
      }
    }
    else
    {
      // Process message asynchronously
      processMessage(chatId, messageText, message).catch((error) =>
      {
        console.error('Error processing message:', error)
      })
    }

    return response
  }
  catch (error)
  {
    console.error('Webhook error:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

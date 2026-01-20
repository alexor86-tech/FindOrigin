import { NextRequest, NextResponse } from 'next/server'
import { processMessage } from '@/lib/telegram/processor'
import { handleStartCommand, handleHelpCommand } from '@/lib/telegram/commands'

/**
 * Handle GET requests (webhook verification, health check)
 */
export async function GET(request: NextRequest)
{
  return NextResponse.json({ 
    status: 'ok', 
    message: 'FindOrigin bot webhook is running',
    timestamp: new Date().toISOString()
  })
}

/**
 * Webhook endpoint for receiving Telegram updates
 */
export async function POST(request: NextRequest)
{
  console.log('[WEBHOOK] POST received')
  
  try
  {
    // Read body immediately (must be done before returning response)
    const update = await request.json().catch((error) =>
    {
      console.error('[WEBHOOK] JSON parse error:', error)
      return null
    })

    console.log('[WEBHOOK] Update parsed:', update?.update_id)

    // Process update asynchronously
    if (update)
    {
      // Start processing in background
      processUpdate(update).catch((error) =>
      {
        console.error('[WEBHOOK] Process error:', error)
      })
      
      // Wait a bit to ensure HTTPS request starts before function ends
      // This prevents Vercel from killing the function before request is sent
      console.log('[WEBHOOK] Waiting 500ms for request to start...')
      await new Promise(resolve => setTimeout(resolve, 500))
      console.log('[WEBHOOK] Wait completed, returning response')
    }

    console.log('[WEBHOOK] Returning 200 OK')
    return NextResponse.json({ ok: true })
  }
  catch (error)
  {
    console.error('[WEBHOOK] Fatal error:', error)
    // Still return 200 OK to prevent Telegram retries
    return NextResponse.json({ ok: true })
  }
}

/**
 * Process Telegram update asynchronously
 */
async function processUpdate(update: any): Promise<void>
{
  try
  {
    const message = update.message || update.edited_message
    if (!message)
    {
      console.log('[WEBHOOK] No message')
      return
    }

    const chatId = message.chat?.id
    const messageText = message.text

    if (!chatId)
    {
      console.warn('[WEBHOOK] No chatId')
      return
    }

    console.log('[WEBHOOK] Processing:', { chatId, cmd: messageText?.substring(0, 20) })

    if (messageText === '/start')
    {
      console.log('[WEBHOOK] /start')
      await handleStartCommand(chatId)
    }
    else if (messageText === '/help')
    {
      console.log('[WEBHOOK] /help')
      await handleHelpCommand(chatId)
    }
    else if (messageText?.startsWith('/'))
    {
      console.log('[WEBHOOK] Unknown command')
      await processMessage(chatId, messageText, message)
    }
    else if (messageText)
    {
      console.log('[WEBHOOK] Regular message')
      await processMessage(chatId, messageText, message)
    }
  }
  catch (error)
  {
    console.error('[WEBHOOK] Update processing error:', {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

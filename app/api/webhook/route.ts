import { NextRequest, NextResponse } from 'next/server'
import { processMessage } from '@/lib/telegram/processor'
import { handleStartCommand, handleHelpCommand } from '@/lib/telegram/commands'
import { checkGoogleSearchConfig } from '@/lib/search/google'

/**
 * Handle GET requests (webhook verification, health check)
 */
export async function GET(request: NextRequest)
{
  const configCheck = checkGoogleSearchConfig()
  
  return NextResponse.json({ 
    status: 'ok', 
    message: 'FindOrigin bot webhook is running',
    timestamp: new Date().toISOString(),
    config: {
      googleSearch: configCheck.configured ? 'configured' : 'not configured',
      errors: configCheck.errors,
    },
  })
}

/**
 * Webhook endpoint for receiving Telegram updates
 */
export async function POST(request: NextRequest)
{
  try
  {
    const update = await request.json().catch(() => null)

    if (!update)
    {
      return NextResponse.json({ ok: false, error: 'Invalid update' }, { status: 400 })
    }

    // Return 200 OK immediately
    const response = NextResponse.json({ ok: true })
    
    // Process update asynchronously
    if (update)
    {
      processUpdate(update).catch((error) =>
      {
        console.error('[WEBHOOK] Process error:', error)
      })
      
      // Wait to ensure HTTPS request starts before function ends
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    return response
  }
  catch (error)
  {
    console.error('[WEBHOOK] Fatal error:', error)
    return NextResponse.json({ ok: true })
  }
}

/**
 * Process Telegram update asynchronously
 * @param {object} update - Telegram update object
 */
async function processUpdate(update: any): Promise<void>
{
  const message = update.message || update.edited_message
  if (!message)
  {
    return
  }

  const chatId = message.chat?.id
  const messageText = message.text

  if (!chatId || !messageText)
  {
    return
  }

  if (messageText === '/start')
  {
    await handleStartCommand(chatId)
  }
  else if (messageText === '/help')
  {
    await handleHelpCommand(chatId)
  }
  else if (messageText.startsWith('/'))
  {
    await processMessage(chatId, messageText, message)
  }
  else
  {
    await processMessage(chatId, messageText, message)
  }
}

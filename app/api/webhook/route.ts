import { NextRequest, NextResponse } from 'next/server'
import { processMessage } from '@/lib/telegram/processor'
import { handleStartCommand, handleHelpCommand } from '@/lib/telegram/commands'

/**
 * Webhook endpoint for receiving Telegram updates
 * @param {NextRequest} request - Incoming request with Telegram update
 * @returns {NextResponse} - 200 OK response
 */
export async function POST(request: NextRequest)
{
  try
  {
    const update = await request.json()

    // Quick validation
    if (!update || !update.message)
    {
      return NextResponse.json({ ok: false, error: 'Invalid update' }, { status: 400 })
    }

    const chatId = update.message.chat?.id
    const messageText = update.message.text

    if (!chatId)
    {
      return NextResponse.json({ ok: false, error: 'No chat ID' }, { status: 400 })
    }

    // Return 200 OK immediately
    const response = NextResponse.json({ ok: true })

    // Handle commands
    if (messageText?.startsWith('/'))
    {
      const command = messageText.split(' ')[0]
      
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
        processMessage(chatId, messageText, update.message).catch((error) =>
        {
          console.error('Error processing message:', error)
        })
      }
    }
    else
    {
      // Process message asynchronously
      processMessage(chatId, messageText, update.message).catch((error) =>
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

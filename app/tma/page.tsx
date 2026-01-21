'use client'

/**
 * Telegram Mini App page
 */

import { useEffect, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { ScoredResult } from '@/lib/ai/openai'

interface SearchState
{
  loading: boolean
  results: ScoredResult[] | null
  error: string | null
}

export default function TmaPage()
{
  const [inputText, setInputText] = useState('')
  const [searchState, setSearchState] = useState<SearchState>({
    loading: false,
    results: null,
    error: null,
  })

  useEffect(() =>
  {
    // Initialize Telegram Web App
    if (typeof window !== 'undefined')
    {
      WebApp.ready()
      WebApp.expand()
      
      // Set theme colors
      WebApp.setHeaderColor('#2481cc')
      WebApp.setBackgroundColor('#ffffff')
    }
  }, [])

  /**
   * Handle search form submission
   * @param {React.FormEvent} e - Form event [in]
   */
  const handleSubmit = async (e: React.FormEvent) =>
  {
    e.preventDefault()
    
    if (!inputText.trim())
    {
      setSearchState({
        loading: false,
        results: null,
        error: 'Пожалуйста, введите текст или ссылку.',
      })
      return
    }

    setSearchState({
      loading: true,
      results: null,
      error: null,
    })

    try
    {
      const response = await fetch('/api/tma', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      })

      const data = await response.json()

      if (!data.success)
      {
        setSearchState({
          loading: false,
          results: null,
          error: data.error || 'Произошла ошибка при поиске.',
        })
        return
      }

      setSearchState({
        loading: false,
        results: data.results || [],
        error: null,
      })
    }
    catch (error)
    {
      console.error('Search error:', error)
      setSearchState({
        loading: false,
        results: null,
        error: 'Ошибка при отправке запроса. Проверьте подключение к интернету.',
      })
    }
  }

  /**
   * Get confidence emoji based on score
   * @param {number} confidence - Confidence score [in]
   * @returns {string} - Emoji [out]
   */
  const getConfidenceEmoji = (confidence: number): string =>
  {
    if (confidence >= 80)
    {
      return '🟢'
    }
    else if (confidence >= 60)
    {
      return '🟡'
    }
    else
    {
      return '🔴'
    }
  }

  return (
    <div className="tma-container">
      <div className="tma-header">
        <h1>🔍 FindOrigin</h1>
        <p>Найдите источники информации</p>
      </div>

      <form onSubmit={handleSubmit} className="tma-form">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Введите текст или ссылку на Telegram-пост..."
          className="tma-input"
          rows={4}
          disabled={searchState.loading}
        />
        <button
          type="submit"
          className="tma-button"
          disabled={searchState.loading || (!inputText.trim())}
        >
          {searchState.loading ? '🔍 Поиск...' : '🔎 Найти источники'}
        </button>
      </form>

      {searchState.error && (
        <div className="tma-error">
          <p>❌ {searchState.error}</p>
        </div>
      )}

      {searchState.results && searchState.results.length > 0 && (
        <div className="tma-results">
          <h2>📚 Найденные источники:</h2>
          {searchState.results.map((result, index) => (
            <div key={index} className="tma-result-card">
              <div className="tma-result-header">
                <h3>{result.title}</h3>
                <span className="tma-confidence">
                  {getConfidenceEmoji(result.confidence)} {result.confidence}%
                </span>
              </div>
              <a
                href={result.link}
                target="_blank"
                rel="noopener noreferrer"
                className="tma-link"
              >
                {result.displayLink || result.link}
              </a>
              {result.explanation && (
                <p className="tma-explanation">💡 {result.explanation}</p>
              )}
              {result.snippet && (
                <p className="tma-snippet">
                  {result.snippet.substring(0, 200)}
                  {result.snippet.length > 200 ? '...' : ''}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .tma-container
        {
          max-width: 100%;
          margin: 0 auto;
          padding: 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: var(--tg-theme-bg-color, #ffffff);
          color: var(--tg-theme-text-color, #000000);
          min-height: 100vh;
        }

        .tma-header
        {
          text-align: center;
          margin-bottom: 24px;
        }

        .tma-header h1
        {
          font-size: 24px;
          margin: 0 0 8px 0;
          color: var(--tg-theme-text-color, #000000);
        }

        .tma-header p
        {
          font-size: 14px;
          color: var(--tg-theme-hint-color, #999999);
          margin: 0;
        }

        .tma-form
        {
          margin-bottom: 24px;
        }

        .tma-input
        {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--tg-theme-hint-color, #e0e0e0);
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          background-color: var(--tg-theme-bg-color, #ffffff);
          color: var(--tg-theme-text-color, #000000);
          box-sizing: border-box;
        }

        .tma-input:focus
        {
          outline: none;
          border-color: var(--tg-theme-button-color, #2481cc);
        }

        .tma-input:disabled
        {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .tma-button
        {
          width: 100%;
          padding: 14px;
          margin-top: 12px;
          background-color: var(--tg-theme-button-color, #2481cc);
          color: var(--tg-theme-button-text-color, #ffffff);
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .tma-button:hover:not(:disabled)
        {
          opacity: 0.9;
        }

        .tma-button:active:not(:disabled)
        {
          opacity: 0.8;
        }

        .tma-button:disabled
        {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .tma-error
        {
          padding: 12px;
          background-color: #fee;
          border: 1px solid #fcc;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .tma-error p
        {
          margin: 0;
          color: #c00;
          font-size: 14px;
        }

        .tma-results
        {
          margin-top: 24px;
        }

        .tma-results h2
        {
          font-size: 18px;
          margin: 0 0 16px 0;
          color: var(--tg-theme-text-color, #000000);
        }

        .tma-result-card
        {
          background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .tma-result-header
        {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .tma-result-header h3
        {
          font-size: 16px;
          margin: 0;
          flex: 1;
          color: var(--tg-theme-text-color, #000000);
        }

        .tma-confidence
        {
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
          margin-left: 12px;
        }

        .tma-link
        {
          display: block;
          color: var(--tg-theme-link-color, #2481cc);
          font-size: 14px;
          text-decoration: none;
          margin-bottom: 8px;
          word-break: break-all;
        }

        .tma-link:hover
        {
          text-decoration: underline;
        }

        .tma-explanation
        {
          font-size: 14px;
          color: var(--tg-theme-hint-color, #666666);
          margin: 8px 0;
        }

        .tma-snippet
        {
          font-size: 14px;
          color: var(--tg-theme-text-color, #000000);
          margin: 8px 0 0 0;
          line-height: 1.5;
        }
      `}</style>
    </div>
  )
}

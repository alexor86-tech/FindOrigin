/**
 * Google Custom Search API integration
 */

/**
 * Check if Google Search API is properly configured
 * @returns {object} Configuration status [out]
 */
export function checkGoogleSearchConfig(): { configured: boolean; errors: string[] }
{
  const errors: string[] = []
  
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_google_search_api_key_here')
  {
    errors.push('GOOGLE_SEARCH_API_KEY is not set or not properly configured')
  }
  
  const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID
  if (!engineId || engineId.trim() === '' || engineId === 'your_search_engine_id_here')
  {
    errors.push('GOOGLE_SEARCH_ENGINE_ID is not set or not properly configured')
  }
  
  return {
    configured: errors.length === 0,
    errors,
  }
}

function getGoogleSearchApiKey(): string
{
  const key = process.env.GOOGLE_SEARCH_API_KEY
  if (!key)
  {
    throw new Error('GOOGLE_SEARCH_API_KEY is not set. Please configure it in your environment variables.')
  }
  if (key.trim() === '' || key === 'your_google_search_api_key_here')
  {
    throw new Error('GOOGLE_SEARCH_API_KEY is not properly configured. Please set a valid API key.')
  }
  return key
}

function getGoogleSearchEngineId(): string
{
  const id = process.env.GOOGLE_SEARCH_ENGINE_ID
  if (!id)
  {
    throw new Error('GOOGLE_SEARCH_ENGINE_ID is not set. Please configure it in your environment variables.')
  }
  if (id.trim() === '' || id === 'your_search_engine_id_here')
  {
    throw new Error('GOOGLE_SEARCH_ENGINE_ID is not properly configured. Please set a valid Search Engine ID.')
  }
  return id
}

export interface SearchResult
{
  title: string
  link: string
  snippet: string
  displayLink: string
}

interface SearchResponse
{
  items?: SearchResult[]
  searchInformation?: {
    totalResults: string
  }
}

/**
 * Search using Google Custom Search API
 * @param {string} query - Search query [in]
 * @param {number} numResults - Number of results to return (max 10 per request) [in]
 * @returns {Promise<SearchResult[]>} - Search results [out]
 */
export async function searchGoogle(query: string, numResults: number = 10): Promise<SearchResult[]>
{
  const apiKey = getGoogleSearchApiKey()
  const engineId = getGoogleSearchEngineId()

  const resultsPerRequest = Math.min(numResults, 10)
  const allResults: SearchResult[] = []
  const numRequests = Math.ceil(numResults / 10)
  
  for (let i = 0; i < numRequests && allResults.length < numResults; i++)
  {
    const startIndex = i * 10 + 1
    const resultsNeeded = Math.min(10, numResults - allResults.length)

    const url = new URL('https://www.googleapis.com/customsearch/v1')
    url.searchParams.append('key', apiKey)
    url.searchParams.append('cx', engineId)
    url.searchParams.append('q', query)
    url.searchParams.append('num', resultsNeeded.toString())
    url.searchParams.append('start', startIndex.toString())

    try
    {
      const response = await fetch(url.toString())
      
      if (!response.ok)
      {
        let errorMessage = 'Unknown error'
        let errorDetails: any = null
        
        try
        {
          errorDetails = await response.json()
          errorMessage = errorDetails.error?.message || JSON.stringify(errorDetails)
        }
        catch (parseError)
        {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        
        // Handle specific error cases
        if (response.status === 400)
        {
          if (i > 0)
          {
            // This is expected when requesting pages beyond available results
            break
          }
          // Check for common 400 errors
          if (errorMessage.includes('invalid') || errorMessage.includes('Invalid'))
          {
            throw new Error(`Invalid Google Search API configuration: ${errorMessage}. Please check your API key and Search Engine ID.`)
          }
          throw new Error(`Google Search API request error: ${errorMessage}`)
        }
        else if (response.status === 403)
        {
          throw new Error(`Google Search API access denied: ${errorMessage}. Please check if the API is enabled and your API key has proper permissions.`)
        }
        else if (response.status === 429)
        {
          throw new Error(`Google Search API quota exceeded: ${errorMessage}. Please check your API quota limits.`)
        }
        else if (response.status === 401)
        {
          throw new Error(`Google Search API authentication failed: ${errorMessage}. Please check your API key.`)
        }
        
        throw new Error(`Google Search API error (${response.status}): ${errorMessage}`)
      }

      const data: SearchResponse = await response.json()
      
      if (data.items && (data.items.length > 0))
      {
        allResults.push(...data.items)
      }
      else
      {
        break
      }
    }
    catch (error)
    {
      if (i === 0)
      {
        // Log full error details for debugging
        console.error('Error searching Google:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        })
        throw error
      }
      break
    }
  }

  return allResults.slice(0, numResults)
}

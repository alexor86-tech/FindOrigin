/**
 * Google Custom Search API integration
 */

function getGoogleSearchApiKey(): string
{
  const key = process.env.GOOGLE_SEARCH_API_KEY
  if (!key)
  {
    throw new Error('GOOGLE_SEARCH_API_KEY is not set')
  }
  return key
}

function getGoogleSearchEngineId(): string
{
  const id = process.env.GOOGLE_SEARCH_ENGINE_ID
  if (!id)
  {
    throw new Error('GOOGLE_SEARCH_ENGINE_ID is not set')
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
        const error = await response.json()
        if ((response.status === 400) && (i > 0))
        {
          break
        }
        throw new Error(`Google Search API error: ${JSON.stringify(error)}`)
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
        console.error('Error searching Google:', error)
        throw error
      }
      break
    }
  }

  return allResults.slice(0, numResults)
}

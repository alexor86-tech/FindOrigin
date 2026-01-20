/**
 * Google Custom Search API integration
 */

// Lazy getters to avoid errors during build
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

export interface SearchResponse
{
  items?: SearchResult[]
  searchInformation?: {
    totalResults: string
  }
}

/**
 * Search using Google Custom Search API
 * @param {string} query - Search query
 * @param {number} numResults - Number of results to return (max 10 per request)
 * @returns {Promise<SearchResult[]>} - Search results
 */
export async function searchGoogle(query: string, numResults: number = 10): Promise<SearchResult[]>
{
  const apiKey = getGoogleSearchApiKey()
  const engineId = getGoogleSearchEngineId()

  // Google API allows max 10 results per request
  const resultsPerRequest = Math.min(numResults, 10)
  const allResults: SearchResult[] = []

  // If we need more than 10 results, make multiple requests with pagination
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
        // If it's a 400 error on pagination, stop trying more pages
        if (response.status === 400 && i > 0)
        {
          break
        }
        throw new Error(`Google Search API error: ${JSON.stringify(error)}`)
      }

      const data: SearchResponse = await response.json()
      
      if (data.items && data.items.length > 0)
      {
        allResults.push(...data.items)
      }
      else
      {
        // No more results
        break
      }
    }
    catch (error)
    {
      // If first request fails, throw error
      if (i === 0)
      {
        console.error('Error searching Google:', error)
        throw error
      }
      // Otherwise, just stop pagination
      break
    }
  }

  return allResults.slice(0, numResults)
}

/**
 * Search multiple queries and combine results
 * @param {string[]} queries - Array of search queries
 * @param {number} resultsPerQuery - Number of results per query
 * @returns {Promise<SearchResult[]>} - Combined search results
 */
export async function searchMultiple(
  queries: string[],
  resultsPerQuery: number = 5
): Promise<SearchResult[]>
{
  const allResults: SearchResult[] = []
  const seenLinks = new Set<string>()

  for (const query of queries)
  {
    try
    {
      const results = await searchGoogle(query, resultsPerQuery)
      
      for (const result of results)
      {
        // Filter duplicates
        if (!seenLinks.has(result.link))
        {
          seenLinks.add(result.link)
          allResults.push(result)
        }
      }
    }
    catch (error)
    {
      console.error(`Error searching query "${query}":`, error)
      // Continue with other queries
    }
  }

  return allResults
}

/**
 * Filter results by source type
 * @param {SearchResult[]} results - Search results
 * @param {string} sourceType - Type of source (official, news, blogs, research)
 * @returns {SearchResult[]} - Filtered results
 */
export function filterBySourceType(results: SearchResult[], sourceType: string): SearchResult[]
{
  const typePatterns: Record<string, RegExp[]> = {
    official: [
      /\.gov\./i,
      /\.org/i,
      /official/i,
    ],
    news: [
      /\.news/i,
      /rbc\.ru/i,
      /ria\.ru/i,
      /tass\.ru/i,
      /interfax\.ru/i,
      /lenta\.ru/i,
      /vedomosti\.ru/i,
    ],
    blogs: [
      /medium\.com/i,
      /habr\.com/i,
      /blog/i,
    ],
    research: [
      /\.edu/i,
      /academic/i,
      /research/i,
      /scholar/i,
      /arxiv\.org/i,
    ],
  }

  const patterns = typePatterns[sourceType] || []
  
  if (patterns.length === 0)
  {
    return results
  }

  return results.filter(result =>
  {
    return patterns.some(pattern => pattern.test(result.link) || pattern.test(result.displayLink))
  })
}

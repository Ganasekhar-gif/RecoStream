import axios from 'axios'

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: 'http://localhost:8000', // Direct connection to FastAPI
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request logging for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`)
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Add response logging for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, response.status, response.data)
    return response
  },
  (error) => {
    console.error(`Error from ${error.config?.url}:`, error.response?.status, error.response?.data)
    return Promise.reject(error)
  }
)

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// TMDB API configuration
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

// Direct poster URL helpers
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'

export const posterHelpers = {
  // Get direct poster URL from poster_path
  getPosterUrl: (poster_path) => {
    if (!poster_path || poster_path.trim() === '') {
      return '/placeholder-poster.jpg'
    }
    // Ensure poster_path starts with /
    const cleanPath = poster_path.startsWith('/') ? poster_path : `/${poster_path}`
    return `${TMDB_IMAGE_BASE_URL}${cleanPath}`
  },

  // Add poster URLs to movies array with validation
  addPosterUrls: (movies) => {
    return movies.map(movie => {
      const posterUrl = posterHelpers.getPosterUrl(movie.poster_path)
      return {
        ...movie,
        poster_url: posterUrl,
        fallback_poster: '/placeholder-poster.jpg',
        has_valid_poster: movie.poster_path && movie.poster_path.trim() !== ''
      }
    })
  },


  // Preload poster images to avoid loading delays
  preloadPoster: (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(url)
      img.onerror = () => reject(new Error(`Failed to load ${url}`))
      img.src = url
    })
  },

  // Batch preload posters for better UX
  batchPreloadPosters: async (movies) => {
    const preloadPromises = movies
      .filter(movie => movie.has_valid_poster)
      .map(movie => posterHelpers.preloadPoster(movie.poster_url))
    
    const results = await Promise.allSettled(preloadPromises)
    const successCount = results.filter(r => r.status === 'fulfilled').length
    console.log(`📸 Preloaded ${successCount}/${preloadPromises.length} posters`)
    
    return movies
  },

  // Handle poster load errors with retry
  handlePosterError: (event, fallbackUrl = '/placeholder-poster.jpg') => {
    const img = event.target
    if (img.src !== fallbackUrl) {
      console.log(`🔄 Poster failed to load, using fallback: ${img.src}`)
      img.src = fallbackUrl
    }
  }
}

// Validate TMDB API key
if (!TMDB_API_KEY) {
  console.warn('TMDB API key not found. Please add VITE_TMDB_API_KEY to your .env file.')
}

export const tmdbApi = axios.create({
  baseURL: TMDB_BASE_URL,
  timeout: 15000,
  params: {
    api_key: TMDB_API_KEY,
  },
})

// Retry mechanism utility
const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn()
    } catch (error) {
      console.warn(`TMDB API attempt ${attempt} failed:`, error.message)
      
      // Don't retry on authentication errors (401) or not found (404)
      if (error.response?.status === 401 || error.response?.status === 404) {
        throw error
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = delay * Math.pow(2, attempt - 1)
      console.log(`Retrying TMDB request in ${waitTime}ms...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
}

// Helper functions for TMDB
export const tmdbHelpers = {
  getImageUrl: (path, size = 'w500') => {
    if (!path) return '/placeholder-movie.jpg'
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`
  },
  
  searchMovie: async (query, maxRetries = 3) => {
    if (!TMDB_API_KEY) {
      console.error('TMDB API key not configured')
      return []
    }
    
    try {
      const response = await retryRequest(
        () => tmdbApi.get('/search/movie', {
          params: { 
            query: query.trim(), 
            include_adult: false,
            language: 'en-US'
          }
        }),
        maxRetries
      )
      return response.data.results || []
    } catch (error) {
      console.error('TMDB search error after retries:', error.message)
      return []
    }
  },
  
  getMovieDetails: async (movieId, maxRetries = 3) => {
    if (!TMDB_API_KEY) {
      console.error('TMDB API key not configured')
      return null
    }
    
    try {
      const response = await retryRequest(
        () => tmdbApi.get(`/movie/${movieId}`, {
          params: { language: 'en-US' }
        }),
        maxRetries
      )
      return response.data
    } catch (error) {
      console.error('TMDB movie details error after retries:', error.message)
      return null
    }
  },
  
  getMoviePoster: async (title, year, maxRetries = 3) => {
    if (!TMDB_API_KEY) {
      console.warn('TMDB API key not configured, using placeholder image')
      return '/placeholder-movie.jpg'
    }
    
    if (!title || title.trim() === '') {
      console.warn('No title provided for poster fetch')
      return '/placeholder-movie.jpg'
    }
    
    console.log(`Fetching poster for: "${title}" (${year})`)
    
    try {
      // Try with year first for better accuracy
      let searchQuery = year ? `${title.trim()} ${year}` : title.trim()
      console.log(`TMDB search query: "${searchQuery}"`)
      let results = await tmdbHelpers.searchMovie(searchQuery, maxRetries)
      
      // If no results with year, try without year
      if (results.length === 0 && year) {
        console.log(`No results for "${searchQuery}", trying without year...`)
        results = await tmdbHelpers.searchMovie(title.trim(), maxRetries)
      }
      
      console.log(`TMDB search returned ${results.length} results`)
      
      // Try to find exact or close match
      if (results.length > 0) {
        // Look for exact title match first
        const exactMatch = results.find(movie => 
          movie.title?.toLowerCase() === title.toLowerCase() ||
          movie.original_title?.toLowerCase() === title.toLowerCase()
        )
        
        const selectedMovie = exactMatch || results[0]
        console.log(`Selected movie: ${selectedMovie.title} (${selectedMovie.release_date})`)
        
        if (selectedMovie.poster_path) {
          const posterUrl = tmdbHelpers.getImageUrl(selectedMovie.poster_path)
          console.log(`Poster URL: ${posterUrl}`)
          return posterUrl
        }
      }
      
      console.log(`No poster found for movie: ${title} (${year})`)
      return '/placeholder-movie.jpg'
    } catch (error) {
      console.error(`Error fetching poster for "${title}" (${year}):`, error.message)
      return '/placeholder-movie.jpg'
    }
  },
  
  // Batch poster fetching with rate limiting
  getMoviePosters: async (movies, maxConcurrent = 5) => {
    if (!Array.isArray(movies) || movies.length === 0) {
      return []
    }
    
    const results = []
    
    // Process movies in batches to avoid rate limiting
    for (let i = 0; i < movies.length; i += maxConcurrent) {
      const batch = movies.slice(i, i + maxConcurrent)
      
      const batchPromises = batch.map(async (movie) => {
        const posterUrl = await tmdbHelpers.getMoviePoster(movie.title, movie.year)
        return {
          ...movie,
          poster_url: posterUrl
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      // Add small delay between batches to be respectful to TMDB API
      if (i + maxConcurrent < movies.length) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
    
    return results
  }
}

// API endpoints
export const endpoints = {
  // Auth
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/user/', data),
  me: () => api.get('/user/me'),
  
  // Recommendations - Single endpoint for all recommendation types
  getRecommendations: (user_input, user_id) => api.post('/recommend/', { user_input, user_id }),
  
  // Feedback
  submitFeedback: (data) => api.post('/feedback/', data),
  trackClick: (user_id, movie_id) => api.post('/feedback/feedback/click/', null, { params: { user_id, movie_id } }),
  
  // User stats
  getUserStats: (user_id) => api.get(`/feedback/stats/${user_id}`),
}

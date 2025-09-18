import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search as SearchIcon, Loader2 } from 'lucide-react'
import { endpoints, posterHelpers } from '../utils/api'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import MovieGrid from '../components/MovieGrid'
import MovieModal from '../components/MovieModal'

const Search = () => {
  const [query, setQuery] = useState('')
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState(null)
  const { toast } = useToast()
  const { user } = useAuth()
  const { triggerRefresh } = useProfile()

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    
    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    try {
      setLoading(true)
      const response = await endpoints.getRecommendations(query, user.id)
      console.log('Search recommendations response:', response.data)
      
      if (!response.data || response.data.length === 0) {
        toast.info(`No movies found for "${query}". Try a different search term.`)
        setMovies([])
        return
      }
      
      let moviesList = []
      try {
        moviesList = posterHelpers.addPosterUrls(response.data)
        try {
          await posterHelpers.batchPreloadPosters(moviesList)
        } catch (preloadErr) {
          console.warn('Preload posters failed (non-blocking):', preloadErr)
        }
      } catch (mapErr) {
        console.warn('Mapping poster URLs failed, falling back to raw data:', mapErr)
        moviesList = Array.isArray(response.data) ? response.data : []
      }

      setMovies(moviesList)
      toast.success(`Found ${response.data.length} movies for "${query}"`)
    } catch (error) {
      console.error('Error searching movies:', error)
      toast.error('Failed to search movies')
      setMovies([])
    } finally {
      setLoading(false)
    }
  }

  const handleMovieClick = async (movie) => {
    // Track click as feedback
    if (user?.id) {
      try {
        await endpoints.trackClick(user.id, movie.id)
      } catch (error) {
        console.error('Error tracking click:', error)
      }
    }
    setSelectedMovie(movie)
  }

  const handleCloseModal = () => {
    setSelectedMovie(null)
  }

  const handleFeedback = async (movieId, feedback) => {
    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    try {
      await endpoints.submitFeedback({
        user_id: user.id,
        movie_id: movieId,
        feedback_type: feedback
      })
      
      // Optimistic UI update
      setMovies(prevMovies => 
        prevMovies.map(movie => 
          movie.id === movieId 
            ? { ...movie, user_feedback: feedback }
            : movie
        )
      )
      
      toast.success(`Movie ${feedback === 'like' ? 'liked' : 'disliked'}!`)
      
      // Trigger profile refresh for real-time updates
      triggerRefresh()
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('Failed to submit feedback')
    }
  }

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Search Movies
          </h1>
          <p className="text-gray-400">
            Find movies and get personalized recommendations
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative max-w-2xl">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for movies..."
              className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <motion.button
              type="submit"
              disabled={loading || !query.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Search'
              )}
            </motion.button>
          </div>
        </form>

        {/* Results */}
        {movies.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">
              Search Results ({movies.length})
            </h2>
            <MovieGrid 
              movies={movies}
              onMovieClick={handleMovieClick}
              onFeedback={handleFeedback}
            />
          </div>
        )}

        {/* Empty State */}
        {!loading && movies.length === 0 && query && (
          <div className="text-center py-12">
            <SearchIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No results found</h3>
            <p className="text-gray-500">Try searching with different keywords</p>
          </div>
        )}
      </motion.div>

      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          isOpen={!!selectedMovie}
          onClose={handleCloseModal}
          onFeedback={handleFeedback}
        />
      )}
    </div>
  )
}

export default Search

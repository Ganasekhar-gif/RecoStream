import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { endpoints, posterHelpers } from '../utils/api'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import MovieGrid from '../components/MovieGrid'
import MovieModal from '../components/MovieModal'

const Home = () => {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMovie, setSelectedMovie] = useState(null)
  const { toast } = useToast()
  const { user } = useAuth()
  const { triggerRefresh } = useProfile()

  useEffect(() => {
    if (user?.id) {
      fetchRecommendations()
    }
  }, [user])

  const fetchRecommendations = async () => {
    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    try {
      setLoading(true)
      // For home page, use generic input for personalized recommendations
      const response = await endpoints.getRecommendations("popular movies", user.id)
      console.log('Home recommendations response:', response.data)

      let moviesList = []
      try {
        // Map poster paths from backend without contacting any other service
        moviesList = posterHelpers.addPosterUrls(response.data)
        // Best-effort preload; do not fail the flow if it errors
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
    } catch (error) {
      console.error('Error fetching recommendations:', error?.response?.data || error?.message || error)
      toast.error('Failed to load recommendations')
      setMovies([]) // Set empty array on error
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading your personalized recommendations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 h-screen overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Recommended for You
          </h1>
          <p className="text-gray-400">
            Discover movies tailored to your taste
          </p>
        </div>

        <MovieGrid 
          movies={movies}
          onMovieClick={handleMovieClick}
          onFeedback={handleFeedback}
        />
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

export default Home

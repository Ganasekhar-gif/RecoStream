import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { endpoints, posterHelpers } from '../utils/api'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import MovieGrid from '../components/MovieGrid'
import MovieModal from '../components/MovieModal'

const Genre = () => {
  const { genreName } = useParams()
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMovie, setSelectedMovie] = useState(null)
  const { toast } = useToast()
  const { user } = useAuth()
  const { triggerRefresh } = useProfile()

  useEffect(() => {
    if (genreName && user?.id) {
      fetchGenreRecommendations()
    }
  }, [genreName, user])

  const fetchGenreRecommendations = async () => {
    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    try {
      setLoading(true)
      const response = await endpoints.getRecommendations(genreName, user.id)
      console.log('Genre recommendations response:', response.data)
      
      if (!response.data || response.data.length === 0) {
        toast.info(`No ${genreName} movies found. Try a different genre.`)
        setMovies([])
        return
      }
      
      // Add poster URLs directly from backend data
      let moviesWithPosters = posterHelpers.addPosterUrls(response.data)
      
      // Merge user feedback state with movie data
      moviesWithPosters = await mergeUserFeedbackWithMovies(moviesWithPosters)
      
      // Preload posters for better UX
      await posterHelpers.batchPreloadPosters(moviesWithPosters)
      
      setMovies(moviesWithPosters)
    } catch (error) {
      console.error('Error fetching genre recommendations:', error)
      toast.error('Failed to load genre recommendations')
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

  // Helper function to merge user feedback state with movie data
  const mergeUserFeedbackWithMovies = async (movies) => {
    if (!user?.id || !movies || movies.length === 0) {
      return movies
    }

    try {
      // Fetch user's feedback stats
      const statsResponse = await endpoints.getUserStats(user.id)
      const userFeedbacks = statsResponse.data.feedbacks || []
      
      // Create a lookup map for faster access
      const feedbackMap = {}
      userFeedbacks.forEach(feedback => {
        feedbackMap[feedback.movie_id] = feedback.feedback_type
      })

      // Merge feedback state with movie data
      const moviesWithFeedback = movies.map(movie => ({
        ...movie,
        user_feedback: feedbackMap[movie.id] || null
      }))

      console.log(`Merged feedback state for ${Object.keys(feedbackMap).length} movies in ${genreName} genre`)
      return moviesWithFeedback
    } catch (error) {
      console.log('Could not fetch user feedback for genre merging:', error.response?.status)
      // Return movies without feedback state if API fails
      return movies.map(movie => ({ ...movie, user_feedback: null }))
    }
  }

  const handleFeedback = async (movieId, feedback) => {
    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    // Find the current movie to check existing feedback
    const currentMovie = movies.find(movie => movie.id === movieId)
    const currentFeedback = currentMovie?.user_feedback

    // If user clicks the same feedback type, show message and don't submit
    if (currentFeedback === feedback) {
      toast.info(`You have already ${feedback === 'like' ? 'liked' : 'disliked'} this movie!`)
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
      
      const actionText = feedback === 'like' ? 'liked' : 'disliked'
      const previousAction = currentFeedback ? ` (changed from ${currentFeedback})` : ''
      toast.success(`Movie ${actionText}!${previousAction}`)
      
      // Trigger profile refresh for real-time updates
      triggerRefresh()
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('Failed to submit feedback')
    }
  }

  const capitalizeGenre = (genre) => {
    return genre.charAt(0).toUpperCase() + genre.slice(1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading {capitalizeGenre(genreName)} movies...</p>
        </div>
      </div>
    )
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
            {capitalizeGenre(genreName)} Movies
          </h1>
          <p className="text-gray-400">
            Discover the best {genreName} movies tailored for you
          </p>
        </div>

        {movies.length > 0 ? (
          <MovieGrid 
            movies={movies}
            onMovieClick={handleMovieClick}
            onFeedback={handleFeedback}
          />
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No movies found</h3>
            <p className="text-gray-500">We couldn't find any {genreName} movies for you right now.</p>
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

export default Genre

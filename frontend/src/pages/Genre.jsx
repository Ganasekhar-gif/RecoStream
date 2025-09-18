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
      const moviesWithPosters = posterHelpers.addPosterUrls(response.data)
      
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

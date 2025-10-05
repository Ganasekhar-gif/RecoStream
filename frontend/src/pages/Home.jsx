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
    if (user?.id) fetchRecommendations()
  }, [user])

  const fetchRecommendations = async () => {
    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    try {
      setLoading(true)
      console.log(`Fetching personalized recommendations for user ${user.id}`)
      
      let userInput = "popular movies"
      let isPersonalized = false

      try {
        const statsResponse = await endpoints.getUserStats(user.id)
        const userStats = statsResponse.data
        console.log('User feedback stats:', userStats)

        if (userStats.total_feedback > 0) {
          isPersonalized = true
          userInput = await generatePersonalizedInput(userStats.feedbacks)
          console.log('Generated personalized input:', userInput)
        } else {
          console.log('New user detected - using collaborative filtering approach')
          userInput = "trending popular movies recommendations"
        }
      } catch (statsError) {
        console.log('No feedback stats found, treating as new user:', statsError.response?.status)
        userInput = "trending popular movies recommendations"
      }

      const response = await endpoints.getRecommendations(userInput, user.id)
      console.log(`${isPersonalized ? 'Personalized' : 'Cold start'} recommendations response:`, response.data)

      let moviesList = []
      try {
        // Map poster paths from backend without contacting any other service
        moviesList = posterHelpers.addPosterUrls(response.data)
        
        // Step 3: Merge user feedback state with movie data
        moviesList = await mergeUserFeedbackWithMovies(moviesList)
        
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
      setMovies([]) 
    } finally {
      setLoading(false)
    }
  }

  // Hybrid Personalized Input: top likes/clicks + aggregated genres with weighted dislikes
  const generatePersonalizedInput = async (feedbacks) => {
    if (!feedbacks || feedbacks.length === 0) return "popular movies"

    const liked = feedbacks.filter(f => f.feedback_type === 'like')
    const clicked = feedbacks.filter(f => f.feedback_type === 'click')
    const disliked = feedbacks.filter(f => f.feedback_type === 'dislike')

    const topLikedMovies = liked.sort((a,b)=>b.timestamp - a.timestamp).map(f => f.movie_title).slice(0, 5)
    const topClickedMovies = clicked.sort((a,b)=>b.timestamp - a.timestamp).map(f => f.movie_title).slice(0, 3)

    // Create personalized input based on user preferences
    let personalizedInput = ""
    
    if (topLikedMovies.length > 0) {
      personalizedInput = `movies similar to ${topLikedMovies.join(', ')}`
    } else if (topClickedMovies.length > 0) {
      personalizedInput = `movies like ${topClickedMovies.join(', ')}`
    } else {
      // User has feedback but no likes/clicks, use their interaction history
      const recentMovies = feedbacks
        .slice(0, 2)
        .map(f => f.movie_title)
      personalizedInput = `recommendations based on ${recentMovies.join(', ')}`
    }

    return personalizedInput
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

      console.log(`Merged feedback state for ${Object.keys(feedbackMap).length} movies`)
      return moviesWithFeedback
    } catch (error) {
      console.log('Could not fetch user feedback for merging:', error.response?.status)
      // Return movies without feedback state if API fails
      return movies.map(movie => ({ ...movie, user_feedback: null }))
    }
  }

  const handleMovieClick = async (movie) => {
    if (user?.id) {
      try { await endpoints.trackClick(user.id, movie.id) } 
      catch (error) { console.error('Error tracking click:', error) }
    }
    setSelectedMovie(movie)
  }

  const handleCloseModal = () => setSelectedMovie(null)

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

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-gray-400">Loading your personalized recommendations...</p>
      </div>
    </div>
  )

  return (
    <div className="p-6 h-screen overflow-y-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Recommended for You</h1>
          <p className="text-gray-400">
            {movies.length > 0 ? 'Discover movies tailored to your personal taste' : 'Loading your personalized recommendations...'}
          </p>
        </div>
        <MovieGrid movies={movies} onMovieClick={handleMovieClick} onFeedback={handleFeedback} />
      </motion.div>

      {selectedMovie && (
        <MovieModal movie={selectedMovie} isOpen={!!selectedMovie} onClose={handleCloseModal} onFeedback={handleFeedback} />
      )}
    </div>
  )
}

export default Home

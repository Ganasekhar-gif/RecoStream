import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, ThumbsDown, Star, Calendar } from 'lucide-react'

const MovieCard = ({ movie, onClick, onFeedback }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [feedbackLoading, setFeedbackLoading] = useState(null)

  const handleFeedback = async (e, feedbackType) => {
    e.stopPropagation()
    setFeedbackLoading(feedbackType)
    
    try {
      await onFeedback(movie.id, feedbackType)
    } finally {
      setFeedbackLoading(null)
    }
  }

  return (
    <motion.div
      className="movie-card relative bg-gray-800 rounded-lg overflow-hidden cursor-pointer group"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      {/* Movie Poster */}
      <div className="aspect-[2/3] relative overflow-hidden">
        <img
          src={movie.poster_path || '/placeholder-movie.jpg'}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="eager"
          onLoad={(e) => {
            e.target.style.opacity = '1'
          }}
          onError={(e) => {
            console.log(`🔄 Poster failed to load for "${movie.title}", using fallback`)
            e.target.src = '/placeholder-movie.jpg'
            e.target.style.opacity = '1'
          }}
          style={{ opacity: '0', transition: 'opacity 0.3s ease' }}
        />
        
        {/* Overlay on hover */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute inset-0 bg-black/60 flex items-center justify-center"
        >
          <div className="flex space-x-3">
            <motion.button
              onClick={(e) => handleFeedback(e, 'like')}
              disabled={feedbackLoading === 'like'}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`
                p-2 rounded-full transition-colors
                ${movie.user_feedback === 'like' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/20 text-white hover:bg-red-500'
                }
                ${feedbackLoading === 'like' ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <Heart className="w-5 h-5" fill={movie.user_feedback === 'like' ? 'currentColor' : 'none'} />
            </motion.button>
            
            <motion.button
              onClick={(e) => handleFeedback(e, 'dislike')}
              disabled={feedbackLoading === 'dislike'}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`
                p-2 rounded-full transition-colors
                ${movie.user_feedback === 'dislike' 
                  ? 'bg-gray-600 text-white' 
                  : 'bg-white/20 text-white hover:bg-gray-600'
                }
                ${feedbackLoading === 'dislike' ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <ThumbsDown className="w-5 h-5" fill={movie.user_feedback === 'dislike' ? 'currentColor' : 'none'} />
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Movie Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white text-sm mb-2 line-clamp-2">
          {movie.title}
        </h3>
        
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{movie.year}</span>
          </div>
        </div>
        
        {/* Movie Rating - only show if rating exists and is not 0 */}
        {movie.rating && movie.rating !== 0 && movie.rating > 0 && (
          <div className="flex items-center space-x-1 text-xs text-yellow-400">
            <Star className="w-3 h-3 fill-current" />
            <span className="font-medium">{movie.rating}/10</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default MovieCard

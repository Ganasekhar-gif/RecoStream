import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, ThumbsDown, Star, Calendar, Clock } from 'lucide-react'

const MovieModal = ({ movie, isOpen, onClose, onFeedback }) => {
  if (!movie) return null

  const handleFeedback = async (feedbackType) => {
    await onFeedback(movie.id, feedbackType)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col md:flex-row">
                {/* Movie Poster */}
                <div className="md:w-1/3">
                  <img
                    src={movie.poster_path || '/placeholder-movie.jpg'}
                    alt={movie.title}
                    className="w-full h-64 md:h-96 object-cover"
                    onError={(e) => {
                      console.log(`🔄 Modal poster failed to load, using fallback: ${e.target.src}`)
                      if (e.target.src !== '/placeholder-movie.jpg') {
                        e.target.src = '/placeholder-movie.jpg'
                      }
                    }}
                  />
                </div>

                {/* Movie Details */}
                <div className="md:w-2/3 p-6">
                  <h1 className="text-3xl font-bold text-white mb-4">
                    {movie.title}
                  </h1>

                  <div className="flex items-center space-x-6 mb-6 text-gray-300">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5" />
                      <span>{movie.year}</span>
                    </div>
                    
                    {movie.runtime && (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5" />
                        <span>{movie.runtime} min</span>
                      </div>
                    )}
                    
                    {movie.rating && movie.rating !== 0 && movie.rating > 0 && (
                      <div className="flex items-center space-x-2">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="font-medium">{movie.rating}/10</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {movie.description && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-2">Overview</h3>
                      <p className="text-gray-300 leading-relaxed">
                        {movie.description}
                      </p>
                    </div>
                  )}

                  {/* Genres */}
                  {movie.genres && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-2">Genres</h3>
                      <div className="flex flex-wrap gap-2">
                        {movie.genres.map((genre, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    <motion.button
                      onClick={() => handleFeedback('like')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`
                        flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors
                        ${movie.user_feedback === 'like'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-red-500 hover:text-white'
                        }
                      `}
                    >
                      <Heart className="w-5 h-5" fill={movie.user_feedback === 'like' ? 'currentColor' : 'none'} />
                      <span>Like</span>
                    </motion.button>

                    <motion.button
                      onClick={() => handleFeedback('dislike')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`
                        flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors
                        ${movie.user_feedback === 'dislike'
                          ? 'bg-gray-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                        }
                      `}
                    >
                      <ThumbsDown className="w-5 h-5" fill={movie.user_feedback === 'dislike' ? 'currentColor' : 'none'} />
                      <span>Not Interested</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default MovieModal

import React from 'react'
import { motion } from 'framer-motion'
import MovieCard from './MovieCard'

const MovieGrid = ({ movies, onMovieClick, onFeedback }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
      {movies.map((movie, index) => (
        <motion.div
          key={movie.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <MovieCard
            movie={movie}
            onClick={() => onMovieClick(movie)}
            onFeedback={onFeedback}
          />
        </motion.div>
      ))}
    </div>
  )
}

export default MovieGrid

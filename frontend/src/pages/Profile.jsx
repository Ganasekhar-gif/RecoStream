import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, BarChart3, PieChart, Activity, Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts'
import { endpoints } from '../utils/api'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'

const Profile = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()
  const { shouldRefresh, resetRefresh } = useProfile()

  useEffect(() => {
    if (user?.id) {
      fetchUserStats()
    }
  }, [user])

  useEffect(() => {
    if (shouldRefresh && user?.id) {
      fetchUserStats()
      resetRefresh()
    }
  }, [shouldRefresh, user?.id, resetRefresh])

  const fetchUserStats = async () => {
    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    try {
      setLoading(true)
      const response = await endpoints.getUserStats(user.id)
      
      // Calculate like/dislike counts from feedbacks
      const feedbacks = response.data.feedbacks || []
      const likeCount = feedbacks.filter(f => f.feedback_type === 'like').length
      const dislikeCount = feedbacks.filter(f => f.feedback_type === 'dislike').length
      const clickCount = feedbacks.filter(f => f.feedback_type === 'click').length
      
      setStats({
        ...response.data,
        like_count: likeCount,
        dislike_count: dislikeCount,
        click_count: clickCount
      })
    } catch (error) {
      console.error('Error fetching user stats:', error)
      toast.error('Failed to load user statistics')
    } finally {
      setLoading(false)
    }
  }

  const pieColors = ['#3B82F6', '#EF4444', '#6B7280']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading your profile...</p>
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{user?.username || 'User'}</h1>
              <p className="text-gray-400">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Feedback</p>
                <p className="text-2xl font-bold text-white">{stats?.total_feedback || 0}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Movies Liked</p>
                <p className="text-2xl font-bold text-green-400">{stats?.like_count || 0}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Movies Disliked</p>
                <p className="text-2xl font-bold text-red-400">{stats?.dislike_count || 0}</p>
              </div>
              <PieChart className="w-8 h-8 text-red-500" />
            </div>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Feedback Distribution Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800 rounded-lg p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Feedback Distribution</h3>
            {stats?.feedback_distribution && (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={stats.feedback_distribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.feedback_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Bandit Rewards Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800 rounded-lg p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Top Recommended Movies</h3>
            {stats?.top_movies && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.top_movies}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="title" 
                    stroke="#9CA3AF"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="score" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </div>

        {/* Recent Feedback Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-800 rounded-lg p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Recent Feedback</h3>
          {stats?.feedbacks && stats.feedbacks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="pb-3 text-gray-400 font-medium">Movie</th>
                    <th className="pb-3 text-gray-400 font-medium">Year</th>
                    <th className="pb-3 text-gray-400 font-medium">Feedback</th>
                    <th className="pb-3 text-gray-400 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.feedbacks
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .slice(0, 10)
                    .map((feedback, index) => (
                    <tr key={index} className="border-b border-gray-700/50">
                      <td className="py-3 text-white">{feedback.movie_title}</td>
                      <td className="py-3 text-gray-400">{feedback.movie_year}</td>
                      <td className="py-3">
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${feedback.feedback_type === 'like' 
                            ? 'bg-green-900 text-green-300' 
                            : feedback.feedback_type === 'dislike'
                            ? 'bg-red-900 text-red-300'
                            : 'bg-blue-900 text-blue-300'
                          }
                        `}>
                          {feedback.feedback_type}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400">
                        {new Date(feedback.timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">No feedback history yet. Start rating movies to see your activity here!</p>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Profile

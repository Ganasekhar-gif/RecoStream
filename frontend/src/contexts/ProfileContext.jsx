import React, { createContext, useContext, useState } from 'react'

const ProfileContext = createContext()

export const useProfile = () => {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}

export const ProfileProvider = ({ children }) => {
  const [shouldRefresh, setShouldRefresh] = useState(false)

  const triggerRefresh = () => {
    setShouldRefresh(true)
  }

  const resetRefresh = () => {
    setShouldRefresh(false)
  }

  return (
    <ProfileContext.Provider value={{
      shouldRefresh,
      triggerRefresh,
      resetRefresh
    }}>
      {children}
    </ProfileContext.Provider>
  )
}

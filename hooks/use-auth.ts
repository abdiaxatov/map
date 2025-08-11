"use client"

import { useState, useEffect } from "react"
import {
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth"
import { getFirebaseAuth } from "@/lib/firebase"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getFirebaseAuth()
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    setLoading(true)
    try {
      const auth = getFirebaseAuth()
      const provider = new GoogleAuthProvider()
      await setPersistence(auth, browserLocalPersistence)
      const result = await signInWithPopup(auth, provider)
      setUser(result.user)
    } catch (error) {
      console.error("Error signing in with Google:", error)
    } finally {
      setLoading(false)
    }
  }

  const signInWithGithub = async () => {
    setLoading(true)
    try {
      const auth = getFirebaseAuth()
      const provider = new GithubAuthProvider()
      await setPersistence(auth, browserLocalPersistence)
      const result = await signInWithPopup(auth, provider)
      setUser(result.user)
    } catch (error) {
      console.error("Error signing in with GitHub:", error)
    } finally {
      setLoading(false)
    }
  }

  const logOut = async () => {
    setLoading(true)
    try {
      const auth = getFirebaseAuth()
      await signOut(auth)
      setUser(null)
    } catch (error) {
      console.error("Error logging out:", error)
    } finally {
      setLoading(false)
    }
  }

  return { user, loading, signInWithGoogle, signInWithGithub, logOut }
}

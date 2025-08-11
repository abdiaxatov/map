"use client"

import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, type Auth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth"
import { getDatabase, type Database } from "firebase/database"

const firebaseConfig = {
  apiKey: "AIzaSyCLeaYi8x70nJqNqxHzkUCejHI_7U0R6e0",
  authDomain: "inventar-tizimi.firebaseapp.com",
  databaseURL: "https://inventar-tizimi-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "inventar-tizimi",
  storageBucket: "inventar-tizimi.firebasestorage.app",
  messagingSenderId: "564605100521",
  appId: "1:564605100521:web:fa2b6fd48319c659d3eb78",
  measurementId: "G-H7GDQTZL3L",
}

let firebaseApp: ReturnType<typeof initializeApp> | null = null
let firebaseAuth: Auth | null = null
let firebaseDatabase: Database | null = null

function getFirebaseApp() {
  if (typeof window === "undefined") {
    throw new Error("Firebase app faqat browserda initialize qilinadi.")
  }
  if (!firebaseApp) {
    firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp()
  }
  return firebaseApp
}

export function getFirebaseAuth(): Auth {
  if (!firebaseAuth) {
    const app = getFirebaseApp()
    firebaseAuth = getAuth(app)
  }
  return firebaseAuth
}

export function getFirebaseDatabase(): Database {
  if (!firebaseDatabase) {
    const app = getFirebaseApp()
    firebaseDatabase = getDatabase(app)
  }
  return firebaseDatabase
}

export { GoogleAuthProvider, GithubAuthProvider }

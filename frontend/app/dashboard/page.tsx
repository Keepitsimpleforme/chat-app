"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ChatDashboard from "@/components/chat-dashboard"

export default function DashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null)

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token")

    if (!token) {
      window.location.replace("/")
      return
    }

    // Fetch user data from the backend
    const fetchUserData = async () => {
      try {
        console.log("Fetching user data from backend...")
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        })

        if (!response.ok) {
          const errorData = await response.text()
          console.error("Failed to fetch user data:", errorData)
          throw new Error("Failed to fetch user data")
        }

        const userData = await response.json()
        console.log("User data fetched:", userData)
        
        if (!userData || !userData._id) {
          throw new Error("Invalid user data received")
        }
        
        setUser({
          id: userData._id,
          name: userData.UserName || "Unknown User",
          email: userData.email || "",
        })
      } catch (error) {
        console.error("Error fetching user data:", error)
        // Remove the mock user fallback in production
        localStorage.removeItem("token")
        window.location.replace("/")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Failed to load user data. Please try again.</p>
        </div>
      </div>
    )
  }

  return <ChatDashboard user={user} />
}

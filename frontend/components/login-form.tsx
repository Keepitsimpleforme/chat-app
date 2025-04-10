"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

export default function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  // Add a script to set the custom header for all fetch requests
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      // Add a script to the document head to set the custom header
      const script = document.createElement("script")
      script.innerHTML = `
        // Override fetch to add the auth token header
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
          const token = localStorage.getItem("token");
          if (token) {
            options.headers = {
              ...options.headers,
              "x-auth-token": token
            };
          }
          return originalFetch(url, options);
        };
      `
      document.head.appendChild(script)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    console.log("Login attempt:")
    console.log("API URL:", process.env.NEXT_PUBLIC_API_URL)
    console.log("Email:", email)
    console.log("Request details:", {
      url: `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include"
    })

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        const errorData = await response.text()
        console.error("Login failed with status:", response.status, "Error:", errorData)
        throw new Error(`Login failed: ${errorData}`)
      }

      const data = await response.json()
      console.log("Login successful, received data:", { ...data, token: data.token ? "***" : undefined })

      // Store the token in localStorage
      localStorage.setItem("token", data.token)
      console.log("Token stored in localStorage")

      toast({
        title: "Success!",
        description: "You have successfully logged in.",
      })

      console.log("Redirecting to dashboard...")
      // Force a hard refresh to the dashboard page
      window.location.replace("/dashboard")
      
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Error",
        description: "Invalid email or password.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const UserName = formData.get("UserName") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    console.log("Attempting registration with:", { UserName, email, password: "***" })

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ UserName, email, password }),
        credentials: "include",
      })

      console.log("Registration response status:", response.status)
      
      if (!response.ok) {
        const errorData = await response.text()
        console.error("Registration failed with status:", response.status, "Error:", errorData)
        throw new Error(`Registration failed: ${errorData}`)
      }

      const data = await response.json()
      console.log("Registration successful, received data:", { ...data, token: data.token ? "***" : undefined })

      // Store the token in localStorage
      localStorage.setItem("token", data.token)
      console.log("Token stored in localStorage")

      toast({
        title: "Success!",
        description: "Your account has been created successfully.",
      })

      console.log("Redirecting to dashboard...")
      // Force a hard refresh to the dashboard page
      window.location.replace("/")
      
    } catch (error) {
      console.error("Registration error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Registration failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <Tabs defaultValue="login">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger id="login-tab" value="login">
            Login
          </TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <form onSubmit={handleLogin}>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input id="email" name="email" type="email" placeholder="name@example.com" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input id="password" name="password" type="password" required />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>

        <TabsContent value="register">
          <form onSubmit={handleRegister}>
            <CardHeader>
              <CardTitle>Register</CardTitle>
              <CardDescription>Create a new account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="UserName" className="text-sm font-medium">
                  Name
                </label>
                <Input id="UserName" name="UserName" placeholder="John Doe" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="register-email" className="text-sm font-medium">
                  Email
                </label>
                <Input id="register-email" name="email" type="email" placeholder="name@example.com" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="register-password" className="text-sm font-medium">
                  Password
                </label>
                <Input id="register-password" name="password" type="password" required />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Register"}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  )
}

import LoginForm from "@/components/login-form"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">ChatConnect</h1>
          <p className="text-gray-600 mt-2">Connect with friends in real-time</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}

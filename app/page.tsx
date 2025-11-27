"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { store } from "@/lib/store"
import type { User } from "@/lib/types"
import { LoginCard } from "@/components/login-card"
import { PasswordModal } from "@/components/password-modal"
import { InstallPrompt } from "@/components/install-prompt"
import { FiSun, FiMoon } from "react-icons/fi"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
    const loadedUsers = store.getUsers()
    console.log("[v0] Users loaded:", loadedUsers)
    setUsers(loadedUsers)

    // Check if already logged in
    const currentUser = store.getCurrentUser()
    console.log("[v0] Current user:", currentUser)
    if (currentUser) {
      window.location.href = "/dashboard"
    }
  }, [])

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
  }

  const handleLogin = (success: boolean) => {
    if (success && selectedUser) {
      store.setCurrentUser(selectedUser.id)

      // Start a shift if none is active
      const activeShift = store.getActiveShift()
      if (!activeShift) {
        store.startShift(selectedUser.id, selectedUser.name)
      }

      window.location.href = "/dashboard"
    }
    setSelectedUser(null)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-primary/20" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">A</span>
          </div>
          <span className="font-semibold text-lg">Almacén</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">Bienvenido</h1>
          <p className="text-muted-foreground text-lg">Seleccioná tu usuario para ingresar</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full">
          {users.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <LoginCard user={user} onSelect={handleUserSelect} />
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-muted-foreground text-sm">Sistema de Gestión - Almacén v1.0</footer>

      {/* Password Modal */}
      <AnimatePresence>
        {selectedUser && (
          <PasswordModal user={selectedUser} onClose={() => setSelectedUser(null)} onLogin={handleLogin} />
        )}
      </AnimatePresence>

      {/* Install Prompt */}
      <InstallPrompt />
    </div>
  )
}

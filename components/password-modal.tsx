"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import type { User } from "@/lib/types"
import { store } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FiX, FiLock } from "react-icons/fi"
import Image from "next/image"
import { toast } from "sonner"

interface PasswordModalProps {
  user: User
  onClose: () => void
  onLogin: (success: boolean) => void
}

export function PasswordModal({ user, onClose, onLogin }: PasswordModalProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validUser = store.validateUser(user.id, password)

    if (validUser) {
      toast.success(`¡Bienvenido, ${user.name}!`)
      onLogin(true)
    } else {
      setError(true)
      toast.error("Contraseña incorrecta")
      setTimeout(() => setError(false), 500)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card rounded-xl p-6 w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
              <Image
                src={user.avatar || "/placeholder.svg"}
                alt={user.name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="font-semibold text-lg">{user.name}</h2>
              <p className="text-sm text-muted-foreground">Ingresá tu contraseña</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <FiX className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="relative mb-4">
            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`pl-10 ${error ? "border-destructive animate-shake" : ""}`}
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full">
            Ingresar
          </Button>
        </form>
      </motion.div>
    </motion.div>
  )
}

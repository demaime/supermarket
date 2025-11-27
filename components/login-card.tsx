"use client"

import { motion } from "framer-motion"
import type { User } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

interface LoginCardProps {
  user: User
  onSelect: (user: User) => void
}

export function LoginCard({ user, onSelect }: LoginCardProps) {
  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
      <Card
        className="cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-200 overflow-hidden"
        onClick={() => onSelect(user)}
      >
        <CardContent className="p-6 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-primary/20">
            <Image
              src={user.avatar || "/placeholder.svg"}
              alt={user.name}
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="text-xl font-semibold">{user.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">Tocar para ingresar</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

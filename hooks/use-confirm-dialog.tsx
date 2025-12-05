"use client"

import { useState, useCallback } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FiAlertTriangle, FiInfo, FiCheckCircle, FiXCircle } from "react-icons/fi"

export type ConfirmDialogType = "danger" | "warning" | "info" | "success"

export interface ConfirmDialogOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  type?: ConfirmDialogType
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
}

export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const confirm = useCallback((opts: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions({
        ...opts,
        onConfirm: async () => {
          setIsLoading(true)
          try {
            if (opts.onConfirm) {
              await opts.onConfirm()
            }
            setIsOpen(false)
            resolve(true)
          } catch (error) {
            console.error("Error en confirmación:", error)
            resolve(false)
          } finally {
            setIsLoading(false)
          }
        },
        onCancel: () => {
          setIsOpen(false)
          if (opts.onCancel) {
            opts.onCancel()
          }
          resolve(false)
        },
      })
      setIsOpen(true)
    })
  }, [])

  const Dialog = () => {
    if (!options) return null

    const {
      title,
      description,
      confirmText = "Confirmar",
      cancelText = "Cancelar",
      type = "info",
      onConfirm,
      onCancel,
    } = options

    const getIcon = () => {
      switch (type) {
        case "danger":
          return <FiXCircle className="h-6 w-6 text-destructive" />
        case "warning":
          return <FiAlertTriangle className="h-6 w-6 text-yellow-500" />
        case "success":
          return <FiCheckCircle className="h-6 w-6 text-green-500" />
        default:
          return <FiInfo className="h-6 w-6 text-primary" />
      }
    }

    const getConfirmVariant = () => {
      switch (type) {
        case "danger":
          return "destructive"
        default:
          return "default"
      }
    }

    return (
      <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel?.()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              {getIcon()}
              <AlertDialogTitle>{title}</AlertDialogTitle>
            </div>
            {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              disabled={isLoading}
              className={type === "danger" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {isLoading ? "Procesando..." : confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return { confirm, Dialog }
}


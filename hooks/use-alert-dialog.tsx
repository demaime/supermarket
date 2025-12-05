"use client"

import { useState, useCallback } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FiAlertTriangle, FiInfo, FiCheckCircle, FiXCircle } from "react-icons/fi"

export type AlertDialogType = "danger" | "warning" | "info" | "success"

export interface AlertDialogOptions {
  title: string
  description?: string
  buttonText?: string
  type?: AlertDialogType
  onClose?: () => void
}

export function useAlertDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<AlertDialogOptions | null>(null)

  const alert = useCallback((opts: AlertDialogOptions): Promise<void> => {
    return new Promise((resolve) => {
      setOptions({
        ...opts,
        onClose: () => {
          setIsOpen(false)
          if (opts.onClose) {
            opts.onClose()
          }
          resolve()
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
      buttonText = "Aceptar",
      type = "info",
      onClose,
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

    return (
      <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              {getIcon()}
              <AlertDialogTitle>{title}</AlertDialogTitle>
            </div>
            {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={onClose}>{buttonText}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return { alert, Dialog }
}




"use client"

import { useToast } from "@/components/ui/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { ACHIEVEMENTS } from '../achievements-config'
import { playAchievementChime } from '@/lib/sounds'
const Confetti = dynamic(() => import('react-confetti'), { ssr: false })

export function Toaster() {
  const { toasts } = useToast()
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (toasts.length > 0) {
      // Play chime if the newest toast is an achievement
      const latest = toasts[0];
      if (latest && latest.title === 'Achievement Unlocked!') {
        playAchievementChime();
      }
      setShowConfetti(true)
      const timeout = setTimeout(() => setShowConfetti(false), 2200)
      return () => clearTimeout(timeout)
    }
  }, [toasts.length, toasts])

  return (
    <ToastProvider>
      {showConfetti && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 9999 }}>
          <Confetti numberOfPieces={400} recycle={false} gravity={0.4} width={window.innerWidth} height={window.innerHeight} />
        </div>
      )}
      {toasts.map(function ({ id, title, description, action, ...props }) {
        let funName = null, IconComponent = null;
        let achievementToast = false;
        if (title === 'Achievement Unlocked!' && typeof description === 'string') {
          const achievement = ACHIEVEMENTS.find(a => a.name === description);
          if (achievement) {
            funName = achievement.funName;
            IconComponent = achievement.icon;
            achievementToast = true;
          }
        }
        return (
          <Toast
            key={id}
            {...props}
            data-testid="toast"
            {...(achievementToast ? { 'data-achievement-toast': 'true' } : {})}
            onClick={() => {
              if (props.onOpenChange) props.onOpenChange(false)
            }}
            className={
              'cursor-pointer border-4 border-transparent bg-clip-padding relative group ' +
              'before:absolute before:inset-0 before:rounded-md before:border-4 before:border-gradient-to-r before:from-yellow-400 before:via-pink-500 before:to-purple-500 before:animate-border-glow before:z-[-1] ' +
              (props.className || '')
            }
          >
            <div className="grid gap-1">
              {IconComponent && <IconComponent className="text-2xl animate-pop" />}
              {funName && <div className="font-bold text-lg animate-glow mb-0.5">{funName}</div>}
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport className="fixed top-4 right-4 flex flex-col gap-2 w-[360px] max-w-full z-[100]" />
    </ToastProvider>
  )
}

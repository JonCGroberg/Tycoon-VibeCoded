import React, { useEffect, useState } from 'react'
import Confetti from 'react-confetti'
import { ACHIEVEMENTS } from './achievements-config'

export interface Notification {
    id: string
    message: string
}

const NotificationToast = function NotificationToast({ notifications, onDismiss }: { notifications: Notification[], onDismiss: (id: string) => void }) {
    const isBrowser = typeof window !== 'undefined';
    const [showConfetti, setShowConfetti] = isBrowser ? useState(false) : [false, () => { }];
    useEffect(() => {
        if (notifications.length === 0) return
        const timers = notifications.map(n => setTimeout(() => onDismiss(n.id), 3000))
        // Show confetti if achievement
        if (isBrowser && notifications.some(n => n.message.startsWith('Achievement Unlocked:'))) {
            setShowConfetti(true)
            setTimeout(() => setShowConfetti(false), 2000)
        }
        return () => timers.forEach(clearTimeout)
    }, [notifications, onDismiss, isBrowser, setShowConfetti])

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
            {isBrowser && showConfetti && <Confetti width={400} height={200} numberOfPieces={120} recycle={false} style={{ pointerEvents: 'none', position: 'absolute', top: 0, right: 0, zIndex: 200 }} />}
            {notifications.map(n => {
                // If achievement, parse key and show funName/icon
                let funName = null, IconComponent = null
                if (n.message.startsWith('Achievement Unlocked:')) {
                    const name = n.message.replace('Achievement Unlocked: ', '').trim()
                    const achievement = ACHIEVEMENTS.find(a => a.name === name)
                    if (achievement) {
                        funName = achievement.funName
                        IconComponent = achievement.icon
                    }
                }
                return (
                    <div key={n.id} className={"bg-white text-gray-900 px-4 py-2 rounded shadow-lg flex items-center gap-3 animate-bounce-glow relative"}>
                        {IconComponent && <IconComponent className="text-2xl animate-pop" />}
                        <div>
                            {funName && <div className="font-bold text-lg animate-glow mb-0.5">{funName}</div>}
                            <span>{n.message}</span>
                        </div>
                        <button className="ml-2 text-gray-500 hover:text-gray-700" onClick={() => onDismiss(n.id)} aria-label="Dismiss">✕</button>
                    </div>
                )
            })}
        </div>
    )
}

export default React.memo(NotificationToast)
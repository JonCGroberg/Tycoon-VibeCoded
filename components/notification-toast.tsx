import React, { useEffect } from 'react'
import Confetti from 'react-confetti'
import { ACHIEVEMENTS } from './achievements-config'

export interface Notification {
    id: string
    message: string
}

// Play a chime sound (pleasant arpeggio, lower and softer)
function playAchievementChime() {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [698.46, 880, 1046.5, 1174.66]; // F5, A5, C6, D6 (Fmaj7, higher and brighter)
    const now = ctx.currentTime;
    notes.forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine'; // Brighter than sine
        o.frequency.value = freq;
        g.gain.value = 0.11;
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now + i * 0.03); // slightly faster arpeggio
        g.gain.setValueAtTime(0.11, now + i * 0.03);
        g.gain.linearRampToValueAtTime(0, now + i * 0.03 + 0.18);
        o.stop(now + i * 0.03 + 0.18);
        o.onended = () => ctx.close();
    });
}

const NotificationToast = function NotificationToast({ notifications, onDismiss }: { notifications: Notification[], onDismiss: (id: string) => void }) {
    // Auto-dismiss after 5 seconds
    useEffect(() => {
        if (!notifications.length) return
        const timers = notifications.map(n => setTimeout(() => onDismiss(n.id), 5000))
        return () => timers.forEach(clearTimeout)
    }, [notifications, onDismiss])

    // Play chime on new achievement notification
    const prevAchievementCount = React.useRef(0)
    useEffect(() => {
        const achievementCount = notifications.filter(n => n.message.startsWith('Achievement Unlocked:')).length;
        if (achievementCount > prevAchievementCount.current) {
            playAchievementChime();
        }
        prevAchievementCount.current = achievementCount;
    }, [notifications])

    const isBrowser = typeof window !== 'undefined'
    const showConfetti = notifications.some(n => n.message.startsWith('Achievement Unlocked:'))
    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2" data-testid="notification-toast">
            {isBrowser && showConfetti && <Confetti width={800} height={400} numberOfPieces={500} recycle={false} style={{ pointerEvents: 'none', position: 'absolute', top: 0, right: 0, zIndex: 200 }} />}
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
                    <div
                        key={n.id}
                        className={
                            "bg-white text-gray-900 px-4 py-2 rounded shadow-lg flex items-center gap-3 animate-bounce-glow relative cursor-pointer transition-transform duration-150 hover:scale-105 hover:shadow-2xl hover:ring-2 hover:ring-yellow-300"
                        }
                        onClick={() => onDismiss(n.id)}
                        tabIndex={0}
                        role="button"
                        aria-label="Dismiss notification"
                    >
                        {IconComponent && <IconComponent className="text-2xl animate-pop" />}
                        <div>
                            {funName && <div className="font-bold text-lg animate-glow mb-0.5">{funName}</div>}
                            <span>{n.message}</span>
                        </div>
                        <span style={{ marginLeft: 'auto', display: 'flex' }}>
                            <button
                                className="ml-2 text-gray-500 hover:text-gray-700"
                                tabIndex={-1}
                                style={{ pointerEvents: 'none' }}
                            >✕</button>
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

export default React.memo(NotificationToast)
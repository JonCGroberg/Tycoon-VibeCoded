import React from 'react'
import { ACHIEVEMENTS } from './achievements-config'

const AchievementsPanel = function AchievementsPanel({ achievements, onClose }: { achievements: { [key: string]: boolean }, onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
                <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={onClose} aria-label="Close">✕</button>
                <h2 className="text-2xl font-bold mb-4 text-center">Achievements</h2>
                <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {ACHIEVEMENTS.map(a => {
                        const IconComponent = a.icon
                        return (
                            <li key={a.key} className={`flex items-center gap-3 p-3 rounded ${achievements[a.key] ? 'bg-green-100' : 'bg-gray-100 opacity-60'}`}>
                                {IconComponent && <IconComponent className="w-7 h-7 mr-2" />}
                                <div>
                                    <div className="font-bold text-base">{a.funName}</div>
                                    <div className="text-sm text-gray-700">{a.name}</div>
                                    <div className="text-xs text-gray-500">{a.description}</div>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </div>
    )
}

export default React.memo(AchievementsPanel)
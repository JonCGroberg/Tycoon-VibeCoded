"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Volume2, VolumeX } from "lucide-react"

interface MusicControlsProps {
    audioElement: HTMLAudioElement | null
}

export default function MusicControls({ audioElement }: MusicControlsProps) {
    const [volume, setVolume] = useState(0.1)
    const [isMuted, setIsMuted] = useState(false)

    useEffect(() => {
        if (audioElement) {
            audioElement.volume = volume
            audioElement.muted = isMuted
        }
    }, [volume, isMuted, audioElement])

    const handleVolumeChange = (value: number[]) => {
        setVolume(value[0])
        setIsMuted(value[0] === 0)
    }

    const toggleMute = () => {
        setIsMuted(!isMuted)
    }

    return (
        <div className="fixed bottom-4 left-4 bg-white bg-opacity-75 p-3 rounded-lg shadow-md border border-gray-300 z-50 flex items-center gap-3" data-testid="music-controls">
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="text-gray-500 hover:text-gray-700"
                aria-label={isMuted ? "Unmute" : "Mute"}
            >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            <div className="w-32">
                <Slider
                    value={[isMuted ? 0 : volume]}
                    onValueChange={handleVolumeChange}
                    max={1}
                    step={0.01}
                    className="w-full"
                />
            </div>
        </div>
    )
}
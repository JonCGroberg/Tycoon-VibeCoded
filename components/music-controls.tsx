"use client"

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Volume2, VolumeX, SkipBack, SkipForward, Play, Pause } from "lucide-react"

interface MusicControlsProps {
    audioElement: HTMLAudioElement | null
}

const SONGS = [
    { label: 'Goofy Background', file: '/music/goofy-background.mp3' },
    { label: 'Happy Upbeat', file: '/music/happy-upbeat.mp3' },
    { label: 'Super Epic Upbeat', file: '/music/super-epic-upbeat.mp3' },
    { label: 'Upbeat Epic', file: '/music/upbeat-epic.mp3' },
    { label: 'Epic', file: '/music/epic.mp3' },
    { label: 'Silly Goofy', file: '/music/silly-goofy.m4a' },
    { label: 'Old Timey Upbeat', file: '/music/old-timey-upbeat.m4a' },
];

export interface MusicControlsHandle {
    skipToNextSong: () => void
}

const MusicControls = forwardRef<MusicControlsHandle, MusicControlsProps>(function MusicControls({ audioElement }, ref) {
    const [volume, setVolume] = useState(0.4)
    const [isMuted, setIsMuted] = useState(false)
    const [isPlaying, setIsPlaying] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(0)
    const selectedSong = SONGS[currentIndex].file
    const [showVolume, setShowVolume] = useState(false)
    const volumeBtnRef = useRef<HTMLButtonElement>(null)

    useImperativeHandle(ref, () => ({
        skipToNextSong: () => {
            setCurrentIndex((prev) => (prev + 1) % SONGS.length)
            setIsPlaying(true)
        }
    }), [])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentIndex(0)
        }
    }, [])

    useEffect(() => {
        if (audioElement) {
            audioElement.volume = volume
            audioElement.muted = isMuted
            if (audioElement.src !== window.location.origin + selectedSong) {
                audioElement.src = selectedSong
                if (isPlaying) audioElement.play().catch(() => { })
            }
            if (isPlaying) {
                audioElement.play().catch(() => { })
            } else {
                audioElement.pause()
            }
        }
    }, [volume, isMuted, audioElement, selectedSong, isPlaying])

    const handleVolumeChange = (value: number[]) => {
        setVolume(value[0])
        setIsMuted(value[0] === 0)
    }

    const toggleMute = () => {
        setIsMuted(!isMuted)
    }

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + SONGS.length) % SONGS.length)
        setIsPlaying(true)
    }
    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % SONGS.length)
        setIsPlaying(true)
    }
    const togglePlay = () => {
        setIsPlaying((p) => !p)
    }

    const handleVolumePopup = () => {
        setShowVolume((v) => !v)
    }
    const handleCloseVolume = (e: React.FocusEvent<HTMLDivElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setShowVolume(false)
        }
    }

    return (
        <div className="fixed bottom-4 left-4 bg-white bg-opacity-75 p-2 rounded-lg shadow-md border border-gray-300 z-50 flex items-center gap-2 max-w-xs" data-testid="music-controls">
            <button onClick={handlePrev} className="rounded p-1 hover:bg-gray-200" aria-label="Previous Song"><SkipBack className="w-5 h-5" /></button>
            <button onClick={togglePlay} className="rounded p-1 hover:bg-gray-200" aria-label={isPlaying ? "Pause" : "Play"}>{isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}</button>
            <button onClick={handleNext} className="rounded p-1 hover:bg-gray-200" aria-label="Next Song"><SkipForward className="w-5 h-5" /></button>
            <span className="text-sm font-medium mx-1 max-w-[90px] truncate overflow-hidden whitespace-nowrap" title={SONGS[currentIndex].label}>{SONGS[currentIndex].label}</span>
            <div className="relative">
                <Button
                    ref={volumeBtnRef}
                    variant="ghost"
                    size="icon"
                    onClick={handleVolumePopup}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
                {showVolume && (
                    <div
                        tabIndex={-1}
                        onBlur={handleCloseVolume}
                        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center bg-white border border-gray-300 rounded-md shadow-sm p-2 z-50 min-w-0"
                    >
                        <Slider
                            id="volume-slider"
                            orientation="vertical"
                            value={[isMuted ? 0 : volume]}
                            onValueChange={handleVolumeChange}
                            max={1}
                            step={0.01}
                            className="h-24 w-2 min-w-0 [&_[data-orientation=vertical]_button]:h-3 [&_[data-orientation=vertical]_button]:w-3"
                        />
                    </div>
                )}
            </div>
        </div>
    )
})

export default MusicControls
"use client"

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Volume2, VolumeX, SkipBack, SkipForward, Play, Pause } from "lucide-react"

interface MusicControlsProps {
    audioElement: HTMLAudioElement | null
    unlockedSongs: number
}

const SONGS = [
    { label: 'Goofy Background', file: '/music/goofy-background.mp3' }, // Goofiest
    { label: 'Silly Goofy', file: '/music/silly-goofy.m4a' },
    { label: 'Happy Upbeat', file: '/music/happy-upbeat.mp3' },
    { label: 'Old Timey Upbeat', file: '/music/old-timey-upbeat.m4a' },
    { label: 'Upbeat Epic', file: '/music/upbeat-epic.mp3' },
    { label: 'Super Epic Upbeat', file: '/music/super-epic-upbeat.mp3' },
    { label: 'Epic', file: '/music/epic.mp3' }, // Most intense
];

export interface MusicControlsHandle {
    skipToNextSong: () => void
    playSongAtIndex: (index: number) => void
}

const MusicControls = forwardRef<MusicControlsHandle, MusicControlsProps>(function MusicControls({ audioElement, unlockedSongs }, ref) {
    const [volume, setVolume] = useState(0.4)
    const [isMuted, setIsMuted] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(-1)
    const availableSongs = SONGS.slice(0, unlockedSongs)
    const selectedSong = currentIndex >= 0 ? availableSongs[currentIndex]?.file : undefined
    const [showVolume, setShowVolume] = useState(false)
    const volumeBtnRef = useRef<HTMLButtonElement>(null)
    const prevUnlockedSongsRef = useRef(unlockedSongs);

    useImperativeHandle(ref, () => ({
        skipToNextSong: () => {
            if (availableSongs.length > 0) {
                setCurrentIndex((prev) => {
                    if (prev === -1) return 0;
                    return (prev + 1) % availableSongs.length;
                })
                setIsPlaying(true)
            }
        },
        playSongAtIndex: (index: number) => {
            if (availableSongs.length > 0) {
                setCurrentIndex(Math.max(0, Math.min(index, availableSongs.length - 1)))
                setIsPlaying(true)
            }
        }
    }), [availableSongs.length])

    useEffect(() => {
        if (unlockedSongs > prevUnlockedSongsRef.current) {
            setCurrentIndex(unlockedSongs - 1);
            setIsPlaying(true);
        } else if (unlockedSongs === 0 && currentIndex !== -1) {
            setCurrentIndex(-1);
            setIsPlaying(false);
        } else if (unlockedSongs > 0 && currentIndex >= unlockedSongs) {
            setCurrentIndex(unlockedSongs - 1);
        }
        prevUnlockedSongsRef.current = unlockedSongs;
    }, [unlockedSongs]);

    useEffect(() => {
        if (audioElement) {
            audioElement.volume = volume
            audioElement.muted = isMuted
            if (selectedSong) {
                if (audioElement.src !== window.location.origin + selectedSong) {
                    audioElement.src = selectedSong
                    if (isPlaying) audioElement.play().catch(() => { })
                }
                if (isPlaying) {
                    audioElement.play().catch(() => { })
                } else {
                    audioElement.pause()
                }
            } else {
                audioElement.pause()
            }
        }
    }, [volume, isMuted, audioElement, selectedSong, isPlaying])

    useEffect(() => {
        if (unlockedSongs > 0) {
            setCurrentIndex(0);
            setIsPlaying(true);
        }
    }, []);

    const handleVolumeChange = (value: number[]) => {
        setVolume(value[0])
        setIsMuted(value[0] === 0)
    }

    const toggleMute = () => {
        setIsMuted(!isMuted)
    }

    const handlePrev = () => {
        if (availableSongs.length > 0 && currentIndex > 0) {
            setCurrentIndex((prev) => (prev - 1 + availableSongs.length) % availableSongs.length)
            setIsPlaying(true)
        }
    }
    const handleNext = () => {
        if (availableSongs.length > 0 && currentIndex !== -1) {
            setCurrentIndex((prev) => (prev + 1) % availableSongs.length)
            setIsPlaying(true)
        }
    }
    const togglePlay = () => {
        if (availableSongs.length > 0 && currentIndex !== -1) {
            setIsPlaying((p) => !p)
        }
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
            <button onClick={handlePrev} className="rounded p-1 hover:bg-gray-200 disabled:opacity-50" aria-label="Previous Song" disabled={availableSongs.length === 0 || currentIndex <= 0}><SkipBack className="w-5 h-5" /></button>
            <button onClick={togglePlay} className="rounded p-1 hover:bg-gray-200 disabled:opacity-50" aria-label={isPlaying ? "Pause" : "Play"} disabled={availableSongs.length === 0 || currentIndex === -1}>{isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}</button>
            <button onClick={handleNext} className="rounded p-1 hover:bg-gray-200 disabled:opacity-50" aria-label="Next Song" disabled={availableSongs.length === 0 || currentIndex === -1}><SkipForward className="w-5 h-5" /></button>
            <span className="text-sm font-medium mx-1 max-w-[90px] truncate overflow-hidden whitespace-nowrap" title={currentIndex !== -1 ? (availableSongs[currentIndex]?.label || SONGS[0].label) : ''}>{currentIndex !== -1 ? (availableSongs[currentIndex]?.label || SONGS[0].label) : ''}</span>
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
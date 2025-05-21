"use client"

import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Volume2, VolumeX, SkipBack, SkipForward, Play, Pause } from "lucide-react"

interface MusicControlsProps {
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

const MusicControls = forwardRef<MusicControlsHandle, MusicControlsProps>(function MusicControls({ unlockedSongs }, ref) {
    // Hydration flag to avoid SSR/client mismatch
    const [hydrated, setHydrated] = useState(false);
    const didInit = useRef(false);
    useEffect(() => {
        setHydrated(true);
    }, []);

    // Always use static initial values for SSR
    const [volume, setVolume] = useState(0.4)
    const [isMuted, setIsMuted] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(-1)
    const availableSongs = SONGS.slice(0, unlockedSongs)
    const selectedSong = currentIndex >= 0 ? availableSongs[currentIndex]?.file : undefined
    const [showVolume, setShowVolume] = useState(false)
    const volumeBtnRef = useRef<HTMLButtonElement>(null)
    const prevUnlockedSongsRef = useRef(unlockedSongs);
    const fadeTimeout = useRef<NodeJS.Timeout | null>(null);
    const fadeStep = 0.04; // seconds
    const fadeDuration = 0.4; // seconds

    // Use a local ref for the audio element
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Persist currentIndex and isPlaying in localStorage to survive re-renders
    function getInitialIndex() {
        const stored = window?.localStorage?.getItem('musicCurrentIndex');
        return stored !== null ? parseInt(stored, 10) : -1;
    }
    function getInitialPlaying() {
        const stored = window?.localStorage?.getItem('musicIsPlaying');
        return stored !== null ? stored === 'true' : false;
    }

    // On first hydration, set from localStorage, else do nothing
    useEffect(() => {
        if (hydrated && !didInit.current) {
            const idx = getInitialIndex();
            const playing = getInitialPlaying();
            setCurrentIndex(idx);
            setIsPlaying(playing);
            didInit.current = true;
        }
    }, [hydrated]);

    // Auto-play first song by default if localStorage is empty
    useEffect(() => {
        if (hydrated && didInit.current && unlockedSongs > 0 && currentIndex === -1) {
            setCurrentIndex(0);
        }
    }, [hydrated, unlockedSongs, currentIndex]);

    // Fade transition helper
    const fadeToSong = useCallback((newIndex: number) => {
        if (!audioRef.current) {
            setCurrentIndex(newIndex);
            setIsPlaying(true);
            return;
        }
        const startVol = audioRef.current.volume;
        const step = fadeStep;
        const steps = Math.ceil(fadeDuration / step);
        let i = 0;
        // Capture the latest volume value
        const targetVolume = volume;
        // Fade out
        function fadeOut() {
            if (!audioRef.current) return;
            i++;
            audioRef.current.volume = Math.max(0, startVol * (1 - i / steps));
            if (i < steps) {
                fadeTimeout.current = setTimeout(fadeOut, step * 1000);
            } else {
                if (!audioRef.current) return;
                audioRef.current.volume = 0;
                setCurrentIndex(newIndex);
                setIsPlaying(true);
                setTimeout(fadeIn, 50); // let React update src
            }
        }
        // Fade in
        function fadeIn() {
            if (!audioRef.current) return;
            let j = 0;
            function stepIn() {
                if (!audioRef.current) return;
                j++;
                audioRef.current.volume = Math.min(targetVolume, targetVolume * (j / steps));
                if (j < steps) {
                    fadeTimeout.current = setTimeout(stepIn, step * 1000);
                } else {
                    if (!audioRef.current) return;
                    audioRef.current.volume = targetVolume;
                }
            }
            stepIn();
        }
        fadeOut();
    }, [volume, fadeStep, fadeDuration]);

    // Cleanup fadeTimeout on unmount
    useEffect(() => {
        return () => {
            if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
        };
    }, []);

    useImperativeHandle(ref, () => ({
        skipToNextSong: () => {
            if (availableSongs.length > 0) {
                const nextIndex = (currentIndex === -1) ? 0 : (currentIndex + 1) % availableSongs.length;
                fadeToSong(nextIndex);
            }
        },
        playSongAtIndex: (index: number) => {
            if (availableSongs.length > 0) {
                fadeToSong(Math.max(0, Math.min(index, availableSongs.length - 1)));
            }
        }
    }), [availableSongs.length, currentIndex, fadeToSong]);

    useEffect(() => {
        // Only update currentIndex if unlockedSongs increased
        if (unlockedSongs > prevUnlockedSongsRef.current) {
            fadeToSong(unlockedSongs - 1);
        } else if (unlockedSongs === 0 && currentIndex !== -1) {
            setCurrentIndex(-1);
            setIsPlaying(false);
        } else if (unlockedSongs > 0 && currentIndex >= unlockedSongs) {
            setCurrentIndex(unlockedSongs - 1);
        }
        prevUnlockedSongsRef.current = unlockedSongs;
    }, [unlockedSongs, fadeToSong, currentIndex]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume
            audioRef.current.muted = isMuted
            if (selectedSong) {
                if (audioRef.current.src !== window.location.origin + selectedSong) {
                    audioRef.current.src = selectedSong
                    if (isPlaying) audioRef.current.play().catch(() => { })
                }
                if (isPlaying) {
                    audioRef.current.play().catch(() => { })
                } else {
                    audioRef.current.pause()
                }
            } else {
                audioRef.current.pause()
            }
        }
    }, [volume, isMuted, selectedSong, isPlaying, currentIndex, fadeToSong]);

    const handleVolumeChange = (value: number[]) => {
        setVolume(value[0])
        setIsMuted(value[0] === 0)
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

    // Add a handler for when the song ends
    function handleSongEnd() {
        if (availableSongs.length > 1) {
            // Logic for skipping to next song
            const nextIndex = (currentIndex === -1) ? 0 : (currentIndex + 1) % availableSongs.length;
            fadeToSong(nextIndex);
        } else {
            setIsPlaying(false); // Stop if only one song
        }
    }

    if (!hydrated) {
        return null;
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
            <audio
                ref={audioRef}
                src={selectedSong}
                autoPlay={isPlaying}
                onEnded={handleSongEnd}
            />
        </div>
    )
})

export default MusicControls
import { render, screen, fireEvent } from '@testing-library/react'
import { act } from '@testing-library/react'
import React, { useRef } from 'react'
import MusicControls, { MusicControlsHandle } from '../music-controls'

// Mock HTMLAudioElement
class MockAudio {
    volume = 0.4;
    muted = false;
    src = '';
    play = jest.fn().mockResolvedValue(undefined);
    pause = jest.fn();
}

// Mock ResizeObserver for Radix UI and shadcn/ui components
beforeAll(() => {
    global.ResizeObserver =
        global.ResizeObserver ||
        class {
            observe() { }
            unobserve() { }
            disconnect() { }
        };
});

describe('MusicControls', () => {
    let audioElement: any;
    beforeEach(() => {
        audioElement = new MockAudio();
        // Clear localStorage to avoid state bleed between tests
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.clear();
        }
    });

    function renderMusicControls(unlockedSongs = 1) {
        const ref = React.createRef<MusicControlsHandle>();
        render(<MusicControls ref={ref} audioElement={audioElement} unlockedSongs={unlockedSongs} />);
        return ref;
    }

    it('renders play, skip, prev, and volume buttons', () => {
        renderMusicControls(1);
        expect(screen.getByLabelText('Previous Song')).toBeInTheDocument();
        expect(screen.getByLabelText('Play')).toBeInTheDocument();
        expect(screen.getByLabelText('Next Song')).toBeInTheDocument();
        expect(screen.getByLabelText(/Mute|Unmute/)).toBeInTheDocument();
    });

    it('plays and pauses music', () => {
        const ref = renderMusicControls(1);
        // Simulate selecting the first song
        act(() => {
            ref.current?.playSongAtIndex(0);
        });
        const playBtn = screen.getByLabelText('Play');
        expect(playBtn).not.toBeDisabled();
        fireEvent.click(playBtn);
        expect(audioElement.play).toHaveBeenCalled();
        const pauseBtn = screen.getByLabelText('Pause');
        expect(pauseBtn).not.toBeDisabled();
        fireEvent.click(pauseBtn);
        expect(audioElement.pause).toHaveBeenCalled();
    });

    it('skips to next and previous song', () => {
        const ref = renderMusicControls(2);
        // Simulate selecting the first song
        act(() => {
            ref.current?.playSongAtIndex(0);
        });
        const playBtn = screen.getByLabelText('Play');
        fireEvent.click(playBtn);
        const next = screen.getByLabelText('Next Song');
        fireEvent.click(next);
        expect(audioElement.play).toHaveBeenCalled();
        const prev = screen.getByLabelText('Previous Song');
        fireEvent.click(prev);
        expect(audioElement.play).toHaveBeenCalled();
    });

    it('mutes and unmutes', () => {
        renderMusicControls(1);
        const volumeBtn = screen.getByLabelText(/Mute|Unmute/);
        fireEvent.click(volumeBtn);
        const slider = screen.getByRole('slider');
        // Simulate value change to 0 (mute)
        fireEvent.change(slider, { target: { value: 0 } });
        // Fallback: set aria-valuenow to 0 if needed
        slider.setAttribute('aria-valuenow', '0');
        expect(screen.getByLabelText('Unmute')).toBeInTheDocument();
        fireEvent.click(screen.getByLabelText('Unmute'));
        expect(screen.getByLabelText('Mute')).toBeInTheDocument();
    });

    it('opens the volume popup and renders the slider', () => {
        renderMusicControls(1);
        const volumeBtn = screen.getByLabelText(/Mute|Unmute/);
        fireEvent.click(volumeBtn);
        expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('disables controls when no songs are unlocked', () => {
        renderMusicControls(0);
        expect(screen.getByLabelText('Previous Song')).toBeDisabled();
        expect(screen.getByLabelText('Play')).toBeDisabled();
        expect(screen.getByLabelText('Next Song')).toBeDisabled();
    });

    it('does not reset current song or playing state on re-render with same unlockedSongs', () => {
        const ref = renderMusicControls(3);
        act(() => {
            ref.current?.playSongAtIndex(2);
        });
        const pauseBtn = screen.getByLabelText('Pause');
        fireEvent.click(pauseBtn);
        expect(audioElement.pause).toHaveBeenCalled();
        render(<MusicControls ref={ref} audioElement={audioElement} unlockedSongs={3} />);
        const playBtns = screen.getAllByLabelText('Play');
        expect(playBtns.some(btn => !(btn as HTMLButtonElement).disabled)).toBe(true);
        const happyUpbeatLabels = screen.getAllByText('Happy Upbeat');
        expect(happyUpbeatLabels.length).toBeGreaterThan(0);
    });

    it('only changes song when unlockedSongs increases', () => {
        const ref = renderMusicControls(2);
        act(() => {
            ref.current?.playSongAtIndex(1);
        });
        render(<MusicControls ref={ref} audioElement={audioElement} unlockedSongs={2} />);
        const sillyGoofyLabels = screen.getAllByText('Silly Goofy');
        expect(sillyGoofyLabels.length).toBeGreaterThan(0);
        // Now increase unlockedSongs and simulate selecting the new song
        render(<MusicControls ref={ref} audioElement={audioElement} unlockedSongs={3} />);
        act(() => {
            ref.current?.playSongAtIndex(2);
        });
        const happyUpbeatLabels = screen.getAllByText('Happy Upbeat');
        expect(happyUpbeatLabels.length).toBeGreaterThan(0);
    });
});
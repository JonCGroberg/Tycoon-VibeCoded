// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

jest.mock('react-confetti', () => () => null)

// Mock the audio context to avoid errors in tests (for NotificationToast and others)
beforeAll(() => {
    const mockAudioContext = jest.fn().mockImplementation(() => ({
        createOscillator: jest.fn().mockReturnValue({
            type: '',
            frequency: { value: 0 },
            connect: jest.fn(),
            start: jest.fn(),
            stop: jest.fn(),
            onended: null
        }),
        createGain: jest.fn().mockReturnValue({
            gain: {
                value: 0,
                setValueAtTime: jest.fn(),
                linearRampToValueAtTime: jest.fn()
            },
            connect: jest.fn(),
            setValueAtTime: jest.fn(),
            linearRampToValueAtTime: jest.fn()
        }),
        currentTime: 0,
        destination: {},
        close: jest.fn(),
    }))
    window.AudioContext = mockAudioContext;
    window.webkitAudioContext = mockAudioContext;
});
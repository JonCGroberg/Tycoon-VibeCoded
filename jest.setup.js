// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

jest.mock('react-confetti', () => () => null)

// Mock AudioContext for all tests
if (typeof window !== 'undefined') {
    class MockAudioContext {
        constructor() {
            this.currentTime = 0;
            this.destination = {};
        }
        createOscillator() {
            return {
                type: '',
                frequency: { value: 0 },
                connect: jest.fn(),
                start: jest.fn(),
                stop: jest.fn(),
                onended: null
            };
        }
        createGain() {
            return {
                gain: {
                    value: 0,
                    setValueAtTime: jest.fn(),
                    linearRampToValueAtTime: jest.fn()
                },
                connect: jest.fn(),
                setValueAtTime: jest.fn(),
                linearRampToValueAtTime: jest.fn()
            };
        }
        close() { return Promise.resolve(); }
    }
    window.AudioContext = MockAudioContext;
    window.webkitAudioContext = MockAudioContext;
}

// Mock HTMLMediaElement play/pause for all tests
Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
    configurable: true,
    writable: true,
    value: jest.fn().mockResolvedValue(undefined)
});
Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    writable: true,
    value: jest.fn()
});
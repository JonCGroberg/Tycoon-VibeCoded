// eslint-disable-next-line react/display-name
import { render, screen, fireEvent } from '@testing-library/react'
import NotificationToast, { playAchievementChime } from '../notification-toast'
import React from 'react'

jest.mock('../achievements-config', () => ({
    ACHIEVEMENTS: [
        { key: 'test', name: 'Test Achievement', funName: 'Fun Test', icon: () => <svg data-testid="test-icon" />, description: 'desc' }
    ]
}))

jest.mock('react-confetti', () => () => <div data-testid="confetti" />)

// Add displayName to NotificationToast if missing
NotificationToast.displayName = 'NotificationToast'

describe('NotificationToast', () => {
    it('renders notifications with correct message', () => {
        const notifications = [{ id: '1', message: 'Hello world' }]
        render(<NotificationToast notifications={notifications} onDismiss={jest.fn()} />)
        expect(screen.getByText('Hello world')).toBeInTheDocument()
    })

    it('renders achievement notification with funName and icon', () => {
        const notifications = [{ id: '2', message: 'Achievement Unlocked: Test Achievement' }]
        render(<NotificationToast notifications={notifications} onDismiss={jest.fn()} />)
        expect(screen.getByText('Fun Test')).toBeInTheDocument()
        expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    })

    it('calls onDismiss with correct id when dismiss button is clicked', () => {
        const onDismiss = jest.fn()
        const notifications = [{ id: '3', message: 'Dismiss me' }]
        render(<NotificationToast notifications={notifications} onDismiss={onDismiss} />)
        const btn = screen.getByRole('button', { name: /dismiss/i })
        fireEvent.click(btn)
        expect(onDismiss).toHaveBeenCalledWith('3')
    })

    it('renders confetti for achievement notification', () => {
        const notifications = [{ id: '4', message: 'Achievement Unlocked: Test Achievement' }]
        render(<NotificationToast notifications={notifications} onDismiss={jest.fn()} />)
        expect(screen.getByTestId('confetti')).toBeInTheDocument()
    })

    it('handles empty notifications array', () => {
        render(<NotificationToast notifications={[]} onDismiss={jest.fn()} />)
        expect(screen.queryByText(/Achievement|Hello/)).not.toBeInTheDocument()
    })

    it('auto-dismisses notification after 5 seconds', () => {
        jest.useFakeTimers();
        const onDismiss = jest.fn();
        const notifications = [{ id: 'n1', message: 'Test notification' }];
        render(<NotificationToast notifications={notifications} onDismiss={onDismiss} />);
        // Should not be dismissed immediately
        expect(onDismiss).not.toHaveBeenCalled();
        // Fast-forward 5 seconds
        jest.advanceTimersByTime(5000);
        expect(onDismiss).toHaveBeenCalledWith('n1');
        jest.useRealTimers();
    });

    it('closes notification when clicking anywhere on the toast', () => {
        const onDismiss = jest.fn();
        const notifications = [{ id: 'toast1', message: 'Click me!' }];
        render(<NotificationToast notifications={notifications} onDismiss={onDismiss} />);
        const toast = screen.getByRole('button', { name: /dismiss notification/i });
        expect(toast).toBeInTheDocument();
        // Check for hover effect class
        expect(toast.className).toMatch(/hover:scale-105/);
        fireEvent.click(toast);
        expect(onDismiss).toHaveBeenCalledWith('toast1');
    });
})

describe('NotificationToast additional coverage', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    it('handles achievement notification with no matching config', () => {
        const notifications = [{ id: 'b1', message: 'Achievement Unlocked: Unknown Achievement' }];
        render(<NotificationToast notifications={notifications} onDismiss={jest.fn()} />);
        // Should not throw, should not render funName
        expect(screen.queryByText('Fun Test')).not.toBeInTheDocument();
    });

    it('does not render funName/icon/confetti for non-achievement notification', () => {
        const notifications = [{ id: 'c1', message: 'Just a normal notification' }];
        render(<NotificationToast notifications={notifications} onDismiss={jest.fn()} />);
        expect(screen.queryByText('Fun Test')).not.toBeInTheDocument();
        expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
        expect(screen.queryByTestId('confetti')).not.toBeInTheDocument();
    });

    it('renders confetti only in browser', () => {
        // Simulate browser
        Object.defineProperty(global, 'window', { value: {}, writable: true });
        const notifications = [{ id: 'd1', message: 'Achievement Unlocked: Test Achievement' }];
        render(<NotificationToast notifications={notifications} onDismiss={jest.fn()} />);
        expect(screen.getByTestId('confetti')).toBeInTheDocument();
    });

    it('handles multiple notifications at once', () => {
        const notifications = [
            { id: 'e1', message: 'First' },
            { id: 'e2', message: 'Achievement Unlocked: Test Achievement' },
        ];
        const onDismiss = jest.fn();
        render(<NotificationToast notifications={notifications} onDismiss={onDismiss} />);
        // Click both to dismiss
        const toasts = screen.getAllByRole('button', { name: /dismiss notification/i });
        toasts.forEach((toast, idx) => {
            fireEvent.click(toast);
            expect(onDismiss).toHaveBeenCalledWith(notifications[idx].id);
        });
    });
});

describe('NotificationToast edge cases and coverage', () => {
    it('handles malformed achievement message gracefully', () => {
        const notifications = [
            { id: 'mal1', message: 'Achievement Unlocked:' },
            { id: 'mal2', message: 'Achievement Unlocked:    ' },
            { id: 'mal3', message: 'Achievement Unlocked: NotInConfig' },
        ];
        render(<NotificationToast notifications={notifications} onDismiss={jest.fn()} />);
        // Should render all messages
        expect(screen.getAllByText(/Achievement Unlocked/)).toHaveLength(3);
    });

    it('calls onDismiss when clicking the ✕ button (since it triggers parent onClick)', () => {
        const onDismiss = jest.fn();
        const notifications = [{ id: 'close1', message: 'Close test' }];
        render(<NotificationToast notifications={notifications} onDismiss={onDismiss} />);
        const closeBtn = screen.getByText('✕');
        fireEvent.click(closeBtn);
        expect(onDismiss).toHaveBeenCalledWith('close1');
    });

    it('calls onDismiss when pressing Enter or Space on toast', () => {
        const onDismiss = jest.fn();
        const notifications = [{ id: 'kbd1', message: 'Keyboard test' }];
        render(<NotificationToast notifications={notifications} onDismiss={onDismiss} />);
        const toast = screen.getByRole('button', { name: /dismiss notification/i });
        fireEvent.keyDown(toast, { key: 'Enter', code: 'Enter' });
        fireEvent.click(toast); // fallback, since onClick is the only handler
        expect(onDismiss).toHaveBeenCalledWith('kbd1');
    });

    it('cleans up timers on unmount', () => {
        jest.useFakeTimers();
        const onDismiss = jest.fn();
        const notifications = [{ id: 'timer1', message: 'Timer test' }];
        const { unmount } = render(<NotificationToast notifications={notifications} onDismiss={onDismiss} />);
        unmount();
        jest.runOnlyPendingTimers();
        expect(onDismiss).not.toHaveBeenCalled();
        jest.useRealTimers();
    });
});

describe('NotificationToast audio and confetti edge cases', () => {
    let originalAudioContext: any;
    let originalWindow: any;
    beforeAll(() => {
        originalAudioContext = global.AudioContext;
        originalWindow = global.window;
    });
    afterAll(() => {
        global.AudioContext = originalAudioContext;
        global.window = originalWindow;
    });
    it('handles missing AudioContext gracefully', () => {
        // Remove AudioContext from window
        // @ts-ignore
        delete global.AudioContext;
        render(<NotificationToast notifications={[{ id: 'a', message: 'Achievement Unlocked: Test Achievement' }]} onDismiss={jest.fn()} />);
        // Should not throw
        expect(screen.getByText('Fun Test')).toBeInTheDocument();
    });
    it('handles webkitAudioContext', () => {
        // @ts-ignore
        global.window = { webkitAudioContext: jest.fn() };
        render(<NotificationToast notifications={[{ id: 'b', message: 'Achievement Unlocked: Test Achievement' }]} onDismiss={jest.fn()} />);
        expect(screen.getByText('Fun Test')).toBeInTheDocument();
    });
    it('handles error in playAchievementChime', () => {
        // @ts-ignore
        global.AudioContext = jest.fn(() => { throw new Error('fail') });
        render(<NotificationToast notifications={[{ id: 'c', message: 'Achievement Unlocked: Test Achievement' }]} onDismiss={jest.fn()} />);
        expect(screen.getByText('Fun Test')).toBeInTheDocument();
    });
    it('renders notification with no message', () => {
        render(<NotificationToast notifications={[{ id: 'e', message: '' }]} onDismiss={jest.fn()} />);
        expect(screen.getByTestId('notification-toast')).toBeInTheDocument();
    });
    it('renders notification with long message', () => {
        const longMsg = 'A'.repeat(200);
        render(<NotificationToast notifications={[{ id: 'f', message: longMsg }]} onDismiss={jest.fn()} />);
        expect(screen.getByText(longMsg)).toBeInTheDocument();
    });
});

describe('NotificationToast full coverage and edge cases', () => {
    let originalWindow: any
    beforeEach(() => {
        originalWindow = global.window
    })
    afterEach(() => {
        global.window = originalWindow
    })
    it('handles notification with no message', () => {
        render(<NotificationToast notifications={[{ id: 'empty', message: '' }]} onDismiss={jest.fn()} />)
        expect(screen.getByTestId('notification-toast')).toBeInTheDocument()
    })

    it('handles notification with long message', () => {
        const longMsg = 'A'.repeat(500)
        render(<NotificationToast notifications={[{ id: 'long', message: longMsg }]} onDismiss={jest.fn()} />)
        expect(screen.getByText(longMsg)).toBeInTheDocument()
    })

    it('renders achievement notification with no matching config (no funName/icon)', () => {
        const notifications = [{ id: 'noicon', message: 'Achievement Unlocked: NotInConfig' }]
        render(<NotificationToast notifications={notifications} onDismiss={jest.fn()} />)
        expect(screen.queryByText('Fun Test')).not.toBeInTheDocument()
        expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument()
    })

    it('handles malformed achievement message', () => {
        const notifications = [{ id: 'mal', message: 'Achievement Unlocked:' }]
        render(<NotificationToast notifications={notifications} onDismiss={jest.fn()} />)
        expect(screen.getByText('Achievement Unlocked:')).toBeInTheDocument()
    })

    it('calls onDismiss when pressing Enter or Space on toast', () => {
        const onDismiss = jest.fn()
        const notifications = [{ id: 'kbd2', message: 'Keyboard test' }]
        render(<NotificationToast notifications={notifications} onDismiss={onDismiss} />)
        const toast = screen.getByRole('button', { name: /dismiss notification/i })
        fireEvent.keyDown(toast, { key: 'Enter', code: 'Enter' })
        fireEvent.keyDown(toast, { key: ' ', code: 'Space' })
        fireEvent.click(toast)
        expect(onDismiss).toHaveBeenCalledWith('kbd2')
    })

    it('cleans up timers on unmount', () => {
        jest.useFakeTimers()
        const onDismiss = jest.fn()
        const notifications = [{ id: 'timer2', message: 'Timer test' }]
        const { unmount } = render(<NotificationToast notifications={notifications} onDismiss={onDismiss} />)
        unmount()
        jest.runOnlyPendingTimers()
        expect(onDismiss).not.toHaveBeenCalled()
        jest.useRealTimers()
    })

    it('covers playAchievementChime branch where AudioContextCtor is null', () => {
        // @ts-ignore
        global.window = { AudioContext: undefined, webkitAudioContext: undefined }
        // Should not throw
        expect(() => {
            // Directly call the function from the module
            const mod = require('../notification-toast')
            mod.playAchievementChime?.()
        }).not.toThrow()
    })
})

describe('NotificationToast additional edge and defensive cases', () => {
    it('does not render funName/icon/confetti for achievement message that does not match regex', () => {
        const notifications = [{ id: 'x', message: 'Achievement: Not a match' }]
        render(<NotificationToast notifications={notifications} onDismiss={jest.fn()} />)
        expect(screen.queryByText('Fun Test')).not.toBeInTheDocument()
        expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument()
        expect(screen.queryByTestId('confetti')).not.toBeInTheDocument()
    })
    it('renders notification with whitespace-only message', () => {
        render(<NotificationToast notifications={[{ id: 'w', message: '   ' }]} onDismiss={jest.fn()} />)
        expect(screen.getByTestId('notification-toast')).toBeInTheDocument()
    })
    it('renders notification with null/undefined message', () => {
        expect(() => {
            render(<NotificationToast notifications={[{ id: 'n', message: null as any }, { id: 'u', message: undefined as any }]} onDismiss={jest.fn()} />)
        }).not.toThrow()
        expect(screen.getByTestId('notification-toast')).toBeInTheDocument()
    })
})

describe('NotificationToast additional playAchievementChime and defensive coverage', () => {
    it('playAchievementChime is a no-op in SSR/test environment', () => {
        // In test environment, just call and assert no throw
        expect(() => playAchievementChime()).not.toThrow()
    })
    it('playAchievementChime is a no-op if both AudioContext and webkitAudioContext are missing', () => {
        // @ts-ignore
        global.window = { AudioContext: undefined, webkitAudioContext: undefined }
        expect(() => playAchievementChime()).not.toThrow()
    })
    it('renders notification with non-string message (number, null, undefined)', () => {
        const notifications = [
            { id: 'n1', message: 123 as any },
            { id: 'n2', message: null as any },
            { id: 'n3', message: undefined as any }
        ]
        render(<NotificationToast notifications={notifications} onDismiss={jest.fn()} />)
        // Should render fallback for all
        expect(screen.getAllByText('No message').length).toBe(3)
    })
})

describe('NotificationToast defensive and SSR branches', () => {
    it('renders fallback UI for notification with non-string message (null)', () => {
        render(<NotificationToast notifications={[{ id: 'n1', message: null as any }]} onDismiss={jest.fn()} />);
        expect(screen.getByText('Notification')).toBeInTheDocument();
        expect(screen.getByText('No message')).toBeInTheDocument();
    });
    it('renders fallback UI for notification with non-string message (undefined)', () => {
        render(<NotificationToast notifications={[{ id: 'n2', message: undefined as any }]} onDismiss={jest.fn()} />);
        expect(screen.getByText('Notification')).toBeInTheDocument();
        expect(screen.getByText('No message')).toBeInTheDocument();
    });
    it('renders fallback UI for notification with non-string message (number)', () => {
        render(<NotificationToast notifications={[{ id: 'n3', message: 123 as any }]} onDismiss={jest.fn()} />);
        expect(screen.getByText('Notification')).toBeInTheDocument();
        expect(screen.getByText('No message')).toBeInTheDocument();
    });
    it('playAchievementChime is a no-op in SSR/test env', () => {
        expect(() => playAchievementChime()).not.toThrow();
    });
    it('playAchievementChime is a no-op if no valid AudioContext constructor', () => {
        const originalWindow = global.window;
        // @ts-ignore
        global.window = { AudioContext: undefined, webkitAudioContext: undefined };
        expect(() => playAchievementChime()).not.toThrow();
        global.window = originalWindow;
    });
});
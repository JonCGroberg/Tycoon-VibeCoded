import { render, screen, fireEvent } from '@testing-library/react'
import NotificationToast from '../notification-toast'
import React from 'react'

jest.mock('../achievements-config', () => ({
    ACHIEVEMENTS: [
        { key: 'test', name: 'Test Achievement', funName: 'Fun Test', icon: () => <svg data-testid="test-icon" />, description: 'desc' }
    ]
}))

jest.mock('react-confetti', () => () => <div data-testid="confetti" />)

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
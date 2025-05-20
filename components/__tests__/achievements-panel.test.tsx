import { render, screen, fireEvent } from '@testing-library/react'
import AchievementsPanel from '../achievements-panel'
import React from 'react'

jest.mock('../achievements-config', () => ({
    ACHIEVEMENTS: [
        { key: 'a1', name: 'Name1', funName: 'Fun1', icon: () => <svg data-testid="icon1" />, description: 'Desc1' },
        { key: 'a2', name: 'Name2', funName: 'Fun2', icon: () => <svg data-testid="icon2" />, description: 'Desc2' }
    ]
}))

describe('AchievementsPanel', () => {
    it('renders all achievements with correct funName, name, and description', () => {
        const achievements = { a1: true, a2: false }
        render(<AchievementsPanel achievements={achievements} onClose={jest.fn()} />)
        expect(screen.getByText('Fun1')).toBeInTheDocument()
        expect(screen.getByText('Name1')).toBeInTheDocument()
        expect(screen.getByText('Desc1')).toBeInTheDocument()
        expect(screen.getByText('Fun2')).toBeInTheDocument()
        expect(screen.getByText('Name2')).toBeInTheDocument()
        expect(screen.getByText('Desc2')).toBeInTheDocument()
        expect(screen.getByTestId('icon1')).toBeInTheDocument()
        expect(screen.getByTestId('icon2')).toBeInTheDocument()
    })

    it('renders unlocked and locked achievements with correct styles', () => {
        const achievements = { a1: true, a2: false }
        render(<AchievementsPanel achievements={achievements} onClose={jest.fn()} />)
        const unlocked = screen.getByText('Fun1').closest('li')
        const locked = screen.getByText('Fun2').closest('li')
        expect(unlocked).toHaveClass('bg-green-100')
        expect(locked).toHaveClass('bg-gray-100')
        expect(locked).toHaveClass('opacity-60')
    })

    it('calls onClose when close button is clicked', () => {
        const onClose = jest.fn()
        render(<AchievementsPanel achievements={{ a1: true, a2: false }} onClose={onClose} />)
        const btn = screen.getByRole('button', { name: /close/i })
        fireEvent.click(btn)
        expect(onClose).toHaveBeenCalled()
    })

    it('handles empty achievements object', () => {
        render(<AchievementsPanel achievements={{}} onClose={jest.fn()} />)
        expect(screen.getAllByRole('listitem').length).toBe(2)
    })
})
import { render, screen } from '@testing-library/react'
import React from 'react'
import { GameStateProvider, useGameState } from '../game-state'

describe('GameStateProvider', () => {
    it('provides game state context to children', () => {
        function Child() {
            const { gameState } = useGameState()
            return <div data-testid="coins">{gameState.coins}</div>
        }
        render(<GameStateProvider><Child /></GameStateProvider>)
        expect(screen.getByTestId('coins')).toBeInTheDocument()
    })

    it('throws if useGameState is used outside provider', () => {
        function BadChild() {
            try {
                useGameState()
            } catch {
                return <div data-testid="error">error</div>
            }
            return null
        }
        render(<BadChild />)
        expect(screen.getByTestId('error')).toBeInTheDocument()
    })
})
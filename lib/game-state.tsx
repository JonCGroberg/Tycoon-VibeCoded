"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { GameState } from "./game-types"
import { initializeGameState } from "./game-logic"

interface GameStateContextType {
    gameState: GameState
    updateGameState: (newState: GameState) => void
}

const GameStateContext = createContext<GameStateContextType | undefined>(undefined)

export function GameStateProvider({ children }: { children: ReactNode }) {
    const [gameState, setGameState] = useState<GameState>(initializeGameState())

    return (
        <GameStateContext.Provider value={{ gameState, updateGameState: setGameState }}>
            {children}
        </GameStateContext.Provider>
    )
}

export function useGameState() {
    const context = useContext(GameStateContext)
    if (context === undefined) {
        throw new Error("useGameState must be used within a GameStateProvider")
    }
    return context
}
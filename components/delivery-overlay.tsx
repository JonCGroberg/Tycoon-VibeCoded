"use client"

import { Button } from "@/components/ui/button"
import { GameState } from "@/lib/game-types"
import { TruckIcon, PackageIcon, CoinsIcon } from "lucide-react"

interface DeliveryOverlayProps {
    onClose: () => void
    gameState: GameState
    onUpdateGameState: (newState: GameState) => void
}

export function DeliveryOverlay({ onClose, gameState, onUpdateGameState }: DeliveryOverlayProps) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Delivery Management</h2>
                    <Button variant="ghost" onClick={onClose}>Close</Button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Active Deliveries */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-3 flex items-center">
                                <TruckIcon className="w-5 h-5 mr-2" />
                                Active Deliveries
                            </h3>
                            {gameState.activeDeliveries?.length === 0 ? (
                                <p className="text-gray-500">No active deliveries</p>
                            ) : (
                                <div className="space-y-2">
                                    {gameState.activeDeliveries?.map((delivery) => (
                                        <div key={delivery.id} className="bg-white p-3 rounded border">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium">
                                                        {delivery.resourceAmount} {delivery.resourceType}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        From: {gameState.businesses.find(b => b.id === delivery.sourceBusinessId)?.type}
                                                        <br />
                                                        To: {gameState.businesses.find(b => b.id === delivery.targetBusinessId)?.type}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-500">
                                                        Arrival in: {Math.ceil((delivery.expectedArrival - Date.now()) / 1000)}s
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pending Deliveries */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-3 flex items-center">
                                <PackageIcon className="w-5 h-5 mr-2" />
                                Pending Deliveries
                            </h3>
                            {gameState.businesses.every(b => !b.pendingDeliveries?.length) ? (
                                <p className="text-gray-500">No pending deliveries</p>
                            ) : (
                                <div className="space-y-2">
                                    {gameState.businesses.map((business) =>
                                        business.pendingDeliveries?.map((delivery, index) => (
                                            <div key={`${business.id}-${index}`} className="bg-white p-3 rounded border">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-medium">
                                                            {delivery.resourceAmount} {delivery.resourceType}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            To: {business.type}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-500">
                                                            From: {gameState.businesses.find(b => b.id === delivery.sourceBusinessId)?.type}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Delivery Stats */}
                    <div className="bg-gray-50 p-4 rounded-lg mt-4">
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                            <CoinsIcon className="w-5 h-5 mr-2" />
                            Delivery Statistics
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-3 rounded border">
                                <p className="text-sm text-gray-500">Active Deliveries</p>
                                <p className="text-xl font-bold">{gameState.activeDeliveries?.length || 0}</p>
                            </div>
                            <div className="bg-white p-3 rounded border">
                                <p className="text-sm text-gray-500">Total Pending</p>
                                <p className="text-xl font-bold">
                                    {gameState.businesses.reduce((sum, b) => sum + (b.pendingDeliveries?.length || 0), 0)}
                                </p>
                            </div>
                            <div className="bg-white p-3 rounded border">
                                <p className="text-sm text-gray-500">Total Resources in Transit</p>
                                <p className="text-xl font-bold">
                                    {gameState.activeDeliveries?.reduce((sum, d) => sum + d.resourceAmount, 0) || 0}
                                </p>
                            </div>
                            <div className="bg-white p-3 rounded border">
                                <p className="text-sm text-gray-500">Total Pending Resources</p>
                                <p className="text-xl font-bold">
                                    {gameState.businesses.reduce((sum, b) =>
                                        sum + (b.pendingDeliveries?.reduce((s, d) => s + d.resourceAmount, 0) || 0), 0
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
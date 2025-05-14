"use client"

import type React from "react"

import { useState, useRef } from "react"
import { type Business, BusinessType } from "@/lib/game-types"
import BusinessEntity from "./business-entity"
import DeliveryBotEntity from "./delivery-bot"

interface GameWorldProps {
  businesses: Business[]
  placingBusiness: BusinessType | null
  activeDeliveries: any[]
  onPlaceBusiness: (type: BusinessType, position: { x: number; y: number }) => void
  onSelectBusiness: (business: Business) => void
  onDeliveryComplete: (deliveryId: string) => void
  marketPrices: Record<string, { value: number; target: number }>
}

export default function GameWorld({
  businesses,
  placingBusiness,
  activeDeliveries,
  onPlaceBusiness,
  onSelectBusiness,
  onDeliveryComplete,
  marketPrices,
}: GameWorldProps) {
  const worldRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Track mouse position for business placement
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!worldRef.current) return

    const rect = worldRef.current.getBoundingClientRect()
    const newPosition = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
    setMousePosition(newPosition)
  }

  // Handle click to place business
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent event bubbling
    if (placingBusiness) {
      console.log('Click detected:', {
        placingBusiness,
        timestamp: Date.now()
      })
      onPlaceBusiness(placingBusiness, mousePosition)
    }
  }

  return (
    <div
      ref={worldRef}
      className="w-full h-full bg-green-100 relative overflow-hidden border-2 border-gray-400 rounded-lg"
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    >
      {/* True 12x12 grid for visual reference */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {Array.from({ length: 12 * 12 }).map((_, i) => {
          const row = Math.floor(i / 12);
          const col = i % 12;
          return (
            <div
              key={`cell-${row}-${col}`}
              className="absolute border border-gray-300"
              style={{
                left: `calc(${(col / 12) * 100}% )`,
                top: `calc(${(row / 12) * 100}% )`,
                width: `calc(100% / 12)`,
                height: `calc(100% / 12)`,
                boxSizing: 'border-box',
              }}
            />
          );
        })}
      </div>

      {/* Market price panel in top right (larger, all business resources) */}
      <div className="absolute top-4 right-4 z-30 bg-white bg-opacity-90 rounded shadow px-6 py-4 border-2 border-yellow-400 flex flex-col items-center min-w-[240px] max-w-xs">
        <div className="text-base font-bold text-yellow-700 mb-2">Market Prices</div>
        {Object.entries(marketPrices)
          .filter(([k]) => k !== 'NONE')
          .map(([resource, price]) => (
            <div key={resource} className="flex items-center text-sm mb-1 justify-between w-full">
              <span className="font-bold mr-2">{resource.charAt(0) + resource.slice(1).toLowerCase()}</span>
              <span className="ml-2">{price.value.toFixed(2)}</span>
            </div>
          ))}
      </div>

      {/* Render all businesses */}
      {businesses.map((business) => {
        // Remove market panel above the market entity
        return <BusinessEntity key={business.id} business={business} onClick={() => onSelectBusiness(business)} />
      })}

      {/* Render active deliveries */}
      {activeDeliveries.map((delivery) => {
        const sourceBusiness = businesses.find((b) => b.id === delivery.sourceBusinessId)
        const targetBusiness = businesses.find((b) => b.id === delivery.targetBusinessId)

        if (!sourceBusiness || !targetBusiness) return null

        return (
          <DeliveryBotEntity
            key={delivery.id}
            bot={delivery.bot}
            sourcePosition={sourceBusiness.position}
            targetPosition={targetBusiness.position}
            resourceType={sourceBusiness.outputResource}
            onDeliveryComplete={() => onDeliveryComplete(delivery.id)}
          />
        )
      })}

      {/* Preview of business being placed */}
      {placingBusiness && (
        <div
          className="absolute w-24 h-24 bg-blue-500 bg-opacity-50 rounded-md border-2 border-blue-700 pointer-events-none"
          style={{
            left: mousePosition.x - 48,
            top: mousePosition.y - 48,
            zIndex: 100,
          }}
        >
          <div className="text-sm text-center text-white font-bold mt-2">
            {placingBusiness === BusinessType.RESOURCE_GATHERING
              ? "Woodcutter"
              : placingBusiness === BusinessType.PROCESSING
                ? "Plank Mill"
                : "Furniture Shop"}
          </div>
        </div>
      )}
    </div>
  )
}

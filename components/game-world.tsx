"use client"

import React from "react"

import { useState, useRef } from "react"
import { type Business, BusinessType, type ActiveDelivery } from "@/lib/game-types"
import BusinessEntity from "./business-entity"
import DeliveryBotEntity from "./delivery-bot"

interface GameWorldProps {
  businesses: Business[]
  placingBusiness: BusinessType | null
  activeDeliveries: ActiveDelivery[]
  onPlaceBusiness: (type: BusinessType, position: { x: number; y: number }) => void
  onSelectBusiness: (business: Business) => void
  onDeliveryComplete: (deliveryId: string) => void
  onMoveBusiness?: (businessId: string, newPosition: { x: number; y: number }) => void
  selectedBusinessId?: string | null
  pan: { x: number; y: number }
  setPan: (pan: { x: number; y: number }) => void
}

const GameWorld = function GameWorld({
  businesses,
  placingBusiness,
  activeDeliveries,
  onPlaceBusiness,
  onSelectBusiness,
  onDeliveryComplete,
  onMoveBusiness,
  selectedBusinessId,
  pan,
  setPan,
}: GameWorldProps) {
  const worldRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const panStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Track mouse position for business placement (adjusted for pan)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!worldRef.current) return
    const rect = worldRef.current.getBoundingClientRect()
    const newPosition = {
      x: e.clientX - rect.left - pan.x,
      y: e.clientY - rect.top - pan.y,
    }
    setMousePosition(newPosition)
    if (dragging) {
      setPan({
        x: panStart.current.x + (e.clientX - dragStart.current.x),
        y: panStart.current.y + (e.clientY - dragStart.current.y),
      })
    }
  }

  // Start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (placingBusiness) return // Don't pan while placing
    setDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY }
    panStart.current = { ...pan }
  }

  // Stop dragging
  const handleMouseUp = () => {
    setDragging(false)
  }

  // Handle click to place business
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (placingBusiness) {
      onPlaceBusiness(placingBusiness, mousePosition)
    }
  }

  // Handle moving a business (drag and drop)
  const handleBusinessMove = (businessId: string, newPosition: { x: number; y: number }) => {
    // newPosition is in world (board) coordinates, so do not adjust for pan
    if (onMoveBusiness) {
      onMoveBusiness(businessId, newPosition)
    }
  }

  // Attach mouseup to window for smooth drag end
  React.useEffect(() => {
    if (!dragging) return
    const up = () => setDragging(false)
    window.addEventListener('mouseup', up)
    return () => window.removeEventListener('mouseup', up)
  }, [dragging])

  return (
    <div
      ref={worldRef}
      data-testid="game-world"
      className="w-full h-full bg-green-100 relative overflow-hidden border-2 border-gray-400 rounded-lg cursor-grab"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      style={{ userSelect: dragging ? 'none' : undefined, pointerEvents: 'auto' }}
    >
      <div
        className="absolute z-10"
        style={{
          width: 3000,
          height: 3000,
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          transition: dragging ? 'none' : 'transform 0.1s',
          pointerEvents: 'auto',
        }}
        onMouseMove={handleMouseMove}
      >
        {/* Full board grid pattern */}
        <div className="absolute inset-0 pointer-events-none z-0">
          {Array.from({ length: 60 * 60 }).map((_, i) => {
            const row = Math.floor(i / 60);
            const col = i % 60;
            return (
              <div
                key={`cell-${row}-${col}`}
                className="absolute border border-gray-300 opacity-30"
                style={{
                  left: `${(col / 60) * 100}%`,
                  top: `${(row / 60) * 100}%`,
                  width: `${100 / 60}%`,
                  height: `${100 / 60}%`,
                  boxSizing: 'border-box',
                }}
              />
            );
          })}
        </div>

        {/* Market price panel in top right (larger, all business resources) */}
        {/*
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
        */}

        {/* Render all businesses */}
        {businesses.map((business) => (
          <BusinessEntity
            key={business.id}
            business={business}
            onClick={() => onSelectBusiness(business)}
            onMove={onMoveBusiness}
            selected={selectedBusinessId === business.id}
          />
        ))}

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
              resourceType={delivery.resourceType}
              onDeliveryComplete={() => onDeliveryComplete(delivery.id)}
              deliveryStartTime={delivery.createdAt}
              deliveryExpectedArrival={delivery.expectedArrival}
              shippingTypeId={delivery.bot.shippingTypeId}
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
                ? "Wood Camp"
                : placingBusiness === BusinessType.PROCESSING
                  ? "Plank Mill"
                  : "Furniture Shop"}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(GameWorld)

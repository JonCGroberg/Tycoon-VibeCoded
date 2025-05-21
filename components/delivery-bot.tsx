"use client"

import { useEffect, useState } from "react"
import { type DeliveryBot, ResourceType } from "@/lib/game-types"
import { getShippingTypeConfig } from "@/lib/shipping-types"

interface DeliveryBotEntityProps {
  bot: DeliveryBot
  sourcePosition: { x: number; y: number }
  targetPosition: { x: number; y: number }
  resourceType: ResourceType
  onDeliveryComplete: () => void
  deliveryStartTime: number
  deliveryExpectedArrival: number
  shippingTypeId?: string
}

export default function DeliveryBotEntity({
  bot,
  sourcePosition,
  targetPosition,
  resourceType,
  onDeliveryComplete,
  deliveryStartTime,
  deliveryExpectedArrival,
  shippingTypeId,
}: DeliveryBotEntityProps) {
  const [position, setPosition] = useState({ x: sourcePosition.x, y: sourcePosition.y })

  // Get resource color
  const getResourceColor = (resourceType: ResourceType) => {
    switch (resourceType) {
      case ResourceType.WOOD:
        return "bg-green-700"
      case ResourceType.STONE:
        return "bg-gray-500"
      case ResourceType.IRON_ORE:
        return "bg-gray-700"
      case ResourceType.PLANKS:
        return "bg-amber-600"
      case ResourceType.BRICKS:
        return "bg-red-600"
      case ResourceType.IRON_INGOT:
        return "bg-gray-400"
      case ResourceType.FURNITURE:
        return "bg-amber-800"
      case ResourceType.TOOLS:
        return "bg-blue-600"
      default:
        return "bg-gray-300"
    }
  }

  // Select icon based on shippingTypeId using SHIPPING_TYPES config
  let IconComponent: React.ElementType | null = null;
  if (shippingTypeId) {
    try {
      IconComponent = getShippingTypeConfig(shippingTypeId).icon;
    } catch {
      IconComponent = null;
    }
  }

  useEffect(() => {
    const animateDelivery = () => {
      const currentTime = Date.now()
      const elapsed = currentTime - deliveryStartTime
      const newProgress = Math.min(1, elapsed / Math.max(100, deliveryExpectedArrival - deliveryStartTime))

      // Linear interpolation between source and target
      const newX = sourcePosition.x + (targetPosition.x - sourcePosition.x) * newProgress
      const newY = sourcePosition.y + (targetPosition.y - sourcePosition.y) * newProgress

      setPosition({ x: newX, y: newY })

      if (newProgress < 1) {
        requestAnimationFrame(animateDelivery)
      } else {
        onDeliveryComplete()
      }
    }

    requestAnimationFrame(animateDelivery)

    return () => {
      // Cleanup if needed
    }
  }, [sourcePosition, targetPosition, deliveryExpectedArrival, deliveryStartTime, onDeliveryComplete])

  return (
    <div
      className="absolute w-8 h-8 bg-white rounded-full border-2 border-gray-400 flex items-center justify-center shadow-md"
      style={{
        left: position.x - 16,
        top: position.y - 16,
        zIndex: 10,
      }}
    >
      {/* Delivery vehicle icon */}
      {IconComponent && <IconComponent className={`lucide-${shippingTypeId} w-5 h-5`} />}
      {/* Resource being carried */}
      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getResourceColor(resourceType)}`}></div>
      {/* Amount being carried */}
      {bot.currentLoad > 0 && (
        <div className="absolute -bottom-2 text-xs font-bold bg-white px-1 rounded-full border border-gray-300">
          {bot.currentLoad}
        </div>
      )}
    </div>
  )
}

"use client"

import { type Business, BusinessType, ResourceType } from "@/lib/game-types"
import { TreesIcon as TreeIcon, HammerIcon, StoreIcon, UserIcon, TruckIcon, CoinsIcon, AlertCircleIcon, GemIcon, WrenchIcon, PackageIcon, BoxIcon } from "lucide-react"

interface BusinessEntityProps {
  business: Business
  onClick: () => void
}

export default function BusinessEntity({ business, onClick }: BusinessEntityProps) {
  // Get the appropriate icon based on business type
  const getBusinessIcon = () => {
    switch (business.type) {
      case BusinessType.RESOURCE_GATHERING:
        return <TreeIcon className="w-6 h-6 text-green-800" />
      case BusinessType.PROCESSING:
        return <HammerIcon className="w-6 h-6 text-amber-700" />
      case BusinessType.SHOP:
        return <StoreIcon className="w-6 h-6 text-blue-700" />
      case BusinessType.MARKET:
        return <CoinsIcon className="w-6 h-6 text-yellow-500" />
    }
  }

  // Get color based on business type
  const getBusinessColor = () => {
    switch (business.type) {
      case BusinessType.RESOURCE_GATHERING:
        return "bg-green-200 border-green-600"
      case BusinessType.PROCESSING:
        return "bg-amber-200 border-amber-600"
      case BusinessType.SHOP:
        return "bg-blue-200 border-blue-600"
      case BusinessType.MARKET:
        return "bg-yellow-200 border-yellow-600"
    }
  }

  // Get business name based on type and resources
  const getBusinessName = () => {
    switch (business.type) {
      case BusinessType.RESOURCE_GATHERING:
        return business.outputResource === ResourceType.WOOD
          ? "Lumber Yard"
          : business.outputResource === ResourceType.STONE
            ? "Quarry"
            : "Mine"
      case BusinessType.PROCESSING:
        return business.outputResource === ResourceType.PLANKS
          ? "Plank Mill"
          : business.outputResource === ResourceType.BRICKS
            ? "Brick Kiln"
            : "Smelter"
      case BusinessType.SHOP:
        return business.outputResource === ResourceType.FURNITURE ? "Furniture Shop" : "Tool Shop"
      case BusinessType.MARKET:
        return "Market"
    }
  }

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

  // Get resource icon
  const getResourceIcon = (resourceType: ResourceType) => {
    switch (resourceType) {
      case ResourceType.WOOD:
        return <TreeIcon className="w-3.5 h-3.5 text-white" />
      case ResourceType.STONE:
        return <GemIcon className="w-3.5 h-3.5 text-white" />
      case ResourceType.IRON_ORE:
        return <BoxIcon className="w-3.5 h-3.5 text-white" />
      case ResourceType.PLANKS:
        return <HammerIcon className="w-3.5 h-3.5 text-white" />
      case ResourceType.BRICKS:
        return <PackageIcon className="w-3.5 h-3.5 text-white" />
      case ResourceType.IRON_INGOT:
        return <BoxIcon className="w-3.5 h-3.5 text-white" />
      case ResourceType.FURNITURE:
        return <StoreIcon className="w-3.5 h-3.5 text-white" />
      case ResourceType.TOOLS:
        return <WrenchIcon className="w-3.5 h-3.5 text-white" />
      default:
        return null
    }
  }

  // Get buffer status color (for bottleneck visualization)
  const getBufferStatusColor = (current: number | null | undefined, capacity: number | null | undefined) => {
    const currentValue = current ?? 0
    const capacityValue = capacity ?? 1
    const fillPercentage = (currentValue / capacityValue) * 100
    if (fillPercentage >= 90) return "bg-red-500" // Bottleneck - nearly full
    if (fillPercentage >= 70) return "bg-yellow-500" // Warning - getting full
    if (fillPercentage <= 10 && fillPercentage > 0) return "bg-blue-500" // Low - needs more
    return "bg-green-500" // Normal operation
  }

  // Calculate buffer height as percentage
  const getBufferHeight = (current: number | null | undefined, capacity: number | null | undefined) => {
    const currentValue = current ?? 0
    const capacityValue = capacity ?? 1
    return `${Math.min(100, (currentValue / capacityValue) * 100)}%`
  }

  return (
    <div
      className={`absolute w-24 h-24 ${getBusinessColor()} rounded-md border-2 flex flex-col items-center justify-start cursor-pointer transition-transform hover:scale-105`}
      style={{
        left: business.position.x - 48,
        top: business.position.y - 48,
      }}
      onClick={onClick}
    >
      {/* Business Level - Changed to plain text */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm font-bold text-gray-800">
        Lvl {business.level}
      </div>

      {/* Only show name, icon, and resource indicators if not Market */}
      {business.type !== BusinessType.MARKET && <>
        <div className="text-sm font-bold mt-2 text-center">{getBusinessName()}</div>
        <div className="mt-2">{getBusinessIcon()}</div>
        {/* Input Buffer Visualization - Left side */}
        {business.type !== BusinessType.RESOURCE_GATHERING && (
          <div className="absolute left-0 top-0 w-2 h-full flex flex-col-reverse">
            <div
              className={`w-full ${getBufferStatusColor(
                business.incomingBuffer?.current,
                business.incomingBuffer?.capacity,
              )}`}
              style={{ height: getBufferHeight(business.incomingBuffer?.current, business.incomingBuffer?.capacity) }}
            ></div>
          </div>
        )}
        {/* Output Buffer Visualization - Right side */}
        <div className="absolute right-0 top-0 w-2 h-full flex flex-col-reverse">
          <div
            className={`w-full ${getBufferStatusColor(
              business.outgoingBuffer?.current,
              business.outgoingBuffer?.capacity,
            )}`}
            style={{ height: getBufferHeight(business.outgoingBuffer?.current, business.outgoingBuffer?.capacity) }}
          ></div>
        </div>
      </>}

      {/* Show workers and delivery drivers */}
      <div className="absolute -bottom-3 -left-2 flex space-x-2">
        {/*
        {business.workers.length > 0 && (
          <div className="bg-white rounded-full p-1.5 border border-gray-400 flex items-center">
            <UserIcon className="w-4 h-4 text-gray-700" />
            <span className="text-sm ml-1">{business.workers.length}</span>
          </div>
        )}
        */}
        {business.deliveryBots.length > 0 && (
          <div className="bg-white rounded-full p-1.5 border border-gray-400 flex items-center">
            <TruckIcon className="w-4 h-4 text-gray-700" />
            <span className="text-sm ml-1">{business.deliveryBots.length}</span>
            <span className="text-xs ml-1 text-gray-500">driver{business.deliveryBots.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Production progress bar and resource indicators at the top (always visible, 1.5x wider) */}
      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2" style={{ width: '144px' /* 1.5 * 96px (entity width) */ }}>
        <div className="flex items-center justify-between w-full space-x-2">
          {/* Input Resource Indicator - always visible */}
          <div className={`p-1 w-6 h-6 rounded-full border-2 border-yellow-400 flex items-center justify-center relative ${getResourceColor(business.inputResource)} ${business.type === BusinessType.RESOURCE_GATHERING || business.type === BusinessType.MARKET ? 'opacity-30' : ''}`}>
            {getResourceIcon(business.inputResource)}
            {/* ! badge if requesting */}
            {business.type !== BusinessType.RESOURCE_GATHERING && business.type !== BusinessType.MARKET && business.incomingBuffer.current < business.incomingBuffer.capacity && (
              <AlertCircleIcon className="absolute -top-2 -right-2 w-3 h-3 text-yellow-500 animate-pulse" />
            )}
          </div>
          {/* Progress bar */}
          <div className="flex-1 mx-1 h-1.5 bg-gray-300 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${business.productionProgress * 100}%` }}></div>
          </div>
          {/* Output Resource Indicator - always visible */}
          <div className={`p-1 w-6 h-6 rounded-full border-2 border-blue-400 flex items-center justify-center ${getResourceColor(business.outputResource)} ${business.type === BusinessType.MARKET ? 'opacity-30' : ''} ${business.outgoingBuffer.current === 0 ? 'opacity-50' : ''}`}>
            {getResourceIcon(business.outputResource)}
          </div>
        </div>
      </div>

      {/* Starvation indicator: show ! if input buffer is empty and business is not resource gathering or market */}
      {business.type !== BusinessType.RESOURCE_GATHERING && business.type !== BusinessType.MARKET &&
        business.incomingBuffer.current === 0 && (
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 flex items-center z-10">
            <AlertCircleIcon className="w-5 h-5 text-yellow-500 animate-pulse mr-1" />
            <span className="text-xs font-bold text-yellow-700 bg-white bg-opacity-80 px-1 rounded">
              Needs {business.inputResource.charAt(0) + business.inputResource.slice(1).toLowerCase()}
            </span>
          </div>
        )}

      {/* Profit indicators */}
      {business.recentProfit && business.recentProfit > 0 && (
        <div
          className="absolute -top-16 left-1/2 transform -translate-x-1/2 text-green-600 font-bold text-base animate-float"
          style={{
            animation: "float 2s ease-out forwards",
            opacity: business.profitDisplayTime ? Math.max(0, 1 - business.profitDisplayTime / 2000) : 1,
          }}
        >
          +{business.recentProfit.toFixed(1)}
        </div>
      )}
    </div>
  )
}

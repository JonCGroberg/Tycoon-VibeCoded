"use client"

import { type Business, BusinessType, ResourceType } from "@/lib/game-types"
import { getBusinessData } from "@/lib/business-data"
import { TreesIcon as TreeIcon, Logs, StoreIcon, UserIcon, TruckIcon, CoinsIcon, AlertCircleIcon, GemIcon, WrenchIcon, PackageIcon, BoxIcon } from "lucide-react"

interface BusinessEntityProps {
  business: Business
  onClick: () => void
}

export default function BusinessEntity({ business, onClick }: BusinessEntityProps) {
  const businessData = getBusinessData(business.type)

  // Get the appropriate icon component
  const iconMap = {
    TreeIcon,
    GemIcon,
    BoxIcon,
    Logs,
    PackageIcon,
    WrenchIcon,
    StoreIcon,
    CoinsIcon
  }

  const BusinessIcon = iconMap[businessData.icon as keyof typeof iconMap]

  // Get color based on business type
  const businessColor = `${businessData.color.background} ${businessData.color.border}`

  // Get business name
  const businessName = businessData.name

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
        return <Logs className="w-3.5 h-3.5 text-white" />
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
      className={`absolute w-24 h-24 ${businessColor} rounded-md border-2 flex flex-col items-center justify-start cursor-pointer transition-transform hover:scale-105`}
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

      <div className="text-sm font-bold mt-2 text-center">{businessName}</div>

      <div className="mt-2">{BusinessIcon && <BusinessIcon className={`w-6 h-6 ${businessData.iconColor}`} />}</div>

      {/* Input Buffer Visualization - Left side */}
      {business.type !== BusinessType.RESOURCE_GATHERING &&
        business.type !== BusinessType.QUARRY &&
        business.type !== BusinessType.MINE &&
        business.type !== BusinessType.MARKET && (
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
      {business.type !== BusinessType.MARKET && (
        <div className="absolute right-0 top-0 w-2 h-full flex flex-col-reverse">
          <div
            className={`w-full ${getBufferStatusColor(
              business.outgoingBuffer?.current,
              business.outgoingBuffer?.capacity,
            )}`}
            style={{ height: getBufferHeight(business.outgoingBuffer?.current, business.outgoingBuffer?.capacity) }}
          ></div>
        </div>
      )}

      {/* Show workers and delivery drivers */}
      <div className="absolute -bottom-6 -left-4 flex space-x-2">
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
      {business.type !== BusinessType.MARKET && (
        <div className="absolute -top-5 left-1/2 transform -translate-x-1/2" style={{ width: '144px' }}>
          <div className="flex items-center justify-between w-full space-x-2">
            {/* Input Resource Indicator - invisible for tier 1 businesses and when no input */}
            <div className={`p-1 w-6 h-6 rounded-full border-2 border-yellow-400 flex items-center justify-center relative ${getResourceColor(business.inputResource)} ${(business.type === BusinessType.RESOURCE_GATHERING || business.type === BusinessType.QUARRY || business.type === BusinessType.MINE || business.inputResource === ResourceType.NONE) ? 'invisible' : ''}`}>
              {getResourceIcon(business.inputResource)}
              {/* ! badge if requesting */}
              {business.type !== BusinessType.RESOURCE_GATHERING &&
                business.type !== BusinessType.QUARRY &&
                business.type !== BusinessType.MINE &&
                business.incomingBuffer.current < business.incomingBuffer.capacity && (
                  <AlertCircleIcon className="absolute -top-2 -right-2 w-3 h-3 text-red-500" />
                )}
            </div>
            {/* Progress bar */}
            <div className="flex-1 mx-1 h-1.5 bg-gray-300 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${business.productionProgress * 100}%` }}></div>
            </div>
            {/* Output Resource Indicator - always visible */}
            <div className={`p-1 w-6 h-6 rounded-full border-2 border-blue-400 flex items-center justify-center ${getResourceColor(business.outputResource)} ${business.outgoingBuffer.current === 0 ? 'opacity-50' : ''}`}>
              {getResourceIcon(business.outputResource)}
            </div>
          </div>
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

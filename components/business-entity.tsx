"use client"

import { type Business, BusinessType, ResourceType } from "@/lib/game-types"
import { TreesIcon as TreeIcon, Columns4, StoreIcon, UserIcon, TruckIcon, CoinsIcon, AlertCircleIcon, GemIcon, WrenchIcon, PackageIcon, BoxIcon, AlertTriangleIcon, AlertTriangle, ShipIcon, PlaneIcon } from "lucide-react"
import { Alert } from "./ui/alert"
import { getResourceName } from "./business-panel"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
        return <Columns4 className="w-6 h-6 text-amber-700" />
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
          ? "Wood Camp"
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
        return <Columns4 className="w-3.5 h-3.5 text-white" />
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
    if (fillPercentage >= 85) return "bg-red-500" // Bottleneck - nearly full
    if (fillPercentage >= 65) return "bg-yellow-500" // Warning - getting full
    if (fillPercentage <= 20 && fillPercentage > 0) return "bg-blue-500" // Low - needs more
    return "bg-green-500" // Normal operation
  }

  // Calculate buffer height as percentage
  const getBufferHeight = (current: number | null | undefined, capacity: number | null | undefined) => {
    const currentValue = current ?? 0
    const capacityValue = capacity ?? 1
    return `${Math.min(100, (currentValue / capacityValue) * 100)}%`
  }

  const incomingStorageHeight = getBufferHeight(
    business.incomingStorage?.current,
    business.incomingStorage?.capacity,
  )
  const outgoingStorageHeight = getBufferHeight(
    business.outgoingStorage?.current,
    business.outgoingStorage?.capacity,
  )

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div
            data-testid="business-entity"
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

            <div className="text-sm font-bold mt-2 text-center text-nowrap">{getBusinessName()}</div>

            <div className="mt-2">{getBusinessIcon()}</div>

            {/* Input Buffer Visualization - Left side */}
            {business.type !== BusinessType.RESOURCE_GATHERING && business.type !== BusinessType.MARKET && (
              <div className="absolute left-0 top-0 w-1 h-full flex flex-col-reverse">
                <div
                  className={`w-full ${getBufferStatusColor(
                    business.incomingStorage?.current,
                    business.incomingStorage?.capacity,
                  )}`}
                  style={{ height: incomingStorageHeight }}
                ></div>
              </div>
            )}

            {/* Output Buffer Visualization - Right side */}
            {business.type !== BusinessType.MARKET && (
              <div className="absolute right-0 top-0 w-1 h-full flex flex-col-reverse">
                <div
                  className={`w-full ${getBufferStatusColor(
                    business.outgoingStorage?.current,
                    business.outgoingStorage?.capacity,
                  )}`}
                  style={{ height: outgoingStorageHeight }}
                ></div>
              </div>
            )}

            {/* shipping */}
            <div className="absolute -bottom-3 -left-5 flex space-x-2 text-xs">
              {business.type !== BusinessType.MARKET && business.shippingTypes?.length > 0 && (
                <div className="relative w-8 h-8">
                  {business.shippingTypes.map((shippingType, index) => {
                    const botCount = Array.isArray(shippingType.bots) ? shippingType.bots.length : 0;
                    const faded = botCount === 0 ? 'opacity-40' : '';
                    return (
                      <div
                        key={shippingType.type}
                        className={`absolute ${faded}`}
                        style={{
                          transform: `translateX(${index * 4}px)`,
                          zIndex: index
                        }}
                      >
                        {shippingType.type === 'TRUCK' && (
                          <TruckIcon className="w-6 h-6 text-gray-700 bg-white rounded-full p-1 border border-gray-400" />
                        )}
                        {shippingType.type === 'BOAT' && (
                          <ShipIcon className="w-6 h-6 text-gray-700 bg-white rounded-full p-1 border border-gray-400" />
                        )}
                        {shippingType.type === 'PLANE' && (
                          <PlaneIcon className="w-6 h-6 text-gray-700 bg-white rounded-full p-1 border border-gray-400" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Production progress bar and resource indicators at the top (always visible) */}
            {business.type !== BusinessType.MARKET && (
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2" style={{ width: '144px' }}>
                <div className="flex items-center justify-between w-full space-x-2">
                  {/* Input Resource Indicator*/}
                  <div className={`p-1 w-6 h-6 rounded-full border-2 border-yellow-400 flex items-center justify-center relative ${getResourceColor(business.inputResource)} ${business.type === BusinessType.RESOURCE_GATHERING ? 'opacity-30' : ''}`}>
                    {getResourceIcon(business.inputResource)}
                    {/* ! badge if input is less than 50% */}
                    {business.type !== BusinessType.RESOURCE_GATHERING &&
                      business.incomingStorage.current < 0.5 * business.incomingStorage.capacity && (
                        <div className="absolute -top-2 -right-2 z-10">
                          {business.incomingStorage.current === 0 ? (
                            <AlertTriangle className="w-4 h-4 text-white animate-pulse bg-red-500 rounded-full p-0.5" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-white animate-pulse bg-yellow-500 rounded-full p-0.5" />
                          )}
                        </div>
                      )}
                  </div>
                  {/* Progress bar */}
                  <div className="flex-1 mx-1 h-1.5 bg-gray-300 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${business.productionProgress * 100}%` }}></div>
                  </div>
                  {/* Output Resource Indicator - always visible */}
                  <div className={`p-1 w-6 h-6 rounded-full border-2 border-blue-400 flex items-center justify-center ${getResourceColor(business.outputResource)} ${business.outgoingStorage.current === 0 ? 'opacity-50' : ''}`}>
                    {getResourceIcon(business.outputResource)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </TooltipTrigger>
        {business.type !== BusinessType.RESOURCE_GATHERING && business.type !== BusinessType.MARKET &&
          business.incomingStorage.current < 0.5 * business.incomingStorage.capacity && (
            <TooltipContent
              side="top"
              sideOffset={40}
              className="bg-white border-2 border-gray-300 shadow-lg px-3 py-2 text-sm font-medium rounded-md"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getResourceColor(business.inputResource)}`} />
                  <span className={`${business.incomingStorage.current === 0 ? "text-red-600" : "text-yellow-600"} font-semibold`}>
                    {business.incomingStorage.current === 0
                      ? `No ${getResourceName(business.inputResource)} available!`
                      : `Looking for ${getResourceName(business.inputResource)}!`}
                  </span>
                </div>
              </div>
            </TooltipContent>
          )}
      </Tooltip>
    </TooltipProvider>
  )
}

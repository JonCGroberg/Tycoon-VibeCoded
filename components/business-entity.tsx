"use client"

import { type Business, BusinessType, ResourceType } from "@/lib/game-types"
import { Trees, Columns4, StoreIcon, TruckIcon, CoinsIcon, GemIcon, WrenchIcon, PackageIcon, BoxIcon, AlertTriangle, ShipIcon, PlaneIcon, BikeIcon, TrainIcon, UserIcon } from "lucide-react"
import { Alert } from "./ui/alert"
import { getResourceName } from "./business-panel"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useState, useEffect, useRef } from "react"
import React from "react"

interface BusinessEntityProps {
  business: Business
  onClick: () => void
  onMove?: (businessId: string, newPosition: { x: number; y: number }) => void
}

const BusinessEntity = function BusinessEntity({ business, onClick, onMove }: BusinessEntityProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const dragTimeout = useRef<NodeJS.Timeout | null>(null)
  const pendingDrag = useRef(false)

  // Track mouse move and up events globally
  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const gameWorld = document.querySelector('[data-testid="game-world"]') as HTMLElement | null;
      if (!gameWorld) return;
      const rect = gameWorld.getBoundingClientRect();
      const newX = e.clientX - rect.left - dragOffset.x;
      const newY = e.clientY - rect.top - dragOffset.y;
      if (onMove) {
        onMove(business.id, { x: newX, y: newY });
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onMove, business.id]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!onMove) return;
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    setDragOffset({ x: offsetX, y: offsetY });
    pendingDrag.current = true;
    dragTimeout.current = setTimeout(() => {
      if (pendingDrag.current) {
        setIsDragging(true);
      }
    }, 10);
    window.addEventListener('mouseup', cancelPendingDrag);
    window.addEventListener('mousemove', cancelPendingDragOnMove);
  };

  const cancelPendingDrag = () => {
    pendingDrag.current = false;
    if (dragTimeout.current) clearTimeout(dragTimeout.current);
    window.removeEventListener('mouseup', cancelPendingDrag);
    window.removeEventListener('mousemove', cancelPendingDragOnMove);
  };

  const cancelPendingDragOnMove = () => {
    pendingDrag.current = false;
    if (dragTimeout.current) clearTimeout(dragTimeout.current);
    window.removeEventListener('mouseup', cancelPendingDrag);
    window.removeEventListener('mousemove', cancelPendingDragOnMove);
  };

  // Get the appropriate icon based on business type
  const getBusinessIcon = () => {
    switch (business.type) {
      case BusinessType.RESOURCE_GATHERING:
        return <Trees className="w-6 h-6 text-green-800" />
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
        return <Trees className="w-3.5 h-3.5 text-white" />
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
            className={`absolute w-24 h-24 ${getBusinessColor()} rounded-md border-2 flex flex-col items-center justify-start cursor-pointer transition-transform hover:scale-105 ${isDragging ? 'opacity-50 ring-2 ring-blue-400' : ''}`}
            style={{
              left: business.position.x - 48,
              top: business.position.y - 48,
            }}
            onClick={onClick}
            onMouseDown={handleMouseDown}
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
            {business.outputResource && (
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
                  <div className={`p-1 w-6 h-6 rounded-full border-2 border-blue-400 flex items-center justify-center relative ${getResourceColor(business.outputResource)} ${business.outgoingStorage.current === 0 ? 'opacity-50' : ''}`}>
                    {getResourceIcon(business.outputResource)}
                    {/* ! badge if output is nearly full */}
                    {business.outgoingStorage.current >= 0.85 * business.outgoingStorage.capacity && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <AlertTriangle className="w-4 h-4 text-white animate-pulse bg-red-500 rounded-full p-0.5" />
                      </div>
                    )}
                    {business.outgoingStorage.current >= 0.65 * business.outgoingStorage.capacity && business.outgoingStorage.current < 0.85 * business.outgoingStorage.capacity && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <AlertTriangle className="w-4 h-4 text-white animate-pulse bg-yellow-500 rounded-full p-0.5" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8} className="p-3 rounded-lg bg-white/95 shadow-lg flex flex-col items-start z-50">
          {business.type === BusinessType.MARKET ? (
            <p className="text-xs text-gray-500">Click to manage, hold to move</p>
          ) : (
            <>
              {/* Needs/Warning message (if any) */}
              {business.type !== BusinessType.RESOURCE_GATHERING && business.inputResource && (
                <>
                  {business.incomingStorage.current === 0 && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-block w-3.5 h-3.5 rounded-full ${getResourceColor(business.inputResource)}`}></span>
                      <span className="font-normal text-sm text-red-700">Needs {getResourceName(business.inputResource)}!</span>
                    </div>
                  )}
                  {business.incomingStorage.current > 0 &&
                    business.incomingStorage.current < 0.5 * business.incomingStorage.capacity && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-block w-3.5 h-3.5 rounded-full ${getResourceColor(business.inputResource)}`}></span>
                        <span className="font-normal text-sm text-yellow-700">Looking for {getResourceName(business.inputResource)}!</span>
                      </div>
                    )}
                </>
              )}
              {/* Output full/warning message */}
              {business.outputResource && (
                <>
                  {business.outgoingStorage.current >= 0.85 * business.outgoingStorage.capacity && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-block w-3.5 h-3.5 rounded-full ${getResourceColor(business.outputResource)}`}></span>
                      <span className="font-normal text-sm text-red-700">Output full!</span>
                    </div>
                  )}
                  {business.outgoingStorage.current >= 0.65 * business.outgoingStorage.capacity && business.outgoingStorage.current < 0.85 * business.outgoingStorage.capacity && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-block w-3.5 h-3.5 rounded-full ${getResourceColor(business.outputResource)}`}></span>
                      <span className="font-normal text-sm text-yellow-700">Output getting full!</span>
                    </div>
                  )}
                </>
              )}
              <p className="text-xs text-gray-500">Click to manage, hold to move</p>
            </>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default React.memo(BusinessEntity)

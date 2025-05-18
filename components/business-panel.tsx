"use client"

import { useState } from "react"
import { type Business, BusinessType, ResourceType } from "@/lib/game-types"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  UserIcon,
  TruckIcon,
  ArrowUpIcon,
  XIcon,
  PackageIcon,
  TimerIcon,
  BoxIcon,
  InfoIcon,
  MoveUpIcon as UpgradeIcon,
} from "lucide-react"

interface BusinessPanelProps {
  business: Business
  onClose: () => void
  onHireDeliveryBot: (businessId: string) => void
  onUpgrade: (businessId: string, upgradeType: "incomingCapacity" | "processingTime" | "outgoingCapacity") => void
}

export function getWorkerCost(business: Business): number {
  const base = 50
  const n = business.workers.length
  return Math.floor(base * Math.pow(1.1, n))
}

export function getBotCost(business: Business): number {
  const base = 100
  const n = business.deliveryBots.length
  return Math.floor(base * Math.pow(1.2, n))
}

export function getUpgradeCost(business: Business): number {
  const base = 50
  return Math.floor(base * Math.pow(2, business.level - 1))
}

export default function BusinessPanel({
  business,
  onClose,
  onHireDeliveryBot,
  onUpgrade,
}: BusinessPanelProps) {
  const [activeTab, setActiveTab] = useState("info")

  // Get business name based on type and resources
  const getBusinessName = () => {
    switch (business.type) {
      case BusinessType.RESOURCE_GATHERING:
        return business.outputResource === ResourceType.WOOD
          ? "Woodcutter"
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

  // Get resource name
  const getResourceName = (resourceType: ResourceType) => {
    switch (resourceType) {
      case ResourceType.WOOD:
        return "Wood"
      case ResourceType.STONE:
        return "Stone"
      case ResourceType.IRON_ORE:
        return "Iron Ore"
      case ResourceType.PLANKS:
        return "Planks"
      case ResourceType.BRICKS:
        return "Bricks"
      case ResourceType.IRON_INGOT:
        return "Iron Ingot"
      case ResourceType.FURNITURE:
        return "Furniture"
      case ResourceType.TOOLS:
        return "Tools"
      default:
        return "None"
    }
  }

  // Get buffer status color (for bottleneck visualization)
  const getBufferStatusColor = (current: number | null | undefined, capacity: number | null | undefined) => {
    const currentValue = current ?? 0
    const capacityValue = capacity ?? 1
    const fillPercentage = (currentValue / capacityValue) * 100
    if (fillPercentage >= 90) return "text-red-500" // Bottleneck - nearly full
    if (fillPercentage >= 70) return "text-yellow-500" // Warning - getting full
    if (fillPercentage <= 10 && fillPercentage > 0) return "text-blue-500" // Low - needs more
    return "text-green-500" // Normal operation
  }

  return (
    <div className="absolute bottom-4 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-300 z-20">
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div>
          <h3 className="font-bold text-lg">{getBusinessName()}</h3>
          <div className="text-sm text-gray-600">Level {business.level}</div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <XIcon className="w-4 h-4" />
        </Button>
      </div>

      <Tabs defaultValue="info" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mx-4 mt-2">
          <TabsTrigger value="info" className="flex items-center">
            <InfoIcon className="w-4 h-4 mr-1" />
            Info
          </TabsTrigger>
          <TabsTrigger value="upgrades" className="flex items-center">
            <UpgradeIcon className="w-4 h-4 mr-1" />
            Upgrades
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="p-4 pt-2">
          {/* Buffers */}
          <div className="mb-4">
            <div className="flex items-center mb-1">
              <PackageIcon className="w-4 h-4 mr-1 text-blue-600" />
              <span className="text-sm font-medium">Incoming Buffer</span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">
                {business.type === BusinessType.RESOURCE_GATHERING ? "None" : getResourceName(business.inputResource)}
              </span>
              <span
                className={`text-xs font-medium ${getBufferStatusColor(
                  business.incomingBuffer?.current ?? 0,
                  business.incomingBuffer?.capacity ?? 1,
                )}`}
              >
                {(business.incomingBuffer?.current ?? 0).toFixed(1)} / {business.incomingBuffer?.capacity ?? 0}
              </span>
            </div>
            <Progress
              value={((business.incomingBuffer?.current ?? 0) / (business.incomingBuffer?.capacity ?? 1)) * 100}
              className="h-2"
            />
          </div>

          {/* Processing */}
          <div className="mb-4">
            <div className="flex items-center mb-1">
              <TimerIcon className="w-4 h-4 mr-1 text-amber-600" />
              <span className="text-sm font-medium">Processing</span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Time: {(business.processingTime ?? 0).toFixed(1)}s</span>
              <span className="text-xs font-medium">{(business.productionProgress * 100).toFixed(0)}%</span>
            </div>
            <Progress value={(business.productionProgress ?? 0) * 100} className="h-2" />
          </div>

          {/* Outgoing Buffer */}
          <div className="mb-4">
            <div className="flex items-center mb-1">
              <BoxIcon className="w-4 h-4 mr-1 text-green-600" />
              <span className="text-sm font-medium">Outgoing Buffer</span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">{getResourceName(business.outputResource)}</span>
              <span
                className={`text-xs font-medium ${getBufferStatusColor(
                  business.outgoingBuffer?.current ?? 0,
                  business.outgoingBuffer?.capacity ?? 1,
                )}`}
              >
                {(business.outgoingBuffer?.current ?? 0).toFixed(1)} / {business.outgoingBuffer?.capacity ?? 0}
              </span>
            </div>
            <Progress
              value={((business.outgoingBuffer?.current ?? 0) / (business.outgoingBuffer?.capacity ?? 1)) * 100}
              className="h-2"
            />
          </div>

          {/* Workers & Delivery Drivers */}
          <div className="grid grid-cols-2 gap-4 mt-4 mb-2">
            {/*
            <div>
              <div className="flex items-center mb-2">
                <UserIcon className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">Workers: {business.workers.length}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-1"
                onClick={() => onHireWorker(business.id)}
                disabled={business.type !== BusinessType.RESOURCE_GATHERING}
              >
                Hire Worker ({getWorkerCost(business)})
              </Button>
            </div>
            */}
            <div>
              <div className="flex items-center mb-2">
                <TruckIcon className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">Drivers: {business.deliveryBots.length}</span>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-1" onClick={() => onHireDeliveryBot(business.id)}>
                Hire Driver ({getBotCost(business)})
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="upgrades" className="p-4 pt-2">
          <div>
            <div className="flex items-center mb-3">
              <ArrowUpIcon className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">Available Upgrades</span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Input Capacity</span>
                  <span className="text-xs text-gray-600">
                    Current: {(business.incomingBuffer?.capacity ?? 0).toFixed(0)} units
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onUpgrade(business.id, "incomingCapacity")}
                >
                  Upgrade ({getUpgradeCost(business)} coins)
                </Button>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Processing Speed</span>
                  <span className="text-xs text-gray-600">Current: {(business.processingTime ?? 0).toFixed(1)}s</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onUpgrade(business.id, "processingTime")}
                >
                  Upgrade ({getUpgradeCost(business)} coins)
                </Button>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Output Capacity</span>
                  <span className="text-xs text-gray-600">
                    Current: {(business.outgoingBuffer?.capacity ?? 0).toFixed(0)} units
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onUpgrade(business.id, "outgoingCapacity")}
                >
                  Upgrade ({getUpgradeCost(business)} coins)
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

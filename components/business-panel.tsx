"use client"

import { useState } from "react"
import { type Business, BusinessType, ResourceType } from "@/lib/game-types"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/utils"
import {
  XIcon,
  PackageIcon,
  TimerIcon,
  BoxIcon,
  InfoIcon,
  MoveUpIcon as UpgradeIcon,
  PlusIcon,
  MinusIcon,
  TruckIcon,
} from "lucide-react"
import { SHIPPING_TYPES, calculateShippingCost } from "@/lib/shipping-types"
import { getUpgradeCost } from "@/lib/game-logic"

interface BusinessPanelProps {
  business: Business
  coins: number
  onClose: () => void
  onHireShippingType: (businessId: string, shippingTypeId: string) => void
  onSellShippingType?: (businessId: string, shippingTypeId: string) => void
  onUpgrade: (businessId: string, upgradeType: "incomingCapacity" | "processingTime" | "outgoingCapacity") => void
  defaultTab?: string
}

export function getWorkerCost(business: Business): number {
  const base = 50
  const n = business.workers.length
  return Math.floor(base * Math.pow(1.1, n))
}

export function getBusinessName(business: Business): string {
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
    default:
      return "Unknown Business"
  }
}

export function getResourceName(resourceType: ResourceType): string {
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
export function getBufferStatusColor(current: number | null | undefined, capacity: number | null | undefined): string {
  const currentValue = current ?? 0
  const capacityValue = capacity ?? 1
  const fillPercentage = (currentValue / capacityValue) * 100
  if (fillPercentage >= 90) return "text-red-500" // Bottleneck - nearly full
  if (fillPercentage >= 70) return "text-yellow-500" // Warning - getting full
  if (fillPercentage <= 10 && fillPercentage > 0) return "text-blue-500" // Low - needs more
  return "text-green-500" // Normal operation
}

export default function BusinessPanel({
  business,
  coins,
  onClose,
  onHireShippingType,
  onSellShippingType,
  onUpgrade,
  defaultTab = "info",
}: BusinessPanelProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  // Real shipping types from business
  const shippingTypes = business.shippingTypes;

  return (
    <div className="absolute bottom-4 right-4 w-[28rem] h-[22rem] bg-white rounded-lg shadow-lg border border-gray-300 z-20">
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div>
          <h3 className="font-bold text-lg">{getBusinessName(business)}</h3>
          <div className="flex items-center text-sm text-gray-600 mt-0.5">
            <span>Level {business.level}</span>
            <span className="mx-2">·</span>
            <span className="font-bold text-gray-400">{formatCurrency(business.totalInvested)}</span>
            <span className="font-medium text-gray-400 ml-1"> Invested</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <XIcon className="w-4 h-4" />
        </Button>
      </div>

      <Tabs defaultValue={defaultTab} value={activeTab} className="w-full " onValueChange={setActiveTab}>
        <TabsList className={`grid ${business.type !== BusinessType.MARKET ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <TabsTrigger value="info" className="flex items-center">
            <InfoIcon className="w-4 h-4 mr-1" />
            Info
          </TabsTrigger>
          {business.type !== BusinessType.MARKET && (
            <TabsTrigger value="shipping" className="flex items-center">
              <TruckIcon className="w-4 h-4 mr-1" />
              Shipping
            </TabsTrigger>
          )}
        </TabsList>

        <div className="overflow-y-auto h-[14rem]">
          <TabsContent value="info" className="p-4 pt-2">
            {/* Incoming Buffer with Upgrade */}
            {business.type !== BusinessType.RESOURCE_GATHERING && (
              <div className="mb-4">
                <div className="flex items-center mb-1 justify-between">
                  <div className="flex items-center">
                    <PackageIcon className="w-4 h-4 mr-1 text-blue-600" />
                    <span className="text-sm font-medium">Incoming Storage</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid="upgrade-incoming"
                    className="ml-2 px-2 py-0.5 h-6 text-xs flex items-center gap-1"
                    onClick={() => onUpgrade(business.id, "incomingCapacity")}
                  >
                    <UpgradeIcon className="w-3 h-3" />
                    Upgrade {formatCurrency(getUpgradeCost(business, "incomingCapacity"))}
                  </Button>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">
                    {getResourceName(business.inputResource)}
                  </span>
                  <span
                    className={`text-xs font-medium ${getBufferStatusColor(
                      business.incomingStorage?.current ?? 0,
                      business.incomingStorage?.capacity ?? 1,
                    )}`}
                  >
                    {(business.incomingStorage?.current ?? 0).toFixed(1)} / {business.incomingStorage?.capacity ?? 0}
                  </span>
                </div>
                <Progress
                  value={((business.incomingStorage?.current ?? 0) / (business.incomingStorage?.capacity ?? 1)) * 100}
                  className="h-2"
                />
              </div>
            )}

            {/* Processing with Upgrade */}
            <div className="mb-4">
              <div className="flex items-center mb-1 justify-between">
                <div className="flex items-center">
                  <TimerIcon className="w-4 h-4 mr-1 text-amber-600" />
                  <span className="text-sm font-medium">Processing Speed</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="upgrade-processing"
                  className="ml-2 px-2 py-0.5 h-6 text-xs flex items-center gap-1"
                  onClick={() => onUpgrade(business.id, "processingTime")}
                >
                  <UpgradeIcon className="w-3 h-3" />
                  Upgrade {formatCurrency(getUpgradeCost(business, "processingTime"))}
                </Button>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Speed: {((60 / (business.processingTime ?? 1)) * (business.batchSize ?? 10)).toFixed(2)} units/min (batch size: {business.batchSize ?? 10})</span>
                <span className="text-xs font-medium">{(business.productionProgress * 100).toFixed(0)}%</span>
              </div>
              <Progress value={(business.productionProgress ?? 0) * 100} className="h-2" />
            </div>

            {/* Outgoing Buffer with Upgrade */}
            <div className="mb-4">
              <div className="flex items-center mb-1 justify-between">
                <div className="flex items-center">
                  <BoxIcon className="w-4 h-4 mr-1 text-green-600" />
                  <span className="text-sm font-medium">Outgoing Storage</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="upgrade-outgoing"
                  className="ml-2 px-2 py-0.5 h-6 text-xs flex items-center gap-1"
                  onClick={() => onUpgrade(business.id, "outgoingCapacity")}
                >
                  <UpgradeIcon className="w-3 h-3" />
                  Upgrade {formatCurrency(getUpgradeCost(business, "outgoingCapacity"))}
                </Button>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">{getResourceName(business.outputResource)}</span>
                <span
                  className={`text-xs font-medium ${getBufferStatusColor(
                    business.outgoingStorage?.current ?? 0,
                    business.outgoingStorage?.capacity ?? 1,
                  )}`}
                >
                  {(business.outgoingStorage?.current ?? 0).toFixed(1)} / {business.outgoingStorage?.capacity ?? 0}
                </span>
              </div>
              <Progress
                value={((business.outgoingStorage?.current ?? 0) / (business.outgoingStorage?.capacity ?? 1)) * 100}
                className="h-2"
              />
            </div>
          </TabsContent>

          {business.type !== BusinessType.MARKET && (
            <TabsContent value="shipping" className="p-4 pt-2">
              {/* Shipping Types List */}
              <ul className="divide-y divide-gray-200">
                {[...SHIPPING_TYPES].sort((a, b) => a.baseCost - b.baseCost).map(typeConfig => {
                  const shippingType = shippingTypes.find(st => st.type === typeConfig.id) || { type: typeConfig.id, bots: [] };
                  const bots = Array.isArray(shippingType.bots) ? shippingType.bots : [];
                  const total = bots.length;
                  const inUse = bots.filter(bot => bot.isDelivering).length;
                  const cost = calculateShippingCost(typeConfig.id, total);
                  const canAfford = coins >= cost;
                  const canSell = bots.length > 0;
                  const rowDisabled = !canAfford && !canSell;
                  const Icon = typeConfig.icon;

                  return (
                    <li
                      key={typeConfig.id}
                      className={`py-2 px-1 flex gap-4 ${rowDisabled ? 'opacity-50 pointer-events-none select-none' : 'hover:bg-gray-50 cursor-pointer'} transition-colors`}
                    >
                      {/* Left: Icon and labels, fixed width */}
                      <div style={{ width: '40%' }} className="flex flex-col items-start text-left justify-center">
                        <div className="flex items-center w-full">
                          <Icon className="w-5 h-5 mr-2 text-gray-700" />
                          <span className="font-medium text-gray-900 text-xs">{typeConfig.displayName}</span>
                        </div>
                        <span className="text-xs text-gray-500 mt-1">{typeConfig.description}</span>
                      </div>
                      {/* Right: Utilization, button, progress, fills remaining space */}
                      <div className="flex flex-col flex-1 min-w-0 justify-center">
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex w-full mt-1 gap-2 items-start">
                            <span className="text-xs text-gray-500 flex-shrink-0 mt-1">{inUse} / {total} In Use</span>
                            <div className="flex-1" />
                            <div className="flex flex-row flex-wrap-reverse gap-1 justify-end min-w-0">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1 px-2 py-0.5 h-6 text-xs font-medium border-red-400 hover:bg-red-50"
                                disabled={!canSell}
                                onClick={() => onSellShippingType?.(business.id, typeConfig.id)}
                                title={`Sell for ${formatCurrency(cost / 2)} (50% refund)`}
                              >
                                <MinusIcon className="w-3 h-3 text-red-600" />
                                <span className="text-red-600">{formatCurrency(cost / 2)}</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1 px-2 py-0.5 h-6 text-xs font-medium"
                                disabled={!canAfford}
                                onClick={() => onHireShippingType(business.id, typeConfig.id)}
                              >
                                <span>{formatCurrency(cost)}</span>
                                <PlusIcon className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <Progress value={total === 0 ? 0 : (inUse / total) * 100} className="h-2 w-full bg-gray-100 mt-0.5" />
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  )
}

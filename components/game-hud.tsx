"use client"

import { Button } from "@/components/ui/button"
import { BusinessType } from "@/lib/game-types"
import { getBusinessData } from "@/lib/business-data"
import { TreesIcon as TreeIcon, Logs, StoreIcon, CoinsIcon, GemIcon, BoxIcon, PackageIcon, WrenchIcon } from "lucide-react"

interface GameHUDProps {
  coins: number
  onPlaceBusiness: (type: BusinessType) => void
  flashRed?: boolean
  buildingCosts: Record<BusinessType, number>
  businesses?: { outputResource: string }[]
}

export default function GameHUD({ coins, onPlaceBusiness, flashRed, buildingCosts, businesses }: GameHUDProps) {
  // Check if player owns a Plank Mill or Smelter
  const hasPlankMill = businesses?.some(b => b.outputResource === 'PLANKS')
  const hasSmelter = businesses?.some(b => b.outputResource === 'IRON_INGOT')
  const hasLumberYard = businesses?.some(b => b.outputResource === 'WOOD')
  const hasQuarry = businesses?.some(b => b.outputResource === 'STONE')
  const hasMine = businesses?.some(b => b.outputResource === 'IRON_ORE')

  return (
    <div className={`absolute top-4 left-4 z-10 bg-white bg-opacity-90 p-4 rounded-lg shadow-md border border-gray-300 ${flashRed ? 'error-border' : ''}`}>
      <div className="flex items-center mb-4">
        <CoinsIcon className="w-6 h-6 text-yellow-500 mr-2" />
        <span className={`text-xl font-bold transition-colors duration-300 ${flashRed ? 'flash-red shake' : ''}`}>{coins.toFixed(2)}</span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <Button
          variant="outline"
          className="flex items-center justify-start"
          onClick={() => onPlaceBusiness(BusinessType.RESOURCE_GATHERING)}
        >
          <TreeIcon className="w-5 h-5 mr-2 text-green-700" />
          <span>Place {getBusinessData(BusinessType.RESOURCE_GATHERING).name} ({buildingCosts[BusinessType.RESOURCE_GATHERING]})</span>
        </Button>
        <Button
          variant="outline"
          className="flex items-center justify-start"
          onClick={() => onPlaceBusiness(BusinessType.QUARRY)}
        >
          <GemIcon className="w-5 h-5 mr-2 text-gray-700" />
          <span>Place {getBusinessData(BusinessType.QUARRY).name} ({buildingCosts[BusinessType.QUARRY]})</span>
        </Button>
        <Button
          variant="outline"
          className="flex items-center justify-start"
          onClick={() => onPlaceBusiness(BusinessType.MINE)}
        >
          <BoxIcon className="w-5 h-5 mr-2 text-gray-800" />
          <span>Place {getBusinessData(BusinessType.MINE).name} ({buildingCosts[BusinessType.MINE]})</span>
        </Button>
        {hasLumberYard && (
          <Button
            variant="outline"
            className="flex items-center justify-start"
            onClick={() => onPlaceBusiness(BusinessType.PROCESSING)}
          >
            <Logs className="w-5 h-5 mr-2 text-amber-700" />
            <span>Place {getBusinessData(BusinessType.PROCESSING).name} ({buildingCosts[BusinessType.PROCESSING]})</span>
          </Button>
        )}
        {hasQuarry && (
          <Button
            variant="outline"
            className="flex items-center justify-start"
            onClick={() => onPlaceBusiness(BusinessType.BRICK_KILN)}
          >
            <PackageIcon className="w-5 h-5 mr-2 text-red-700" />
            <span>Place {getBusinessData(BusinessType.BRICK_KILN).name} ({buildingCosts[BusinessType.BRICK_KILN]})</span>
          </Button>
        )}
        {hasMine && (
          <Button
            variant="outline"
            className="flex items-center justify-start"
            onClick={() => onPlaceBusiness(BusinessType.SMELTER)}
          >
            <BoxIcon className="w-5 h-5 mr-2 text-gray-500" />
            <span>Place {getBusinessData(BusinessType.SMELTER).name} ({buildingCosts[BusinessType.SMELTER]})</span>
          </Button>
        )}
        {hasPlankMill && (
          <Button
            variant="outline"
            className="flex items-center justify-start"
            onClick={() => onPlaceBusiness(BusinessType.SHOP)}
          >
            <StoreIcon className="w-5 h-5 mr-2 text-blue-700" />
            <span>Place {getBusinessData(BusinessType.SHOP).name} ({buildingCosts[BusinessType.SHOP]})</span>
          </Button>
        )}
        {hasSmelter && (
          <Button
            variant="outline"
            className="flex items-center justify-start"
            onClick={() => onPlaceBusiness(BusinessType.TOOL_SHOP)}
          >
            <WrenchIcon className="w-5 h-5 mr-2 text-blue-900" />
            <span>Place {getBusinessData(BusinessType.TOOL_SHOP).name} ({buildingCosts[BusinessType.TOOL_SHOP]})</span>
          </Button>
        )}
      </div>
    </div>
  )
}

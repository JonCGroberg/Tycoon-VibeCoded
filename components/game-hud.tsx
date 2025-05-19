"use client"

import { Button } from "@/components/ui/button"
import { BusinessType } from "@/lib/game-types"
import { TreesIcon as TreeIcon, Columns4, StoreIcon, CoinsIcon, GemIcon, BoxIcon, PackageIcon, WrenchIcon, Building2Icon, Building, BuildingIcon, HelpCircleIcon } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface GameHUDProps {
  coins: number
  equity: number
  onPlaceBusiness: (type: BusinessType) => void
  flashRed?: boolean
  buildingCosts: Record<BusinessType, number>
  businesses?: { outputResource: string }[]
  onOpenTutorial: () => void
}

export default function GameHUD({ coins, equity, onPlaceBusiness, flashRed, buildingCosts, businesses, onOpenTutorial }: GameHUDProps) {
  // Check if player owns a Plank Mill or Smelter
  const hasPlankMill = businesses?.some(b => b.outputResource === 'PLANKS')
  const hasSmelter = businesses?.some(b => b.outputResource === 'IRON_INGOT')
  const hasLumberYard = businesses?.some(b => b.outputResource === 'WOOD')
  const hasQuarry = businesses?.some(b => b.outputResource === 'STONE')
  const hasMine = businesses?.some(b => b.outputResource === 'IRON_ORE')

  return (
    <div className={`absolute top-4 left-4 z-10 bg-white bg-opacity-90 p-4 rounded-lg shadow-md border border-gray-300 ${flashRed ? 'error-border' : ''}`}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <CoinsIcon className="w-6 h-6 text-yellow-500 mr-2" />
            <span className={`text-xl font-bold transition-colors duration-300 ${flashRed ? 'flash-red shake' : ''}`}>{formatCurrency(coins)}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenTutorial}
            className="text-gray-500 hover:text-gray-700"
            title="Open Tutorial"
          >
            <HelpCircleIcon className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex items-center mt-4">
          <span className="text-xs font-bold text-gray-400">{formatCurrency(equity)} <span className="text-xs text-gray-300">Invested</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <Button
          variant="outline"
          className="flex items-center justify-start"
          onClick={() => onPlaceBusiness(BusinessType.RESOURCE_GATHERING)}
        >
          <TreeIcon className="w-5 h-5 mr-2 text-green-700" />
          <span>Place Wood Camp ({formatCurrency(buildingCosts[BusinessType.RESOURCE_GATHERING])})</span>
        </Button>
        {/* <Button
          variant="outline"
          className="flex items-center justify-start"
          onClick={() => onPlaceBusiness(BusinessType.QUARRY)}
        >
          <GemIcon className="w-5 h-5 mr-2 text-gray-700" />
          <span>Place Quarry ({formatCurrency(buildingCosts[BusinessType.QUARRY])})</span>
        </Button>
        <Button
          variant="outline"
          className="flex items-center justify-start"
          onClick={() => onPlaceBusiness(BusinessType.MINE)}
        >
          <BoxIcon className="w-5 h-5 mr-2 text-gray-800" />
          <span>Place Mine ({formatCurrency(buildingCosts[BusinessType.MINE])})</span>
        </Button> */}
        {hasLumberYard && (
          <Button
            variant="outline"
            className="flex items-center justify-start"
            onClick={() => onPlaceBusiness(BusinessType.PROCESSING)}
          >
            <Columns4 className="w-5 h-5 mr-2 text-amber-700" />
            <span>Place Plank Mill ({formatCurrency(buildingCosts[BusinessType.PROCESSING])})</span>
          </Button>
        )}
        {hasQuarry && (
          <Button
            variant="outline"
            className="flex items-center justify-start"
            onClick={() => onPlaceBusiness(BusinessType.BRICK_KILN)}
          >
            <PackageIcon className="w-5 h-5 mr-2 text-red-700" />
            <span>Place Brick Kiln ({formatCurrency(buildingCosts[BusinessType.BRICK_KILN])})</span>
          </Button>
        )}
        {hasMine && (
          <Button
            variant="outline"
            className="flex items-center justify-start"
            onClick={() => onPlaceBusiness(BusinessType.SMELTER)}
          >
            <BoxIcon className="w-5 h-5 mr-2 text-gray-500" />
            <span>Place Smelter ({formatCurrency(buildingCosts[BusinessType.SMELTER])})</span>
          </Button>
        )}
        {hasPlankMill && (
          <Button
            variant="outline"
            className="flex items-center justify-start"
            onClick={() => onPlaceBusiness(BusinessType.SHOP)}
          >
            <StoreIcon className="w-5 h-5 mr-2 text-blue-700" />
            <span>Place Furniture Shop ({formatCurrency(buildingCosts[BusinessType.SHOP])})</span>
          </Button>
        )}
        {hasSmelter && (
          <Button
            variant="outline"
            className="flex items-center justify-start"
            onClick={() => onPlaceBusiness(BusinessType.TOOL_SHOP)}
          >
            <WrenchIcon className="w-5 h-5 mr-2 text-blue-900" />
            <span>Place Tool Shop ({formatCurrency(buildingCosts[BusinessType.TOOL_SHOP])})</span>
          </Button>
        )}
      </div>
    </div>
  )
}

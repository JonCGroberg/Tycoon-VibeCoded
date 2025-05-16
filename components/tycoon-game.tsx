"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import GameWorld from "./game-world"
import GameHUD from "./game-hud"
import BusinessPanel from "./business-panel"
import TutorialOverlay from "./tutorial-overlay"
import {
  type GameState,
  type Business,
  ResourceType,
  BusinessType,
  type DeliveryBot,
  type Worker,
  type ActiveDelivery,
} from "@/lib/game-types"
import { initializeGameState, generateUniqueId } from "@/lib/game-logic"

export default function TycoonGame() {
  const [gameState, setGameState] = useState<GameState>(initializeGameState())
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [showTutorial, setShowTutorial] = useState(true)
  const [placingBusiness, setPlacingBusiness] = useState<BusinessType | null>(null)
  const [isPlacing, setIsPlacing] = useState(false)
  const [flashRed, setFlashRed] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const isHiringWorkerRef = useRef(false)
  const isHiringBotRef = useRef(false)
  const [maxBuildings, setMaxBuildings] = useState(1)
  const [maxLevel, setMaxLevel] = useState(1)
  const [maxCoins, setMaxCoins] = useState(gameState.coins)

  // Dynamic market prices state
  const [marketPrices, setMarketPrices] = useState(() => {
    const prices: Record<ResourceType, { value: number; target: number }> = {
      [ResourceType.NONE]: {
        value: 0,
        target: 0
      },
      [ResourceType.WOOD]: {
        value: 0,
        target: 0
      },
      [ResourceType.STONE]: {
        value: 0,
        target: 0
      },
      [ResourceType.IRON_ORE]: {
        value: 0,
        target: 0
      },
      [ResourceType.PLANKS]: {
        value: 0,
        target: 0
      },
      [ResourceType.BRICKS]: {
        value: 0,
        target: 0
      },
      [ResourceType.IRON_INGOT]: {
        value: 0,
        target: 0
      },
      [ResourceType.FURNITURE]: {
        value: 0,
        target: 0
      },
      [ResourceType.TOOLS]: {
        value: 0,
        target: 0
      }
    };
    Object.values(ResourceType).forEach(rt => {
      prices[rt] = { value: 1, target: 1 };
    });
    return prices;
  });

  // Update market prices every 15 seconds, interpolate toward target
  useEffect(() => {
    const baseValues: Record<ResourceType, number> = {
      [ResourceType.WOOD]: 1,
      [ResourceType.STONE]: 1.5,
      [ResourceType.IRON_ORE]: 2,
      [ResourceType.NONE]: 0,
      [ResourceType.PLANKS]: 0,
      [ResourceType.BRICKS]: 0,
      [ResourceType.IRON_INGOT]: 0,
      [ResourceType.FURNITURE]: 0,
      [ResourceType.TOOLS]: 0
    };
    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;
    function pickNewTargets() {
      setMarketPrices(prices => {
        const newPrices = { ...prices };
        Object.keys(prices).forEach(rt => {
          const base = baseValues[rt as ResourceType] || 1;
          newPrices[rt as ResourceType] = {
            ...newPrices[rt as ResourceType],
            target: base * (0.5 + Math.random() * 1.5)
          };
        });
        return newPrices;
      });
    }
    pickNewTargets();
    timeout = setInterval(pickNewTargets, 15000);
    interval = setInterval(() => {
      setMarketPrices(prices => {
        const newPrices = { ...prices };
        Object.keys(prices).forEach(rt => {
          const p = prices[rt as ResourceType];
          // Interpolate toward target
          newPrices[rt as ResourceType] = {
            ...p,
            value: p.value + (p.target - p.value) * 0.05
          };
        });
        return newPrices;
      });
    }, 200);
    return () => {
      clearInterval(interval);
      clearInterval(timeout);
    };
  }, []);

  // Update selected business when gameState changes
  useEffect(() => {
    if (selectedBusinessId) {
      const updatedBusiness = gameState.businesses.find((b) => b.id === selectedBusinessId)
      if (updatedBusiness) {
        setSelectedBusiness(updatedBusiness)
      }
    }
  }, [gameState, selectedBusinessId])

  // Watch for coins < 0 to trigger game over
  useEffect(() => {
    if (gameState.coins < 0 && !gameOver) {
      setGameOver(true)
    }
  }, [gameState.coins, gameOver])

  // Track high watermarks for score
  useEffect(() => {
    setMaxBuildings((prev) => Math.max(prev, gameState.businesses.length))
    setMaxLevel((prev) => {
      const highest = gameState.businesses.reduce((acc, b) => Math.max(acc, b.level), 1)
      return Math.max(prev, highest)
    })
    setMaxCoins((prev) => Math.max(prev, gameState.coins))
  }, [gameState])

  // Handle delivery completion
  const handleDeliveryComplete = (deliveryId: string) => {
    // No-op: delivery completion is now handled in the game tick based on expectedArrival
  }

  // Game tick - update resources, workers, bots every second
  useEffect(() => {
    const gameLoop = setInterval(() => {
      setGameState((prevState) => {
        // Create a deep copy of the state to avoid mutation
        const newState = JSON.parse(JSON.stringify(prevState)) as GameState

        // Process worker gathering
        newState.businesses.forEach((business) => {
          if (business.type === BusinessType.RESOURCE_GATHERING) {
            // Each worker gathers 1 unit every 3 seconds (or 1/3 per second)
            // SLOW DOWN: 1/30 per second (10x slower)
            const gatherRate = business.workers.length * (1 / 30)

            // Check if there's space in the incoming buffer
            if (business.incomingBuffer.current + gatherRate <= business.incomingBuffer.capacity) {
              business.incomingBuffer.current += gatherRate
              // Pay worker wages (0.25 coins per gathered unit)
              newState.coins -= gatherRate * 0.25 * 10 // 10x currency multiplier for wage cost
            }
          }

          // Process production
          if (
            business.incomingBuffer.current >= 1 &&
            business.outgoingBuffer.current < business.outgoingBuffer.capacity
          ) {
            // SLOW DOWN: production progress 10x slower
            business.productionProgress += 0.1 * (1 / business.processingTime)

            if (business.productionProgress >= 1) {
              // Convert 1 unit of input to 1 unit of output
              business.incomingBuffer.current -= 1
              business.outgoingBuffer.current += 1
              business.productionProgress = 0
            }
          }

          // Update profit display time
          if (business.profitDisplayTime !== undefined) {
            business.profitDisplayTime += 100 // 100ms per tick
            if (business.profitDisplayTime > 2000) {
              // 2 seconds
              business.recentProfit = 0
              business.profitDisplayTime = undefined
            }
          }
        })

        // Process delivery bots - only start new deliveries if there are no active ones for this bot
        newState.businesses.forEach((business) => {
          business.deliveryBots.forEach((bot) => {
            // Check if this bot is already in an active delivery
            const isAlreadyDelivering = newState.activeDeliveries.some(
              (delivery) => delivery.sourceBusinessId === business.id && delivery.bot.id === bot.id,
            )

            if (!bot.isDelivering && !isAlreadyDelivering && business.outgoingBuffer.current >= 1) {
              // console.log('Bot ready for delivery:', { botId: bot.id, businessId: business.id })

              // Find best delivery target
              const target = findBestDeliveryTarget(business, newState.businesses)

              if (target) {
                // console.log('Found delivery target:', {
                //   targetId: target.id,
                //   targetType: target.type,
                //   resourceAmount: business.outgoingBuffer.current
                // })

                bot.isDelivering = true
                bot.targetBusinessId = target.id
                bot.carryingAmount = Math.min(bot.capacity, business.outgoingBuffer.current)
                business.outgoingBuffer.current -= bot.carryingAmount

                // Create a new active delivery
                const distance = Math.sqrt(
                  Math.pow(target.position.x - business.position.x, 2) +
                  Math.pow(target.position.y - business.position.y, 2)
                )
                const travelSeconds = (distance / bot.speed) * 10 // 10x slower delivery
                const expectedArrival = Date.now() + travelSeconds * 1000
                const createdAt = Date.now();
                const travelTimeMs = travelSeconds * 1000;
                const newDelivery: ActiveDelivery = {
                  id: generateUniqueId("delivery"),
                  sourceBusinessId: business.id,
                  targetBusinessId: target.id,
                  bot: { ...bot },
                  resourceAmount: bot.carryingAmount,
                  resourceType: business.outputResource,
                  expectedArrival,
                  createdAt,
                  travelTimeMs,
                }
                // console.log('Created new delivery:', newDelivery)

                newState.activeDeliveries.push(newDelivery)
                // console.log('Total active deliveries:', newState.activeDeliveries.length)
              }
            }
          })
        })

        // Process active deliveries: complete those whose expectedArrival has passed
        const now = Date.now()
        // console.log('Checking deliveries:', {
        //   activeDeliveries: newState.activeDeliveries.length,
        //   now: new Date(now).toISOString()
        // })
        for (let i = newState.activeDeliveries.length - 1; i >= 0; i--) {
          const delivery = newState.activeDeliveries[i]
          // console.log('Delivery status:', {
          //   id: delivery.id,
          //   expectedArrival: new Date(delivery.expectedArrival).toISOString(),
          //   timeUntilArrival: (delivery.expectedArrival - now) / 1000,
          //   shouldComplete: delivery.expectedArrival <= now
          // })
          if (delivery.expectedArrival <= now) {
            const sourceBusiness = newState.businesses.find((b) => b.id === delivery.sourceBusinessId)
            const targetBusiness = newState.businesses.find((b) => b.id === delivery.targetBusinessId)
            if (sourceBusiness && targetBusiness) {
              if (targetBusiness.type === BusinessType.MARKET) {
                // Selling to market at 50% value
                const resourceValue = getResourceValue(delivery.resourceType)
                const profit = delivery.resourceAmount * resourceValue * 0.5 * 10 // 10x currency multiplier
                newState.coins += profit

                // Show profit indicator on source business
                sourceBusiness.recentProfit = profit
                sourceBusiness.profitDisplayTime = 0
              } else {
                // Delivering to another business
                if (
                  targetBusiness.incomingBuffer.current + delivery.resourceAmount <=
                  targetBusiness.incomingBuffer.capacity
                ) {
                  targetBusiness.incomingBuffer.current += delivery.resourceAmount

                  // If this is a player-to-player transaction, we'd handle payment here
                  // For the prototype, we'll just add coins based on resource value
                  const resourceValue = getResourceValue(delivery.resourceType)
                  const profit = delivery.resourceAmount * resourceValue * 10 // 10x currency multiplier
                  newState.coins += profit

                  // Show profit indicator on source business
                  sourceBusiness.recentProfit = profit
                  sourceBusiness.profitDisplayTime = 0
                }
              }
            // Reset bot state in the source business
            const botIndex = sourceBusiness.deliveryBots.findIndex((b) => b.id === delivery.bot.id)
            if (botIndex !== -1) {
              sourceBusiness.deliveryBots[botIndex].isDelivering = false
              sourceBusiness.deliveryBots[botIndex].targetBusinessId = null
              sourceBusiness.deliveryBots[botIndex].carryingAmount = 0
            }
          }
          // Remove the delivery from active deliveries
          newState.activeDeliveries.splice(i, 1)
        }
      }

        return newState
      })
    }, 100) // Update more frequently for smoother animations

    return () => clearInterval(gameLoop)
  }, [])

  // Helper function to find the best delivery target
  function findBestDeliveryTarget(sourceBusiness: Business, allBusinesses: Business[]): Business | null {
    // Find all possible targets: businesses that need this resource and the market
    const potentialTargets = allBusinesses.filter(
      (business) =>
        business.id !== sourceBusiness.id &&
        business.inputResource === sourceBusiness.outputResource &&
        business.incomingBuffer.current < business.incomingBuffer.capacity,
    )
    const market = allBusinesses.find((business) => business.type === BusinessType.MARKET)

    // Calculate profit/value for each target
    let bestTarget: Business | null = null
    let bestValue = -Infinity
    // Check businesses
    for (const business of potentialTargets) {
      // Value is the static resource value (could be improved to use downstream market value)
      const value = getResourceValue(sourceBusiness.outputResource)
      if (value > bestValue) {
        bestValue = value
        bestTarget = business
      }
    }
    // Check market
    if (market) {
      const marketValue = marketPrices[sourceBusiness.outputResource]?.value || getResourceValue(sourceBusiness.outputResource)
      if (marketValue > bestValue) {
        bestValue = marketValue
        bestTarget = market
      }
    }
    return bestTarget
  }

  // Helper function to get resource value
  function getResourceValue(resourceType: ResourceType): number {
    // Base values for raw resources
    const baseValues: Record<ResourceType, number> = {
      [ResourceType.WOOD]: 1,
      [ResourceType.STONE]: 1.5,
      [ResourceType.IRON_ORE]: 2,
      [ResourceType.NONE]: 0,
      [ResourceType.PLANKS]: 0,
      [ResourceType.BRICKS]: 0,
      [ResourceType.IRON_INGOT]: 0,
      [ResourceType.FURNITURE]: 0,
      [ResourceType.TOOLS]: 0
    }

    // Determine tier and calculate value
    switch (resourceType) {
      // Tier 1: Raw resources
      case ResourceType.WOOD:
      case ResourceType.STONE:
      case ResourceType.IRON_ORE:
        return baseValues[resourceType]

      // Tier 2: Processed resources (2x value of raw)
      case ResourceType.PLANKS:
        return baseValues[ResourceType.WOOD] * 2
      case ResourceType.BRICKS:
        return baseValues[ResourceType.STONE] * 2
      case ResourceType.IRON_INGOT:
        return baseValues[ResourceType.IRON_ORE] * 2

      // Tier 3: Finished goods (4x value of raw)
      case ResourceType.FURNITURE:
        return baseValues[ResourceType.WOOD] * 4
      case ResourceType.TOOLS:
        return baseValues[ResourceType.IRON_ORE] * 4

      default:
        return 0
    }
  }

  // New cost formulas
  function getBuildingCost(businessType: BusinessType): number {
    const baseCosts: Record<BusinessType, number> = {
      [BusinessType.RESOURCE_GATHERING]: 100,
      [BusinessType.QUARRY]: 120,
      [BusinessType.MINE]: 150,
      [BusinessType.PROCESSING]: 250,
      [BusinessType.BRICK_KILN]: 300,
      [BusinessType.SMELTER]: 350,
      [BusinessType.SHOP]: 500,
      [BusinessType.TOOL_SHOP]: 600,
      [BusinessType.MARKET]: 0,
    }
    const count = gameState.businesses.filter(b => b.type === businessType).length
    return Math.floor(baseCosts[businessType] * Math.pow(1.3, count))
  }

  function getWorkerCost(business: Business): number {
    const base = 50
    const n = business.workers.length
    return Math.floor(base * Math.pow(1.1, n))
  }

  function getBotCost(business: Business): number {
    const base = 100
    const n = business.deliveryBots.length
    return Math.floor(base * Math.pow(1.2, n))
  }

  function getUpgradeCost(business: Business, upgradeType?: "incomingCapacity" | "processingTime" | "outgoingCapacity"): number {
    const base = 50
    // Track upgrades per type on the business object
    if (!business.upgrades) {
      business.upgrades = {
        incomingCapacity: 0,
        processingTime: 0,
        outgoingCapacity: 0
      }
    }
    // If no upgradeType is provided, fallback to old logic
    if (!upgradeType) {
      return Math.floor(base * Math.pow(2, business.level - 1))
    }
    // Cost is 2x for the current upgrade type, 1.5x for each other type not yet upgraded
    let cost = base
    cost *= Math.pow(2, business.upgrades[upgradeType])
    const otherTypes: Array<"incomingCapacity" | "processingTime" | "outgoingCapacity"> = ["incomingCapacity", "processingTime", "outgoingCapacity"].filter(t => t !== upgradeType) as any
    otherTypes.forEach(type => {
      if (business.upgrades && business.upgrades[type] === 0) {
        cost *= 1.5
      }
    })
    return Math.floor(cost)
  }

  // Place a new business on the game world
  const handlePlaceBusiness = (businessType: BusinessType, position: { x: number; y: number }) => {
    if (isPlacing) return // Prevent multiple placements
    setIsPlacing(true)

    console.log('Attempting to place business:', { businessType, position })

    const businessCost = getBuildingCost(businessType)
    console.log('Business cost:', businessCost, 'Current coins:', gameState.coins)

    if (gameState.coins < businessCost) {
      console.log('Not enough coins to place business')
      setFlashRed(true)
      playErrorBeep()
      setTimeout(() => setFlashRed(false), 500)
      setIsPlacing(false)
      return
    }

    const newBusiness: Business = {
      id: generateUniqueId("business"),
      type: businessType,
      position,
      level: 1,
      incomingBuffer: { current: 0, capacity: 10 },
      outgoingBuffer: { current: 0, capacity: 10 },
      workers: businessType === BusinessType.RESOURCE_GATHERING ||
        businessType === BusinessType.QUARRY ||
        businessType === BusinessType.MINE ?
        [{ id: generateUniqueId("worker"), gatherRate: 1 / 3 }] : [],
      deliveryBots: [],
      processingTime: 10,
      productionProgress: 0,
      inputResource: getInputResourceForBusinessType(businessType),
      outputResource: getOutputResourceForBusinessType(businessType)
    }

    console.log('Created new business:', newBusiness)

    setGameState(prev => {
      const newBusinesses = [...prev.businesses, newBusiness]
      console.log('Total businesses after placement:', newBusinesses.length)
      const newCoins = prev.coins - businessCost
      console.log('Remaining coins:', newCoins)
      playSuccessChime()
      return {
        ...prev,
        businesses: newBusinesses,
        coins: newCoins
      }
    })

    setIsPlacing(false)
    setPlacingBusiness(null)
  }

  // Helper functions to determine input/output resources based on business type
  function getInputResourceForBusinessType(businessType: BusinessType): ResourceType {
    switch (businessType) {
      case BusinessType.RESOURCE_GATHERING:
        return ResourceType.NONE
      case BusinessType.PROCESSING:
        return ResourceType.WOOD // Default for Plank Mill, will override for others
      case BusinessType.SHOP:
        return ResourceType.PLANKS // Default for Furniture Shop, will override for others
      case BusinessType.QUARRY:
        return ResourceType.NONE
      case BusinessType.MINE:
        return ResourceType.NONE
      case BusinessType.BRICK_KILN:
        return ResourceType.STONE
      case BusinessType.SMELTER:
        return ResourceType.IRON_ORE
      case BusinessType.TOOL_SHOP:
        return ResourceType.IRON_INGOT
      default:
        return ResourceType.NONE
    }
  }

  function getOutputResourceForBusinessType(businessType: BusinessType): ResourceType {
    switch (businessType) {
      case BusinessType.RESOURCE_GATHERING:
        return ResourceType.WOOD // Default for Woodcutter, will override for others
      case BusinessType.PROCESSING:
        return ResourceType.PLANKS // Default for Plank Mill, will override for others
      case BusinessType.SHOP:
        return ResourceType.FURNITURE // Default for Furniture Shop, will override for others
      case BusinessType.QUARRY:
        return ResourceType.STONE
      case BusinessType.MINE:
        return ResourceType.IRON_ORE
      case BusinessType.BRICK_KILN:
        return ResourceType.BRICKS
      case BusinessType.SMELTER:
        return ResourceType.IRON_INGOT
      case BusinessType.TOOL_SHOP:
        return ResourceType.TOOLS
      default:
        return ResourceType.NONE
    }
  }

  // Hire a delivery bot for a business
  const handleHireDeliveryBot = (businessId: string) => {
    if (isHiringBotRef.current) return;
    isHiringBotRef.current = true;

    setGameState((prevState) => {
      const newState = { ...prevState }
      const businessIndex = newState.businesses.findIndex((b) => b.id === businessId)

      if (businessIndex === -1) return prevState

      const botCost = getBotCost(newState.businesses[businessIndex])

      if (newState.coins < botCost) return prevState

      const newBot: DeliveryBot = {
        id: generateUniqueId("bot"),
        capacity: 25,
        speed: 200,
        isDelivering: false,
        targetBusinessId: null,
        carryingAmount: 0,
      }

      newState.businesses[businessIndex].deliveryBots.push(newBot)
      newState.coins -= botCost

      // Log the delivery driver count after purchase
      console.log(`Business ${newState.businesses[businessIndex].id} now has ${newState.businesses[businessIndex].deliveryBots.length} delivery drivers.`)

      return newState
    })

    setTimeout(() => { isHiringBotRef.current = false }, 200);
  }

  // Upgrade a business
  const handleUpgradeBusiness = (
    businessId: string,
    upgradeType: "incomingCapacity" | "processingTime" | "outgoingCapacity",
  ) => {
    setGameState((prevState) => {
      const newState = { ...prevState }
      const businessIndex = newState.businesses.findIndex((b) => b.id === businessId)

      if (businessIndex === -1) return prevState

      const business = newState.businesses[businessIndex]
      const upgradeCost = getUpgradeCost(business, upgradeType)

      if (newState.coins < upgradeCost) return prevState

      // Apply upgrade based on type - new logic
      switch (upgradeType) {
        case "incomingCapacity":
          business.incomingBuffer.capacity = business.incomingBuffer.capacity * 2
          break
        case "processingTime":
          business.processingTime = business.processingTime / 2
          break
        case "outgoingCapacity":
          business.outgoingBuffer.capacity = business.outgoingBuffer.capacity * 2
          break
      }
      // Track upgrades per type
      if (!business.upgrades) {
        business.upgrades = {
          incomingCapacity: 0,
          processingTime: 0,
          outgoingCapacity: 0
        }
      }
      business.upgrades[upgradeType] = (business.upgrades[upgradeType] || 0) + 1

      business.level += 1
      newState.coins -= upgradeCost

      return newState
    })
  }

  // Handle selecting a business
  const handleSelectBusiness = (business: Business) => {
    if (business.type === BusinessType.MARKET) {
      setSelectedBusiness(null)
      setSelectedBusinessId(null)
      return;
    }
    setSelectedBusiness(business)
    setSelectedBusinessId(business.id)
  }

  function playErrorBeep() {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 440; // A4
    g.gain.value = 0.2;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.15);
    o.onended = () => ctx.close();
  }

  function playSuccessChime() {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [1046.5, 1318.5, 1568, 2093]; // C6, E6, G6, C7
    notes.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.value = 0.18;
      o.connect(g);
      g.connect(ctx.destination);
      const start = ctx.currentTime + i * 0.08;
      const end = start + 0.18;
      o.start(start);
      o.stop(end);
      g.gain.setValueAtTime(0.18, start);
      g.gain.linearRampToValueAtTime(0, end);
      o.onended = () => ctx.close();
    });
  }

  function handleRestart() {
    setGameState(initializeGameState())
    setSelectedBusiness(null)
    setSelectedBusinessId(null)
    setGameOver(false)
    setMaxBuildings(1)
    setMaxLevel(1)
    setMaxCoins(initializeGameState().coins)
  }

  const score = maxBuildings * maxLevel * maxCoins

  return (
    <div className="w-full h-[90vh] relative overflow-hidden">
      {/* Persistent Restart Button centered at the bottom */}
      <button
        className="absolute left-1/2 bottom-4 transform -translate-x-1/2 px-4 py-2 bg-gray-700 text-white rounded-lg shadow hover:bg-gray-800 z-20"
        onClick={handleRestart}
      >
        Restart
      </button>

      {gameOver && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-70">
          <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
            <h2 className="text-3xl font-bold text-red-600 mb-4">You Lost!</h2>
            <p className="mb-2 text-lg">Score: <span className="font-bold">{score}</span></p>
            <p className="mb-2 text-lg">Max Buildings: <span className="font-bold">{maxBuildings}</span></p>
            <p className="mb-2 text-lg">Max Level: <span className="font-bold">{maxLevel}</span></p>
            <p className="mb-2 text-lg">Max Coins: <span className="font-bold">{maxCoins}</span></p>
            <button
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
              onClick={handleRestart}
            >
              Restart
            </button>
          </div>
        </div>
      )}

      {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} gameState={gameState} />}

      <GameHUD
        coins={gameState.coins}
        onPlaceBusiness={(type) => setPlacingBusiness(type)}
        flashRed={flashRed}
        buildingCosts={{
          [BusinessType.RESOURCE_GATHERING]: getBuildingCost(BusinessType.RESOURCE_GATHERING),
          [BusinessType.QUARRY]: getBuildingCost(BusinessType.QUARRY),
          [BusinessType.MINE]: getBuildingCost(BusinessType.MINE),
          [BusinessType.PROCESSING]: getBuildingCost(BusinessType.PROCESSING),
          [BusinessType.BRICK_KILN]: getBuildingCost(BusinessType.BRICK_KILN),
          [BusinessType.SMELTER]: getBuildingCost(BusinessType.SMELTER),
          [BusinessType.SHOP]: getBuildingCost(BusinessType.SHOP),
          [BusinessType.TOOL_SHOP]: getBuildingCost(BusinessType.TOOL_SHOP),
          [BusinessType.MARKET]: 0
        }}
        businesses={gameState.businesses}
      />

      <GameWorld
        businesses={gameState.businesses}
        placingBusiness={placingBusiness}
        activeDeliveries={gameState.activeDeliveries || []}
        onPlaceBusiness={gameOver ? () => { } : handlePlaceBusiness}
        onSelectBusiness={handleSelectBusiness}
        onDeliveryComplete={handleDeliveryComplete}
        marketPrices={marketPrices}
      />

      {selectedBusiness && (
        <BusinessPanel
          business={selectedBusiness}
          onClose={() => {
            setSelectedBusiness(null)
            setSelectedBusinessId(null)
          }}
          onHireDeliveryBot={() => handleHireDeliveryBot(selectedBusiness.id)}
          onUpgrade={handleUpgradeBusiness}
        />
      )}
    </div>
  )
}

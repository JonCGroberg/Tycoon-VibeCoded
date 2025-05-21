"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import GameWorld from "./game-world"
import GameHUD from "./game-hud"
import MusicControls, { MusicControlsHandle } from "./music-controls"
import {
  type Business,
  ResourceType,
  BusinessType,
  type ActiveDelivery,
  ShippingTypeState,
} from "@/lib/game-types"
import { initializeGameState, generateUniqueId, getUpgradeCost } from "@/lib/game-logic"
import type { GameState } from "@/lib/game-types"
import { SHIPPING_TYPES, getShippingTypeConfig, calculateShippingCost } from "@/lib/shipping-types"
import { v4 as uuidv4 } from "uuid"
import dynamic from "next/dynamic"
import { TrophyIcon, HelpCircleIcon } from 'lucide-react'
import { ACHIEVEMENTS } from './achievements-config'
import { toast } from '@/components/ui/use-toast'
import { playSuccessChime, playErrorBeep } from '@/lib/sounds'
import React from 'react'

const AchievementsPanel = dynamic(() => import("./achievements-panel"), { ssr: false })
const NotificationToast = dynamic(() => import("./notification-toast"), { ssr: false })
const BusinessPanel = dynamic(() => import("./business-panel"), { ssr: false })
const TutorialOverlay = dynamic(() => import("./tutorial-overlay"), { ssr: false })

// Helper: all shipping types
const ALL_SHIPPING_TYPES = [
  { id: 'walker', baseCost: 10 },
  { id: 'bicyclist', baseCost: 25 },
  { id: 'truck', baseCost: 100 },
  { id: 'semi', baseCost: 200 },
  { id: 'train', baseCost: 500 },
  { id: 'plane', baseCost: 800 },
  { id: 'ship', baseCost: 1000 },
];

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

// Local Notification type (matches notification-toast.tsx)
export interface Notification {
  id: string
  message: string
}

export default function TycoonGame({ initialGameState }: { initialGameState?: any } = {}) {

  const [gameState, setGameState] = useState(() => initialGameState || initializeGameState())
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [showTutorial, setShowTutorial] = useState(true)
  const [placingBusiness, setPlacingBusiness] = useState<BusinessType | null>(null)
  const [isPlacing, setIsPlacing] = useState(false)
  const [flashRed, setFlashRed] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [maxBuildings, setMaxBuildings] = useState(1)
  const [maxLevel, setMaxLevel] = useState(1)
  const [maxCoins, setMaxCoins] = useState(gameState.coins)
  const [relocatingBusiness, setRelocatingBusiness] = useState<{
    id: string;
    originalPosition: { x: number; y: number };
    previewPosition: { x: number; y: number };
    isDragging: boolean;
  } | null>(null);
  const [showAchievements, setShowAchievements] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

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

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const musicControlsRef = useRef<MusicControlsHandle>(null)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = true
      audioRef.current.volume = 0.4
      const playResult = audioRef.current.play();
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch(() => { });
      }
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, []);

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
    // Debounce market price interpolation to 400ms for performance
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
    }, 400);
    return () => {
      clearInterval(interval);
      clearInterval(timeout);
    };
  }, []);

  // Update selected business when gameState changes
  useEffect(() => {
    if (selectedBusinessId) {
      const updatedBusiness = gameState.businesses.find((b: { id: string }) => b.id === selectedBusinessId)
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
      const highest = gameState.businesses.reduce((acc: number, b: { level: number }) => Math.max(acc, b.level), 1)
      return Math.max(prev, highest)
    })
    setMaxCoins((prev: number) => Math.max(prev, gameState.coins))
  }, [gameState])

  // Handle delivery completion
  const handleDeliveryComplete = (deliveryId: string) => {
    // No-op: delivery completion is now handled in the game tick based on expectedArrival
  }

  // Game tick - update resources, workers, bots every 400ms (was 200ms)
  useEffect(() => {
    const gameLoop = setInterval(() => {
      setGameState((prevState: any) => {
        // Create a deep copy of the state to avoid mutation
        const newState = JSON.parse(JSON.stringify(prevState)) as GameState

        // Process worker gathering
        newState.businesses.forEach((business) => {
          const batchSize = business.batchSize ?? 10;
          if (business.type === BusinessType.RESOURCE_GATHERING) {
            // For gathering, just produce directly to output if space
            if (business.outgoingStorage.current + batchSize <= business.outgoingStorage.capacity) {
              business.productionProgress += 0.1 * (1 / business.processingTime)
              if (business.productionProgress >= 1) {
                business.outgoingStorage.current += batchSize
                business.productionProgress = 0
              }
            }
          } else {
            // For other businesses, require input buffer
            if (
              business.incomingStorage.current >= batchSize &&
              business.outgoingStorage.current + batchSize <= business.outgoingStorage.capacity
            ) {
              business.productionProgress += 0.1 * (1 / business.processingTime)
              if (business.productionProgress >= 1) {
                business.incomingStorage.current -= batchSize
                business.outgoingStorage.current += batchSize
                business.productionProgress = 0
              }
            }
          }

          // Process production
          if (business.profitDisplayTime !== undefined) {
            business.profitDisplayTime += 100 // 100ms per tick
            if (business.profitDisplayTime > 2000) {
              // 2 seconds
              business.recentProfit = 0
              business.profitDisplayTime = 0
            }
          }
        })

        // Process delivery bots - only start new deliveries if there are no active ones for this bot
        newState.businesses.forEach((business) => {
          if (!business.pendingDeliveries) business.pendingDeliveries = [];
          business.shippingTypes.forEach((shippingType) => {
            shippingType.bots.forEach((bot) => {
              if (bot.isDelivering) return;
              const isAlreadyDelivering = newState.activeDeliveries.some(
                (delivery) => delivery.sourceBusinessId === business.id && delivery.bot.id === bot.id,
              );
              if (isAlreadyDelivering || business.outgoingStorage.current < 1) return;

              // Find all possible targets
              const allTargets = newState.businesses.filter(
                (b) => b.id !== business.id && b.inputResource === business.outputResource
              );
              // Always include the market as a fallback
              const market = newState.businesses.find((b) => b.type === BusinessType.MARKET);
              if (market) allTargets.push(market);

              // Find the first target that can accept the full delivery (storage + pending)
              let chosenTarget: Business | null = null;
              let chosenAmount = Math.min(bot.maxLoad, business.outgoingStorage.current);
              for (const target of allTargets) {
                if (target.type === BusinessType.MARKET) {
                  chosenTarget = target;
                  break;
                }
                if (!target.pendingDeliveries) target.pendingDeliveries = [];
                const pendingAmount = target.pendingDeliveries.reduce((sum, d) => sum + d.resourceAmount, 0);
                const availableSpace = target.incomingStorage.capacity - target.incomingStorage.current - pendingAmount;
                if (availableSpace >= chosenAmount) {
                  chosenTarget = target;
                  break;
                }
              }
              if (!chosenTarget) return;

              bot.isDelivering = true;
              bot.targetBusinessId = chosenTarget.id;
              bot.currentLoad = chosenAmount;
              business.outgoingStorage.current -= chosenAmount;

              if (chosenTarget.type !== BusinessType.MARKET) {
                if (!chosenTarget.pendingDeliveries) chosenTarget.pendingDeliveries = [];
                chosenTarget.pendingDeliveries.push({
                  sourceBusinessId: business.id,
                  resourceAmount: chosenAmount,
                  resourceType: business.outputResource
                });
              }

              // Create a new active delivery
              const distance = Math.sqrt(
                Math.pow(chosenTarget.position.x - business.position.x, 2) +
                Math.pow(chosenTarget.position.y - business.position.y, 2)
              );
              const travelSeconds = (distance / bot.speed) * (10 / 3);
              const expectedArrival = Date.now() + travelSeconds * 1000;
              const createdAt = Date.now();
              const travelTimeMs = travelSeconds * 1000;
              const newDelivery: ActiveDelivery = {
                id: generateUniqueId("delivery"),
                sourceBusinessId: business.id,
                targetBusinessId: chosenTarget.id,
                bot: { ...bot },
                resourceAmount: chosenAmount,
                resourceType: business.outputResource,
                expectedArrival,
                createdAt,
                travelTimeMs,
              };
              newState.activeDeliveries.push(newDelivery);
            });
          })
        })

        // Process active deliveries: complete those whose expectedArrival has passed
        const now = Date.now()
        for (let i = newState.activeDeliveries.length - 1; i >= 0; i--) {
          const delivery = newState.activeDeliveries[i]
          if (delivery.expectedArrival <= now) {
            const sourceBusiness = newState.businesses.find((b) => b.id === delivery.sourceBusinessId)
            const targetBusiness = newState.businesses.find((b) => b.id === delivery.targetBusinessId)
            if (sourceBusiness && targetBusiness) {
              if (!targetBusiness.pendingDeliveries) targetBusiness.pendingDeliveries = [];
              // Remove the pending delivery for this delivery
              const pendingIdx = targetBusiness.pendingDeliveries.findIndex(
                (pd) => pd.sourceBusinessId === sourceBusiness.id && pd.resourceAmount === delivery.resourceAmount && pd.resourceType === delivery.resourceType
              );
              if (pendingIdx !== -1) targetBusiness.pendingDeliveries.splice(pendingIdx, 1);
              if (targetBusiness.type === BusinessType.MARKET) {
                // Selling to market at 50% value
                const resourceValue = getResourceValue(delivery.resourceType)
                const profit = delivery.resourceAmount * resourceValue * 0.5 * 10 // 10x currency multiplier
                newState.coins += profit
                // Show profit indicator on source business
                sourceBusiness.recentProfit = profit
                sourceBusiness.profitDisplayTime = 0
                // Increment marketProfit for achievement
                setMarketProfit(prev => prev + profit)
              } else {
                // Delivering to another business
                if (
                  targetBusiness.incomingStorage.current + delivery.resourceAmount <=
                  targetBusiness.incomingStorage.capacity
                ) {
                  targetBusiness.incomingStorage.current += delivery.resourceAmount
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
              for (const shippingType of sourceBusiness.shippingTypes) {
                const botIndex = shippingType.bots.findIndex((b) => b.id === delivery.bot.id)
                if (botIndex !== -1) {
                  shippingType.bots[botIndex].isDelivering = false
                  shippingType.bots[botIndex].targetBusinessId = null
                  shippingType.bots[botIndex].currentLoad = 0
                  break;
                }
              }
              // Increment deliveryCount for achievement
              setDeliveryCount(prev => prev + 1)
            }
            // Remove the delivery from active deliveries
            newState.activeDeliveries.splice(i, 1)
          }
        }

        return newState
      })
    }, 400); // Update every 400ms for smoother performance

    return () => clearInterval(gameLoop)
  }, [])

  // Helper function to find the best delivery target
  function findBestDeliveryTarget(sourceBusiness: Business, allBusinesses: Business[]): Business | null {
    // Find all possible targets: businesses that need this resource and the market
    const potentialTargets = allBusinesses.filter(
      (business) =>
        business.id !== sourceBusiness.id &&
        business.inputResource === sourceBusiness.outputResource &&
        business.incomingStorage.current < business.incomingStorage.capacity,
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
    const count = gameState.businesses.filter((b: { type: BusinessType }) => b.type === businessType).length
    return Math.floor(baseCosts[businessType] * Math.pow(1.3, count))
  }

  function getWorkerCost(business: Business): number {
    const base = 50
    const n = business.workers.length
    return Math.floor(base * Math.pow(1.1, n))
  }

  function getShippingTypeCost(business: Business): number {
    const base = 100
    const n = business.shippingTypes.length
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

  // Track which achievement notifications have been shown in this session
  const shownAchievementNotifications = useRef<Set<string>>(new Set())
  // Track pending achievement notifications to show after render
  const pendingAchievementNotifications = useRef<Set<string>>(new Set())

  // Track number of unlocked achievements (for music unlock)
  const unlockedAchievements = Object.values(gameState.achievements).filter(Boolean).length;
  const unlockedSongs = Math.max(1, unlockedAchievements); // 1 at start, increases as achievements are unlocked

  // Helper to unlock achievement
  function unlockAchievement(key: string) {
    if (gameState.achievements[key]) return; // Already unlocked, do nothing
    setGameState((prev: GameState) => ({
      ...prev,
      achievements: { ...prev.achievements, [key]: true }
    }))
    // Instead of showing notification here, queue it for useEffect
    pendingAchievementNotifications.current.add(key)
    // Play the newly unlocked song if not all songs are unlocked
    if (musicControlsRef.current && unlockedSongs > 0) {
      musicControlsRef.current.playSongAtIndex(unlockedSongs - 1); // Play the newly unlocked song (last in unlocked)
    }
  }

  // Memoize equity calculation
  const equity = useMemo(() => gameState.businesses.reduce((sum: any, b: { totalInvested: any }) => sum + (b.totalInvested || 0), 0), [gameState.businesses]);

  // Memoize event handlers
  const handlePlaceBusiness = useCallback((type: BusinessType, position: { x: number; y: number }) => {
    if (isPlacing) return // Prevent multiple placements
    setIsPlacing(true)

    console.log('Attempting to place business:', { type, position })

    const businessCost = getBuildingCost(type)
    console.log('Business cost:', businessCost, 'Current coins:', gameState.coins)

    if (gameState.coins < businessCost) {
      console.log('Not enough coins to place business')
      setFlashRed(true)
      playErrorBeep()
      setTimeout(() => setFlashRed(false), 500)
      setIsPlacing(false)
      return;
    }

    // Set input/output resources for each business type
    let inputResource = ResourceType.NONE;
    let outputResource = ResourceType.NONE;
    let processingTime = 1;
    let shippingTypes: ShippingTypeState[] = [];
    if (type === BusinessType.RESOURCE_GATHERING) {
      inputResource = ResourceType.WOOD;
      outputResource = ResourceType.WOOD;
      shippingTypes = [
        {
          type: 'walker',
          bots: [{
            id: uuidv4(),
            maxLoad: getShippingTypeConfig('walker').baseLoad,
            speed: getShippingTypeConfig('walker').baseSpeed,
            isDelivering: false,
            targetBusinessId: null,
            currentLoad: 0,
          }]
        }
      ];
    } else if (type === BusinessType.PROCESSING) {
      inputResource = ResourceType.WOOD;
      outputResource = ResourceType.PLANKS;
      processingTime = 1;
    } else if (type === BusinessType.BRICK_KILN) {
      inputResource = ResourceType.STONE;
      outputResource = ResourceType.BRICKS;
      processingTime = 1;
    } else if (type === BusinessType.SMELTER) {
      inputResource = ResourceType.IRON_ORE;
      outputResource = ResourceType.IRON_INGOT;
      processingTime = 1;
    } else if (type === BusinessType.SHOP) {
      inputResource = ResourceType.PLANKS;
      outputResource = ResourceType.FURNITURE;
      processingTime = 1;
    } else if (type === BusinessType.TOOL_SHOP) {
      inputResource = ResourceType.IRON_INGOT;
      outputResource = ResourceType.TOOLS;
      processingTime = 1;
    }

    const newBusiness: Business = {
      id: uuidv4(),
      type,
      position,
      level: 1,
      processingTime,
      batchSize: 10, // Always set batchSize
      incomingStorage: { current: 0, capacity: 10 },
      outgoingStorage: { current: 0, capacity: 10 },
      productionProgress: 0,
      workers: type === BusinessType.RESOURCE_GATHERING
        ? [{ id: uuidv4(), gatherRate: 1 }]
        : [],
      shippingTypes,
      pendingDeliveries: [],
      recentProfit: 0,
      profitDisplayTime: 0,
      inputResource,
      outputResource,
      totalInvested: businessCost,
    }

    console.log('Created new business:', newBusiness)

    setGameState((prev: GameState) => {
      const newBusinesses = [...prev.businesses, newBusiness]
      const newCoins = prev.coins - businessCost
      // Unlock 'firstBusiness' if this is the first non-market business
      if (prev.businesses.filter((b: any) => b.type !== BusinessType.MARKET).length === 0) {
        unlockAchievement('firstBusiness')
      }
      // Unlock 'industrialist' if 10+ businesses
      if (newBusinesses.filter((b: any) => b.type !== BusinessType.MARKET).length >= 10) {
        unlockAchievement('industrialist')
      }
      playSuccessChime()
      return {
        ...prev,
        businesses: newBusinesses,
        coins: newCoins
      }
    })

    setIsPlacing(false)
    setPlacingBusiness(null)
  }, [isPlacing, gameState.coins, setIsPlacing, setPlacingBusiness])

  const handleSelectBusiness = useCallback((business: Business) => {
    if (business.type === BusinessType.MARKET) {
      setSelectedBusiness(null)
      setSelectedBusinessId(null)
      return;
    }
    setSelectedBusiness(business)
    setSelectedBusinessId(business.id)
  }, [])

  const handleUpgradeBusiness = useCallback((businessId: string, upgradeType: "incomingCapacity" | "processingTime" | "outgoingCapacity") => {
    setGameState((prevState: any) => {
      const newState = { ...prevState }
      const businessIndex = newState.businesses.findIndex((b: { id: string }) => b.id === businessId)

      if (businessIndex === -1) return prevState

      const business = newState.businesses[businessIndex]
      const upgradeCost = getUpgradeCost(business, upgradeType)

      if (newState.coins < upgradeCost) {
        playErrorBeep();
        return prevState
      }

      // Apply upgrade based on type - new logic
      switch (upgradeType) {
        case "incomingCapacity":
          business.incomingStorage.capacity = business.incomingStorage.capacity * 2
          break
        case "processingTime":
          business.processingTime = business.processingTime / 1.5 // Only 1.5x more efficient per upgrade
          break
        case "outgoingCapacity":
          business.outgoingStorage.capacity = business.outgoingStorage.capacity * 2
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
      // Unlock 'masterUpgrader' if level 5+
      if (business.level >= 5) {
        unlockAchievement('masterUpgrader')
      }
      newState.coins -= upgradeCost
      business.totalInvested = (business.totalInvested || 0) + upgradeCost

      console.log("Upgrade complete")
      return newState
    })
  }, [setGameState])

  const handleHireShippingType = useCallback((businessId: string, shippingTypeId: string) => {
    setGameState((prevState: any) => {
      const newState = { ...prevState }
      const businessIndex = newState.businesses.findIndex((b: { id: string }) => b.id === businessId)

      if (businessIndex === -1) return prevState

      const shippingTypeConfig = getShippingTypeConfig(shippingTypeId);
      const shippingType = newState.businesses[businessIndex].shippingTypes.find((st: { type: string }) => st.type === shippingTypeId);
      const ownedCount = shippingType ? shippingType.bots.length : 0;
      const cost = calculateShippingCost(shippingTypeId, ownedCount);

      if (newState.coins < cost) {
        playErrorBeep();
        return prevState
      }

      const newBot = {
        id: generateUniqueId("bot"),
        maxLoad: shippingTypeConfig.baseLoad,
        speed: shippingTypeConfig.baseSpeed,
        isDelivering: false,
        targetBusinessId: null,
        currentLoad: 0,
      };

      if (shippingType) {
        shippingType.bots.push(newBot);
      } else {
        newState.businesses[businessIndex].shippingTypes.push({ type: shippingTypeId, bots: [newBot] });
      }
      newState.coins -= cost;
      newState.businesses[businessIndex].totalInvested = (newState.businesses[businessIndex].totalInvested || 0) + cost;

      return newState
    })
  }, [setGameState])

  const handleMoveBusiness = useCallback((businessId: string, newPosition: { x: number; y: number }) => {
    if (!relocatingBusiness) {
      // Start relocation: store original and preview position
      const business = gameState.businesses.find((b: { id: string }) => b.id === businessId);
      if (!business) return;
      setRelocatingBusiness({
        id: businessId,
        originalPosition: { ...business.position },
        previewPosition: newPosition,
        isDragging: true,
      });
    } else {
      // Update preview position
      setRelocatingBusiness(reloc => reloc && reloc.id === businessId ? { ...reloc, previewPosition: newPosition, isDragging: true } : reloc);
    }
  }, [])

  function handleRestart() {
    setGameState(initializeGameState())
    setSelectedBusiness(null)
    setSelectedBusinessId(null)
    setGameOver(false)
    setMaxBuildings(1)
    setMaxLevel(1)
    setMaxCoins(initializeGameState().coins)
  }

  // Calculate relocation cost (distance-based, e.g., 10 coins per 100px)
  function getRelocationCost(from: { x: number; y: number }, to: { x: number; y: number }) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return Math.max(10, Math.round(dist / 10)); // Minimum 10 coins, 1 coin per 10px
  }

  // When mouse is released, stop dragging but keep preview for confirmation
  useEffect(() => {
    if (!relocatingBusiness || !relocatingBusiness.isDragging) return;
    const handleMouseUp = () => {
      setRelocatingBusiness(reloc => reloc ? { ...reloc, isDragging: false } : reloc);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [relocatingBusiness]);

  // Confirm relocation
  const confirmRelocation = () => {
    if (!relocatingBusiness) return;
    const cost = getRelocationCost(relocatingBusiness.originalPosition, relocatingBusiness.previewPosition);
    if (gameState.coins < cost) {
      playErrorBeep();
      setRelocatingBusiness(null);
      return;
    }
    setGameState((prev: { coins: number; businesses: any[] }) => ({
      ...prev,
      coins: prev.coins - cost,
      businesses: prev.businesses.map((business: { id: string }) =>
        business.id === relocatingBusiness.id
          ? { ...business, position: relocatingBusiness.previewPosition }
          : business
      )
    }));
    playSuccessChime();
    unlockAchievement('relocator');
    setRelocatingBusiness(null);
  };

  // Cancel relocation
  const cancelRelocation = () => {
    setRelocatingBusiness(null);
  };

  // At the top of TycoonGame component (after other hooks)
  const relocationPanelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!relocatingBusiness || relocatingBusiness.isDragging) return
    function handleClickOutside(event: MouseEvent) {
      if (relocationPanelRef.current && !relocationPanelRef.current.contains(event.target as Node)) {
        cancelRelocation()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [relocatingBusiness, relocatingBusiness?.isDragging])

  // Helper to show notification (only once per achievement)
  function showAchievementNotification(key: string) {
    if (shownAchievementNotifications.current.has(key)) return; // Already notified
    const achievement = ACHIEVEMENTS.find(a => a.key === key)
    if (!achievement) return
    toast({
      title: 'Achievement Unlocked!',
      description: achievement.name,
      duration: 5000,
      className: 'animated-achievement-toast',
    });
    shownAchievementNotifications.current.add(key)
    // Skip to next song on achievement
    if (musicControlsRef.current) {
      musicControlsRef.current.skipToNextSong();
    }
  }

  // Show achievement notifications after render if any are pending
  useEffect(() => {
    if (pendingAchievementNotifications.current.size > 0) {
      for (const key of pendingAchievementNotifications.current) {
        showAchievementNotification(key)
      }
      pendingAchievementNotifications.current.clear()
    }
  })

  // Watch for coins >= 10,000 to unlock 'tycoon'
  useEffect(() => {
    if (gameState.coins >= 10000) {
      unlockAchievement('tycoon')
    }
  }, [gameState.coins])

  // Track deliveries and market profit for achievements
  const [deliveryCount, setDeliveryCount] = useState(0)
  const [marketProfit, setMarketProfit] = useState(0)
  useEffect(() => {
    // Patch game tick to increment deliveryCount and marketProfit
    // (This is a simplified patch for demonstration)
    // In a real implementation, you would increment these in the delivery completion logic
    // For now, just check if achievements should be unlocked
    if (deliveryCount >= 100) {
      unlockAchievement('logisticsPro')
    }
    if (marketProfit >= 5000) {
      unlockAchievement('marketMogul')
    }
  }, [deliveryCount, marketProfit])

  // Track game start time for fastTycoon achievement
  const gameStartTimeRef = useRef<number>(Date.now());

  // Hire a worker for a business (add this function if not present)
  const handleHireWorker = (businessId: string) => {
    setGameState((prevState: any) => {
      const newState = { ...prevState };
      const businessIndex = newState.businesses.findIndex((b: { id: string }) => b.id === businessId);
      if (businessIndex === -1) return prevState;
      const cost = getWorkerCost(newState.businesses[businessIndex]);
      if (newState.coins < cost) {
        playErrorBeep();
        return prevState;
      }
      // Add a worker
      newState.businesses[businessIndex].workers.push({ id: uuidv4(), gatherRate: 1 });
      newState.coins -= cost;
      return newState;
    });
  };

  // Add logic to unlock 'shippingMaster' when player owns 5+ shipping bots
  useEffect(() => {
    const totalBots = gameState.businesses.reduce((sum: number, b: any) => sum + (b.shippingTypes?.reduce((s: number, st: any) => s + (st.bots?.length || 0), 0) || 0), 0);
    if (totalBots >= 5) {
      unlockAchievement('shippingMaster');
    }
  }, [gameState.businesses]);

  // Add logic to unlock 'maxedOut' when any business reaches level 10
  useEffect(() => {
    const hasMaxed = gameState.businesses.some((b: any) => b.level >= 10);
    if (hasMaxed) {
      unlockAchievement('maxedOut');
    }
  }, [gameState.businesses]);

  // Watch for coins >= 10,000 to unlock 'tycoon' and 'fastTycoon'
  useEffect(() => {
    if (gameState.coins >= 10000) {
      unlockAchievement('tycoon');
      // Check if under 10 minutes since game start
      const elapsed = Date.now() - gameStartTimeRef.current;
      if (elapsed < 10 * 60 * 1000) {
        unlockAchievement('fastTycoon');
      }
    }
  }, [gameState.coins]);

  // No-op for onSellShippingType (not used in this context)
  const handleSellShippingType = useCallback((businessId: string, shippingTypeId: string) => {
    setGameState((prevState: any) => {
      const newState = { ...prevState };
      const businessIndex = newState.businesses.findIndex((b: { id: string }) => b.id === businessId);
      if (businessIndex === -1) return prevState;
      const business = newState.businesses[businessIndex];
      const shippingType = business.shippingTypes.find((st: { type: string }) => st.type === shippingTypeId);
      if (!shippingType || !Array.isArray(shippingType.bots) || shippingType.bots.length === 0) return prevState;
      // Only sell if at least one bot is not delivering (optional: could allow selling any)
      const botIndex = shippingType.bots.findIndex((bot: any) => !bot.isDelivering);
      // If all are delivering, just remove the last one
      const removeIndex = botIndex !== -1 ? botIndex : shippingType.bots.length - 1;
      // Calculate refund BEFORE removing
      const cost = calculateShippingCost(shippingTypeId, shippingType.bots.length);
      shippingType.bots.splice(removeIndex, 1);
      newState.coins += Math.floor(cost / 2);
      // Optionally, remove the shippingType if no bots left
      if (shippingType.bots.length === 0) {
        business.shippingTypes = business.shippingTypes.filter((st: { type: string }) => st.type !== shippingTypeId);
      }
      return newState;
    });
  }, [setGameState]);

  // Listen for external achievement events (for testing and extensibility)
  useEffect(() => {
    function handleAchievementEvent(e: Event) {
      const customEvent = e as CustomEvent<{ key: string }>
      if (customEvent.detail && customEvent.detail.key) {
        showAchievementNotification(customEvent.detail.key)
      }
    }
    document.addEventListener('achievement', handleAchievementEvent)
    return () => document.removeEventListener('achievement', handleAchievementEvent)
  }, [])

  return (
    <div className="w-full h-[100%] relative overflow-hidden select-none">
      {/* Top right row: Achievements and Help */}
      <div className="absolute top-4 right-4 z-50 flex flex-row gap-2">
        <button
          className="bg-yellow-300 hover:bg-yellow-400 text-yellow-900 font-bold px-4 py-2 rounded shadow flex items-center gap-2"
          onClick={() => setShowAchievements(true)}
          aria-label="Show Achievements"
        >
          <TrophyIcon className="w-5 h-5 mr-1" /> Achievements
        </button>
        <button
          className="bg-white hover:bg-gray-100 text-gray-700 font-bold px-2 py-2 rounded shadow flex items-center"
          onClick={() => setShowTutorial(true)}
          aria-label="Open Tutorial"
          title="Open Tutorial"
        >
          <HelpCircleIcon className="w-5 h-5" />
        </button>
      </div>
      {/* Achievements Panel */}
      {showAchievements && (
        <AchievementsPanel achievements={gameState.achievements} onClose={() => setShowAchievements(false)} />
      )}
      {/* Notification Toasts */}
      {/* <NotificationToast notifications={notifications} onDismiss={dismissNotification} /> */}

      {/* Hidden audio element for background music */}
      <audio ref={audioRef} src="/music/goofy-background.mp3" style={{ display: 'none' }} />

      {gameOver && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-70">
          <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
            <h2 className="text-3xl font-bold text-red-600 mb-4">You Lost!</h2>
            <p className="mb-2 text-lg">Score: <span className="font-bold">{equity}</span></p>
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
        equity={equity}
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
      {/* The market prices panel is intentionally hidden. Remove or comment out its import and usage in GameHUD if it is a separate component. */}

      <GameWorld
        businesses={gameState.businesses}
        placingBusiness={placingBusiness}
        activeDeliveries={gameState.activeDeliveries || []}
        onPlaceBusiness={gameOver || relocatingBusiness ? () => { } : handlePlaceBusiness}
        onSelectBusiness={relocatingBusiness ? () => { } : handleSelectBusiness}
        onDeliveryComplete={handleDeliveryComplete}
        marketPrices={marketPrices}
        onMoveBusiness={relocatingBusiness ? handleMoveBusiness : handleMoveBusiness}
      />

      {selectedBusiness && (
        <BusinessPanel
          business={selectedBusiness}
          coins={gameState.coins}
          onClose={() => {
            setSelectedBusiness(null)
            setSelectedBusinessId(null)
          }}
          onHireShippingType={handleHireShippingType}
          onSellShippingType={handleSellShippingType}
          onUpgrade={handleUpgradeBusiness}
          defaultTab="shipping"
        />
      )}

      {/* Shadow preview business during relocation */}
      {relocatingBusiness && (
        <div
          className="pointer-events-none absolute z-40"
          style={{
            left: relocatingBusiness.previewPosition.x - 48,
            top: relocatingBusiness.previewPosition.y - 48,
            width: 96,
            height: 96,
          }}
        >
          {/* Find the business and render a shadow version */}
          {(() => {
            const business = gameState.businesses.find((b: { id: string }) => b.id === relocatingBusiness.id);
            if (!business) return null;
            return (
              <div className="w-24 h-24 opacity-50 ring-2 ring-blue-400 bg-gray-200 rounded-md border-2 border-dashed border-blue-400 flex flex-col items-center justify-center select-none">
                <div className="text-sm font-bold mt-2 text-center text-nowrap">{business.type.charAt(0) + business.type.slice(1).toLowerCase()}</div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Relocation confirmation panel */}
      {relocatingBusiness && !relocatingBusiness.isDragging && (
        <div
          ref={relocationPanelRef}
          className="absolute z-50"
          style={{
            left: relocatingBusiness.previewPosition.x + 40,
            top: relocatingBusiness.previewPosition.y - 20,
          }}
        >
          <div className="bg-white bg-opacity-90 border border-gray-400 rounded-lg shadow-lg px-4 py-2 flex flex-col items-center">
            <div className="text-sm mb-2">Relocate for <span className="font-bold text-blue-700">{getRelocationCost(relocatingBusiness.originalPosition, relocatingBusiness.previewPosition)} coins</span>?</div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={confirmRelocation}
                aria-label="Confirm relocation"
              >
                Confirm
              </button>
              <button
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                onClick={cancelRelocation}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Music Controls in bottom right */}
      <MusicControls ref={musicControlsRef} audioElement={audioRef.current} unlockedSongs={unlockedSongs} />
    </div>
  )
}

// Add animated border styles for the toast (move outside component for linter)
export function AnimatedToastStyles() {
  return (
    <style jsx global>{`
      .animated-achievement-toast {
        border: 3px solid;
        border-image: linear-gradient(270deg, #ffb347, #ffcc33, #47eaff, #b347ff, #ffb347) 1;
        animation: border-animate 3s linear infinite;
        box-shadow: 0 0 16px 2px #ffe06666;
        border-radius: 16px !important;
        position: relative;
        overflow: hidden;
      }
      @keyframes border-animate {
        0% {
          border-image-source: linear-gradient(270deg, #ffb347, #ffcc33, #47eaff, #b347ff, #ffb347);
        }
        100% {
          border-image-source: linear-gradient(630deg, #ffb347, #ffcc33, #47eaff, #b347ff, #ffb347);
        }
      }
    `}</style>
  );
}

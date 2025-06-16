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
import { initializeGameState, generateUniqueId } from "@/lib/game-logic"
import type { GameState } from "@/lib/game-types"
import { getShippingTypeConfig, calculateShippingCost, getDefaultBotWage } from "@/lib/shipping-types"
import { v4 as uuidv4 } from "uuid"
import dynamic from "next/dynamic"
import { TrophyIcon, HelpCircleIcon } from 'lucide-react'
import { ACHIEVEMENTS } from './achievements-config'
import { toast } from '@/components/ui/use-toast'
import { playSuccessChime, playErrorBeep } from '@/lib/sounds'
import React from 'react'

const AchievementsPanel = dynamic(() => import("./achievements-panel"), { ssr: false })
const BusinessPanel = dynamic(() => import("./business-panel"), { ssr: false })
const TutorialOverlay = dynamic(() => import("./tutorial-overlay"), { ssr: false })

// Local Notification type (matches notification-toast.tsx)
export interface Notification {
  id: string
  message: string
}

export default function TycoonGame({ initialGameState }: { initialGameState?: GameState } = {}) {
  // Hydration flag to avoid SSR/client mismatch
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Use static initial values for SSR, then update from client after hydration
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
  const [pan, setPan] = useState({ x: 0, y: 0 }); // Pan offset for draggable game area

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const musicControlsRef = useRef<MusicControlsHandle>(null)

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.loop = true;
      audio.volume = 0.4;
      const playResult = audio.play();
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch(() => { });
      }
    }
    return () => {
      if (audio) {
        audio.pause();
      }
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
  const handleDeliveryComplete = () => {
    // No-op: delivery completion is now handled in the game tick based on expectedArrival
  }

  // Game tick - update resources, workers, bots every 400ms (was 200ms)
  useEffect(() => {
    const gameLoop = setInterval(() => {
      setGameState((prevState: GameState) => {
        // Create a deep copy of the state to avoid mutation
        const newState = JSON.parse(JSON.stringify(prevState)) as GameState

        // Process worker gathering and mine production
        newState.businesses.forEach((business) => {
          const batchSize = business.batchSize ?? 10;
          if (business.type === BusinessType.RESOURCE_GATHERING || business.type === BusinessType.MINE) {
            // Always keep incomingStorage full for resource gatherers and mines
            business.incomingStorage.current = 1;
            business.incomingStorage.capacity = 1;
            // For gathering/mining, just produce directly to output if space
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
              const chosenAmount = Math.min(bot.maxLoad, business.outgoingStorage.current);
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
                bot: { ...bot, shippingTypeId: shippingType.type },
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

        // Deduct delivery bot wages and business operating costs
        let totalWages = 0;
        let totalOperatingCosts = 0;
        newState.businesses.forEach((business) => {
          // Sum operating cost
          if (business.operatingCost) {
            totalOperatingCosts += business.operatingCost;
          }
          // Sum wages for bots that are delivering
          business.shippingTypes.forEach((shippingType) => {
            shippingType.bots.forEach((bot) => {
              if (bot.isDelivering && bot.wage) {
                totalWages += bot.wage;
              }
            });
          });
        });
        // Deduct from coins (every tick is 0.1s, so scale costs down)
        const tickScale = 0.1; // 0.1s per tick
        const totalCost = (totalWages + totalOperatingCosts) * tickScale;
        newState.coins -= totalCost;
        if (newState.coins < 0) newState.coins = 0;

        return newState
      })
    }, 400); // Update every 400ms for smoother performance

    return () => clearInterval(gameLoop)
  }, [])

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
  const getBuildingCost = useCallback((businessType: BusinessType): number => {
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
  }, [gameState.businesses])

  // Track which achievement notifications have been shown in this session
  const shownAchievementNotifications = useRef<Set<string>>(new Set())
  // Track pending achievement notifications to show after render
  const pendingAchievementNotifications = useRef<Set<string>>(new Set())

  // Track number of unlocked achievements (for music unlock)
  const unlockedAchievements = Object.values(gameState.achievements).filter(Boolean).length;
  const unlockedSongs = Math.max(1, unlockedAchievements + 1); // Always at least 1 song unlocked for UI

  // Track previous unlockedAchievements count
  const prevUnlockedAchievements = useRef(unlockedAchievements);

  useEffect(() => {
    if (unlockedAchievements > prevUnlockedAchievements.current) {
      // Play the song at index = unlockedAchievements (ith achievement → song[i])
      // setPendingSongIndex(unlockedAchievements);
    }
    prevUnlockedAchievements.current = unlockedAchievements;
  }, [unlockedAchievements]);

  // Helper to unlock achievement
  const unlockAchievement = useCallback((key: string) => {
    console.log('unlockAchievement called with key:', key)
    if (gameState.achievements[key]) return; // Already unlocked, do nothing
    setGameState((prev: GameState) => ({
      ...prev,
      achievements: { ...prev.achievements, [key]: true }
    }))
    // Instead of showing notification here, queue it for useEffect
    pendingAchievementNotifications.current.add(key)
  }, [gameState.achievements, setGameState])

  // Memoize equity calculation
  const equity = useMemo(() => gameState.businesses.reduce((sum: number, b: Business) => sum + (b.totalInvested || 0), 0), [gameState.businesses]);

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
            wage: getDefaultBotWage('walker'),
          }]
        }
      ];
    } else if (type === BusinessType.MINE) {
      // Mine is a first-tier producer like wood cutter
      inputResource = ResourceType.NONE;
      outputResource = ResourceType.IRON_ORE;
      processingTime = 1;
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
      // For Mine, incomingStorage is always full and capacity 1 (like wood cutter)
      incomingStorage: type === BusinessType.RESOURCE_GATHERING || type === BusinessType.MINE ? { current: 1, capacity: 1 } : { current: 0, capacity: 10 },
      outgoingStorage: { current: 0, capacity: 10 },
      productionProgress: 0,
      workers: type === BusinessType.RESOURCE_GATHERING ? [{ id: uuidv4(), gatherRate: 1 }] : [],
      shippingTypes,
      pendingDeliveries: [],
      recentProfit: 0,
      profitDisplayTime: 0,
      inputResource,
      outputResource,
      totalInvested: businessCost,
      operatingCost: 2, // Default operating cost, can be adjusted per business type/level
    }

    console.log('Created new business:', newBusiness)

    setGameState((prev: GameState) => {
      const newBusinesses = [...prev.businesses, newBusiness]
      const newCoins = prev.coins - businessCost
      // Unlock 'firstBusiness' if this is the first non-market business
      if (prev.businesses.filter((b: Business) => b.type !== BusinessType.MARKET).length === 0) {
        unlockAchievement('firstBusiness')
      }
      // Unlock 'industrialist' if 10+ businesses
      if (newBusinesses.filter((b: Business) => b.type !== BusinessType.MARKET).length >= 10) {
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
  }, [isPlacing, gameState.coins, setIsPlacing, setPlacingBusiness, getBuildingCost, unlockAchievement])

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
      const otherTypes: Array<"incomingCapacity" | "processingTime" | "outgoingCapacity"> = ["incomingCapacity", "processingTime", "outgoingCapacity"].filter(t => t !== upgradeType) as Array<"incomingCapacity" | "processingTime" | "outgoingCapacity">;
      otherTypes.forEach(type => {
        if (business.upgrades && business.upgrades[type] === 0) {
          cost *= 1.5
        }
      })
      return Math.floor(cost)
    }
    setGameState((prevState: GameState) => {
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
      // Unlock 'masterUpgrader' if level 11+
      if (business.level >= 11) {
        unlockAchievement('masterUpgrader')
      }
      // Unlock 'maxedOut' if level 20+
      if (business.level >= 20) {
        unlockAchievement('maxedOut')
      }
      newState.coins -= upgradeCost
      business.totalInvested = (business.totalInvested || 0) + upgradeCost

      console.log("Upgrade complete")
      return newState
    })
  }, [setGameState, unlockAchievement])

  const handleHireShippingType = useCallback((businessId: string, shippingTypeId: string) => {
    setGameState((prevState: GameState) => {
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
        wage: getDefaultBotWage(shippingTypeId),
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

  const handleSellShippingType = useCallback((businessId: string, shippingTypeId: string) => {
    setGameState((prevState: GameState) => {
      const newState = { ...prevState }
      const businessIndex = newState.businesses.findIndex((b: { id: string }) => b.id === businessId)
      if (businessIndex === -1) return prevState
      const business = newState.businesses[businessIndex]
      const shippingType = business.shippingTypes.find((st: { type: string }) => st.type === shippingTypeId)
      if (!shippingType || shippingType.bots.length === 0) return prevState
      // Only allow selling bots that are not delivering
      const sellableBotIndex = shippingType.bots.findIndex(bot => !bot.isDelivering)
      if (sellableBotIndex === -1) return prevState // All bots are in use
      const ownedCount = shippingType.bots.length
      const cost = calculateShippingCost(shippingTypeId, ownedCount - 1) // Refund based on previous count
      // Remove the bot
      shippingType.bots.splice(sellableBotIndex, 1)
      // Refund 50% of the cost
      newState.coins += Math.floor(cost / 2)
      // Remove shippingType entry if no bots left
      if (shippingType.bots.length === 0) {
        business.shippingTypes = business.shippingTypes.filter(st => st.type !== shippingTypeId)
      }
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
  }, [relocatingBusiness, gameState.businesses, setRelocatingBusiness])

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
    setGameState((prev: GameState) => ({
      ...prev,
      coins: prev.coins - cost,
      businesses: prev.businesses.map((business: Business) =>
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

  // Compute mineUnlocked: true if player has at least 10,000 coins
  useEffect(() => {
    if (!gameState.mineUnlocked && gameState.coins >= 10000) {
      setGameState((prev: GameState) => ({ ...prev, mineUnlocked: true }));
    }
  }, [gameState.coins, gameState.mineUnlocked]);

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
  }, [gameState, pendingAchievementNotifications.current.size])

  // Watch for coins >= 50,000 to unlock 'tycoon'
  useEffect(() => {
    if (gameState.coins >= 50000) {
      unlockAchievement('tycoon')
    }
  }, [gameState.coins, unlockAchievement])

  // Track deliveries and market profit for achievements
  const [deliveryCount, setDeliveryCount] = useState(0)
  const [marketProfit, setMarketProfit] = useState(0)
  useEffect(() => {
    // Patch game tick to increment deliveryCount and marketProfit
    // (This is a simplified patch for demonstration)
    // In a real implementation, you would increment these in the delivery completion logic
    // For now, just check if achievements should be unlocked
    if (deliveryCount >= 5000) {
      unlockAchievement('logisticsPro')
    }
    if (marketProfit >= 100000) {
      unlockAchievement('marketMogul')
    }
  }, [deliveryCount, marketProfit, unlockAchievement])

  // Add after other useEffects, before the return statement
  useEffect(() => {
    function handleAchievementEvent(e: CustomEvent) {
      if (e.detail && e.detail.key) {
        unlockAchievement(e.detail.key);
      }
    }
    document.addEventListener('achievement', handleAchievementEvent as EventListener);
    return () => {
      document.removeEventListener('achievement', handleAchievementEvent as EventListener);
    };
  }, [unlockAchievement]);

  // Only render after hydration to avoid SSR/client mismatch
  if (!hydrated) return null;

  return (
    <div className="w-full h-[100%] relative overflow-hidden select-none">
      {/* Coordinate readout overlay */}
      <div className="fixed top-2 left-2 z-50 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded shadow pointer-events-none">
        Offset: ({pan.x}, {pan.y})
      </div>
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

      {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}

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
        mineUnlocked={gameState.mineUnlocked}
      />

      <GameWorld
        businesses={gameState.businesses}
        placingBusiness={placingBusiness}
        activeDeliveries={gameState.activeDeliveries}
        onPlaceBusiness={handlePlaceBusiness}
        onSelectBusiness={handleSelectBusiness}
        onDeliveryComplete={handleDeliveryComplete}
        onMoveBusiness={handleMoveBusiness}
        selectedBusinessId={selectedBusinessId}
        pan={pan}
        setPan={setPan}
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
      <MusicControls ref={musicControlsRef} unlockedSongs={unlockedSongs} />
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

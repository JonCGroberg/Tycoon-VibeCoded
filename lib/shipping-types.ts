import { LucideIcon, UserIcon, BikeIcon, TruckIcon, ShipIcon, PlaneIcon, TrainIcon } from "lucide-react";

export interface ShippingTypeConfig {
  id: string;
  displayName: string;
  icon: LucideIcon;
  baseCost: number;
  baseSpeed: number; // studs per second
  baseLoad: number;
  description: string;
}

export const SHIPPING_TYPES: ShippingTypeConfig[] = [
  {
    id: "walker",
    displayName: "Walker",
    icon: UserIcon,
    baseCost: 15,
    baseSpeed: 50,
    baseLoad: 1,
    description: "Basic walking delivery"
  },
  {
    id: "bicyclist",
    displayName: "Bicyclist",
    icon: BikeIcon,
    baseCost: 150,
    baseSpeed: 125,
    baseLoad: 5,
    description: "Faster than walking, can carry more"
  },
  {
    id: "truck",
    displayName: "Truck",
    icon: TruckIcon,
    baseCost: 1500,
    baseSpeed: 312,
    baseLoad: 25,
    description: "Good balance of speed and capacity"
  },
  {
    id: "semi",
    displayName: "Semi Truck",
    icon: TruckIcon,
    baseCost: 15000,
    baseSpeed: 781,
    baseLoad: 125,
    description: "Large capacity for heavy loads"
  },
  {
    id: "train",
    displayName: "Train",
    icon: TrainIcon,
    baseCost: 150000,
    baseSpeed: 1953,
    baseLoad: 625,
    description: "High capacity, good for long distances"
  },
  {
    id: "ship",
    displayName: "Ship",
    icon: ShipIcon,
    baseCost: 1500000,
    baseSpeed: 4882,
    baseLoad: 3125,
    description: "Massive capacity, moderate speed"
  },
  {
    id: "plane",
    displayName: "Plane",
    icon: PlaneIcon,
    baseCost: 10000000,
    baseSpeed: 12207,
    baseLoad: 15625,
    description: "Fastest delivery, high capacity"
  }
];

// Helper function to get shipping type config
export function getShippingTypeConfig(typeId: string): ShippingTypeConfig {
  const config = SHIPPING_TYPES.find(type => type.id === typeId);
  if (!config) {
    throw new Error(`Unknown shipping type: ${typeId}`);
  }
  return config;
}

// Calculate the cost for a shipping type based on how many of that specific type are already owned
export function calculateShippingCost(typeId: string, ownedCount: number): number {
  const config = getShippingTypeConfig(typeId);
  // Linear factor: baseCost * 1.1^ownedCount
  return Math.floor(config.baseCost * Math.pow(1.1, ownedCount));
}
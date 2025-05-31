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
    baseCost: 150,
    baseSpeed: 65,
    baseLoad: 5,
    description: "Slowest, but can squeeze through anywhere. Minimal capacity."
  },
  {
    id: "bicyclist",
    displayName: "Bicyclist",
    icon: BikeIcon,
    baseCost: 1500,
    baseSpeed: 140,
    baseLoad: 30,
    description: "Faster than walking, but still limited in what can be carried."
  },
  {
    id: "scooter",
    displayName: "Scooter",
    icon: BikeIcon,
    baseCost: 6000,
    baseSpeed: 230,
    baseLoad: 20,
    description: "Quick zippy runs, but can only carry a couple of items."
  },
  {
    id: "van",
    displayName: "Van",
    icon: TruckIcon,
    baseCost: 25000,
    baseSpeed: 280,
    baseLoad: 60,
    description: "Decent speed, moderate capacity. Good for small businesses."
  },
  {
    id: "truck",
    displayName: "Truck",
    icon: TruckIcon,
    baseCost: 90000,
    baseSpeed: 330,
    baseLoad: 120,
    description: "Slower than van, but can haul more."
  },
  {
    id: "semi",
    displayName: "Semi Truck",
    icon: TruckIcon,
    baseCost: 350000,
    baseSpeed: 400,
    baseLoad: 280,
    description: "Big hauls, but not the fastest."
  },
  {
    id: "boxtrain",
    displayName: "Box Train",
    icon: TrainIcon,
    baseCost: 1200000,
    baseSpeed: 650,
    baseLoad: 600,
    description: "Specialized for bulk, but only on certain routes."
  },
  {
    id: "train",
    displayName: "Express Train",
    icon: TrainIcon,
    baseCost: 4000000,
    baseSpeed: 1150,
    baseLoad: 1000,
    description: "Fastest land bulk delivery, but expensive."
  },
  {
    id: "ship",
    displayName: "Ship",
    icon: ShipIcon,
    baseCost: 12000000,
    baseSpeed: 900,
    baseLoad: 1800,
    description: "Massive capacity, but slow and only for water routes."
  },
  {
    id: "plane",
    displayName: "Plane",
    icon: PlaneIcon,
    baseCost: 8000000,
    baseSpeed: 3500,
    baseLoad: 20,
    description: "Blazing fast, but can only carry a small load."
  },
  {
    id: "cargo_plane",
    displayName: "Cargo Plane",
    icon: PlaneIcon,
    baseCost: 18000000,
    baseSpeed: 2200,
    baseLoad: 400,
    description: "Very fast, high-capacity air cargo for bulk urgent deliveries."
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
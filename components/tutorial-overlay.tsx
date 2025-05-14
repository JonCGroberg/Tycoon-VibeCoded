"use client"

import { Button } from "@/components/ui/button"
import { TreesIcon as TreeIcon, UserIcon, TimerIcon, TruckIcon, CoinsIcon } from "lucide-react"

interface TutorialOverlayProps {
  onClose: () => void
}

export default function TutorialOverlay({ onClose }: TutorialOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Quick-Start Tutorial</h2>

        <div className="space-y-4">
          <div className="flex items-start">
            <div className="bg-green-100 p-2 rounded-full mr-4">
              <TreeIcon className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <h3 className="font-bold text-lg">1. Place Your First Woodcutter</h3>
              <p className="text-gray-600">
                Click the "Place Woodcutter" button in the top-left menu, then click anywhere on the map to place it.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="bg-blue-100 p-2 rounded-full mr-4">
              <UserIcon className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h3 className="font-bold text-lg">2. Hire Workers</h3>
              <p className="text-gray-600">
                Click on your Woodcutter, then click "Hire Worker" to add workers who will automatically chop Wood.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="bg-amber-100 p-2 rounded-full mr-4">
              <TimerIcon className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h3 className="font-bold text-lg">3. Watch the Progress Bar</h3>
              <p className="text-gray-600">
                As workers gather Wood, it will be processed automatically. Watch the progress bar at the top of the
                business.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="bg-purple-100 p-2 rounded-full mr-4">
              <TruckIcon className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <h3 className="font-bold text-lg">4. Hire a Deliverer Bot</h3>
              <p className="text-gray-600">
                Click "Hire Bot" to add a delivery bot that will automatically transport resources to other businesses
                or the market.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="bg-yellow-100 p-2 rounded-full mr-4">
              <CoinsIcon className="w-6 h-6 text-yellow-700" />
            </div>
            <div>
              <h3 className="font-bold text-lg">5. Collect Coins & Upgrade</h3>
              <p className="text-gray-600">
                Use your profits to upgrade your businesses, hire more workers, and expand your production chain.
                Remember that resource values double each time they move up the chain, so processing raw materials into
                finished goods is highly profitable!
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Start Playing</Button>
        </div>
      </div>
    </div>
  )
}

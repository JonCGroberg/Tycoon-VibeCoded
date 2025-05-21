"use client"

import { Button } from "@/components/ui/button"
import { TreesIcon as TreeIcon, UserIcon, TimerIcon, TruckIcon, CoinsIcon } from "lucide-react"

interface TutorialOverlayProps {
  onClose: () => void
  gameState: any // Accept the game state as a prop
}

export default function TutorialOverlay({ onClose, gameState }: TutorialOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-auto p-6 flex flex-col">
        <div className="flex flex-row gap-8 flex-1">
          <div className="flex-1 min-w-0 max-h-[70vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
            <div className="space-y-4">
              {/* Step 1: Place Wood Camp */}
              <div className="flex items-center p-3 rounded-lg bg-green-50 border-l-4 border-green-400">
                <div className="p-2 rounded-full mr-4 bg-green-100">
                  <TreeIcon className="w-7 h-7 text-green-700" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-green-700">Place Your First Wood Camp</h3>
                  <p className="text-gray-700 text-sm">Click the <b>Place Wood Camp</b> button, then click on the map to build it.</p>
                </div>
              </div>
              {/* Step 2: Hire Delivery Types */}
              <div className="flex items-center p-3 rounded-lg bg-blue-50 border-l-4 border-blue-400">
                <div className="p-2 rounded-full mr-4 bg-blue-100">
                  <TruckIcon className="w-7 h-7 text-blue-700" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-blue-700">Hire Delivery Drivers</h3>
                  <p className="text-gray-700 text-sm">Open the <b>Shipping</b> tab and hire walkers, bicyclists, trucks, and more to move goods.</p>
                </div>
              </div>
              {/* Step 3: Upgrades */}
              <div className="flex items-center p-3 rounded-lg bg-purple-50 border-l-4 border-purple-400">
                <div className="p-2 rounded-full mr-4 bg-purple-100">
                  <TimerIcon className="w-7 h-7 text-purple-700" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-purple-700">Upgrade Your Business</h3>
                  <p className="text-gray-700 text-sm">Click the <b>Upgrade</b> buttons to increase storage capacity and processing speed. Each upgrade doubles the capacity or halves the processing time!</p>
                </div>
              </div>
              {/* Step 4: Profit! */}
              <div className="flex items-center p-3 rounded-lg bg-yellow-50 border-l-4 border-yellow-400">
                <div className="p-2 rounded-full mr-4 bg-yellow-100">
                  <CoinsIcon className="w-7 h-7 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-yellow-600">Profit!</h3>
                  <p className="text-gray-700 text-sm">
                    Sell goods to <b>other businesses at full value</b> or to the <b>market at 50% value</b>.
                    Upgrade, expand, and experiment with new strategies to grow your tycoon empire!
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center min-w-[280px]">
            <h3 className="text-lg font-bold mb-2 text-center">How a Business Works</h3>
            <img src="/tutorial/Tutorial.png" alt="Tutorial Diagram" className="max-w-[260px] w-full h-auto rounded-md border border-gray-200 shadow" />
          </div>
        </div>
        <div className="mt-6 flex justify-end w-full">
          <Button onClick={onClose} className="w-full max-w-xs mx-auto">Start Playing</Button>
        </div>
      </div>
    </div>
  )
}

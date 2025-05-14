"use client"

import { Button } from "@/components/ui/button"
import { TreesIcon as TreeIcon, UserIcon, TimerIcon, TruckIcon, CoinsIcon } from "lucide-react"

interface TutorialOverlayProps {
  onClose: () => void
  gameState: any // Accept the game state as a prop
}

export default function TutorialOverlay({ onClose, gameState }: TutorialOverlayProps) {
  // Determine which step is next based on gameState
  const hasWoodcutter = gameState.businesses.some((b: any) => b.outputResource === 'WOOD')
  const woodcutter = gameState.businesses.find((b: any) => b.outputResource === 'WOOD')
  const hasWorker = woodcutter && woodcutter.workers && woodcutter.workers.length > 0
  const hasBot = woodcutter && woodcutter.deliveryBots && woodcutter.deliveryBots.length > 0

  // Step completion logic
  const steps = [
    {
      icon: <TreeIcon className="w-6 h-6 text-green-700" />, title: '1. Place Your First Woodcutter',
      desc: 'Click the "Place Woodcutter" button in the top-left menu, then click anywhere on the map to place it.',
      done: hasWoodcutter,
      key: 'woodcutter',
    },
    {
      icon: <UserIcon className="w-6 h-6 text-blue-700" />, title: '2. Hire Workers',
      desc: 'Click on your Woodcutter, then click "Hire Worker" to add workers who will automatically chop Wood.',
      done: hasWoodcutter && hasWorker,
      key: 'worker',
    },
    {
      icon: <TimerIcon className="w-6 h-6 text-amber-700" />, title: '3. Watch the Progress Bar',
      desc: 'As workers gather Wood, it will be processed automatically. Watch the progress bar at the top of the business.',
      done: hasWoodcutter && hasWorker,
      key: 'progress',
    },
    {
      icon: <TruckIcon className="w-6 h-6 text-purple-700" />, title: '4. Hire a Deliverer Bot',
      desc: 'Click "Hire Bot" to add a delivery bot that will automatically transport resources to other businesses or the market.',
      done: hasWoodcutter && hasWorker && hasBot,
      key: 'bot',
    },
    {
      icon: <CoinsIcon className="w-6 h-6 text-yellow-700" />, title: '5. Collect Coins & Upgrade',
      desc: 'Use your profits to upgrade your businesses, hire more workers, and expand your production chain. Processing raw materials into finished goods is highly profitable!',
      done: false,
      key: 'upgrade',
    },
  ]

  // Find the first incomplete step
  const nextStepIndex = steps.findIndex(step => !step.done)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Quick-Start Tutorial</h2>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div
              className={`flex items-start p-2 rounded-lg transition-all ${step.done ? 'opacity-60' : ''} ${i === nextStepIndex ? 'border-2 border-blue-400 bg-blue-50' : ''}`}
              key={step.key}
            >
              <div className={`p-2 rounded-full mr-4`}>{step.icon}</div>
              <div>
                <h3 className={`font-bold text-lg ${i === nextStepIndex ? 'text-blue-700' : ''}`}>{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
                {step.done && <span className="inline-block mt-1 text-green-600 font-semibold text-xs">✓ Completed</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Start Playing</Button>
        </div>
      </div>
    </div>
  )
}

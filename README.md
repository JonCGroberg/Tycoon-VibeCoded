# Roblox Tycoon Game - Web Prototype

A web-based tycoon/idle game inspired by Roblox tycoon mechanics. Build, upgrade, and manage a network of resource-gathering and processing businesses to maximize your profits!

## Features
- Place and upgrade various business types (Wood Cutter Camp, Quarry, Mine, Plank Mill, Brick Kiln, Smelter, Tool Shop, Market)
- Logical progression: unlock advanced businesses by building prerequisites
- Dynamic market prices for resources
- Visual feedback for resource needs, production, and errors
- Game over and restart system
- Modern, clean UI with resource and business icons

## Getting Started

1. **Clone the Repository**
   ```sh
   git clone https://github.com/JonCGroberg/roblox-tycoon--1-.git
   cd roblox-tycoon--1-
   ```
2. **Install Dependencies** (requires [pnpm](https://pnpm.io/))
   ```sh
   pnpm install
   ```
3. **Run the Development Server**
   ```sh
   pnpm run dev
   ```
4. Open the local server URL (usually `http://localhost:5173` or as indicated in your terminal) in your browser.

## Gameplay
- Start with coins and basic business options.
- Place businesses on the grid to generate and process resources.
- Unlock advanced businesses by building the required prerequisites.
- Sell resources at the Market for coins.
- Avoid running out of coins—if you do, it's game over!

## Business Progression
- **Wood Cutter Camp, Quarry, Mine**: Gather raw resources.
- **Plank Mill, Brick Kiln, Smelter**: Process raw resources into goods.
- **Tool Shop**: Create advanced goods from processed resources.
- **Market**: Sell any resource for coins at dynamic prices.

## Controls
- Click a business button to select it, then click on the grid to place it.
- Hover over businesses for more info.
- Use the restart button if you run out of coins.

## Customization & Development
- All game logic is in `script.js`.
- UI styles are in `styles.css`.
- Business types and progression can be edited in the `BUSINESS_TYPES` object in `script.js`.

## License
MIT License. See LICENSE file for details.
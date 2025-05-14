const BUSINESS_TYPES = {
    LUMBER_YARD: {
        name: 'Lumber Yard',
        cost: 100,
        icon: '🌲',
        input: null,
        output: { type: 'WOOD', amount: 1 },
        time: 5,
        description: 'Produces wood from trees',
        requiredBusinesses: []
    },
    QUARRY: {
        name: 'Quarry',
        cost: 150,
        icon: '⛰️',
        input: null,
        output: { type: 'STONE', amount: 1 },
        time: 7,
        description: 'Extracts stone from the ground',
        requiredBusinesses: []
    },
    MINE: {
        name: 'Mine',
        cost: 200,
        icon: '⛏️',
        input: null,
        output: { type: 'ORE', amount: 1 },
        time: 10,
        description: 'Mines valuable ores',
        requiredBusinesses: []
    },
    PLANK_MILL: {
        name: 'Plank Mill',
        cost: 300,
        icon: '🪵',
        input: { type: 'WOOD', amount: 2 },
        output: { type: 'PLANKS', amount: 1 },
        time: 8,
        description: 'Converts wood into planks',
        requiredBusinesses: ['LUMBER_YARD']
    },
    BRICK_KILN: {
        name: 'Brick Kiln',
        cost: 350,
        icon: '🧱',
        input: { type: 'STONE', amount: 2 },
        output: { type: 'BRICKS', amount: 1 },
        time: 9,
        description: 'Produces bricks from stone',
        requiredBusinesses: ['QUARRY']
    },
    SMELTER: {
        name: 'Smelter',
        cost: 400,
        icon: '🔥',
        input: { type: 'ORE', amount: 2 },
        output: { type: 'METAL', amount: 1 },
        time: 12,
        description: 'Smelts ore into metal',
        requiredBusinesses: ['MINE']
    },
    TOOL_SHOP: {
        name: 'Tool Shop',
        cost: 500,
        icon: '🛠️',
        input: { type: 'METAL', amount: 2 },
        output: { type: 'TOOLS', amount: 1 },
        time: 15,
        description: 'Crafts tools from metal',
        requiredBusinesses: ['SMELTER']
    },
    MARKET: {
        name: 'Market',
        cost: 1000,
        icon: '🏪',
        input: null,
        output: null,
        time: 0,
        description: 'Sell resources for coins',
        requiredBusinesses: []
    }
};

const RESOURCE_VALUES = {
    WOOD: 5,
    STONE: 7,
    ORE: 10,
    PLANKS: 15,
    BRICKS: 20,
    METAL: 30,
    TOOLS: 50
};

// Market price multipliers (0.5x to 1.5x base value)
const MARKET_PRICE_MULTIPLIERS = {
    WOOD: 1.2,
    STONE: 1.3,
    ORE: 1.4,
    PLANKS: 1.5,
    BRICKS: 1.6,
    METAL: 1.7,
    TOOLS: 1.8
};

function createBusiness(type, x, y) {
    const businessType = BUSINESS_TYPES[type];
    if (!businessType) return null;

    // Check if player has required businesses
    const hasRequiredBusinesses = businessType.requiredBusinesses.every(reqType =>
        businesses.some(b => b.type === reqType)
    );

    if (!hasRequiredBusinesses) {
        const missingBusiness = businessType.requiredBusinesses.find(reqType =>
            !businesses.some(b => b.type === reqType)
        );
        const missingBusinessName = BUSINESS_TYPES[missingBusiness].name;
        alert(`You need to build a ${missingBusinessName} first!`);
        return null;
    }

    // Check if there's already a business at this location
    const existingBusiness = businesses.find(b =>
        Math.abs(b.x - x) < 1 && Math.abs(b.y - y) < 1
    );
    if (existingBusiness) {
        console.log('Business already exists at this location');
        return null;
    }

    // Set input/output resources and buffers
    const inputResource = businessType.input ? businessType.input.type : null;
    const outputResource = businessType.output ? businessType.output.type : null;
    const incomingBuffer = businessType.input ? { current: 0, capacity: 10 * businessType.input.amount } : { current: 0, capacity: 0 };
    const outgoingBuffer = businessType.output ? { current: 0, capacity: 10 * businessType.output.amount } : { current: 0, capacity: 0 };
    const processingTime = businessType.time || 0;

    const business = {
        id: generateUniqueId(),
        type,
        x,
        y,
        level: 1,
        progress: 0,
        lastUpdate: Date.now(),
        isStopped: false,
        isStoppedReason: null,
        inputResource,
        outputResource,
        incomingBuffer,
        outgoingBuffer,
        processingTime
    };

    businesses.push(business);
    console.log(`Created business: ${type} at (${x}, ${y})`);
    return business;
}

function createBusinessButtons() {
    const container = document.getElementById('business-buttons');
    container.innerHTML = '';

    Object.entries(BUSINESS_TYPES).forEach(([type, data]) => {
        // Check if player has required businesses
        const hasRequiredBusinesses = data.requiredBusinesses.every(reqType =>
            businesses.some(b => b.type === reqType)
        );

        // Hide button if requirements are not met
        if (!hasRequiredBusinesses && data.requiredBusinesses.length > 0) {
            return;
        }

        const button = document.createElement('button');
        button.className = 'business-button';
        button.innerHTML = `
            <div class="business-icon">${data.icon}</div>
            <div class="business-info">
                <div class="business-name">${data.name}</div>
                <div class="business-cost">${data.cost} coins</div>
                ${data.requiredBusinesses.length > 0 ?
                `<div class="business-requirements">Requires: ${data.requiredBusinesses.map(req => BUSINESS_TYPES[req].name).join(', ')}</div>`
                : ''}
            </div>
        `;

        button.onclick = () => {
            if (coins >= data.cost) {
                selectedBusinessType = type;
                document.body.style.cursor = 'crosshair';
            } else {
                alert('Not enough coins!');
            }
        };

        container.appendChild(button);
    });
}

// Add this function to handle placing a business and updating the UI
function handleGridClick(x, y) {
    if (!selectedBusinessType) return;
    const newBusiness = createBusiness(selectedBusinessType, x, y);
    if (newBusiness) {
        // Deduct coins (assuming coins is a global variable)
        coins -= BUSINESS_TYPES[selectedBusinessType].cost;
        // Deselect after placement
        selectedBusinessType = null;
        document.body.style.cursor = 'default';
        // Update the business buttons
        createBusinessButtons();
    }
}
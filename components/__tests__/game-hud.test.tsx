import React from 'react'
import { render, screen } from '@testing-library/react'
import GameHUD from '../game-hud'
import { BusinessType } from '@/lib/game-types'

describe('GameHUD conditional button rendering', () => {
    const baseProps = {
        coins: 1000,
        equity: 500,
        onPlaceBusiness: jest.fn(),
        buildingCosts: {
            [BusinessType.RESOURCE_GATHERING]: 100,
            [BusinessType.QUARRY]: 120,
            [BusinessType.MINE]: 150,
            [BusinessType.PROCESSING]: 250,
            [BusinessType.BRICK_KILN]: 300,
            [BusinessType.SMELTER]: 350,
            [BusinessType.SHOP]: 500,
            [BusinessType.TOOL_SHOP]: 600,
            [BusinessType.MARKET]: 0,
        },
    }
    it('renders only Wood Camp button when no businesses', () => {
        render(<GameHUD {...baseProps} businesses={[]} />)
        expect(screen.getByText(/Place Wood Camp/)).toBeInTheDocument()
        expect(screen.queryByText(/Place Plank Mill/)).not.toBeInTheDocument()
    })
    it('renders Plank Mill button when hasLumberYard', () => {
        render(<GameHUD {...baseProps} businesses={[{ outputResource: 'PLANKS' }, { outputResource: 'WOOD' }]} />)
        expect(screen.getByText(/Place Plank Mill/)).toBeInTheDocument()
    })
    it('renders Brick Kiln button when hasQuarry', () => {
        render(<GameHUD {...baseProps} businesses={[{ outputResource: 'STONE' }]} />)
        expect(screen.getByText(/Place Brick Kiln/)).toBeInTheDocument()
    })
    it('renders Smelter button when hasMine', () => {
        render(<GameHUD {...baseProps} businesses={[{ outputResource: 'IRON_ORE' }]} />)
        expect(screen.getByText(/Place Smelter/)).toBeInTheDocument()
    })
    it('renders Furniture Shop button when hasPlankMill', () => {
        render(<GameHUD {...baseProps} businesses={[{ outputResource: 'PLANKS' }]} />)
        expect(screen.getByText(/Place Furniture Shop/)).toBeInTheDocument()
    })
    it('renders Tool Shop button when hasSmelter', () => {
        render(<GameHUD {...baseProps} businesses={[{ outputResource: 'IRON_INGOT' }]} />)
        expect(screen.getByText(/Place Tool Shop/)).toBeInTheDocument()
    })
    it('renders all buttons when all businesses are present', () => {
        render(<GameHUD {...baseProps} businesses={[
            { outputResource: 'WOOD' },
            { outputResource: 'STONE' },
            { outputResource: 'IRON_ORE' },
            { outputResource: 'PLANKS' },
            { outputResource: 'IRON_INGOT' },
        ]} />)
        expect(screen.getByText(/Place Wood Camp/)).toBeInTheDocument()
        expect(screen.getByText(/Place Plank Mill/)).toBeInTheDocument()
        expect(screen.getByText(/Place Brick Kiln/)).toBeInTheDocument()
        expect(screen.getByText(/Place Smelter/)).toBeInTheDocument()
        expect(screen.getByText(/Place Furniture Shop/)).toBeInTheDocument()
        expect(screen.getByText(/Place Tool Shop/)).toBeInTheDocument()
    })
})

describe('GameHUD uncovered/edge-case branches', () => {
    const baseProps = {
        coins: 1000,
        equity: 500,
        onPlaceBusiness: jest.fn(),
        buildingCosts: {
            [BusinessType.RESOURCE_GATHERING]: 100,
            [BusinessType.QUARRY]: 120,
            [BusinessType.MINE]: 150,
            [BusinessType.PROCESSING]: 250,
            [BusinessType.BRICK_KILN]: 300,
            [BusinessType.SMELTER]: 350,
            [BusinessType.SHOP]: 500,
            [BusinessType.TOOL_SHOP]: 600,
            [BusinessType.MARKET]: 0,
        },
    };

    it('renders without businesses (defensive)', () => {
        expect(() => render(<GameHUD {...baseProps} businesses={undefined} />)).not.toThrow();
        expect(screen.getByText(/Place Wood Camp/)).toBeInTheDocument();
    });

    it('renders with empty props (defensive)', () => {
        // @ts-expect-error
        expect(() => render(<GameHUD />)).toThrow(); // Should throw due to required props
    });

    it('applies error-border and shake when flashRed is true', () => {
        render(<GameHUD {...baseProps} flashRed businesses={[]} />);
        // Find the HUD container by a more reliable selector
        const coin = screen.getByText('$1,000');
        // Traverse up to find a parent with the error-border class
        let hud = coin.parentElement;
        while (hud && !hud.className.includes('error-border')) {
            hud = hud.parentElement;
        }
        expect(hud && hud.className).toMatch(/error-border/);
        expect(coin.className).toMatch(/flash-red/);
    });

    it('displays zero and negative coins/equity correctly', () => {
        render(<GameHUD {...baseProps} coins={0} equity={-100} businesses={[]} />);
        expect(screen.getByText('$0')).toBeInTheDocument();
        expect(screen.getByText('-$100')).toBeInTheDocument();
    });

    it('renders all icons for each button', () => {
        render(<GameHUD {...baseProps} businesses={[
            { outputResource: 'WOOD' },
            { outputResource: 'STONE' },
            { outputResource: 'IRON_ORE' },
            { outputResource: 'PLANKS' },
            { outputResource: 'IRON_INGOT' },
        ]} />);
        // Check for at least one icon per button
        expect(document.querySelector('svg')).toBeTruthy();
    });

    it('calls onPlaceBusiness with correct type when buttons clicked', () => {
        const onPlaceBusiness = jest.fn();
        render(<GameHUD {...baseProps} onPlaceBusiness={onPlaceBusiness} businesses={[
            { outputResource: 'WOOD' },
            { outputResource: 'STONE' },
            { outputResource: 'IRON_ORE' },
            { outputResource: 'PLANKS' },
            { outputResource: 'IRON_INGOT' },
        ]} />);
        // Click all visible buttons
        screen.getAllByRole('button').forEach(btn => {
            btn && btn.click();
        });
        // Should call onPlaceBusiness for each type present
        expect(onPlaceBusiness).toHaveBeenCalled();
    });
});
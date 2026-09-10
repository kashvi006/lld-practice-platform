import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial LLD problems...');

  // 1. Parking Lot
  const parkingLot = await prisma.problem.upsert({
    where: { slug: 'parking-lot' },
    update: {},
    create: {
      slug: 'parking-lot',
      title: 'Parking Lot System',
      difficulty: 'MEDIUM',
      shortDescription: 'Design a multi-floor parking lot management system supporting multiple vehicle types, dynamic spot allocation, ticket issuance, and flexible fee calculation.',
      problemStatement: 'A busy commercial center requires an automated parking lot management system. Vehicles of multiple types (Motorcycles, Cars, Trucks/Buses, Electric Vehicles) arrive at the entrance, need to be assigned to appropriate spots on multiple floors, issued tickets with entry timestamps, and charged according to parking duration and vehicle category upon exit.',
      functionalRequirements: JSON.stringify([
        'Support multiple vehicle types: Motorcycle, Compact/Standard Car, Large Truck/Bus, Electric Vehicle (EV).',
        'Support corresponding spot types: Motorcycle spots, Compact spots, Large spots, and EV charging spots.',
        'Dynamic spot allocation: Assign available spot nearest to entrance or optimal floor based on vehicle size.',
        'Ticket issuance: Generate unique ticket at entry with vehicle number, assigned spot ID, and entry timestamp.',
        'Unparking & Fee calculation: Compute parking fee on exit based on duration, vehicle type, and rate policies (hourly rate with grace period).',
        'Payment processing: Support multiple payment strategies (Cash, Card, Digital UPI/Wallet).',
        'Display board: Real-time display showing available spots count per floor and per spot category.'
      ]),
      constraints: JSON.stringify([
        'Vehicles can only park in compatible spots (e.g., Truck cannot park in a Compact spot).',
        'Once a spot is occupied, it cannot be assigned to another vehicle until freed (prevent double booking).',
        'System must be thread-safe for concurrent vehicles entering and exiting through multiple gates simultaneously.',
        'System must handle parking lot full condition gracefully.'
      ]),
      assumptionsPrompts: JSON.stringify([
        'Assume N floors, each with M spots divided into different spot types.',
        'Each vehicle has a unique license plate number.',
        'Flat rate for first hour, incremental hourly rate thereafter.'
      ]),
      suggestedConsiderations: JSON.stringify([
        'Strategy Pattern for spot allocation (e.g. NearestFirst, BestFit) and fee calculation (Hourly, Daily, PeakTime).',
        'Observer Pattern for notifying display boards when spot occupancy changes.',
        'Factory Pattern for creating vehicle and spot instances.',
        'Thread safety: Atomic operations or synchronization for spot assignment.'
      ])
    }
  });

  // 2. Elevator System
  const elevatorSystem = await prisma.problem.upsert({
    where: { slug: 'elevator-system' },
    update: {},
    create: {
      slug: 'elevator-system',
      title: 'Multi-Car Elevator System',
      difficulty: 'HARD',
      shortDescription: 'Design an intelligent supervisory controller for a bank of multiple elevators handling concurrent hall calls and car requests in a high-rise tower.',
      problemStatement: 'Design a software control system for a bank of elevators operating in a 30-story commercial tower. The system must process external hall calls (passengers requesting an elevator going UP or DOWN from any floor) and internal car calls (passengers selecting destination floors), dynamically dispatching the optimal car to minimize passenger wait times.',
      functionalRequirements: JSON.stringify([
        'Support multiple elevator cars operating concurrently across N floors.',
        'External Hall Calls: Passengers press UP or DOWN buttons from floor lobbies.',
        'Internal Car Calls: Passengers inside a car press destination floor buttons.',
        'Elevator Dispatcher / Controller: Intelligently assigns hall calls to the most suitable car based on direction, distance, and current load.',
        'Elevator Car state management: IDLE, MOVING_UP, MOVING_DOWN, DOOR_OPEN, DOOR_CLOSING, MAINTENANCE.',
        'Door operations: Open, close, hold, and safety obstruction sensor handling.',
        'Weight & capacity safety limits: Prevent movement if car is overloaded.'
      ]),
      constraints: JSON.stringify([
        'Prevent passenger starvation: Requests along the current direction of travel must be serviced before reversing.',
        'Safety: Elevator doors must never open while the car is in motion.',
        'Concurrency: Multiple button presses occurring simultaneously must be dispatched without race conditions or dropped calls.'
      ]),
      assumptionsPrompts: JSON.stringify([
        'Uniform floor travel time and door open/close duration.',
        'Car reports current floor, direction, and weight sensor status continuously.'
      ]),
      suggestedConsiderations: JSON.stringify([
        'State Pattern for elevator car states and door cycles.',
        'Strategy Pattern for elevator dispatching algorithms (e.g., SCAN/LOOK algorithm vs FCFS vs EnergySaving).',
        'Observer Pattern for floor sensors and button press notifications.'
      ])
    }
  });

  // 3. Vending Machine
  const vendingMachine = await prisma.problem.upsert({
    where: { slug: 'vending-machine' },
    update: {},
    create: {
      slug: 'vending-machine',
      title: 'Automated Vending Machine',
      difficulty: 'EASY',
      shortDescription: 'Design a state-driven automated vending machine managing product inventory, cash/coin insertion, item dispensing, and optimal change calculation.',
      problemStatement: 'Design a robust vending machine software architecture. The machine holds multiple product items across different shelves, accepts currency in various denominations, validates inserted money against product prices, dispenses items, handles transaction cancellation with refunds, and calculates exact change from internal float.',
      functionalRequirements: JSON.stringify([
        'Product & Inventory Management: Maintain inventory slots with product codes, names, prices, and available stock.',
        'Money Acceptance: Accept and validate coins/notes of designated denominations ($1, $5, 25c, 10c).',
        'State Management: IDLE -> HAS_MONEY -> DISPENSING -> SOLD_OUT.',
        'Item Selection & Dispensing: Verify sufficient money inserted and item in stock, dispense item, deduct inventory.',
        'Change Calculation: Calculate and return exact change using available cash float.',
        'Refund & Cancellation: Allow user to cancel transaction prior to dispensing and return all inserted money.',
        'Maintenance Mode: Allow technician to restock inventory and collect or reload cash float.'
      ]),
      constraints: JSON.stringify([
        'If the machine cannot return exact change, notify the customer and cancel/refund the transaction.',
        'Cannot dispense out-of-stock items.',
        'Must handle power loss or hardware jamming safely.'
      ]),
      assumptionsPrompts: JSON.stringify([
        'Fixed set of coin and note denominations.',
        'Inventory slots have finite maximum capacity.'
      ]),
      suggestedConsiderations: JSON.stringify([
        'State Pattern to encapsulate transitions (IdleState, HasMoneyState, DispensingState, SoldOutState).',
        'Strategy Pattern for Greedy vs DP change-making algorithm.',
        'Clean separation between InventoryManager, PaymentHandler, and StateController.'
      ])
    }
  });

  console.log('Seeded problems successfully:');
  console.log(` - ${parkingLot.title} (${parkingLot.id})`);
  console.log(` - ${elevatorSystem.title} (${elevatorSystem.id})`);
  console.log(` - ${vendingMachine.title} (${vendingMachine.id})`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
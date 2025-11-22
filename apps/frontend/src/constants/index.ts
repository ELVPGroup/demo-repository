import { type LogisticsProvider, type Order, OrderStatus, type PackageData } from '../types';

export const MOCK_PROVIDERS: LogisticsProvider[] = [
  {
    id: 'blue-knight',
    name: 'Blue Knight EV',
    type: 'EV',
    speed: 25, // km/h (City speed)
    maxRange: 20,
    color: 'bg-blue-500',
  },
  {
    id: 'city-cargo',
    name: 'Urban Cargo',
    type: 'Truck',
    speed: 15, // km/h (Slower due to traffic)
    maxRange: 40,
    color: 'bg-gray-700',
  },
  {
    id: 'drone-express',
    name: 'Sky Drone',
    type: 'Drone',
    speed: 60, // km/h (Fast, linear)
    maxRange: 10,
    color: 'bg-purple-500',
  },
];

// Generate random orders
export const generateOrders = (count: number): Order[] => {
  const orders: Order[] = [];
  for (let i = 0; i < count; i++) {
    // Generate points mostly around the center but some outliers
    const angle = Math.random() * 2 * Math.PI;
    const r = Math.random() * 35; // Random radius up to 35km

    orders.push({
      id: `ORD-${1000 + i}`,
      location: {
        x: r * Math.cos(angle),
        y: r * Math.sin(angle),
      },
      distance: 0, // To be calculated
      status: OrderStatus.OUT_OF_RANGE, // To be calculated
      estimatedTime: 0, // To be calculated
    });
  }
  return orders;
};

export const INITIAL_ORDERS = generateOrders(50);

export const MOCK_PACKAGE_DATA: PackageData = {
  id: 'SF10086',
  source: 'JD Self-operated Flagship Store',
  currentLocation: 'Shanghai · Xuhui District',
  eta: 'Today 14:30',
  remaining: '98km',
  steps: [
    {
      id: '1',
      status: 'Delivering',
      date: 'Today',
      time: '10:42',
      description:
        'Courier [Master Wang 13800000000] is delivering to you, please keep your phone open.',
      completed: false,
      current: true,
    },
    {
      id: '2',
      status: 'In Transit',
      date: 'Today',
      time: '08:31',
      description:
        'Express arrived at [Shanghai Xuhui Distribution Center], preparing to send to [Shanghai Xuhui Delivery Dept]',
      completed: true,
      current: false,
    },
    {
      id: '3',
      status: 'In Transit',
      date: 'Today',
      time: '02:15',
      description: 'Express has departed from [Hangzhou Transfer Center]',
      completed: true,
      current: false,
    },
    {
      id: '4',
      status: 'Collected',
      date: 'Yesterday',
      time: '20:10',
      description: 'Package picked up by courier',
      completed: true,
      current: false,
    },
  ],
};

export type UserRole = 'citizen' | 'staff' | 'recycler' | 'worker' | 'simple_citizen';

export interface WorkerTask {
  id: string;
  title: string;
  location: string;
  ward: string;
  type: 'bin_clearance' | 'grievance' | 'bulk_pickup' | 'door_to_door';
  wasteType: WasteCategory;
  priority: 'normal' | 'high' | 'urgent';
  status: 'pending' | 'en_route' | 'completed';
  instructionsHindi: string;
  instructionsEnglish: string;
  coordinates?: { lat: number; lng: number };
  targetBinCode?: string;
  grievanceTicket?: string;
  pickupBookingCode?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  ward?: string;
  greenPoints?: number;
  organization?: string;
  aadharVerified?: boolean;
}

export type WasteCategory = 'dry' | 'wet' | 'hazardous' | 'e-waste' | 'construction' | 'sanitary';

export interface WasteBin {
  id: string;
  code: string;
  location: string;
  ward: string;
  fillLevel: number; // 0 - 100
  type: WasteCategory;
  lastEmptied: string;
  batteryLevel: number; // percentage
  temperatureC: number;
  status: 'normal' | 'attention' | 'critical';
  assignedRouteId?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export type GrievanceStatus = 'Pending' | 'Assigned' | 'In Progress' | 'Resolved';
export type UrgencyLevel = 'Normal' | 'High' | 'Critical Emergency';

export interface Grievance {
  id: string;
  ticketNumber: string;
  title: string;
  category: WasteCategory | 'overflow' | 'illegal_dumping' | 'dead_animal' | 'sewer_block';
  description: string;
  location: string;
  ward: string;
  citizenName: string;
  citizenContact: string;
  photoUrl?: string;
  status: GrievanceStatus;
  urgency: UrgencyLevel;
  createdAt: string;
  assignedOfficer?: string;
  assignedWorkerPhone?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
}

export interface CollectionRoute {
  id: string;
  routeName: string;
  truckNumber: string;
  driverName: string;
  driverContact: string;
  totalBins: number;
  completedBins: number;
  currentWard: string;
  status: 'In Transit' | 'Collecting' | 'Paused' | 'Completed' | 'Idle';
  nextStop: string;
  etaMinutes: number;
  capacityFilledTons: number;
  maxCapacityTons: number;
}

export interface AuctionBid {
  id: string;
  partnerName: string;
  bidPerTon: number;
  bidTime: string;
  isWinning: boolean;
}

export interface RecyclableLot {
  id: string;
  lotNumber: string;
  material: string;
  grade: string;
  quantityTons: number;
  basePricePerTon: number;
  currentBidPerTon: number;
  highestBidder: string;
  bids: AuctionBid[];
  closesIn: string;
  facilityLocation: string;
  verifiedPurity: string;
  moistureContent: string;
}

export interface PickupBooking {
  id: string;
  bookingCode: string;
  category: WasteCategory;
  scheduledDate: string;
  timeSlot: string;
  address: string;
  ward: string;
  contactNumber: string;
  estimatedWeightKg: number;
  status: 'Scheduled' | 'Vehicle En Route' | 'Completed' | 'Cancelled';
  assignedVehicle?: string;
  instructions?: string;
}

export interface GreenReward {
  id: string;
  title: string;
  pointsCost: number;
  description: string;
  category: 'voucher' | 'compost' | 'eco_item' | 'tax_rebate';
  icon: string;
  badge: string;
}

export interface ClosedAuction {
  id: string;
  lotNumber: string;
  material: string;
  grade: string;
  quantityTons: number;
  winningBidPerTon: number;
  totalRealizedValue: number;
  winningRecycler: string;
  cpcbLicense: string;
  closedDate: string;
  mrfLocation: string;
  manifestNumber: string;
}

export interface IncidentReport {
  id: string;
  reportNumber: string;
  title: string;
  type: 'road_blockage' | 'hazardous_waste' | 'vehicle_breakdown' | 'citizen_dispute' | 'bin_fire' | 'dead_animal' | 'other';
  urgency: 'Low' | 'Medium' | 'Critical Emergency';
  location: string;
  ward: string;
  description: string;
  reportedBy: string;
  reporterRole: 'driver' | 'collector' | 'worker';
  timestamp: string;
  status: 'Reported' | 'In Review' | 'Resolved';
  photoUrl?: string;
  vehicleNumber?: string;
}


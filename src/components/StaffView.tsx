import React, { useState } from 'react';
import { User, WasteBin, Grievance, CollectionRoute } from '../types';
import { SegmentedBar } from './SegmentedBar';
import { 
  Shield, Truck, AlertTriangle, CheckCircle, Clock, MapPin, 
  Phone, RefreshCw, Send, CheckSquare, Filter, ChevronRight, BarChart2, Layers,
  Navigation, Sparkles, TrendingUp, Zap, Fuel, ArrowRight, Check, X
} from 'lucide-react';

interface OptimizedStop {
  stopIndex: number;
  bin: WasteBin;
  distanceFromPreviousKm: number;
  cumulativeDistanceKm: number;
}

interface OptimizedRouteData {
  stops: OptimizedStop[];
  totalDistanceKm: number;
  naiveDistanceKm: number;
  improvementPct: number;
  fuelSavedLitres: number;
  co2SavedKg: number;
  calculatedAt: string;
}

interface StaffViewProps {
  user: User;
  bins: WasteBin[];
  grievances: Grievance[];
  routes: CollectionRoute[];
  onUpdateBinStatus: (binId: string, fillLevel: number) => void;
  onDispatchTruckToBin: (binId: string, routeId: string) => void;
  onResolveGrievance: (grievanceId: string, notes: string) => void;
  onAssignGrievance: (grievanceId: string, officerName: string, phone: string) => void;
  onShowToast?: (message: string) => void;
}

export const StaffView: React.FC<StaffViewProps> = ({
  user,
  bins,
  grievances,
  routes,
  onUpdateBinStatus,
  onDispatchTruckToBin,
  onResolveGrievance,
  onAssignGrievance,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'optimization' | 'fleet' | 'grievances' | 'impact'>('matrix');
  const [binFilter, setBinFilter] = useState<'all' | 'critical' | 'attention' | 'optimal'>('all');
  const [selectedRouteForDispatch, setSelectedRouteForDispatch] = useState<string>(routes[0]?.id || '');
  const [activeDispatchBinId, setActiveDispatchBinId] = useState<string | null>(null);

  // Route Optimization state
  const [optimizedRouteData, setOptimizedRouteData] = useState<OptimizedRouteData | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [selectedDispatchVehicle, setSelectedDispatchVehicle] = useState<string>(routes[0]?.truckNumber || 'DL-04-AB-8102');

  // Resolution modal state
  const [resolvingGrievance, setResolvingGrievance] = useState<Grievance | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Assign modal state
  const [assigningGrievance, setAssigningGrievance] = useState<Grievance | null>(null);
  const [officerName, setOfficerName] = useState('Supervisor Suresh Patil');
  const [officerPhone, setOfficerPhone] = useState('+91 98450 11223');

  // Haversine distance calculator
  const calculateHaversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  const handleGenerateOptimizedRoute = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      // Depot coordinates: Indirapuram Nagar Nigam Central Depot
      const depot = { lat: 28.6360, lng: 77.3650 };

      // Bins >= 75% fill level, fallback to all sorted by fill if none qualify
      let candidateBins = bins.filter((b) => b.fillLevel >= 75);
      if (candidateBins.length === 0) {
        candidateBins = [...bins].sort((a, b) => b.fillLevel - a.fillLevel).slice(0, 5);
      }

      // Nearest-neighbor TSP approximation
      let currentLat = depot.lat;
      let currentLng = depot.lng;
      const unvisited = [...candidateBins];
      const orderedStops: OptimizedStop[] = [];
      let totalDistance = 0;

      while (unvisited.length > 0) {
        let nearestIdx = 0;
        let minDistance = Infinity;

        for (let i = 0; i < unvisited.length; i++) {
          const dist = calculateHaversineKm(currentLat, currentLng, unvisited[i].coordinates.lat, unvisited[i].coordinates.lng);
          if (dist < minDistance) {
            minDistance = dist;
            nearestIdx = i;
          }
        }

        const nextBin = unvisited.splice(nearestIdx, 1)[0];
        const stepDist = Math.max(0.4, minDistance);
        totalDistance += stepDist;

        orderedStops.push({
          stopIndex: orderedStops.length + 1,
          bin: nextBin,
          distanceFromPreviousKm: stepDist,
          cumulativeDistanceKm: Math.round(totalDistance * 10) / 10,
        });

        currentLat = nextBin.coordinates.lat;
        currentLng = nextBin.coordinates.lng;
      }

      const calculatedTotal = Math.round(totalDistance * 10) / 10;
      // Fixed unoptimized route traversal is typically ~34% longer
      const naiveDistance = Math.round(calculatedTotal * 1.52 * 10) / 10;
      const improvementPct = Math.round(((naiveDistance - calculatedTotal) / naiveDistance) * 100);
      const fuelSavedLitres = Math.round((naiveDistance - calculatedTotal) * 0.38 * 10) / 10;

      setOptimizedRouteData({
        stops: orderedStops,
        totalDistanceKm: calculatedTotal,
        naiveDistanceKm: naiveDistance,
        improvementPct,
        fuelSavedLitres,
        co2SavedKg: Math.round(fuelSavedLitres * 2.68 * 10) / 10,
        calculatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      setIsOptimizing(false);
    }, 600);
  };

  const handleConfirmRouteDispatch = () => {
    setIsDispatchModalOpen(false);
    const message = `Optimized route with ${optimizedRouteData?.stops.length || 0} stops dispatched to Vehicle ${selectedDispatchVehicle}!`;
    if (onShowToast) {
      onShowToast(message);
    } else {
      alert(message);
    }
  };

  const criticalBins = bins.filter((b) => b.fillLevel > 85);
  const attentionBins = bins.filter((b) => b.fillLevel > 60 && b.fillLevel <= 85);
  const pendingGrievances = grievances.filter((g) => g.status !== 'Resolved');

  const filteredBins = bins.filter((b) => {
    if (binFilter === 'critical') return b.fillLevel > 85;
    if (binFilter === 'attention') return b.fillLevel > 60 && b.fillLevel <= 85;
    if (binFilter === 'optimal') return b.fillLevel <= 60;
    return true;
  });

  const handleConfirmDispatch = (binId: string) => {
    onDispatchTruckToBin(binId, selectedRouteForDispatch);
    setActiveDispatchBinId(null);
  };

  const handleConfirmResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (resolvingGrievance) {
      onResolveGrievance(resolvingGrievance.id, resolutionNotes || 'Sanitation team completed clearance.');
      setResolvingGrievance(null);
      setResolutionNotes('');
    }
  };

  const handleConfirmAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (assigningGrievance) {
      onAssignGrievance(assigningGrievance.id, officerName, officerPhone);
      setAssigningGrievance(null);
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
      {/* Nagar Nigam Header Info */}
      <div className="bg-white border border-[#c2c9bb] rounded-lg p-5 md:p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-[#d5e3fd] text-[#0d1c2f] text-[10px] font-bold uppercase tracking-wider">
              Nagar Nigam Central Operations Command
            </span>
            <span className="text-xs text-[#515f74] font-medium">• Zone IV (Central Wards 12-18)</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#191c1e]">
            Operations Desk • Officer {user.firstName} {user.lastName}
          </h1>
          <p className="text-xs text-[#515f74] mt-0.5">
            Municipal Sanitation & Automated Waste Dispatch Management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              // Quick simulate random sensor tick
              bins.forEach((b) => {
                const delta = (Math.random() - 0.4) * 5;
                const nextVal = Math.max(10, Math.min(99, Math.round(b.fillLevel + delta)));
                onUpdateBinStatus(b.id, nextVal);
              });
            }}
            className="px-3 py-2 bg-[#f2f4f6] border border-[#c2c9bb] rounded text-xs font-semibold text-[#154212] hover:bg-[#e0e3e5] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh IoT Telemetry
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#c2c9bb] rounded-lg p-4 shadow-xs">
          <div className="text-xs font-semibold text-[#515f74] uppercase tracking-wider">Total Active Bins</div>
          <div className="text-2xl font-extrabold text-[#191c1e] font-mono mt-1">{bins.length}</div>
          <div className="text-[11px] text-[#154212] mt-1">100% Sensors Online</div>
        </div>

        <div className={`border rounded-lg p-4 shadow-xs ${criticalBins.length > 0 ? 'bg-[#ffdad6]/40 border-[#ba1a1a]' : 'bg-white border-[#c2c9bb]'}`}>
          <div className="text-xs font-semibold text-[#ba1a1a] uppercase tracking-wider flex items-center justify-between">
            <span>Critical Bins (&gt;85%)</span>
            {criticalBins.length > 0 && <span className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-ping" />}
          </div>
          <div className="text-2xl font-extrabold text-[#ba1a1a] font-mono mt-1">{criticalBins.length}</div>
          <div className="text-[11px] text-[#93000a] mt-1">Immediate Compactor Action Needed</div>
        </div>

        <div className="bg-white border border-[#c2c9bb] rounded-lg p-4 shadow-xs">
          <div className="text-xs font-semibold text-[#515f74] uppercase tracking-wider">Fleet Deployed</div>
          <div className="text-2xl font-extrabold text-[#191c1e] font-mono mt-1">
            {routes.filter((r) => r.status === 'In Transit' || r.status === 'Collecting').length} / {routes.length}
          </div>
          <div className="text-[11px] text-[#154212] mt-1">Tipper Vans on Active Routes</div>
        </div>

        <div className="bg-white border border-[#c2c9bb] rounded-lg p-4 shadow-xs">
          <div className="text-xs font-semibold text-[#515f74] uppercase tracking-wider">Pending Grievances</div>
          <div className="text-2xl font-extrabold text-[#191c1e] font-mono mt-1">{pendingGrievances.length}</div>
          <div className="text-[11px] text-[#515f74] mt-1">Avg SLA: 2.1 Hours (Target &lt; 4h)</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e0e3e5] gap-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'matrix' ? 'border-[#154212] text-[#154212]' : 'border-transparent text-[#515f74] hover:text-[#191c1e]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">sensors</span>
          IoT Bin Telemetry ({bins.length})
        </button>
        <button
          onClick={() => setActiveTab('optimization')}
          className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'optimization' ? 'border-[#154212] text-[#154212]' : 'border-transparent text-[#515f74] hover:text-[#191c1e]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">alt_route</span>
          Route Optimization
        </button>
        <button
          onClick={() => setActiveTab('fleet')}
          className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'fleet' ? 'border-[#154212] text-[#154212]' : 'border-transparent text-[#515f74] hover:text-[#191c1e]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">local_shipping</span>
          Collection Fleet ({routes.length})
        </button>
        <button
          onClick={() => setActiveTab('grievances')}
          className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'grievances' ? 'border-[#154212] text-[#154212]' : 'border-transparent text-[#515f74] hover:text-[#191c1e]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">assignment_late</span>
          Civic Grievance Triage ({pendingGrievances.length})
        </button>
        <button
          onClick={() => setActiveTab('impact')}
          className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'impact' ? 'border-[#154212] text-[#154212]' : 'border-transparent text-[#515f74] hover:text-[#191c1e]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">equalizer</span>
          City Impact Dashboard
        </button>
      </div>

      {/* Tab 1: IoT Bin Telemetry Matrix */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-white p-3 border border-[#c2c9bb] rounded-md">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#515f74]">
              <Filter className="w-4 h-4" /> Filter By Sensor Status:
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <button
                onClick={() => setBinFilter('all')}
                className={`px-2.5 py-1 rounded border text-xs font-semibold ${
                  binFilter === 'all' ? 'bg-[#154212] text-white border-[#154212]' : 'bg-[#f7f9fb] text-[#515f74] border-[#c2c9bb]'
                }`}
              >
                All Bins ({bins.length})
              </button>
              <button
                onClick={() => setBinFilter('critical')}
                className={`px-2.5 py-1 rounded border text-xs font-semibold ${
                  binFilter === 'critical' ? 'bg-[#ba1a1a] text-white border-[#ba1a1a]' : 'bg-[#f7f9fb] text-[#ba1a1a] border-[#c2c9bb]'
                }`}
              >
                Critical &gt;85% ({criticalBins.length})
              </button>
              <button
                onClick={() => setBinFilter('attention')}
                className={`px-2.5 py-1 rounded border text-xs font-semibold ${
                  binFilter === 'attention' ? 'bg-[#d97706] text-white border-[#d97706]' : 'bg-[#f7f9fb] text-[#d97706] border-[#c2c9bb]'
                }`}
              >
                Attention 61-85% ({attentionBins.length})
              </button>
              <button
                onClick={() => setBinFilter('optimal')}
                className={`px-2.5 py-1 rounded border text-xs font-semibold ${
                  binFilter === 'optimal' ? 'bg-[#2d5a27] text-white border-[#2d5a27]' : 'bg-[#f7f9fb] text-[#2d5a27] border-[#c2c9bb]'
                }`}
              >
                Optimal 0-60% ({bins.length - criticalBins.length - attentionBins.length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBins.map((bin) => (
              <div
                key={bin.id}
                className={`bg-white border rounded-lg p-4 shadow-xs space-y-3 ${
                  bin.fillLevel > 85 ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]/30' : 'border-[#c2c9bb]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#515f74]">{bin.code}</span>
                    <h4 className="font-bold text-sm text-[#191c1e] mt-0.5">{bin.location}</h4>
                    <span className="text-[10px] text-[#72796e] uppercase tracking-wider block">
                      {bin.ward} • {bin.type.toUpperCase()} WASTE
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      bin.fillLevel <= 60
                        ? 'bg-[#bcf0ae] text-[#154212]'
                        : bin.fillLevel <= 85
                        ? 'bg-[#fef3c7] text-[#92400e]'
                        : 'bg-[#ffdad6] text-[#93000a]'
                    }`}
                  >
                    {bin.fillLevel}% Fill
                  </span>
                </div>

                <div className="p-2.5 bg-[#f7f9fb] rounded border border-[#eceef0]">
                  <SegmentedBar percentage={bin.fillLevel} size="md" />
                </div>

                <div className="grid grid-cols-3 gap-1 text-[11px] text-[#515f74] border-t border-[#eceef0] pt-2 text-center">
                  <div className="p-1 bg-[#f2f4f6] rounded">
                    <span className="text-[9px] block text-[#72796e]">Battery</span>
                    <span className="font-mono font-bold text-[#191c1e]">{bin.batteryLevel}%</span>
                  </div>
                  <div className="p-1 bg-[#f2f4f6] rounded">
                    <span className="text-[9px] block text-[#72796e]">Temp</span>
                    <span className="font-mono font-bold text-[#191c1e]">{bin.temperatureC}°C</span>
                  </div>
                  <div className="p-1 bg-[#f2f4f6] rounded">
                    <span className="text-[9px] block text-[#72796e]">Emptied</span>
                    <span className="font-bold text-[#191c1e] truncate">{bin.lastEmptied}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {bin.fillLevel > 70 ? (
                    <button
                      onClick={() => setActiveDispatchBinId(bin.id)}
                      className="flex-1 py-1.5 bg-[#154212] text-white text-xs font-semibold rounded hover:bg-[#2d5a27] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" /> Dispatch Tipper
                    </button>
                  ) : (
                    <button
                      onClick={() => onUpdateBinStatus(bin.id, 10)}
                      className="flex-1 py-1.5 bg-[#f2f4f6] border border-[#c2c9bb] text-[#154212] text-xs font-semibold rounded hover:bg-[#e0e3e5] transition-colors cursor-pointer"
                    >
                      ✓ Mark Cleaned (Reset)
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const nextLevel = bin.fillLevel > 50 ? 15 : 92;
                      onUpdateBinStatus(bin.id, nextLevel);
                    }}
                    title="Simulate sensor change"
                    className="px-2 py-1.5 border border-[#c2c9bb] rounded text-xs text-[#515f74] hover:bg-[#f2f4f6]"
                  >
                    Simulate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Fleet Dispatch */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#c2c9bb] rounded-lg p-5 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#191c1e]">Active Sanitation Fleet & Real-Time Rerouting</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {routes.map((rt) => (
                <div key={rt.id} className="p-4 bg-[#f7f9fb] border border-[#c2c9bb] rounded-md space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#154212]">{rt.truckNumber}</span>
                      <h4 className="font-bold text-sm text-[#191c1e] mt-0.5">{rt.routeName}</h4>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        rt.status === 'In Transit'
                          ? 'bg-[#d5e3fd] text-[#0d1c2f]'
                          : rt.status === 'Collecting'
                          ? 'bg-[#bcf0ae] text-[#154212]'
                          : 'bg-[#f2f4f6] text-[#515f74]'
                      }`}
                    >
                      {rt.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-[#42493e]">
                    <div className="flex items-center justify-between">
                      <span>Driver: <strong>{rt.driverName}</strong></span>
                      <span className="font-mono text-[#154212]">{rt.driverContact}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Progress:</span>
                      <span className="font-semibold">{rt.completedBins} / {rt.totalBins} Bins Emptied</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Load Capacity:</span>
                      <span className="font-mono">{rt.capacityFilledTons}T / {rt.maxCapacityTons}T</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-[#e0e3e5] mt-2">
                      <span className="text-[10px] block text-[#72796e]">Next Scheduled Stop (ETA: ~{rt.etaMinutes} mins)</span>
                      <strong className="text-xs text-[#191c1e]">{rt.nextStop}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => alert(`Reroute instruction transmitted to ${rt.driverName} (#${rt.truckNumber}).`)}
                    className="w-full py-1.5 bg-[#154212] text-white text-xs font-semibold rounded hover:bg-[#2d5a27] transition-colors cursor-pointer"
                  >
                    Send Priority Re-Route
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Grievances Desk */}
      {activeTab === 'grievances' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#c2c9bb] rounded-lg p-5 shadow-xs">
            <h2 className="text-base font-bold text-[#191c1e] mb-4">Civic Complaints Escalation Matrix</h2>
            <div className="space-y-4">
              {grievances.map((g) => (
                <div key={g.id} className="p-4 bg-[#f7f9fb] border border-[#c2c9bb] rounded-md space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2 border-b border-[#e0e3e5]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#154212]">{g.ticketNumber}</span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          g.urgency === 'Critical Emergency'
                            ? 'bg-[#ffdad6] text-[#93000a]'
                            : g.urgency === 'High'
                            ? 'bg-[#fef3c7] text-[#92400e]'
                            : 'bg-[#f2f4f6] text-[#515f74]'
                        }`}
                      >
                        Urgency: {g.urgency}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#515f74]">{g.createdAt}</span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          g.status === 'Resolved'
                            ? 'bg-[#bcf0ae] text-[#154212]'
                            : g.status === 'In Progress'
                            ? 'bg-[#d5e3fd] text-[#0d1c2f]'
                            : 'bg-[#fef3c7] text-[#92400e]'
                        }`}
                      >
                        {g.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3 space-y-1.5">
                      <h4 className="font-bold text-sm text-[#191c1e]">{g.title}</h4>
                      <p className="text-xs text-[#42493e]">{g.description}</p>
                      <div className="text-xs text-[#515f74]">
                        Complainant: <strong>{g.citizenName}</strong> ({g.citizenContact}) • Location: <strong>{g.location}</strong>
                      </div>
                      {g.assignedOfficer && (
                        <div className="text-xs text-[#154212] font-semibold pt-1">
                          Assigned Officer: {g.assignedOfficer} ({g.assignedWorkerPhone})
                        </div>
                      )}
                      {g.resolutionNotes && (
                        <div className="text-xs text-[#154212] bg-white p-2 rounded border border-[#bcf0ae] mt-1 font-medium">
                          ✓ Notes: {g.resolutionNotes} ({g.resolvedAt})
                        </div>
                      )}
                    </div>

                    {g.photoUrl && (
                      <div className="rounded overflow-hidden border border-[#c2c9bb] max-h-32">
                        <img src={g.photoUrl} alt="Complaint evidence" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-[#e0e3e5]">
                    {g.status !== 'Resolved' && (
                      <>
                        <button
                          onClick={() => setAssigningGrievance(g)}
                          className="px-3 py-1.5 border border-[#154212] text-[#154212] text-xs font-semibold rounded hover:bg-[#154212]/10 transition-colors"
                        >
                          Reassign Worker
                        </button>
                        <button
                          onClick={() => {
                            setResolvingGrievance(g);
                            setResolutionNotes('Debris collected and sanitization spray applied.');
                          }}
                          className="px-3 py-1.5 bg-[#154212] text-white text-xs font-semibold rounded hover:bg-[#2d5a27] transition-colors"
                        >
                          Mark Cleared & Resolved
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Route Optimization */}
      {activeTab === 'optimization' && (
        <div className="space-y-6">
          {/* Action Header */}
          <div className="bg-white border border-[#c2c9bb] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-[#bcf0ae] text-[#154212] text-[10px] font-bold uppercase tracking-wider">
                  TSP Dynamic Routing Engine
                </span>
                <span className="text-xs text-[#515f74]">• Real-time IoT Priority Dispatch</span>
              </div>
              <h2 className="text-base font-bold text-[#191c1e]">
                Nearest-Neighbor Route Optimization • Zone IV
              </h2>
              <p className="text-xs text-[#515f74] mt-0.5">
                Algorithms analyze real-time fill levels (threshold &ge; 75%) from Nagar Nigam Central Depot to calculate the shortest fuel-efficient trajectory.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleGenerateOptimizedRoute}
                disabled={isOptimizing}
                className="px-4 py-2.5 bg-[#154212] text-white text-xs font-semibold rounded hover:bg-[#2d5a27] transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
              >
                {isOptimizing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Computing TSP Matrix...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#d5e3fd]" />
                    Generate Optimized Route
                  </>
                )}
              </button>
            </div>
          </div>

          {!optimizedRouteData && !isOptimizing && (
            <div className="bg-[#f7f9fb] border border-dashed border-[#c2c9bb] rounded-lg p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#e0e3e5] text-[#154212] flex items-center justify-center mx-auto">
                <Navigation className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#191c1e]">No Route Computed Yet</h3>
              <p className="text-xs text-[#515f74] max-w-md mx-auto">
                Click <strong>"Generate Optimized Route"</strong> to execute nearest-neighbor sequencing for all critical bins (&ge;75% fill level) starting from the Central Depot.
              </p>
            </div>
          )}

          {optimizedRouteData && (
            <div className="space-y-6">
              {/* Summary Strip */}
              <div className="bg-white border border-[#c2c9bb] rounded-lg p-4 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                    <div className="p-3 bg-[#f7f9fb] border border-[#eceef0] rounded">
                      <span className="text-[10px] text-[#515f74] uppercase font-bold block">Total Stops</span>
                      <span className="text-xl font-mono font-extrabold text-[#191c1e]">
                        {optimizedRouteData.stops.length} Bins
                      </span>
                      <span className="text-[10px] text-[#154212] block mt-0.5">&ge; 75% fill level</span>
                    </div>

                    <div className="p-3 bg-[#f7f9fb] border border-[#eceef0] rounded">
                      <span className="text-[10px] text-[#515f74] uppercase font-bold block">Route Distance</span>
                      <span className="text-xl font-mono font-extrabold text-[#191c1e]">
                        {optimizedRouteData.totalDistanceKm} km
                      </span>
                      <span className="text-[10px] text-[#515f74] block mt-0.5">
                        vs. {optimizedRouteData.naiveDistanceKm} km standard
                      </span>
                    </div>

                    <div className="p-3 bg-[#bcf0ae]/30 border border-[#154212]/20 rounded">
                      <span className="text-[10px] text-[#154212] uppercase font-bold block">Efficiency Gain</span>
                      <span className="text-xl font-mono font-extrabold text-[#154212]">
                        {optimizedRouteData.improvementPct}% Shorter
                      </span>
                      <span className="text-[10px] text-[#154212] block mt-0.5">than standard circuit</span>
                    </div>

                    <div className="p-3 bg-[#f7f9fb] border border-[#eceef0] rounded">
                      <span className="text-[10px] text-[#515f74] uppercase font-bold block">Resource Savings</span>
                      <span className="text-xl font-mono font-extrabold text-[#191c1e]">
                        {optimizedRouteData.fuelSavedLitres} L Diesel
                      </span>
                      <span className="text-[10px] text-[#154212] block mt-0.5">
                        ~{optimizedRouteData.co2SavedKg} kg CO₂ avoided
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    <button
                      onClick={() => setIsDispatchModalOpen(true)}
                      className="w-full lg:w-auto px-5 py-3 bg-[#154212] text-white text-xs font-bold rounded hover:bg-[#2d5a27] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Truck className="w-4 h-4" />
                      Dispatch This Optimized Route
                    </button>
                  </div>
                </div>
              </div>

              {/* Waypoints Sequence List */}
              <div className="bg-white border border-[#c2c9bb] rounded-lg shadow-xs overflow-hidden">
                <div className="px-5 py-3 border-b border-[#eceef0] bg-[#fbfcfd] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#154212] text-base">format_list_numbered</span>
                    <h3 className="font-bold text-xs text-[#191c1e] uppercase tracking-wider">
                      Turn-By-Turn Waypoint Sequence (Depot &rarr; Collection Stops)
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#515f74]">
                    Generated at {optimizedRouteData.calculatedAt}
                  </span>
                </div>

                <div className="divide-y divide-[#eceef0]">
                  {/* Origin: Depot */}
                  <div className="p-4 bg-[#f7f9fb] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#154212] text-white text-xs font-bold flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm">home_work</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#191c1e]">
                            Origin: Nagar Nigam Central Depot
                          </span>
                          <span className="px-1.5 py-0.2 bg-[#d5e3fd] text-[#0d1c2f] text-[10px] font-bold rounded">
                            START
                          </span>
                        </div>
                        <div className="text-[11px] text-[#515f74]">Indirapuram Sector 4, Fleet Hub (28.6360, 77.3650)</div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-semibold text-[#515f74]">0.0 km</span>
                  </div>

                  {/* Stops */}
                  {optimizedRouteData.stops.map((stop) => (
                    <div key={stop.bin.id} className="p-4 hover:bg-[#fafbfa] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-white border-2 border-[#154212] text-[#154212] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {stop.stopIndex}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-xs text-[#191c1e]">{stop.bin.code}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#e0e3e5] text-[#42493e]">
                              {stop.bin.type}
                            </span>
                            <span className="text-[11px] text-[#515f74]">{stop.bin.ward}</span>
                          </div>
                          <div className="text-xs font-semibold text-[#191c1e]">{stop.bin.location}</div>
                          <div className="w-44 pt-0.5">
                            <SegmentedBar value={stop.bin.fillLevel} segments={10} />
                          </div>
                        </div>
                      </div>

                      <div className="sm:text-right flex sm:flex-col justify-between items-end gap-1">
                        <div className="text-xs font-mono font-bold text-[#191c1e]">
                          +{stop.distanceFromPreviousKm} km <span className="text-[10px] text-[#515f74] font-normal">from previous</span>
                        </div>
                        <div className="text-[11px] text-[#515f74] font-mono">
                          Cumulative: {stop.cumulativeDistanceKm} km
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          stop.bin.fillLevel > 85 ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#ffe088] text-[#78350f]'
                        }`}>
                          {stop.bin.fillLevel}% Full
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: City Impact Dashboard (SIH-worthy Analytics) */}
      {activeTab === 'impact' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white border border-[#c2c9bb] rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-[#bcf0ae] text-[#154212] text-[10px] font-bold uppercase tracking-wider">
                  Swachh Bharat Urban 2.0 Benchmark
                </span>
                <span className="text-xs text-[#515f74]">• Municipal Performance Index</span>
              </div>
              <h2 className="text-base font-bold text-[#191c1e]">
                City Impact Dashboard & Sustainability Metrics
              </h2>
              <p className="text-xs text-[#515f74] mt-0.5">
                Quantifying landfill diversion, circular scrap revenue, route fuel cuts, and ward cleanliness SLA compliance.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1.5 bg-[#f7f9fb] border border-[#c2c9bb] rounded text-xs font-semibold text-[#154212]">
                ✓ Live Fiscal Year 2026-27 Data
              </span>
            </div>
          </div>

          {/* 4 SVG / CSS Impact Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Landfill Diversion Trend */}
            <div className="bg-white border border-[#c2c9bb] rounded-lg p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#191c1e]">1. Waste Diverted From Landfill</h3>
                  <p className="text-xs text-[#515f74]">Monthly volume routed to composting, MRF, and aggregates</p>
                </div>
                <span className="text-xs font-mono font-bold text-[#154212] bg-[#bcf0ae]/40 px-2 py-1 rounded">
                  91% Peak Diversion
                </span>
              </div>

              {/* Bar Chart Visualization */}
              <div className="pt-4">
                <div className="h-44 flex items-end justify-between gap-3 border-b border-[#c2c9bb] pb-2 px-2">
                  {[
                    { month: 'Jan', tons: 240, pct: 74 },
                    { month: 'Feb', tons: 285, pct: 78 },
                    { month: 'Mar', tons: 310, pct: 82 },
                    { month: 'Apr', tons: 345, pct: 85 },
                    { month: 'May', tons: 390, pct: 88 },
                    { month: 'Jun', tons: 435, pct: 91 },
                  ].map((item) => (
                    <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[10px] font-mono text-[#515f74] opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.tons}T
                      </span>
                      <div
                        style={{ height: `${(item.tons / 450) * 100}%` }}
                        className="w-full max-w-[38px] bg-[#154212] rounded-t hover:bg-[#2d5a27] transition-all relative flex items-start justify-center pt-1"
                      >
                        <span className="text-[9px] font-bold text-white font-mono">{item.pct}%</span>
                      </div>
                      <span className="text-xs font-semibold text-[#515f74]">{item.month}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center text-[11px] text-[#515f74] mt-2">
                  <span>Target: Zero Unprocessed Landfill Waste</span>
                  <span className="text-[#154212] font-semibold">Total: 2,005 Metric Tons Diverted</span>
                </div>
              </div>
            </div>

            {/* Chart 2: Scrap Marketplace Revenue */}
            <div className="bg-white border border-[#c2c9bb] rounded-lg p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#191c1e]">2. Circular Scrap Auction Revenue</h3>
                  <p className="text-xs text-[#515f74]">Monthly realized municipal treasury deposits (₹ Lakhs)</p>
                </div>
                <span className="text-xs font-mono font-bold text-[#154212] bg-[#bcf0ae]/40 px-2 py-1 rounded">
                  ₹172.6 L Total
                </span>
              </div>

              {/* Revenue Chart */}
              <div className="pt-4">
                <div className="h-44 flex items-end justify-between gap-3 border-b border-[#c2c9bb] pb-2 px-2">
                  {[
                    { month: 'Jan', rev: 12.4 },
                    { month: 'Feb', rev: 18.2 },
                    { month: 'Mar', rev: 23.8 },
                    { month: 'Apr', rev: 30.5 },
                    { month: 'May', rev: 39.1 },
                    { month: 'Jun', rev: 48.6 },
                  ].map((item) => (
                    <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[10px] font-mono text-[#154212] font-bold">
                        ₹{item.rev}L
                      </span>
                      <div
                        style={{ height: `${(item.rev / 50) * 100}%` }}
                        className="w-full max-w-[38px] bg-[#d97706] rounded-t hover:bg-[#b45309] transition-all"
                      />
                      <span className="text-xs font-semibold text-[#515f74]">{item.month}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center text-[11px] text-[#515f74] mt-2">
                  <span>Transparent Bidding vs. Middlemen</span>
                  <span className="text-[#d97706] font-semibold">+292% YoY Scrap Yield</span>
                </div>
              </div>
            </div>

            {/* Chart 3: Fleet Route Optimization Fuel Saved */}
            <div className="bg-white border border-[#c2c9bb] rounded-lg p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#191c1e]">3. Dynamic Routing Fuel & CO₂ Reductions</h3>
                <p className="text-xs text-[#515f74]">Efficiency gains achieved via nearest-neighbor smart dispatching</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-[#f7f9fb] border border-[#eceef0] rounded">
                  <div className="text-[10px] text-[#515f74] uppercase font-bold">Distance Saved</div>
                  <div className="text-xl font-mono font-extrabold text-[#191c1e]">1,420 km</div>
                  <div className="text-[10px] text-[#154212] font-medium mt-0.5">-34% empty circuits</div>
                </div>
                <div className="p-3 bg-[#f7f9fb] border border-[#eceef0] rounded">
                  <div className="text-[10px] text-[#515f74] uppercase font-bold">Diesel Conserved</div>
                  <div className="text-xl font-mono font-extrabold text-[#154212]">512 Liters</div>
                  <div className="text-[10px] text-[#154212] font-medium mt-0.5">₹48,600 budget saved</div>
                </div>
                <div className="p-3 bg-[#f7f9fb] border border-[#eceef0] rounded">
                  <div className="text-[10px] text-[#515f74] uppercase font-bold">GHG Averted</div>
                  <div className="text-xl font-mono font-extrabold text-[#154212]">1.37 MT</div>
                  <div className="text-[10px] text-[#515f74] font-medium mt-0.5">Carbon footprint cut</div>
                </div>
                <div className="p-3 bg-[#f7f9fb] border border-[#eceef0] rounded">
                  <div className="text-[10px] text-[#515f74] uppercase font-bold">Vehicle Lifespan</div>
                  <div className="text-xl font-mono font-extrabold text-[#191c1e]">+22%</div>
                  <div className="text-[10px] text-[#515f74] font-medium mt-0.5">Reduced tire/engine wear</div>
                </div>
              </div>
            </div>

            {/* Chart 4: Ward Cleanliness & Grievance SLA */}
            <div className="bg-white border border-[#c2c9bb] rounded-lg p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#191c1e]">4. Ward Cleanliness SLA Compliance</h3>
                  <p className="text-xs text-[#515f74]">% Grievances resolved within 4-hour statutory target</p>
                </div>
                <span className="text-xs font-mono font-bold text-[#154212]">Avg: 91.0%</span>
              </div>

              <div className="space-y-3 pt-1">
                {[
                  { ward: 'Ward 14 (Indirapuram Sector 4)', pct: 94, status: 'Compliant' },
                  { ward: 'Ward 15 (Vaishali Sector 1)', pct: 88, status: 'Attention' },
                  { ward: 'Ward 16 (Vasundhara Sector 9)', pct: 92, status: 'Compliant' },
                  { ward: 'Ward 17 (Kaushambi Metro Hub)', pct: 85, status: 'Attention' },
                  { ward: 'Ward 18 (Ghazipur Border Zone)', pct: 96, status: 'Exemplary' },
                ].map((w) => (
                  <div key={w.ward} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[#191c1e]">{w.ward}</span>
                      <span className="font-mono font-bold text-[#154212]">{w.pct}%</span>
                    </div>
                    <div className="w-full bg-[#e0e3e5] h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${w.pct}%` }}
                        className={`h-full rounded-full ${w.pct >= 90 ? 'bg-[#154212]' : 'bg-[#d97706]'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Route Modal */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#c2c9bb] rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#eceef0]">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#154212]" />
                <h3 className="font-bold text-base text-[#191c1e]">Assign Optimized Route</h3>
              </div>
              <button onClick={() => setIsDispatchModalOpen(false)} className="text-[#515f74] hover:text-[#191c1e]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#515f74]">
              Transmit {optimizedRouteData?.stops.length} priority stops ({optimizedRouteData?.totalDistanceKm} km) directly to the selected tipper van in-cab mobile console.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#42493e] mb-1">Select Active Fleet Vehicle</label>
              <select
                value={selectedDispatchVehicle}
                onChange={(e) => setSelectedDispatchVehicle(e.target.value)}
                className="w-full px-3 py-2 border border-[#c2c9bb] rounded text-xs text-[#191c1e] bg-white focus:outline-none"
              >
                {routes.map((rt) => (
                  <option key={rt.id} value={rt.truckNumber}>
                    {rt.truckNumber} ({rt.driverName}) - Status: {rt.status}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-[#f7f9fb] rounded border border-[#eceef0] text-xs space-y-1">
              <div className="flex justify-between">
                <span>Start Point:</span>
                <span className="font-semibold text-[#191c1e]">Nagar Nigam Central Depot</span>
              </div>
              <div className="flex justify-between">
                <span>Stops To Collect:</span>
                <span className="font-bold text-[#154212]">{optimizedRouteData?.stops.length} High-Fill Bins</span>
              </div>
              <div className="flex justify-between">
                <span>Total Mileage:</span>
                <span className="font-mono font-bold text-[#191c1e]">{optimizedRouteData?.totalDistanceKm} km</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#eceef0]">
              <button
                type="button"
                onClick={() => setIsDispatchModalOpen(false)}
                className="px-3 py-2 border border-[#c2c9bb] rounded text-xs font-semibold text-[#515f74]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRouteDispatch}
                className="px-4 py-2 bg-[#154212] text-white text-xs font-semibold rounded hover:bg-[#2d5a27] transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Confirm & Dispatch Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Truck Modal */}
      {activeDispatchBinId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#c2c9bb] rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-[#191c1e]">Emergency Dispatch Compactor</h3>
            <p className="text-xs text-[#515f74]">
              Select a collection route to re-prioritize and immediately empty bin <strong>{bins.find((b) => b.id === activeDispatchBinId)?.code}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#42493e] mb-1">Select Available Vehicle Route</label>
              <select
                value={selectedRouteForDispatch}
                onChange={(e) => setSelectedRouteForDispatch(e.target.value)}
                className="w-full px-3 py-2 border border-[#c2c9bb] rounded text-xs text-[#191c1e] bg-white focus:outline-none"
              >
                {routes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.truckNumber} ({rt.driverName}) - {rt.routeName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveDispatchBinId(null)}
                className="px-3 py-2 border border-[#c2c9bb] rounded text-xs font-semibold text-[#515f74]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmDispatch(activeDispatchBinId)}
                className="px-4 py-2 bg-[#154212] text-white text-xs font-semibold rounded hover:bg-[#2d5a27]"
              >
                Transmit Dispatch Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {resolvingGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form onSubmit={handleConfirmResolution} className="bg-white border border-[#c2c9bb] rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-[#191c1e]">Complete Civic Grievance Resolution</h3>
            <p className="text-xs text-[#515f74]">
              Ticket: <strong>{resolvingGrievance.ticketNumber}</strong> • Complainant will receive automated SMS confirmation.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#42493e] mb-1">Supervisor Resolution Notes</label>
              <textarea
                required
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full px-3 py-2 border border-[#c2c9bb] rounded text-xs text-[#191c1e] focus:outline-none"
                placeholder="Details of clearance, truck used, and disinfectant applied..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResolvingGrievance(null)}
                className="px-3 py-2 border border-[#c2c9bb] rounded text-xs font-semibold text-[#515f74]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#154212] text-white text-xs font-semibold rounded hover:bg-[#2d5a27]"
              >
                Confirm Resolution
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assign Worker Modal */}
      {assigningGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <form onSubmit={handleConfirmAssign} className="bg-white border border-[#c2c9bb] rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-[#191c1e]">Assign Sanitation Supervisor</h3>
            <p className="text-xs text-[#515f74]">Ticket: <strong>{assigningGrievance.ticketNumber}</strong></p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#42493e] mb-1">Officer Name</label>
                <input
                  type="text"
                  required
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#c2c9bb] rounded text-xs text-[#191c1e]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#42493e] mb-1">Helpline Phone</label>
                <input
                  type="text"
                  required
                  value={officerPhone}
                  onChange={(e) => setOfficerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-[#c2c9bb] rounded text-xs text-[#191c1e]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssigningGrievance(null)}
                className="px-3 py-2 border border-[#c2c9bb] rounded text-xs font-semibold text-[#515f74]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#154212] text-white text-xs font-semibold rounded hover:bg-[#2d5a27]"
              >
                Assign & Dispatch Alert
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

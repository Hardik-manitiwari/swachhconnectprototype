import React, { useState } from 'react';
import { User, WasteBin, Grievance, CollectionRoute, PickupBooking } from '../types';
import { speakHindi, WORKER_VOICE_INSTRUCTIONS } from '../utils/saralHelper';
import { 
  Truck, Navigation, CheckCircle2, AlertTriangle, Volume2, Camera, 
  MapPin, ShieldAlert, Phone, RefreshCw, Sparkles, UploadCloud, X, Check,
  UserCheck, Fuel, ArrowRight, Clock, Award, Play
} from 'lucide-react';

interface WorkerViewProps {
  user: User;
  bins: WasteBin[];
  grievances: Grievance[];
  pickups: PickupBooking[];
  routes: CollectionRoute[];
  onUpdateBinStatus?: (binId: string, fillLevel: number) => void;
  onResolveGrievance?: (ticketNumber: string, notes: string) => void;
  isSaralMode?: boolean;
}

export const WorkerView: React.FC<WorkerViewProps> = ({
  user,
  bins,
  grievances,
  pickups,
  routes,
  onUpdateBinStatus,
  onResolveGrievance,
  isSaralMode = false,
}) => {
  const [workerSubTab, setWorkerSubTab] = useState<'driver' | 'collector' | 'sos'>('driver');
  const [completedStopIds, setCompletedStopIds] = useState<string[]>(['bin-04']);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [proofPhotoModal, setProofPhotoModal] = useState<string | null>(null);
  const [uploadedProofUrl, setUploadedProofUrl] = useState<string>('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Driver truck payload
  const [currentPayloadTons, setCurrentPayloadTons] = useState(3.6);
  const maxPayloadTons = 5.0;

  // Selected route
  const activeRoute = routes[0] || {
    id: 'rt-01',
    routeName: 'Route Alpha: Ward 14 Main Commercial',
    truckNumber: 'DL-04-GH-3129',
    driverName: 'Ramesh Chand',
    driverContact: '+91 98450 11223',
    totalBins: 16,
    completedBins: 12,
    currentWard: 'Ward 14',
    status: 'In Transit',
    nextStop: 'Community Center Market, Sector 4',
    etaMinutes: 12,
    capacityFilledTons: 3.6,
    maxCapacityTons: 5.0,
  };

  // Route stops based on bins
  const stops = bins.slice(0, 5);
  const currentStop = stops[currentStopIndex] || stops[0];

  // Worker assigned grievances (Ward 14)
  const assignedGrievances = grievances.filter(g => g.status !== 'Resolved');

  const handleSpeakInstruction = (text: string) => {
    speakHindi(text);
  };

  const handleStartNavigationToStop = (stop: WasteBin, index: number) => {
    setCurrentStopIndex(index);
    setIsNavigating(true);
    const text = WORKER_VOICE_INSTRUCTIONS.nextStopInstruction(stop.location, stop.type);
    speakHindi(text);
    showNotice(`नेविगेशन शुरू: ${stop.location}`);
  };

  const handleMarkStopComplete = (stop: WasteBin) => {
    if (!completedStopIds.includes(stop.id)) {
      setCompletedStopIds((prev) => [...prev, stop.id]);
      setCurrentPayloadTons((prev) => Math.min(maxPayloadTons, +(prev + 0.35).toFixed(2)));
      onUpdateBinStatus?.(stop.id, 5); // Emptied

      const voiceMsg = WORKER_VOICE_INSTRUCTIONS.stopCompleted(stop.location);
      speakHindi(voiceMsg);
      showNotice(`✓ स्टॉप ${stop.code} सफलतापूर्वक खाली किया गया!`);

      // Advance to next stop if available
      if (currentStopIndex < stops.length - 1) {
        setTimeout(() => {
          const nextIndex = currentStopIndex + 1;
          setCurrentStopIndex(nextIndex);
          const nextStop = stops[nextIndex];
          const nextMsg = WORKER_VOICE_INSTRUCTIONS.nextStopInstruction(nextStop.location, nextStop.type);
          speakHindi(nextMsg);
        }, 3000);
      } else {
        setTimeout(() => {
          speakHindi(WORKER_VOICE_INSTRUCTIONS.routeCompleted());
        }, 2000);
      }
    }
  };

  const handleResolveGrievanceTask = (ticketNumber: string, title: string) => {
    onResolveGrievance?.(ticketNumber, 'Cleaned and cleared by municipal beat team Ramesh Chand');
    const msg = `शिकायत ${ticketNumber} का कचरा उठा लिया गया है और समाधान दर्ज हो गया है।`;
    speakHindi(msg);
    showNotice(`✓ शिकायत ${ticketNumber} हल हो गई!`);
  };

  const handleTriggerSOS = (type: string) => {
    setSosActive(true);
    const msg = type === 'breakdown'
      ? 'वाहन खराबी की सूचना कंट्रोल रूम को भेज दी गई है। सहायता दल रास्ते में है।'
      : WORKER_VOICE_INSTRUCTIONS.emergencyTriggered();
    speakHindi(msg);
    showNotice('🚨 आपातकालीन अलर्ट कंट्रोल रूम को भेजा गया!');
  };

  const showNotice = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => {
      setActionSuccessMessage(null);
    }, 4000);
  };

  return (
    <div className={`flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6 ${isSaralMode ? 'font-sans text-base' : 'text-xs'}`}>
      {/* Worker Banner Header */}
      <div className={`bg-white border border-[#c2c9bb] rounded-xl shadow-xs transition-all ${isSaralMode ? 'p-6 border-2 border-[#154212]' : 'p-5'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-xl bg-[#154212] text-white flex items-center justify-center shrink-0 ${isSaralMode ? 'w-16 h-16' : 'w-12 h-12'}`}>
              <Truck className={isSaralMode ? 'w-9 h-9' : 'w-6 h-6'} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded bg-[#bcf0ae] text-[#154212] font-extrabold uppercase text-[10px] md:text-xs tracking-wider">
                  {isSaralMode ? 'सफाई मित्र एवं वाहन चालक पोर्टल' : 'Sanitation Crew & Fleet Portal'}
                </span>
                <span className="text-xs text-[#515f74] font-semibold">
                  वाहन: <strong className="text-[#191c1e]">{activeRoute.truckNumber}</strong> • वार्ड 14
                </span>
              </div>
              <h1 className={`font-black text-[#191c1e] mt-1 ${isSaralMode ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'}`}>
                {user.firstName} {user.lastName} {isSaralMode && <span className="text-[#154212] font-bold text-lg md:text-xl">(चालक / सफाई मित्र)</span>}
              </h1>
              <p className={`text-[#515f74] ${isSaralMode ? 'text-sm md:text-base font-medium' : 'text-xs'}`}>
                {isSaralMode 
                  ? 'दैनिक कचरा उठाव मार्ग, बिन खाली करना, और शिकायत निवारण'
                  : 'Daily municipal route collection, IoT bin clearance verification, and civic grievance resolution.'}
              </p>
            </div>
          </div>

          {/* Quick Voice Assistant Button */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => {
                const welcome = WORKER_VOICE_INSTRUCTIONS.welcomeDriver(activeRoute.truckNumber, 'वार्ड 14 मुख्य मार्ग');
                speakHindi(welcome);
              }}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#154212] hover:bg-[#20571d] text-white font-bold rounded-xl transition-all cursor-pointer shadow-sm active:scale-98 ${
                isSaralMode ? 'py-3.5 px-5 text-base md:text-lg' : 'py-2 px-3.5 text-xs'
              }`}
            >
              <Volume2 className={isSaralMode ? 'w-6 h-6 animate-pulse' : 'w-4 h-4'} />
              <span>{isSaralMode ? 'आवाज़ में निर्देश सुनें (Listen)' : 'Hindi Voice Guidance'}</span>
            </button>

            <button
              onClick={() => setWorkerSubTab('sos')}
              className={`flex items-center justify-center gap-1.5 bg-[#ffdad6] hover:bg-[#ffb4ab] text-[#ba1a1a] font-bold rounded-xl border border-[#ba1a1a]/30 transition-all cursor-pointer ${
                isSaralMode ? 'py-3.5 px-5 text-base md:text-lg' : 'py-2 px-3.5 text-xs'
              }`}
            >
              <ShieldAlert className={isSaralMode ? 'w-6 h-6' : 'w-4 h-4'} />
              <span>SOS आपातकाल</span>
            </button>
          </div>
        </div>

        {/* Live Payload Meter */}
        <div className={`mt-5 pt-4 border-t border-[#eceef0] grid grid-cols-1 sm:grid-cols-3 gap-3 ${isSaralMode ? 'text-base' : 'text-xs'}`}>
          <div className="p-3 bg-[#f7f9fb] rounded-lg border border-[#e0e3e5]">
            <span className="text-[#515f74] font-medium block">
              {isSaralMode ? 'गाड़ी में भरा कचरा (Payload)' : 'Compactor Load Capacity'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`font-black text-[#154212] ${isSaralMode ? 'text-2xl' : 'text-lg'}`}>
                {currentPayloadTons} Tons
              </span>
              <span className="text-[#515f74] font-bold">/ {maxPayloadTons} T max</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-[#e0e3e5] h-2.5 rounded-full overflow-hidden mt-1.5">
              <div 
                className={`h-full rounded-full transition-all ${
                  (currentPayloadTons / maxPayloadTons) > 0.85 ? 'bg-[#ba1a1a]' : 'bg-[#154212]'
                }`}
                style={{ width: `${Math.min(100, (currentPayloadTons / maxPayloadTons) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3 bg-[#f7f9fb] rounded-lg border border-[#e0e3e5]">
            <span className="text-[#515f74] font-medium block">
              {isSaralMode ? 'मार्ग प्रगति (Route Progress)' : 'Bins Cleared Today'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`font-black text-[#154212] ${isSaralMode ? 'text-2xl' : 'text-lg'}`}>
                {completedStopIds.length}
              </span>
              <span className="text-[#515f74] font-bold">/ {stops.length} स्टॉप पूरे हुए</span>
            </div>
            <span className="text-[11px] text-[#154212] font-semibold mt-1 block">
              ✓ {Math.round((completedStopIds.length / stops.length) * 100)}% मार्ग पूरा
            </span>
          </div>

          <div className="p-3 bg-[#f7f9fb] rounded-lg border border-[#e0e3e5]">
            <span className="text-[#515f74] font-medium block">
              {isSaralMode ? 'अगला गंतव्य (Next Destination)' : 'Current Assigned Stop'}
            </span>
            <div className="font-bold text-[#191c1e] truncate mt-1">
              {currentStop?.location || 'Sector 4 Community Market'}
            </div>
            <span className="text-[11px] text-[#ba1a1a] font-bold mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> ETA: ~8 मिनट
            </span>
          </div>
        </div>
      </div>

      {/* Floating Action / Notice Alert */}
      {actionSuccessMessage && (
        <div className="p-4 bg-[#bcf0ae] border-2 border-[#154212] text-[#154212] rounded-xl font-bold flex items-center justify-between shadow-md animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <span className="text-base">{actionSuccessMessage}</span>
          </div>
          <button 
            onClick={() => setActionSuccessMessage(null)}
            className="p-1 hover:bg-[#154212]/10 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Worker Sub-Navigation Tabs */}
      <div className={`flex border-b border-[#e0e3e5] overflow-x-auto gap-2 font-bold ${isSaralMode ? 'text-base md:text-lg pb-1' : 'text-xs'}`}>
        <button
          onClick={() => setWorkerSubTab('driver')}
          className={`pb-3 px-4 border-b-2 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            workerSubTab === 'driver'
              ? 'border-[#154212] text-[#154212]'
              : 'border-transparent text-[#515f74] hover:text-[#191c1e]'
          }`}
        >
          <Navigation className={isSaralMode ? 'w-5 h-5' : 'w-4 h-4'} />
          <span>{isSaralMode ? '1. वाहन चालक रूट (Driver Route)' : 'Driver Route Stops'}</span>
        </button>

        <button
          onClick={() => setWorkerSubTab('collector')}
          className={`pb-3 px-4 border-b-2 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            workerSubTab === 'collector'
              ? 'border-[#154212] text-[#154212]'
              : 'border-transparent text-[#515f74] hover:text-[#191c1e]'
          }`}
        >
          <UserCheck className={isSaralMode ? 'w-5 h-5' : 'w-4 h-4'} />
          <span>{isSaralMode ? `2. सफाई कार्य एवं शिकायतें (${assignedGrievances.length})` : `Collector Tasks & Grievances (${assignedGrievances.length})`}</span>
        </button>

        <button
          onClick={() => setWorkerSubTab('sos')}
          className={`pb-3 px-4 border-b-2 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            workerSubTab === 'sos'
              ? 'border-[#ba1a1a] text-[#ba1a1a]'
              : 'border-transparent text-[#515f74] hover:text-[#ba1a1a]'
          }`}
        >
          <ShieldAlert className={isSaralMode ? 'w-5 h-5' : 'w-4 h-4'} />
          <span>{isSaralMode ? '3. आपातकालीन सहायता (Emergency SOS)' : 'Emergency & Breakdown SOS'}</span>
        </button>
      </div>

      {/* TAB 1: DRIVER ROUTE STOPS */}
      {workerSubTab === 'driver' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className={`font-black text-[#191c1e] ${isSaralMode ? 'text-2xl' : 'text-base'}`}>
                {isSaralMode ? 'कूड़ेदान खाली करने का क्रम (Stops Checklist)' : 'Optimized Tipper Route: Stops Checklist'}
              </h2>
              <p className={`text-[#515f74] ${isSaralMode ? 'text-base' : 'text-xs'}`}>
                {isSaralMode 
                  ? 'हर स्टॉप पर पहुंचकर कचरा खाली करें और हरा बटन दबाएं।' 
                  : 'Follow the dynamic TSP waypoint sequence. Capture before/after telemetry photo for audit.'}
              </p>
            </div>

            <button
              onClick={() => {
                const stop = stops[currentStopIndex] || stops[0];
                handleStartNavigationToStop(stop, currentStopIndex);
              }}
              className={`flex items-center gap-2 bg-[#154212] hover:bg-[#20571d] text-white font-bold rounded-xl transition-all cursor-pointer shadow-sm ${
                isSaralMode ? 'py-3 px-5 text-base md:text-lg' : 'py-2 px-3 text-xs'
              }`}
            >
              <Navigation className="w-5 h-5 animate-spin" />
              <span>{isSaralMode ? 'अगले स्टॉप का मार्गदर्शन (Start Navigation)' : 'Navigate Next Stop'}</span>
            </button>
          </div>

          {/* List of stops */}
          <div className="space-y-3">
            {stops.map((stop, idx) => {
              const isCompleted = completedStopIds.includes(stop.id);
              const isCurrent = currentStopIndex === idx && !isCompleted;

              return (
                <div
                  key={stop.id}
                  className={`border rounded-xl transition-all bg-white shadow-xs ${
                    isCurrent
                      ? 'border-2 border-[#154212] ring-2 ring-[#bcf0ae]/60'
                      : isCompleted
                      ? 'border-[#c2c9bb] bg-[#f7f9fb] opacity-85'
                      : 'border-[#c2c9bb]'
                  } ${isSaralMode ? 'p-5' : 'p-4'}`}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    {/* Left details */}
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-black shrink-0 ${
                        isCompleted
                          ? 'bg-[#bcf0ae] text-[#154212]'
                          : isCurrent
                          ? 'bg-[#154212] text-white animate-bounce'
                          : 'bg-[#f2f4f6] text-[#515f74]'
                      } ${isSaralMode ? 'text-xl' : 'text-sm'}`}>
                        {isCompleted ? '✓' : idx + 1}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-[#515f74] bg-[#f2f4f6] px-2 py-0.5 rounded">
                            {stop.code}
                          </span>
                          <span className={`text-[10px] md:text-xs font-bold px-2 py-0.5 rounded uppercase ${
                            stop.type === 'wet' ? 'bg-[#bcf0ae] text-[#154212]' : 'bg-[#d5e3fd] text-[#0d1c2f]'
                          }`}>
                            {stop.type === 'wet' ? 'गीला कचरा (Wet)' : 'सूखा कचरा (Dry)'}
                          </span>
                          {isCurrent && (
                            <span className="text-xs font-extrabold text-[#ba1a1a] bg-[#ffdad6] px-2.5 py-0.5 rounded-full animate-pulse">
                              ● अगला स्टॉप (Current Stop)
                            </span>
                          )}
                          {isCompleted && (
                            <span className="text-xs font-extrabold text-[#154212] bg-[#bcf0ae] px-2 py-0.5 rounded">
                              ✓ उठाव पूर्ण (Cleared)
                            </span>
                          )}
                        </div>

                        <h3 className={`font-black text-[#191c1e] ${isSaralMode ? 'text-xl md:text-2xl' : 'text-sm md:text-base'}`}>
                          {stop.location}
                        </h3>

                        <div className="flex items-center gap-3 text-xs md:text-sm text-[#515f74]">
                          <span className="flex items-center gap-1 font-semibold text-[#191c1e]">
                            <MapPin className="w-3.5 h-3.5 text-[#154212]" /> {stop.ward}
                          </span>
                          <span>•</span>
                          <span>भराव स्तर: <strong className={stop.fillLevel > 80 ? 'text-[#ba1a1a]' : 'text-[#154212]'}>{stop.fillLevel}%</strong></span>
                          <span>•</span>
                          <span>अंतिम खाली: {stop.lastEmptied}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right action buttons */}
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
                      {/* Audio instruction button */}
                      <button
                        type="button"
                        onClick={() => {
                          const msg = WORKER_VOICE_INSTRUCTIONS.nextStopInstruction(stop.location, stop.type);
                          speakHindi(msg);
                        }}
                        className={`p-3 bg-[#f7f9fb] hover:bg-[#e0e3e5] border border-[#c2c9bb] text-[#154212] rounded-xl flex items-center gap-1.5 font-bold cursor-pointer ${
                          isSaralMode ? 'text-sm md:text-base px-4 py-3' : 'text-xs'
                        }`}
                        title="आवाज़ में निर्देश सुनें"
                      >
                        <Volume2 className={isSaralMode ? 'w-5 h-5' : 'w-4 h-4'} />
                        <span>{isSaralMode ? 'निर्देश सुनें' : 'Listen'}</span>
                      </button>

                      {/* Photo upload proof */}
                      <button
                        type="button"
                        onClick={() => setProofPhotoModal(stop.code)}
                        className={`p-3 bg-white hover:bg-[#f2f4f6] border border-[#c2c9bb] text-[#191c1e] rounded-xl flex items-center gap-1.5 font-bold cursor-pointer ${
                          isSaralMode ? 'text-sm md:text-base px-4 py-3' : 'text-xs'
                        }`}
                      >
                        <Camera className={isSaralMode ? 'w-5 h-5' : 'w-4 h-4'} />
                        <span>{isSaralMode ? 'फोटो प्रमाण' : 'Photo Proof'}</span>
                      </button>

                      {/* Mark completed */}
                      {isCompleted ? (
                        <div className="py-2.5 px-4 bg-[#bcf0ae]/50 text-[#154212] font-bold rounded-xl flex items-center gap-1.5 text-sm md:text-base">
                          <CheckCircle2 className="w-5 h-5" />
                          <span>संपन्न ✓</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMarkStopComplete(stop)}
                          className={`flex items-center justify-center gap-2 bg-[#154212] hover:bg-[#20571d] text-white font-extrabold rounded-xl transition-all cursor-pointer shadow-md active:scale-95 ${
                            isSaralMode ? 'py-4 px-6 text-base md:text-xl' : 'py-2.5 px-4 text-xs md:text-sm'
                          }`}
                        >
                          <Check className={isSaralMode ? 'w-6 h-6' : 'w-4 h-4'} />
                          <span>{isSaralMode ? 'कचरा उठाया गया ✓ (Done)' : 'Mark Emptied ✓'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: COLLECTOR TASKS & GRIEVANCES */}
      {workerSubTab === 'collector' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className={`font-black text-[#191c1e] ${isSaralMode ? 'text-2xl' : 'text-base'}`}>
                {isSaralMode ? 'सफाई मित्र कार्य एवं नागरिक शिकायतें' : 'Beat Sanitation & Assigned Grievances'}
              </h2>
              <p className={`text-[#515f74] ${isSaralMode ? 'text-base' : 'text-xs'}`}>
                {isSaralMode 
                  ? 'नागरिकों द्वारा भेजी गई शिकायतों का मौके पर जाकर तुरंत समाधान करें।' 
                  : 'Clear urgent roadside dumps, overflow dustbins, and bulk pickup requests.'}
              </p>
            </div>

            <button
              onClick={() => {
                speakHindi('वार्ड 14 में दो शिकायतें लंबित हैं। पहली शिकायत कम्युनिटी सेंटर मार्केट में कूड़े के फैलाव की है।');
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#f7f9fb] border border-[#c2c9bb] rounded-lg text-xs md:text-sm font-bold text-[#154212] hover:bg-[#e0e3e5] cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span>शिकायतों का ऑडियो सुनें</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedGrievances.map((grv) => (
              <div
                key={grv.id}
                className={`bg-white border-2 border-[#c2c9bb] rounded-xl p-5 space-y-3 shadow-xs hover:border-[#154212] transition-colors ${
                  isSaralMode ? 'text-base' : 'text-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#515f74] bg-[#f2f4f6] px-2 py-0.5 rounded">
                      {grv.ticketNumber}
                    </span>
                    <h3 className={`font-black text-[#191c1e] mt-1 ${isSaralMode ? 'text-xl' : 'text-sm font-bold'}`}>
                      {grv.title}
                    </h3>
                  </div>

                  <span className={`px-2.5 py-1 rounded text-xs font-extrabold uppercase ${
                    grv.urgency === 'High' || grv.urgency === 'Critical Emergency'
                      ? 'bg-[#ffdad6] text-[#ba1a1a]'
                      : 'bg-[#fef3c7] text-[#92400e]'
                  }`}>
                    {grv.urgency}
                  </span>
                </div>

                <p className={`text-[#515f74] line-clamp-2 ${isSaralMode ? 'text-base' : 'text-xs'}`}>
                  {grv.description}
                </p>

                <div className="p-2.5 bg-[#f7f9fb] rounded-lg border border-[#e0e3e5] flex items-center justify-between text-xs md:text-sm text-[#191c1e] font-semibold">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-[#154212]" /> {grv.location}
                  </span>
                  <span className="text-[#515f74]">नागरिक: {grv.citizenName}</span>
                </div>

                {grv.photoUrl && (
                  <div className="rounded-lg overflow-hidden max-h-36 border border-[#c2c9bb]">
                    <img src={grv.photoUrl} alt="Complaint Evidence" className="w-full h-32 object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const text = WORKER_VOICE_INSTRUCTIONS.grievanceTaskAssigned(grv.ticketNumber, grv.location);
                      speakHindi(text);
                    }}
                    className={`p-3 bg-[#f7f9fb] hover:bg-[#e0e3e5] border border-[#c2c9bb] text-[#154212] rounded-xl flex items-center gap-1 font-bold cursor-pointer ${
                      isSaralMode ? 'text-base px-4' : 'text-xs'
                    }`}
                    title="आवाज़ में सुनें"
                  >
                    <Volume2 className="w-5 h-5" />
                    <span>सुनें</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResolveGrievanceTask(grv.ticketNumber, grv.title)}
                    className={`flex-1 py-3 px-4 bg-[#154212] hover:bg-[#20571d] text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                      isSaralMode ? 'text-base md:text-lg' : 'text-xs md:text-sm'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{isSaralMode ? 'सफाई पूर्ण दर्ज करें (Clear & Resolve)' : 'Mark Cleared & Resolved'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Door-to-Door Beat Collection Checklist */}
          <div className="mt-6 bg-white border border-[#c2c9bb] rounded-xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-black text-[#191c1e] ${isSaralMode ? 'text-xl' : 'text-sm'}`}>
                  {isSaralMode ? 'घर-घर कचरा संग्रहण बीट (Door-to-Door Beat Log)' : 'Ward 14 Door-to-Door Household Collection'}
                </h3>
                <p className="text-xs text-[#515f74]">
                  Gali 1 to 8 • Segregation compliance tracking (Green: Wet / Blue: Dry / Red: Sanitary)
                </p>
              </div>
              <button
                onClick={() => speakHindi('घर-घर कचरा संग्रहण में नागरिकों से सूखा और गीला कचरा अलग मांगें।')}
                className="p-2 bg-[#f7f9fb] border border-[#c2c9bb] rounded-lg text-[#154212] font-semibold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>नियम सुनें</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="p-3 bg-[#f7f9fb] border border-[#c2c9bb] rounded-lg text-center">
                <div className="font-extrabold text-lg text-[#154212]">142 / 160</div>
                <div className="text-xs text-[#515f74] font-medium">घरों से कचरा लिया</div>
              </div>
              <div className="p-3 bg-[#f7f9fb] border border-[#c2c9bb] rounded-lg text-center">
                <div className="font-extrabold text-lg text-[#154212]">92%</div>
                <div className="text-xs text-[#515f74] font-medium">पृथक्करण दर (Segregation)</div>
              </div>
              <div className="p-3 bg-[#f7f9fb] border border-[#c2c9bb] rounded-lg text-center">
                <div className="font-extrabold text-lg text-[#ba1a1a]">4</div>
                <div className="text-xs text-[#515f74] font-medium">मिश्रित कचरा चेतावनी</div>
              </div>
              <div className="p-3 bg-[#f7f9fb] border border-[#c2c9bb] rounded-lg text-center">
                <div className="font-extrabold text-lg text-[#0d1c2f]">1.8 Tons</div>
                <div className="text-xs text-[#515f74] font-medium">एकत्रित गीला कचरा</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EMERGENCY SOS & EQUIPMENT REQUEST */}
      {workerSubTab === 'sos' && (
        <div className="space-y-4">
          <div className="bg-[#ffdad6]/40 border-2 border-[#ba1a1a] rounded-xl p-6 text-center space-y-3">
            <div className="w-16 h-16 bg-[#ffdad6] text-[#ba1a1a] rounded-full flex items-center justify-center mx-auto shadow-sm">
              <ShieldAlert className="w-10 h-10 animate-pulse" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-[#93000a]">
              सफाई मित्र आपातकालीन सहायता (Emergency SOS)
            </h2>
            <p className="text-sm md:text-base text-[#410002] max-w-xl mx-auto">
              सड़क दुर्घटना, वाहन खराबी, या खतरनाक कचरे की स्थिति में तुरंत नीचे दिए गए बटन को दबाएं। कंट्रोल रूम से तुरंत सहायता भेजी जाएगी।
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto pt-3">
              <button
                type="button"
                onClick={() => handleTriggerSOS('breakdown')}
                className="p-5 bg-white border-2 border-[#ba1a1a] hover:bg-[#ffdad6] rounded-xl text-center space-y-1 cursor-pointer transition-all active:scale-95 shadow-xs"
              >
                <Truck className="w-8 h-8 text-[#ba1a1a] mx-auto" />
                <div className="font-black text-lg text-[#191c1e]">गाड़ी खराब / पंचर</div>
                <div className="text-xs text-[#515f74]">वाहन टोइंग एवं मैकेनिक दल</div>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerSOS('accident')}
                className="p-5 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-xl text-center space-y-1 cursor-pointer transition-all active:scale-95 shadow-md"
              >
                <Phone className="w-8 h-8 text-white mx-auto animate-bounce" />
                <div className="font-black text-lg text-white">तुरंत मेडिकल SOS</div>
                <div className="text-xs text-white/80">एम्बुलेंस एवं सुपरवाइजर कॉल</div>
              </button>
            </div>

            <div className="pt-2 text-xs md:text-sm text-[#515f74]">
              नगर निगम कंट्रोल रूम हेल्पलाइन: <strong className="text-[#191c1e]">1800-180-3030</strong> (24x7)
            </div>
          </div>

          {/* Protective gear safety request */}
          <div className="bg-white border border-[#c2c9bb] rounded-xl p-5 space-y-3">
            <h3 className="font-black text-lg text-[#191c1e]">
              सुरक्षा उपकरण मांग (Protective Safety Gear Request)
            </h3>
            <p className="text-xs md:text-sm text-[#515f74]">
              यदि आपके सुरक्षा दस्ताने, मास्क, या गमबूट खराब हो गए हैं, तो डिपो से नया सामान तुरंत प्राप्त करें।
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {['रबर दस्ताने (Safety Gloves)', 'N95 मास्क (Dust Mask)', 'रिफ्लेक्टिव जैकेट (Safety Vest)', 'सुरक्षा जूते (Gum Boots)'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    speakHindi(`${item} की मांग दर्ज कर ली गई है। डिपो प्रभारी से प्राप्त करें।`);
                    showNotice(`✓ ${item} की मांग दर्ज हुई!`);
                  }}
                  className="px-3.5 py-2 bg-[#f7f9fb] hover:bg-[#e0e3e5] border border-[#c2c9bb] rounded-lg text-xs md:text-sm font-bold text-[#154212] cursor-pointer"
                >
                  + {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Proof Photo Modal */}
      {proofPhotoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border-2 border-[#154212]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-6 h-6 text-[#154212]" />
                <h3 className="font-black text-lg text-[#191c1e]">
                  सफाई फोटो प्रमाण: {proofPhotoModal}
                </h3>
              </div>
              <button
                onClick={() => setProofPhotoModal(null)}
                className="p-1 hover:bg-[#f2f4f6] rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border-2 border-dashed border-[#c2c9bb] rounded-xl p-6 text-center space-y-3 bg-[#f7f9fb]">
              <Camera className="w-12 h-12 text-[#154212] mx-auto opacity-70" />
              <div className="text-sm font-bold text-[#191c1e]">
                कूड़ेदान खाली होने के बाद की तस्वीर लें
              </div>
              <p className="text-xs text-[#515f74]">
                नगर निगम जियो-टैगिंग के साथ फोटो सीधे कंट्रोल रूम में दर्ज होगी।
              </p>

              <div className="pt-2 flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    speakHindi('फोटो प्रमाण सफलतापूर्वक अपलोड हो गया है।');
                    showNotice(`✓ फोटो प्रमाण ${proofPhotoModal} के लिए सहेज लिया गया!`);
                    setProofPhotoModal(null);
                  }}
                  className="px-4 py-2.5 bg-[#154212] hover:bg-[#20571d] text-white font-bold rounded-xl text-sm cursor-pointer shadow-xs"
                >
                  📸 तस्वीर अपलोड करें (Simulate Capture)
                </button>
              </div>
            </div>

            <button
              onClick={() => setProofPhotoModal(null)}
              className="w-full py-2.5 bg-[#f2f4f6] hover:bg-[#e0e3e5] text-[#191c1e] font-bold rounded-xl text-sm cursor-pointer"
            >
              रद्द करें (Cancel)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

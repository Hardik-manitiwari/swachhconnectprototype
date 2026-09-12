import React, { useState } from 'react';
import { User, WasteBin, Grievance, CollectionRoute, PickupBooking, IncidentReport } from '../types';
import { INITIAL_INCIDENTS } from '../data/mockData';
import { speakHindi, WORKER_VOICE_INSTRUCTIONS } from '../utils/saralHelper';
import {
  Truck, Navigation, CheckCircle2, AlertTriangle, Volume2, Camera,
  MapPin, ShieldAlert, Phone, RefreshCw, Sparkles, UploadCloud, X, Check,
  UserCheck, Fuel, ArrowRight, Clock, Award, Play, AlertCircle, Eye,
  Compass, QrCode, FileText, CheckSquare, Layers, Wrench, Shield, ChevronRight,
  ExternalLink, CornerUpRight, Radio, BellRing
} from 'lucide-react';

interface WorkerDashboardProps {
  user: User;
  bins: WasteBin[];
  grievances: Grievance[];
  pickups: PickupBooking[];
  routes: CollectionRoute[];
  onUpdateBinStatus?: (binId: string, fillLevel: number) => void;
  onResolveGrievance?: (ticketNumber: string, notes: string) => void;
  isSaralMode?: boolean;
}

interface WorkerTaskItem {
  id: string;
  title: string;
  titleHindi: string;
  location: string;
  ward: string;
  category: 'driver_bin' | 'collector_door' | 'urgent_grievance' | 'bulk_pickup';
  wasteType: 'dry' | 'wet' | 'hazardous' | 'construction' | 'mixed';
  priority: 'normal' | 'high' | 'urgent';
  status: 'pending' | 'en_route' | 'completed';
  estimatedKg: number;
  instructionsHindi: string;
  coordinates: { lat: number; lng: number };
  binCode?: string;
  ticketNumber?: string;
}

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({
  user,
  bins,
  grievances,
  pickups,
  routes,
  onUpdateBinStatus,
  onResolveGrievance,
  isSaralMode = false,
}) => {
  // Worker Subview Toggle: Driver vs Collector
  const [workerRole, setWorkerRole] = useState<'driver' | 'collector'>('driver');
  // Navigation Tabs: tasks, navigation, incidents, checklist
  const [activeTab, setActiveTab] = useState<'tasks' | 'navigation' | 'incidents' | 'checklist'>('tasks');

  // Task Filter
  const [taskFilter, setTaskFilter] = useState<'all' | 'driver_bin' | 'collector_door' | 'urgent_grievance' | 'bulk_pickup'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Vehicle / Driver State
  const [currentPayloadTons, setCurrentPayloadTons] = useState(3.4);
  const maxPayloadTons = 5.0;
  const [fuelLevel, setFuelLevel] = useState(68);

  // Collector Door-to-Door Progress State
  const [householdsCovered, setHouseholdsCovered] = useState(48);
  const totalHouseholds = 65;
  const [segregationStats, setSegregationStats] = useState({ green: 40, amber: 6, red: 2 });
  const [isQrScanning, setIsQrScanning] = useState(false);
  const [qrScanResult, setQrScanResult] = useState<string | null>(null);

  // Pre-Trip Checklist State
  const [checklist, setChecklist] = useState({
    brakes: true,
    hydraulics: true,
    tires: true,
    reverseAlarm: true,
    firstAid: false,
    ppeGloves: true,
  });

  // Incidents State
  const [incidents, setIncidents] = useState<IncidentReport[]>(INITIAL_INCIDENTS);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [newIncidentType, setNewIncidentType] = useState<IncidentReport['type']>('road_blockage');
  const [newIncidentUrgency, setNewIncidentUrgency] = useState<IncidentReport['urgency']>('Medium');
  const [newIncidentTitle, setNewIncidentTitle] = useState('');
  const [newIncidentLocation, setNewIncidentLocation] = useState('Ward 14, Near Kala Pathar Marg');
  const [newIncidentDesc, setNewIncidentDesc] = useState('');
  const [newIncidentPhoto, setNewIncidentPhoto] = useState('');

  // Navigation Simulator State
  const [isSimulatingNav, setIsSimulatingNav] = useState(false);
  const [navStepIndex, setNavStepIndex] = useState(0);
  const [navDistanceMeters, setNavDistanceMeters] = useState(1450);
  const [navEtaMinutes, setNavEtaMinutes] = useState(6);

  // Active Tasks List Initializer
  const [tasks, setTasks] = useState<WorkerTaskItem[]>([
    {
      id: 'task-bin-01',
      title: 'Empty Smart Bin NN-BIN-1401 (92% Full)',
      titleHindi: 'स्मार्ट बिन NN-BIN-1401 खाली करें (92% भरा)',
      location: 'Community Center Market, Sector 4',
      ward: 'Ward 14',
      category: 'driver_bin',
      wasteType: 'dry',
      priority: 'urgent',
      status: 'pending',
      estimatedKg: 420,
      instructionsHindi: 'कम्युनिटी सेंटर मार्केट कूड़ेदान 92% भर चुका है। तुरंत टिपर से खाली करें।',
      coordinates: { lat: 28.6412, lng: 77.3715 },
      binCode: 'NN-BIN-1401',
    },
    {
      id: 'task-door-01',
      title: 'Residential Lane 4 Door-to-Door Collection (Houses 1-25)',
      titleHindi: 'आवासीय लेन 4 घर-घर कचरा संग्रह (मकान 1 से 25)',
      location: 'Shipra Sun City, Pocket A, Lane 4',
      ward: 'Ward 14',
      category: 'collector_door',
      wasteType: 'wet',
      priority: 'high',
      status: 'pending',
      estimatedKg: 280,
      instructionsHindi: 'लेन 4 के 25 मकानों से अलग-अलग गीला और सूखा कचरा एकत्र करें।',
      coordinates: { lat: 28.6385, lng: 77.3742 },
    },
    {
      id: 'task-grv-01',
      title: 'Clear Illegal Garbage Heap (Ticket #NN-GRV-2026-089)',
      titleHindi: 'सड़क किनारे अवैध कचरा ढेर साफ करें (टिकट 089)',
      location: 'Corner of Kala Pathar Marg & Street 12',
      ward: 'Ward 14',
      category: 'urgent_grievance',
      wasteType: 'mixed',
      priority: 'urgent',
      status: 'pending',
      estimatedKg: 350,
      instructionsHindi: 'नागरिक शिकायत: सड़क किनारे कचरे का ढेर है। फावड़े और ब्लीचिंग पाउडर से साफ़ करें।',
      coordinates: { lat: 28.6425, lng: 77.3765 },
      ticketNumber: 'NN-GRV-2026-089',
    },
    {
      id: 'task-bin-02',
      title: 'Empty Smart Bin NN-BIN-1402 (78% Full)',
      titleHindi: 'स्मार्ट बिन NN-BIN-1402 खाली करें (78% भरा)',
      location: 'Green Park Metro Gate 2, Main Road',
      ward: 'Ward 14',
      category: 'driver_bin',
      wasteType: 'wet',
      priority: 'high',
      status: 'pending',
      estimatedKg: 310,
      instructionsHindi: 'मेट्रो गेट नंबर 2 के पास गीला कूड़ा बिन खाली करें।',
      coordinates: { lat: 28.6438, lng: 77.3695 },
      binCode: 'NN-BIN-1402',
    },
    {
      id: 'task-bulk-01',
      title: 'Doorstep Bulk Pruned Branches Pickup (#BP-2026-104)',
      titleHindi: 'घर से बगीचे की छंटी डालियां उठाएं (बुकिंग 104)',
      location: 'House 42, Pocket B, Ahinsa Khand 2',
      ward: 'Ward 14',
      category: 'bulk_pickup',
      wasteType: 'dry',
      priority: 'normal',
      status: 'pending',
      estimatedKg: 150,
      instructionsHindi: 'बगीचे की छंटी हुई लकड़ी और पत्तियां लोड करें।',
      coordinates: { lat: 28.636, lng: 77.378 },
    },
  ]);

  // Selected task for navigation or completion
  const [selectedTask, setSelectedTask] = useState<WorkerTaskItem>(tasks[0]);
  const [completeModalTask, setCompleteModalTask] = useState<WorkerTaskItem | null>(null);
  const [recordedWeightInput, setRecordedWeightInput] = useState<number>(350);
  const [photoProofUrl, setPhotoProofUrl] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSosActive, setIsSosActive] = useState(false);

  // Show Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Mark task as completed
  const handleCompleteTask = () => {
    if (!completeModalTask) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === completeModalTask.id ? { ...t, status: 'completed' } : t))
    );

    // If driver bin, update payload & bin status
    if (completeModalTask.category === 'driver_bin') {
      const addedTons = Number((recordedWeightInput / 1000).toFixed(2));
      setCurrentPayloadTons((prev) => Math.min(maxPayloadTons, Number((prev + addedTons).toFixed(2))));
      if (completeModalTask.binCode && onUpdateBinStatus) {
        const matchingBin = bins.find((b) => b.code === completeModalTask.binCode);
        if (matchingBin) {
          onUpdateBinStatus(matchingBin.id, 0);
        }
      }
    }

    // If grievance, resolve it
    if (completeModalTask.category === 'urgent_grievance' && completeModalTask.ticketNumber && onResolveGrievance) {
      onResolveGrievance(completeModalTask.ticketNumber, `Cleared by Sanitation Crew. Weight collected: ${recordedWeightInput} kg.`);
    }

    // If collector door, update count
    if (completeModalTask.category === 'collector_door') {
      setHouseholdsCovered((prev) => Math.min(totalHouseholds, prev + 12));
      setSegregationStats((prev) => ({ ...prev, green: prev.green + 10, amber: prev.amber + 2 }));
    }

    const speech = `${completeModalTask.titleHindi} सफलतापूर्वक पूर्ण हुआ। रिकॉर्ड दर्ज कर दिया गया है।`;
    speakHindi(speech);
    showToast(`Task Completed: ${completeModalTask.title}`);
    setCompleteModalTask(null);
    setPhotoProofUrl('');
  };

  // Submit new incident
  const handleReportIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncidentTitle.trim()) return;

    const newInc: IncidentReport = {
      id: `inc-${Date.now()}`,
      reportNumber: `INC-2026-0${incidents.length + 45}`,
      title: newIncidentTitle,
      type: newIncidentType,
      urgency: newIncidentUrgency,
      location: newIncidentLocation,
      ward: user.ward || 'Ward 14',
      description: newIncidentDesc || 'Reported from field worker mobile app.',
      reportedBy: `${user.firstName} ${user.lastName} (${workerRole === 'driver' ? 'Driver' : 'Collector'})`,
      reporterRole: workerRole,
      timestamp: 'Just now',
      status: 'Reported',
      photoUrl: newIncidentPhoto || 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80',
      vehicleNumber: workerRole === 'driver' ? 'DL-04-GH-3129' : undefined,
    };

    setIncidents([newInc, ...incidents]);
    setIsIncidentModalOpen(false);
    setNewIncidentTitle('');
    setNewIncidentDesc('');
    setNewIncidentPhoto('');

    const voiceAlert = `घटना रिपोर्ट संख्या ${newInc.reportNumber} दर्ज कर ली गई है। नगर निगम नियंत्रण कक्ष को अलर्ट प्रेषित कर दिया गया है।`;
    speakHindi(voiceAlert);
    showToast(`Incident #${newInc.reportNumber} logged successfully!`);
  };

  // Simulate QR Code scanning for residential bins
  const handleSimulateQrScan = () => {
    setIsQrScanning(true);
    speakHindi('क्यूआर कोड स्कैन किया जा रहा है...');
    setTimeout(() => {
      setIsQrScanning(false);
      const houseNo = Math.floor(Math.random() * 25) + 1;
      const res = `House #${houseNo}, Lane 4 (Aarav Sharma) - 100% Segregated (Wet + Dry). 10 Green Credits credited!`;
      setQrScanResult(res);
      setHouseholdsCovered((prev) => Math.min(totalHouseholds, prev + 1));
      setSegregationStats((prev) => ({ ...prev, green: prev.green + 1 }));
      speakHindi(`मकान नंबर ${houseNo} सत्यापित हुआ। 100 प्रतिशत अलग-अलग कचरा। नागरिक को 10 हरित अंक प्रदान किए गए।`);
    }, 1200);
  };

  // Trigger Emergency SOS
  const handleTriggerSos = () => {
    setIsSosActive(true);
    speakHindi('आपातकालीन सहायता अनुरोध सक्रिय है। नगर निगम कंट्रोल रूम और वार्ड सुपरवाइजर को जीपीएस लोकेशन भेज दी गई है। शांत रहें, सहायता रास्ते में है।');
    showToast('EMERGENCY SOS BROADCASTED TO WARD 14 CONTROL ROOM!');
  };

  // Navigation step simulation
  const navSteps = [
    { text: 'Head north on Kala Pathar Marg toward Sector 4 Market', hindi: 'काला पत्थर मार्ग पर उत्तर दिशा में 300 मीटर चलें' },
    { text: 'In 200m, turn right onto Community Center Service Lane', hindi: 'आगे 200 मीटर बाद कम्युनिटी सेंटर सर्विस लेन में दाएं मुड़ें' },
    { text: 'Destination NN-BIN-1401 will be on your left', hindi: 'गंतव्य स्मार्ट बिन NN-BIN-1401 आपके बाईं ओर होगा' },
  ];

  const handleNextNavStep = () => {
    if (navStepIndex < navSteps.length - 1) {
      const nextIdx = navStepIndex + 1;
      setNavStepIndex(nextIdx);
      setNavDistanceMeters((prev) => Math.max(100, prev - 450));
      setNavEtaMinutes((prev) => Math.max(1, prev - 2));
      speakHindi(navSteps[nextIdx].hindi);
    } else {
      speakHindi('आप गंतव्य पर पहुंच चुके हैं। कृपया कूड़ेदान खाली करना शुरू करें।');
      showToast('Arrived at Destination!');
      setIsSimulatingNav(false);
    }
  };

  // Filtered tasks
  const filteredTasks = tasks.filter((t) => {
    if (taskFilter !== 'all' && t.category !== taskFilter) return false;
    if (statusFilter === 'pending' && t.status === 'completed') return false;
    if (statusFilter === 'completed' && t.status !== 'completed') return false;
    return true;
  });

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#154212] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2.5 font-bold text-sm animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-[#9dd090]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Emergency SOS Banner if active */}
      {isSosActive && (
        <div className="bg-[#ffdad6] border-2 border-[#ba1a1a] rounded-2xl p-4 md:p-5 text-[#93000a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-[#ba1a1a] shrink-0" />
            <div>
              <h3 className="font-black text-lg">EMERGENCY SOS ACTIVE • आपातकालीन अलर्ट सक्रिय</h3>
              <p className="text-xs md:text-sm font-semibold text-[#93000a]/90">
                GPS Coords: 28.6412° N, 77.3715° E • Ward 14 Sanitation Control Room alerted. Supervisor assigned: Shri Rajesh Verma (+91 98111 22334).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => speakHindi('आपातकालीन सहायता अनुरोध सक्रिय है। सहायता रास्ते में है।')}
              className="p-2.5 bg-white text-[#93000a] rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span>स्थिति सुनें</span>
            </button>
            <button
              onClick={() => {
                setIsSosActive(false);
                speakHindi('आपातकालीन अलर्ट बंद कर दिया गया है।');
                showToast('Emergency SOS Deactivated');
              }}
              className="px-4 py-2.5 bg-[#ba1a1a] text-white rounded-xl font-bold text-xs cursor-pointer hover:bg-[#93000a]"
            >
              रद्द करें (Cancel)
            </button>
          </div>
        </div>
      )}

      {/* Top Banner: Worker Profile & Driver vs Collector Switcher */}
      <section className="bg-white border border-[#c2c9bb] rounded-2xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-xs font-bold text-[#154212] bg-[#bcf0ae] px-2.5 py-1 rounded-md">
              {user.organization || 'Ward 14 Sanitation Fleet DL-04'}
            </span>
            <span className="text-xs font-semibold text-[#515f74]">
              {user.firstName} {user.lastName} • {user.phone || '+91 98450 11223'}
            </span>
          </div>

          <h1 className={`font-black text-[#191c1e] mt-1.5 ${isSaralMode ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'}`}>
            {workerRole === 'driver' ? 'Sanitation Driver Operations (टिपर चालक)' : 'Sanitation Collector Operations (सफाई मित्र)'}
          </h1>
          <p className="text-xs md:text-sm text-[#515f74] mt-0.5">
            {workerRole === 'driver'
              ? 'Real-time compactor capacity, automated IoT bin tipping route, and MRF transfer navigation.'
              : 'Door-to-door residential beat, household waste segregation tracking, and QR barcode audit.'}
          </p>
        </div>

        {/* View Switcher & Audio Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Worker Subview Toggle */}
          <div className="flex bg-[#f2f4f6] p-1 rounded-xl border border-[#c2c9bb]">
            <button
              onClick={() => {
                setWorkerRole('driver');
                speakHindi('टिपर चालक मोड सक्रिय किया गया। वाहन क्षमता 3.4 टन।');
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                workerRole === 'driver' ? 'bg-[#154212] text-white shadow-xs' : 'text-[#515f74] hover:text-[#191c1e]'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>{isSaralMode ? 'चालक (Driver)' : 'Driver View'}</span>
            </button>
            <button
              onClick={() => {
                setWorkerRole('collector');
                speakHindi('डोर-टू-डोर कलेक्टर मोड सक्रिय किया गया।');
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                workerRole === 'collector' ? 'bg-[#154212] text-white shadow-xs' : 'text-[#515f74] hover:text-[#191c1e]'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>{isSaralMode ? 'कलेक्टर (Collector)' : 'Collector View'}</span>
            </button>
          </div>

          {/* Hindi Voice Overview */}
          <button
            onClick={() => {
              const overviewSpeech = workerRole === 'driver'
                ? `नमस्ते रमेश जी। आपका वाहन DL-04-GH-3129 तैयार है। कुल 5 स्टॉप निर्धारित हैं। वर्तमान पेलोड 3.4 टन है।`
                : `नमस्ते। आज कुल 65 घरों में से 48 घरों का कचरा एकत्र हो चुका है। 92 प्रतिशत पृथक्करण अनुपालन है।`;
              speakHindi(overviewSpeech);
            }}
            className="p-2.5 bg-[#f7f9fb] hover:bg-[#e0e3e5] border border-[#c2c9bb] text-[#154212] rounded-xl flex items-center gap-1.5 font-bold text-xs cursor-pointer shadow-xs"
            title="ऑडियो में सुनें"
          >
            <Volume2 className="w-4 h-4" />
            <span className="hidden sm:inline">{isSaralMode ? 'ऑडियो सुनें' : 'Listen Status'}</span>
          </button>

          {/* Emergency SOS Button */}
          <button
            onClick={handleTriggerSos}
            className="px-3.5 py-2.5 bg-[#ffdad6] hover:bg-[#ffb4ab] border border-[#ba1a1a] text-[#ba1a1a] rounded-xl flex items-center gap-1.5 font-black text-xs cursor-pointer shadow-xs active:scale-95"
            title="आपातकालीन सहायता मांगें"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>SOS (आपातकाल)</span>
          </button>
        </div>
      </section>

      {/* Role Specific Telemetry Header Banner */}
      {workerRole === 'driver' ? (
        /* Driver Truck Status Bar */
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#c2c9bb] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#515f74] font-bold">
              <span>TRUCK PAYLOAD CAPACITY</span>
              <span className="font-mono text-[#154212]">{Math.round((currentPayloadTons / maxPayloadTons) * 100)}% FULL</span>
            </div>
            <div className="text-2xl font-black font-mono text-[#191c1e] mt-1">
              {currentPayloadTons} <span className="text-sm font-normal text-[#515f74]">/ {maxPayloadTons} Metric Tons</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-[#e0e3e5] h-2.5 rounded-full overflow-hidden mt-2.5">
              <div
                className={`h-full transition-all duration-500 ${
                  currentPayloadTons > 4.2 ? 'bg-[#ba1a1a]' : currentPayloadTons > 3.2 ? 'bg-[#f59e0b]' : 'bg-[#154212]'
                }`}
                style={{ width: `${(currentPayloadTons / maxPayloadTons) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#72796e] mt-1.5">
              <span>Tare: 2.1 T</span>
              {currentPayloadTons > 4.0 ? (
                <span className="text-[#ba1a1a] font-bold">⚠️ Head to MRF soon</span>
              ) : (
                <span className="text-[#154212] font-semibold">1.6 T Remaining</span>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#c2c9bb] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#515f74] font-bold">
              <span>VEHICLE HEALTH</span>
              <span className="text-[#154212] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All Systems OK
              </span>
            </div>
            <div className="text-xl font-black text-[#191c1e] mt-1 font-mono">
              DL-04-GH-3129
            </div>
            <div className="flex items-center gap-3 text-xs text-[#515f74] mt-2">
              <div className="flex items-center gap-1">
                <Fuel className="w-3.5 h-3.5 text-[#154212]" />
                <span className="font-mono font-bold">{fuelLevel}% Fuel</span>
              </div>
              <div>•</div>
              <div>Compactor: <strong className="text-[#154212]">Ready</strong></div>
            </div>
          </div>

          <div className="bg-white border border-[#c2c9bb] rounded-2xl p-4 shadow-xs">
            <div className="text-xs text-[#515f74] font-bold">TODAY ROUTE PROGRESS</div>
            <div className="text-2xl font-black font-mono text-[#154212] mt-1">
              3 <span className="text-sm font-normal text-[#515f74]">/ 5 Stops Completed</span>
            </div>
            <p className="text-xs text-[#515f74] mt-1.5">
              Next: <strong>Community Center Market</strong> (ETA 6m)
            </p>
          </div>

          <div className="bg-white border border-[#c2c9bb] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-xs text-[#515f74] font-bold">UNLOAD AT TRANSFER STATION</div>
              <div className="text-xs text-[#515f74] mt-1">Rohini MRF Integrated Recycling Yard (5.2 km)</div>
            </div>
            <button
              onClick={() => {
                setCurrentPayloadTons(0.0);
                speakHindi('वाहन को रोहिणी एमआरएफ पर खाली कर दिया गया है। नया वजन 0.0 टन दर्ज हुआ।');
                showToast('Truck Unloaded at MRF! Payload reset to 0.0 Tons.');
              }}
              className="mt-2 w-full py-2 bg-[#f2f4f6] hover:bg-[#e0e3e5] border border-[#c2c9bb] text-[#154212] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Empty Payload at MRF</span>
            </button>
          </div>
        </section>
      ) : (
        /* Collector Household Tracker Bar */
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#c2c9bb] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#515f74] font-bold">
              <span>DOOR-TO-DOOR BEAT</span>
              <span className="font-mono text-[#154212]">{Math.round((householdsCovered / totalHouseholds) * 100)}% DONE</span>
            </div>
            <div className="text-2xl font-black font-mono text-[#191c1e] mt-1">
              {householdsCovered} <span className="text-sm font-normal text-[#515f74]">/ {totalHouseholds} Houses</span>
            </div>
            <div className="w-full bg-[#e0e3e5] h-2.5 rounded-full overflow-hidden mt-2.5">
              <div
                className="h-full bg-[#154212] transition-all duration-500"
                style={{ width: `${(householdsCovered / totalHouseholds) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-[#72796e] mt-1.5 block">Ward 14 Pocket A & B Lanes</span>
          </div>

          <div className="bg-white border border-[#c2c9bb] rounded-2xl p-4 shadow-xs">
            <div className="text-xs text-[#515f74] font-bold">SEGREGATION COMPLIANCE</div>
            <div className="text-2xl font-black font-mono text-[#154212] mt-1">
              92% <span className="text-xs font-normal text-[#515f74]">Compliant</span>
            </div>
            <div className="flex gap-2 text-[11px] font-bold mt-2">
              <span className="text-[#154212] bg-[#bcf0ae]/40 px-2 py-0.5 rounded">🟢 {segregationStats.green} Clean</span>
              <span className="text-[#b45309] bg-[#fef3c7] px-2 py-0.5 rounded">🟡 {segregationStats.amber} Mixed</span>
              <span className="text-[#ba1a1a] bg-[#ffdad6] px-2 py-0.5 rounded">🔴 {segregationStats.red} Refused</span>
            </div>
          </div>

          <div className="bg-white border border-[#c2c9bb] rounded-2xl p-4 shadow-xs">
            <div className="text-xs text-[#515f74] font-bold">QR / NFC GATE SCANNER</div>
            <div className="text-xs text-[#515f74] mt-1">Scan citizen gate barcodes to verify pickup</div>
            <button
              onClick={handleSimulateQrScan}
              disabled={isQrScanning}
              className="mt-2 w-full py-2 bg-[#154212] text-white hover:bg-[#2d5a27] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <QrCode className="w-4 h-4" />
              <span>{isQrScanning ? 'Scanning...' : 'Scan Resident Barcode'}</span>
            </button>
            {qrScanResult && (
              <div className="text-[10px] font-semibold text-[#154212] mt-1 bg-[#bcf0ae]/20 p-1.5 rounded">
                ✓ {qrScanResult}
              </div>
            )}
          </div>

          <div className="bg-white border border-[#c2c9bb] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-xs text-[#515f74] font-bold">SUPERVISOR HELPLINE</div>
              <div className="text-xs text-[#191c1e] font-semibold mt-1">Shri Rajesh Verma (Ward 14)</div>
              <div className="text-xs font-mono text-[#154212] mt-0.5">+91 98111 22334</div>
            </div>
            <a
              href="tel:+919811122334"
              className="mt-2 py-2 bg-[#f2f4f6] hover:bg-[#e0e3e5] border border-[#c2c9bb] text-[#154212] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Supervisor</span>
            </a>
          </div>
        </section>
      )}

      {/* Sub-Navigation Tabs: Tasks, Route Navigation, Incident Reporting, Safety Checklist */}
      <nav className="flex border-b border-[#c2c9bb] gap-2 md:gap-4 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-2.5 px-3 font-bold text-sm border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'tasks'
              ? 'border-[#154212] text-[#154212]'
              : 'border-transparent text-[#515f74] hover:text-[#191c1e]'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>{isSaralMode ? 'कार्य सूची (Task List)' : 'Assigned Task List'}</span>
          <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-[#e0e3e5] text-[#191c1e]">
            {tasks.filter((t) => t.status !== 'completed').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('navigation')}
          className={`pb-2.5 px-3 font-bold text-sm border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'navigation'
              ? 'border-[#154212] text-[#154212]'
              : 'border-transparent text-[#515f74] hover:text-[#191c1e]'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>{isSaralMode ? 'मार्गदर्शन (Route Navigation)' : 'Live Route Navigation'}</span>
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`pb-2.5 px-3 font-bold text-sm border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'incidents'
              ? 'border-[#154212] text-[#154212]'
              : 'border-transparent text-[#515f74] hover:text-[#191c1e]'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>{isSaralMode ? 'घटना रिपोर्टिंग (Incident Reporting)' : 'Incident Reporting'}</span>
          <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a]">
            {incidents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('checklist')}
          className={`pb-2.5 px-3 font-bold text-sm border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'checklist'
              ? 'border-[#154212] text-[#154212]'
              : 'border-transparent text-[#515f74] hover:text-[#191c1e]'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>{isSaralMode ? 'सुरक्षा जांच (Safety Checklist)' : 'Vehicle & Safety Checklist'}</span>
        </button>
      </nav>

      {/* TAB 1: ASSIGNED TASK LISTS */}
      {activeTab === 'tasks' && (
        <section className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-white border border-[#c2c9bb] rounded-xl p-3 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#515f74] uppercase">Filter:</span>
              <button
                onClick={() => setTaskFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  taskFilter === 'all' ? 'bg-[#154212] text-white' : 'bg-[#f2f4f6] text-[#515f74] hover:text-[#191c1e]'
                }`}
              >
                All Tasks ({tasks.length})
              </button>
              <button
                onClick={() => setTaskFilter('driver_bin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  taskFilter === 'driver_bin' ? 'bg-[#154212] text-white' : 'bg-[#f2f4f6] text-[#515f74] hover:text-[#191c1e]'
                }`}
              >
                Smart Bins
              </button>
              <button
                onClick={() => setTaskFilter('collector_door')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  taskFilter === 'collector_door' ? 'bg-[#154212] text-white' : 'bg-[#f2f4f6] text-[#515f74] hover:text-[#191c1e]'
                }`}
              >
                Door-to-Door Beats
              </button>
              <button
                onClick={() => setTaskFilter('urgent_grievance')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  taskFilter === 'urgent_grievance' ? 'bg-[#ba1a1a] text-white' : 'bg-[#f2f4f6] text-[#ba1a1a] hover:bg-[#ffdad6]'
                }`}
              >
                Urgent Grievances
              </button>
              <button
                onClick={() => setTaskFilter('bulk_pickup')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  taskFilter === 'bulk_pickup' ? 'bg-[#154212] text-white' : 'bg-[#f2f4f6] text-[#515f74] hover:text-[#191c1e]'
                }`}
              >
                Bulk Pickups
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border border-[#c2c9bb] cursor-pointer ${
                  statusFilter === 'pending' ? 'bg-[#154212] text-white' : 'bg-white text-[#515f74]'
                }`}
              >
                Pending Only
              </button>
            </div>
          </div>

          {/* Tasks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map((t) => (
              <div
                key={t.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs space-y-3 transition-all ${
                  t.status === 'completed'
                    ? 'border-[#c2c9bb] bg-[#f9fafb] opacity-80'
                    : t.priority === 'urgent'
                    ? 'border-2 border-[#ba1a1a]'
                    : 'border-[#c2c9bb]'
                }`}
              >
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#eceef0]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${
                        t.priority === 'urgent'
                          ? 'bg-[#ffdad6] text-[#ba1a1a]'
                          : t.priority === 'high'
                          ? 'bg-[#fef3c7] text-[#92400e]'
                          : 'bg-[#f2f4f6] text-[#515f74]'
                      }`}
                    >
                      {t.priority} Priority
                    </span>
                    <span className="text-[11px] font-mono font-bold text-[#154212] bg-[#bcf0ae]/30 px-2 py-0.5 rounded">
                      {t.category === 'driver_bin'
                        ? 'IoT Bin'
                        : t.category === 'collector_door'
                        ? 'Door-to-Door'
                        : t.category === 'urgent_grievance'
                        ? 'Grievance SLA'
                        : 'Bulk Transport'}
                    </span>
                  </div>

                  <span
                    className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-md ${
                      t.status === 'completed'
                        ? 'bg-[#bcf0ae] text-[#154212]'
                        : 'bg-[#d5e3fd] text-[#0d1c2f]'
                    }`}
                  >
                    {t.status === 'completed' ? 'Completed ✓' : 'Pending'}
                  </span>
                </div>

                {/* Content */}
                <div>
                  <h3 className={`font-black text-[#191c1e] ${isSaralMode ? 'text-lg' : 'text-base'}`}>
                    {isSaralMode ? t.titleHindi : t.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-[#515f74] mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#154212] shrink-0" />
                    <span>{t.location} ({t.ward})</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#515f74] mt-2">
                    <div>Est. Weight: <strong className="text-[#191c1e]">~{t.estimatedKg} kg</strong></div>
                    <div>•</div>
                    <div className="capitalize">Type: <strong className="text-[#154212]">{t.wasteType}</strong></div>
                  </div>
                </div>

                {/* Hindi Instructions Audio Bar */}
                <div className="bg-[#f7f9fb] border border-[#e0e3e5] rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <span className="text-[#42493e] italic">{t.instructionsHindi}</span>
                  <button
                    onClick={() => speakHindi(t.instructionsHindi)}
                    className="p-1.5 bg-white hover:bg-[#e0e3e5] rounded-lg border border-[#c2c9bb] text-[#154212] cursor-pointer shrink-0 ml-2"
                    title="निर्देश सुनें"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {t.status !== 'completed' ? (
                    <>
                      <button
                        onClick={() => {
                          setCompleteModalTask(t);
                          setRecordedWeightInput(t.estimatedKg);
                        }}
                        className="flex-1 py-2.5 px-4 bg-[#154212] text-white text-xs font-bold rounded-xl hover:bg-[#2d5a27] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isSaralMode ? 'कार्य पूर्ण करें (Complete)' : 'Mark as Completed'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedTask(t);
                          setActiveTab('navigation');
                          speakHindi(`गंतव्य ${t.location} के लिए नेविगेशन सक्रिय किया गया।`);
                        }}
                        className="py-2.5 px-3 bg-[#f2f4f6] hover:bg-[#e0e3e5] border border-[#c2c9bb] text-[#154212] text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                        title="मार्ग देखें"
                      >
                        <Navigation className="w-4 h-4" />
                        <span className="hidden sm:inline">Navigate</span>
                      </button>
                    </>
                  ) : (
                    <div className="w-full py-2 bg-[#bcf0ae]/30 text-[#154212] text-xs font-bold rounded-xl text-center">
                      ✓ Task Completed & Uploaded to Municipal Server
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 2: LIVE ROUTE NAVIGATION */}
      {activeTab === 'navigation' && (
        <section className="space-y-6">
          {/* Live Navigation Head-Up Guidance Display */}
          <div className="bg-[#0d1c2f] text-white rounded-3xl p-6 shadow-xl border border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
                  LIVE GPS NAVIGATION ACTIVE
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300 font-mono">
                <span>SPEED: <strong>28 km/h</strong></span>
                <span>•</span>
                <span>DESTINATION ETA: <strong className="text-emerald-300">{navEtaMinutes} MINS</strong></span>
                <span>•</span>
                <span>DIST: <strong className="text-emerald-300">{navDistanceMeters} METERS</strong></span>
              </div>
            </div>

            {/* Turn Guidance */}
            <div className="flex items-start gap-4 py-2">
              <div className="p-3.5 bg-emerald-600/30 border border-emerald-500/40 rounded-2xl text-emerald-400 shrink-0">
                <CornerUpRight className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  CURRENT GUIDANCE (अगला मोड़)
                </span>
                <h2 className="text-xl md:text-2xl font-black mt-0.5 text-white">
                  {navSteps[navStepIndex].text}
                </h2>
                <p className="text-sm font-semibold text-emerald-300 mt-1">
                  {navSteps[navStepIndex].hindi}
                </p>
              </div>
            </div>

            {/* Simulation Controls & Hindi Voice */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-700">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => speakHindi(navSteps[navStepIndex].hindi)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>निर्देश सुनें (Voice Prompt)</span>
                </button>
                <button
                  onClick={handleNextNavStep}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Simulate Next Turn (अगला कदम)</span>
                </button>
              </div>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedTask.coordinates.lat},${selectedTask.coordinates.lng}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-white text-[#0d1c2f] hover:bg-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in Google Maps</span>
              </a>
            </div>
          </div>

          {/* Route Waypoint Sequence */}
          <div className="bg-white border border-[#c2c9bb] rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-[#191c1e]">Daily Beat Route Waypoints</h3>
                <p className="text-xs text-[#515f74]">Optimized sequential stops for Ward 14 collection crew.</p>
              </div>
              <button
                onClick={() => speakHindi('मार्ग में कुल 5 पड़ाव हैं। पहला पड़ाव कम्युनिटी सेंटर मार्केट है।')}
                className="p-2 bg-[#f7f9fb] hover:bg-[#e0e3e5] border border-[#c2c9bb] rounded-xl text-[#154212] font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>ऑडियो रूट</span>
              </button>
            </div>

            <div className="space-y-3">
              {tasks.map((task, idx) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition-all cursor-pointer ${
                    selectedTask.id === task.id
                      ? 'border-2 border-[#154212] bg-[#bcf0ae]/15'
                      : 'border-[#c2c9bb] bg-white hover:bg-[#f7f9fb]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      task.status === 'completed'
                        ? 'bg-[#bcf0ae] text-[#154212]'
                        : selectedTask.id === task.id
                        ? 'bg-[#154212] text-white'
                        : 'bg-[#e0e3e5] text-[#515f74]'
                    }`}>
                      {task.status === 'completed' ? '✓' : idx + 1}
                    </div>
                    <div>
                      <div className="font-black text-sm text-[#191c1e]">{task.title}</div>
                      <div className="text-xs text-[#515f74] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#154212]" />
                        <span>{task.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#515f74]">
                      ~{task.estimatedKg} kg
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTask(task);
                        speakHindi(task.instructionsHindi);
                      }}
                      className="p-2 bg-white hover:bg-[#eceef0] border border-[#c2c9bb] rounded-lg text-[#154212] cursor-pointer"
                      title="निर्देश सुनें"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: INCIDENT REPORTING */}
      {activeTab === 'incidents' && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h2 className="text-xl font-black text-[#191c1e]">Field Incident & Hazard Reporting</h2>
              <p className="text-xs text-[#515f74]">
                Report road blockages, bio-medical hazard spills, truck breakdown, or citizen waste disputes.
              </p>
            </div>
            <button
              onClick={() => setIsIncidentModalOpen(true)}
              className="px-4 py-2.5 bg-[#ba1a1a] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-[#93000a] transition-all cursor-pointer shadow-xs"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Report New Incident (नई समस्या दर्ज करें)</span>
            </button>
          </div>

          {/* Incidents Feed */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="bg-white border border-[#c2c9bb] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#eceef0]">
                    <span className="font-mono text-xs font-bold text-[#ba1a1a]">{inc.reportNumber}</span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        inc.urgency === 'Critical Emergency'
                          ? 'bg-[#ffdad6] text-[#ba1a1a]'
                          : 'bg-[#fef3c7] text-[#92400e]'
                      }`}
                    >
                      {inc.urgency}
                    </span>
                  </div>

                  <h4 className="font-black text-base text-[#191c1e] mt-2">{inc.title}</h4>
                  <p className="text-xs text-[#42493e] mt-1 leading-relaxed">{inc.description}</p>

                  <div className="flex items-center gap-1.5 text-xs text-[#515f74] mt-2">
                    <MapPin className="w-3.5 h-3.5 text-[#154212]" />
                    <span>{inc.location} ({inc.ward})</span>
                  </div>

                  {inc.photoUrl && (
                    <div className="mt-2.5 rounded-xl overflow-hidden border border-[#c2c9bb] max-h-32">
                      <img src={inc.photoUrl} alt="Evidence" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#eceef0] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-[#72796e] block">Status</span>
                    <span className="font-black text-[#154212]">{inc.status}</span>
                  </div>
                  <button
                    onClick={() => speakHindi(`रिपोर्ट ${inc.reportNumber}: ${inc.title}। स्थिति: ${inc.status}।`)}
                    className="p-1.5 bg-[#f7f9fb] hover:bg-[#e0e3e5] border border-[#c2c9bb] rounded-lg text-[#154212] cursor-pointer"
                    title="सुनें"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 4: VEHICLE & SAFETY CHECKLIST */}
      {activeTab === 'checklist' && (
        <section className="bg-white border border-[#c2c9bb] rounded-2xl p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-[#eceef0]">
            <div>
              <h3 className="font-black text-lg text-[#191c1e]">Daily Pre-Trip Inspection & PPE Compliance</h3>
              <p className="text-xs text-[#515f74]">Mandatory Swachh Bharat safety audit before commencing road route.</p>
            </div>
            <button
              onClick={() => speakHindi('कृपया यात्रा शुरू करने से पहले हाइड्रोलिक लिफ्ट, ब्रेक, और दस्तानों की जांच पूरी करें।')}
              className="p-2 bg-[#f7f9fb] border border-[#c2c9bb] rounded-xl text-[#154212] font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span>ऑडियो गाइड</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { key: 'brakes', label: 'Brakes & Steering Response', hindi: 'ब्रेक और स्टीयरिंग कार्यशील' },
              { key: 'hydraulics', label: 'Rear Compactor Hydraulic Lift', hindi: 'रियर कॉम्पेक्टर हाइड्रोलिक लिफ्ट' },
              { key: 'tires', label: 'Tire Pressure & Tread (>32 PSI)', hindi: 'टायर हवा का दबाव और स्थिति' },
              { key: 'reverseAlarm', label: 'Reverse Horn & Beacon Light', hindi: 'रिवर्स हॉर्न और चेतावनी लाइट' },
              { key: 'firstAid', label: 'Emergency First Aid Kit in Cabin', hindi: 'प्राथमिक चिकित्सा किट उपलब्ध' },
              { key: 'ppeGloves', label: 'Safety Heavy-Duty Gloves & Boots', hindi: 'दस्ताने और सुरक्षा जूते' },
            ].map((item) => {
              const checked = checklist[item.key as keyof typeof checklist];
              return (
                <div
                  key={item.key}
                  onClick={() => {
                    setChecklist((prev) => ({ ...prev, [item.key]: !checked }));
                    speakHindi(`${item.hindi}: ${!checked ? 'सत्यापित' : 'अपूर्ण'}`);
                  }}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    checked ? 'bg-[#bcf0ae]/20 border-[#154212]' : 'bg-white border-[#c2c9bb]'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs text-[#191c1e]">{item.label}</div>
                    <div className="text-[11px] text-[#515f74]">{item.hindi}</div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs ${
                      checked ? 'bg-[#154212] text-white' : 'border border-[#c2c9bb] text-transparent'
                    }`}
                  >
                    ✓
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-[#f7f9fb] border border-[#e0e3e5] rounded-xl text-xs flex items-center justify-between text-[#515f74]">
            <span>Compliance Verified for Tipper DL-04-GH-3129 • Inspector: Ward 14 Shift In-charge</span>
            <span className="font-bold text-[#154212]">Status: Cleared for Duty</span>
          </div>
        </section>
      )}

      {/* TASK COMPLETION MODAL */}
      {completeModalTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#c2c9bb] space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#eceef0]">
              <div className="font-black text-lg text-[#191c1e]">Complete Task</div>
              <button
                onClick={() => setCompleteModalTask(null)}
                className="p-1 text-[#515f74] hover:text-[#191c1e] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h4 className="font-black text-base text-[#191c1e]">{completeModalTask.title}</h4>
              <p className="text-xs text-[#515f74] mt-0.5">{completeModalTask.location}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1e] mb-1">
                Waste Weight Collected (कचरा वजन - किलोग्राम)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={recordedWeightInput}
                  onChange={(e) => setRecordedWeightInput(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-[#c2c9bb] rounded-xl font-mono font-bold text-lg text-[#191c1e]"
                />
                <span className="absolute right-3 top-3 text-xs font-bold text-[#515f74]">KG</span>
              </div>
            </div>

            {/* Photo Proof Simulation */}
            <div>
              <label className="block text-xs font-bold text-[#191c1e] mb-1">
                Attach Cleared Site Photo (साफ़ स्थल का फोटो)
              </label>
              <button
                type="button"
                onClick={() => {
                  setPhotoProofUrl('https://images.unsplash.com/photo-1611288875661-d79044b0445a?w=600&auto=format&fit=crop&q=80');
                  speakHindi('फोटो प्रमाण संलग्न किया गया।');
                }}
                className="w-full py-2.5 border-2 border-dashed border-[#c2c9bb] hover:border-[#154212] rounded-xl text-xs font-bold text-[#154212] flex items-center justify-center gap-2 cursor-pointer bg-[#f7f9fb]"
              >
                <Camera className="w-4 h-4" />
                <span>{photoProofUrl ? 'Photo Attached (क्लिक कर बदलें)' : 'Take Photo with Device Camera'}</span>
              </button>
              {photoProofUrl && (
                <div className="mt-2 rounded-xl overflow-hidden border border-[#c2c9bb] h-24">
                  <img src={photoProofUrl} alt="Proof" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCompleteModalTask(null)}
                className="flex-1 py-2.5 bg-[#f2f4f6] text-[#515f74] font-bold text-xs rounded-xl hover:bg-[#e0e3e5] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteTask}
                className="flex-1 py-2.5 bg-[#154212] text-white font-bold text-xs rounded-xl hover:bg-[#2d5a27] cursor-pointer shadow-xs"
              >
                Save & Update Server
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INCIDENT REPORT MODAL */}
      {isIncidentModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#c2c9bb] space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#eceef0]">
              <div>
                <h3 className="font-black text-lg text-[#ba1a1a] flex items-center gap-1.5">
                  <AlertTriangle className="w-5 h-5 text-[#ba1a1a]" />
                  <span>Report Road / Health Incident</span>
                </h3>
                <p className="text-xs text-[#515f74]">Direct urgent alert to Nagar Nigam Zone IV Dispatch</p>
              </div>
              <button
                onClick={() => setIsIncidentModalOpen(false)}
                className="p-1 text-[#515f74] hover:text-[#191c1e] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportIncident} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#191c1e] mb-1">
                  Incident Category (घटना का प्रकार)
                </label>
                <select
                  value={newIncidentType}
                  onChange={(e) => setNewIncidentType(e.target.value as IncidentReport['type'])}
                  className="w-full px-3 py-2 border border-[#c2c9bb] rounded-xl text-xs font-bold text-[#191c1e]"
                >
                  <option value="road_blockage">Road Blockage / Fallen Tree (सड़क अवरोध / पेड़ गिरा)</option>
                  <option value="hazardous_waste">Hazardous / Syringe Medical Waste (अवैध मेडिकल कचरा)</option>
                  <option value="vehicle_breakdown">Truck Mechanical Breakdown / Puncture (गाड़ी खराबी)</option>
                  <option value="citizen_dispute">Citizen Dispute / Waste Refusal (कचरा विवाद)</option>
                  <option value="bin_fire">Dumpster Smoke / Fire Hazard (कूड़ेदान में आग)</option>
                  <option value="dead_animal">Dead Animal Carcass Removal (मृत पशु शव)</option>
                  <option value="other">Other Civic Emergency (अन्य समस्या)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1e] mb-1">
                  Urgency Level (गंभीरता)
                </label>
                <div className="flex gap-2">
                  {(['Low', 'Medium', 'Critical Emergency'] as const).map((urg) => (
                    <button
                      key={urg}
                      type="button"
                      onClick={() => setNewIncidentUrgency(urg)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                        newIncidentUrgency === urg
                          ? urg === 'Critical Emergency'
                            ? 'bg-[#ba1a1a] text-white border-[#ba1a1a]'
                            : 'bg-[#154212] text-white border-[#154212]'
                          : 'bg-white text-[#515f74] border-[#c2c9bb]'
                      }`}
                    >
                      {urg}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1e] mb-1">
                  Incident Title / Summary (शीर्षक)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Tree branch blocking lane 4 access"
                  value={newIncidentTitle}
                  onChange={(e) => setNewIncidentTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#c2c9bb] rounded-xl text-xs font-semibold text-[#191c1e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1e] mb-1">
                  Location / Landmark (स्थान)
                </label>
                <input
                  type="text"
                  required
                  value={newIncidentLocation}
                  onChange={(e) => setNewIncidentLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-[#c2c9bb] rounded-xl text-xs font-semibold text-[#191c1e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1e] mb-1">
                  Description / Field Details (विवरण)
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide details about the issue..."
                  value={newIncidentDesc}
                  onChange={(e) => setNewIncidentDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-[#c2c9bb] rounded-xl text-xs font-normal text-[#191c1e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1e] mb-1">
                  Photo Evidence (फोटो संलग्न करें)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setNewIncidentPhoto('https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80');
                    speakHindi('फोटो साक्ष्य संलग्न किया गया।');
                  }}
                  className="w-full py-2.5 border border-dashed border-[#c2c9bb] hover:border-[#ba1a1a] rounded-xl text-xs font-bold text-[#ba1a1a] flex items-center justify-center gap-2 cursor-pointer bg-[#f7f9fb]"
                >
                  <Camera className="w-4 h-4" />
                  <span>{newIncidentPhoto ? 'Photo Attached ✓' : 'Attach Camera Photo'}</span>
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsIncidentModalOpen(false)}
                  className="flex-1 py-2.5 bg-[#f2f4f6] text-[#515f74] font-bold text-xs rounded-xl hover:bg-[#e0e3e5] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#ba1a1a] text-white font-bold text-xs rounded-xl hover:bg-[#93000a] cursor-pointer shadow-xs"
                >
                  Broadcast to Control Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

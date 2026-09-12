import React, { useState, useRef } from 'react';
import { User, WasteBin, Grievance, GreenReward, PickupBooking, WasteCategory } from '../types';
import { SegmentedBar } from './SegmentedBar';
import { speakHindi } from '../utils/saralHelper';
import { 
  Camera, Plus, Clock, MapPin, CheckCircle, AlertTriangle, Truck, Award, 
  Trash2, ShieldCheck, Calendar, ArrowRight, RefreshCw, Sparkles, X, ChevronRight,
  Volume2, UploadCloud, Check
} from 'lucide-react';

interface CitizenViewProps {
  user: User;
  bins: WasteBin[];
  grievances: Grievance[];
  rewards: GreenReward[];
  pickups: PickupBooking[];
  onAddGrievance: (grievance: Omit<Grievance, 'id' | 'ticketNumber' | 'createdAt'>) => void;
  onBookPickup: (pickup: Omit<PickupBooking, 'id' | 'bookingCode'>) => void;
  onRedeemReward: (reward: GreenReward) => void;
  isSaralMode?: boolean;
}

export const CitizenView: React.FC<CitizenViewProps> = ({
  user,
  bins,
  grievances,
  rewards,
  pickups,
  onAddGrievance,
  onBookPickup,
  onRedeemReward,
  isSaralMode = false,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'bins' | 'grievances' | 'bulk_pickup' | 'rewards'>('overview');
  
  // Modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [selectedBinForReport, setSelectedBinForReport] = useState<WasteBin | null>(null);

  // New Grievance form state
  const [gTitle, setGTitle] = useState('');
  const [gCategory, setGCategory] = useState<Grievance['category']>('overflow');
  const [gDescription, setGDescription] = useState('');
  const [gLocation, setGLocation] = useState('Central Market Road, Sector 4');
  const [gUrgency, setGUrgency] = useState<Grievance['urgency']>('Normal');
  const [gPhotoUrl, setGPhotoUrl] = useState<string>('https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiTagSuggestion, setAiTagSuggestion] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Bulk pickup form state
  const [pCategory, setPCategory] = useState<WasteCategory>('construction');
  const [pDate, setPDate] = useState('Tomorrow (Aug 24)');
  const [pSlot, setPSlot] = useState('09:00 AM - 12:00 PM');
  const [pAddress, setPAddress] = useState('Flat 402, Lotus Towers, Sector 4, Ward 14');
  const [pWeight, setPWeight] = useState(50);
  const [pInstructions, setPInstructions] = useState('');

  // Real Gemini AI Waste classifier via /api/classify-waste
  const handleClassifyWaste = async (options: { sampleType?: string; file?: File }) => {
    setIsAiAnalyzing(true);
    setAiTagSuggestion(null);

    try {
      let requestBody: any = {};

      if (options.file) {
        // Read file as base64
        const reader = new FileReader();
        const filePromise = new Promise<{ base64: string; dataUrl: string }>((resolve, reject) => {
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(',')[1];
            resolve({ base64, dataUrl });
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(options.file);
        const { base64, dataUrl } = await filePromise;

        setGPhotoUrl(dataUrl);
        requestBody = {
          imageBase64: base64,
          mimeType: options.file.type || 'image/jpeg',
        };
      } else if (options.sampleType) {
        requestBody = {
          sampleType: options.sampleType,
        };
        // Set sample preview image URL
        if (options.sampleType === 'overflow') {
          setGPhotoUrl('https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80');
        } else if (options.sampleType === 'debris') {
          setGPhotoUrl('https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=600&q=80');
        } else {
          setGPhotoUrl('https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80');
        }
      }

      const res = await fetch('/api/classify-waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.title) setGTitle(data.title);
      if (data.category) setGCategory(data.category);
      if (data.description) setGDescription(data.description);
      if (data.urgency) setGUrgency(data.urgency);

      const confidence = data.confidence || 96;
      const tagStr = data.summary
        ? `🤖 Gemini 2.5 Flash (${confidence}% confidence): ${data.summary}`
        : `🤖 Gemini 2.5 Flash (${confidence}% confidence): Detected ${data.title}. Priority: ${data.urgency}.`;
      setAiTagSuggestion(tagStr);
    } catch (err) {
      console.warn('Backend waste classification call encountered issue, using heuristic fallback:', err);
      // Fallback
      if (options.sampleType === 'debris') {
        setGTitle('Unattended Construction Rubble on Footpath');
        setGCategory('construction');
        setGDescription('Broken concrete tiles, brick pieces, and loose gravel obstructing pedestrian lane.');
        setGUrgency('Normal');
        setAiTagSuggestion('AI Detection (95% confidence): Construction & Demolition (C&D) Debris.');
      } else if (options.sampleType === 'dump') {
        setGTitle('Open Garbage Dump at Corner');
        setGCategory('illegal_dumping');
        setGDescription('Unsegregated household wet and dry garbage dumped near electric transformer.');
        setGUrgency('Critical Emergency');
        setAiTagSuggestion('AI Detection (99% confidence): Illegal Roadside Garbage Dump.');
      } else {
        setGTitle('Overflowing Commercial Dustbin');
        setGCategory('overflow');
        setGDescription('Mixed dry waste, packaging boxes and plastic beverage bottles spilling outside municipal bin enclosure.');
        setGUrgency('High');
        setAiTagSuggestion('AI Detection (98% confidence): Mixed Dry Plastic & Paper Overflow.');
      }
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleClassifyWaste({ file });
    }
  };

  const handleSubmitGrievance = (e: React.FormEvent) => {
    e.preventDefault();
    onAddGrievance({
      title: gTitle || 'Waste overflow complaint',
      category: gCategory,
      description: gDescription || 'Urgent clearance requested.',
      location: gLocation,
      ward: user.ward || 'Ward 14',
      citizenName: `${user.firstName} ${user.lastName}`,
      citizenContact: user.phone || '+91 98765 43210',
      urgency: gUrgency,
      photoUrl: gPhotoUrl,
      status: 'Pending',
    });
    setShowReportModal(false);
    setActiveSubTab('grievances');
    // Reset
    setGTitle('');
    setGDescription('');
    setAiTagSuggestion(null);
  };

  const handleSubmitPickup = (e: React.FormEvent) => {
    e.preventDefault();
    onBookPickup({
      category: pCategory,
      scheduledDate: pDate,
      timeSlot: pSlot,
      address: pAddress,
      ward: user.ward || 'Ward 14',
      contactNumber: user.phone || '+91 98765 43210',
      estimatedWeightKg: Number(pWeight) || 30,
      status: 'Scheduled',
      instructions: pInstructions,
    });
    setShowPickupModal(false);
    setActiveSubTab('bulk_pickup');
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
      {/* Ward Status Banner */}
      <div className="bg-white border border-[#c2c9bb] rounded-lg p-4 md:p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#154212] animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#154212]">
              Live Ward Status • {user.ward || 'Ward 14 (Indirapuram Sector 4)'}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#191c1e]">
            Welcome back, {user.firstName}
          </h1>
          <p className="text-xs md:text-sm text-[#515f74] mt-0.5">
            Your neighborhood sanitation score is <strong className="text-[#154212]">94% (Grade A - Clean Ward)</strong>
          </p>
        </div>

        {/* Live Tipper Van Notification Card */}
        <div className="bg-[#f7f9fb] border border-[#c2c9bb] rounded-md p-3 flex items-center gap-3 w-full md:w-auto">
          <div className="p-2 bg-[#154212] text-white rounded">
            <Truck className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <div className="font-semibold text-[#191c1e] flex items-center gap-1.5">
              <span>Door-to-Door Tipper #DL-04-AB</span>
              <span className="px-1.5 py-0.5 rounded bg-[#9dd090] text-[#154212] font-bold text-[10px]">EN ROUTE</span>
            </div>
            <p className="text-[#515f74]">Arriving at your street in <strong className="text-[#154212]">~12 mins</strong></p>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className={`flex border-b border-[#e0e3e5] overflow-x-auto gap-2 font-semibold ${isSaralMode ? 'text-sm md:text-base py-1' : 'text-xs'}`}>
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'overview'
              ? 'border-[#154212] text-[#154212]'
              : 'border-transparent text-[#515f74] hover:text-[#191c1e]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">dashboard</span>
          <span>{isSaralMode ? 'Overview (सारांश)' : 'Overview'}</span>
        </button>
        <button
          onClick={() => setActiveSubTab('bins')}
          className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'bins'
              ? 'border-[#154212] text-[#154212]'
              : 'border-transparent text-[#515f74] hover:text-[#191c1e]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
          <span>{isSaralMode ? `Smart Bins (कूड़ेदान - ${bins.length})` : `Smart Bin Network (${bins.length})`}</span>
        </button>
        <button
          onClick={() => setActiveSubTab('grievances')}
          className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'grievances'
              ? 'border-[#154212] text-[#154212]'
              : 'border-transparent text-[#515f74] hover:text-[#191c1e]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">report_problem</span>
          <span>{isSaralMode ? `My Complaints (शिकायतें - ${grievances.length})` : `My Grievances (${grievances.length})`}</span>
        </button>
        <button
          onClick={() => setActiveSubTab('bulk_pickup')}
          className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'bulk_pickup'
              ? 'border-[#154212] text-[#154212]'
              : 'border-transparent text-[#515f74] hover:text-[#191c1e]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">local_shipping</span>
          <span>{isSaralMode ? `Bulk Pickup (बड़ा कचरा - ${pickups.length})` : `Bulk Pickup (${pickups.length})`}</span>
        </button>
        <button
          onClick={() => setActiveSubTab('rewards')}
          className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'rewards'
              ? 'border-[#154212] text-[#154212]'
              : 'border-transparent text-[#515f74] hover:text-[#191c1e]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">eco</span>
          <span>{isSaralMode ? `Green Credits (इनाम - ${user.greenPoints || 340})` : `Green Credits (${user.greenPoints || 340} pts)`}</span>
        </button>
      </div>

      {/* Main Content Areas */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Action Grid */}
          {isSaralMode ? (
            /* Saral Mode: Large Square Icon Buttons with Hindi + Audio */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Action 1: Report / शिकायत */}
              <div className="relative group">
                <button
                  onClick={() => setShowReportModal(true)}
                  className="w-full min-h-[120px] p-6 bg-white border-2 border-[#c2c9bb] hover:border-[#154212] rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer shadow-sm hover:bg-[#f7f9fb]"
                >
                  <div className="w-14 h-14 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-extrabold text-xl text-[#191c1e]">Report</div>
                    <div className="font-bold text-lg text-[#154212]">शिकायत दर्ज करें</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakHindi('शिकायत दर्ज करने के लिए यहाँ दबाएँ');
                  }}
                  className="absolute top-3 right-3 p-2 bg-[#f7f9fb] hover:bg-[#e0e3e5] rounded-full text-[#154212] border border-[#c2c9bb] cursor-pointer"
                  title="आवाज़ में सुनें"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {/* Action 2: Pickup / उठाना */}
              <div className="relative group">
                <button
                  onClick={() => setShowPickupModal(true)}
                  className="w-full min-h-[120px] p-6 bg-white border-2 border-[#c2c9bb] hover:border-[#154212] rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer shadow-sm hover:bg-[#f7f9fb]"
                >
                  <div className="w-14 h-14 rounded-full bg-[#d5e3fd] text-[#0d1c2f] flex items-center justify-center">
                    <Truck className="w-8 h-8" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-extrabold text-xl text-[#191c1e]">Pickup</div>
                    <div className="font-bold text-lg text-[#154212]">कचरा उठाना</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakHindi('कचरा उठाने की गाड़ी बुलाने के लिए यहाँ दबाएँ');
                  }}
                  className="absolute top-3 right-3 p-2 bg-[#f7f9fb] hover:bg-[#e0e3e5] rounded-full text-[#154212] border border-[#c2c9bb] cursor-pointer"
                  title="आवाज़ में सुनें"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {/* Action 3: Redeem / इनाम */}
              <div className="relative group">
                <button
                  onClick={() => setActiveSubTab('rewards')}
                  className="w-full min-h-[120px] p-6 bg-white border-2 border-[#c2c9bb] hover:border-[#154212] rounded-xl flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer shadow-sm hover:bg-[#f7f9fb]"
                >
                  <div className="w-14 h-14 rounded-full bg-[#bcf0ae] text-[#154212] flex items-center justify-center">
                    <Award className="w-8 h-8" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-extrabold text-xl text-[#191c1e]">Redeem</div>
                    <div className="font-bold text-lg text-[#154212]">इनाम पाएं</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakHindi('हरित इनाम अंक देखने के लिए यहाँ दबाएँ');
                  }}
                  className="absolute top-3 right-3 p-2 bg-[#f7f9fb] hover:bg-[#e0e3e5] rounded-full text-[#154212] border border-[#c2c9bb] cursor-pointer"
                  title="आवाज़ में सुनें"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            /* Standard Dense 3-Card Grid */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setShowReportModal(true)}
                className="p-5 bg-white border border-[#c2c9bb] rounded-lg hover:border-[#154212] hover:bg-[#f7f9fb] transition-all text-left group shadow-xs cursor-pointer"
              >
                <div className="w-10 h-10 rounded bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Camera className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-[#191c1e] mb-1">Report Waste Dump / Overflow</h3>
                <p className="text-xs text-[#515f74]">Upload photo with AI waste auto-tagging for 4hr rapid response.</p>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#154212]">
                  <span>File Grievance</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>

              <button
                onClick={() => setShowPickupModal(true)}
                className="p-5 bg-white border border-[#c2c9bb] rounded-lg hover:border-[#154212] hover:bg-[#f7f9fb] transition-all text-left group shadow-xs cursor-pointer"
              >
                <div className="w-10 h-10 rounded bg-[#d5e3fd] text-[#0d1c2f] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-[#191c1e] mb-1">Book Bulk / Debris Pickup</h3>
                <p className="text-xs text-[#515f74]">Doorstep collection for furniture, construction debris & e-waste.</p>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#154212]">
                  <span>Schedule Slot</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>

              <button
                onClick={() => setActiveSubTab('rewards')}
                className="p-5 bg-white border border-[#c2c9bb] rounded-lg hover:border-[#154212] hover:bg-[#f7f9fb] transition-all text-left group shadow-xs cursor-pointer"
              >
                <div className="w-10 h-10 rounded bg-[#bcf0ae] text-[#154212] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-[#191c1e] mb-1">Redeem Green Credits</h3>
                <p className="text-xs text-[#515f74]">
                  You have <strong>{user.greenPoints || 340} pts</strong>. Get free compost or property tax rebates.
                </p>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#154212]">
                  <span>Browse Rewards</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          )}

          {/* 2-Column Split: Nearby Bins & Recent Grievances */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Nearby Bins Telemetry */}
            <div className="bg-white border border-[#c2c9bb] rounded-lg p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#eceef0] mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#154212]">sensors</span>
                  <h2 className={`font-bold text-[#191c1e] ${isSaralMode ? 'text-base md:text-lg' : 'text-sm'}`}>
                    {isSaralMode ? 'पास के कूड़ेदान (Nearby Bins)' : 'Ward 14 IoT Bins Near You'}
                  </h2>
                </div>
                <button
                  onClick={() => setActiveSubTab('bins')}
                  className={`${isSaralMode ? 'text-sm' : 'text-xs'} text-[#154212] font-semibold hover:underline cursor-pointer`}
                >
                  {isSaralMode ? 'सभी देखें (View All)' : `View All (${bins.length})`}
                </button>
              </div>

              <div className="space-y-4">
                {bins.slice(0, 3).map((bin) => {
                  const isGood = bin.fillLevel <= 60;
                  const isAttention = bin.fillLevel > 60 && bin.fillLevel <= 85;
                  const isCritical = bin.fillLevel > 85;

                  return (
                    <div key={bin.id} className="p-3.5 bg-[#f7f9fb] border border-[#e0e3e5] rounded-md space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {!isSaralMode && (
                            <span className="font-mono text-[11px] font-bold text-[#515f74]">{bin.code}</span>
                          )}
                          <h4 className={`font-semibold text-[#191c1e] ${isSaralMode ? 'text-base' : 'text-xs'}`}>
                            {bin.location}
                          </h4>
                          {!isSaralMode ? (
                            <span className="text-[10px] text-[#72796e] uppercase tracking-wider">
                              Type: {bin.type.toUpperCase()} • Emptied: {bin.lastEmptied}
                            </span>
                          ) : (
                            <span className="text-xs text-[#515f74]">
                              {bin.type === 'wet' ? 'गीला कचरा (Wet)' : bin.type === 'dry' ? 'सूखा कचरा (Dry)' : 'खतरनाक कचरा (Hazardous)'}
                            </span>
                          )}
                        </div>

                        {/* Status Badge */}
                        {isSaralMode ? (
                          /* Large simple badge with Hindi */
                          <div className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 shrink-0 ${
                            isGood
                              ? 'bg-[#bcf0ae] text-[#154212]'
                              : isAttention
                              ? 'bg-[#fef3c7] text-[#92400e]'
                              : 'bg-[#ffdad6] text-[#93000a]'
                          }`}>
                            {isGood ? '✓ ठीक (Good)' : isAttention ? '⚠️ ध्यान दें (Attention)' : '⛔ भरा हुआ (Full)'}
                          </div>
                        ) : (
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                              isGood
                                ? 'bg-[#bcf0ae] text-[#154212]'
                                : isAttention
                                ? 'bg-[#fef3c7] text-[#92400e]'
                                : 'bg-[#ffdad6] text-[#93000a]'
                            }`}
                          >
                            {bin.fillLevel}% Fill
                          </span>
                        )}
                      </div>

                      {/* Percentage Bar hidden in Saral Mode */}
                      {!isSaralMode && (
                        <SegmentedBar percentage={bin.fillLevel} showLabel={false} size="sm" />
                      )}

                      {bin.fillLevel > 85 && (
                        <div className="flex items-center justify-between pt-1">
                          <span className={`${isSaralMode ? 'text-xs' : 'text-[11px]'} text-[#ba1a1a] font-medium flex items-center gap-1`}>
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {isSaralMode ? 'कूड़ेदान भरने वाला है' : 'High Overflow Probability'}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedBinForReport(bin);
                              setGTitle(`Urgent: Bin ${bin.code} Overflowing at ${bin.location}`);
                              setGLocation(bin.location);
                              setGCategory('overflow');
                              setGUrgency('High');
                              setShowReportModal(true);
                            }}
                            className={`${isSaralMode ? 'text-xs' : 'text-[11px]'} text-[#154212] font-bold underline cursor-pointer`}
                          >
                            {isSaralMode ? 'साफ करने की शिकायत दर्ज करें' : 'Trigger Clearance'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* My Active Grievances */}
            <div className="bg-white border border-[#c2c9bb] rounded-lg p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#eceef0] mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#154212]">assignment</span>
                  <h2 className="font-bold text-sm text-[#191c1e]">Your Active Complaints</h2>
                </div>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="text-xs bg-[#154212] text-white px-2.5 py-1 rounded hover:bg-[#2d5a27] transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> New Report
                </button>
              </div>

              <div className="space-y-3">
                {grievances.length === 0 ? (
                  <p className="text-xs text-[#515f74] text-center py-6">No complaints filed. Thank you for keeping your city clean!</p>
                ) : (
                  grievances.slice(0, 3).map((g) => (
                    <div key={g.id} className="p-3 bg-[#f7f9fb] border border-[#e0e3e5] rounded-md space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-[#154212]">{g.ticketNumber}</span>
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
                      <h4 className="font-semibold text-xs text-[#191c1e] line-clamp-1">{g.title}</h4>
                      <div className="flex items-center justify-between text-[11px] text-[#515f74]">
                        <span>{g.location}</span>
                        <span>{g.createdAt}</span>
                      </div>
                      {g.assignedOfficer && (
                        <div className="text-[10px] text-[#42493e] bg-white p-1.5 rounded border border-[#eceef0] flex items-center justify-between">
                          <span>Officer: <strong>{g.assignedOfficer}</strong></span>
                          {g.assignedWorkerPhone && <span className="font-mono text-[#154212]">{g.assignedWorkerPhone}</span>}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Bins Tab */}
      {activeSubTab === 'bins' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`font-bold text-[#191c1e] ${isSaralMode ? 'text-xl' : 'text-lg'}`}>
                {isSaralMode ? 'वार्ड 14 के स्मार्ट कूड़ेदान (Smart Waste Bins)' : 'Smart Waste Bin Telemetry • Ward 14'}
              </h2>
              <p className={`${isSaralMode ? 'text-sm' : 'text-xs'} text-[#515f74]`}>
                {isSaralMode ? 'कूड़ेदान की स्थिति हर 5 मिनट में अपडेट होती है' : 'Real-time ultrasonic fill sensors update every 5 minutes.'}
              </p>
            </div>
            {!isSaralMode && (
              <div className="text-xs text-[#515f74] flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#154212]"></span> 0-60% Optimal</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#d97706]"></span> 61-85% Attention</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span> &gt;85% Critical</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bins.map((bin) => {
              const isGood = bin.fillLevel <= 60;
              const isAttention = bin.fillLevel > 60 && bin.fillLevel <= 85;

              return (
                <div key={bin.id} className="bg-white border border-[#c2c9bb] rounded-lg p-4 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {!isSaralMode && (
                        <span className="font-mono text-xs font-bold text-[#515f74]">{bin.code}</span>
                      )}
                      <h4 className={`font-bold text-[#191c1e] ${isSaralMode ? 'text-lg' : 'text-sm'}`}>{bin.location}</h4>
                      {isSaralMode && (
                        <div className="text-sm text-[#515f74] mt-0.5">
                          {bin.type === 'wet' ? 'गीला कूड़ेदान (Wet Waste)' : bin.type === 'dry' ? 'सूखा कूड़ेदान (Dry Waste)' : 'खतरनाक कूड़ेदान'}
                        </div>
                      )}
                    </div>
                    {isSaralMode ? (
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-md shrink-0 flex items-center gap-1 ${
                          isGood
                            ? 'bg-[#bcf0ae] text-[#154212]'
                            : isAttention
                            ? 'bg-[#fef3c7] text-[#92400e]'
                            : 'bg-[#ffdad6] text-[#93000a]'
                        }`}
                      >
                        {isGood ? '✓ ठीक (Good)' : isAttention ? '⚠️ ध्यान दें' : '⛔ भरा हुआ (Full)'}
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          isGood
                            ? 'bg-[#bcf0ae] text-[#154212]'
                            : isAttention
                            ? 'bg-[#fef3c7] text-[#92400e]'
                            : 'bg-[#ffdad6] text-[#93000a]'
                        }`}
                      >
                        {bin.status}
                      </span>
                    )}
                  </div>

                  {!isSaralMode ? (
                    <>
                      <div className="p-2.5 bg-[#f7f9fb] rounded border border-[#eceef0]">
                        <SegmentedBar percentage={bin.fillLevel} size="md" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-[#515f74] border-t border-[#eceef0] pt-2">
                        <div>
                          <span className="text-[10px] block text-[#72796e]">Waste Type</span>
                          <span className="font-semibold text-[#191c1e] capitalize">{bin.type} Waste</span>
                        </div>
                        <div>
                          <span className="text-[10px] block text-[#72796e]">Last Emptied</span>
                          <span className="font-semibold text-[#191c1e]">{bin.lastEmptied}</span>
                        </div>
                        <div>
                          <span className="text-[10px] block text-[#72796e]">IoT Battery</span>
                          <span className="font-semibold text-[#191c1e] font-mono">{bin.batteryLevel}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] block text-[#72796e]">Temperature</span>
                          <span className="font-semibold text-[#191c1e] font-mono">{bin.temperatureC}°C</span>
                        </div>
                      </div>
                    </>
                  ) : null}

                  <button
                    onClick={() => {
                      setSelectedBinForReport(bin);
                      setGTitle(`Bin ${bin.code} Clearance Request`);
                      setGLocation(bin.location);
                      setGCategory('overflow');
                      setGUrgency(bin.fillLevel > 80 ? 'High' : 'Normal');
                      setShowReportModal(true);
                    }}
                    className={`w-full py-2 font-semibold rounded border border-[#154212] text-[#154212] hover:bg-[#154212] hover:text-white transition-colors cursor-pointer ${
                      isSaralMode ? 'text-sm bg-[#f7f9fb]' : 'text-xs'
                    }`}
                  >
                    {isSaralMode ? 'इस कूड़ेदान की शिकायत दर्ज करें (Report)' : 'Report Issue with this Bin'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grievances Tab */}
      {activeSubTab === 'grievances' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h2 className={`font-black text-[#191c1e] ${isSaralMode ? 'text-2xl' : 'text-lg'}`}>
                {isSaralMode ? 'नागरिक शिकायत इतिहास (Grievance History)' : 'Civic Grievance History'}
              </h2>
              <p className={`${isSaralMode ? 'text-sm' : 'text-xs'} text-[#515f74]`}>
                {isSaralMode ? 'वार्ड 14 में दर्ज की गई स्वच्छता एवं कचरा शिकायतों की स्थिति देखें।' : 'Track sanitation complaints lodged with Nagar Nigam Ward 14.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isSaralMode && (
                <button
                  type="button"
                  onClick={() => speakHindi(`आपकी कुल ${grievances.length} शिकायतें दर्ज हैं। स्थिति सुनने के लिए संबंधित शिकायत पर स्पीकर दबाएं।`)}
                  className="bg-[#f7f9fb] border border-[#c2c9bb] text-[#154212] font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>ऑडियो सारांश</span>
                </button>
              )}
              <button
                onClick={() => setShowReportModal(true)}
                className={`bg-[#154212] text-white font-bold rounded-xl hover:bg-[#2d5a27] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  isSaralMode ? 'py-3 px-4 text-sm' : 'px-3 py-2 text-xs'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>{isSaralMode ? 'नई शिकायत दर्ज करें (New Report)' : 'File New Grievance'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {grievances.map((g) => (
              <div key={g.id} className={`bg-white border rounded-xl shadow-xs space-y-3 ${
                isSaralMode ? 'p-5 border-2 border-[#c2c9bb]' : 'p-5 border-[#c2c9bb]'
              }`}>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-[#eceef0]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-bold text-[#154212] bg-[#f2f4f6] px-2 py-0.5 rounded">{g.ticketNumber}</span>
                    <span
                      className={`text-[10px] md:text-xs font-bold uppercase px-2 py-0.5 rounded ${
                        g.urgency === 'Critical Emergency'
                          ? 'bg-[#ffdad6] text-[#93000a]'
                          : g.urgency === 'High'
                          ? 'bg-[#fef3c7] text-[#92400e]'
                          : 'bg-[#f2f4f6] text-[#515f74]'
                      }`}
                    >
                      {g.urgency}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const statusHindi = g.status === 'Resolved' ? 'समाधान हो चुका है' : g.status === 'In Progress' ? 'कार्य प्रगति पर है' : 'लंबित है';
                        speakHindi(`शिकायत ${g.ticketNumber}: ${g.title}। स्थिति: ${statusHindi}।`);
                      }}
                      className="p-1.5 bg-[#f7f9fb] hover:bg-[#e0e3e5] text-[#154212] rounded-lg border border-[#c2c9bb] flex items-center gap-1 text-xs font-bold cursor-pointer"
                      title="शिकायत स्थिति सुनें"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>{isSaralMode ? 'सुनें' : 'Listen'}</span>
                    </button>
                    <span className="text-xs text-[#515f74]">{g.createdAt}</span>
                    <span
                      className={`text-xs font-black uppercase px-2.5 py-0.5 rounded ${
                        g.status === 'Resolved'
                          ? 'bg-[#bcf0ae] text-[#154212]'
                          : g.status === 'In Progress'
                          ? 'bg-[#d5e3fd] text-[#0d1c2f]'
                          : 'bg-[#fef3c7] text-[#92400e]'
                      }`}
                    >
                      {isSaralMode ? (g.status === 'Resolved' ? 'समाधान हुआ ✓' : g.status === 'In Progress' ? 'प्रगति पर' : 'लंबित') : g.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3 space-y-2">
                    <h3 className={`font-black text-[#191c1e] ${isSaralMode ? 'text-lg md:text-xl' : 'text-base'}`}>{g.title}</h3>
                    <p className={`text-[#42493e] leading-relaxed ${isSaralMode ? 'text-sm' : 'text-xs'}`}>{g.description}</p>
                    <div className="flex items-center gap-1.5 text-xs text-[#515f74]">
                      <MapPin className="w-3.5 h-3.5 text-[#154212]" />
                      <span>{g.location} ({g.ward})</span>
                    </div>

                    {g.assignedOfficer && (
                      <div className="mt-3 p-2.5 bg-[#f7f9fb] border border-[#e0e3e5] rounded-xl text-xs space-y-1">
                        <div className="font-semibold text-[#191c1e]">
                          {isSaralMode ? 'नियुक्त सफाई सुपरवाइजर:' : 'Sanitary Supervisor Assigned:'} <strong>{g.assignedOfficer}</strong>
                        </div>
                        {g.assignedWorkerPhone && (
                          <div className="text-[#515f74]">
                            {isSaralMode ? 'हेल्पलाइन संपर्क:' : 'Direct Helpline:'} <span className="font-mono text-[#154212] font-bold">{g.assignedWorkerPhone}</span>
                          </div>
                        )}
                        {g.resolutionNotes && (
                          <div className="mt-1 pt-1 border-t border-[#eceef0] text-[#154212] font-semibold">
                            ✓ {isSaralMode ? 'समाधान टिप्पणी:' : 'Resolution:'} {g.resolutionNotes} ({g.resolvedAt})
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {g.photoUrl && (
                    <div className="rounded-xl overflow-hidden border border-[#c2c9bb] max-h-36">
                      <img
                        src={g.photoUrl}
                        alt="Grievance evidence"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Pickup Tab */}
      {activeSubTab === 'bulk_pickup' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h2 className={`font-black text-[#191c1e] ${isSaralMode ? 'text-2xl' : 'text-lg'}`}>
                {isSaralMode ? 'घर बैठे भारी कचरा उठान बुकिंग (Bulk Waste Pickup)' : 'Door-to-Door Bulk Waste Booking'}
              </h2>
              <p className={`${isSaralMode ? 'text-sm' : 'text-xs'} text-[#515f74]`}>
                {isSaralMode ? 'पुराना फर्नीचर, निर्माण मलबा और पेड़ों की छंटाई उठाने के लिए वाहन बुक करें।' : 'Schedule specialized transport for furniture, tree cuttings, and large debris.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isSaralMode && (
                <button
                  type="button"
                  onClick={() => speakHindi('भारी कचरा उठाने के लिए नया स्लॉट बुक करें बटन दबाएं। नगर निगम की गाड़ी आपके घर पहुंचेगी।')}
                  className="bg-[#f7f9fb] border border-[#c2c9bb] text-[#154212] font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>ऑडियो सहायता</span>
                </button>
              )}
              <button
                onClick={() => setShowPickupModal(true)}
                className={`bg-[#154212] text-white font-bold rounded-xl hover:bg-[#2d5a27] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  isSaralMode ? 'py-3 px-4 text-sm' : 'px-3 py-2 text-xs'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>{isSaralMode ? 'नया स्लॉट बुक करें (Book Pickup)' : 'Book Pickup Slot'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pickups.map((p) => (
              <div key={p.id} className={`bg-white border rounded-xl shadow-xs space-y-3 ${
                isSaralMode ? 'p-5 border-2 border-[#c2c9bb]' : 'p-5 border-[#c2c9bb]'
              }`}>
                <div className="flex items-center justify-between pb-2 border-b border-[#eceef0]">
                  <span className="font-mono text-xs font-bold text-[#154212] bg-[#f2f4f6] px-2 py-0.5 rounded">{p.bookingCode}</span>
                  <span
                    className={`text-xs font-black uppercase px-2.5 py-0.5 rounded ${
                      p.status === 'Completed'
                        ? 'bg-[#bcf0ae] text-[#154212]'
                        : 'bg-[#d5e3fd] text-[#0d1c2f]'
                    }`}
                  >
                    {isSaralMode ? (p.status === 'Completed' ? 'पूर्ण हुआ ✓' : 'शेड्यूल किया गया') : p.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-[#42493e]">
                  <div className={`font-black text-[#191c1e] capitalize ${isSaralMode ? 'text-base' : 'text-sm'}`}>
                    {isSaralMode ? `${p.category === 'construction' ? 'निर्माण मलबा' : p.category === 'electronic' ? 'इ-कचरा' : 'सामान्य भारी कचरा'} पिकअप` : `${p.category} Waste Pickup`}
                  </div>
                  <div className="flex items-center gap-1.5 text-[#515f74]">
                    <Calendar className="w-3.5 h-3.5 text-[#154212]" />
                    <span>{isSaralMode ? 'तारीख व समय:' : 'Slot:'} <strong>{p.scheduledDate}</strong> ({p.timeSlot})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#515f74]">
                    <MapPin className="w-3.5 h-3.5 text-[#154212]" />
                    <span>{p.address}</span>
                  </div>
                  <div>{isSaralMode ? 'अनुमानित वजन:' : 'Estimated Weight:'} <strong>~{p.estimatedWeightKg} kg</strong></div>
                  {p.assignedVehicle && (
                    <div className="text-[11px] text-[#154212] font-semibold bg-[#bcf0ae]/30 p-1.5 rounded">
                      {isSaralMode ? 'नियुक्त वाहन:' : 'Assigned Vehicle:'} {p.assignedVehicle}
                    </div>
                  )}
                  {p.instructions && (
                    <p className="text-[11px] text-[#515f74] bg-[#f7f9fb] p-2 rounded">
                      {isSaralMode ? 'नोट:' : 'Note:'} {p.instructions}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rewards Tab */}
      {activeSubTab === 'rewards' && (
        <div className="space-y-6">
          <div className="bg-[#f7f9fb] border border-[#c2c9bb] rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#154212]">
                  {isSaralMode ? 'स्वच्छ नागरिक क्रेडिट बैलेंस' : 'Swachh Citizen Credit Balance'}
                </span>
                {isSaralMode && (
                  <button
                    type="button"
                    onClick={() => speakHindi(`आपके पास कुल ${user.greenPoints || 340} ग्रीन पॉइंट्स उपलब्ध हैं। इन्हें छूट कूपन में बदल सकते हैं।`)}
                    className="p-1 bg-white hover:bg-slate-100 rounded-md border border-[#c2c9bb] text-[#154212]"
                    title="बैलेंस सुनें"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="text-3xl md:text-4xl font-black text-[#154212] font-mono mt-1">
                {user.greenPoints || 340} <span className="text-base font-medium text-[#515f74]">{isSaralMode ? 'हरित अंक (Points)' : 'Green Points'}</span>
              </div>
              <p className="text-xs md:text-sm text-[#515f74] mt-1">
                {isSaralMode ? 'प्रतिदिन अलग-अलग कचरा देने और स्वच्छता योगदान के लिए प्राप्त अंक।' : 'Earned for 100% daily segregated waste handover and community clean-up contributions.'}
              </p>
            </div>
            <div className="flex gap-2">
              <div className="p-3 bg-white border border-[#e0e3e5] rounded-xl text-center">
                <span className="text-xs text-[#515f74] block">{isSaralMode ? 'वार्ड रैंक' : 'Ward Rank'}</span>
                <span className="font-black text-base text-[#191c1e]">#14 / 850</span>
              </div>
              <div className="p-3 bg-white border border-[#e0e3e5] rounded-xl text-center">
                <span className="text-xs text-[#515f74] block">{isSaralMode ? 'लगातार अलग कचरा' : 'Segregation Streak'}</span>
                <span className="font-black text-base text-[#154212]">28 {isSaralMode ? 'दिन' : 'Days'} 🔥</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className={`font-black text-[#191c1e] ${isSaralMode ? 'text-xl' : 'text-base'}`}>
              {isSaralMode ? 'नागरिक पुरस्कार एवं छूट रिडीम करें' : 'Redeem Civic Rewards & Eco Subsidies'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rewards.map((reward) => (
                <div key={reward.id} className={`bg-white border rounded-xl shadow-xs flex flex-col justify-between space-y-4 ${
                  isSaralMode ? 'p-5 border-2 border-[#c2c9bb]' : 'p-5 border-[#c2c9bb]'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#f2f4f6] text-[#515f74]">
                        {reward.badge}
                      </span>
                      <span className="font-mono font-bold text-sm text-[#154212]">{reward.pointsCost} {isSaralMode ? 'अंक' : 'Points'}</span>
                    </div>
                    <h4 className={`font-black text-[#191c1e] ${isSaralMode ? 'text-lg' : 'text-sm'}`}>{reward.title}</h4>
                    <p className={`text-[#515f74] mt-1 ${isSaralMode ? 'text-sm' : 'text-xs'}`}>{reward.description}</p>
                  </div>

                  <button
                    onClick={() => {
                      onRedeemReward(reward);
                      if (isSaralMode) {
                        speakHindi(`बधाई हो! आपका कूपन ${reward.title} सफलतापूर्वक रिडीम हो गया है।`);
                      }
                    }}
                    disabled={(user.greenPoints || 340) < reward.pointsCost}
                    className={`w-full bg-[#154212] text-white font-bold rounded-xl hover:bg-[#2d5a27] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                      isSaralMode ? 'py-3 text-sm' : 'py-2 text-xs'
                    }`}
                  >
                    {(user.greenPoints || 340) >= reward.pointsCost 
                      ? (isSaralMode ? 'वाउचर प्राप्त करें (Redeem Voucher)' : 'Redeem Voucher')
                      : (isSaralMode ? 'अंक अपर्याप्त हैं' : 'Insufficient Points')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Report Waste Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#c2c9bb] rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#eceef0] sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ba1a1a]">report</span>
                <h3 className="font-bold text-base text-[#191c1e]">File Civic Waste Grievance</h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-[#515f74] hover:text-[#191c1e]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitGrievance} className="p-6 space-y-4">
              {/* Photo Upload & AI Classification */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#42493e]">
                    Photo Evidence & AI Classification
                  </label>
                  <span className="text-[10px] text-[#154212] font-semibold bg-[#bcf0ae]/40 px-1.5 py-0.5 rounded">
                    Powered by Gemini 2.5 Flash
                  </span>
                </div>

                <div className="border-2 border-dashed border-[#c2c9bb] rounded-md p-4 text-center bg-[#f7f9fb] space-y-3">
                  {gPhotoUrl ? (
                    <div className="relative rounded overflow-hidden max-h-48 mx-auto">
                      <img src={gPhotoUrl} alt="Evidence" className="w-full h-44 object-cover rounded" referrerPolicy="no-referrer" />
                      <div className="absolute top-2 right-2 flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2 py-1 bg-black/70 hover:bg-black text-white rounded text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <UploadCloud className="w-3.5 h-3.5" /> Upload Another
                        </button>
                        <button
                          type="button"
                          onClick={() => setGPhotoUrl('')}
                          className="p-1 bg-black/70 hover:bg-black text-white rounded text-xs cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="py-4 space-y-2 cursor-pointer hover:bg-[#f0f3f5] rounded transition-colors"
                    >
                      <Camera className="w-8 h-8 text-[#154212] mx-auto" />
                      <div>
                        <p className="text-xs font-bold text-[#191c1e]">Click to upload photo or capture via camera</p>
                        <p className="text-[11px] text-[#515f74]">Supports PNG, JPG up to 10MB</p>
                      </div>
                    </div>
                  )}

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  {/* AI Presets / Test Samples */}
                  <div className="pt-1">
                    <span className="text-[10px] text-[#515f74] block mb-1.5 font-medium">Or test with live sample captures:</span>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      <button
                        type="button"
                        onClick={() => handleClassifyWaste({ sampleType: 'overflow' })}
                        className="px-2 py-1 bg-white border border-[#c2c9bb] rounded text-[11px] font-semibold text-[#154212] hover:bg-[#f2f4f6] cursor-pointer"
                      >
                        📸 Overflowing Bin Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClassifyWaste({ sampleType: 'debris' })}
                        className="px-2 py-1 bg-white border border-[#c2c9bb] rounded text-[11px] font-semibold text-[#154212] hover:bg-[#f2f4f6] cursor-pointer"
                      >
                        📸 Roadside Debris Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClassifyWaste({ sampleType: 'dump' })}
                        className="px-2 py-1 bg-white border border-[#c2c9bb] rounded text-[11px] font-semibold text-[#154212] hover:bg-[#f2f4f6] cursor-pointer"
                      >
                        📸 Illegal Corner Dump
                      </button>
                    </div>
                  </div>

                  {isAiAnalyzing && (
                    <div className="text-xs text-[#154212] font-semibold flex items-center justify-center gap-1.5 py-1 animate-pulse bg-[#bcf0ae]/30 rounded">
                      <Sparkles className="w-4 h-4 text-[#154212] animate-spin" />
                      <span>Gemini AI classifying waste composition, urgency & volume...</span>
                    </div>
                  )}

                  {aiTagSuggestion && (
                    <div className="p-2.5 bg-[#bcf0ae]/40 border border-[#154212]/30 rounded text-xs text-[#154212] font-medium text-left flex items-start gap-2">
                      <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>{aiTagSuggestion}</div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#42493e] mb-1">Issue Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Overflowing garbage bin in front of Sector 4 market"
                  value={gTitle}
                  onChange={(e) => setGTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#c2c9bb] rounded text-xs text-[#191c1e] focus:border-[#154212] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#42493e] mb-1">Category</label>
                  <select
                    value={gCategory}
                    onChange={(e) => setGCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#c2c9bb] rounded text-xs text-[#191c1e] bg-white focus:border-[#154212] focus:outline-none"
                  >
                    <option value="overflow">Bin Overflow</option>
                    <option value="illegal_dumping">Illegal Dump Site</option>
                    <option value="construction">Construction Rubble (C&D)</option>
                    <option value="sewer_block">Drainage / Sewer Block</option>
                    <option value="dead_animal">Dead Animal Biohazard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#42493e] mb-1">Urgency</label>
                  <select
                    value={gUrgency}
                    onChange={(e) => setGUrgency(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#c2c9bb] rounded text-xs text-[#191c1e] bg-white focus:border-[#154212] focus:outline-none"
                  >
                    <option value="Normal">Normal (Within 12h)</option>
                    <option value="High">High (Within 4h)</option>
                    <option value="Critical Emergency">Critical Emergency (Within 2h)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#42493e] mb-1">Location / Landmark</label>
                <input
                  type="text"
                  required
                  placeholder="Exact lane, building or street landmark"
                  value={gLocation}
                  onChange={(e) => setGLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-[#c2c9bb] rounded text-xs text-[#191c1e] focus:border-[#154212] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#42493e] mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Provide additional details to assist the Nagar Nigam sanitation team..."
                  value={gDescription}
                  onChange={(e) => setGDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-[#c2c9bb] rounded text-xs text-[#191c1e] focus:border-[#154212] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3 py-2 border border-[#c2c9bb] rounded text-xs font-semibold text-[#515f74] hover:bg-[#f2f4f6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#154212] text-white text-xs font-semibold rounded hover:bg-[#2d5a27] transition-colors"
                >
                  Submit Grievance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Bulk Pickup Modal */}
      {showPickupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#c2c9bb] rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#eceef0] sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#154212]">local_shipping</span>
                <h3 className="font-bold text-base text-[#191c1e]">Book Municipal Bulk Pickup</h3>
              </div>
              <button
                onClick={() => setShowPickupModal(false)}
                className="text-[#515f74] hover:text-[#191c1e]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPickup} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#42493e] mb-1">Waste Type</label>
                  <select
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#c2c9bb] rounded text-xs text-[#191c1e] bg-white focus:border-[#154212] focus:outline-none"
                  >
                    <option value="construction">Construction / Renovation Debris</option>
                    <option value="e-waste">E-Waste & Appliances</option>
                    <option value="dry">Bulky Furniture / Wood</option>
                    <option value="wet">Garden & Tree Prunings</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#42493e] mb-1">Est. Weight (kg)</label>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    value={pWeight}
                    onChange={(e) => setPWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#c2c9bb] rounded text-xs text-[#191c1e] focus:border-[#154212] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#42493e] mb-1">Preferred Date</label>
                  <select
                    value={pDate}
                    onChange={(e) => setPDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#c2c9bb] rounded text-xs text-[#191c1e] bg-white focus:border-[#154212] focus:outline-none"
                  >
                    <option value="Tomorrow (Aug 24)">Tomorrow (Aug 24)</option>
                    <option value="Aug 25, 2026">Aug 25, 2026</option>
                    <option value="Aug 26, 2026">Aug 26, 2026</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#42493e] mb-1">Time Slot</label>
                  <select
                    value={pSlot}
                    onChange={(e) => setPSlot(e.target.value)}
                    className="w-full px-3 py-2 border border-[#c2c9bb] rounded text-xs text-[#191c1e] bg-white focus:border-[#154212] focus:outline-none"
                  >
                    <option value="09:00 AM - 12:00 PM">09:00 AM - 12:00 PM (Morning)</option>
                    <option value="02:00 PM - 05:00 PM">02:00 PM - 05:00 PM (Afternoon)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#42493e] mb-1">Pickup Address</label>
                <input
                  type="text"
                  required
                  value={pAddress}
                  onChange={(e) => setPAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-[#c2c9bb] rounded text-xs text-[#191c1e] focus:border-[#154212] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#42493e] mb-1">Access Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Ground floor parking gate, ring flat bell 402."
                  value={pInstructions}
                  onChange={(e) => setPInstructions(e.target.value)}
                  className="w-full px-3 py-2 border border-[#c2c9bb] rounded text-xs text-[#191c1e] focus:border-[#154212] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPickupModal(false)}
                  className="px-3 py-2 border border-[#c2c9bb] rounded text-xs font-semibold text-[#515f74] hover:bg-[#f2f4f6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#154212] text-white text-xs font-semibold rounded hover:bg-[#2d5a27] transition-colors"
                >
                  Confirm Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

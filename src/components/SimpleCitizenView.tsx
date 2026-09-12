import React, { useState } from 'react';
import { User, Grievance, WasteBin } from '../types';
import { Camera, MapPin, Volume2, CheckCircle2, X } from 'lucide-react';
import { speakHindi } from '../utils/saralHelper';

interface SimpleCitizenViewProps {
  user: User;
  onAddGrievance: (g: Omit<Grievance, 'id' | 'ticketNumber' | 'createdAt'>) => void;
  bins: WasteBin[];
}

export const SimpleCitizenView: React.FC<SimpleCitizenViewProps> = ({ user, onAddGrievance, bins }) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [nearestBinInfo, setNearestBinInfo] = useState<string | null>(null);

  const handleReport = () => {
    speakHindi('आपकी शिकायत दर्ज की जा रही है');

    onAddGrievance({
      title: 'Voice Reported Garbage',
      category: 'overflow',
      description: 'Reported via Saral Mode',
      location: user.ward || 'Ward 14, Main Market',
      ward: user.ward || 'Ward 14',
      citizenName: user.firstName,
      citizenContact: user.phone || '',
      status: 'Pending',
      urgency: 'Normal',
      photoUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
    });

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleFindBin = () => {
    const loc = bins[0]?.location || 'Central Market Road';
    speakHindi(`नज़दीकी कूड़ेदान ${loc} पर उपलब्ध है`);
    setNearestBinInfo(loc);
  };

  return (
    <div className="flex-1 flex flex-col items-center bg-[#f7f9fb] p-6 max-w-lg mx-auto w-full">
      <div className="w-full text-center mb-8 mt-4">
        <h1 className="text-3xl font-bold text-[#154212] mb-2">नमस्ते {user.firstName}</h1>
        <p className="text-xl text-[#42493e]">आप क्या करना चाहते हैं?</p>
        <p className="text-sm text-[#72796e] mt-1">(What do you want to do?)</p>
      </div>

      <div className="flex flex-col gap-6 w-full">
        {/* Report Garbage Button */}
        <button
          onClick={handleReport}
          onMouseEnter={() => speakHindi('कचरा रिपोर्ट करें')}
          className="flex flex-col items-center justify-center p-8 bg-[#ffdad6] rounded-3xl border-4 border-[#ba1a1a] shadow-lg active:scale-95 transition-transform cursor-pointer"
        >
          <Camera className="w-24 h-24 text-[#ba1a1a] mb-4" />
          <span className="text-3xl font-bold text-[#ba1a1a] mb-1">कचरा रिपोर्ट करें</span>
          <span className="text-xl font-semibold text-[#93000a]">Report Trash</span>
          <div className="flex items-center gap-1 text-[#ba1a1a] mt-4 opacity-80">
            <Volume2 className="w-6 h-6" />
            <span className="text-sm font-semibold">दबाएँ या सुनें</span>
          </div>
        </button>

        {/* Find Bin Button */}
        <button
          onClick={handleFindBin}
          onMouseEnter={() => speakHindi('कूड़ेदान खोजें')}
          className="flex flex-col items-center justify-center p-8 bg-[#d5e3fd] rounded-3xl border-4 border-[#0d1c2f] shadow-lg active:scale-95 transition-transform cursor-pointer"
        >
          <MapPin className="w-24 h-24 text-[#0d1c2f] mb-4" />
          <span className="text-3xl font-bold text-[#0d1c2f] mb-1">कूड़ेदान खोजें</span>
          <span className="text-xl font-semibold text-[#001d35]">Find Bin</span>
          <div className="flex items-center gap-1 text-[#0d1c2f] mt-4 opacity-80">
            <Volume2 className="w-6 h-6" />
            <span className="text-sm font-semibold">दबाएँ या सुनें</span>
          </div>
        </button>
      </div>

      {nearestBinInfo && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white p-6 rounded-2xl flex flex-col items-center max-w-sm w-full text-center border-2 border-[#154212]">
            <MapPin className="w-16 h-16 text-[#154212] mb-3" />
            <h3 className="text-2xl font-bold text-[#154212] mb-1">नज़दीकी कूड़ेदान</h3>
            <p className="text-lg text-[#191c1e] font-semibold">{nearestBinInfo}</p>
            <p className="text-xs text-[#515f74] mt-2">वार्ड 14 • सूखा एवं गीला पृथक्करण</p>
            <button
              onClick={() => setNearestBinInfo(null)}
              className="mt-5 w-full py-2.5 bg-[#154212] text-white rounded-xl font-bold text-base cursor-pointer"
            >
              बंद करें (Close)
            </button>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-8 rounded-2xl flex flex-col items-center max-w-sm w-full text-center animate-in zoom-in-90">
            <CheckCircle2 className="w-24 h-24 text-[#154212] mb-4" />
            <h2 className="text-3xl font-bold text-[#154212] mb-2">धन्यवाद!</h2>
            <p className="text-xl text-[#42493e]">आपकी शिकायत दर्ज हो गई है।</p>
            <p className="text-lg text-[#72796e] mt-2">(Grievance recorded successfully)</p>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { User, RecyclableLot } from '../types';
import { INITIAL_CLOSED_AUCTIONS } from '../data/mockData';
import { speakHindi } from '../utils/saralHelper';
import { 
  Gavel, TrendingUp, ShieldCheck, Truck, FileText, CheckCircle2, 
  Clock, DollarSign, Award, Download, ArrowUpRight, X, AlertCircle, Eye, Check, Volume2 
} from 'lucide-react';

interface RecyclerMarketViewProps {
  user: User;
  lots: RecyclableLot[];
  onPlaceBid: (lotId: string, bidAmount: number, partnerName: string) => void;
  isSaralMode?: boolean;
}

export const RecyclerMarketView: React.FC<RecyclerMarketViewProps> = ({
  user,
  lots,
  onPlaceBid,
  isSaralMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<'auctions' | 'manifests' | 'certificates' | 'transparency'>('auctions');
  const [selectedLotForBid, setSelectedLotForBid] = useState<RecyclableLot | null>(null);
  const [bidAmountInput, setBidAmountInput] = useState<number>(0);
  const [bidFeedback, setBidFeedback] = useState<string | null>(null);
  const [activePassLot, setActivePassLot] = useState<RecyclableLot | null>(null);

  const openBidModal = (lot: RecyclableLot) => {
    setSelectedLotForBid(lot);
    setBidAmountInput(lot.currentBidPerTon + 1000);
    setBidFeedback(null);
  };

  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLotForBid) return;

    if (bidAmountInput <= selectedLotForBid.currentBidPerTon) {
      const err = isSaralMode
        ? `बोली वर्तमान उच्चतम दर (₹${selectedLotForBid.currentBidPerTon.toLocaleString()}/टन) से अधिक होनी चाहिए।`
        : `Bid must be greater than current highest bid (₹${selectedLotForBid.currentBidPerTon.toLocaleString()}/Ton).`;
      setBidFeedback(err);
      if (isSaralMode) speakHindi(err);
      return;
    }

    const partnerName = user.organization || `${user.firstName} ${user.lastName} Recyclers`;
    onPlaceBid(selectedLotForBid.id, bidAmountInput, partnerName);
    const successMsg = isSaralMode
      ? `✓ ₹${bidAmountInput.toLocaleString()} प्रति टन की बोली सफलतापूर्वक दर्ज हो गई!`
      : '✓ Bid placed successfully! You are currently the highest bidder.';
    setBidFeedback(successMsg);

    if (isSaralMode) {
      speakHindi(`आपकी बोली ${bidAmountInput} रुपये प्रति टन सफलतापूर्वक दर्ज हो गई है।`);
    }

    setTimeout(() => {
      setSelectedLotForBid(null);
    }, 1500);
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
      {/* Header Info */}
      <div className={`bg-white border border-[#c2c9bb] rounded-xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${
        isSaralMode ? 'p-6 border-2 border-[#154212]' : 'p-5 md:p-6'
      }`}>
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded bg-[#ffd9e4] text-[#60233e] text-[10px] md:text-xs font-bold uppercase tracking-wider">
              {isSaralMode ? 'अधिकृत पुनर्चक्रण भागीदार पोर्टल' : 'Authorized CPCB Recycler Portal'}
            </span>
            <span className="text-xs text-[#515f74] font-medium">• Nagar Nigam Material Recovery Facility (MRF)</span>
          </div>
          <h1 className={`font-black text-[#191c1e] ${isSaralMode ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'}`}>
            {user.organization || 'GreenCycle Eco Solutions Pvt Ltd'}
          </h1>
          <p className={`text-[#515f74] mt-0.5 ${isSaralMode ? 'text-sm md:text-base font-medium' : 'text-xs'}`}>
            {isSaralMode
              ? 'नगर निगम पुनर्चक्रण योग्य सामग्री (प्लास्टिक, धातु, कागज़) की पारदर्शी नीलामी'
              : 'Transparent municipal auction exchange for segregated post-consumer scrap & bulk materials.'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {isSaralMode && (
            <button
              type="button"
              onClick={() => speakHindi('पुनर्चक्रण नीलामी बाज़ार में आपका स्वागत है। वर्तमान में तीन सक्रिय लॉट्स उपलब्ध हैं। बोली लगाने के लिए लॉट चुनें।')}
              className="flex items-center gap-2 py-2.5 px-4 bg-[#154212] hover:bg-[#20571d] text-white rounded-xl font-bold text-sm cursor-pointer shadow-xs"
            >
              <Volume2 className="w-5 h-5 animate-pulse" />
              <span>ऑडियो गाइड (Listen)</span>
            </button>
          )}

          <div className="p-3 bg-[#f7f9fb] border border-[#c2c9bb] rounded-xl flex items-center gap-3">
            <div className="p-2 bg-[#154212] text-white rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <div className="font-semibold text-[#191c1e]">CPCB License: CPCB/WMT/2026-992</div>
              <span className="text-[#154212] font-semibold">Verified Active Partner ✓</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex border-b border-[#e0e3e5] gap-2 font-bold overflow-x-auto ${isSaralMode ? 'text-base pb-1' : 'text-xs'}`}>
        <button
          onClick={() => setActiveTab('auctions')}
          className={`pb-3 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'auctions' ? 'border-[#154212] text-[#154212]' : 'border-transparent text-[#515f74] hover:text-[#191c1e]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">gavel</span>
          {isSaralMode ? `सक्रिय नीलामी लॉट्स (${lots.length})` : `Active Municipal Lots (${lots.length})`}
        </button>
        <button
          onClick={() => setActiveTab('manifests')}
          className={`pb-3 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'manifests' ? 'border-[#154212] text-[#154212]' : 'border-transparent text-[#515f74] hover:text-[#191c1e]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">badge</span>
          {isSaralMode ? 'डिजिटल गेट पास' : 'Digital Weighbridge Gate Passes'}
        </button>
        <button
          onClick={() => setActiveTab('certificates')}
          className={`pb-3 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'certificates' ? 'border-[#154212] text-[#154212]' : 'border-transparent text-[#515f74] hover:text-[#191c1e]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
          {isSaralMode ? 'कार्बन एवं EPR सर्टिफिकेट्स' : 'EPR Compliance & Carbon Credits'}
        </button>
        <button
          onClick={() => setActiveTab('transparency')}
          className={`pb-3 px-3.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'transparency' ? 'border-[#154212] text-[#154212]' : 'border-transparent text-[#515f74] hover:text-[#191c1e]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">visibility</span>
          {isSaralMode ? 'नीलामी रिकॉर्ड' : `Civic Transparency Log (${INITIAL_CLOSED_AUCTIONS.length} Closed)`}
        </button>
      </div>

      {/* Tab 1: Live Auctions */}
      {activeTab === 'auctions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {lots.map((lot) => {
              const isUserLeading =
                lot.highestBidder.toLowerCase().includes('greencycle') ||
                lot.highestBidder === user.organization;

              return (
                <div
                  key={lot.id}
                  className="bg-white border border-[#c2c9bb] rounded-lg p-5 md:p-6 shadow-xs space-y-4"
                >
                  {/* Lot Header */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-[#eceef0]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#154212]">{lot.lotNumber}</span>
                        <span className="text-xs text-[#515f74]">({lot.grade})</span>
                      </div>
                      <h3 className={`font-black text-[#191c1e] mt-0.5 ${isSaralMode ? 'text-xl md:text-2xl' : 'text-base md:text-lg'}`}>
                        {lot.material}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          const speech = `लॉट नंबर ${lot.lotNumber}। सामग्री: ${lot.material}। कुल मात्रा: ${lot.quantityTons} टन। वर्तमान उच्चतम बोली: ${lot.currentBidPerTon} रुपये प्रति टन।`;
                          speakHindi(speech);
                        }}
                        className="p-2.5 bg-[#f7f9fb] hover:bg-[#e0e3e5] border border-[#c2c9bb] text-[#154212] rounded-xl flex items-center gap-1 font-bold text-xs cursor-pointer"
                        title="ऑडियो में विवरण सुनें"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>{isSaralMode ? 'ऑडियो सुनें' : 'Listen'}</span>
                      </button>

                      <div className="text-right">
                        <span className="text-[10px] block uppercase text-[#515f74] font-semibold">
                          {isSaralMode ? 'समय शेष' : 'Closes In'}
                        </span>
                        <span className="font-mono font-bold text-xs text-[#ba1a1a] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {lot.closesIn}
                        </span>
                      </div>

                      <button
                        onClick={() => openBidModal(lot)}
                        className={`bg-[#154212] text-white font-bold rounded-xl hover:bg-[#2d5a27] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                          isSaralMode ? 'py-3 px-5 text-sm md:text-base' : 'px-4 py-2 text-xs'
                        }`}
                      >
                        <Gavel className={isSaralMode ? 'w-5 h-5' : 'w-4 h-4'} />
                        <span>{isSaralMode ? 'बोली लगाएं / बढ़ाएं (Bid)' : 'Place / Increase Bid'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Lot Specifications Grid */}
                  <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#f7f9fb] p-3.5 rounded-xl border border-[#e0e3e5] ${
                    isSaralMode ? 'text-sm' : 'text-xs'
                  }`}>
                    <div>
                      <span className="text-[10px] text-[#72796e] block uppercase font-semibold">
                        {isSaralMode ? 'मात्रा (Quantity)' : 'Quantity'}
                      </span>
                      <span className="font-mono font-bold text-[#191c1e] text-sm md:text-base">
                        {lot.quantityTons} {isSaralMode ? 'मीट्रिक टन' : 'Metric Tons'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#72796e] block uppercase font-semibold">
                        {isSaralMode ? 'शुद्धता (Purity)' : 'Purity Certified'}
                      </span>
                      <span className="font-mono font-bold text-[#154212] text-sm md:text-base">{lot.verifiedPurity}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#72796e] block uppercase font-semibold">
                        {isSaralMode ? 'न्यूनतम मूल्य (Base)' : 'Base Price'}
                      </span>
                      <span className="font-mono text-[#515f74]">₹{lot.basePricePerTon.toLocaleString()} / Ton</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#72796e] block uppercase font-semibold">
                        {isSaralMode ? 'वर्तमान उच्चतम बोली' : 'Current High Bid'}
                      </span>
                      <span className="font-mono font-black text-sm md:text-base text-[#154212]">
                        ₹{lot.currentBidPerTon.toLocaleString()} / Ton
                      </span>
                    </div>
                  </div>

                  {/* Bidding History Table with EXACT SPECIFICATION: Light forest green row + primary green border on winning bid */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#191c1e] flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-[#154212]" /> Real-Time Bidding Log
                      </span>
                      {isUserLeading && (
                        <span className="text-[11px] font-bold text-[#154212] flex items-center gap-1 bg-[#bcf0ae]/50 px-2 py-0.5 rounded border border-[#154212]/30">
                          ✓ You are currently winning this lot
                        </span>
                      )}
                    </div>

                    <div className="overflow-x-auto border border-[#c2c9bb] rounded">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#eceef0] text-[#515f74] border-b border-[#c2c9bb]">
                          <tr>
                            <th className="py-2 px-3 font-semibold">Bidder Organization</th>
                            <th className="py-2 px-3 font-semibold">Bid Rate (₹/Ton)</th>
                            <th className="py-2 px-3 font-semibold">Total Lot Value</th>
                            <th className="py-2 px-3 font-semibold">Timestamp</th>
                            <th className="py-2 px-3 font-semibold text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e0e3e5]">
                          {lot.bids.map((bid) => {
                            const totalVal = bid.bidPerTon * lot.quantityTons;
                            return (
                              <tr
                                key={bid.id}
                                className={`transition-colors ${
                                  bid.isWinning
                                    ? 'bg-[#f2f8f0] border-l-4 border-l-[#154212] font-semibold text-[#154212]'
                                    : 'bg-white text-[#42493e] hover:bg-[#f7f9fb]'
                                }`}
                              >
                                <td className="py-2 px-3 flex items-center gap-1.5">
                                  {bid.isWinning && <span className="w-2 h-2 rounded-full bg-[#154212]" />}
                                  {bid.partnerName}
                                </td>
                                <td className="py-2 px-3 font-mono font-bold">
                                  ₹{bid.bidPerTon.toLocaleString()}
                                </td>
                                <td className="py-2 px-3 font-mono">₹{totalVal.toLocaleString()}</td>
                                <td className="py-2 px-3 text-[#72796e]">{bid.bidTime}</td>
                                <td className="py-2 px-3 text-right">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      bid.isWinning
                                        ? 'bg-[#bcf0ae] text-[#154212]'
                                        : 'bg-[#f2f4f6] text-[#515f74]'
                                    }`}
                                  >
                                    {bid.isWinning ? 'Highest Bid' : 'Outbid'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-xs text-[#515f74] pt-2 border-t border-[#eceef0]">
                    <span>Depot Facility: <strong>{lot.facilityLocation}</strong></span>
                    <button
                      onClick={() => setActivePassLot(lot)}
                      className="text-[#154212] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" /> View Weighbridge Gate Pass Template
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Digital Weighbridge Gate Passes */}
      {activeTab === 'manifests' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#c2c9bb] rounded-lg p-5 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#191c1e]">Electronic Weighbridge Gate Passes</h2>
            <p className="text-xs text-[#515f74]">
              Generated for authorized transport trucks entering Nagar Nigam Material Recovery Facilities.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#f7f9fb] border border-[#c2c9bb] rounded-md space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-[#e0e3e5]">
                  <span className="font-mono text-xs font-bold text-[#154212]">PASS-MRF-2026-081</span>
                  <span className="px-2 py-0.5 rounded bg-[#bcf0ae] text-[#154212] text-[10px] font-bold uppercase">
                    Validated Entry
                  </span>
                </div>
                <div className="space-y-1 text-xs text-[#42493e]">
                  <div>Vehicle: <strong>DL-01-EA-4490 (16T Multi-Axle)</strong></div>
                  <div>Driver: <strong>Kishan Lal (Lic: DL-99201948)</strong></div>
                  <div>Lot: <strong>NN-LOT-2026-081 (12.5T PET Bales)</strong></div>
                  <div>Destination Depot: <strong>Ghazipur MRF Plant</strong></div>
                  <div>Gross Weighbridge: <strong>24,800 kg</strong> | Tare: <strong>12,300 kg</strong></div>
                  <div>Net Material Weight: <strong>12,500 kg (12.5 T)</strong></div>
                </div>
                <button
                  onClick={() => alert('Digital Gate Pass PDF downloaded for Driver Kishan Lal.')}
                  className="w-full py-1.5 bg-[#154212] text-white text-xs font-semibold rounded hover:bg-[#2d5a27] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download Authorized QR Manifest
                </button>
              </div>

              <div className="p-4 bg-[#f7f9fb] border border-[#c2c9bb] rounded-md space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-[#e0e3e5]">
                  <span className="font-mono text-xs font-bold text-[#154212]">PASS-MRF-2026-084</span>
                  <span className="px-2 py-0.5 rounded bg-[#bcf0ae] text-[#154212] text-[10px] font-bold uppercase">
                    Validated Entry
                  </span>
                </div>
                <div className="space-y-1 text-xs text-[#42493e]">
                  <div>Vehicle: <strong>DL-04-TR-8812 (Covered Container)</strong></div>
                  <div>Driver: <strong>Mohan Singh (Lic: DL-88402911)</strong></div>
                  <div>Lot: <strong>NN-LOT-2026-084 (2.2T E-Waste PCBs)</strong></div>
                  <div>Destination Depot: <strong>Narela Authorized E-Waste Hub</strong></div>
                  <div>Hazard Form: <strong>Form 6 (Hazardous Waste Rules 2016)</strong></div>
                </div>
                <button
                  onClick={() => alert('Hazardous Manifest Form 6 PDF downloaded.')}
                  className="w-full py-1.5 bg-[#154212] text-white text-xs font-semibold rounded hover:bg-[#2d5a27] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download Form 6 Manifest
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: EPR Compliance & Certificates */}
      {activeTab === 'certificates' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#c2c9bb] rounded-lg p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#191c1e]">Extended Producer Responsibility (EPR) Certificate Vault</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-[#f7f9fb] border border-[#c2c9bb] rounded text-center">
                <span className="text-xs text-[#515f74] block">Total Plastic Recycled (FY 26)</span>
                <span className="font-mono font-bold text-2xl text-[#154212]">482.5 Tons</span>
              </div>
              <div className="p-4 bg-[#f7f9fb] border border-[#c2c9bb] rounded text-center">
                <span className="text-xs text-[#515f74] block">Carbon Emissions Abated</span>
                <span className="font-mono font-bold text-2xl text-[#154212]">724 MT CO₂e</span>
              </div>
              <div className="p-4 bg-[#f7f9fb] border border-[#c2c9bb] rounded text-center">
                <span className="text-xs text-[#515f74] block">CPCB EPR Credit Tokens</span>
                <span className="font-mono font-bold text-2xl text-[#154212]">4,825 Credits</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => alert('Official Nagar Nigam & CPCB Certified End-Processing Certificate generated.')}
                className="px-4 py-2 bg-[#154212] text-white text-xs font-semibold rounded hover:bg-[#2d5a27] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Annual Municipal Recycling Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Civic Transparency Log (Public-facing Read-only Closed Auctions) */}
      {activeTab === 'transparency' && (
        <div className="space-y-6">
          {/* Transparency Assurance Banner */}
          <div className="bg-[#f7f9fb] border border-[#c2c9bb] rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#154212] text-lg">verified_user</span>
                <h2 className="text-sm font-bold text-[#191c1e] uppercase tracking-wider">
                  Open Civic Scrap Auction Record • CPCB & Municipal CAG Compliant
                </h2>
              </div>
              <p className="text-xs text-[#515f74] max-w-3xl">
                Public disclosure of completed municipal waste auctions, winning bids, realized revenue, and authorized recyclers. Eliminates informal cartels and guarantees fair market value to the urban local body.
              </p>
            </div>
            <div className="flex gap-3 text-center shrink-0">
              <div className="p-3 bg-white border border-[#c2c9bb] rounded shadow-2xs">
                <div className="text-[10px] text-[#515f74] uppercase font-bold">Closed Lots</div>
                <div className="font-mono font-bold text-lg text-[#191c1e]">{INITIAL_CLOSED_AUCTIONS.length}</div>
              </div>
              <div className="p-3 bg-white border border-[#c2c9bb] rounded shadow-2xs">
                <div className="text-[10px] text-[#515f74] uppercase font-bold">Total Recycled</div>
                <div className="font-mono font-bold text-lg text-[#154212]">51.0 MT</div>
              </div>
              <div className="p-3 bg-white border border-[#c2c9bb] rounded shadow-2xs">
                <div className="text-[10px] text-[#515f74] uppercase font-bold">Revenue Realized</div>
                <div className="font-mono font-bold text-lg text-[#154212]">₹18.26 L</div>
              </div>
            </div>
          </div>

          {/* Closed Auctions Read-Only List */}
          <div className="bg-white border border-[#c2c9bb] rounded-lg shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-[#eceef0] flex items-center justify-between bg-[#fbfcfd]">
              <h3 className="font-bold text-xs text-[#191c1e] uppercase tracking-wider">
                Recent Closed Scrap Auctions (Fiscal Year 2026-27)
              </h3>
              <span className="text-[11px] text-[#154212] font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> All Treasury Payments Reconciled
              </span>
            </div>

            <div className="divide-y divide-[#eceef0]">
              {INITIAL_CLOSED_AUCTIONS.map((auction) => (
                <div key={auction.id} className="p-5 hover:bg-[#f7f9fb] transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#515f74] bg-[#f2f4f6] px-2 py-0.5 rounded">
                          {auction.lotNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#bcf0ae] text-[#154212] text-[10px] font-bold uppercase">
                          Closed & Awarded
                        </span>
                        <span className="text-xs text-[#72796e]">• Closed on {auction.closedDate}</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#191c1e] mt-1">{auction.material}</h4>
                      <div className="text-xs text-[#515f74]">
                        Grade: <strong>{auction.grade}</strong> • Net Quantity: <strong>{auction.quantityTons} Metric Tons</strong>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-[#515f74] block">Winning Bid</span>
                      <div className="text-lg font-mono font-bold text-[#154212]">
                        ₹{auction.winningBidPerTon.toLocaleString()} <span className="text-xs font-normal text-[#515f74]">/ Ton</span>
                      </div>
                      <div className="text-xs font-semibold text-[#191c1e]">
                        Total: ₹{auction.totalRealizedValue.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#f2f4f6] flex flex-col md:flex-row md:items-center justify-between text-xs text-[#515f74] gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#191c1e]">Awarded Recycler:</span>
                      <span className="text-[#154212] font-semibold">{auction.winningRecycler}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-[#e0e3e5] rounded text-[#42493e]">
                        {auction.cpcbLicense}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px]">
                      <span>MRF Facility: <strong>{auction.mrfLocation}</strong></span>
                      <span>Manifest: <strong className="font-mono">{auction.manifestNumber}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Place Bid Modal */}
      {selectedLotForBid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#c2c9bb] rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#eceef0]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#154212]">gavel</span>
                <h3 className="font-bold text-base text-[#191c1e]">Submit Municipal Auction Bid</h3>
              </div>
              <button onClick={() => setSelectedLotForBid(null)} className="text-[#515f74] hover:text-[#191c1e]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBidSubmit} className="space-y-3">
              <div>
                <span className="text-xs text-[#515f74] block">Target Lot</span>
                <h4 className="font-bold text-sm text-[#191c1e]">{selectedLotForBid.material}</h4>
                <div className="text-xs text-[#515f74]">
                  Lot #{selectedLotForBid.lotNumber} • Total: {selectedLotForBid.quantityTons} Tons
                </div>
              </div>

              <div className="p-3 bg-[#f7f9fb] rounded border border-[#e0e3e5] text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Current Winning Bid:</span>
                  <span className="font-mono font-bold text-[#154212]">
                    ₹{selectedLotForBid.currentBidPerTon.toLocaleString()} / Ton
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Current Leader:</span>
                  <span className="font-semibold text-[#191c1e]">{selectedLotForBid.highestBidder}</span>
                </div>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isSaralMode ? 'text-sm text-[#191c1e]' : 'text-xs text-[#42493e]'}`}>
                  {isSaralMode ? 'आपकी नई बोली दर (₹ प्रति टन)' : 'Your New Bid Rate (₹ per Metric Ton)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-[#515f74]">₹</span>
                  <input
                    type="number"
                    required
                    min={selectedLotForBid.currentBidPerTon + 500}
                    step="100"
                    value={bidAmountInput}
                    onChange={(e) => setBidAmountInput(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2.5 border-2 border-[#c2c9bb] rounded-xl text-base font-mono font-bold text-[#191c1e] focus:border-[#154212] focus:outline-none"
                  />
                </div>

                {/* Quick increment buttons */}
                <div className="flex gap-2 mt-2">
                  {[1000, 2500, 5000].map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => setBidAmountInput((prev) => prev + inc)}
                      className="px-2.5 py-1 bg-[#f7f9fb] hover:bg-[#e0e3e5] border border-[#c2c9bb] rounded-lg text-xs font-bold text-[#154212] cursor-pointer"
                    >
                      +₹{inc.toLocaleString()}
                    </button>
                  ))}
                </div>

                <span className="text-[11px] text-[#72796e] mt-1.5 block">
                  {isSaralMode ? 'कुल देय राशि:' : 'Total commitment:'} <strong className="text-[#191c1e]">₹{(bidAmountInput * selectedLotForBid.quantityTons).toLocaleString()}</strong> ({selectedLotForBid.quantityTons} टन के लिए)
                </span>
              </div>

              {bidFeedback && (
                <div className="p-2.5 bg-[#bcf0ae]/40 border border-[#154212]/30 rounded text-xs text-[#154212] font-semibold">
                  {bidFeedback}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#eceef0]">
                <button
                  type="button"
                  onClick={() => setSelectedLotForBid(null)}
                  className="px-3 py-2 border border-[#c2c9bb] rounded text-xs font-semibold text-[#515f74]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#154212] text-white text-xs font-semibold rounded hover:bg-[#2d5a27] transition-colors"
                >
                  Confirm & Place Bid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gate Pass Preview Modal */}
      {activePassLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#c2c9bb] rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#eceef0]">
              <h3 className="font-bold text-base text-[#191c1e]">Depot Entry Pass Details</h3>
              <button onClick={() => setActivePassLot(null)} className="text-[#515f74] hover:text-[#191c1e]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-[#42493e]">
              <div>Lot: <strong>{activePassLot.lotNumber}</strong></div>
              <div>Material: <strong>{activePassLot.material}</strong></div>
              <div>Quantity: <strong>{activePassLot.quantityTons} Tons</strong></div>
              <div>Facility: <strong>{activePassLot.facilityLocation}</strong></div>
              <div>Moisture: <strong>{activePassLot.moistureContent}</strong></div>
              <div>Purity: <strong>{activePassLot.verifiedPurity}</strong></div>
            </div>
            <button
              onClick={() => setActivePassLot(null)}
              className="w-full py-2 bg-[#154212] text-white text-xs font-semibold rounded hover:bg-[#2d5a27]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Phone, ShieldCheck, HelpCircle, FileText, AlertTriangle, ExternalLink } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-[#ffffff] border border-[#c2c9bb] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
            id="help-modal"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#eceef0] sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#154212] text-2xl">help_center</span>
                <div>
                  <h2 className="font-semibold text-lg text-[#191c1e]">SwachhConnect Civic Help & Support</h2>
                  <p className="text-xs text-[#515f74]">Nagar Nigam Waste Management & Public Guidelines</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-md text-[#515f74] hover:text-[#191c1e] hover:bg-[#f2f4f6] transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Emergency Helplines */}
              <div className="bg-[#f7f9fb] border border-[#c2c9bb] rounded-md p-4">
                <h3 className="font-semibold text-sm text-[#154212] mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> 24x7 Municipal Control Room Helplines
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="p-2.5 bg-white border border-[#e0e3e5] rounded">
                    <span className="text-xs text-[#515f74] block">Swachhata Toll-Free National Desk</span>
                    <span className="font-mono font-bold text-[#154212] text-base">14420 / 1969</span>
                  </div>
                  <div className="p-2.5 bg-white border border-[#e0e3e5] rounded">
                    <span className="text-xs text-[#515f74] block">Zonal Waste Disposal Squad</span>
                    <span className="font-mono font-bold text-[#154212] text-base">+91 11-2338-9000</span>
                  </div>
                  <div className="p-2.5 bg-white border border-[#e0e3e5] rounded">
                    <span className="text-xs text-[#515f74] block">Bulk & Debris Special Pickup</span>
                    <span className="font-mono font-bold text-[#154212] text-base">1800-11-2026</span>
                  </div>
                  <div className="p-2.5 bg-white border border-[#e0e3e5] rounded">
                    <span className="text-xs text-[#515f74] block">CPCB Recycler & Auction Support</span>
                    <span className="font-mono font-bold text-[#154212] text-base">auctions@swachhconnect.gov.in</span>
                  </div>
                </div>
              </div>

              {/* Segregation Guide */}
              <div>
                <h3 className="font-semibold text-sm text-[#191c1e] mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#154212]" /> Color-Coded Waste Segregation Standards
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="border border-[#c2c9bb] rounded p-3 bg-[#f2f4f6]">
                    <div className="flex items-center gap-2 font-bold text-[#154212] mb-1">
                      <span className="w-3 h-3 rounded-full bg-[#154212]"></span>
                      GREEN BIN: Wet / Biodegradable
                    </div>
                    <p className="text-[#42493e]">
                      Kitchen scraps, vegetable peels, leftover food, tea leaves, garden leaves, eggshells, floral offerings.
                    </p>
                  </div>
                  <div className="border border-[#c2c9bb] rounded p-3 bg-[#f2f4f6]">
                    <div className="flex items-center gap-2 font-bold text-[#515f74] mb-1">
                      <span className="w-3 h-3 rounded-full bg-[#515f74]"></span>
                      BLUE BIN: Dry / Recyclable
                    </div>
                    <p className="text-[#42493e]">
                      Clean plastic bottles, cartons, newspaper, cans, glass jars, dry paper boxes, clean wrappers.
                    </p>
                  </div>
                  <div className="border border-[#c2c9bb] rounded p-3 bg-[#f2f4f6]">
                    <div className="flex items-center gap-2 font-bold text-[#ba1a1a] mb-1">
                      <span className="w-3 h-3 rounded-full bg-[#ba1a1a]"></span>
                      RED / BLACK: Hazardous & Sanitary
                    </div>
                    <p className="text-[#42493e]">
                      Pesticides, paint cans, syringes, sanitary pads (wrapped in paper), broken glass, expired medicines.
                    </p>
                  </div>
                  <div className="border border-[#c2c9bb] rounded p-3 bg-[#f2f4f6]">
                    <div className="flex items-center gap-2 font-bold text-[#d97706] mb-1">
                      <span className="w-3 h-3 rounded-full bg-[#d97706]"></span>
                      YELLOW BIN: E-Waste & Batteries
                    </div>
                    <p className="text-[#42493e]">
                      Old mobile chargers, broken electronics, lithium-ion cells, PCB boards, CFL & LED bulbs.
                    </p>
                  </div>
                </div>
              </div>

              {/* Citizen Service Level Agreement (SLA) */}
              <div className="border-t border-[#eceef0] pt-4">
                <h3 className="font-semibold text-sm text-[#191c1e] mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#515f74]" /> Nagar Nigam Resolution Time Commitments (SLA)
                </h3>
                <ul className="text-xs text-[#42493e] space-y-1.5 list-disc pl-4">
                  <li><strong>Overflowing Municipal Bin:</strong> Cleared within <strong>4 Hours</strong> of sensor trigger / citizen ticket.</li>
                  <li><strong>Illegal Roadside Dump:</strong> Tipper dispatch within <strong>12 Hours</strong>.</li>
                  <li><strong>Dead Animal / Biohazard Clearance:</strong> Priority emergency dispatch within <strong>2 Hours</strong>.</li>
                  <li><strong>Bulk Debris Collection:</strong> Completed on pre-booked morning or afternoon slot.</li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-[#f7f9fb] border-t border-[#eceef0] flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#154212] text-white text-xs font-semibold rounded hover:bg-[#2d5a27] transition-colors"
              >
                Close Guidelines
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, UserRole, WasteBin, Grievance, CollectionRoute, RecyclableLot, GreenReward, PickupBooking } from './types';
import { DEMO_USERS, INITIAL_BINS, INITIAL_GRIEVANCES, INITIAL_ROUTES, INITIAL_AUCTIONS, GREEN_REWARDS, INITIAL_PICKUPS } from './data/mockData';
import { Header } from './components/Header';
import { AuthScreen } from './components/AuthScreen';
import { CitizenView } from './components/CitizenView';
import { StaffView } from './components/StaffView';
import { RecyclerMarketView } from './components/RecyclerMarketView';
import { SimpleCitizenView } from './components/SimpleCitizenView';
import { WorkerDashboard } from './components/WorkerDashboard';
import { HelpModal } from './components/HelpModal';
import { speakHindi } from './utils/saralHelper';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // App state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSaralMode, setIsSaralMode] = useState<boolean>(false);
  const [bins, setBins] = useState<WasteBin[]>(INITIAL_BINS);
  const [grievances, setGrievances] = useState<Grievance[]>(INITIAL_GRIEVANCES);
  const [routes, setRoutes] = useState<CollectionRoute[]>(INITIAL_ROUTES);
  const [lots, setLots] = useState<RecyclableLot[]>(INITIAL_AUCTIONS);
  const [rewards, setRewards] = useState<GreenReward[]>(GREEN_REWARDS);
  const [pickups, setPickups] = useState<PickupBooking[]>(INITIAL_PICKUPS);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type?: 'success' | 'alert' } | null>(null);

  const showToast = (text: string, type: 'success' | 'alert' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleToggleSaral = () => {
    setIsSaralMode((prev) => {
      const nextVal = !prev;
      if (nextVal) {
        speakHindi('सरल मोड चालू हो गया है। बड़े अक्षर, हिंदी निर्देश और आसान बटन सक्रिय हैं।');
      } else {
        speakHindi('सामान्य मोड चालू है।');
      }
      return nextVal;
    });
  };

  // Auth handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    showToast(`Signed in as ${user.firstName} (${user.role === 'citizen' ? 'Citizen' : user.role === 'staff' ? 'Nagar Nigam Staff' : 'Recycling Partner'})`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast('Signed out of SwachhConnect.');
  };

  const handleSwitchRole = (role: UserRole) => {
    const targetUser = DEMO_USERS[role];
    setCurrentUser(targetUser);
    showToast(`Switched workspace to ${role === 'citizen' ? 'Citizen Portal' : role === 'simple_citizen' ? 'Saral Mode' : role === 'staff' ? 'Nagar Nigam Operations' : 'Recycling Partner'}`);
  };

  // Citizen handlers
  const handleAddGrievance = (newG: Omit<Grievance, 'id' | 'ticketNumber' | 'createdAt'>) => {
    const ticketNumber = `NN-GRV-${Math.floor(1000 + Math.random() * 9000)}`;
    const createdGrievance: Grievance = {
      ...newG,
      id: `grv-${Date.now()}`,
      ticketNumber,
      createdAt: 'Just now',
    };
    setGrievances([createdGrievance, ...grievances]);
    
    // Reward citizen with green points for filing verified report
    if (currentUser && currentUser.role === 'citizen') {
      setCurrentUser({
        ...currentUser,
        greenPoints: (currentUser.greenPoints || 340) + 25,
      });
    }

    showToast(`Grievance ${ticketNumber} logged. Assigned to Ward 14 response team (+25 Green Pts)`);
  };

  const handleBookPickup = (newP: Omit<PickupBooking, 'id' | 'bookingCode'>) => {
    const bookingCode = `NN-BULK-${Math.floor(1000 + Math.random() * 9000)}`;
    const createdPickup: PickupBooking = {
      ...newP,
      id: `pk-${Date.now()}`,
      bookingCode,
    };
    setPickups([createdPickup, ...pickups]);
    showToast(`Bulk pickup booking ${bookingCode} confirmed for ${newP.scheduledDate}`);
  };

  const handleRedeemReward = (reward: GreenReward) => {
    if (!currentUser || (currentUser.greenPoints || 0) < reward.pointsCost) return;
    
    setCurrentUser({
      ...currentUser,
      greenPoints: (currentUser.greenPoints || 0) - reward.pointsCost,
    });

    showToast(`Redeemed "${reward.title}"! Voucher code: SWC-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  // Staff handlers
  const handleUpdateBinStatus = (binId: string, fillLevel: number) => {
    setBins((prev) =>
      prev.map((bin) => {
        if (bin.id === binId) {
          const status = fillLevel > 85 ? 'critical' : fillLevel > 60 ? 'attention' : 'normal';
          const lastEmptied = fillLevel <= 20 ? 'Just now' : bin.lastEmptied;
          return { ...bin, fillLevel, status, lastEmptied };
        }
        return bin;
      })
    );
    showToast(`Bin telemetry updated to ${fillLevel}%`);
  };

  const handleDispatchTruckToBin = (binId: string, routeId: string) => {
    const targetBin = bins.find((b) => b.id === binId);
    const targetRoute = routes.find((r) => r.id === routeId);
    
    if (targetBin && targetRoute) {
      setRoutes((prev) =>
        prev.map((r) =>
          r.id === routeId
            ? { ...r, nextStop: `${targetBin.location} (${targetBin.code})`, etaMinutes: 8, status: 'In Transit' }
            : r
        )
      );

      // Empties bin after simulated transit
      setTimeout(() => {
        handleUpdateBinStatus(binId, 15);
      }, 3000);

      showToast(`Priority dispatch sent to ${targetRoute.driverName} (#${targetRoute.truckNumber}) for Bin ${targetBin.code}`);
    }
  };

  const handleResolveGrievance = (grievanceId: string, notes: string) => {
    setGrievances((prev) =>
      prev.map((g) =>
        g.id === grievanceId
          ? {
              ...g,
              status: 'Resolved',
              resolutionNotes: notes,
              resolvedAt: 'Just now',
            }
          : g
      )
    );
    showToast(`Grievance resolved and archived with supervisor sign-off.`);
  };

  const handleAssignGrievance = (grievanceId: string, officerName: string, phone: string) => {
    setGrievances((prev) =>
      prev.map((g) =>
        g.id === grievanceId
          ? {
              ...g,
              status: 'Assigned',
              assignedOfficer: officerName,
              assignedWorkerPhone: phone,
            }
          : g
      )
    );
    showToast(`Assigned grievance to ${officerName}. Direct alert dispatched.`);
  };

  // Recycler handlers
  const handlePlaceBid = (lotId: string, bidAmount: number, partnerName: string) => {
    setLots((prev) =>
      prev.map((lot) => {
        if (lot.id === lotId) {
          const updatedBids = [
            {
              id: `bid-${Date.now()}`,
              partnerName,
              bidPerTon: bidAmount,
              bidTime: 'Just now',
              isWinning: true,
            },
            ...lot.bids.map((b) => ({ ...b, isWinning: false })),
          ];
          return {
            ...lot,
            currentBidPerTon: bidAmount,
            highestBidder: partnerName,
            bids: updatedBids,
          };
        }
        return lot;
      })
    );
    showToast(`Bid of ₹${bidAmount.toLocaleString()}/Ton placed on Lot #${lots.find(l => l.id === lotId)?.lotNumber}!`);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] flex flex-col antialiased">
      {/* Universal Top Header */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenHelp={() => setIsHelpOpen(true)}
        onSwitchRole={handleSwitchRole}
        isSaralMode={isSaralMode}
        onToggleSaral={handleToggleSaral}
      />

      {/* Main Content Area */}
      {!currentUser ? (
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      ) : currentUser.role === 'citizen' || currentUser.role === 'simple_citizen' ? (
        <CitizenView
          user={currentUser}
          bins={bins}
          grievances={grievances}
          rewards={rewards}
          pickups={pickups}
          onAddGrievance={handleAddGrievance}
          onBookPickup={handleBookPickup}
          onRedeemReward={handleRedeemReward}
          isSaralMode={isSaralMode}
        />
      ) : currentUser.role === 'staff' ? (
        <StaffView
          user={currentUser}
          bins={bins}
          grievances={grievances}
          routes={routes}
          onUpdateBinStatus={handleUpdateBinStatus}
          onDispatchTruckToBin={handleDispatchTruckToBin}
          onResolveGrievance={handleResolveGrievance}
          onAssignGrievance={handleAssignGrievance}
        />
      ) : currentUser.role === 'worker' ? (
        <WorkerDashboard
          user={currentUser}
          bins={bins}
          grievances={grievances}
          pickups={pickups}
          routes={routes}
          onUpdateBinStatus={handleUpdateBinStatus}
          onResolveGrievance={handleResolveGrievance}
          isSaralMode={isSaralMode}
        />
      ) : (
        <RecyclerMarketView
          user={currentUser}
          lots={lots}
          onPlaceBid={handlePlaceBid}
        />
      )}

      {/* Municipal Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-[#154212] text-white px-4 py-3 rounded-md shadow-lg text-xs font-semibold animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-[#9dd090]" />
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}

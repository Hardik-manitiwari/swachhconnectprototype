/**
 * Saral Mode Accessibility & Speech Utilities
 */

export const HINDI_LABELS: Record<string, string> = {
  Report: 'शिकायत',
  'File Grievance': 'शिकायत दर्ज करें',
  Pickup: 'उठाना',
  'Book Pickup': 'कचरा उठाना',
  Redeem: 'इनाम',
  'Redeem Credits': 'इनाम पाएं',
  'Green Credits': 'हरित अंक',
  Overview: 'सारांश',
  'Smart Bins': 'कूड़ेदान',
  'Smart Bin Network': 'कूड़ेदान सूची',
  'My Grievances': 'मेरी शिकायतें',
  'Bulk Pickup': 'बड़ा कचरा उठाना',
  Status: 'स्थिति',
  Normal: 'सामान्य',
  Critical: 'गंभीर',
  Attention: 'ध्यान दें',
  Resolved: 'समाधान हुआ',
  Pending: 'लंबित',
  'In Progress': 'प्रगति पर',
  Assigned: 'नियुक्त',
  Dry: 'सूखा कचरा',
  Wet: 'गीला कचरा',
  Hazardous: 'खतरनाक कचरा',
  'E-Waste': 'इ-कचरा',
  Construction: 'मलबा',
  'Door-to-Door': 'घर-घर गाड़ी',
  'En Route': 'रास्ते में है',
  'Nearby Bins': 'पास के कूड़ेदान',
  'Active Complaints': 'सक्रिय शिकायतें',
  // Worker labels
  'Driver Portal': 'वाहन चालक पोर्टल',
  'Sanitation Worker': 'सफाई कर्मचारी',
  'Waste Collector': 'सफाई मित्र',
  'Route Stops': 'मार्ग के स्टॉप',
  'Next Stop': 'अगला स्टॉप',
  'Mark Collected': 'कचरा उठाया गया',
  'Upload Proof': 'फोटो प्रमाण अपलोड करें',
  'Vehicle Capacity': 'गाड़ी की क्षमता',
  'Emergency SOS': 'आपातकालीन सहायता (SOS)',
  'Start Navigation': 'मार्गदर्शन शुरू करें',
  // Recycler labels
  'Active Lots': 'सक्रिय नीलामी लॉट',
  'Place Bid': 'बोली लगाएं',
  'Current Highest Bid': 'वर्तमान उच्चतम बोली',
  'Base Price': 'न्यूनतम मूल्य',
  'Gate Pass': 'डिजिटल गेट पास',
  'Tonnage': 'मात्रा (टन)',
};

export const WORKER_VOICE_INSTRUCTIONS = {
  welcomeDriver: (truckNo: string, routeName: string) =>
    `नमस्ते। वाहन संख्या ${truckNo} के लिए ${routeName} सक्रिय है। सुरक्षित गति से वाहन चलाएं।`,
  nextStopInstruction: (stopName: string, wasteType: string) =>
    `अगला स्टॉप है: ${stopName}। यहाँ से ${wasteType === 'wet' ? 'गीला कचरा' : wasteType === 'dry' ? 'सूखा कचरा' : 'मिश्रित कचरा'} उठाना है।`,
  stopCompleted: (stopName: string) =>
    `स्टॉप ${stopName} का कचरा उठाव पूर्ण हुआ। डेटा नगर निगम सर्वर पर अपडेट कर दिया गया है।`,
  routeCompleted: () =>
    `बधाई! आपके रूट के सभी स्टॉप पूरे हो चुके हैं। अब गाड़ी को नजदीकी ट्रांसफर स्टेशन या एमआरएफ पर खाली करने के लिए ले जाएं।`,
  grievanceTaskAssigned: (ticket: string, location: string) =>
    `तत्काल शिकायत प्राप्त: टिकट नंबर ${ticket}। स्थान: ${location}। कृपया कचरा तुरंत साफ़ करें।`,
  emergencyTriggered: () =>
    `आपातकालीन संदेश नगर निगम कंट्रोल रूम को भेज दिया गया है। आपकी लोकेशन साझा कर दी गई है।`,
  equipmentRequested: () =>
    `सुरक्षा उपकरण मांग दर्ज हो गई है। डिपो से दस्ताने और मास्क प्राप्त करें।`,
};

export const getHindiLabel = (englishKey: string): string => {
  return HINDI_LABELS[englishKey] || '';
};

export const speakHindi = (text: string, onEnd?: () => void): void => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported on this browser');
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.9; // clear, comfortable pace for citizens & elders
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    // Prefer Indian English or Hindi voice
    const voice = voices.find(
      (v) =>
        v.lang.toLowerCase().includes('hi-in') ||
        v.lang.toLowerCase().includes('hi') ||
        v.name.toLowerCase().includes('hindi') ||
        v.lang.toLowerCase().includes('en-in')
    );
    if (voice) {
      utterance.voice = voice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Speech synthesis error:', err);
  }
};

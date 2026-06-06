import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';

// --- FIREBASE INITIALIZATION SAFEGUARD ---
let app, auth, db, appId;
let isFirebaseAvailable = false;

try {
  const firebaseConfigStr = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
  appId = typeof __app_id !== 'undefined' ? __app_id : 'wedding-invite-premium';
  
  if (firebaseConfigStr) {
    const firebaseConfig = JSON.parse(firebaseConfigStr);
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseAvailable = true;
  }
} catch (e) {
  console.warn("Firebase initialization skipped or failed. Running in Elegant Local Preview mode.", e);
}

// Traditional Ganesha Icon SVG
const GaneshaIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 100 100" fill="currentColor">
    <path d="M50,15 C45,15 42,20 42,25 C42,28 44,30 46,31 C43,33 40,36 39,40 C38,44 40,48 42,50 C37,51 32,54 29,59 C25,65 24,72 28,78 C32,84 40,86 48,86 C55,86 63,83 67,77 C71,71 70,64 66,59 C63,55 58,52 53,50 C55,48 57,44 56,40 C55,36 52,33 49,31 C51,30 53,28 53,25 C53,20 50,15 50,15 Z M50,18 C52,18 54,21 54,25 C54,27 52,29 50,29 C48,29 46,27 46,25 C46,21 48,18 50,18 Z M49,33 C52,34 54,37 54,40 C54,43 51,46 48,46 C45,46 42,43 42,40 C42,37 44,34 47,33 C47,33 48,33 49,33 Z M31,61 C33,57 37,54 42,53 C44,55 47,56 50,56 C53,56 56,55 58,53 C63,54 67,57 69,61 C72,66 71,72 68,76 C65,80 58,83 50,83 C42,83 35,80 32,76 C29,72 28,66 31,61 Z" />
  </svg>
);

// Fallback Couple Illustration SVG (displays if custom photo URL fails)
const CoupleFallbackIcon = () => (
  <svg className="w-full h-full text-amber-500/30 p-8 animate-pulse" viewBox="0 0 100 100" fill="currentColor">
    <path d="M50,10 C40,10 35,18 35,25 C35,35 45,45 50,52 C55,45 65,35 65,25 C65,18 60,10 50,10 Z M50,15 C56,15 60,20 60,25 C60,31 53,39 50,44 C47,39 40,31 40,25 C40,20 44,15 50,15 Z" />
    <path d="M30,55 C22,55 15,62 15,70 C15,82 25,90 50,90 C75,90 85,82 85,70 C85,62 78,55 70,55 C65,55 60,58 57,62 C55,59 52,58 50,58 C48,58 45,59 43,62 C40,58 35,55 30,55 Z M30,60 C34,60 37,63 38,67 C38,68 39,69 40,69 C41,69 42,68 42,67 C43,63 46,60 50,60 C54,60 57,63 58,67 C58,68 59,69 60,69 C61,69 62,68 62,67 C63,63 66,60 70,60 C74,60 78,64 79,69 C77,75 70,85 50,85 C30,85 23,75 21,69 C22,64 26,60 30,60 Z" />
    <circle cx="50" cy="25" r="3" fill="currentColor" />
  </svg>
);

// Shimmering mandala decor
const ShimmerMandala = () => (
  <svg className="w-16 h-16 text-amber-500/30 animate-spin-slow mx-auto opacity-75" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="50" cy="50" r="40" />
    <circle cx="50" cy="50" r="30" />
    <path d="M50,10 L50,90 M10,50 L90,50 M22,22 L78,78 M22,78 L78,22" />
    <path d="M50,20 Q40,35 50,50 Q60,35 50,20 Z" />
    <path d="M50,80 Q40,65 50,50 Q60,65 50,80 Z" />
    <path d="M20,50 Q35,40 50,50 Q35,60 20,50 Z" />
    <path d="M80,50 Q65,40 50,50 Q65,60 80,50 Z" />
  </svg>
);

// High-fidelity local mock data in case Firebase is absent
const INITIAL_LOCAL_RSVPS = [
  { id: 'mock-1', name: 'Rajesh Kumar Patel', guests: 4, attending: 'yes', wishes: 'शुभ विवाह! Wishing Shubham and Shivani a lifetime of wonderful companionship and happiness. 💐✨', timestamp: Date.now() - 50000 },
  { id: 'mock-2', name: 'Pooja & Amit Dosia', guests: 2, attending: 'yes', wishes: 'Congratulations on your special day! May God bless your beautiful union. 🌺', timestamp: Date.now() - 120000 },
  { id: 'mock-3', name: 'Rahul Sharma (CA)', guests: 1, attending: 'yes', wishes: 'Wishing you both a blessed married life. Looking forward to celebrating with you!', timestamp: Date.now() - 300000 }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [isScratched, setIsScratched] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeTab, setActiveTab] = useState('invite'); // invite, program, venue, rsvp
  const [showSettings, setShowSettings] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Default Invitation Configurations (Set default date to Friday, June 26, 2026)
  const [config, setConfig] = useState({
    groomName: "Shubham (CA)",
    groomFull: "Shubham Patel (CA)",
    brideName: "Shivani (CA)",
    brideFull: "Shivani Dosia (CA)",
    weddingDate: "2026-06-26T19:00:00", 
    venueName: "The Prandium LUX Resort",
    venueAddress: "कोकता बायपास, पटेल नगर, भोपाल (म.प्र.)",
    googleMapsLink: "https://www.google.com/maps/place/The+prandium+LUX/@23.2488705,77.5077697,766m/data=!3m2!1e3!4b1!4m9!3m8!1s0x397c41ba4aff5fd9:0x9b133088d162e7c1!5m2!4m1!1i2!8m2!3d23.2488656!4d77.51035!16s%2Fg%2F11k3qskydg?entry=ttu&g_ep=EgoyMDI2MDYwMS4wIKXMDSoASAFQAw%3D%3D",
    musicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    couplePhotoUrl: "/IMG-20260428-WA0049.jpg"
  });

  // RSVP Form & Live Feed
  const [rsvpList, setRsvpList] = useState(INITIAL_LOCAL_RSVPS);
  const [rsvpForm, setRsvpForm] = useState({
    name: '',
    guests: '4',
    attending: 'yes',
    wishes: ''
  });
  const [submitStatus, setSubmitStatus] = useState('');

  // Element References
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);

  // Time Countdown state
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isPast, setIsPast] = useState(false);

  // 1. Firebase Authentication Logic (Rule 3)
  useEffect(() => {
    if (!isFirebaseAvailable) {
      setUser({ uid: 'mock-editor-user', isAnonymous: true });
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Auth Exception, falling back gracefully:", e);
      }
    };
    
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Inject beautiful Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Yatra+One&family=Great+Vibes&family=Poppins:wght@300;400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  // 2. Real-time Firebase Syncing (Rule 1 & Rule 2)
  useEffect(() => {
    if (!isFirebaseAvailable || !user) return;

    // Load Live Configuration
    const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'current');
    const unsubConfig = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        setConfig(prev => ({ ...prev, ...docSnap.data() }));
      }
    }, (err) => console.error("Config fetch error:", err));

    // Load Live RSVPs (Simple query sorted in memory - Rule 2)
    const rsvpCol = collection(db, 'artifacts', appId, 'public', 'data', 'rsvps');
    const unsubRsvp = onSnapshot(rsvpCol, (querySnap) => {
      const list = [];
      querySnap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setRsvpList(list.length > 0 ? list : INITIAL_LOCAL_RSVPS);
    }, (err) => console.error("RSVP sync error:", err));

    return () => {
      unsubConfig();
      unsubRsvp();
    };
  }, [user]);

  // Handle countdown calculations
  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(config.weddingDate).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setIsPast(true);
        const elapsed = Math.abs(difference);
        setTimeLeft({
          days: Math.floor(elapsed / (1000 * 60 * 60 * 24)),
          hours: Math.floor((elapsed % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((elapsed % (1000 * 60)) / 1000)
        });
      } else {
        setIsPast(false);
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [config.weddingDate]);

  // English Date Formatter with elegant Hindu Tithi subtitles
  const formattedDates = useMemo(() => {
    try {
      const dateObj = new Date(config.weddingDate);
      if (isNaN(dateObj.getTime())) return { hindi: "शुक्रवार, २६ जून २०२६", english: "Friday, June 26, 2026" };

      const hindiMonths = ["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];
      const hindiDays = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
      
      const englishDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const englishMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

      const toDevnagari = (num) => num.toString().replace(/\d/g, d => "०१२३४५६७८९"[d]);

      return {
        hindi: `${hindiDays[dateObj.getDay()]}, ${toDevnagari(dateObj.getDate())} ${hindiMonths[dateObj.getMonth()]} ${toDevnagari(dateObj.getFullYear())}`,
        english: `${englishDays[dateObj.getDay()]}, ${englishMonths[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`
      };
    } catch (e) {
      return { hindi: "शुक्रवार, २६ जून २०२६", english: "Friday, June 26, 2026" };
    }
  }, [config.weddingDate]);

  // Audio Playback Handler
  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setAudioBlocked(false);
        })
        .catch(err => {
          console.warn("Autoplay blocked:", err);
          setAudioBlocked(true);
        });
    }
  };

  // Canvas Gold Scratcher Layer Setup
  useEffect(() => {
    if (activeTab === 'invite' && canvasRef.current && !isScratched) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;

      // Premium gold metallic foil effect
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#BF953F');
      gradient.addColorStop(0.25, '#FCF6BA');
      gradient.addColorStop(0.5, '#B38728');
      gradient.addColorStop(0.75, '#FBF5B7');
      gradient.addColorStop(1, '#AA771C');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Inner elegant crimson borders
      ctx.strokeStyle = '#5B0612';
      ctx.lineWidth = 4;
      ctx.strokeRect(12, 12, width - 24, height - 24);

      // Accent Corners
      ctx.fillStyle = '#5B0612';
      ctx.fillRect(12, 12, 16, 16);
      ctx.fillRect(width - 28, 12, 16, 16);
      ctx.fillRect(12, height - 28, 16, 16);
      ctx.fillRect(width - 28, height - 28, 16, 16);

      // Invitation Cover Copy
      ctx.fillStyle = '#5B0612';
      ctx.font = 'bold 20px "Cinzel Decorative", serif';
      ctx.textAlign = 'center';
      ctx.fillText('Wedding Date', width / 2, height / 2 - 12);
      
      ctx.font = '500 12px "Poppins", sans-serif';
      ctx.fillStyle = '#331100';
      ctx.fillText('✨ Scratch here to reveal the date ✨', width / 2, height / 2 + 22);
    }
  }, [activeTab, isScratched]);

  // Scratch Action Handlers with Mobile Touch Prevention
  const handleScratchStart = (e) => {
    isDrawing.current = true;
    scratch(e);
  };

  const handleScratchMove = (e) => {
    if (!isDrawing.current) return;
    if (e.cancelable) {
      e.preventDefault(); // Stop mobile dragging from scrolling the screen
    }
    scratch(e);
  };

  const handleScratchEnd = () => {
    isDrawing.current = false;
    checkScratchPercentage();
  };

  const scratch = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Adapt coordinates precisely
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
  };

  const checkScratchPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;
    let transparentCount = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) {
        transparentCount++;
      }
    }

    const percentage = Math.round((transparentCount / (pixels.length / 4)) * 100);
    setScratchPercent(percentage);

    // Auto complete once 50% is revealed
    if (percentage > 50) {
      setIsScratched(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 6000);
    }
  };

  // Commit Invitation Config changes
  const saveConfig = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (isFirebaseAvailable) {
      try {
        const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'current');
        await setDoc(configRef, config);
        setShowSettings(false);
      } catch (err) {
        console.error("Cloud configuration write failure:", err);
      }
    } else {
      localStorage.setItem('local_wedding_config', JSON.stringify(config));
      setShowSettings(false);
    }
  };

  // Submit RSVP RSVP Action
  const handleRsvpSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!rsvpForm.name.trim()) return;

    setSubmitStatus('submitting');

    const newRsvp = {
      name: rsvpForm.name,
      guests: parseInt(rsvpForm.guests, 10),
      attending: rsvpForm.attending,
      wishes: rsvpForm.wishes,
      timestamp: Date.now()
    };

    if (isFirebaseAvailable) {
      try {
        const rsvpCol = collection(db, 'artifacts', appId, 'public', 'data', 'rsvps');
        await addDoc(rsvpCol, newRsvp);
        setRsvpForm({ name: '', guests: '4', attending: 'yes', wishes: '' });
        setSubmitStatus('success');
        setTimeout(() => setSubmitStatus(''), 5000);
      } catch (err) {
        console.error("RSVP cloud upload failed:", err);
        setSubmitStatus('error');
      }
    } else {
      // Local Mode Sandbox Fallback
      const simulatedId = `local-rsvp-${Date.now()}`;
      setRsvpList(prev => [{ id: simulatedId, ...newRsvp }, ...prev]);
      setRsvpForm({ name: '', guests: '4', attending: 'yes', wishes: '' });
      setSubmitStatus('success');
      setTimeout(() => setSubmitStatus(''), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#140003] text-amber-100 font-sans flex justify-center items-center overflow-x-hidden relative selection:bg-amber-600 selection:text-[#140003]">
      
      {/* Confetti Celebration Particle Layer */}
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => {
            const randomX = Math.random() * 100;
            const randomDelay = Math.random() * 3;
            const randomDur = 2 + Math.random() * 3;
            const colors = ['#BF953F', '#FCF6BA', '#B38728', '#EF4444', '#FCD34D'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            return (
              <div 
                key={i}
                className="absolute w-3 h-3 rounded-sm animate-fall"
                style={{
                  left: `${randomX}%`,
                  top: `-5%`,
                  backgroundColor: randomColor,
                  animationDelay: `${randomDelay}s`,
                  animationDuration: `${randomDur}s`,
                  transform: `rotate(${Math.random() * 360}deg)`
                }}
              />
            );
          })}
        </div>
      )}

      {/* Decorative Shimmering Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-96 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.08)_0%,_transparent_65%)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-full h-96 bg-[radial-gradient(circle_at_bottom,_rgba(212,175,55,0.05)_0%,_transparent_65%)] pointer-events-none" />

      {/* Premium Elegant Mobile Phone Shell Container */}
      <div className="w-full max-w-md min-h-screen bg-gradient-to-b from-[#2E0106] via-[#140003] to-[#2B0105] shadow-2xl relative flex flex-col border-x border-amber-900/30 overflow-hidden pb-16">
        
        {/* Background Music Streamer */}
        <audio ref={audioRef} src={config.musicUrl} loop onError={() => console.warn("Audio load error")} />

        {/* --- FRONT DOOR / WELCOME COVER --- */}
        <div className={`absolute inset-0 z-50 flex flex-col justify-between items-center bg-[#250004] transition-all duration-1000 ease-in-out ${
          isOpen ? 'pointer-events-none -translate-y-full opacity-0' : 'opacity-100'
        }`}>
          {/* Traditional Sanskrit Mangal Mantra Header */}
          <div className="mt-8 text-center px-6 w-full animate-fadeIn">
            <p className="text-xs text-amber-500 font-bold tracking-widest uppercase mb-1">॥ शुभ विवाह ॥</p>
            <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-4" />
            
            <p className="text-amber-300 font-serif text-xs md:text-sm px-4 italic leading-relaxed font-semibold">
              "॥ श्री गणेशाय नमः ॥ <br />
              वक्रतुण्ड महाकाय, सूर्यकोटि समप्रभः । <br />
              निर्विघ्नं कुरुमेदेव, सर्व कार्येषु सर्वदा ॥"
            </p>
          </div>

          {/* Golden Ganesha Art Block */}
          <div className="flex flex-col items-center">
            <div className="w-44 h-44 rounded-full border-2 border-amber-500/40 flex items-center justify-center relative p-1 animate-pulse bg-amber-950/10">
              <div className="absolute inset-0 border border-amber-400/30 rounded-full scale-95 animate-spin duration-[15000ms]" />
              <GaneshaIcon className="w-28 h-28 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]" />
            </div>
            
            <h1 className="text-3xl text-center font-bold text-amber-100 drop-shadow mt-6 tracking-wide px-4" style={{ fontFamily: 'Cinzel Decorative, cursive' }}>
              {config.groomName} <span className="text-amber-500 font-serif text-2xl">&amp;</span> {config.brideName}
            </h1>
            <p className="text-amber-400 font-semibold tracking-widest text-xs mt-2 font-serif uppercase">A HEAVENLY UNION</p>
          </div>

          {/* Invitation Unlocker Call-to-action */}
          <div className="mb-14 text-center w-full px-6">
            <button 
              onClick={() => {
                setIsOpen(true);
                setIsPlaying(true);
                setTimeout(() => {
                  if (audioRef.current) {
                    audioRef.current.play().catch(() => {
                      setAudioBlocked(true);
                    });
                  }
                }, 400);
              }}
              className="px-8 py-3.5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 text-[#1A0003] font-bold text-base rounded-full shadow-[0_0_25px_rgba(245,158,11,0.45)] transform hover:scale-105 active:scale-95 transition-all duration-300 tracking-wider flex items-center justify-center gap-2 mx-auto uppercase"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <span>Explore Invitation</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
            <p className="text-[10px] text-amber-500/70 mt-4 tracking-wider uppercase font-semibold">TAP TO UNVEIL MUSIC & CEREMONY DETAILS</p>
          </div>
        </div>

        {/* --- FLOATING CONTROLS (Settings & Audio Player) --- */}
        {isOpen && (
          <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
            {audioBlocked && (
              <span className="text-[10px] bg-red-950/95 border border-red-500/40 px-2 py-1 rounded-md text-red-200 animate-pulse font-serif">
                Tap music disk to play 🎵
              </span>
            )}

            {/* Custom Settings Config Button */}
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2.5 bg-amber-950/95 border border-amber-500/40 rounded-full text-amber-400 hover:text-amber-200 transition-all duration-300 shadow-md hover:rotate-45"
              title="Customize invitation data"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Rotating music disk controller */}
            <button 
              onClick={toggleMusic}
              className={`p-2.5 bg-amber-950/95 border border-amber-500/40 rounded-full text-amber-400 hover:text-amber-200 transition-all shadow-md relative overflow-hidden flex items-center justify-center ${isPlaying ? 'animate-spin-slow' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              {isPlaying && (
                <span className="absolute inset-0 border border-amber-400 rounded-full animate-ping scale-110 opacity-75" />
              )}
            </button>
          </div>
        )}

        {/* --- MAIN HEADER BANNER --- */}
        {isOpen && (
          <div className="pt-14 pb-4 px-4 text-center border-b border-amber-500/10 bg-amber-950/20">
            <div className="flex justify-center mb-1">
              <GaneshaIcon className="w-8 h-8 text-amber-500 drop-shadow" />
            </div>
            <p className="text-[10px] text-amber-400 uppercase tracking-widest font-semibold font-serif">पटेल परिवार का स्नेहिल आमंत्रण</p>
          </div>
        )}

        {/* --- DYNAMIC TAB NAVIGATION VIEWPORT --- */}
        {isOpen && (
          <div className="flex-grow overflow-y-auto px-4 pt-4 pb-20">
            
            {/* INVITATION TAB */}
            {activeTab === 'invite' && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* Traditional Sanskrit Welcome Verse */}
                <div className="text-center bg-amber-950/30 p-4 rounded-xl border border-amber-500/15 relative overflow-hidden">
                  <div className="absolute top-1 left-2 text-amber-500/20 text-sm">✿</div>
                  <div className="absolute top-1 right-2 text-amber-500/20 text-sm">✿</div>
                  <p className="text-xs md:text-sm text-amber-300 font-serif leading-relaxed italic">
                    "मांगलिक कार्यक्रम की बेला में, देवगण का आशीष हो,<br />
                    हृदय की पावन वेदी पर, वर-वधू का नव जीवन हो।"
                  </p>
                </div>

                {/* --- COUPLE IMAGE SECTION WITH ERROR FALLBACK --- */}
                <div className="flex justify-center my-6">
                  <div className="p-1 rounded-[2.5rem] bg-gradient-to-tr from-amber-600 via-[#FCF6BA] to-amber-600 shadow-[0_0_20px_rgba(212,175,55,0.2)] max-w-xs w-full">
                    <div className="bg-[#1C0104] rounded-[2.3rem] overflow-hidden aspect-[4/3] flex items-center justify-center relative">
                      {!imgError && config.couplePhotoUrl ? (
                        <img 
                          src={config.couplePhotoUrl} 
                          alt="Shubham and Shivani"
                          onError={() => setImgError(true)}
                          className="w-full h-full object-cover rounded-[2.3rem]"
                        />
                      ) : (
                        <CoupleFallbackIcon />
                      )}
                    </div>
                  </div>
                </div>

                {/* Auspicious Couple Details */}
                <div className="text-center space-y-4">
                  <span className="text-[10px] text-amber-400 uppercase tracking-widest font-bold border-b border-amber-500/20 pb-1">शुभ विवाह उत्सव</span>
                  
                  {/* Groom Details Card */}
                  <div className="space-y-1 bg-amber-950/10 p-3 rounded-xl border border-amber-500/5">
                    <h2 className="text-2xl text-amber-200 font-extrabold tracking-wide font-serif">
                      {config.groomFull}
                    </h2>
                    <div className="text-[11px] text-amber-400/80 font-serif leading-relaxed space-y-0.5">
                      <p><span className="text-amber-500">मामाजी :</span> श्री जयेंद्र कुमार पटेल</p>
                      <p><span className="text-amber-500">नानाजी :</span> श्री बद्रीप्रसाद पटेल</p>
                      <p className="text-amber-200/60 text-[10px]">शीतल सिटी, फेस-२, रायसेन (म.प्र.)</p>
                    </div>
                  </div>

                  {/* Shimmering Golden Knot Joiner */}
                  <div className="flex items-center justify-center gap-3">
                    <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-amber-500" />
                    <span className="text-lg font-bold font-serif text-amber-950 bg-gradient-to-r from-amber-500 to-amber-300 px-3 py-0.5 rounded-full shadow-md">संग</span>
                    <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-amber-500" />
                  </div>

                  {/* Bride Details Card */}
                  <div className="space-y-1 bg-amber-950/10 p-3 rounded-xl border border-amber-500/5">
                    <h2 className="text-2xl text-amber-200 font-extrabold tracking-wide font-serif">
                      {config.brideFull}
                    </h2>
                    <div className="text-[11px] text-amber-400/80 font-serif leading-relaxed space-y-0.5">
                      <p><span className="text-amber-500">सुपौत्री :</span> श्री गयाप्रसाद जी ड़ोसिया (लोधी)</p>
                      <p><span className="text-amber-500">सुपुत्री :</span> श्री हाकमसिंह ड़ोसिया (लोधी)</p>
                      <p className="text-amber-200/60 text-[10px]">किनगी, रायसेन (म.प्र.)</p>
                    </div>
                  </div>
                </div>

                {/* --- INTERACTIVE SCRATCH TO REVEAL DATE --- */}
                <div className="space-y-3 pt-2">
                  <div className="text-center">
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest">Scratch To Reveal Date</h3>
                    <p className="text-[10px] text-amber-100/50 mt-0.5">Gently scratch the golden card with your finger to unlock the wedding date</p>
                  </div>

                  <div className="flex justify-center relative">
                    {/* The Hidden/Revealed Card */}
                    <div className="w-80 h-44 rounded-2xl bg-gradient-to-b from-amber-950 to-[#2A0004] border-2 border-amber-400/70 p-4 flex flex-col justify-center items-center text-center shadow-inner relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.06)_0%,_transparent_75%)]" />
                      
                      <span className="text-amber-400 font-serif font-bold text-xs uppercase tracking-wider">॥ आशीर्वाद समारोह एवं स्वरुचि भोज ॥</span>
                      <h4 className="text-xl md:text-2xl text-amber-200 font-bold mt-2 font-serif">
                        {formattedDates.english}
                      </h4>
                      <p className="text-[11px] text-amber-300 font-semibold font-serif mt-1 tracking-wider">
                        {formattedDates.hindi}
                      </p>
                      <p className="text-[10px] text-amber-400/80 font-serif tracking-widest mt-0.5 uppercase font-bold">
                        ॥ ज्येष्ठ शुक्ल पक्ष दशमी ॥
                      </p>
                      
                      <div className="mt-2.5 py-1 px-4 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] text-amber-300 font-semibold font-serif animate-pulse">
                        सायं ७:०० बजे से आपके आगमन तक
                      </div>
                    </div>

                    {/* Scratch Canvas Cover Layer */}
                    {!isScratched && (
                      <canvas 
                        ref={canvasRef}
                        width={320}
                        height={176}
                        onMouseDown={handleScratchStart}
                        onMouseMove={handleScratchMove}
                        onMouseUp={handleScratchEnd}
                        onTouchStart={handleScratchStart}
                        onTouchMove={handleScratchMove}
                        onTouchEnd={handleScratchEnd}
                        className="absolute top-0 left-1/2 -translate-x-1/2 cursor-crosshair rounded-2xl shadow-lg border-2 border-amber-500/40 touch-none"
                      />
                    )}
                  </div>

                  {isScratched && (
                    <p className="text-center text-xs text-green-400 font-semibold animate-pulse mt-1.5 flex items-center justify-center gap-1">
                      <span>✨ Date successfully revealed! ✨</span>
                    </p>
                  )}
                </div>

                {/* --- AUSPICIOUS WEDDING MUHURAT COUNTDOWN --- */}
                <div className="bg-amber-950/20 p-4 rounded-xl border border-amber-500/15 space-y-2">
                  <div className="text-center">
                    <span className="text-[9px] text-amber-500 font-bold uppercase tracking-widest font-serif">
                      {isPast ? "Happily married days elapsed" : "Auspicious Wedding Countdown"}
                    </span>
                  </div>

                  {/* Countdown Blocks */}
                  <div className="grid grid-cols-4 gap-2 text-center font-serif">
                    <div className="bg-[#3A0106] rounded-lg p-2 border border-amber-500/10">
                      <p className="text-xl font-bold text-amber-200">{timeLeft.days}</p>
                      <p className="text-[9px] text-amber-400/70">Days</p>
                    </div>
                    <div className="bg-[#3A0106] rounded-lg p-2 border border-amber-500/10">
                      <p className="text-xl font-bold text-amber-200">{timeLeft.hours}</p>
                      <p className="text-[9px] text-amber-400/70">Hours</p>
                    </div>
                    <div className="bg-[#3A0106] rounded-lg p-2 border border-amber-500/10">
                      <p className="text-xl font-bold text-amber-200">{timeLeft.minutes}</p>
                      <p className="text-[9px] text-amber-400/70">Mins</p>
                    </div>
                    <div className="bg-[#3A0106] rounded-lg p-2 border border-amber-500/10">
                      <p className="text-xl font-bold text-amber-200">{timeLeft.seconds}</p>
                      <p className="text-[9px] text-amber-400/70">Secs</p>
                    </div>
                  </div>

                  {isPast && (
                    <p className="text-center text-[9px] text-amber-500/50 leading-relaxed font-serif">
                      Note: This beautiful ceremony has taken place. Use the settings ⚙️ icon at the top to adjust the wedding date and preview a live countdown!
                    </p>
                  )}
                </div>

              </div>
            )}

            {/* TIMELINE TAB */}
            {activeTab === 'program' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="text-center">
                  <h3 className="text-xl text-amber-300 font-bold tracking-wide font-serif">मांगलिक कार्यक्रम (Timeline)</h3>
                  <div className="h-[1px] w-20 bg-amber-500/40 mx-auto mt-1" />
                </div>

                {/* Timeline Layout with English Dates */}
                <div className="relative border-l-2 border-amber-500/20 ml-3 space-y-6 pl-5 pt-2">
                  
                  {/* Event 1 */}
                  <div className="relative">
                    <div className="absolute -left-[29px] top-0.5 bg-amber-950 border-2 border-amber-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px] text-amber-400 font-bold">
                      ॐ
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-amber-400 font-bold tracking-wider font-serif bg-amber-950/70 px-2 py-0.5 rounded border border-amber-500/10 inline-block">
                        Tuesday, June 23, 2026
                      </span>
                      <span className="block text-[9px] text-amber-500/80 font-serif">
                        ज्येष्ठ शुक्ल पक्ष ७ (Jyeshtha Shukla Saptami)
                      </span>
                      <h4 className="text-base text-amber-200 font-extrabold font-serif">श्री गणेश एवं अम्बिका पूजन</h4>
                      <p className="text-xs text-amber-300/80 leading-relaxed bg-[#250104]/60 p-2.5 rounded-lg border border-amber-500/5">
                        विवाह की निर्विघ्न संपन्नता हेतु बुद्धि के अधिष्ठाता देव गणपति एवं आदि शक्ति जगदम्बा की विशेष आराधना।
                      </p>
                    </div>
                  </div>

                  {/* Event 2 */}
                  <div className="relative">
                    <div className="absolute -left-[29px] top-0.5 bg-amber-950 border-2 border-amber-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px] text-amber-400">
                      🌱
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-amber-400 font-bold tracking-wider font-serif bg-amber-950/70 px-2 py-0.5 rounded border border-amber-500/10 inline-block">
                        Wednesday, June 24, 2026
                      </span>
                      <span className="block text-[9px] text-amber-500/80 font-serif">
                        ज्येष्ठ शुक्ल पक्ष ८ (Jyeshtha Shukla Ashtami)
                      </span>
                      <h4 className="text-base text-amber-200 font-extrabold font-serif">मण्डपाच्छादन एवं हरिद्रा लेपन</h4>
                      <p className="text-xs text-amber-300/80 leading-relaxed bg-[#250104]/60 p-2.5 rounded-lg border border-amber-500/5">
                        पवित्र वैवाहिक मंडप स्थापना एवं वर-वधू को शुभ हल्दी लेपन रस्म।
                      </p>
                    </div>
                  </div>

                  {/* Event 3 */}
                  <div className="relative">
                    <div className="absolute -left-[29px] top-0.5 bg-amber-950 border-2 border-amber-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px] text-amber-400">
                      🎵
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-amber-400 font-bold tracking-wider font-serif bg-amber-950/70 px-2 py-0.5 rounded border border-amber-500/10 inline-block">
                        Thursday, June 25, 2026
                      </span>
                      <span className="block text-[9px] text-amber-500/80 font-serif">
                        ज्येष्ठ शुक्ल पक्ष ९ (Jyeshtha Shukla Navami)
                      </span>
                      <h4 className="text-base text-amber-200 font-extrabold font-serif">महिला संगीत व मंगल गीत</h4>
                      <p className="text-xs text-amber-300/80 leading-relaxed bg-[#250104]/60 p-2.5 rounded-lg border border-amber-500/5">
                        पारिवारिक सगे-संबंधियों संग संगीत संध्या एवं पारंपरिक बधाई गीतों का उत्सव।
                      </p>
                    </div>
                  </div>

                  {/* Event 4 */}
                  <div className="relative">
                    <div className="absolute -left-[29px] top-0.5 bg-amber-500 border-2 border-amber-200 rounded-full w-5 h-5 flex items-center justify-center text-[10px] text-amber-950 font-bold animate-pulse">
                      💍
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-amber-200 font-bold tracking-wider font-serif bg-amber-900 px-2 py-0.5 rounded border border-amber-400/40 inline-block">
                        Friday, June 26, 2026
                      </span>
                      <span className="block text-[9px] text-amber-300 font-serif font-bold animate-pulse">
                        ज्येष्ठ शुक्ल पक्ष १० (Jyeshtha Shukla Dashami)
                      </span>
                      <h4 className="text-base text-amber-400 font-extrabold font-serif">बारात आगमन व पाणिग्रहण संस्कार</h4>
                      <p className="text-xs text-amber-300/80 leading-relaxed bg-amber-900/10 p-2.5 rounded-lg border border-amber-500/20">
                        शुभ बारात प्रस्थान, भव्य आगमन, जयमाला एवं वैदिक मंत्रोच्चार के साथ पवित्र फेरे व परिणय सूत्र बंधन।
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* VENUE TAB */}
            {activeTab === 'venue' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="text-center">
                  <h3 className="text-xl text-amber-300 font-bold tracking-wide font-serif">विवाह स्थल मार्गनिर्देशन</h3>
                  <div className="h-[1px] w-20 bg-amber-500/40 mx-auto mt-1" />
                </div>

                {/* Venue Detail Card */}
                <div className="bg-amber-950/20 border border-amber-500/20 rounded-2xl p-5 text-center space-y-4">
                  <div className="w-14 h-14 bg-amber-500/10 border border-amber-400/30 rounded-full flex items-center justify-center mx-auto text-amber-400 text-2xl animate-bounce">
                    📍
                  </div>
                  
                  <div className="space-y-1.5">
                    <h4 className="text-lg text-amber-200 font-bold font-serif">{config.venueName}</h4>
                    <p className="text-xs text-amber-100/70 leading-relaxed max-w-xs mx-auto">
                      {config.venueAddress}
                    </p>
                  </div>

                  {/* Ornate Gold Textured Resort Map Panel */}
                  <div className="relative border border-amber-500/20 rounded-xl overflow-hidden h-44 bg-[#1D0004]">
                    <div className="absolute inset-0 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                      <ShimmerMandala />
                      <div className="bg-amber-950/95 border border-amber-500/40 p-2.5 rounded-lg shadow-lg text-center max-w-[220px] absolute z-10">
                        <p className="text-[10px] font-bold text-amber-300 font-serif">The Prandium LUX Resort</p>
                        <p className="text-[8px] text-amber-200/70 mt-0.5">पटेल नगर, भोपाल (म.प्र.)</p>
                      </div>
                      <div className="w-3 h-3 bg-amber-500 rounded-full animate-ping absolute" />
                    </div>
                  </div>

                  <a 
                    href={config.googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 text-amber-950 font-bold text-xs rounded-full shadow-md hover:brightness-110 active:scale-95 transition-all"
                  >
                    <span>Google Maps पर लोकेशन खोलें</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            )}

            {/* RSVP TAB */}
            {activeTab === 'rsvp' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="text-center">
                  <h3 className="text-xl text-amber-300 font-bold tracking-wide font-serif">उपस्थिति एवं बधाई संदेश</h3>
                  <p className="text-[10px] text-amber-100/50 mt-0.5">वर-वधू को शुभ मंगलकामनाएं व अपनी उपस्थिति सहेजें</p>
                  <div className="h-[1px] w-20 bg-amber-500/40 mx-auto mt-1" />
                </div>

                {submitStatus === 'success' && (
                  <div className="p-3 bg-green-950/80 border border-green-500/40 text-green-300 rounded-lg text-center text-xs animate-pulse">
                    ✨ आपकी शुभकामना और उपस्थिति दर्ज कर ली गई है! धन्यवाद।
                  </div>
                )}
                {submitStatus === 'error' && (
                  <div className="p-3 bg-red-950/80 border border-red-500/40 text-red-300 rounded-lg text-center text-xs">
                    ⚠️ कुछ त्रुटि हुई। कृपया पुनः प्रयास करें।
                  </div>
                )}

                {/* RSVP Form Inputs */}
                <form onSubmit={handleRsvpSubmit} className="bg-amber-950/20 border border-amber-500/15 rounded-xl p-4 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-400 mb-1 font-serif uppercase">आपका नाम (Your Full Name)</label>
                    <input 
                      type="text" 
                      required
                      value={rsvpForm.name}
                      onChange={(e) => setRsvpForm({ ...rsvpForm, name: e.target.value })}
                      placeholder="आदरणीय अतिथि का नाम"
                      className="w-full bg-[#1C0003] border border-amber-500/25 rounded-lg py-2 px-3 text-amber-100 placeholder-amber-900/50 text-xs focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-400 mb-1 font-serif uppercase">अतिथियों की संख्या</label>
                      <select 
                        value={rsvpForm.guests}
                        onChange={(e) => setRsvpForm({ ...rsvpForm, guests: e.target.value })}
                        className="w-full bg-[#1C0003] border border-amber-500/25 rounded-lg py-2 px-2 text-amber-100 text-xs focus:outline-none focus:border-amber-400 transition"
                      >
                        <option value="1">१ व्यक्ति (Self)</option>
                        <option value="2">२ व्यक्ति (Couple)</option>
                        <option value="3">३ व्यक्ति</option>
                        <option value="4">४+ सपरिवार</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-400 mb-1 font-serif uppercase">आगमन सुनिश्चित करें</label>
                      <select 
                        value={rsvpForm.attending}
                        onChange={(e) => setRsvpForm({ ...rsvpForm, attending: e.target.value })}
                        className="w-full bg-[#1C0003] border border-amber-500/25 rounded-lg py-2 px-2 text-amber-100 text-xs focus:outline-none focus:border-amber-400 transition"
                      >
                        <option value="yes">हाँ, मैं आऊँगा</option>
                        <option value="no">माफ़ करें, नहीं आ पाऊँगा</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-amber-400 mb-1 font-serif uppercase">नवदम्पति हेतु मंगलकामना / बधाई संदेश</label>
                    <textarea 
                      value={rsvpForm.wishes}
                      onChange={(e) => setRsvpForm({ ...rsvpForm, wishes: e.target.value })}
                      placeholder="शुभकामना संदेश यहाँ अंकित करें..."
                      rows={2.5}
                      className="w-full bg-[#1C0003] border border-amber-500/25 rounded-lg py-2 px-3 text-amber-100 placeholder-amber-900/50 text-xs focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={submitStatus === 'submitting'}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 text-[#1C0003] font-extrabold rounded-lg text-xs hover:brightness-110 active:scale-[0.98] transition-all tracking-wider uppercase font-serif"
                  >
                    {submitStatus === 'submitting' ? 'सहेजा जा रहा है...' : 'बधाई प्रेषित करें'}
                  </button>
                </form>

                {/* --- REAL-TIME WISH WALL DISPLAY --- */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 font-serif">
                    <span>💌 मंगल आशीर्वाद दीवार ({rsvpList.length})</span>
                  </h4>

                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {rsvpList.map((rsvp) => (
                      <div key={rsvp.id} className="bg-amber-950/15 border border-amber-500/10 p-3 rounded-lg space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-amber-300 font-serif text-[11px]">{rsvp.name}</span>
                          <span className="text-[8px] text-amber-400/60 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-500/5">
                            {rsvp.attending === 'yes' ? `साथी: ${rsvp.guests}` : 'शुभकामनाएं'}
                          </span>
                        </div>
                        {rsvp.wishes && (
                          <p className="text-[11px] text-amber-100/80 leading-relaxed font-serif italic">
                            "{rsvp.wishes}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* --- DYNAMIC CUSTOM CONFIGURATION MODAL --- */}
        {showSettings && (
          <div className="absolute inset-0 z-50 bg-[#160002]/95 backdrop-blur-md p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-amber-500/10 pb-2">
                <h3 className="text-sm font-extrabold text-amber-400 font-serif">वैवाहिक नियंत्रण पत्रक (Invitation Config)</h3>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="text-amber-500 hover:text-amber-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={saveConfig} className="space-y-3.5 text-[10px] text-amber-100/90">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-amber-400 font-semibold mb-1">दूल्हे का नाम</label>
                    <input 
                      type="text"
                      value={config.groomName}
                      onChange={(e) => setConfig({ ...config, groomName: e.target.value })}
                      className="w-full bg-[#2A0004] border border-amber-500/20 p-2 rounded text-amber-100 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-amber-400 font-semibold mb-1">दुल्हन का नाम</label>
                    <input 
                      type="text"
                      value={config.brideName}
                      onChange={(e) => setConfig({ ...config, brideName: e.target.value })}
                      className="w-full bg-[#2A0004] border border-amber-500/20 p-2 rounded text-amber-100 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-amber-400 font-semibold mb-1">दूल्हे का पूरा नाम</label>
                    <input 
                      type="text"
                      value={config.groomFull}
                      onChange={(e) => setConfig({ ...config, groomFull: e.target.value })}
                      className="w-full bg-[#2A0004] border border-amber-500/20 p-2 rounded text-amber-100 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-amber-400 font-semibold mb-1">दुल्हन का पूरा नाम</label>
                    <input 
                      type="text"
                      value={config.brideFull}
                      onChange={(e) => setConfig({ ...config, brideFull: e.target.value })}
                      className="w-full bg-[#2A0004] border border-amber-500/20 p-2 rounded text-amber-100 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-amber-400 font-semibold mb-1">विवाह तिथि व समय</label>
                  <input 
                    type="datetime-local"
                    value={config.weddingDate.substring(0, 16)}
                    onChange={(e) => setConfig({ ...config, weddingDate: e.target.value })}
                    className="w-full bg-[#2A0004] border border-amber-500/20 p-2 rounded text-amber-100 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-amber-400 font-semibold mb-1">स्थल का नाम (Venue Name)</label>
                  <input 
                    type="text"
                    value={config.venueName}
                    onChange={(e) => setConfig({ ...config, venueName: e.target.value })}
                    className="w-full bg-[#2A0004] border border-amber-500/20 p-2 rounded text-amber-100 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-amber-400 font-semibold mb-1">स्थल का पता (Venue Address)</label>
                  <input 
                    type="text"
                    value={config.venueAddress}
                    onChange={(e) => setConfig({ ...config, venueAddress: e.target.value })}
                    className="w-full bg-[#2A0004] border border-amber-500/20 p-2 rounded text-amber-100 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-amber-400 font-semibold mb-1">Google Maps लिंक</label>
                  <input 
                    type="text"
                    value={config.googleMapsLink}
                    onChange={(e) => setConfig({ ...config, googleMapsLink: e.target.value })}
                    className="w-full bg-[#2A0004] border border-amber-500/20 p-2 rounded text-amber-100 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-amber-400 font-semibold mb-1">संगीत / बैकग्राउंड ऑडियो MP3 लिंक</label>
                  <input 
                    type="text"
                    value={config.musicUrl}
                    onChange={(e) => setConfig({ ...config, musicUrl: e.target.value })}
                    className="w-full bg-[#2A0004] border border-amber-500/20 p-2 rounded text-amber-100 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-amber-400 font-semibold mb-1">कपल फोटो लिंक (URL / Path)</label>
                  <input 
                    type="text"
                    value={config.couplePhotoUrl}
                    onChange={(e) => {
                      setConfig({ ...config, couplePhotoUrl: e.target.value });
                      setImgError(false);
                    }}
                    placeholder="/IMG-20260428-WA0049.jpg"
                    className="w-full bg-[#2A0004] border border-amber-500/20 p-2 rounded text-amber-100 text-xs"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setShowSettings(false)}
                    className="flex-1 py-2 bg-amber-950 border border-amber-500/20 text-amber-400 rounded-lg font-bold uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2 bg-gradient-to-r from-amber-600 to-amber-400 text-amber-950 rounded-lg font-extrabold uppercase tracking-wider shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- DOCK-STYLE BOTTOM NAVIGATION PANEL --- */}
        {isOpen && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#160002]/95 border-t border-amber-500/20 backdrop-blur-md flex items-center justify-around px-1 z-30">
            <button 
              onClick={() => setActiveTab('invite')}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${
                activeTab === 'invite' ? 'text-amber-300 scale-105 font-bold' : 'text-amber-500/50 hover:text-amber-400'
              }`}
            >
              <span className="text-lg">🏠</span>
              <span className="text-[9px] tracking-wider font-serif">मुखपृष्ठ</span>
            </button>

            <button 
              onClick={() => setActiveTab('program')}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${
                activeTab === 'program' ? 'text-amber-300 scale-105 font-bold' : 'text-amber-500/50 hover:text-amber-400'
              }`}
            >
              <span className="text-lg">📅</span>
              <span className="text-[9px] tracking-wider font-serif">कार्यक्रम</span>
            </button>

            <button 
              onClick={() => setActiveTab('venue')}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${
                activeTab === 'venue' ? 'text-amber-300 scale-105 font-bold' : 'text-amber-500/50 hover:text-amber-400'
              }`}
            >
              <span className="text-lg">📍</span>
              <span className="text-[9px] tracking-wider font-serif">स्थान</span>
            </button>

            <button 
              onClick={() => setActiveTab('rsvp')}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${
                activeTab === 'rsvp' ? 'text-amber-300 scale-105 font-bold' : 'text-amber-500/50 hover:text-amber-400'
              }`}
            >
              <span className="text-lg">💌</span>
              <span className="text-[9px] tracking-wider font-serif">उपस्थिति</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  UserPlus, 
  LogIn, 
  LogOut, 
  Trophy, 
  Timer, 
  Camera as CameraIcon, 
  MousePointer, 
  Code, 
  Sparkles, 
  CheckCircle, 
  AlertCircle,
  Cpu,
  Tv,
  Gamepad2,
  Play
} from 'lucide-react';
import { User, PageView } from './types';
import PhpCodeViewer from './components/PhpCodeViewer';

// Seed initial test account if localStorage is empty
const SEED_USERS: User[] = [
  {
    id: 'u1',
    username: 'player1',
    fullName: 'มงคล นักเล่นระดับโปร',
    email: 'mongkol@cyberlegion.com',
    highScore: 15
  },
  {
    id: 'u2',
    username: 'esports_tester',
    fullName: 'กิตติพงษ์ ผู้ทดสอบระบบ',
    email: 'tester@cyberlegion.com',
    highScore: 24
  }
];

export default function App() {
  // Load users from localStorage or use seeded ones
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('cyber_legion_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return SEED_USERS;
      }
    }
    return SEED_USERS;
  });

  // Save users to localStorage when modified
  useEffect(() => {
    localStorage.setItem('cyber_legion_users', JSON.stringify(users));
  }, [users]);

  // View state
  const [view, setView] = useState<PageView>('index');
  // Current logged in user
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cyber_legion_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Save current user to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('cyber_legion_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('cyber_legion_current_user');
    }
  }, [currentUser]);

  // Tab state for the Home page ('recruitment' | 'php-source')
  const [activeTab, setActiveTab] = useState<'recruitment' | 'php-source'>('recruitment');

  // Login form states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form states
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [newRegInfo, setNewRegInfo] = useState<{ username: string; pass: string } | null>(null);

  // Game play states
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [controlMode, setControlMode] = useState<'camera' | 'mouse'>('mouse');
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scoreFeedback, setScoreFeedback] = useState<{ message: string; isNewRecord: boolean } | null>(null);

  // Canvas and MediaPipe References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraInstanceRef = useRef<any>(null);
  const handsInstanceRef = useRef<any>(null);
  const starRef = useRef({ x: 0.5, y: 0.5, r: 22, pulse: 1, dir: 1 });
  const pointerPosRef = useRef({ x: -1, y: -1 });
  const mousePosRef = useRef({ x: -1, y: -1 });
  const gameTimerRef = useRef<any>(null);
  const isPlayingRef = useRef(false);

  // Sync isPlaying to ref to avoid stale closure in animation loops
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Handle Login submission
  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const trimmedUser = loginUsername.trim().toLowerCase();
    
    // Check in simulated database (local state)
    // For demonstration, we allow 'player123' as password for seed, or any pass for registered ones
    const user = users.find(u => u.username.toLowerCase() === trimmedUser);
    
    if (user) {
      // Success! Simulate login
      setCurrentUser(user);
      setLoginUsername('');
      setLoginPassword('');
      setView('game');
    } else {
      setLoginError('ไม่พบชื่อผู้ใช้นี้ หรือรหัสผ่านไม่ถูกต้อง! (ลองใส่ player1)');
    }
  };

  // Handle Register submission
  const handleRegister = (e: FormEvent) => {
    e.preventDefault();
    setRegError('');

    const trimmedUser = regUsername.trim().toLowerCase();
    if (trimmedUser.length < 4) {
      setRegError('Username ต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }

    // Check if duplicate
    const exists = users.some(u => u.username.toLowerCase() === trimmedUser);
    if (exists) {
      setRegError('ชื่อผู้ใช้นี้ (Username) ถูกใช้งานแล้วในระบบ กรุณาลองใช้ชื่ออื่น!');
      return;
    }

    // Create new simulated user
    const newUser: User = {
      id: 'u_' + Date.now(),
      username: regUsername.trim(),
      fullName: regFullName.trim(),
      email: regEmail.trim(),
      highScore: 0
    };

    setUsers(prev => [...prev, newUser]);
    setNewRegInfo({
      username: regUsername.trim(),
      pass: regPassword // Show back to user as requested
    });

    // Reset fields
    setRegFullName('');
    setRegEmail('');
    setRegUsername('');
    setRegPassword('');
  };

  // MediaPipe hands-tracking loop & setup
  useEffect(() => {
    if (view !== 'game') {
      stopCamera();
      return;
    }

    // Adjust canvas size
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.parentElement?.clientWidth || 640;
        canvasRef.current.height = canvasRef.current.parentElement?.clientHeight || 480;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    if (controlMode === 'camera') {
      startCameraTracking();
    } else {
      stopCamera();
      startMouseTrackingLoop();
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      stopCamera();
    };
  }, [view, controlMode]);

  // Clean stop of camera streams
  const stopCamera = () => {
    if (cameraInstanceRef.current) {
      try {
        cameraInstanceRef.current.stop();
      } catch (err) {}
      cameraInstanceRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraLoading(false);
  };

  // Start MediaPipe camera hands tracker
  const startCameraTracking = async () => {
    setCameraLoading(true);
    setCameraError('');
    stopCamera();

    // Check if MediaPipe is available from window CDN
    // @ts-ignore
    const HandsClass = window.Hands;
    // @ts-ignore
    const CameraClass = window.Camera;

    if (!HandsClass || !CameraClass) {
      setCameraError('ไม่พบไลบรารี MediaPipe กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตเพื่อโหลด CDN');
      setCameraLoading(false);
      setControlMode('mouse');
      return;
    }

    try {
      // 1. Setup Hands analyzer
      const hands = new HandsClass({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      hands.onResults((results: any) => {
        setCameraLoading(false);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear and draw mirrored camera video frame
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        pointerPosRef.current = { x: -1, y: -1 };

        // Analyze hand landmarks
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0];
          // Tip of index finger is point 8
          const indexFinger = landmarks[8];
          
          // Mirror correction
          pointerPosRef.current.x = (1 - indexFinger.x) * canvas.width;
          pointerPosRef.current.y = indexFinger.y * canvas.height;

          // Draw neon cyberpunk skeleton
          drawHandCyberpunk(ctx, canvas.width, canvas.height, landmarks);
        }

        // Handle game ticking & star logic inside animation loop
        if (isPlayingRef.current) {
          gameLoopTick(canvas.width, canvas.height);
        }
        drawStar(ctx, canvas.width, canvas.height);
      });

      handsInstanceRef.current = hands;

      // 2. Setup video element and Camera helper
      if (videoRef.current) {
        const camera = new CameraClass(videoRef.current, {
          onFrame: async () => {
            if (handsInstanceRef.current && videoRef.current) {
              await handsInstanceRef.current.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });

        cameraInstanceRef.current = camera;
        await camera.start();
      }
    } catch (err: any) {
      console.error(err);
      setCameraError('ไม่สามารถเข้าถึงกล้องเว็บแคมได้ หรือสิทธิ์การเข้าถึงถูกปฏิเสธ');
      setCameraLoading(false);
      setControlMode('mouse');
    }
  };

  // Pure mouse simulation canvas loops when camera is off
  const startMouseTrackingLoop = () => {
    let animFrameId: number;
    
    const tick = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw beautiful radar gaming matrix grid as background
      ctx.fillStyle = '#0b0c10';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw retro target grid lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 40; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let j = 40; j < canvas.height; j += 40) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(canvas.width, j);
        ctx.stroke();
      }

      // Draw radial tracking radar circle
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 120, 0, 2 * Math.PI);
      ctx.stroke();

      // Track cursor position as hand pointer
      if (mousePosRef.current.x !== -1) {
        pointerPosRef.current = { ...mousePosRef.current };

        // Draw cursor target crosshair
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#39ff14';
        ctx.strokeStyle = '#39ff14';
        ctx.lineWidth = 2;

        // Target center circle
        ctx.beginPath();
        ctx.arc(pointerPosRef.current.x, pointerPosRef.current.y, 8, 0, 2 * Math.PI);
        ctx.stroke();

        // Crosshairs lines
        ctx.beginPath();
        ctx.moveTo(pointerPosRef.current.x - 20, pointerPosRef.current.y);
        ctx.lineTo(pointerPosRef.current.x + 20, pointerPosRef.current.y);
        ctx.moveTo(pointerPosRef.current.x, pointerPosRef.current.y - 20);
        ctx.lineTo(pointerPosRef.current.x, pointerPosRef.current.y + 20);
        ctx.stroke();
        ctx.restore();
      }

      if (isPlayingRef.current) {
        gameLoopTick(canvas.width, canvas.height);
      }

      drawStar(ctx, canvas.width, canvas.height);
      animFrameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  };

  // Draw hand mesh skeleton with beautiful neon styles
  const drawHandCyberpunk = (ctx: CanvasRenderingContext2D, width: number, height: number, landmarks: any[]) => {
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8],       // Index
      [0, 17], [5, 9], [9, 13], [13, 17],   // Palm
      [9, 10], [10, 11], [11, 12],          // Middle
      [13, 14], [14, 15], [15, 16],         // Ring
      [17, 18], [18, 19], [19, 20]          // Pinky
    ];

    // Draw neon bones
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;

    connections.forEach(([p1, p2]) => {
      const x1 = (1 - landmarks[p1].x) * width;
      const y1 = landmarks[p1].y * height;
      const x2 = (1 - landmarks[p2].x) * width;
      const y2 = landmarks[p2].y * height;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // Draw glowing joints
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#39ff14';
    ctx.fillStyle = '#39ff14';

    for (let i = 0; i < landmarks.length; i++) {
      const x = (1 - landmarks[i].x) * width;
      const y = landmarks[i].y * height;

      ctx.beginPath();
      ctx.arc(x, y, i === 8 ? 8 : 4, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.restore();
  };

  // Star drawing routine
  const drawStar = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const s = starRef.current;
    const ax = s.x * width;
    const ay = s.y * height;

    // Pulse diameter
    s.pulse += 0.04 * s.dir;
    if (s.pulse > 1.25 || s.pulse < 0.75) {
      s.dir *= -1;
    }

    const activeR = s.r * s.pulse;

    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = isPlayingRef.current ? '#ffcc00' : '#555555';
    ctx.fillStyle = isPlayingRef.current ? '#ffcc00' : '#444444';

    ctx.beginPath();
    // 5 pointed star
    let rot = (Math.PI / 2) * 3;
    let x = ax;
    let y = ay;
    const spikes = 5;
    const step = Math.PI / spikes;

    ctx.moveTo(ax, ay - activeR);
    for (let i = 0; i < spikes; i++) {
      x = ax + Math.cos(rot) * activeR;
      y = ay + Math.sin(rot) * activeR;
      ctx.lineTo(x, y);
      rot += step;

      x = ax + Math.cos(rot) * (activeR / 2);
      y = ay + Math.sin(rot) * (activeR / 2);
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(ax, ay - activeR);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // Check collision and add points
  const gameLoopTick = (width: number, height: number) => {
    const p = pointerPosRef.current;
    const s = starRef.current;
    if (p.x === -1 || p.y === -1) return;

    const starX = s.x * width;
    const starY = s.y * height;

    // Euclidean distance
    const dist = Math.hypot(p.x - starX, p.y - starY);
    if (dist < s.r + 15) {
      // Hit!
      setScore(prev => prev + 1);
      // Spawn new star
      s.x = 0.15 + Math.random() * 0.7;
      s.y = 0.15 + Math.random() * 0.7;
    }
  };

  // Start arcade assessment
  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setTimeLeft(30);
    setScoreFeedback(null);
    starRef.current.x = 0.3 + Math.random() * 0.4;
    starRef.current.y = 0.3 + Math.random() * 0.4;

    // Countdown clock
    gameTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(gameTimerRef.current);
          setIsPlaying(false);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // End and record score
  const endGame = () => {
    // Read the latest state score values
    setScore(finalScore => {
      if (!currentUser) return finalScore;

      const isNew = finalScore > currentUser.highScore;
      let msg = `บันทึกคะแนนสะสม ${finalScore} แต้มลงฐานข้อมูลเรียบร้อยแล้ว`;
      
      // Update high score in simulated storage
      if (isNew) {
        msg = `🔥 สุดยอด! บันทึกสถิติใหม่สำเร็จ: ทำคะแนนสูงสุดได้ ${finalScore} แต้ม!`;
        
        // Update user state
        setUsers(prev => prev.map(u => {
          if (u.id === currentUser.id) {
            return { ...u, highScore: finalScore };
          }
          return u;
        }));

        // Update current user
        setCurrentUser(prev => prev ? { ...prev, highScore: finalScore } : null);
      }

      setScoreFeedback({
        message: msg,
        isNewRecord: isNew
      });

      return finalScore;
    });
  };

  // Clean timer on destroy
  useEffect(() => {
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    setView('index');
    setScoreFeedback(null);
  };

  return (
    <div className="min-h-screen text-gray-300 font-sans flex flex-col justify-between selection:bg-cyan-500/20 selection:text-white">
      {/* Dynamic Cyberpunk Header */}
      <header className="border-b border-cyan-500/30 bg-black/80 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500 rounded-lg flex items-center justify-center neon-border-pulse">
            <Cpu className="text-cyan-400 w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="font-orbitron font-black text-xl tracking-widest text-white">
              CYBER<span className="text-cyan-400">_LEGION</span>
            </span>
            <span className="hidden sm:inline bg-cyan-500/10 text-cyan-400 text-[9px] font-orbitron border border-cyan-500/30 px-1.5 py-0.5 rounded ml-2 uppercase tracking-widest">
              Recruitment Drive
            </span>
          </div>
        </div>

        {/* User state control or default system status */}
        <div className="flex items-center gap-4">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-white font-bold text-xs">{currentUser.fullName}</p>
                <p className="text-[10px] text-cyan-400 font-orbitron tracking-widest">VERIFIED CYBER ATHLETE_</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white rounded text-xs font-bold transition-all duration-300 flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                LOGOUT
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"></span>
              <span className="font-orbitron text-xs text-green-400 tracking-wider">SYSTEM SECURE & READY</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Layout Container */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full flex flex-col gap-8 justify-center">
        
        {/* Render index with dual tab view (Portal presentation / PHP Code viewer) */}
        {view === 'index' && (
          <div className="space-y-8">
            
            {/* Elegant Hero Welcome */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <span className="px-3 py-1 border border-cyan-400/30 bg-cyan-500/5 text-cyan-400 font-orbitron text-xs font-bold uppercase rounded-full tracking-wider">
                E-Sports Athlete Recruitment Hub
              </span>
              <h1 className="text-4xl sm:text-5xl font-orbitron font-black tracking-tight text-white uppercase">
                Become the next <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-500 neon-text-glow">
                  Cyber Athlete
                </span>
              </h1>
              <p className="text-gray-400 text-sm leading-relaxed">
                ระบบสโมสรคัดเลือกนักกีฬา E-Sports มืออาชีพของ <strong>CYBER-LEGION</strong> ร่วมประลองฝีมือวิเคราะห์ปฏิกิริยาการเคลื่อนไหวผ่านเว็บแคมด้วยเทคโนโลยีอัจฉริยะล้ำยุค
              </p>
            </div>

            {/* Nav tabs for Live Portal vs PHP Code */}
            <div className="flex justify-center border-b border-cyan-500/15 max-w-md mx-auto">
              <button
                onClick={() => setActiveTab('recruitment')}
                className={`flex-1 py-2.5 text-center font-orbitron font-bold text-xs uppercase tracking-wider transition-all duration-300 border-b-2 ${
                  activeTab === 'recruitment'
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                🎮 LIVE RECRUITMENT PORTAL
              </button>
              <button
                onClick={() => setActiveTab('php-source')}
                className={`flex-1 py-2.5 text-center font-orbitron font-bold text-xs uppercase tracking-wider transition-all duration-300 border-b-2 ${
                  activeTab === 'php-source'
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                <Code className="inline-block w-4.5 h-4.5 mr-1" />
                PHP & MYSQL SOURCE
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'recruitment' ? (
                <motion.div
                  key="portal-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                >
                  {/* Left Column: Project highlights */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="bg-[#1f2833]/40 border border-cyan-500/10 p-6 rounded-xl space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center flex-shrink-0">
                          <Gamepad2 className="text-cyan-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold font-orbitron tracking-wide text-sm">AR HAND-TRACKING ASSESSMENT</h3>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            ระบบคัดกรองปฏิกิริยาการเคลื่อนไหวมือผ่านเว็บแคมโดยตรงโดยไม่ต้องสัมผัสเมาส์ พัฒนาจาก MediaPipe Hands เพื่อใช้วัดทักษะความว่องไวสะท้อนกลับในการคัดนักกีฬาอาชีพ
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center flex-shrink-0">
                          <Trophy className="text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold font-orbitron tracking-wide text-sm">COMPETITIVE LEADERSHIP & SALARY</h3>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            สโมสรพร้อมสนับสนุนสิ่งอำนวยความสะดวก อาหาร เงินเดือน และสวัสดิการบู้ทแคมป์ระดับสูงแก่นักกีฬาทุกรายที่ทำลายคะแนนประเมินผ่านเกณฑ์สโมสร
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border border-yellow-500/20 bg-yellow-500/5 p-4 rounded-lg flex items-start gap-3">
                      <Sparkles className="text-yellow-400 w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-yellow-200/80 leading-relaxed">
                        <span className="font-bold text-yellow-300 block mb-1">บัญชีทดสอบด่วน (Seeded Accounts):</span>
                        คุณสามารถเข้าสู่ระบบเพื่อลองเล่นได้ทันทีด้วยบัญชี <code className="bg-black/40 px-1 py-0.5 rounded font-mono text-cyan-300">player1</code> (คะแนนสูงสุด: 15) หรือสมัครสมาชิกใหม่เพื่อบันทึกสถิติแยกเฉพาะไอดีได้เลย!
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Login Card */}
                  <div className="lg:col-span-5">
                    <div className="bg-[#1f2833] border border-cyan-500/20 rounded-xl p-6 shadow-xl shadow-black/50 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-400 to-emerald-400"></div>
                      
                      <div className="text-center mb-6">
                        <h2 className="font-orbitron font-black text-white text-lg tracking-wider">GATEWAY ACCESS</h2>
                        <p className="text-xs text-gray-400 mt-1">ล็อกอินผู้สมัครเพื่อเข้าสู่ระบบทดสอบปฏิกิริยา</p>
                      </div>

                      {loginError && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded flex items-center gap-2.5 text-xs text-red-300">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span>{loginError}</span>
                        </div>
                      )}

                      <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold font-orbitron text-gray-400 uppercase tracking-widest mb-1.5">
                            Username
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="ระบุชื่อผู้ใช้งาน (เช่น player1)"
                            value={loginUsername}
                            onChange={(e) => setLoginUsername(e.target.value)}
                            className="w-full bg-[#0b0c10] border border-gray-700 focus:border-cyan-400 rounded px-3 py-2 text-white text-sm outline-none transition-all duration-300"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold font-orbitron text-gray-400 uppercase tracking-widest mb-1.5">
                            Password
                          </label>
                          <input
                            type="password"
                            required
                            placeholder="ระบุรหัสผ่านของคุณ"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="w-full bg-[#0b0c10] border border-gray-700 focus:border-cyan-400 rounded px-3 py-2 text-white text-sm outline-none transition-all duration-300"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-orbitron font-black rounded text-sm tracking-wider uppercase transition-all duration-300 shadow-lg shadow-cyan-500/20"
                        >
                          ENTER GAMEWAY ➔
                        </button>
                      </form>

                      <div className="mt-6 pt-4 border-t border-cyan-500/10 text-center text-xs">
                        ยังไม่ได้ลงทะเบียน?{' '}
                        <button
                          onClick={() => {
                            setRegError('');
                            setNewRegInfo(null);
                            setView('register');
                          }}
                          className="text-cyan-400 font-bold hover:underline font-orbitron"
                        >
                          สมัครสมาชิกที่นี่ ➔
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="php-code-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <PhpCodeViewer />
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        )}

        {/* Render register view */}
        {view === 'register' && (
          <div className="max-w-md mx-auto w-full">
            <div className="bg-[#1f2833] border border-cyan-500/20 rounded-xl p-8 shadow-xl shadow-black/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-400 to-cyan-400"></div>

              {newRegInfo ? (
                // Success display panel as requested
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="text-emerald-400 w-6 h-6" />
                    </div>
                    <h2 className="text-emerald-400 font-bold text-lg font-orbitron tracking-wider">สมัครสมาชิกสำเร็จ!</h2>
                    <p className="text-xs text-gray-400 mt-1">ระบบได้ทำการบันทึกข้อมูลไอดีผู้เล่นลงในฐานข้อมูลจำลองแล้ว</p>
                  </div>

                  <div className="bg-black/30 border border-emerald-400/20 rounded-lg p-4 space-y-3 font-mono text-xs">
                    <div className="flex justify-between border-b border-emerald-400/10 pb-2">
                      <span className="text-gray-400">USERNAME:</span>
                      <span className="text-cyan-400 font-bold">{newRegInfo.username}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-gray-400">PASSWORD:</span>
                      <span className="text-emerald-400 font-bold">{newRegInfo.pass}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                    โปรดใช้ข้อมูลด้านบนเพื่อนำไปเข้าสู่ระบบในการเข้าทดสอบฝีมือเกมอาร์เคดถัดไป
                  </p>

                  <button
                    onClick={() => {
                      setNewRegInfo(null);
                      setView('index');
                    }}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-orbitron font-bold rounded text-xs uppercase tracking-wider transition-all duration-300"
                  >
                    ➔ กลับสู่หน้าล็อกอินแรก
                  </button>
                </div>
              ) : (
                // Form layout
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="font-orbitron font-black text-white text-lg tracking-wider">CREATE PROFILE</h2>
                    <p className="text-xs text-gray-400 mt-1">กรอกข้อมูลผู้สมัครเพื่อเข้าร่วมแคมป์นักกีฬา</p>
                  </div>

                  {regError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded flex items-center gap-2.5 text-xs text-red-300">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{regError}</span>
                    </div>
                  )}

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        ชื่อ-นามสกุล (Full Name)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="เช่น มงคล ขยันเล่น"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        className="w-full bg-[#0b0c10] border border-gray-700 focus:border-cyan-400 rounded px-3 py-2 text-white text-sm outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        อีเมล (Email)
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="เช่น mongkol@cyberlegion.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full bg-[#0b0c10] border border-gray-700 focus:border-cyan-400 rounded px-3 py-2 text-white text-sm outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        กำหนด Username
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ตัวอังกฤษหรือตัวเลขอย่างน้อย 4 หลัก"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        className="w-full bg-[#0b0c10] border border-gray-700 focus:border-cyan-400 rounded px-3 py-2 text-white text-sm outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        กำหนด Password
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="รหัสผ่านเข้าสู่ระบบอย่างน้อย 4 หลัก"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full bg-[#0b0c10] border border-gray-700 focus:border-cyan-400 rounded px-3 py-2 text-white text-sm outline-none transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-orbitron font-black rounded text-sm tracking-wider uppercase transition-all duration-300"
                    >
                      CREATE PROTOCOL ➔
                    </button>
                  </form>

                  <div className="pt-2 text-center text-xs">
                    <button
                      onClick={() => setView('index')}
                      className="text-gray-400 hover:text-white underline font-orbitron"
                    >
                      ยกเลิกและกลับหน้าแรก
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Render interactive game assessment view */}
        {view === 'game' && currentUser && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Arena: 8 Columns */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              
              {/* Game HUD Bar */}
              <div className="bg-[#1f2833]/80 border border-cyan-500/20 rounded-xl p-4 flex justify-between items-center font-orbitron shadow-md">
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 tracking-wider">TIME LIMIT</p>
                  <p className="text-white text-xl font-black flex items-center justify-center gap-1.5">
                    <Timer className="w-5 h-5 text-cyan-400 animate-pulse" />
                    <span className="text-cyan-400">{timeLeft}S</span>
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-[10px] text-gray-400 tracking-wider">CURRENT SCORE</p>
                  <p className="text-white text-2xl font-black">{score}</p>
                </div>

                <div className="text-center">
                  <p className="text-[10px] text-gray-400 tracking-wider">YOUR RECORD</p>
                  <p className="text-emerald-400 text-xl font-black tracking-widest">{currentUser.highScore} PTS</p>
                </div>
              </div>

              {/* Interactive Canvas Viewport */}
              <div className="relative aspect-[4/3] w-full bg-black rounded-2xl border-2 border-cyan-400/80 overflow-hidden shadow-2xl shadow-cyan-500/5 group flex items-center justify-center min-h-[300px] max-h-[500px]">
                
                {/* Hidden video node used by MediaPipe */}
                <video
                  ref={videoRef}
                  id="webcam-video"
                  className="hidden"
                  autoPlay
                  playsInline
                  muted
                ></video>

                {/* Primary Game Canvas */}
                <canvas
                  ref={canvasRef}
                  onMouseMove={(e) => {
                    if (controlMode === 'mouse' && canvasRef.current) {
                      const rect = canvasRef.current.getBoundingClientRect();
                      mousePosRef.current = {
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top
                      };
                    }
                  }}
                  onMouseLeave={() => {
                    if (controlMode === 'mouse') {
                      mousePosRef.current = { x: -1, y: -1 };
                    }
                  }}
                  className="absolute inset-0 w-full h-full object-cover"
                ></canvas>

                {/* Camera preloader state */}
                {controlMode === 'camera' && cameraLoading && (
                  <div className="absolute inset-0 bg-[#0b0c10] flex flex-col items-center justify-center gap-4 z-10 p-6 text-center">
                    <div className="w-10 h-10 border-4 border-cyan-500/10 border-t-cyan-400 rounded-full animate-spin"></div>
                    <p className="font-orbitron text-xs text-white tracking-widest animate-pulse">
                      CONNECTING AR WEBCAM SENSORS...
                    </p>
                    <p className="text-[11px] text-gray-500 leading-relaxed max-w-sm">
                      ระบบกำลังดึงกล้องตรวจวิเคราะห์พิกัดนิ้วชี้ กรุณากดปุ่ม "อนุญาต" บนบราวเซอร์เพื่อเริ่มแอปพลิเคชัน
                    </p>
                  </div>
                )}

                {/* Camera generic error state */}
                {controlMode === 'camera' && cameraError && (
                  <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-3 z-10 p-6 text-center border border-red-500/20">
                    <AlertCircle className="text-red-400 w-10 h-10" />
                    <p className="text-red-300 font-bold text-xs">
                      {cameraError}
                    </p>
                    <button
                      onClick={() => setControlMode('mouse')}
                      className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500 hover:bg-cyan-500 text-cyan-300 hover:text-black rounded text-[11px] font-bold font-orbitron transition-all"
                    >
                      SWITCH TO MOUSE SIMULATION
                    </button>
                  </div>
                )}

                {/* Hover overlay explaining hand tracking position */}
                {controlMode === 'camera' && !cameraLoading && !cameraError && (
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur border border-cyan-500/20 px-2.5 py-1 rounded text-[10px] text-cyan-300 font-mono tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                    MEDIASENSORS ACTIVE (INDEX TIP TRIGGER)
                  </div>
                )}

                {controlMode === 'mouse' && (
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur border border-cyan-500/20 px-2.5 py-1 rounded text-[10px] text-yellow-300 font-mono tracking-wider flex items-center gap-1.5">
                    <MousePointer className="w-3.5 h-3.5" />
                    MOUSE CURSOR SIMULATION MODE
                  </div>
                )}
              </div>

              {/* Game Control Action Group */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={startGame}
                  disabled={isPlaying}
                  className={`flex-1 py-3 text-black font-orbitron font-black text-sm uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${
                    isPlaying 
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 shadow-lg shadow-emerald-500/20 cursor-pointer'
                  }`}
                >
                  <Play className="w-4 h-4 fill-black" />
                  {isPlaying ? 'Assessment in progress...' : 'START TALENT TEST ➔'}
                </button>

                {/* Control mode selector toggles */}
                <div className="flex bg-[#1f2833] border border-cyan-500/10 rounded-xl p-1 shrink-0">
                  <button
                    onClick={() => setControlMode('mouse')}
                    disabled={isPlaying}
                    className={`px-3 py-2 rounded-lg text-xs font-bold font-orbitron flex items-center gap-1.5 transition-all ${
                      controlMode === 'mouse'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : 'text-gray-400 hover:text-gray-200 disabled:opacity-50'
                    }`}
                  >
                    <MousePointer className="w-3.5 h-3.5" />
                    MOUSE SIM
                  </button>
                  <button
                    onClick={() => setControlMode('camera')}
                    disabled={isPlaying}
                    className={`px-3 py-2 rounded-lg text-xs font-bold font-orbitron flex items-center gap-1.5 transition-all ${
                      controlMode === 'camera'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : 'text-gray-400 hover:text-gray-200 disabled:opacity-50'
                    }`}
                  >
                    <CameraIcon className="w-3.5 h-3.5" />
                    WEBCAM AR
                  </button>
                </div>
              </div>

              {/* Dynamic AJAX Save/Feedback toast */}
              {scoreFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border text-xs leading-relaxed flex items-start gap-3 ${
                    scoreFeedback.isNewRecord
                      ? 'bg-emerald-500/5 border-emerald-400/30 text-emerald-300'
                      : 'bg-cyan-500/5 border-cyan-400/20 text-cyan-200'
                  }`}
                >
                  {scoreFeedback.isNewRecord ? (
                    <Trophy className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-bounce" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold font-orbitron text-[11px] block uppercase tracking-wider mb-0.5">
                      {scoreFeedback.isNewRecord ? '🏆 NEW SCHOOL RECORD DETECTED' : '✓ CLOUD RECRUITMENT SYNCED'}
                    </span>
                    {scoreFeedback.message}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sidebar: 4 Columns */}
            <div className="lg:col-span-4 flex flex-col justify-between bg-[#1f2833]/40 border border-cyan-500/10 rounded-2xl p-6">
              <div className="space-y-5">
                <h3 className="text-white font-orbitron font-bold text-sm tracking-widest uppercase border-b border-cyan-500/20 pb-2.5">
                  Assessment Protocols
                </h3>

                <div className="space-y-4 text-xs">
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-cyan-400 text-black flex items-center justify-center font-bold shrink-0 font-orbitron">1</span>
                    <p className="leading-relaxed">
                      อนุญาตกล้องเว็บแคม หรือสลับไปใช้ระบบ <strong>"Mouse Sim"</strong> ด้านล่างจอหากไม่มีกล้องเพื่อทำการทดสอบ
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-cyan-400 text-black flex items-center justify-center font-bold shrink-0 font-orbitron">2</span>
                    <p className="leading-relaxed">
                      กดปุ่ม <strong>"START TALENT TEST"</strong> สตาร์ตจับเวลาถอยหลัง 30 วินาที
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-cyan-400 text-black flex items-center justify-center font-bold shrink-0 font-orbitron">3</span>
                    <p className="leading-relaxed">
                      ใช้ <strong>"ปลายนิ้วชี้"</strong> (ในโหมดกล้อง) หรือขยับ <strong>"เม้าส์"</strong> ไปสัมผัส "ดวงดาวสีทอง" ให้ว่องไวที่สุดเพื่อเก็บคะแนนสะสม
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-cyan-400 text-black flex items-center justify-center font-bold shrink-0 font-orbitron">4</span>
                    <p className="leading-relaxed">
                      เมื่อหมดเวลา ค่าประเมินจะถูกจำลองส่งคำขอผ่าน <strong>Fetch AJAX</strong> ไปบันทึกเก็บคะแนนสูงสุดในเซิร์ฟเวอร์โดยอัตโนมัติ!
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-cyan-500/10 space-y-4">
                <div className="p-3 bg-black/40 rounded-lg space-y-1.5 text-xs">
                  <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-widest">Active Profiler:</span>
                  <p className="text-white font-bold">{currentUser.fullName}</p>
                  <p className="text-gray-400 font-mono text-[11px]">{currentUser.email}</p>
                </div>

                <button
                  onClick={() => {
                    setView('index');
                    setActiveTab('php-source');
                  }}
                  className="w-full py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-orbitron text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 uppercase"
                >
                  <Code className="w-4 h-4" />
                  VIEW PHP SOURCE CODE
                </button>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Cyberpunk Footer */}
      <footer className="border-t border-cyan-500/15 py-6 px-6 text-center text-[11px] text-gray-500 font-orbitron tracking-widest bg-black/40 mt-12">
        CYBER-LEGION RECRUITMENT DRIVE SYSTEM. BUILT FOR XAMPP & PHP-MYSQL. POWERED BY AI TRACKING.
      </footer>
    </div>
  );
}

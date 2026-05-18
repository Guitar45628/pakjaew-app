import { useEffect, useState, useRef, useCallback } from "react";
import { Navigate } from "react-router";
import { Alert } from "@/components/ui/alert";

interface DonationAlert {
  name: string;
  text: string;
  audio: string;
  amount: number;
  emotion: string;
}

export default function OBSOverlayPage() {
  const [alert, setAlert] = useState<DonationAlert | null>(null);
  const [visible, setVisible] = useState(false);
  const [particles, setParticles] = useState<{ id: number; char: string; left: number; delay: number; size: number }[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Parse URL configuration parameters
  const queryParams = new URLSearchParams(window.location.search);
  const position = queryParams.get("position") || "center"; // center | top | bottom
  const hideParticles = queryParams.get("no_particles") === "true";
  const isDemo = queryParams.get("demo") === "true";

  // Security authorization check
  const expectedKey = import.meta.env.VITE_OVERLAY_KEY || "pakjaew_super_secret_token_2026";
  const userKey = queryParams.get("key");
  const isAuthorized = userKey === expectedKey;

  const finishAlert = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setAlert(null);
      setParticles([]);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send("DONE");
      }
    }, 600); // match transition duration
  }, []);

  const triggerAlert = useCallback((donation: DonationAlert) => {
    setAlert(donation);
    setVisible(true);

    if (!hideParticles) {
      const emojiMap: Record<string, string[]> = {
        angry: ["🔥", "💢", "💥", "😡"],
        sad: ["😢", "😭", "💧", "🌧️"],
        happy: ["🎉", "💖", "✨", "🌟", "💵"],
        cool: ["😎", "⚡", "⭐", "🔥"],
        normal: ["💬", "✨", "💚"]
      };
      const emojis = emojiMap[donation.emotion] || emojiMap.normal;
      let particleCount = 10;
      if (donation.amount >= 300) {
        particleCount = 40;
      } else if (donation.amount >= 50) {
        particleCount = 20;
      }

      const newParticles = Array.from({ length: particleCount }).map((_, i) => ({
        id: i,
        char: emojis[Math.floor(Math.random() * emojis.length)],
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        size: Math.floor(Math.random() * 16) + 20,
      }));
      setParticles(newParticles);
    }

    if (audioRef.current && donation.audio) {
      audioRef.current.src = donation.audio;
      audioRef.current.play().catch(() => {
        setTimeout(() => finishAlert(), 4000);
      });
    } else {
      const timer = setTimeout(() => finishAlert(), 4000);
      return () => clearTimeout(timer);
    }
  }, [hideParticles, finishAlert]);

  useEffect(() => {
    if (!isAuthorized) return;

    function connectWS() {
      const wsUrl = "ws://localhost:8000/v1/ws/overlay";
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.action === "PLAY_AUDIO") {
            triggerAlert({
              name: data.name,
              text: data.text,
              audio: data.audio,
              amount: data.amount || 20,
              emotion: data.emotion || "normal",
            });
          }
        } catch {
          // Silent error
        }
      };

      ws.onclose = () => {
        setTimeout(connectWS, 3000);
      };

      ws.onerror = () => {
        // Silent error
      };
    }

    connectWS();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [triggerAlert, isAuthorized]);

  // Accent color mapping matching mockup colors
  const getAccent = (emotion: string) => {
    switch (emotion) {
      case "angry": return "239,68,68"; // red
      case "sad": return "59,130,246"; // blue
      case "happy": return "245,158,11"; // orange / amber
      case "cool": return "16,185,129"; // emerald
      default: return "168,85,247"; // normal / purple
    }
  };

  const rgb = alert ? getAccent(alert.emotion) : "245,158,11";

  const positionClasses = {
    top: "items-start pt-16 justify-center",
    bottom: "items-end pb-16 justify-center",
    center: "items-center justify-center",
  }[position] || "items-center justify-center";

  // Slide animation values for the 500x80 container
  const slideAnim = {
    top: visible ? "translate-y-0 opacity-100 scale-100" : "-translate-y-16 opacity-0 scale-95",
    bottom: visible ? "translate-y-0 opacity-100 scale-100" : "translate-y-16 opacity-0 scale-95",
    center: visible ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-95",
  }[position] || (visible ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-95");

  // Local playhouse demonstration triggers
  const handleLocalDemo = (emotion: string, name: string, amount: number, text: string) => {
    triggerAlert({
      name,
      text,
      audio: "", 
      amount,
      emotion,
    });
  };

  if (!isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={`relative w-screen h-screen overflow-hidden flex flex-col ${positionClasses} p-8 z-[9999] ${
      isDemo ? "bg-[#09090b]" : "bg-transparent"
    }`}>
      <audio ref={audioRef} onEnded={finishAlert} className="hidden" />

      {/* Mockup Title Header (Visible only in demo mode) */}
      {isDemo && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center select-none pointer-events-none">
          <span className="font-mono text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
            OBS BROWSER SOURCE · 500 × 80 px
          </span>
        </div>
      )}

      {/* Rising Floating Particles */}
      {visible && alert && !hideParticles && (
        <div className="absolute inset-0 pointer-events-none z-0">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute select-none bottom-[-60px] animate-[floatUp_3s_ease-out_forwards]"
              style={{
                left: `${p.left}%`,
                fontSize: `${p.size}px`,
                animationDelay: `${p.delay}s`,
              }}
            >
              {p.char}
            </div>
          ))}
        </div>
      )}

      {/* Pixel-Perfect 500x80 Alert Widget Container (Obsidian Dark) */}
      <div className="flex-grow flex items-center justify-center">
        {alert && (
          <div
            className={`relative z-10 w-[500px] h-[80px] transition-all duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275) transform ${slideAnim} ${
              alert.emotion === "angry" ? "animate-[shake_0.4s_infinite]" : ""
            }`}
          >
            <Alert className="w-full h-full bg-zinc-950/95 border border-zinc-800/80 rounded-2xl flex items-center px-4 py-3 shadow-2xl relative overflow-hidden text-left gap-0">
              {/* Elegant vertical colored accent bar inside the left edge */}
              <div
                className="absolute left-[8px] top-[10px] bottom-[10px] w-[5px] rounded-full transition-all duration-300"
                style={{
                  background: `rgb(${rgb})`,
                }}
              />

              {/* Left Column: Name & Amount */}
              <div className="flex flex-col justify-center pl-4 w-[140px] flex-shrink-0 min-w-0">
                <span className="text-base font-extrabold text-white truncate leading-tight">
                  {alert.name}
                </span>
                <span
                  className="text-sm font-extrabold mt-0.5 leading-none"
                  style={{
                    color: `rgb(${rgb})`,
                  }}
                >
                  ฿{alert.amount.toLocaleString()}
                </span>
              </div>

              {/* Vertical Divider */}
              <div className="w-[1px] h-8 bg-zinc-800/80 flex-shrink-0 mx-3" />

              {/* Right Column: Message */}
              <div className="flex-grow min-w-0 pr-2">
                <p className="text-[15px] font-bold text-white leading-snug line-clamp-2 break-words">
                  {alert.text}
                </p>
              </div>
            </Alert>
          </div>
        )}
      </div>

      {/* Mockup "ลอง emotion" playground at the bottom (Visible only in demo mode) */}
      {isDemo && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 w-full">
          <span className="font-mono text-[11px] font-bold tracking-widest text-zinc-500 uppercase select-none">
            ลอง emotion
          </span>
          <div className="flex items-center gap-2 flex-wrap justify-center px-4">
            <button
              onClick={() => handleLocalDemo("happy", "แก้ว สุขสม", 420, "ขอบคุณมากเลยครับ ดูแล้วมีความสุขมาก!")}
              className="px-5 py-2 border border-zinc-850 rounded-full text-xs font-semibold bg-zinc-950 shadow-sm transition-all hover:bg-zinc-900 active:scale-95 cursor-pointer text-zinc-400 hover:text-zinc-200"
            >
              happy ฿420
            </button>
            <button
              onClick={() => handleLocalDemo("angry", "หัวร้อนเกมเมอร์", 80, "เล่นอะไรเนี่ย แย่มากเลย! ปิดไลฟ์ไปนอนเลยไป!")}
              className="px-5 py-2 border border-zinc-850 rounded-full text-xs font-semibold bg-zinc-950 shadow-sm transition-all hover:bg-zinc-900 active:scale-95 cursor-pointer text-zinc-400 hover:text-zinc-200"
            >
              angry ฿80
            </button>
            <button
              onClick={() => handleLocalDemo("sad", "คนเหงาอกหัก", 50, "ฟังเรื่องนี้แล้วน้ำตาไหลเลยครับ แฟนเพิ่งทิ้งเมื่อวาน...")}
              className="px-5 py-2 border border-zinc-850 rounded-full text-xs font-semibold bg-zinc-950 shadow-sm transition-all hover:bg-zinc-900 active:scale-95 cursor-pointer text-zinc-400 hover:text-zinc-200"
            >
              sad ฿50
            </button>
            <button
              onClick={() => handleLocalDemo("cool", "วัยรุ่นเมกา", 200, "ช็อตนี้โคตรเท่ครับเพ่ ดุจดั่งเทพเจ้าจุติลงมาเกิด!")}
              className="px-5 py-2 border border-zinc-850 rounded-full text-xs font-semibold bg-zinc-950 shadow-sm transition-all hover:bg-zinc-900 active:scale-95 cursor-pointer text-zinc-400 hover:text-zinc-200"
            >
              cool ฿200
            </button>
            <button
              onClick={() => handleLocalDemo("normal", "ผู้ชมทั่วไป", 20, "สวัสดีครับแอดมิน แวะมาทักทายและส่งกำลังใจให้ครับ")}
              className="px-5 py-2 border border-zinc-850 rounded-full text-xs font-semibold bg-zinc-950 shadow-sm transition-all hover:bg-zinc-900 active:scale-95 cursor-pointer text-zinc-400 hover:text-zinc-200"
            >
              normal ฿20
            </button>
          </div>
        </div>
      )}

      {/* Embedded stylesheet for clean animations */}
      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(0.6) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: translateY(-115vh) scale(1.2) rotate(270deg);
            opacity: 0;
          }
        }

        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          20% { transform: translate(-2px, -1px) rotate(-1deg); }
          40% { transform: translate(-1px, 1px) rotate(1deg); }
          60% { transform: translate(2px, -1px) rotate(0deg); }
          80% { transform: translate(-1px, 1px) rotate(-1deg); }
          100% { transform: translate(1px, -1px) rotate(1deg); }
        }
      `}</style>
    </div>
  );
}
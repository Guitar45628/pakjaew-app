import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Dices, Power, Volume2, LogOut, Trash2 } from "lucide-react";

interface LogEntry {
  id: string;
  name: string;
  amount: number;
  emotion: string;
  text: string;
  timestamp: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem("pakjaew_auth") === "true";
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  
  const [simulatedLogs, setSimulatedLogs] = useState<LogEntry[]>([]);
  const [ttsEngine, setTtsEngine] = useState("edge-tts");
  const [isEnabled, setIsEnabled] = useState(true);

  const envUsername = import.meta.env.VITE_ADMIN_USERNAME || "admin";
  const envPassword = import.meta.env.VITE_ADMIN_PASSWORD || "admin1234";

  useEffect(() => {
    if (isAuthenticated) {
      fetch("http://localhost:8000/v1/donate/settings")
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((data) => {
          if (data.tts_engine) {
            setTtsEngine(data.tts_engine);
          }
          if (data.is_enabled !== undefined) {
            setIsEnabled(data.is_enabled);
          }
        })
        .catch(() => {
          // Silent error
        });
    }
  }, [isAuthenticated]);

  const handleUpdateSettings = async (selectedEngine: string, selectedEnabled: boolean) => {
    setTtsEngine(selectedEngine);
    setIsEnabled(selectedEnabled);

    const promise = fetch("http://localhost:8000/v1/donate/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tts_engine: selectedEngine, is_enabled: selectedEnabled }),
    });

    toast.promise(promise, {
      loading: "💾 กำลังบันทึกการตั้งค่าระบบ...",
      success: "บันทึกการตั้งค่าระบบสำเร็จ! ✨",
      error: "❌ บันทึกการตั้งค่าล้มเหลว!",
    });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === envUsername && password === envPassword) {
      setIsAuthenticated(true);
      setLoginError("");
      sessionStorage.setItem("pakjaew_auth", "true");
      toast.success("🔐 เข้าสู่ระบบสำเร็จ!");
    } else {
      setLoginError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง!");
      toast.error("❌ เข้าสู่ระบบล้มเหลว!");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("pakjaew_auth");
    setUsername("");
    setPassword("");
    toast.success("🔒 ออกจากระบบเรียบร้อย");
  };

  const handleRandomSimulation = async () => {
    const emotions = ["normal", "happy", "angry", "sad", "cool"];
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];

    const mockNames = {
      angry: ["สตรีมเมอร์ขี้บ่น", "หัวร้อนเกมเมอร์", "แอดมินสุดโหด", "ผู้ชมสายฟาด", "นักเลงคีย์บอร์ด"],
      sad: ["อกหักรักคุด", "คนเหงา 2026", "หนุ่มเศร้าหน้าคอม", "ซึ้งจนน้ำตาไหล", "ท้อแท้ชีวิต"],
      happy: ["เสี่ยโบ๊ท", "น้องส้มส้ม", "แฟนคลับตัวยง", "สตรีมเมอร์แฟนคลับ", "เจ๊ดันประจำช่อง"],
      cool: ["เทพเจ้าสตรีม", "นายหล่อเท่", "เกมเมอร์นิรนาม", "วัยรุ่นเมกา", "พี่บ่าวสายใต้"],
      normal: ["ผู้ชมทั่วไป", "คนผ่านมาดู", "สมชาย ใจดี", "สายโดเนทเงียบ", "สปอนเซอร์ใจดี"]
    };

    const mockMessages = {
      angry: [
        "เล่นอะไรเนี่ย แย่มากเลย! ปิดไลฟ์ไปนอนเลยไป รำราญจริง!",
        "หัวร้อนจัดแล้วนะ เลิกเดินสุ่มมั่วซั่วซักทีสิฟะ!",
        "สตรีมเมอร์เดินแบบนี้ระวังโดนตีหัวนะจ๊ะ หัวร้อนแล้วนะ!",
        "เล่นแบบนี้เด็กสามขวบยังเล่นเก่งกว่าเลยพี่เอ๊ยยยย!"
      ],
      sad: [
        "ฟังเรื่องนี้แล้วน้ำตาไหลเลยครับ แฟนเพิ่งทิ้งไปเมื่อวานนี้เอง เศร้าใจจัด",
        "ทำไมชีวิตมันเศร้าขนาดนี้ ไม่มีตังกินข้าวเลย เหลือยี่สิบบาทเนี่ย",
        "เหนื่อยงานมากเลยวันนี้ แต่มาดูสตรีมแล้วรู้สึกอุ่นใจจังครับ",
        "ขอโดเนทให้กำลังใจหน่อยนะพี่ วันนี้โดนไล่ออกสะอื้นเลย"
      ],
      happy: [
        "สุดยอดมากเลยพี่ชาย! เล่นได้สุดปัง ยินดีด้วยครับผม!",
        "วันนี้รวย โดเนทแจกความสุขเลยจ้า ขอเสียงเฮหน่อยสิ!",
        "เย้! ชนะแล้ว เล่นดีสุด ๆ เอาเงินรางวัลไปเลย!",
        "ขำไม่ไหวแล้วพี่ ชาตินี้ขำดังสุดๆ สุดจริงไลฟ์นี้!"
      ],
      cool: [
        "ช็อตนี้โคตรเท่ครับเพ่ ดุจดั่งเทพเจ้าจุติลงมาเกิด",
        "เฉียบขาดสไตล์วัยรุ่นปากแจ๋ว หล่อเกินร้อยจริงๆ ครับ",
        "จัดป่ะล่ะ ช็อตนี้ให้ร้อยเต็มร้อยเลย เท่จัดปลัดบอก",
        "ตึงเกินหน้าเกินตาแล้วพี่ หล่อเท่ออโรร่าจับ!"
      ],
      normal: [
        "สวัสดีครับแอดมิน แวะมาทักทายและส่งกำลังใจให้ยาวๆ ครับ",
        "สตรีมสนุกมากครับ ขอให้ช่องปังๆ โตไวๆ นะครับ",
        "โดเนททักทายครับพี่ เล่นดีมากเลยช็อตเมื่อกี้",
        "เป็นกำลังใจให้ทุกวันนะครับ พักผ่อนรักษาสุขภาพด้วยเน้อ"
      ]
    };

    const targetNames = mockNames[randomEmotion as keyof typeof mockNames];
    const targetMsgs = mockMessages[randomEmotion as keyof typeof mockMessages];
    
    const randomName = targetNames[Math.floor(Math.random() * targetNames.length)];
    const randomMsg = targetMsgs[Math.floor(Math.random() * targetMsgs.length)];
    const randomAmount = [20, 50, 100, 300, 500, 1000][Math.floor(Math.random() * 6)];
    const randomVoice = ["th-TH-PremwadeeNeural", "th-TH-NiwatNeural"][Math.floor(Math.random() * 2)];

    const promise = fetch("http://localhost:8000/v1/donate/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: randomName,
        text: randomMsg,
        amount: randomAmount,
        emotion: randomEmotion,
        voice: randomVoice,
      }),
    });

    toast.promise(promise, {
      loading: "🎲 กำลังทอยลูกเต๋าสุ่มจำลองโดเนท...",
      success: () => {
        const newLog: LogEntry = {
          id: Math.random().toString(36).substring(2, 9),
          name: randomName,
          amount: randomAmount,
          emotion: randomEmotion,
          text: randomMsg,
          timestamp: new Date().toLocaleTimeString("th-TH"),
        };
        setSimulatedLogs((prev) => [newLog, ...prev]);
        return `ส่งจำลองโดเนท ฿${randomAmount} สำเร็จ! 🎉`;
      },
      error: "❌ ส่งโดเนทจำลองล้มเหลว!",
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-6">
        <Card className="w-full max-w-sm shadow-lg">
          <CardHeader className="text-center space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              แอดมิน ปากแจ๋ว 🔐
            </CardTitle>
            <CardDescription>
              ระบบจัดการและจำลองโดเนทสตรีมเมอร์
            </CardDescription>
          </CardHeader>

          <CardContent>
            {loginError && (
              <div className="p-3 mb-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-lg text-center">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-username">ชื่อผู้ใช้งาน</Label>
                <Input
                  id="admin-username"
                  type="text"
                  placeholder="Username..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-password">รหัสผ่านแอดมิน</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full">
                เข้าสู่ระบบ 🚀
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-6">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        
        {/* Header Block */}
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              แผงควบคุมระบบ ปากแจ๋ว 🎙️
            </h1>
            <p className="text-xs text-muted-foreground">
              คอนโซลทดสอบเสียงและตั้งค่าการโดเนทแบบมินิมอล
            </p>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="gap-1.5"
          >
            <LogOut className="size-4" />
            ออกจากระบบ
          </Button>
        </div>

        {/* Minimal Control Panel */}
        <Card className="p-5 flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Volume2 className="size-4 text-primary" />
                <span className="text-sm font-bold">ระบบเสียงสังเคราะห์ (TTS Engine)</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                สลับโหมดเสียงสังเคราะห์ Edge-TTS, Gemini-TTS และโหมด Mock-TTS
              </p>
            </div>
            
            <div className="flex gap-1.5 bg-muted p-1 rounded-lg border">
              <Button
                size="sm"
                onClick={() => handleUpdateSettings("edge-tts", isEnabled)}
                variant={ttsEngine === "edge-tts" ? "default" : "ghost"}
                className="text-xs px-3 rounded-md"
              >
                Edge-TTS
              </Button>
              <Button
                size="sm"
                onClick={() => handleUpdateSettings("gemini-tts", isEnabled)}
                variant={ttsEngine === "gemini-tts" ? "default" : "ghost"}
                className="text-xs px-3 rounded-md"
              >
                Gemini-TTS 🤖
              </Button>
              <Button
                size="sm"
                onClick={() => handleUpdateSettings("mock-tts", isEnabled)}
                variant={ttsEngine === "mock-tts" ? "default" : "ghost"}
                className="text-xs px-3 rounded-md"
              >
                Mock-TTS
              </Button>
            </div>
          </div>

          <div className="border-t my-1" />

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Power className={`size-4 ${isEnabled ? "text-emerald-500 animate-pulse" : "text-muted-foreground"}`} />
                <span className="text-sm font-bold">สถานะรับโดเนท (Donation Switch)</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                สลับสวิตซ์เปิด-ปิดกั้นผู้ใช้งานก่อกวนชั่วคราว
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => handleUpdateSettings(ttsEngine, !isEnabled)}
              variant={isEnabled ? "destructive" : "default"}
              className="text-xs px-4 font-bold rounded-lg"
            >
              {isEnabled ? "🔒 ปิดรับชั่วคราว" : "🔓 เปิดรับข้อความ"}
            </Button>
          </div>
        </Card>

        {/* Unified Simulator Card */}
        <Card className="overflow-hidden">
          <div className="p-5 border-b flex justify-between items-center bg-muted/30">
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Dices className="size-4 text-primary" />
                เครื่องจำลองส่งสัญญาณ (Simulator)
              </h2>
              <p className="text-[11px] text-muted-foreground">
                ทอยลูกเต๋าเพื่อยิงข้อมูลโดเนทสุ่มขึ้นจอ OBS
              </p>
            </div>
            
            <Button
              onClick={handleRandomSimulation}
              className="font-bold rounded-lg gap-2"
            >
              <Dices className="size-4" />
              ทอยลูกเต๋า 🎲
            </Button>
          </div>

          {/* History log block */}
          <div className="p-5 flex flex-col gap-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-muted-foreground">บันทึกสุ่มโดเนทล่าสุด</span>
              {simulatedLogs.length > 0 && (
                <Button
                  onClick={() => {
                    setSimulatedLogs([]);
                    toast.success("🗑️ ล้างประวัติการสุ่มโดเนทแล้ว");
                  }}
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1"
                >
                  <Trash2 className="size-3" />
                  ล้างข้อมูล
                </Button>
              )}
            </div>

            <div className="flex flex-col gap-2.5 max-h-[280px] overflow-y-auto pr-1">
              {simulatedLogs.length === 0 ? (
                <div className="h-32 flex flex-col justify-center items-center text-muted-foreground text-xs border border-dashed rounded-lg bg-muted/10">
                  <span className="text-base select-none mb-1">🎲</span>
                  <span>ยังไม่มีประวัติการส่งโดเนทจำลอง</span>
                </div>
              ) : (
                simulatedLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border p-3 rounded-lg flex flex-col gap-1.5 bg-muted/20"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{log.name}</span>
                        <span className="text-[10px] bg-primary/10 text-primary border px-2 py-0.5 rounded font-black">
                          ฿{log.amount}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 bg-background border rounded text-muted-foreground">
                          {log.emotion}
                        </span>
                        <span className="text-[9px] font-mono select-none">
                          {log.timestamp}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground italic bg-background p-2 rounded border leading-relaxed">
                      “ {log.text} ”
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}

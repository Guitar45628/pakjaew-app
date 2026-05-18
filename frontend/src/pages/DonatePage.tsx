import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

const EMOTIONS = [
  { value: "normal", label: "ปกติ 😊" },
  { value: "happy", label: "เฮฮา 🎉" },
  { value: "angry", label: "หัวร้อน 😠" },
  { value: "sad", label: "ดราม่า 😢" },
  { value: "cool", label: "หล่อเท่ 😎" },
];

const PRESETS = [20, 50, 100, 300, 500, 1000];

export default function DonatePage() {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [amount, setAmount] = useState<number>(20);
  const [emotion, setEmotion] = useState("normal");
  const [voice, setVoice] = useState("th-TH-PremwadeeNeural");
  const [ttsEngine, setTtsEngine] = useState("edge-tts");
  const [submitting, setSubmitting] = useState(false);
  const [systemEnabled, setSystemEnabled] = useState(true);

  useEffect(() => {
    // 1. Fetch initial settings via HTTP to prevent race conditions
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
          setSystemEnabled(data.is_enabled);
        }
      })
      .catch(() => {
        // Silent error
      });

    // 2. Setup WebSocket for real-time updates
    let ws: WebSocket | null = null;
    let reconnectTimeout: number | null = null;

    function connectSettingsWS() {
      const wsUrl = "ws://localhost:8000/v1/ws/settings";
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.action === "UPDATE_SETTINGS") {
            if (data.tts_engine) {
              setTtsEngine(data.tts_engine);
            }
            if (data.is_enabled !== undefined) {
              setSystemEnabled(data.is_enabled);
            }
          }
        } catch {
          // Silent error
        }
      };

      ws.onclose = () => {
        reconnectTimeout = window.setTimeout(connectSettingsWS, 3000);
      };

      ws.onerror = () => {
        // Silent error
      };
    }

    connectSettingsWS();

    return () => {
      if (ws) {
        ws.onclose = null; // Prevent reconnect loop on unmount
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("⚠️ กรุณากรอกชื่อผู้โดเนท!");
      return;
    }
    if (!text.trim()) {
      toast.error("⚠️ กรุณากรอกข้อความส่งเสียง!");
      return;
    }

    setSubmitting(true);

    const promise = fetch("http://localhost:8000/v1/donate/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.trim(),
        text: text.trim(),
        amount: amount,
        emotion: ttsEngine === "edge-tts" ? "normal" : emotion,
        voice: voice,
      }),
    });

    toast.promise(promise, {
      loading: "🚀 กำลังส่งโดเนทปากแจ๋ว...",
      success: async (res) => {
        setSubmitting(false);
        if (!res.ok) {
          throw new Error("ระบบหลังบ้านขัดข้อง กรุณาลองใหม่อีกครั้ง");
        }
        const data = await res.json();
        setText("");
        return data.message || "ส่งข้อความปากแจ๋วสำเร็จ! 🎉";
      },
      error: (err) => {
        setSubmitting(false);
        return err.message || "❌ ไม่สามารถติดต่อเซิร์ฟเวอร์ได้";
      }
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-extrabold uppercase">
            ปากแจ๋ว Alert! 🎙️
          </CardTitle>
          <CardDescription>
            โดเนทเพื่อส่งข้อความเสียงพูดออกไลฟ์สตรีมด้วย AI
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!systemEnabled ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-4xl shadow-inner animate-pulse">
                🔒
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-rose-500">ระบบปิดรับส่งข้อความชั่วคราว</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  ขณะนี้สตรีมเมอร์อยู่ระหว่างช่วงปิดรับแจ้งเตือนออกไลฟ์สด หรือต้องการความเป็นส่วนตัวชั่วคราว กรุณาติดตามช่วงเวลาเปิดระบบอีกครั้งครับ!
                </p>
              </div>
              <div className="w-full pt-4">
                <Button disabled className="w-full bg-slate-800 text-slate-500 border border-slate-700">
                  🔴 ระงับการส่งโดเนทชั่วคราว
                </Button>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="donor-name">ชื่อผู้โดเนท</Label>
              <Input
                id="donor-name"
                type="text"
                maxLength={30}
                placeholder="ใส่ชื่อหรือนามแฝงของคุณ..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>จำนวนเงินโดเนท (บาท)</Label>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant={amount === preset ? "default" : "outline"}
                    onClick={() => setAmount(preset)}
                    className="w-full"
                  >
                    ฿{preset}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                min={1}
                max={100000}
                value={amount}
                onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
                className="text-center font-bold"
              />
            </div>

            {ttsEngine === "edge-tts" && (
              <div className="space-y-1.5">
                <Label>เลือกนักพากย์ AI</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={voice === "th-TH-PremwadeeNeural" ? "default" : "outline"}
                    onClick={() => setVoice("th-TH-PremwadeeNeural")}
                    className="w-full"
                  >
                    👩 เปรมวดี (หญิง)
                  </Button>
                  <Button
                    type="button"
                    variant={voice === "th-TH-NiwatNeural" ? "default" : "outline"}
                    onClick={() => setVoice("th-TH-NiwatNeural")}
                    className="w-full"
                  >
                    👨 นิวัฒน์ (ชาย)
                  </Button>
                </div>
              </div>
            )}

            {ttsEngine !== "edge-tts" && (
              <div className="space-y-1.5">
                <Label>เลือกอารมณ์ / เอฟเฟกต์ภาพ</Label>
                <div className="grid grid-cols-5 gap-1.5">
                  {EMOTIONS.map((emo) => (
                    <Button
                      key={emo.value}
                      type="button"
                      variant={emotion === emo.value ? "default" : "outline"}
                      onClick={() => setEmotion(emo.value)}
                      className="px-0 text-xs"
                    >
                      {emo.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="donation-message">ข้อความส่งออกสตรีม</Label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {text.length}/120
                </span>
              </div>
              <Textarea
                id="donation-message"
                maxLength={120}
                rows={3}
                placeholder="อยากให้ออกเสียงคำไหน... พิมพ์มาได้เลย!"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full font-bold"
            >
              {submitting ? "กำลังส่ง..." : `ส่งโดเนท ฿${amount.toLocaleString()}`}
            </Button>
          </form>
          </>
          )}
        </CardContent>
      </Card>
      <span className="text-[10px] text-muted-foreground mt-4 font-mono uppercase tracking-wider">
        PakJaew • Development by GUITAR45628
      </span>
    </div>
  );
}

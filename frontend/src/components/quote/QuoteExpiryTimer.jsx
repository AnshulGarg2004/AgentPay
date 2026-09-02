import { useState, useEffect } from "react";

export default function QuoteExpiryTimer({ expiresAt, onExpire }) {
  const [timeLeftMs, setTimeLeftMs] = useState(0);

  useEffect(() => {
    function updateTimer() {
      const targetTime = new Date(expiresAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, targetTime - now);
      setTimeLeftMs(diff);

      if (diff === 0 && onExpire) {
        onExpire();
      }
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const totalSeconds = Math.floor(timeLeftMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // Color Shift Rules
  let timerStyle = "bg-surface border-surface-border text-ink-400";

  if (totalSeconds <= 0) {
    timerStyle = "bg-danger-dark/40 text-danger border-danger/30 font-bold";
  } else if (totalSeconds < 30) {
    timerStyle = "bg-danger-dark/40 text-danger border-danger/30 animate-pulse font-bold";
  } else if (totalSeconds < 120) {
    timerStyle = "bg-warning-dark/40 text-warning border-warning/30 font-semibold";
  }

  return (
    <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border text-xs font-mono transition-colors duration-300 ${timerStyle}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      <span>{totalSeconds > 0 ? `Expires in ${formattedTime}` : "EXPIRED"}</span>
    </div>
  );
}

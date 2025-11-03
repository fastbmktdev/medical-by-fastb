export default function Marquee() {
  const marqueeTexts = [
    "🥊 MUAY THAI",
    "💪 TRAIN HARD",
    "🔥 FIGHT SMART",
    "⚡ NEVER GIVE UP",
    "🏆 CHAMPIONS MINDSET",
    "👊 RESPECT & HONOR",
  ];

  return (
    <div className="relative bg-gradient-to-r from-red-600 to-red-700 py-3 w-full overflow-hidden">
      <div className="flex gap-8 whitespace-nowrap animate-marquee">
        {[...marqueeTexts, ...marqueeTexts].map((text, index) => (
          <span
            key={index}
            className="inline-block font-bold text-lg tracking-wider"
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
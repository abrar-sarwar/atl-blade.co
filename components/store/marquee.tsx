const WORDS = [
  "Damascus Steel",
  "Made in Atlanta",
  "ATL Blade Co.",
  "Pocket Knives",
  "Karambits",
  "Skinners",
  "Trackers",
];

/** Decorative scrolling strip (matches the legacy marquee). */
export function Marquee() {
  const items = [...WORDS, ...WORDS];
  return (
    <div className="marquee-strip" aria-hidden="true">
      <div className="marquee-inner">
        {items.map((w, i) => (
          <span key={i}>
            {w}
            <span className="dot"> ✦ </span>
          </span>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

export function HeroGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(
      () => setActive((a) => (a + 1) % images.length),
      4500,
    );
    return () => clearInterval(id);
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <div className="hero-gallery">
      {images.map((src, i) => (
        <div key={i} className={`gallery-slide ${i === active ? "active" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={`${alt} ${i + 1}`} />
        </div>
      ))}
      {images.length > 1 ? (
        <div className="gallery-dots">
          {images.map((_, i) => (
            <button
              key={i}
              className={`gallery-dot ${i === active ? "active" : ""}`}
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Renders a hero title where **words** become gold/italic, \n becomes a break. */
export function HeroTitle({ title }: { title: string }) {
  const parts = title.split(/(\*\*[^*]+\*\*)/g);
  return (
    <h1 className="hero-title">
      {parts.map((part, i) => {
        const m = part.match(/^\*\*([^*]+)\*\*$/);
        if (m) {
          return (
            <span key={i} className="gold-word">
              {m[1]}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </h1>
  );
}

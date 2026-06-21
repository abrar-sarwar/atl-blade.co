"use client";

import { useState } from "react";

export function DetailGallery({
  images,
  name,
}: {
  images: { url: string; alt: string | null }[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div>
      <div className="detail-main-img">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.url} alt={current.alt ?? name} />
        ) : null}
      </div>
      {images.length > 1 ? (
        <div className="detail-thumbs">
          {images.map((img, i) => (
            <button
              key={i}
              className={`detail-thumb ${i === active ? "active" : ""}`}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt ?? `${name} thumbnail ${i + 1}`} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

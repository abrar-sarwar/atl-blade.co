import Image from "next/image";
import type { HomeSection } from "@/lib/validation/settings";

function paragraphs(body: string | null | undefined): string[] {
  if (!body) return [];
  return body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

/** Renders an ordered list of homepage sections by type. */
export function HomeSections({ sections }: { sections: HomeSection[] }) {
  return (
    <>
      {sections.map((s, i) => {
        if (s.type === "quote") {
          return (
            <section key={i} className="craft-banner">
              <Image
                src="/brand/logo.png"
                alt=""
                width={64}
                height={64}
                className="craft-logo"
              />
              <blockquote className="craft-quote">{s.body}</blockquote>
              {s.attribution ? (
                <div className="craft-attr">{s.attribution}</div>
              ) : null}
            </section>
          );
        }

        // about + text
        const reverse = i % 2 === 1;
        return (
          <section
            key={i}
            className={`about ${s.type === "about" && reverse ? "reverse" : ""}`}
            style={
              s.type === "text"
                ? { gridTemplateColumns: "1fr", maxWidth: 760, textAlign: "center" }
                : undefined
            }
          >
            {s.type === "about" && s.image_url ? (
              <div className="about-visual">
                {/* legacy photo from /public; plain img keeps cover sizing simple */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image_url} alt={s.heading ?? ""} />
              </div>
            ) : null}
            <div>
              {s.eyebrow ? <div className="section-label">{s.eyebrow}</div> : null}
              {s.heading ? (
                <h2 className="about-heading">{s.heading}</h2>
              ) : null}
              {paragraphs(s.body).map((p, j) => (
                <p key={j} className="about-body">
                  {p}
                </p>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}

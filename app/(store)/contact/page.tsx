import { getSiteSettings } from "@/lib/db/settings";
import { ContactForm } from "./_components/contact-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contact — ATL Blade Co.",
  description: "Custom orders, wholesale, or questions about a blade.",
};

type Address = {
  line1?: string;
  city?: string;
  state?: string;
  country?: string;
};

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const address = (settings?.address as Address) ?? {};
  const locationParts = [address.city, address.state, address.country].filter(
    Boolean,
  );

  return (
    <div className="contact-wrap">
      <div>
        <div className="section-label">Get In Touch</div>
        <h1 className="contact-title">
          Let&apos;s <em>Talk Steel</em>
        </h1>
        <div className="section-divider" style={{ margin: "1.2rem 0" }} />
        <p className="contact-body">
          Custom orders, wholesale, or just questions about a knife you&apos;re
          curious about. Email directly or use the form.
        </p>
        <p className="contact-body">
          If you have something specific in mind, send a quick description and
          we&apos;ll see what we can do.
        </p>

        <div className="contact-links">
          {settings?.contact_email ? (
            <div className="contact-link-item">
              <span className="cl-icon">✉</span>
              <a href={`mailto:${settings.contact_email}`}>
                {settings.contact_email}
              </a>
            </div>
          ) : null}
          {settings?.phone ? (
            <div className="contact-link-item">
              <span className="cl-icon">☎</span>
              <span>{settings.phone}</span>
            </div>
          ) : null}
          {locationParts.length > 0 ? (
            <div className="contact-link-item">
              <span className="cl-icon">◈</span>
              <span>{locationParts.join(", ")}</span>
            </div>
          ) : null}
        </div>
      </div>

      <ContactForm />
    </div>
  );
}

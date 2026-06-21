"use client";

import { useState } from "react";

// Reuses the legacy site's Web3Forms access key (public by design).
const WEB3FORMS_KEY = "5ac1e9f9-b949-4e29-a577-dc48bd9de095";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: data,
      });
      if (res.ok) {
        setStatus("sent");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className="contact-form" onSubmit={onSubmit}>
      <input type="hidden" name="access_key" value={WEB3FORMS_KEY} />
      <input type="hidden" name="from_name" value="ATL Blade Co. Website" />
      <input
        type="hidden"
        name="subject"
        value="New contact from atlbladeco.com"
      />
      <input
        type="checkbox"
        name="botcheck"
        style={{ display: "none" }}
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="form-heading">Send a Message</div>
      <div className="form-rule" />

      <div className="form-group">
        <label className="form-label" htmlFor="name">
          Full Name
        </label>
        <input className="form-input" id="name" name="name" required />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="email">
          Email Address
        </label>
        <input
          className="form-input"
          id="email"
          name="email"
          type="email"
          required
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="subject">
          Subject
        </label>
        <input className="form-input" id="subject" name="user_subject" />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="message">
          Message
        </label>
        <textarea className="form-textarea" id="message" name="message" required />
      </div>

      <button className="form-submit" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send Message →"}
      </button>

      {status === "sent" ? (
        <div className="form-msg">✦ Got it. We&apos;ll get back to you soon.</div>
      ) : null}
      {status === "error" ? (
        <div className="form-msg" style={{ color: "#e07a7a" }}>
          Something went wrong. Email us directly instead.
        </div>
      ) : null}
    </form>
  );
}

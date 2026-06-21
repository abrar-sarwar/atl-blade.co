import Link from "next/link";

export const metadata = { title: "Checkout Canceled — ATL Blade Co." };

export default function CheckoutCancelPage() {
  return (
    <div
      className="contact-wrap"
      style={{ gridTemplateColumns: "1fr", textAlign: "center", maxWidth: 640 }}
    >
      <div>
        <div className="section-label">Checkout</div>
        <h1 className="contact-title">
          Order <em>Canceled</em>
        </h1>
        <div className="section-divider" style={{ margin: "1.2rem auto" }} />
        <p className="contact-body">
          No charge was made. Your cart is still saved if you&apos;d like to try
          again.
        </p>
        <div style={{ marginTop: "2rem" }}>
          <Link href="/shop" className="btn-primary">
            Back to Shop
          </Link>
        </div>
      </div>
    </div>
  );
}

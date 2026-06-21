import Link from "next/link";
import { ClearCart } from "./_components/clear-cart";

export const metadata = { title: "Order Confirmed — ATL Blade Co." };

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return (
    <div
      className="contact-wrap"
      style={{ gridTemplateColumns: "1fr", textAlign: "center", maxWidth: 640 }}
    >
      <ClearCart />
      <div>
        <div className="section-label">Thank You</div>
        <h1 className="contact-title">
          Order <em>Confirmed</em>
        </h1>
        <div className="section-divider" style={{ margin: "1.2rem auto" }} />
        <p className="contact-body">
          We&apos;ve received your order
          {order ? (
            <>
              {" "}
              <strong style={{ color: "var(--gold)" }}>{order}</strong>
            </>
          ) : null}
          . You&apos;ll get a confirmation email shortly, and we&apos;ll be in
          touch when it ships.
        </p>
        <div style={{ marginTop: "2rem" }}>
          <Link href="/shop" className="btn-primary">
            Keep Browsing
          </Link>
        </div>
      </div>
    </div>
  );
}

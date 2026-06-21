import Link from "next/link";
import { Cinzel, Cormorant_Garamond, Raleway } from "next/font/google";
import { getSiteSettings } from "@/lib/db/settings";
import { CartProvider } from "@/components/store/cart/cart-provider";
import { CartButton } from "@/components/store/cart/cart-button";
import { CartDrawer } from "@/components/store/cart/cart-drawer";
import "./storefront.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cinzel",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});
const raleway = Raleway({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-raleway",
});

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  const social = (settings?.social_links ?? {}) as Record<string, string>;
  const company = settings?.company_name ?? "ATL Blade Co.";

  return (
    <CartProvider>
      <div
        className={`store ${cinzel.variable} ${cormorant.variable} ${raleway.variable}`}
      >
        <nav className="store-nav">
          <Link href="/" className="brand">
            {company.toUpperCase()}
          </Link>
          <div className="links">
            <Link href="/">Home</Link>
            <Link href="/shop">Shop</Link>
            <Link href="/contact">Contact</Link>
            <CartButton />
          </div>
        </nav>

        {children}

      <footer className="store-footer">
        <div className="socials">
          {social.instagram ? (
            <a href={social.instagram} target="_blank" rel="noopener">
              Instagram
            </a>
          ) : null}
          {social.tiktok ? (
            <a href={social.tiktok} target="_blank" rel="noopener">
              TikTok
            </a>
          ) : null}
        </div>
        <div>
          &copy; {company}. Handmade in Atlanta.
        </div>
      </footer>

        <CartDrawer />
      </div>
    </CartProvider>
  );
}

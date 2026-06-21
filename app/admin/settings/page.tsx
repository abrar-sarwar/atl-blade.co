import { getSiteSettings } from "@/lib/db/settings";
import { SettingsForm } from "./_components/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Company details shown across the storefront, footer, and contact page.
        </p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}

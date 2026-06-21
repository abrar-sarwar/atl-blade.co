import { getHomepageSettings } from "@/lib/db/settings";
import { listProductOptions } from "@/lib/db/products";
import { HomepageForm } from "./_components/homepage-form";

export const dynamic = "force-dynamic";

export default async function HomepageEditorPage() {
  const [settings, productOptions] = await Promise.all([
    getHomepageSettings(),
    listProductOptions(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Homepage Editor</h2>
        <p className="text-sm text-muted-foreground">
          Manage the storefront homepage content. Changes publish immediately.
        </p>
      </div>
      <HomepageForm settings={settings} productOptions={productOptions} />
    </div>
  );
}

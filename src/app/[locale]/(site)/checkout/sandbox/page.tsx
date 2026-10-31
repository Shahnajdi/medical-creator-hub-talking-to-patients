import { notFound } from "next/navigation";
import { env } from "@/lib/env";
import { userGuard } from "@/lib/auth/guard";
import { SandboxPay } from "@/components/forms/SandboxPay";

/** Development-only stand-in for a provider's hosted checkout page. 404 in production. */
export default async function Sandbox({ params, searchParams }: { params: Promise<{ locale: "fa" | "en" }>; searchParams: Promise<{ ref?: string }> }) {
  const { locale } = await params;
  if (env().APP_ENV === "production" || !env().PAYMENT_PROVIDERS.includes("mock")) notFound();
  await userGuard(locale, "/checkout/sandbox");
  const { ref } = await searchParams;
  if (!ref) notFound();
  return (
    <div className="container-x max-w-xl py-20" dir="ltr">
      <p className="rounded-xl bg-lime p-3 text-sm font-bold text-ink">SANDBOX — no real payment is processed</p>
      <h1 className="mt-6 text-2xl font-black">Mock payment provider</h1>
      <p className="mt-2 mb-8 text-sm text-slate-strong">Ref: {ref}. The result is delivered through the signed webhook path, exactly like a real provider.</p>
      <SandboxPay providerRef={ref} successPath={locale === "fa" ? "/checkout/success" : "/en/checkout/success"} />
    </div>
  );
}

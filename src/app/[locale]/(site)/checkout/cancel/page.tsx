import { Link } from "@/i18n/navigation";
export default async function Cancel({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const fa = (await params).locale === "fa";
  return <div className="container-x max-w-xl py-20"><h1 className="text-2xl font-black">{fa ? "پرداخت لغو شد" : "Payment cancelled"}</h1><p className="mt-4 leading-8">{fa ? "هیچ مبلغی از شما کسر نشد." : "You were not charged."}</p><Link href="/courses" className="mt-6 inline-block text-brand-700 underline">{fa ? "بازگشت به دوره‌ها" : "Back to courses"}</Link></div>;
}

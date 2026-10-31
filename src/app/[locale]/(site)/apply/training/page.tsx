import { redirect } from "next/navigation";
export default async function Page({ params }: { params: Promise<{ locale: string }> }) { redirect((await params).locale === "fa" ? "/free-meta-ads-guide" : "/en/free-meta-ads-guide"); }

import { Link } from "@/i18n/navigation";
export default function NotFound() {
  return <main id="main" className="container-x py-24 text-center"><h1 className="text-3xl font-black">404</h1><p className="mt-4">صفحه پیدا نشد · Page not found</p><Link href="/" className="mt-6 inline-block text-brand-700 underline">NajdiTech</Link></main>;
}

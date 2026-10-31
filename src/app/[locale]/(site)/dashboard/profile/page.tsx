import { userGuard } from "@/lib/auth/guard";
import { ProfilePrivacy } from "@/components/forms/ProfilePrivacy";
import { logoutAction } from "@/server/auth-actions";

const t = {
  fa: { title: "حساب و حریم خصوصی", download: "دانلود همه داده‌های من", deleteTitle: "حذف حساب", deleteBody: "حساب و داده‌های شخصی شما حذف می‌شود و دسترسی به دوره‌ها از بین می‌رود. سوابق مالی (فاکتورها) طبق قانون نگه داشته می‌شوند. این کار قابل بازگشت نیست.", password: "رمز عبور فعلی برای تأیید", deleteBtn: "حذف دائمی حساب", wrong: "رمز عبور درست نیست.", staff: "حساب‌های مدیر از این طریق حذف نمی‌شوند.", logout: "خروج از حساب" },
  en: { title: "Account & privacy", download: "Download all my data", deleteTitle: "Delete account", deleteBody: "Your account and personal data will be deleted and course access will end. Financial records (invoices) are kept as the law requires. This cannot be undone.", password: "Current password to confirm", deleteBtn: "Permanently delete account", wrong: "Incorrect password.", staff: "Admin accounts cannot be deleted this way.", logout: "Log out" },
};

export default async function Profile({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const { locale } = await params;
  const user = await userGuard(locale, "/dashboard/profile");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">{t[locale].title}</h1>
      <p dir="ltr" className="text-sm text-slate-strong">{user.email}</p>
      <ProfilePrivacy t={t[locale]} />
      <form action={logoutAction}><button className="text-sm underline">{t[locale].logout}</button></form>
    </div>
  );
}

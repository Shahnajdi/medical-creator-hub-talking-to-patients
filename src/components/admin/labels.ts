export const adminLabels = {
  fa: {
    title: "پنل مدیریت", overview: "نمای کلی", leads: "لیدها", pipelines: "پایپ‌لاین‌ها", privacy: "درخواست‌های حریم خصوصی", audit: "گزارش رخدادها", site: "مشاهده سایت", logout: "خروج",
    last30: "۳۰ روز گذشته", totalLeads: "کل لیدها", qualified: "لیدهای واجد شرایط", agencyLeads: "لیدهای آژانس", trainingLeads: "لیدهای آموزشی", appointments: "جلسات رزروشده", won: "فرصت‌های موفق", enrollments: "ثبت‌نام دوره", tasksDue: "کارهای سررسید", failedJobs: "خطاهای اتوماسیون", revenue: "درآمد دریافت‌شده (به تفکیک ارز)", sources: "منابع لید", noData: "هنوز داده‌ای ثبت نشده است. با ارسال اولین فرم، آمار اینجا نمایش داده می‌شود.",
    name: "نام", type: "نوع", country: "کشور", company: "کسب‌وکار", score: "امتیاز", qual: "اولویت", date: "تاریخ", search: "جستجو", filter: "اعمال", export: "خروجی CSV", all: "همه",
    agency: "آژانس", training: "آموزش", high: "بالا", medium: "متوسط", nurture: "پیگیری بلندمدت", not_qualified: "فعلاً واجد شرایط نیست",
    timeline: "تاریخچه فعالیت", consents: "رضایت‌ها", addNote: "افزودن یادداشت", save: "ذخیره", moveTo: "انتقال به", granted: "داده شده", withdrawn: "لغو شده", denied: "داده نشده",
    reqType: "نوع درخواست", status: "وضعیت", due: "مهلت", exportData: "دانلود داده‌ها (JSON)", erase: "حذف کامل داده‌ها", eraseConfirm: "این کار غیرقابل بازگشت است. داده‌های این شخص حذف می‌شود (به‌جز سوابق مالی که قانوناً باید نگه داشته شوند). ادامه می‌دهید؟", complete: "علامت‌گذاری به‌عنوان انجام‌شده", reject: "رد درخواست",
    action: "رخداد", entity: "موجودیت", actor: "انجام‌دهنده",
  },
  en: {
    title: "Admin", overview: "Overview", leads: "Leads", pipelines: "Pipelines", privacy: "Privacy requests", audit: "Audit log", site: "View site", logout: "Log out",
    last30: "Last 30 days", totalLeads: "Total leads", qualified: "Qualified leads", agencyLeads: "Agency leads", trainingLeads: "Training leads", appointments: "Appointments booked", won: "Opportunities won", enrollments: "Course enrollments", tasksDue: "Tasks due", failedJobs: "Automation failures", revenue: "Revenue collected (per currency)", sources: "Lead sources", noData: "No data yet. Metrics appear here once the first form is submitted.",
    name: "Name", type: "Type", country: "Country", company: "Business", score: "Score", qual: "Priority", date: "Date", search: "Search", filter: "Apply", export: "Export CSV", all: "All",
    agency: "Agency", training: "Training", high: "High", medium: "Medium", nurture: "Nurture", not_qualified: "Not currently qualified",
    timeline: "Activity timeline", consents: "Consents", addNote: "Add note", save: "Save", moveTo: "Move to", granted: "Granted", withdrawn: "Withdrawn", denied: "Not granted",
    reqType: "Request type", status: "Status", due: "Due", exportData: "Download data (JSON)", erase: "Erase all data", eraseConfirm: "This cannot be undone. This person's data will be deleted (except financial records the law requires us to keep). Continue?", complete: "Mark completed", reject: "Reject",
    action: "Action", entity: "Entity", actor: "Actor",
  },
} as const;
export type AdminLabels = (typeof adminLabels)["fa"] | (typeof adminLabels)["en"];

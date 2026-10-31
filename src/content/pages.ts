export const services = {
  "meta-ads": {
    fa: { title: "مدیریت تبلیغات متا", lead: "طراحی، اجرا و بهینه‌سازی کمپین‌های اینستاگرام و فیسبوک با تمرکز بر جذب مشتری واقعی، نه فقط لایک و بازدید.", items: ["تحلیل کسب‌وکار و مخاطب هدف", "استراتژی کمپین و ساختار حساب تبلیغاتی", "تنظیم پیکسل و Conversions API برای اندازه‌گیری دقیق", "تست مداوم محتوای تبلیغ و مخاطبان", "صفحه فرود اختصاصی (در صورت نیاز)", "گزارش دوره‌ای شفاف"] },
    en: { title: "Meta Ads management", lead: "Strategy, launch and optimisation of Instagram and Facebook campaigns focused on real customers — not just likes and views.", items: ["Business and audience analysis", "Campaign strategy and ad-account structure", "Pixel and Conversions API setup for accurate measurement", "Continuous creative and audience testing", "Dedicated landing page (if needed)", "Clear periodic reporting"] },
  },
  "lead-generation": {
    fa: { title: "لیدجنریشن و بهینه‌سازی تبدیل", lead: "مسیر کامل از تبلیغ تا فرم و پیگیری، طراحی‌شده برای اینکه درخواست‌های بیشتری به مشتری تبدیل شوند.", items: ["طراحی پیشنهاد و آهنربای جذب (Lead Magnet)", "فرم‌های کوتاه و موبایل‌محور", "مسیر پیگیری سریع لیدها", "آزمایش پیام و صفحه بر اساس داده"] },
    en: { title: "Lead generation & conversion optimisation", lead: "A full path from ad to form to follow-up, designed so more inquiries become customers.", items: ["Offer and lead-magnet design", "Short, mobile-first forms", "Fast lead follow-up flows", "Data-driven message and page testing"] },
  },
  "crm-automation": {
    fa: { title: "CRM و اتوماسیون بازاریابی", lead: "همه درخواست‌ها در یک جا، با پیگیری خودکار و قابل‌اعتماد — همراه با رعایت رضایت مخاطب.", items: ["راه‌اندازی CRM و پایپ‌لاین فروش", "پیام‌های خودکار تأیید و پیگیری", "یادآوری و تخصیص وظایف به تیم فروش", "گزارش منبع لید و نرخ تبدیل"] },
    en: { title: "CRM & marketing automation", lead: "Every inquiry in one place, with reliable automated follow-up — and full respect for consent.", items: ["CRM and sales pipeline setup", "Automated confirmation and follow-up messages", "Reminders and task assignment for sales", "Lead-source and conversion reporting"] },
  },
} as const;
export type ServiceSlug = keyof typeof services;

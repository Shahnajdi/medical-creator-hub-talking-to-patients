import { Biz } from "@/components/legal/LegalPage";
import { Link } from "@/i18n/navigation";
import type { RetentionConfig } from "@/lib/privacy/retention-config";
import { MIN_AGE, PRIVACY_REQUEST_SLA_DAYS } from "@/lib/legal/config";

export function PrivacyFa({ R }: { R: RetentionConfig }) {
  return (
    <>
      <p>این سیاست توضیح می‌دهد NajdiTech چه اطلاعاتی از شما جمع‌آوری می‌کند، چرا، چه مدت نگه می‌دارد و چه حقوقی دارید. ما فقط اطلاعاتی را جمع می‌کنیم که برای پاسخ به درخواست شما و ارائه خدمات لازم است.</p>
      <h2>۱. مسئول پردازش داده‌ها</h2>
      <p><Biz field="entityName" /> — نشانی: <Biz field="address" /> — ایمیل حریم خصوصی: <Biz field="privacyEmail" /></p>
      <h2>۲. چه اطلاعاتی جمع می‌کنیم</h2>
      <ul>
        <li><strong>فرم‌های درخواست:</strong> نام، ایمیل و/یا شماره واتساپ، کشور محل زندگی؛ در فرم کسب‌وکار همچنین نام کسب‌وکار، حوزه فعالیت، وب‌سایت یا اینستاگرام، وضعیت تبلیغات، هدف، بازه بودجه و روش تماس ترجیحی.</li>
        <li><strong>رضایت‌ها:</strong> اینکه کدام گزینه‌ها را تأیید کرده‌اید، نسخه سند، زمان، و یک شناسه هش‌شده (غیرقابل بازگشت) از آدرس IP به‌عنوان مدرک.</li>
        <li><strong>حساب کاربری و خرید:</strong> نام، ایمیل، رمز عبور (فقط به‌صورت هش‌شده)، سفارش‌ها و اطلاعات صورتحساب. اطلاعات کارت بانکی را ما دریافت یا ذخیره نمی‌کنیم؛ پرداخت در صفحه امن ارائه‌دهنده پرداخت انجام می‌شود.</li>
        <li><strong>آمار بازدید:</strong> فقط اگر در بنر کوکی اجازه دهید — صفحات بازدیدشده، منبع ورود (UTM) و رویدادهایی مثل کلیک روی دکمه‌ها.</li>
      </ul>
      <p>ما اطلاعات حساس (مثل اطلاعات سلامت، مذهب یا مدارک هویتی) درخواست نمی‌کنیم. لطفاً چنین اطلاعاتی را در فرم‌ها وارد نکنید.</p>
      <h2>۳. هدف و مبنای قانونی پردازش</h2>
      <table><thead><tr><th>هدف</th><th>مبنای قانونی</th></tr></thead><tbody>
        <tr><td>پاسخ به درخواست، تماس و ارائه پیشنهاد</td><td>اقدامات پیش از قرارداد به درخواست شما</td></tr>
        <tr><td>ارائه خدمات، دوره‌ها و پرداخت</td><td>اجرای قرارداد</td></tr>
        <tr><td>ایمیل یا پیام تبلیغاتی و آموزشی</td><td>رضایت جداگانه شما (هر زمان قابل لغو)</td></tr>
        <tr><td>آمار و تبلیغات (کوکی‌های غیرضروری)</td><td>رضایت شما</td></tr>
        <tr><td>امنیت، جلوگیری از سوءاستفاده، اولویت‌بندی پیگیری درخواست‌ها</td><td>منافع مشروع</td></tr>
        <tr><td>نگهداری سوابق مالی و فاکتورها</td><td>تکلیف قانونی</td></tr>
      </tbody></table>
      <h3>اولویت‌بندی درخواست‌ها</h3>
      <p>به پاسخ‌های فرم کسب‌وکار امتیازی داده می‌شود تا تیم فروش بداند با کدام درخواست زودتر تماس بگیرد. این امتیاز هیچ تصمیم خودکاری درباره رد شما نمی‌گیرد، به ملیت شما بستگی ندارد و همه درخواست‌ها توسط انسان دیده می‌شوند.</p>
      <h2>۴. هوش مصنوعی و داده‌های شما</h2>
      <p>ما از داده‌های شما برای آموزش مدل‌های هوش مصنوعی استفاده نمی‌کنیم و به ارائه‌دهندگانمان هم چنین اجازه‌ای نمی‌دهیم. اگر دستیار هوش مصنوعی اختیاری فعال باشد، فقط برای پاسخ به همان گفت‌وگو و تحت قرارداد پردازش داده استفاده می‌شود. جزئیات در <Link href="/ai-disclosure">صفحه استفاده از هوش مصنوعی</Link>.</p>
      <h2>۵. با چه کسانی به اشتراک گذاشته می‌شود</h2>
      <p>اطلاعات شما را نمی‌فروشیم. فقط با ارائه‌دهندگان خدماتی که برای اجرای سایت لازم‌اند (میزبانی، ایمیل، پرداخت و — فقط با رضایت شما — ابزارهای آماری و تبلیغاتی) به اشتراک گذاشته می‌شود. فهرست کامل در <Link href="/subprocessors">صفحه پردازشگرهای فرعی</Link> آمده است. برخی از این ارائه‌دهندگان خارج از کشور شما (مثلاً در آمریکا) هستند؛ این انتقال‌ها بر اساس تضمین‌های مناسب، مانند بندهای قراردادی استاندارد، انجام می‌شود.</p>
      <h2>۶. مدت نگهداری</h2>
      <ul>
        <li>درخواست‌هایی که به همکاری یا خرید منجر نشده‌اند: حداکثر {R.inactiveLeadDays} روز پس از آخرین تعامل، سپس به‌طور خودکار حذف می‌شوند.</li>
        <li>رویدادهای آماری: {R.trackingEventDays} روز.</li>
        <li>سوابق پیام‌های ارسالی: {R.messageLogDays} روز.</li>
        <li>سفارش‌ها و فاکتورها: به مدتی که قوانین مالیاتی و تجاری الزام می‌کند.</li>
        <li>اگر از دریافت پیام تبلیغاتی انصراف دهید یا درخواست حذف بدهید، یک هش غیرقابل بازگشت از ایمیل یا شماره‌تان نگه داشته می‌شود تا دوباره برایتان پیام تبلیغاتی ارسال نشود.</li>
      </ul>
      <h2>۷. حقوق شما</h2>
      <p>بسته به محل زندگی‌تان (مثلاً بر اساس GDPR در اروپا، UK GDPR در بریتانیا یا قانون KVKK در ترکیه) حق دارید: به داده‌هایتان دسترسی داشته باشید و نسخه‌ای از آن بگیرید، اصلاح یا حذفشان را بخواهید، به پردازش اعتراض کنید، رضایتتان را هر زمان پس بگیرید و به مرجع نظارتی شکایت کنید. برای ثبت درخواست از <Link href="/privacy-request">فرم درخواست داده‌ها</Link> استفاده کنید؛ حداکثر ظرف {PRIVACY_REQUEST_SLA_DAYS} روز پاسخ می‌دهیم.</p>
      <p>برای لغو دریافت ایمیل‌های تبلیغاتی، روی لینک «لغو اشتراک» پایین هر ایمیل بزنید.</p>
      <h2>۸. کودکان</h2>
      <p>خدمات و فرم‌های ما برای افراد زیر {MIN_AGE} سال نیست و آگاهانه از آن‌ها اطلاعات جمع نمی‌کنیم. اگر متوجه شوید فرد زیر {MIN_AGE} سال اطلاعاتی برای ما فرستاده، با ما تماس بگیرید تا آن را حذف کنیم.</p>
      <h2>۹. امنیت</h2>
      <p>ارتباط با سایت رمزگذاری‌شده (HTTPS) است، رمزهای عبور فقط به‌صورت هش‌شده ذخیره می‌شوند و دسترسی کارکنان بر اساس نقش محدود و ثبت می‌شود. هیچ سیستمی صددرصد امن نیست؛ در صورت بروز رخداد امنیتی طبق قانون اطلاع‌رسانی می‌کنیم.</p>
      <h2>۱۰. کوکی‌ها</h2>
      <p>جزئیات در <Link href="/cookies">سیاست کوکی</Link>.</p>
      <h2>۱۱. تغییرات</h2>
      <p>اگر این سیاست به‌طور اساسی تغییر کند، تاریخ بالای صفحه به‌روز می‌شود و در صورت لزوم دوباره از شما رضایت می‌گیریم.</p>
    </>
  );
}

export function PrivacyEn({ R }: { R: RetentionConfig }) {
  return (
    <>
      <p>This policy explains what information NajdiTech collects, why, how long we keep it and what rights you have. We only collect what we need to respond to your request and provide our services.</p>
      <h2>1. Controller</h2>
      <p><Biz field="entityName" /> — Address: <Biz field="address" /> — Privacy contact: <Biz field="privacyEmail" /></p>
      <h2>2. What we collect</h2>
      <ul>
        <li><strong>Request forms:</strong> name, email and/or WhatsApp number, country of residence; on the business form also business name, industry, website or Instagram, advertising status, goal, budget range and preferred contact method.</li>
        <li><strong>Consents:</strong> which options you confirmed, the document version, the time, and a keyed, irreversible hash of your IP address as evidence.</li>
        <li><strong>Accounts and purchases:</strong> name, email, password (stored only as a hash), orders and billing details. We never receive or store card numbers; payment happens on the payment provider&apos;s secure page.</li>
        <li><strong>Analytics:</strong> only if you allow it in the cookie banner — pages visited, referral source (UTM) and events such as button clicks.</li>
      </ul>
      <p>We do not ask for sensitive data (such as health, religion or identity documents). Please do not enter it in our forms.</p>
      <h2>3. Purposes and legal bases</h2>
      <table><thead><tr><th>Purpose</th><th>Legal basis</th></tr></thead><tbody>
        <tr><td>Responding to your request, contacting you, making an offer</td><td>Steps prior to a contract at your request</td></tr>
        <tr><td>Providing services, courses and payments</td><td>Performance of a contract</td></tr>
        <tr><td>Marketing and educational email/messages</td><td>Your separate consent (withdraw anytime)</td></tr>
        <tr><td>Analytics and advertising cookies</td><td>Your consent</td></tr>
        <tr><td>Security, abuse prevention, prioritising follow-up</td><td>Legitimate interests</td></tr>
        <tr><td>Keeping financial records and invoices</td><td>Legal obligation</td></tr>
      </tbody></table>
      <h3>Lead prioritisation</h3>
      <p>Answers on the business form receive a score so our sales team knows whom to contact first. The score makes no automated decision to reject you, does not depend on nationality, and every request is seen by a person.</p>
      <h2>4. AI and your data</h2>
      <p>We do not use your data to train AI models and do not permit our providers to do so. If the optional AI assistant is enabled, it is used only to answer that conversation, under a data processing agreement. See <Link href="/ai-disclosure">Use of AI</Link>.</p>
      <h2>5. Who we share it with</h2>
      <p>We do not sell your data. We share it only with service providers needed to run the site (hosting, email, payments and — only with your consent — analytics and advertising tools). The full list is on our <Link href="/subprocessors">subprocessors page</Link>. Some providers are outside your country (e.g. in the United States); these transfers rely on appropriate safeguards such as Standard Contractual Clauses.</p>
      <h2>6. Retention</h2>
      <ul>
        <li>Requests that did not lead to a purchase or engagement: at most {R.inactiveLeadDays} days after the last interaction, then deleted automatically.</li>
        <li>Analytics events: {R.trackingEventDays} days.</li>
        <li>Logs of messages sent: {R.messageLogDays} days.</li>
        <li>Orders and invoices: as long as tax and commercial law requires.</li>
        <li>If you unsubscribe or ask for deletion, we keep an irreversible hash of your email/number so you are not sent marketing again.</li>
      </ul>
      <h2>7. Your rights</h2>
      <p>Depending on where you live (for example under the GDPR, UK GDPR or Türkiye&apos;s KVKK) you may access and obtain a copy of your data, ask for correction or deletion, object to processing, withdraw consent at any time, and complain to a supervisory authority. Use our <Link href="/privacy-request">data request form</Link>; we respond within {PRIVACY_REQUEST_SLA_DAYS} days.</p>
      <p>To stop marketing emails, use the &quot;Unsubscribe&quot; link at the bottom of any email.</p>
      <h2>8. Children</h2>
      <p>Our services and forms are not intended for anyone under {MIN_AGE}, and we do not knowingly collect their data. If you believe someone under {MIN_AGE} has sent us data, contact us and we will delete it.</p>
      <h2>9. Security</h2>
      <p>Connections are encrypted (HTTPS), passwords are stored only as hashes, and staff access is role-restricted and logged. No system is perfectly secure; we will notify you of incidents as the law requires.</p>
      <h2>10. Cookies</h2>
      <p>See our <Link href="/cookies">Cookie Policy</Link>.</p>
      <h2>11. Changes</h2>
      <p>If this policy changes materially we will update the date above and, where required, ask for your consent again.</p>
    </>
  );
}

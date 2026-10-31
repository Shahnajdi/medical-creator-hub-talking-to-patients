import { Biz } from "@/components/legal/LegalPage";
import { Link } from "@/i18n/navigation";

type L = "fa" | "en";

export function CookiesDoc({ locale }: { locale: L }) {
  const rows = [
    ["nt_consent", locale === "fa" ? "ضروری — ذخیره انتخاب شما درباره کوکی‌ها" : "Necessary — stores your cookie choices", locale === "fa" ? "۶ ماه" : "6 months"],
    ["nt_session", locale === "fa" ? "ضروری — نگه‌داشتن ورود به حساب" : "Necessary — keeps you logged in", locale === "fa" ? "۱۴ روز" : "14 days"],
    ["NEXT_LOCALE", locale === "fa" ? "ضروری — زبان انتخابی" : "Necessary — selected language", locale === "fa" ? "نشست" : "Session"],
    ["_ga, _ga_*", locale === "fa" ? "آماری — Google Analytics (فقط با رضایت)" : "Analytics — Google Analytics (consent only)", locale === "fa" ? "تا ۲ سال" : "Up to 2 years"],
    ["_fbp", locale === "fa" ? "تبلیغاتی — Meta Pixel (فقط با رضایت)" : "Advertising — Meta Pixel (consent only)", locale === "fa" ? "۳ ماه" : "3 months"],
  ];
  return (
    <>
      <p>{locale === "fa"
        ? "کوکی‌های ضروری همیشه فعال‌اند. کوکی‌ها و اسکریپت‌های آماری و تبلیغاتی تا وقتی در بنر کوکی اجازه ندهید بارگذاری نمی‌شوند. اگر مرورگرتان سیگنال Global Privacy Control بفرستد، کوکی‌های تبلیغاتی غیرفعال می‌مانند."
        : "Necessary cookies are always on. Analytics and advertising cookies and scripts are not loaded until you allow them in the cookie banner. If your browser sends a Global Privacy Control signal, advertising cookies stay off."}</p>
      <table><thead><tr><th>{locale === "fa" ? "نام" : "Name"}</th><th>{locale === "fa" ? "هدف" : "Purpose"}</th><th>{locale === "fa" ? "مدت" : "Duration"}</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r[0]}><td dir="ltr">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody></table>
      <p>{locale === "fa" ? "برای تغییر انتخاب‌هایتان در هر زمان، روی «تنظیمات کوکی» در پایین صفحه بزنید. پس‌گرفتن رضایت، اسکریپت‌های بارگذاری‌شده را متوقف می‌کند." : "To change your choices at any time, click “Cookie settings” in the footer. Withdrawing consent stops scripts that were loaded."}</p>
    </>
  );
}

export function RefundDoc({ locale }: { locale: L }) {
  return locale === "fa" ? (
    <>
      <h2>دوره‌ها و محصولات آموزشی</h2>
      <p>مهلت بازپرداخت هر محصول در صفحه پرداخت، قبل از خرید، نمایش داده می‌شود (به‌طور پیش‌فرض ۱۴ روز از تاریخ خرید). در این مهلت می‌توانید با ارسال ایمیل به <Biz field="email" /> درخواست بازپرداخت کامل بدهید. بازپرداخت از همان روش پرداخت اولیه انجام می‌شود و دسترسی به دوره پس از بازپرداخت قطع می‌شود.</p>
      <h2>اشتراک‌ها</h2>
      <p>می‌توانید اشتراک را هر زمان از داشبورد لغو کنید؛ تا پایان دوره‌ای که پرداخت کرده‌اید دسترسی دارید و تمدید بعدی انجام نمی‌شود. برای دوره‌های جزئی بازپرداختی انجام نمی‌شود، مگر اینکه قانون الزام کند.</p>
      <h2>خدمات تبلیغاتی</h2>
      <p>شرایط بازپرداخت خدمات آژانس در قرارداد مکتوب همان همکاری تعیین می‌شود. بودجه‌ای که مستقیماً به متا یا پلتفرم‌های دیگر پرداخت شده، توسط ما قابل بازپرداخت نیست.</p>
      <h2>انتقال بانکی</h2>
      <p>برای پرداخت‌های انتقال بانکی، بازپرداخت به همان حساب مبدأ انجام می‌شود. ممکن است کارمزد بانکی‌ای که بانک‌ها کسر می‌کنند خارج از کنترل ما باشد؛ ما هیچ کارمزدی اضافه نمی‌کنیم.</p>
      <p>این سیاست حقوق قانونی شما به‌عنوان مصرف‌کننده را محدود نمی‌کند.</p>
    </>
  ) : (
    <>
      <h2>Courses and learning products</h2>
      <p>Each product&apos;s refund window is shown at checkout before you buy (by default 14 days from purchase). Within that window you can request a full refund by emailing <Biz field="email" />. Refunds go back to the original payment method, and course access ends after a refund.</p>
      <h2>Subscriptions</h2>
      <p>You can cancel anytime from your dashboard; you keep access until the end of the period you paid for and will not be renewed. Partial periods are not refunded unless the law requires it.</p>
      <h2>Advertising services</h2>
      <p>Refund terms for agency services are set in the written agreement for that engagement. Ad spend paid directly to Meta or other platforms cannot be refunded by us.</p>
      <h2>Bank transfers</h2>
      <p>Bank-transfer refunds are returned to the originating account. Fees deducted by banks may be outside our control; we add no fees of our own.</p>
      <p>This policy does not limit your statutory consumer rights.</p>
    </>
  );
}

export function CopyrightDoc({ locale }: { locale: L }) {
  return locale === "fa" ? (
    <>
      <p>ما به حقوق مالکیت فکری احترام می‌گذاریم و فقط از تصاویر، فونت‌ها، ویدیوها و لوگوهایی استفاده می‌کنیم که مجوز یا اجازه استفاده از آن‌ها را داریم. لوگوی مشتریان فقط با اجازه کتبی آن‌ها نمایش داده می‌شود.</p>
      <h2>گزارش نقض کپی‌رایت</h2>
      <p>اگر فکر می‌کنید محتوایی در این سایت حق شما را نقض می‌کند، این اطلاعات را به <Biz field="email" /> بفرستید: مشخصات اثر، آدرس دقیق محتوای ناقض، اطلاعات تماس شما، اظهار حسن نیت و اظهار صحت اطلاعات با امضای شما.</p>
      <h2>نماینده تعیین‌شده DMCA</h2>
      <p><Biz field="dmcaAgent" /></p>
    </>
  ) : (
    <>
      <p>We respect intellectual property and only use images, fonts, videos and logos we are licensed or permitted to use. Client logos are shown only with their written permission.</p>
      <h2>Reporting infringement</h2>
      <p>If you believe content on this site infringes your rights, email <Biz field="email" /> with: identification of the work, the exact URL of the infringing material, your contact details, a good-faith statement, and a statement that the information is accurate, with your signature.</p>
      <h2>DMCA designated agent</h2>
      <p><Biz field="dmcaAgent" /></p>
    </>
  );
}

export function AccessibilityDoc({ locale }: { locale: L }) {
  return locale === "fa" ? (
    <>
      <p>هدف ما رعایت استاندارد WCAG 2.1 سطح AA است. سایت با صفحه‌کلید قابل استفاده است، فوکوس به‌وضوح نمایش داده می‌شود، تصاویر متن جایگزین دارند، رنگ‌ها کنتراست کافی دارند و انیمیشن‌ها با تنظیم «کاهش حرکت» سیستم شما متوقف می‌شوند.</p>
      <p>اگر مانعی برای دسترسی دیدید، به <Biz field="email" /> اطلاع دهید تا رفعش کنیم.</p>
    </>
  ) : (
    <>
      <p>We aim to meet WCAG 2.1 level AA. The site works with a keyboard, focus is clearly visible, images have text alternatives, colours meet contrast requirements and animations stop when your system requests reduced motion.</p>
      <p>If you find an accessibility barrier, tell us at <Biz field="email" /> and we will fix it.</p>
    </>
  );
}

export function AiDoc({ locale }: { locale: L }) {
  return locale === "fa" ? (
    <>
      <h2>برچسب‌گذاری محتوا</h2>
      <p>هر مقاله یا محتوایی که با کمک هوش مصنوعی تهیه شده باشد، به‌وضوح با برچسب «تهیه‌شده با کمک هوش مصنوعی» مشخص می‌شود و پیش از انتشار توسط انسان بازبینی می‌شود. پاسخ‌های دستیار هوش مصنوعی (در صورت فعال بودن) همیشه به‌عنوان پاسخ ماشینی مشخص می‌شوند و می‌توانید درخواست گفت‌وگو با انسان بدهید.</p>
      <h2>محدودیت‌ها</h2>
      <p>دستیار هوش مصنوعی قیمت اعلام نمی‌کند، نتیجه یا درآمد وعده نمی‌دهد، اطلاعات پرداخت دریافت نمی‌کند و تعهد تجاری نمی‌دهد.</p>
      <h2>آموزش مدل</h2>
      <p>داده‌های شما برای آموزش مدل‌های هوش مصنوعی — نه توسط ما و نه توسط ارائه‌دهندگان ما — استفاده نمی‌شود.</p>
      <p>جزئیات بیشتر در <Link href="/privacy">سیاست حریم خصوصی</Link>.</p>
    </>
  ) : (
    <>
      <h2>Content labelling</h2>
      <p>Any article or content created with AI assistance is clearly labelled “Created with AI assistance” and is reviewed by a human before publication. Replies from the AI assistant (when enabled) are always marked as machine-generated, and you can ask to talk to a person.</p>
      <h2>Limits</h2>
      <p>The AI assistant does not quote prices, promise results or income, accept payment details or make commercial commitments.</p>
      <h2>Model training</h2>
      <p>Your data is not used to train AI models — not by us and not by our providers.</p>
      <p>More in our <Link href="/privacy">Privacy Policy</Link>.</p>
    </>
  );
}

export function ImprintDoc({ locale }: { locale: L }) {
  const rows: [string, string, Parameters<typeof Biz>[0]["field"]][] = [
    ["نام حقوقی", "Legal name", "entityName"],
    ["نشانی", "Address", "address"],
    ["شماره ثبت", "Registration number", "registration"],
    ["شناسه مالیاتی", "Tax ID", "taxId"],
    ["ایمیل", "Email", "email"],
    ["تلفن", "Phone", "phone"],
  ];
  return (
    <table><tbody>{rows.map(([fa, en, f]) => <tr key={f}><th>{locale === "fa" ? fa : en}</th><td><Biz field={f} /></td></tr>)}</tbody></table>
  );
}

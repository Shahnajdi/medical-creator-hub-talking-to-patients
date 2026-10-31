import { Biz } from "@/components/legal/LegalPage";
import { Link } from "@/i18n/navigation";
import { MIN_AGE } from "@/lib/legal/config";

export function TermsFa() {
  return (
    <>
      <p>این شرایط، رابطه شما با <Biz field="entityName" /> (با نام تجاری NajdiTech) را هنگام استفاده از این وب‌سایت، خدمات تبلیغاتی و دوره‌های آموزشی تعیین می‌کند. با ارسال فرم، ساخت حساب یا خرید، این شرایط را می‌پذیرید و پذیرش شما همراه با نسخه سند و زمان آن ثبت می‌شود.</p>
      <h2>۱. شرایط استفاده</h2>
      <p>برای ارسال فرم، ساخت حساب یا خرید باید حداقل {MIN_AGE} سال سن داشته باشید.</p>
      <h2>۲. خدمات تبلیغاتی</h2>
      <p>دامنه کار، هزینه و مدت هر همکاری پیش از شروع به‌صورت مکتوب توافق می‌شود. بودجه تبلیغات مستقیماً به پلتفرم تبلیغاتی (مثلاً متا) پرداخت می‌شود و جدا از هزینه خدمات ماست. <strong>ما هیچ نتیجه مشخصی — از جمله تعداد لید، فروش یا بازگشت سرمایه — را تضمین نمی‌کنیم.</strong> عملکرد تبلیغات به عوامل خارج از کنترل ما، از جمله قوانین و الگوریتم‌های پلتفرم‌ها، بستگی دارد.</p>
      <h2>۳. دوره‌های آموزشی</h2>
      <p>با خرید دوره، مجوز شخصی، غیرانحصاری و غیرقابل انتقال برای استفاده از محتوای آن دریافت می‌کنید. انتشار، فروش یا اشتراک‌گذاری حساب و محتوا مجاز نیست. دوره‌ها مهارت آموزش می‌دهند و <strong>درآمد، استخدام یا جذب مشتری را تضمین نمی‌کنند</strong>. گواهی پایان دوره توسط NajdiTech صادر می‌شود و مدرک دانشگاهی یا گواهی معتبر شخص ثالث نیست.</p>
      <h2>۴. قیمت و پرداخت</h2>
      <p>قیمت نهایی، ارز و هر مالیاتی پیش از پرداخت کامل نمایش داده می‌شود و هیچ هزینه پنهانی بعداً اضافه نمی‌شود. پرداخت از طریق ارائه‌دهنده پرداخت انجام می‌شود و ما اطلاعات کارت شما را ذخیره نمی‌کنیم. امکان پرداخت آنلاین ممکن است در برخی کشورها، بسته به قوانین و ارائه‌دهنده پرداخت، در دسترس نباشد.</p>
      <h2>۵. اشتراک‌ها و تمدید خودکار</h2>
      <p>اگر محصولی به‌صورت اشتراک ماهانه یا سالانه فروخته شود، این موضوع، مبلغ تمدید و دوره آن قبل از پرداخت به‌وضوح اعلام می‌شود. می‌توانید هر زمان از بخش «صورتحساب» در داشبورد با یک کلیک اشتراک را لغو کنید؛ لغو از پایان دوره فعلی اعمال می‌شود و دیگر هزینه‌ای دریافت نمی‌شود.</p>
      <h2>۶. بازپرداخت</h2>
      <p>شرایط بازپرداخت در <Link href="/refund-policy">سیاست بازپرداخت</Link> آمده است و حقوق قانونی شما به‌عنوان مصرف‌کننده را محدود نمی‌کند.</p>
      <h2>۷. استفاده مجاز</h2>
      <p>نباید از سایت برای فعالیت غیرقانونی، ارسال هرزنامه، تلاش برای نفوذ یا اختلال، یا جعل هویت استفاده کنید.</p>
      <h2>۸. مالکیت فکری</h2>
      <p>محتوای سایت و دوره‌ها متعلق به NajdiTech یا صاحبان مجوز آن است. برای گزارش نقض کپی‌رایت به <Link href="/copyright">این صفحه</Link> مراجعه کنید.</p>
      <h2>۹. دسترس‌پذیری سرویس</h2>
      <p>تلاش می‌کنیم سایت و پلتفرم آموزشی همیشه در دسترس باشند، اما دسترسی بدون وقفه یا بدون خطا را تضمین نمی‌کنیم. ممکن است برای نگهداری یا به دلایل خارج از کنترل ما، سرویس موقتاً در دسترس نباشد. هیچ تعهد سطح خدمات (SLA) وجود ندارد، مگر اینکه به‌صورت مکتوب توافق شده باشد.</p>
      <h2>۱۰. محدودیت مسئولیت</h2>
      <p>در حداکثر حد مجاز قانون، مسئولیت ما در قبال هر ادعا محدود به مبلغی است که برای همان خدمت یا محصول پرداخت کرده‌اید. هیچ بخشی از این شرایط مسئولیتی را که طبق قانون قابل محدودکردن نیست، محدود نمی‌کند.</p>
      <h2>۱۱. قانون حاکم</h2>
      <p>این شرایط تابع قوانین جمهوری ترکیه است، بدون آنکه حمایت‌های قانونی اجباری کشور محل اقامت شما به‌عنوان مصرف‌کننده را از بین ببرد.</p>
      <h2>۱۲. تماس</h2>
      <p><Biz field="entityName" /> — <Biz field="address" /> — <Biz field="email" /></p>
    </>
  );
}

export function TermsEn() {
  return (
    <>
      <p>These terms govern your relationship with <Biz field="entityName" /> (trading as NajdiTech) when you use this website, our advertising services and our courses. By submitting a form, creating an account or buying, you accept these terms; your acceptance is recorded with the document version and time.</p>
      <h2>1. Eligibility</h2>
      <p>You must be at least {MIN_AGE} to submit forms, create an account or buy.</p>
      <h2>2. Advertising services</h2>
      <p>Scope, fees and duration of any engagement are agreed in writing before work starts. Ad spend is paid directly to the ad platform (e.g. Meta) and is separate from our fee. <strong>We do not guarantee any specific result — including number of leads, sales or return on ad spend.</strong> Performance depends on factors outside our control, including platform rules and algorithms.</p>
      <h2>3. Courses</h2>
      <p>Buying a course gives you a personal, non-exclusive, non-transferable licence to use its content. Republishing, reselling or sharing accounts or content is not allowed. Courses teach skills and <strong>do not guarantee income, employment or clients</strong>. Certificates of completion are issued by NajdiTech and are not academic degrees or third-party accreditations.</p>
      <h2>4. Prices and payment</h2>
      <p>The final price, currency and any tax are shown in full before you pay; no hidden fees are added later. Payments are processed by a payment provider and we never store your card details. Online payment may be unavailable in some countries depending on law and provider rules.</p>
      <h2>5. Subscriptions and automatic renewal</h2>
      <p>If a product is sold as a monthly or yearly subscription, that fact, the renewal amount and the renewal period are clearly stated before you pay. You can cancel anytime with one click under Billing in your dashboard; cancellation takes effect at the end of the current period and you will not be charged again.</p>
      <h2>6. Refunds</h2>
      <p>See our <Link href="/refund-policy">Refund Policy</Link>. It does not limit your statutory consumer rights.</p>
      <h2>7. Acceptable use</h2>
      <p>You may not use the site for illegal activity, spam, attempts to breach or disrupt it, or impersonation.</p>
      <h2>8. Intellectual property</h2>
      <p>Site and course content belongs to NajdiTech or its licensors. To report copyright infringement see <Link href="/copyright">this page</Link>.</p>
      <h2>9. Availability</h2>
      <p>We work to keep the website and learning platform available, but we do not guarantee uninterrupted or error-free access. The service may be temporarily unavailable for maintenance or reasons beyond our control. There is no service-level agreement (SLA) unless agreed in writing.</p>
      <h2>10. Limitation of liability</h2>
      <p>To the maximum extent permitted by law, our liability for any claim is limited to the amount you paid for the relevant service or product. Nothing in these terms limits liability that cannot be limited by law.</p>
      <h2>11. Governing law</h2>
      <p>These terms are governed by the laws of the Republic of Türkiye, without depriving you of the mandatory consumer protections of your country of residence.</p>
      <h2>12. Contact</h2>
      <p><Biz field="entityName" /> — <Biz field="address" /> — <Biz field="email" /></p>
    </>
  );
}

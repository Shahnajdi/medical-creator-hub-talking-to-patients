import { setRequestLocale } from "next-intl/server";
import { ArrowLeft, ArrowRight, BarChart3, Briefcase, CheckCircle2, GraduationCap, LineChart, MessageSquare, Target, Users, Workflow } from "lucide-react";
import { homeContent } from "@/content/home";
import { faqsByCategory, founderVideo, publishedCaseStudies, publishedTestimonials } from "@/lib/content";
import { Section } from "@/components/ui/Section";
import { Faq } from "@/components/ui/Faq";
import { Link } from "@/i18n/navigation";
import { TrackedLink } from "@/components/home/TrackedLink";

export const dynamic = "force-dynamic";

const serviceIcons = [Target, Users, Workflow, LineChart, BarChart3, MessageSquare];

export default async function Home({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = homeContent[locale];
  const Arrow = locale === "fa" ? ArrowLeft : ArrowRight;
  const [cases, testimonials, faqs, video] = await Promise.all([publishedCaseStudies(3), publishedTestimonials(), faqsByCategory(locale), founderVideo()]);

  return (
    <>
      {/* 1 — Hero */}
      <section className="on-dark relative overflow-hidden bg-ink text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="drift absolute -top-32 start-1/3 size-[36rem] rounded-full bg-meta/25 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.04)_1px,transparent_1px)] bg-[size:56px_56px]" />
        </div>
        <div className="container-x relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.25fr_1fr]">
          <div className="reveal">
            <p className="eyebrow">{c.hero.eyebrow}</p>
            <h1 className="mt-4 text-4xl font-black leading-[1.35] tracking-tight sm:text-5xl lg:text-6xl lg:leading-[1.3]">{c.hero.title}</h1>
            <p className="mt-6 max-w-xl text-lg leading-9 text-white/80">{c.hero.subtitle}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <TrackedLink event="agency_cta_click" href="/free-audit" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-lime px-6 py-3 text-center font-bold text-ink hover:brightness-95">
                {c.hero.primary} <Arrow aria-hidden className="size-4 shrink-0" />
              </TrackedLink>
              <TrackedLink event="training_cta_click" href="/free-meta-ads-guide" className="inline-flex min-h-13 items-center justify-center rounded-full px-6 py-3 text-center font-semibold text-white ring-1 ring-white/30 hover:bg-white/10">
                {c.hero.secondary}
              </TrackedLink>
            </div>
            <ul className="mt-8 flex flex-col gap-2 text-sm text-white/80 sm:flex-row sm:flex-wrap sm:gap-x-6">
              {c.hero.trust.map((t) => (
                <li key={t} className="flex items-center gap-2"><CheckCircle2 aria-hidden className="size-4 text-lime" />{t}</li>
              ))}
            </ul>
          </div>
          {/* Founder portrait placeholder — no fabricated photo. Replace via CMS media. */}
          <figure className="reveal relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[2rem] bg-gradient-to-b from-midnight to-ink ring-1 ring-white/10" role="img" aria-label={c.hero.portraitAlt}>
            <div aria-hidden className="absolute inset-0 grid place-items-center">
              <span className="font-latin text-8xl font-black text-white/10">SN</span>
            </div>
            <figcaption className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/10 p-4 text-sm backdrop-blur">
              <span className="block font-bold text-white">Shahin Najdi</span>
              <span className="text-white/80">{c.hero.portraitNote} · NajdiTech</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* 2 — Audience selection */}
      <Section id="audience" title={c.audience.title}>
        <div className="grid gap-5 md:grid-cols-2">
          {([["business", Briefcase, "/services", "agency_cta_click"], ["learner", GraduationCap, "/training", "training_cta_click"]] as const).map(([key, Icon, href, event]) => (
            <TrackedLink key={key} event={event} href={href} className="group relative flex flex-col rounded-[var(--radius-card)] border border-line bg-white p-7 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-meta">
              <Icon aria-hidden className="size-9 text-meta" />
              <h3 className="mt-5 text-xl font-bold">{c.audience[key].title}</h3>
              <p className="mt-2 flex-1 leading-8 text-slate-strong">{c.audience[key].body}</p>
              <span className="mt-6 inline-flex items-center gap-2 font-semibold text-brand-700">{c.audience[key].cta}<Arrow aria-hidden className="size-4 transition-transform group-hover:-translate-x-1 ltr:group-hover:translate-x-1" /></span>
            </TrackedLink>
          ))}
        </div>
      </Section>

      {/* 3 — Founder */}
      <Section id="founder" eyebrow={c.founder.eyebrow} title={c.founder.title} className="bg-mist">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            {c.founder.body.map((p) => <p key={p} className="leading-9 text-slate-strong">{p}</p>)}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/free-audit" className="inline-flex min-h-12 items-center rounded-full bg-meta px-5 font-semibold text-white hover:bg-brand-700">{c.final.agency}</Link>
              <Link href="/training" className="inline-flex min-h-12 items-center rounded-full px-5 font-semibold ring-1 ring-line hover:bg-white">{c.final.training}</Link>
            </div>
          </div>
          {video ? (
            <figure>
              <video controls preload="none" playsInline poster={video.poster} className="aspect-video w-full rounded-2xl bg-ink" aria-label={c.founder.videoLabel}>
                <source src={video.url} />
              </video>
              {(locale === "fa" ? video.transcriptFa : video.transcriptEn) && (
                <details className="mt-3 text-sm"><summary className="cursor-pointer font-semibold">{c.founder.transcript}</summary><p className="mt-2 leading-8 text-slate-strong">{locale === "fa" ? video.transcriptFa : video.transcriptEn}</p></details>
              )}
            </figure>
          ) : null}
        </div>
      </Section>

      {/* 4 — Services */}
      <Section id="services" eyebrow={c.services.eyebrow} title={c.services.title}>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.services.items.map((s, i) => {
            const Icon = serviceIcons[i]!;
            return (
              <li key={s.title}>
                <Link href={s.href} className="flex h-full flex-col rounded-[var(--radius-card)] border border-line p-6 transition hover:border-meta hover:shadow-[var(--shadow-card)]">
                  <Icon aria-hidden className="size-7 text-meta" />
                  <h3 className="mt-4 font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-strong">{s.body}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* 5 — Process */}
      <Section id="process" eyebrow={c.process.eyebrow} title={c.process.title} dark>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.process.steps.map(([title, body], i) => (
            <li key={title} className="relative rounded-[var(--radius-card)] border border-white/10 bg-white/[0.03] p-6">
              <span className="font-latin text-sm font-bold text-lime">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-3 font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-white/80">{body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* 6 — Case studies: only rendered when real, permitted case studies exist */}
      {cases.length > 0 && (
        <Section id="case-studies" eyebrow={c.caseStudies.eyebrow} title={c.caseStudies.title}>
          <ul className="grid gap-5 md:grid-cols-3">
            {cases.map((cs) => (
              <li key={cs.id}>
                <Link href={`/case-studies/${cs.slug}`} className="block h-full rounded-[var(--radius-card)] border border-line p-6 hover:border-meta">
                  <p className="text-xs font-semibold text-brand-700">{cs.industry}</p>
                  <h3 className="mt-2 font-bold">{locale === "fa" ? cs.titleFa : cs.titleEn}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-7 text-slate-strong">{locale === "fa" ? cs.outcomesFa : cs.outcomesEn}</p>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/case-studies" className="mt-6 inline-block font-semibold text-brand-700 underline">{c.caseStudies.all}</Link>
        </Section>
      )}

      {/* 7 — Training */}
      <Section id="training" eyebrow={c.training.eyebrow} title={c.training.title} className="bg-mist">
        <div className="grid gap-8 lg:grid-cols-2">
          <ul className="space-y-3">
            {c.training.points.map((p) => <li key={p} className="flex gap-3 leading-8"><CheckCircle2 aria-hidden className="mt-1.5 size-5 shrink-0 text-meta" />{p}</li>)}
          </ul>
          <div className="flex flex-col justify-between gap-6 rounded-[var(--radius-card)] bg-white p-6 ring-1 ring-line">
            <p className="text-sm leading-7 text-slate-strong">{c.training.note}</p>
            <TrackedLink event="training_cta_click" href="/courses" className="inline-flex min-h-12 items-center justify-center rounded-full bg-meta px-5 font-semibold text-white hover:bg-brand-700">{c.training.cta}</TrackedLink>
          </div>
        </div>
      </Section>

      {/* 8 — Free resources */}
      <Section id="resources" eyebrow={c.resources.eyebrow} title={c.resources.title}>
        <div className="grid gap-5 md:grid-cols-2">
          {([["business", "/free-audit", "agency_cta_click"], ["learner", "/free-meta-ads-guide", "training_cta_click"]] as const).map(([k, href, event]) => (
            <div key={k} className="flex flex-col rounded-[var(--radius-card)] border border-line p-7">
              <h3 className="text-lg font-bold">{c.resources[k].title}</h3>
              <p className="mt-2 flex-1 leading-8 text-slate-strong">{c.resources[k].body}</p>
              <TrackedLink event={event} href={href} className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-midnight px-5 font-semibold text-white">{c.resources[k].cta}</TrackedLink>
            </div>
          ))}
        </div>
      </Section>

      {/* 9 — Testimonials: only approved, permission-granted ones */}
      {testimonials.length > 0 && (
        <Section id="testimonials" eyebrow={c.testimonials.eyebrow} title={c.testimonials.title} className="bg-mist">
          <ul className="grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <li key={t.id} className="rounded-[var(--radius-card)] bg-white p-6 ring-1 ring-line">
                <blockquote className="leading-8">{locale === "fa" ? t.quoteFa : t.quoteEn}</blockquote>
                <p className="mt-4 text-sm font-semibold">{[t.authorName, t.business, t.country].filter(Boolean).join(" · ")}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 10 — FAQ */}
      <Section id="faq" eyebrow={c.faq.eyebrow} title={c.faq.title}>
        <Faq groups={faqs} />
      </Section>

      {/* 11 — Final CTA */}
      <section className="on-dark bg-ink py-20 text-white">
        <div className="container-x text-center">
          <h2 className="text-3xl font-extrabold sm:text-4xl">{c.final.title}</h2>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <TrackedLink event="agency_cta_click" href="/free-audit" className="inline-flex min-h-12 items-center justify-center rounded-full bg-lime px-7 font-bold text-ink">{c.final.agency}</TrackedLink>
            <TrackedLink event="training_cta_click" href="/free-meta-ads-guide" className="inline-flex min-h-12 items-center justify-center rounded-full px-7 font-semibold ring-1 ring-white/30 hover:bg-white/10">{c.final.training}</TrackedLink>
          </div>
        </div>
      </section>
    </>
  );
}

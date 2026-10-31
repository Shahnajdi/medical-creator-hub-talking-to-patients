import { pageGuard } from "@/lib/auth/guard";
import { pipelineBoard } from "@/lib/crm/queries";
import { adminLabels } from "@/components/admin/labels";
import { Kanban } from "@/components/admin/Kanban";
import { Link } from "@/i18n/navigation";

export default async function Pipelines({ params, searchParams }: { params: Promise<{ locale: "fa" | "en" }>; searchParams: Promise<{ p?: string }> }) {
  const { locale } = await params;
  const user = await pageGuard("admin.access", locale, "/admin/pipelines");
  const key = (await searchParams).p === "training" ? "training" : "agency";
  const L = adminLabels[locale];
  const board = await pipelineBoard(user, key);
  if (!board) return <p>{L.noData}</p>;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-black">{L.pipelines}</h1>
        <nav className="flex gap-2 text-sm">
          {(["agency", "training"] as const).map((k) => (
            <Link key={k} href={{ pathname: "/admin/pipelines", query: { p: k } }} aria-current={k === key ? "page" : undefined} className="rounded-full px-3 py-1 ring-1 ring-line aria-[current=page]:bg-midnight aria-[current=page]:text-white">{L[k]}</Link>
          ))}
        </nav>
      </div>
      <Kanban
        stages={board.stages.map((s) => ({ id: s.id, name: locale === "fa" ? s.nameFa : s.nameEn }))}
        cards={board.opps.map((o) => ({ ...o }))}
        moveLabel={L.moveTo}
        errorLabel={locale === "fa" ? "تغییر ذخیره نشد. صفحه را تازه کنید." : "The change was not saved. Please refresh."}
      />
    </div>
  );
}

import Link from "next/link";
import { db } from "@/lib/db";
import { requireOrgMembership } from "@/lib/current-user";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui";

export default async function AdministrationDataPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  await requireOrgMembership(orgId);

  const [scCount, injuryCount, folderUploadCount, uploadCount] = await Promise.all([
    db.strengthConditioningEntry.count({ where: { organizationId: orgId } }),
    db.injury.count({ where: { organizationId: orgId } }),
    db.uploadAsset.count({ where: { organizationId: orgId, folder: { not: null } } }),
    db.uploadAsset.count({ where: { organizationId: orgId } }),
  ]);

  const tiles = [
    {
      href: `/org/${orgId}/fixtures`,
      title: "Match reports",
      subtitle: "Goals, goalscorers and cards are recorded on each fixture's detail page.",
      count: null,
    },
    {
      href: `/org/${orgId}/uploads`,
      title: "GPS / video / files",
      subtitle: "GPS uploads, match video and PDFs.",
      count: uploadCount,
    },
    {
      href: `/org/${orgId}/members`,
      title: "Personal & medical info",
      subtitle: "Member information, medical details and transport needs.",
      count: null,
    },
    {
      href: `/org/${orgId}/administration/data/strength-conditioning`,
      title: "Strength & conditioning",
      subtitle: "Bench/squat, sprint times, vertical jump — logged per athlete.",
      count: scCount,
    },
    {
      href: `/org/${orgId}/administration/data/injuries`,
      title: "Injury process",
      subtitle: "Injured → report → treatment → rehab → return to train/play.",
      count: injuryCount,
    },
    {
      href: `/org/${orgId}/administration/data/training-folders`,
      title: "Training folders & uploads",
      subtitle: "Session files organized into your own folders.",
      count: folderUploadCount,
    },
  ];

  return (
    <div>
      <PageHeader title="Data" subtitle="Match reports, GPS/video, personal & medical info, strength & conditioning, injuries and training uploads." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Link key={t.href + t.title} href={t.href}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader title={t.title} />
              <CardBody>
                <p className="text-sm text-slate-500">{t.subtitle}</p>
                {t.count !== null && <p className="mt-2 text-xs text-slate-400">{t.count} records</p>}
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

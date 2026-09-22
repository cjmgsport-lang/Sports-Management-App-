import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { csvResponse } from "@/lib/csv";
import { ROLE_LABELS, STAFF_DIRECTORY_ROLES } from "@/lib/roles";
import { format } from "date-fns";

// Shared CSV export endpoint for every "Excel sheet" style table across
// Administration/Sport — one route dispatching on `type` rather than a
// file per table, since they're all the same shape: check membership,
// query, write rows.
export async function GET(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const type = req.nextUrl.searchParams.get("type");

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: orgId } },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  switch (type) {
    case "staff": {
      const rows = await db.membership.findMany({
        where: { organizationId: orgId, role: { in: STAFF_DIRECTORY_ROLES } },
        include: { user: true },
        orderBy: { user: { name: "asc" } },
      });
      return csvResponse("staff.csv", [
        ["Name", "Role", "Email", "Phone"],
        ...rows.map((m) => [m.user.name, ROLE_LABELS[m.role] ?? m.role, m.user.email, m.user.phone ?? ""]),
      ]);
    }
    case "trials": {
      const trialEventId = req.nextUrl.searchParams.get("trialEventId");
      const rows = await db.trialSelectionDocument.findMany({
        where: { trialEvent: { organizationId: orgId }, ...(trialEventId ? { trialEventId } : {}) },
        include: { athlete: true, trialEvent: true },
        orderBy: { athlete: { name: "asc" } },
      });
      return csvResponse("trials.csv", [
        [
          "Player",
          "Trial",
          "Status",
          "Biological",
          "Conditioning",
          "Coordination",
          "Cognitive",
          "Socio-Affective",
          "Creative",
          "Emotional Skill",
          "Mental",
          "Leadership & Character",
          "Notes",
        ],
        ...rows.map((r) => [
          r.athlete.name,
          r.trialEvent.name,
          r.status,
          r.biological,
          r.conditioning,
          r.coordination,
          r.cognitive,
          r.socioAffective,
          r.creative,
          r.emotionalSkill,
          r.mental,
          r.leadershipCharacter,
          r.notes ?? "",
        ]),
      ]);
    }
    case "injuries": {
      const rows = await db.injury.findMany({
        where: { organizationId: orgId },
        include: { athlete: true },
        orderBy: { dateInjured: "desc" },
      });
      return csvResponse("injuries.csv", [
        ["Player", "Date Injured", "Report", "Treatment", "Healing", "Rehabilitation", "Return to Train", "Return to Play", "Status"],
        ...rows.map((r) => [
          r.athlete.name,
          format(r.dateInjured, "yyyy-MM-dd"),
          r.report,
          r.treatment ?? "",
          r.healing ?? "",
          r.rehabilitation ?? "",
          r.returnToTrainDate ? format(r.returnToTrainDate, "yyyy-MM-dd") : "",
          r.returnToPlayDate ? format(r.returnToPlayDate, "yyyy-MM-dd") : "",
          r.status,
        ]),
      ]);
    }
    case "recruitment": {
      const rows = await db.recruitmentRecord.findMany({
        where: { organizationId: orgId },
        include: { team: true },
        orderBy: { surname: "asc" },
      });
      return csvResponse("recruitment.csv", [
        ["Name", "Surname", "Date of Birth", "Start Year", "End Year", "Position / Role", "Bursary / Cost", "Dual Career", "Team", "Notes"],
        ...rows.map((r) => [
          r.name,
          r.surname,
          r.dateOfBirth ? format(r.dateOfBirth, "yyyy-MM-dd") : "",
          r.startYear ?? "",
          r.endYear ?? "",
          r.positionRole ?? "",
          r.bursaryCost ?? "",
          r.dualCareer ?? "",
          r.team?.name ?? "",
          r.notes ?? "",
        ]),
      ]);
    }
    case "people-team": {
      const teamId = req.nextUrl.searchParams.get("teamId");
      const rows = await db.teamMembership.findMany({
        where: { team: { organizationId: orgId }, ...(teamId ? { teamId } : {}) },
        include: { user: true, team: true },
        orderBy: [{ team: { name: "asc" } }, { user: { name: "asc" } }],
      });
      return csvResponse("people-team.csv", [
        ["Team", "Name", "Surname", "Position", "Role", "Jersey Number"],
        ...rows.map((r) => {
          const [firstName, ...rest] = r.user.name.split(" ");
          return [r.team.name, firstName, rest.join(" "), r.position ?? "", r.role, r.jerseyNumber ?? ""];
        }),
      ]);
    }
    default:
      return NextResponse.json({ error: "Unknown export type" }, { status: 400 });
  }
}

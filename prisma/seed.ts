import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const org = await db.organization.create({
    data: {
      name: "Freedom High School Sports",
      type: "SCHOOL",
      city: "Cape Town",
      province: "Western Cape",
      subscription: {
        create: { plan: "GROWTH", status: "ACTIVE", seats: 250, renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      },
    },
  });

  const owner = await db.user.create({
    data: { name: "Sarah van der Merwe", email: "owner@freedomsports.co.za", passwordHash, phone: "0821234567" },
  });
  const coach = await db.user.create({
    data: { name: "Coach Themba Nkosi", email: "coach@freedomsports.co.za", passwordHash, phone: "0827654321" },
  });
  const medical = await db.user.create({
    data: { name: "Dr. Lindiwe Dlamini", email: "medical@freedomsports.co.za", passwordHash },
  });
  const athlete1 = await db.user.create({
    data: { name: "Kabelo Mokoena", email: "kabelo@freedomsports.co.za", passwordHash, dateOfBirth: new Date("2009-03-14") },
  });
  const athlete2 = await db.user.create({
    data: { name: "Emma Botha", email: "emma@freedomsports.co.za", passwordHash, dateOfBirth: new Date("2008-11-02") },
  });
  const parent = await db.user.create({
    data: { name: "Johan Botha", email: "parent@freedomsports.co.za", passwordHash },
  });

  await db.membership.createMany({
    data: [
      { userId: owner.id, organizationId: org.id, role: "OWNER" },
      { userId: coach.id, organizationId: org.id, role: "COACH" },
      { userId: medical.id, organizationId: org.id, role: "MEDICAL" },
      { userId: athlete1.id, organizationId: org.id, role: "ATHLETE" },
      { userId: athlete2.id, organizationId: org.id, role: "ATHLETE" },
      { userId: parent.id, organizationId: org.id, role: "PARENT" },
    ],
  });

  const team = await db.team.create({
    data: { organizationId: org.id, name: "U19 Boys Hockey", sport: "Hockey", ageGroup: "U19", gender: "Boys", season: "2026" },
  });

  await db.teamMembership.createMany({
    data: [
      { teamId: team.id, userId: coach.id, role: "HEAD_COACH" },
      { teamId: team.id, userId: medical.id, role: "MEDICAL" },
      { teamId: team.id, userId: athlete1.id, role: "ATHLETE", jerseyNumber: "7", position: "Midfield" },
      { teamId: team.id, userId: athlete2.id, role: "ATHLETE", jerseyNumber: "10", position: "Striker" },
    ],
  });

  // Calendar
  const now = new Date();
  await db.calendarEvent.createMany({
    data: [
      {
        teamId: team.id,
        title: "Tuesday field session",
        type: "TRAINING",
        startsAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        endsAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
        location: "Field 2",
        createdById: coach.id,
      },
      {
        teamId: team.id,
        title: "vs King Edward VII",
        type: "MATCH",
        startsAt: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
        endsAt: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        location: "Home ground",
        createdById: coach.id,
      },
    ],
  });

  // Training plan: season -> macro -> meso -> micro -> session -> drills
  const season = await db.season.create({
    data: { organizationId: org.id, teamId: team.id, name: "2026 Season", startDate: new Date("2026-01-15"), endDate: new Date("2026-09-30") },
  });
  const macro = await db.macrocycle.create({
    data: { seasonId: season.id, name: "Pre-season", focus: "General preparation", startDate: new Date("2026-01-15"), endDate: new Date("2026-02-28") },
  });
  const meso = await db.mesocycle.create({
    data: { macrocycleId: macro.id, name: "Base fitness block", focus: "Aerobic base", startDate: new Date("2026-01-15"), endDate: new Date("2026-02-04") },
  });
  const micro = await db.microcycle.create({
    data: { mesocycleId: meso.id, teamId: team.id, weekNumber: 1, startDate: new Date("2026-01-15"), endDate: new Date("2026-01-21"), theme: "Aerobic capacity" },
  });
  const drill1 = await db.drill.create({
    data: { organizationId: org.id, name: "Small-sided possession", category: "Tactical", durationMin: 15, equipment: "Cones, poles" },
  });
  const drill2 = await db.drill.create({
    data: { organizationId: org.id, name: "Repeated sprint ability", category: "Physical", durationMin: 20, equipment: "Cones, GPS" },
  });
  const session = await db.trainingSession.create({
    data: { microcycleId: micro.id, date: new Date("2026-01-15"), startTime: "15:30", endTime: "17:00", focus: "Aerobic capacity + technical", intensityRpe: 6, createdById: coach.id },
  });
  await db.sessionDrill.createMany({
    data: [
      { sessionId: session.id, drillId: drill1.id, orderIndex: 0, durationMin: 15 },
      { sessionId: session.id, drillId: drill2.id, orderIndex: 1, durationMin: 20 },
    ],
  });

  // Chat
  const channel = await db.chatChannel.create({ data: { teamId: team.id, name: "general", isGeneral: true } });
  await db.chatMessage.createMany({
    data: [
      { channelId: channel.id, authorId: coach.id, body: "Welcome to the 2026 season! Training starts Tuesday." },
      { channelId: channel.id, authorId: athlete1.id, body: "Looking forward to it, coach!" },
    ],
  });

  // Noticeboard
  await db.notice.create({
    data: { organizationId: org.id, teamId: team.id, authorId: coach.id, title: "Kit collection this Friday", body: "Please collect your training kit from the sports office before Friday 3pm.", audience: "ALL", pinned: true },
  });

  // Fixtures / tournaments
  const template = await db.fixtureTemplate.create({
    data: { organizationId: org.id, name: "League match", sport: "Hockey", defaultDurationMin: 70, defaultVenue: "Home ground" },
  });
  const tournament = await db.tournament.create({
    data: { organizationId: org.id, name: "Western Cape Interschools Festival", startDate: new Date("2026-03-10"), endDate: new Date("2026-03-12"), venue: "Bishops", format: "Round robin" },
  });
  const fixture = await db.fixture.create({
    data: {
      organizationId: org.id,
      teamId: team.id,
      templateId: template.id,
      tournamentId: tournament.id,
      opponent: "King Edward VII",
      homeAway: "HOME",
      venue: "Home ground",
      startsAt: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      status: "SCHEDULED",
    },
  });

  // Clothing
  const jersey = await db.clothingItem.create({
    data: { organizationId: org.id, name: "Match jersey", category: "Playing kit", sizesAvailable: "S,M,L,XL", unitPrice: 450 },
  });
  const order = await db.clothingOrder.create({
    data: { organizationId: org.id, teamId: team.id, requestedById: coach.id, status: "SUBMITTED" },
  });
  await db.clothingOrderLine.create({ data: { orderId: order.id, itemId: jersey.id, size: "M", quantity: 1, athleteName: athlete1.name } });

  // Member forms
  await db.memberProfile.create({
    data: { userId: athlete1.id, organizationId: org.id, address: "12 Main Road, Cape Town", emergencyContactName: "Grace Mokoena", emergencyContactPhone: "0839876543", schoolOrEmployer: "Freedom High School" },
  });
  await db.medicalRecord.create({
    data: { userId: athlete1.id, organizationId: org.id, allergies: "None known", medicalAidName: "Discovery Health", medicalAidNumber: "1234567890", consentGiven: true },
  });
  await db.transportNeed.create({
    data: { userId: athlete1.id, organizationId: org.id, needsTransport: true, pickupAddress: "12 Main Road, Cape Town", contactPhone: "0839876543" },
  });

  // Budget
  const budget = await db.seasonBudget.create({
    data: { userId: athlete1.id, organizationId: org.id, seasonName: "2026 Season", totalBudget: 8500 },
  });
  await db.budgetLineItem.createMany({
    data: [
      { budgetId: budget.id, category: "Kit", description: "Match jersey + shorts", amount: 750, paid: true },
      { budgetId: budget.id, category: "Tour", description: "Interschools Festival travel", amount: 3200, dueDate: new Date("2026-02-20") },
      { budgetId: budget.id, category: "Fees", description: "Season training fees", amount: 4500, dueDate: new Date("2026-01-31") },
    ],
  });

  // IDP
  await db.individualDevelopmentPlan.create({
    data: {
      athleteId: athlete1.id,
      organizationId: org.id,
      teamId: team.id,
      seasonName: "2026 Season",
      goals: "Improve aerial ball control and increase top speed by 5%.",
      strengths: "Strong tackling, good game reading.",
      areasForImprovement: "First touch under pressure, aerobic endurance.",
      actionPlan: "Extra technical sessions on Mondays, weekly sprint testing.",
      reviewDate: new Date("2026-04-01"),
      createdById: coach.id,
    },
  });

  // Weekly feedback
  await db.weeklyFeedback.create({
    data: {
      athleteId: athlete1.id,
      coachId: coach.id,
      teamId: team.id,
      weekStarting: new Date("2026-01-15"),
      performanceRating: 4,
      strengths: "Great work rate and communication on field.",
      areasToImprove: "Decision making in the final third.",
    },
  });

  // Trials & selection
  const trial = await db.trialEvent.create({
    data: { organizationId: org.id, teamId: team.id, name: "2027 U19 Trials", date: new Date("2026-11-05"), venue: "Main field", ageGroup: "U19" },
  });
  await db.trialSelectionDocument.create({ data: { trialEventId: trial.id, athleteId: athlete2.id, status: "PENDING" } });

  // Resources
  const gpsUnit = await db.resource.create({
    data: { organizationId: org.id, name: "GPS Unit Set A", category: "GPS_UNIT", quantityTotal: 15, notes: "Catapult Vector units, charge overnight." },
  });
  await db.resourceBooking.create({
    data: {
      resourceId: gpsUnit.id,
      teamId: team.id,
      requestedById: coach.id,
      startsAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      endsAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      quantity: 15,
      status: "APPROVED",
      purpose: "Tuesday field session",
    },
  });

  console.log("Seed complete.");
  console.log("Login with any of these emails, password: password123");
  console.log("  owner@freedomsports.co.za (Owner)");
  console.log("  coach@freedomsports.co.za (Coach)");
  console.log("  medical@freedomsports.co.za (Medical)");
  console.log("  kabelo@freedomsports.co.za (Athlete)");
  console.log("  emma@freedomsports.co.za (Athlete)");
  console.log("  parent@freedomsports.co.za (Parent)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

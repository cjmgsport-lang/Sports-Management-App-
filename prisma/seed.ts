import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const db = new PrismaClient();

// A minimal, genuinely-valid one-page PDF — so the seeded training-folder
// download link actually opens something instead of a placeholder path
// that was never written to disk.
const MINIMAL_PDF = Buffer.from(
  "%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
    "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 100]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n" +
    "4 0 obj<</Length 74>>stream\nBT /F1 12 Tf 10 50 Td (Pre-season foundations booklet - seed placeholder) Tj ET\nendstream\nendobj\n" +
    "5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n" +
    "trailer<</Root 1 0 R>>",
  "utf-8"
);

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const org = await db.organization.create({
    data: {
      name: "Freedom High School Sports",
      slug: "freedom-high-school-sports",
      type: "SCHOOL",
      city: "Cape Town",
      province: "Western Cape",
      publicDescription: "Home of hockey, netball and athletics at Freedom High School — go get 'em!",
      subscription: {
        create: {
          plan: "GROWTH",
          billingInterval: "ANNUAL",
          status: "ACTIVE",
          seats: 250,
          renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  const owner = await db.user.create({
    data: { name: "Sarah van der Merwe", email: "owner@freedomsports.co.za", passwordHash, phone: "0821234567" },
  });
  const coach = await db.user.create({
    data: { name: "Coach Themba Nkosi", email: "coach@freedomsports.co.za", passwordHash, phone: "0827654321" },
  });
  const hod = await db.user.create({
    data: { name: "Pieter Nel", email: "hod@freedomsports.co.za", passwordHash, phone: "0829998888" },
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

  // Backroom staff — Administration > People.
  const manager = await db.user.create({
    data: { name: "Nomvula Khumalo", email: "manager@freedomsports.co.za", passwordHash, phone: "0831112222" },
  });
  const adminAssistant = await db.user.create({
    data: { name: "Priya Naidoo", email: "admin.assistant@freedomsports.co.za", passwordHash },
  });
  const logisticsManager = await db.user.create({
    data: { name: "Ben Steyn", email: "logistics@freedomsports.co.za", passwordHash },
  });
  const performancePsych = await db.user.create({
    data: { name: "Dr. Anele Sithole", email: "psych@freedomsports.co.za", passwordHash },
  });
  const physio = await db.user.create({
    data: { name: "Marike Joubert", email: "physio@freedomsports.co.za", passwordHash },
  });
  const strengthCoach = await db.user.create({
    data: { name: "Sipho Mahlangu", email: "strength@freedomsports.co.za", passwordHash },
  });
  const analyst = await db.user.create({
    data: { name: "Chloe Adams", email: "analyst@freedomsports.co.za", passwordHash },
  });

  await db.membership.createMany({
    data: [
      { userId: owner.id, organizationId: org.id, role: "OWNER" },
      { userId: hod.id, organizationId: org.id, role: "HOD" },
      { userId: coach.id, organizationId: org.id, role: "COACH" },
      { userId: medical.id, organizationId: org.id, role: "MEDICAL" },
      { userId: athlete1.id, organizationId: org.id, role: "ATHLETE" },
      { userId: athlete2.id, organizationId: org.id, role: "ATHLETE" },
      { userId: parent.id, organizationId: org.id, role: "PARENT" },
      { userId: manager.id, organizationId: org.id, role: "MANAGER" },
      { userId: adminAssistant.id, organizationId: org.id, role: "ADMIN_ASSISTANT" },
      { userId: logisticsManager.id, organizationId: org.id, role: "LOGISTICS_MANAGER" },
      { userId: performancePsych.id, organizationId: org.id, role: "PERFORMANCE_PSYCH" },
      { userId: physio.id, organizationId: org.id, role: "PHYSIO" },
      { userId: strengthCoach.id, organizationId: org.id, role: "STRENGTH_CONDITIONING" },
      { userId: analyst.id, organizationId: org.id, role: "ANALYST" },
    ],
  });

  const team = await db.team.create({
    data: { organizationId: org.id, name: "U19 Boys Hockey", sport: "Hockey", ageGroup: "U19", gender: "Boys", season: "2026" },
  });

  await db.teamMembership.createMany({
    data: [
      { teamId: team.id, userId: coach.id, role: "HEAD_COACH" },
      { teamId: team.id, userId: hod.id, role: "HOD" },
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

  // Fixtures / tournaments (created first so the morphocycle below can
  // build backward from a real match date)
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

  // A completed past fixture with a full match report — Administration > Data.
  const pastFixture = await db.fixture.create({
    data: {
      organizationId: org.id,
      teamId: team.id,
      templateId: template.id,
      opponent: "Bishops",
      homeAway: "AWAY",
      venue: "Bishops",
      startsAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      status: "COMPLETED",
      ourScore: 3,
      opponentScore: 1,
    },
  });
  await db.matchResult.create({
    data: { fixtureId: pastFixture.id, summary: "Strong second-half performance after a tight first half.", createdById: coach.id },
  });
  await db.matchGoal.createMany({
    data: [
      { fixtureId: pastFixture.id, scorerId: athlete2.id, minute: 22 },
      { fixtureId: pastFixture.id, scorerId: athlete2.id, minute: 51 },
      { fixtureId: pastFixture.id, scorerId: athlete1.id, minute: 63 },
    ],
  });
  await db.matchCard.create({ data: { fixtureId: pastFixture.id, playerId: athlete1.id, cardType: "YELLOW", minute: 58 } });

  // Game model: the principles every drill and session below is designed
  // to serve, organised by the four moments of the game (+ set pieces).
  const principleDefs: { moment: string; name: string; description: string }[] = [
    { moment: "OFFENSIVE_ORGANIZATION", name: "Build-up through the wide channels", description: "Switch play early to draw the press wide, then attack the D at pace." },
    { moment: "OFFENSIVE_ORGANIZATION", name: "Overload the D on entry", description: "Third attacker arrives late into the circle as the ball is played in." },
    { moment: "DEFENSIVE_ORGANIZATION", name: "Mid-block press, trigger on backward pass", description: "Press as a unit the moment the opponent plays backward or sideways in our half." },
    { moment: "DEFENSIVE_ORGANIZATION", name: "Compact shape inside our 23", description: "Deny central passing lanes; force play to the outside channels." },
    { moment: "ATTACKING_TRANSITION", name: "Immediate forward pass after winning the ball", description: "First touch forward, not sideways — attack the space before their shape resets." },
    { moment: "DEFENSIVE_TRANSITION", name: "Nearest player delays, second recovers depth", description: "Stop the counter immediately; don't let the first mistake become a second." },
    { moment: "SET_PIECES", name: "Short corner variation from the top", description: "Direct shot or slip to the deflector depending on the keeper's set-up." },
  ];
  const principles = await Promise.all(
    principleDefs.map((p, i) => db.gamePrinciple.create({ data: { teamId: team.id, moment: p.moment, name: p.name, description: p.description, orderIndex: i } }))
  );
  const [buildUpWide, , midBlockPress, , forwardAfterWin, , shortCornerTop] = principles;

  // Training plan: season -> macrocycle -> mesocycle -> microcycle
  // (morphocycle) -> sessions, tagged with tactical-periodisation fields.
  const season = await db.season.create({
    data: { organizationId: org.id, teamId: team.id, name: "2026 Season", startDate: new Date("2026-01-15"), endDate: new Date("2026-09-30") },
  });
  const macro = await db.macrocycle.create({
    data: {
      seasonId: season.id,
      name: "Pre-season",
      focus: "Introduce defensive organization (mid-block press) and build-up principles",
      startDate: new Date("2026-01-15"),
      endDate: new Date("2026-02-28"),
    },
  });
  const meso = await db.mesocycle.create({
    data: {
      macrocycleId: macro.id,
      name: "Foundations block",
      focus: "Mid-block press trigger + build-up through the wide channels",
      startDate: new Date("2026-01-15"),
      endDate: new Date("2026-02-04"),
    },
  });

  const weekStart = new Date(fixture.startsAt.getTime() - 5 * 24 * 60 * 60 * 1000);
  const weekEnd = new Date(fixture.startsAt.getTime());
  const micro = await db.microcycle.create({
    data: {
      mesocycleId: meso.id,
      teamId: team.id,
      weekNumber: 2,
      startDate: weekStart,
      endDate: weekEnd,
      theme: "Mid-block press + build-up through the wide channels",
      fixtureId: fixture.id,
    },
  });

  const drill1 = await db.drill.create({
    data: {
      organizationId: org.id,
      name: "4v4+2 possession, press trigger on backward pass",
      category: "Tactical",
      durationMin: 20,
      equipment: "Cones, poles, bibs",
      moment: "DEFENSIVE_ORGANIZATION",
      principleId: midBlockPress.id,
      complexity: "HIGH",
      constraints: "4v4+2 floaters, 30x25m, press triggers only on a backward pass",
    },
  });
  const drill2 = await db.drill.create({
    data: {
      organizationId: org.id,
      name: "Wide overload to circle entry, 6v5",
      category: "Tactical",
      durationMin: 18,
      equipment: "Cones, mannequins, GPS",
      moment: "OFFENSIVE_ORGANIZATION",
      principleId: buildUpWide.id,
      complexity: "MEDIUM",
      constraints: "6v5 into a full-width channel + D, third attacker arrives late",
    },
  });
  const drill3 = await db.drill.create({
    data: {
      organizationId: org.id,
      name: "Turnover to first forward pass, 3v3",
      category: "Tactical",
      durationMin: 12,
      equipment: "Cones",
      moment: "ATTACKING_TRANSITION",
      principleId: forwardAfterWin.id,
      complexity: "MEDIUM",
      constraints: "3v3 in a 20x15m grid, reward a forward pass within 2 touches of winning the ball",
    },
  });
  const drill4 = await db.drill.create({
    data: {
      organizationId: org.id,
      name: "Short corner variations vs keeper + 3",
      category: "Set pieces",
      durationMin: 15,
      equipment: "Balls, cones",
      moment: "SET_PIECES",
      principleId: shortCornerTop.id,
      complexity: "LOW",
      constraints: "Live reps vs a keeper and 3 defenders, rotate the top-of-circle option each rep",
    },
  });

  const sessionDuration = await db.trainingSession.create({
    data: {
      microcycleId: micro.id,
      date: new Date(weekStart),
      startTime: "15:30",
      endTime: "17:15",
      focus: "Defensive organization: mid-block press, and build-up through the wide channels",
      intensityRpe: 6,
      matchDayCode: "MD_MINUS_4",
      dominantMoment: "DEFENSIVE_ORGANIZATION",
      subDynamic: "DURATION",
      createdById: coach.id,
    },
  });
  await db.sessionDrill.createMany({
    data: [
      { sessionId: sessionDuration.id, drillId: drill1.id, orderIndex: 0, durationMin: 20 },
      { sessionId: sessionDuration.id, drillId: drill2.id, orderIndex: 1, durationMin: 18 },
    ],
  });

  const sessionSpeedEndurance = await db.trainingSession.create({
    data: {
      microcycleId: micro.id,
      date: new Date(weekStart.getTime() + 1 * 24 * 60 * 60 * 1000),
      startTime: "15:30",
      endTime: "16:45",
      focus: "Attacking transition: immediate forward pass after winning the ball",
      intensityRpe: 7,
      matchDayCode: "MD_MINUS_3",
      dominantMoment: "ATTACKING_TRANSITION",
      subDynamic: "SPEED_ENDURANCE",
      createdById: coach.id,
    },
  });
  await db.sessionDrill.create({ data: { sessionId: sessionSpeedEndurance.id, drillId: drill3.id, orderIndex: 0, durationMin: 12 } });

  const sessionSpeed = await db.trainingSession.create({
    data: {
      microcycleId: micro.id,
      date: new Date(weekStart.getTime() + 2 * 24 * 60 * 60 * 1000),
      startTime: "15:30",
      endTime: "16:30",
      focus: "Overload the D on entry — sharp, high-speed circle entries",
      intensityRpe: 8,
      matchDayCode: "MD_MINUS_2",
      dominantMoment: "OFFENSIVE_ORGANIZATION",
      subDynamic: "SPEED",
      createdById: coach.id,
    },
  });
  await db.sessionDrill.create({ data: { sessionId: sessionSpeed.id, drillId: drill2.id, orderIndex: 0, durationMin: 15 } });

  const sessionActivation = await db.trainingSession.create({
    data: {
      microcycleId: micro.id,
      date: new Date(weekStart.getTime() + 3 * 24 * 60 * 60 * 1000),
      startTime: "15:30",
      endTime: "16:00",
      focus: "Set pieces walkthrough + tactical review — no residual fatigue",
      intensityRpe: 3,
      matchDayCode: "MD_MINUS_1",
      dominantMoment: "SET_PIECES",
      subDynamic: "ACTIVATION",
      createdById: coach.id,
    },
  });
  await db.sessionDrill.create({ data: { sessionId: sessionActivation.id, drillId: drill4.id, orderIndex: 0, durationMin: 15 } });

  // Chat: team channel, a coach<->athlete DM, a coach-curated "unit", and
  // an admin-to-parents broadcast.
  const channel = await db.chatChannel.create({
    data: { organizationId: org.id, teamId: team.id, name: "general", isGeneral: true, kind: "TEAM", createdById: coach.id },
  });
  await db.chatMessage.createMany({
    data: [
      { channelId: channel.id, authorId: coach.id, body: "Welcome to the 2026 season! Training starts Tuesday." },
      { channelId: channel.id, authorId: athlete1.id, body: "Looking forward to it, coach!" },
    ],
  });

  const dmChannel = await db.chatChannel.create({
    data: {
      organizationId: org.id,
      kind: "DIRECT",
      name: "Direct message",
      createdById: coach.id,
      participants: { create: [{ userId: coach.id }, { userId: athlete1.id }] },
    },
  });
  await db.chatMessage.create({
    data: { channelId: dmChannel.id, authorId: coach.id, body: "Kabelo, well done on the fitness testing today." },
  });

  const unitChannel = await db.chatChannel.create({
    data: {
      organizationId: org.id,
      teamId: team.id,
      kind: "GROUP",
      name: "Midfield unit",
      createdById: coach.id,
      participants: { create: [{ userId: coach.id }, { userId: athlete1.id }] },
    },
  });
  await db.chatMessage.create({
    data: { channelId: unitChannel.id, authorId: coach.id, body: "Midfield: focus on the pressing triggers we drilled this week." },
  });

  const parentBroadcastChannel = await db.chatChannel.create({
    data: { organizationId: org.id, kind: "PARENT_BROADCAST", name: "Parent Notices", createdById: owner.id },
  });
  await db.chatMessage.create({
    data: {
      channelId: parentBroadcastChannel.id,
      authorId: owner.id,
      body: "Welcome to the 2026 season! We'll use this channel for important announcements throughout the year.",
    },
  });

  const leadershipChannel = await db.chatChannel.create({
    data: {
      organizationId: org.id,
      kind: "LEADERSHIP",
      name: "Leadership Group",
      createdById: coach.id,
      participants: { create: [{ userId: coach.id }, { userId: athlete2.id }] },
    },
  });
  await db.chatMessage.create({
    data: { channelId: leadershipChannel.id, authorId: coach.id, body: "Emma, can you check in with the U19s about Friday's captain's run?" },
  });

  // Noticeboard
  await db.notice.create({
    data: { organizationId: org.id, teamId: team.id, authorId: coach.id, title: "Kit collection this Friday", body: "Please collect your training kit from the sports office before Friday 3pm.", audience: "ALL", pinned: true },
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

  // Trials & selection, scored across the nine selection domains.
  const trial = await db.trialEvent.create({
    data: { organizationId: org.id, teamId: team.id, name: "2027 U19 Trials", date: new Date("2026-11-05"), venue: "Main field", ageGroup: "U19" },
  });
  await db.trialSelectionDocument.create({
    data: {
      trialEventId: trial.id,
      athleteId: athlete2.id,
      status: "PENDING",
      biological: 4,
      conditioning: 4,
      coordination: 5,
      cognitive: 4,
      socioAffective: 3,
      creative: 4,
      emotionalSkill: 4,
      mental: 5,
      leadershipCharacter: 5,
    },
  });

  // Strength & conditioning — Administration > Data.
  await db.strengthConditioningEntry.create({
    data: {
      organizationId: org.id,
      athleteId: athlete1.id,
      createdById: strengthCoach.id,
      date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      benchPressKg: 62.5,
      squatKg: 95,
      sprint10mSec: 1.78,
      sprint40mSec: 5.32,
      verticalJumpCm: 58,
    },
  });

  // Injury process — Administration > Data.
  await db.injury.create({
    data: {
      organizationId: org.id,
      athleteId: athlete1.id,
      createdById: physio.id,
      dateInjured: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      report: "Grade 1 hamstring strain, right leg, during sprint work.",
      treatment: "RICE protocol, physio 3x/week.",
      healing: "Good progress, minimal swelling by day 10.",
      rehabilitation: "Progressive loading programme, isometric to eccentric.",
      returnToTrainDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      status: "RETURNED_TO_TRAIN",
    },
  });

  // Recruitment & retention — Sport.
  await db.recruitmentRecord.create({
    data: {
      organizationId: org.id,
      teamId: team.id,
      name: "Sipho",
      surname: "Ndlovu",
      dateOfBirth: new Date("2010-06-21"),
      startYear: 2027,
      endYear: 2030,
      positionRole: "Defender",
      bursaryCost: "50% bursary",
      dualCareer: "Considering BSc Sport Science part-time from 2028",
      notes: "Standout at the Western Cape U16 trials.",
    },
  });

  // Game continuum — Sport (descriptions only; images are uploaded via the UI).
  await db.gameContinuumMoment.createMany({
    data: [
      { teamId: team.id, moment: "POSSESSION", description: "Build patiently through midfield, draw the press, switch to the underloaded side." },
      { teamId: team.id, moment: "COUNTER_ATTACK", description: "Vertical, direct — first pass forward, exploit space behind a broken press." },
      { teamId: team.id, moment: "BALL_RECOVERY_COUNTER_DEFENCE", description: "Nearest player delays immediately; second recovers depth to stop the counter." },
      { teamId: team.id, moment: "SET_PIECE", description: "Short corner variations from the top; rehearsed runs for long corners." },
      { teamId: team.id, moment: "ATTACKING_SCORING_BEHAVIOUR", description: "Third attacker arrives late into the circle as the ball is played in." },
      { teamId: team.id, moment: "DEFENSIVE_GOAL_AREA_BEHAVIOUR", description: "Compact block inside the 23, deny central lanes, force the outside channel." },
    ],
  });

  // Training folders — Sport. Writes a real (minimal) PDF to the local
  // uploads dir so the seeded download link actually opens.
  const uploadsDir = process.env.UPLOADS_DIR ?? "./storage/uploads";
  const seedUploadDir = path.join(process.cwd(), uploadsDir, org.id);
  await mkdir(seedUploadDir, { recursive: true });
  const seedPdfName = "seed-foundations-booklet.pdf";
  await writeFile(path.join(seedUploadDir, seedPdfName), MINIMAL_PDF);
  await db.trainingResource.create({
    data: {
      organizationId: org.id,
      teamId: team.id,
      category: "FOUNDATIONS",
      kind: "PDF",
      title: "Pre-season foundations booklet",
      description: "Movement literacy and ball-mastery progressions for week 1.",
      storedPath: path.join(org.id, seedPdfName),
      mimeType: "application/pdf",
      uploadedById: coach.id,
    },
  });

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
  console.log("  hod@freedomsports.co.za (Head of Department - full permissions)");
  console.log("  coach@freedomsports.co.za (Coach)");
  console.log("  medical@freedomsports.co.za (Medical)");
  console.log("  kabelo@freedomsports.co.za (Athlete)");
  console.log("  emma@freedomsports.co.za (Athlete)");
  console.log("  parent@freedomsports.co.za (Parent)");
  console.log("  manager@freedomsports.co.za (Manager)");
  console.log("  admin.assistant@freedomsports.co.za (Administrative Assistant)");
  console.log("  logistics@freedomsports.co.za (Logistics Manager)");
  console.log("  psych@freedomsports.co.za (Performance Psychologist)");
  console.log("  physio@freedomsports.co.za (Physiotherapist)");
  console.log("  strength@freedomsports.co.za (Strength & Conditioning Coach)");
  console.log("  analyst@freedomsports.co.za (Performance Analyst)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

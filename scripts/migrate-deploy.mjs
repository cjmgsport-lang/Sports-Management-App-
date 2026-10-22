// `prisma migrate deploy` with retries, run as part of every Vercel build.
//
// Several Vercel projects build from this repo against the same database, so
// their builds start together and race for Prisma's migration lock; the
// losers time out and the whole deploy fails. Waiting and retrying lets them
// queue up instead. Any other failure still fails after the last attempt.
import { spawnSync } from "node:child_process";

const ATTEMPTS = 5;

for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
  const { status } = spawnSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit" });
  if (status === 0) process.exit(0);
  if (attempt === ATTEMPTS) break;
  const waitSeconds = 15 * attempt;
  console.warn(`prisma migrate deploy failed (attempt ${attempt}/${ATTEMPTS}); retrying in ${waitSeconds}s…`);
  await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
}

console.error(`prisma migrate deploy failed after ${ATTEMPTS} attempts.`);
process.exit(1);

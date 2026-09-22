import crypto from "crypto";

// A short, easy-to-read-aloud/WhatsApp temporary password — used as the
// pre-filled suggestion when an admin adds a new member, so there's
// something legible to actually hand over (a random byte string isn't).
const WORDS = [
  "Amber", "Coral", "Falcon", "Harbor", "Ivory", "Jasper", "Kestrel", "Lumen",
  "Maple", "Nectar", "Onyx", "Pepper", "Quartz", "Raven", "Sable", "Tundra",
  "Umber", "Violet", "Willow", "Zenith",
];

export function generateSuggestedPassword(): string {
  const word = WORDS[crypto.randomInt(WORDS.length)];
  const digits = crypto.randomInt(1000, 9999);
  return `${word}${digits}`;
}

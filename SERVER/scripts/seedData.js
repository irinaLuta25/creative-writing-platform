const admin = require("firebase-admin");
const { db } = require("../config/db");
const { FieldValue, Timestamp } = admin.firestore;
const { hashPassword } = require("../auth");

async function clearCollection(name, batchSize = 400) {
  const colRef = db.collection(name);

  while (true) {
    const snap = await colRef.limit(batchSize).get();
    if (snap.empty) break;

    const batch = db.batch();
    for (const doc of snap.docs) batch.delete(doc.ref);
    await batch.commit();
  }
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMany(arr, min = 2, max = 4) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  const n = Math.floor(Math.random() * (max - min + 1)) + min;
  return shuffled.slice(0, n);
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[ăâ]/g, "a")
    .replace(/[î]/g, "i")
    .replace(/[ș]/g, "s")
    .replace(/[ț]/g, "t")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

async function main() {
  const { faker } = await import("@faker-js/faker");

  const DEFAULT_PASSWORD = "password";
  const DEFAULT_PASSWORD_HASH = await hashPassword(DEFAULT_PASSWORD);

  console.log("Clearing old data...");
  await clearCollection("users");
  await clearCollection("challenges");
  await clearCollection("pieces");

  console.log("Seeding...");

  const users = [];
  for (let i = 0; i < 8; i++) {
    const displayName = faker.person.fullName();
    const email = faker.internet.email().toLowerCase();
    const username =
      faker.internet.username().toLowerCase().replace(/[^a-z0-9_]/g, "_") ||
      email.split("@")[0];

    const ref = db.collection("users").doc();

    await ref.set({
      userId: ref.id,
      auth: { email, passwordHash: DEFAULT_PASSWORD_HASH },
      profile: { displayName, username, bio: faker.lorem.sentence() },
      roles: ["user"],
      preferences: { languages: ["en"] },
      stats: { piecesCount: 0, commentsCount: 0 },
      metadata: {
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
    });

    users.push({ id: ref.id, displayName, username, email });
  }

  const challenges = [];
  for (let i = 0; i < 4; i++) {
    const title = faker.lorem.words(3);
    const ref = db.collection("challenges").doc();

    const startsAt = Timestamp.fromDate(faker.date.recent({ days: 7 }));
    const endsAt = Timestamp.fromDate(faker.date.soon({ days: 30 }));

    const createdBy = pick(users).id;

    const challengeDoc = {
      challengeId: ref.id,
      title,
      slug: slugify(title) + "-" + Math.random().toString(36).slice(2, 6),
      prompt: {
        text: faker.lorem.paragraph(),
        constraints: {
          maxWords: faker.number.int({ min: 200, max: 800 }),
          language: "en",
        },
        tags: pickMany(["emotion", "nature", "conflict", "memory"]),
      },
      availability: {
        isActive: true,
        schedule: { startsAt, endsAt },
      },
      stats: { submissionsCount: 0 },
      metadata: {
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy,
      },
    };

    await ref.set(challengeDoc);

    challenges.push({
      id: ref.id,
      title: challengeDoc.title,
      constraintsSnapshot: {
        maxWords: challengeDoc.prompt.constraints.maxWords,
        language: challengeDoc.prompt.constraints.language,
        tags: Array.isArray(challengeDoc.prompt.tags) ? challengeDoc.prompt.tags : [],
      },
    });
  }

  for (let i = 0; i < 12; i++) {
    const title = faker.lorem.sentence(4).replace(/\.$/, "");
    const body = faker.lorem.paragraphs(4, "\n\n");
    const author = pick(users);

    const maybeChallenge = Math.random() > 0.5 ? pick(challenges) : null;

    const pieceRef = db.collection("pieces").doc();

    const wordsArr = body.split(/\s+/).filter(Boolean);
    const wordsCount = wordsArr.length;

    await pieceRef.set({
      pieceId: pieceRef.id,
      title,
      slug: slugify(title) + "-" + Math.random().toString(36).slice(2, 6),
      content: {
        body,
        excerpt: body.slice(0, 200),
        language: "en",
        readingTimeMin: Math.max(1, Math.round(wordsCount / 200)),
      },
      classification: {
        genre: { id: "genre_romance", name: "Romance" },
        tags: pickMany(["rain", "city", "loneliness", "dream"]),
      },
      author: {
        id: author.id,
        displayName: author.displayName,
        username: author.username,
        email: author.email,
      },
      challenge: maybeChallenge
        ? {
            id: maybeChallenge.id,
            title: maybeChallenge.title,
            constraintsSnapshot: maybeChallenge.constraintsSnapshot,
          }
        : null,
      stats: { words: wordsCount, commentsCount: 0 },
      commentsPreview: [],
      metadata: {
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: author.id,
      },
    });

    const commentsCount = faker.number.int({ min: 1, max: 4 });
    for (let c = 0; c < commentsCount; c++) {
      const commenter = pick(users);
      const commentRef = pieceRef.collection("comments").doc();

      await commentRef.set({
        commentId: commentRef.id,
        author: {
          id: commenter.id,
          displayName: commenter.displayName,
          username: commenter.username,
          email: commenter.email,
        },
        content: { text: faker.lorem.sentence(), mentions: [] },
        moderation: { status: "visible" },
        metadata: {
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          createdBy: commenter.id,
        },
      });
    }
  }

  console.log("Seed complete.");
  console.log("Seed users password:", DEFAULT_PASSWORD);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});

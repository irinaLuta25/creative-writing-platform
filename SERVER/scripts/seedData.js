const admin = require("firebase-admin");
const {db} = require("../config/db");
const { FieldValue, Timestamp } = admin.firestore;

async function clearCollection(name) {
  const snapshot = await db.collection(name).get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMany(arr, min = 2, max = 4) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.floor(Math.random() * (max - min + 1)) + min);
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[ăâ]/g, "a")
    .replace(/[î]/g, "i")
    .replace(/[ș]/g, "s")
    .replace(/[ț]/g, "t")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

async function main() {
  const { faker } = await import("@faker-js/faker");

  console.log("Stergere date vechi...");
  await clearCollection("users");
  await clearCollection("challenges");
  await clearCollection("pieces");

  console.log("Seeding...");

  // ---------------- USERS ----------------
  const users = [];
  for (let i = 0; i < 8; i++) {
    const displayName = faker.person.fullName();
    const username = faker.internet.username().toLowerCase();

    const ref = db.collection("users").doc();
    await ref.set({
      userId: ref.id,
      auth: { email: faker.internet.email() },
      profile: {
        displayName,
        username,
        bio: faker.lorem.sentence(),
      },
      roles: ["user"],
      preferences: {
        languages: ["ro"],
      },
      stats: { piecesCount: 0, commentsCount: 0 },
      metadata: {
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
    });

    users.push({ id: ref.id, displayName, username });
  }

  // ---------------- CHALLENGES ----------------
  const challenges = [];
  for (let i = 0; i < 4; i++) {
    const title = faker.lorem.words(3);
    const ref = db.collection("challenges").doc();

    await ref.set({
      challengeId: ref.id,
      title,
      slug: slugify(title),
      prompt: {
        text: faker.lorem.paragraph(),
        constraints: {
          maxWords: faker.number.int({ min: 200, max: 800 }),
          language: "ro",
        },
        tags: pickMany(["emotie", "natura", "conflict", "memorie"]),
      },
      availability: {
        isActive: true,
        schedule: {
          startsAt: Timestamp.fromDate(new Date()),
          endsAt: Timestamp.fromDate(faker.date.soon({ days: 30 })),
        },
      },
      stats: { submissionsCount: 0 },
      metadata: {
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: pick(users).id,
      },
    });

    challenges.push(ref.id);
  }

  // ---------------- PIECES + COMMENTS ----------------
  for (let i = 0; i < 12; i++) {
    const title = faker.lorem.sentence(4).replace(".", "");
    const body = faker.lorem.paragraphs(4, "\n\n");
    const author = pick(users);
    const challengeId = Math.random() > 0.5 ? pick(challenges) : null;

    const pieceRef = db.collection("pieces").doc();

    await pieceRef.set({
      pieceId: pieceRef.id,
      title,
      slug: slugify(title),
      content: {
        body,
        excerpt: body.slice(0, 200),
        language: "ro",
        readingTimeMin: Math.ceil(body.split(" ").length / 200),
      },
      classification: {
        genre: { id: "gen_prose", name: "Prose" },
        tags: pickMany(["ploaie", "oras", "singuratate", "vis"]),
      },
      author: {
        id: author.id,
        displayName: author.displayName,
        username: author.username,
      },
      challenge: challengeId
        ? {
            id: challengeId,
            title: "Challenge activ",
            constraintsSnapshot: { maxWords: 500, language: "ro" },
          }
        : null,
      stats: {
        words: body.split(" ").length,
        commentsCount: 0,
      },
      commentsPreview: [],
      metadata: {
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: author.id,
      },
    });

    // ---- COMMENTS subcollection ----
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
        },
        content: {
          text: faker.lorem.sentence(),
          mentions: [],
        },
        moderation: { status: "visible" },
        metadata: {
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          createdBy: commenter.id,
        },
      });
    }
  }

  console.log("Seed complet.");
  process.exit(0);
}

main().catch(err => {
  console.error("Eroare seed:", err);
  process.exit(1);
});

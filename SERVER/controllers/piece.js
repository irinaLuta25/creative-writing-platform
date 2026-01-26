const { validationResult } = require("express-validator");
const pieceModel = require("../models/piece");
const userModel = require("../models/user");
const challengeModel = require("../models/challenge");
const admin = require("firebase-admin");
const { FieldValue, Timestamp } = admin.firestore;

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[ăâ]/g, "a")
    .replace(/[î]/g, "i")
    .replace(/[ș]/g, "s")
    .replace(/[ț]/g, "t")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);

function asMillis(ts) {
  if (!ts) return null;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (ts._seconds || ts.seconds) return (ts._seconds || ts.seconds) * 1000;
  return null;
}

function extractConstraints(prompt) {
  const maxWords = prompt?.constraints?.maxWords ?? null;
  const language = prompt?.constraints?.language ?? null;
  const tags = Array.isArray(prompt?.tags) ? prompt.tags : [];
  return { maxWords, language, tags };
}

async function buildChallengeSnapshot(challengeId) {
  const challenge = await challengeModel.findById(challengeId);
  if (!challenge) {
    return { error: "Challenge not found" };
  }

  const isActive = challenge?.availability?.isActive !== false;
  if (!isActive) {
    return { error: "Challenge is not active" };
  }

  const startsAt = challenge?.availability?.schedule?.startsAt || null;
  const endsAt = challenge?.availability?.schedule?.endsAt || null;

  const nowMs = Timestamp.now().toMillis();
  const startMs = asMillis(startsAt);
  const endMs = asMillis(endsAt);

  if (startMs && nowMs < startMs) {
    return { error: "Challenge has not started yet" };
  }

  if (endMs && nowMs > endMs) {
    return { error: "Challenge is closed" };
  }

  return {
    value: {
      id: challenge.id,
      title: challenge.title,
      constraintsSnapshot: extractConstraints(challenge.prompt),
    },
  };
}

const getAllPieces = async (req, res) => {
  try {
    const pieces = await pieceModel.findAll();
    res.status(200).json(pieces);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch pieces" });
  }
};

const getPieceById = async (req, res) => {
  try {
    const piece = await pieceModel.findById(req.params.id);
    if (!piece) {
      return res.status(404).json({ error: "Piece not found" });
    }
    res.status(200).json(piece);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch piece" });
  }
};

const getPieceBySlug = async (req, res) => {
  try {
    const piece = await pieceModel.findBySlug(req.params.slug);
    if (!piece) {
      return res.status(404).json({ error: "Piece not found" });
    }
    res.status(200).json(piece);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch piece" });
  }
};

const createPiece = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array() });
  }

  try {
    const { title, content, classification, challengeId } = req.body;

    const user = await userModel.findByEmail(req.user.email);

    const words = content.body.split(/\s+/).filter(Boolean).length;
    const readingTimeMin = Math.max(1, Math.round(words / 200));

    let challenge = null;
    if (challengeId) {
      const snap = await buildChallengeSnapshot(challengeId);
      if (snap.error) {
        return res.status(400).json({ error: snap.error });
      }
      challenge = snap.value;
    }

    const newPiece = {
      title,
      slug: slugify(title) + "-" + Math.random().toString(36).slice(2, 6),
      content: {
        body: content.body,
        excerpt: content.body.slice(0, 200),
        language: content.language || "ro",
        readingTimeMin
      },
      classification,
      author: {
        id: user.userId,
        displayName: user.profile.displayName,
        username: user.profile.username
      },
      challenge,
      stats: {
        words,
        commentsCount: 0
      },
      commentsPreview: [],
      metadata: {
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: user.userId
      }
    };

    const created = await pieceModel.create(newPiece);
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create piece" });
  }
};

const updatePiece = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array() });
  }

  try {
    const existing = await pieceModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Piece not found" });
    }

    if (
      req.body.challengeId !== undefined ||
      req.body.challenge !== undefined
    ) {
      return res.status(400).json({
        error: "Challenge can only be set when creating a piece"
      });
    }

    const updateData = {};

    if (req.body.title) {
      updateData.title = req.body.title;
      updateData.slug =
        slugify(req.body.title) +
        "-" +
        Math.random().toString(36).slice(2, 6);
    }

    if (req.body.content?.body) {
      const body = req.body.content.body;
      const words = body.split(/\s+/).filter(Boolean).length;

      updateData.content = {
        ...existing.content,
        body,
        excerpt: body.slice(0, 200),
        readingTimeMin: Math.max(1, Math.round(words / 200))
      };

      updateData.stats = {
        ...existing.stats,
        words
      };
    }

    if (req.body.classification) {
      updateData.classification = req.body.classification;
    }

    updateData.metadata = {
      updatedAt: FieldValue.serverTimestamp()
    };

    const updated = await pieceModel.update(req.params.id, updateData);
    res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update piece" });
  }
};


const deletePiece = async (req, res) => {
  try {
    const existing = await pieceModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Piece not found" });
    }

    await pieceModel.remove(req.params.id);
    res.status(200).json({ message: "Piece deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete piece" });
  }
};

module.exports = {
  getAllPieces,
  getPieceById,
  getPieceBySlug,
  createPiece,
  updatePiece,
  deletePiece
};

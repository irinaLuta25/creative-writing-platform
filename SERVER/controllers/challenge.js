const { validationResult } = require("express-validator");
const challengeModel = require("../models/challenge");
const pieceModel = require("../models/piece")
const admin = require("firebase-admin");
const { he } = require("@faker-js/faker");
const { FieldValue, Timestamp } = admin.firestore;

const slugify = (text) =>
  text.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");

const isAdmin = (req) => req.user?.roles?.includes("admin");

const getAllChallenges = async (req, res) => {
  try {
    const challenges = await challengeModel.findAll();
    res.status(200).json(challenges);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch challenges" });
  }
};

const getChallengeById = async (req, res) => {
  try {
    const challenge = await challengeModel.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }
    res.status(200).json(challenge);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch challenge" });
  }
};

const getPiecesForChallenge = async (req, res) => {
  try {
    const challengeId = req.params.id;
    
    const challenge = await challengeModel.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }
    
    const pieces = await pieceModel.findAllByChallengeId(challengeId);
    console.log("got here");
    res.status(200).json(pieces);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch challenge pieces" });
  }
};

const createChallenge = async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: "Admin only" });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array() });
  }

  try {
    const { title, prompt, availability } = req.body;

    const newChallenge = {
      title,
      slug: slugify(title) + "-" + Math.random().toString(36).slice(2, 6),
      prompt,
      availability: {
        isActive: availability?.isActive ?? true,
        schedule: {
          startsAt: availability?.schedule?.startsAt
            ? Timestamp.fromDate(new Date(availability.schedule.startsAt))
            : FieldValue.serverTimestamp(),
          endsAt: availability?.schedule?.endsAt
            ? Timestamp.fromDate(new Date(availability.schedule.endsAt))
            : null
        }
      },
      stats: {
        submissionsCount: 0
      },
      metadata: {
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: req.user.userId
      }
    };

    const created = await challengeModel.create(newChallenge);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Failed to create challenge" });
  }
};

const updateChallenge = async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: "Admin only" });
  }

  try {
    const existing = await challengeModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    const updateData = {
      ...req.body,
      metadata: {
        updatedAt: FieldValue.serverTimestamp()
      }
    };

    const updated = await challengeModel.update(req.params.id, updateData);
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update challenge" });
  }
};

const deleteChallenge = async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: "Admin only" });
  }

  try {
    const existing = await challengeModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    await challengeModel.remove(req.params.id);
    res.status(200).json({ message: "Challenge deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete challenge" });
  }
};

module.exports = {
  getAllChallenges,
  getChallengeById,
  getPiecesForChallenge,
  createChallenge,
  updateChallenge,
  deleteChallenge
};

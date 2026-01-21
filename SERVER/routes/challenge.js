const express = require("express");
const router = express.Router();

const {
  getAllChallenges,
  getChallengeById,
  createChallenge,
  updateChallenge,
  deleteChallenge
} = require("../controllers/challenge");

const { challengeValidator } = require("../validators/challengeValidator");
const { validateToken } = require("../middlewares/auth");

router.get("/", getAllChallenges);
router.get("/:id", getChallengeById);

router.post("/", validateToken, challengeValidator, createChallenge);
router.put("/:id", validateToken, challengeValidator, updateChallenge);
router.delete("/:id", validateToken, deleteChallenge);

module.exports = router;

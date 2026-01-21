const express = require("express");
const router = express.Router();

const {
  getAllPieces,
  getPieceById,
  getPieceBySlug,
  createPiece,
  updatePiece,
  deletePiece
} = require("../controllers/piece");

const {
  getCommentsForPiece,
  createComment,
  deleteComment
} = require("../controllers/comment");

const { pieceValidator } = require("../validators/pieceValidator");
const { commentValidator } = require("../validators/commentValidator");

const { validateToken } = require("../middlewares/auth");
const { requirePieceOwner, requireCommentOwner } = require("../middlewares/ownership");

router.get("/", getAllPieces);
router.get("/slug/:slug", getPieceBySlug);
router.get("/:id", getPieceById);
router.post("/", validateToken, pieceValidator, createPiece);
router.put("/:id", validateToken, requirePieceOwner, pieceValidator, updatePiece);
router.delete("/:id", validateToken, requirePieceOwner, deletePiece);

router.get("/:pieceId/comments", getCommentsForPiece);
router.post("/:pieceId/comments", validateToken, commentValidator, createComment);
router.delete(
  "/:pieceId/comments/:commentId",
  validateToken,
  requireCommentOwner,
  deleteComment
);

module.exports = router;

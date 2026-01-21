const piecesModel = require("../models/piece")
const commentsModel = require("../models/comment")

async function requirePieceOwner(req, res, next) {
  try {
    const pieceId = req.params.id;
    const piece = await piecesModel.findById(pieceId);

    if (!piece) {
      return res.status(404).json({ error: "Piece not found" });
    }

    const ownerId = piece.author?.id;

    if (!ownerId || ownerId !== req.user.userId) {
      return res.status(403).json({ error: "You are not allowed to modify this piece" });
    }

    req.piece = piece;

    next();
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}

async function requireCommentOwner(req, res, next) {
  try {
    const { pieceId, commentId } = req.params;

    const comment = await commentsModel.findById(pieceId, commentId);

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const ownerId = comment.author?.id;

    if (!ownerId || ownerId !== req.user.userId) {
      return res.status(403).json({ error: "You are not allowed to modify this comment" });
    }

    req.comment = comment;
    next();
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.message });
  }
} 

module.exports = { requirePieceOwner, requireCommentOwner };

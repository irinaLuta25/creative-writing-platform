const { validationResult } = require("express-validator");
const commentModel = require("../models/comment");
const pieceModel = require("../models/piece");
const userModel = require("../models/user");
const admin = require("firebase-admin");
const { FieldValue } = admin.firestore;

const getCommentsForPiece = async (req, res) => {
  try {
    const piece = await pieceModel.findById(req.params.pieceId);
    if (!piece) {
      return res.status(404).json({ error: "Piece not found" });
    }

    const comments = await commentModel.findAllForPiece(req.params.pieceId);
    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

const createComment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array() });
  }

  try {
    const piece = await pieceModel.findById(req.params.pieceId);
    if (!piece) {
      return res.status(404).json({ error: "Piece not found" });
    }

    const user = await userModel.findByEmail(req.user.email);

    const newComment = {
      author: {
        id: user.userId,
        displayName: user.profile.displayName,
        username: user.profile.username
      },
      content: {
        text: req.body.content.text,
        mentions: req.body.content.mentions || []
      },
      moderation: {
        status: "visible"
      },
      metadata: {
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: user.userId
      }
    };

    const created = await commentModel.create(req.params.pieceId, newComment);

    await pieceModel.update(req.params.pieceId, {
      stats: {
        commentsCount: admin.firestore.FieldValue.increment(1)
      }
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Failed to create comment" });
  }
};

const deleteComment = async (req, res) => {
  try {
    const comment = await commentModel.findById(
      req.params.pieceId,
      req.params.commentId
    );

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    await commentModel.remove(req.params.pieceId, req.params.commentId);

    await pieceModel.update(req.params.pieceId, {
      stats: {
        commentsCount: admin.firestore.FieldValue.increment(-1)
      }
    });

    res.status(200).json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete comment" });
  }
};

module.exports = {
  getCommentsForPiece,
  createComment,
  deleteComment
};

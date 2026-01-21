const db = require("../config/db");

function commentsSubcollection(pieceId) {
  return db.collection("pieces").doc(pieceId).collection("comments");
}

const findById = async (pieceId, commentId) => {
  const doc = await commentsSubcollection(pieceId).doc(commentId).get();
  if (!doc.exists) {
    return null;
  }
  return {
    id: doc.id,
    ...doc.data(),
  };
};

const findAllForPiece = async (pieceId, limit = 50) => {
  const snapshot = await commentsSubcollection(pieceId)
    .orderBy("metadata.createdAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

const create = async (pieceId, commentData) => {
  const docRef = commentsSubcollection(pieceId).doc();
  await docRef.set({ commentId: docRef.id, ...commentData });
  const snap = await docRef.get();
  return {
    id: snap.id,
    ...snap.data(),
  };
};

const update = async (pieceId, commentId, updateData) => {
  const docRef = commentsSubcollection(pieceId).doc(commentId);
  await docRef.set(updateData, { merge: true });
  const snap = await docRef.get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
};

const remove = async (pieceId, commentId) => {
  await commentsSubcollection(pieceId).doc(commentId).delete();
};

module.exports = { findById, findAllForPiece, create, update, remove };

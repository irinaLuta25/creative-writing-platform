const {db} = require("../config/db");
const admin = require("firebase-admin");
const { FieldValue } = admin.firestore;

const piecesCollection = db.collection("pieces");

const findById = async (id) => {
  const doc = await piecesCollection.doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

const findAll = async () => {
  const snapshot = await piecesCollection.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const findBySlug = async (slug) => {
  const snapshot = await piecesCollection.where("slug", "==", slug).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};

const create = async (pieceData) => {
  const docRef = piecesCollection.doc();
  const pieceId = docRef.id;

  await docRef.set({
    pieceId,
    ...pieceData,
    metadata: {
      ...(pieceData.metadata || {}),
      createdAt: pieceData?.metadata?.createdAt || FieldValue.serverTimestamp(),
      updatedAt: pieceData?.metadata?.updatedAt || FieldValue.serverTimestamp(),
    },
  });

  const createdDoc = await docRef.get();
  return { id: createdDoc.id, ...createdDoc.data() };
};

const update = async (id, updateData) => {
  const docRef = piecesCollection.doc(id);

  await docRef.set(
    {
      ...updateData,
      metadata: {
        ...(updateData.metadata || {}),
        updatedAt: FieldValue.serverTimestamp(),
      },
    },
    { merge: true }
  );

  const updatedDoc = await docRef.get();
  return updatedDoc.exists ? { id: updatedDoc.id, ...updatedDoc.data() } : null;
};

const remove = async (id) => {
  await piecesCollection.doc(id).delete();
};

const updateStats = async (pieceId, statsPatch) => {
  await piecesCollection.doc(pieceId).set(
    {
      stats: statsPatch,
      metadata: { updatedAt: FieldValue.serverTimestamp() },
    },
    { merge: true }
  );
};

module.exports = {
  findAll,
  findById,
  findBySlug,
  create,
  update,
  remove,
  updateStats,
};

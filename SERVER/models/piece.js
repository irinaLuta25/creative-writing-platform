const db = require("../config/db");

const piecesCollection = db.collection('pieces');

const findById = async (id) => {
    const doc = await piecesCollection.doc(id).get();

    if(!doc.exists) {
        return null;
    }

    return {
        id: doc.id,
        ...doc.data()
    };
}

const findAll = async () => {
    const snapshot = await piecesCollection.get();
    const pieces = [];

    snapshot.forEach(doc => {
        pieces.push({
            id:doc.id,
            ...doc.data()
        })
    });

    return pieces;
}

const create = async (pieceData) => {
    const docRef = await piecesCollection.add(pieceData);
    return docRef;
}

const update = async (id, updateData) => {
    const docRef = await piecesCollection.doc(id);
    await docRef.update(updateData);

    const updatedDoc = await docRef.get();
    return {
        id: updatedDoc.id,
        ...updatedDoc.data()
    };
}

const remove = async (id) => {
    const docRef = await piecesCollection.doc(id);
    await docRef.delete();
}

const findBySlug = async (slug) => {
  const snapshot = await piecesCollection.where("slug", "==", slug).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};

const updateStats = async (pieceId, statsPatch) => {
  await piecesCollection.doc(pieceId).set({ stats: statsPatch }, { merge: true });
};

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove,
    findBySlug,
    updateStats
};
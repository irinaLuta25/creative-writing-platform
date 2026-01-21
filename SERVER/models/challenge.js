const db = require("../config/db");

const challengesCollection = db.collection('challenges');

const findById = async (id) => {
    const doc = await challengesCollection.doc(id).get();

    if(!doc.exists) {
        return null;
    }

    return {
        id: doc.id,
        ...doc.data()
    };
}

const findAll = async () => {
    const snapshot = await challengesCollection.get();
    const challenges = [];

    snapshot.forEach(doc => {
        challenges.push({
            id:doc.id,
            ...doc.data()
        })
    });

    return challenges;
}

const create = async (challengeData) => {
    const docRef = await challengesCollection.add(challengeData);
    return docRef;
}

const update = async (id, updateData) => {
    const docRef = await challengesCollection.doc(id);
    await docRef.update(updateData);

    const updatedDoc = await docRef.get();
    return {
        id: updatedDoc.id,
        ...updatedDoc.data()
    };
}

const remove = async (id) => {
    const docRef = await challengesCollection.doc(id);
    await docRef.delete();
}

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove
};
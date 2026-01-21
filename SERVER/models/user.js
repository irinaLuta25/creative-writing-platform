const {db} = require("../config/db");
const { comparePassword } = require("../auth");

const usersCollection = db.collection("users");
const findByEmail = async (email) => {
  const snapshot = await usersCollection
    .where("auth.email", "==", email)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const userDoc = snapshot.docs[0];

  return {
    userId: userDoc.id,
    ...userDoc.data()
  };
};

const checkEmailExists = async (email) => {
  const snapshot = await usersCollection
    .where("auth.email", "==", email)
    .limit(1)
    .get();

  return !snapshot.empty;
};

const create = async (userData) => {
  const docRef = await usersCollection.add({
    ...userData
  });
  return docRef.id;
};

const verifyPassword = async (plainPassword, passwordHash) => {
  return await comparePassword(plainPassword, passwordHash);
};

module.exports = {
  findByEmail,
  checkEmailExists,
  create,
  verifyPassword
};

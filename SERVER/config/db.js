var admin = require("firebase-admin");

var serviceAccount = require("./serviceAccount.json");

function initializeFirestore() {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://creative-writing-40169-default-rtdb.europe-west1.firebasedatabase.app"
    });

    return admin.firestore();
}

const db = initializeFirestore();

module.exports = {db};




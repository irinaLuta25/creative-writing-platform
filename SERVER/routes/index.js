const express = require('express')
const router = express.Router()

const userRouter = require("./user")
const pieceRouter = require("./piece")
const challengeRouter = require("./challenge")

router.use("/user", userRouter);
router.use("/piece", pieceRouter);
router.use("/challenge", challengeRouter);

module.exports = router;
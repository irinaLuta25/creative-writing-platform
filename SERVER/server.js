require("dotenv").config();
const {logger} = require('./middlewares/logger');

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT;

app.use(logger);

app.use(cors());
app.use(express.json());

const router = require("./routes");
app.use("/api",router);

app.get("/", (req, res) => {
  res.send("Works!");
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})

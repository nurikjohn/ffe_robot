require("dotenv").config();

const db = require("./db");
const bot = require("./bot");

db.connect();
bot.launch().then(() => console.log("STARTED"));

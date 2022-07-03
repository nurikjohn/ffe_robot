require("dotenv").config();

const mongoose = require("mongoose");

mongoose.connection.once("open", () => {
    console.log("DATABASE CONNECTED");
});

module.exports = {
    connect: (cb) =>
        mongoose.connect(
            process.env.MONGO_URL,
            {
                autoIndex: true,
                useNewUrlParser: true,
                useUnifiedTopology: true,
            },
            (error) => {
                if (error) {
                    console.log("DATABASE CONNECTION ERROR: ", error);
                    process.exit(1);
                }

                cb?.();
            }
        ),
};

const { model, Schema } = require("mongoose");

const schema = new Schema(
    {
        first_name: {
            type: String,
        },
        last_name: {
            type: String,
        },
        telegram_user_id: {
            type: Number,
        },
        telegram_username: {
            type: String,
        },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

module.exports = model("User", schema);

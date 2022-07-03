const { model, Schema } = require("mongoose");

const schema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        grade: {
            type: Number,
            default: 3,
        },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

module.exports = model("Subject", schema);

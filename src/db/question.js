const { model, Schema } = require("mongoose");

const schema = new Schema(
    {
        question: {
            type: String,
            required: true,
        },
        options: [
            {
                type: String,
                required: true,
            },
        ],
        correct_option_id: {
            type: Number,
            required: true,
        },
        subject: {
            type: Schema.Types.ObjectId,
            ref: "Subject",
        },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

module.exports = model("Question", schema);

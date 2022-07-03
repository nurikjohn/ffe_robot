const { model, Schema } = require("mongoose");

const schema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        subject: {
            type: Schema.Types.ObjectId,
            ref: "Subject",
        },
        questions: [
            {
                question: {
                    type: Schema.Types.ObjectId,
                    ref: "Question",
                },
                telegram_poll_id: String,
                correct: {
                    type: Boolean,
                },
                correct_option_id: Number,
            },
        ],
        is_completed: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

module.exports = model("Session", schema);

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
        public: {
            type: Boolean,
            default: false,
        },
        allowed_users: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

module.exports = model("Subject", schema);

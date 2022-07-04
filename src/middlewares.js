const Question = require("./db/question");
const User = require("./db/user");

exports.session = (ctx, next) => {
    ctx.session = ctx.session || {};

    next();
};

exports.activeUser = async (ctx, next) => {
    const tgUser =
        ctx.message?.chat ?? ctx.callbackQuery?.from ?? ctx.pollAnswer?.user;

    if (tgUser) {
        const user = await User.findOneAndUpdate(
            { telegram_user_id: tgUser.id },
            {
                first_name: tgUser.first_name,
                last_name: tgUser.last_name,
                telegram_username: tgUser.username,
                telegram_user_id: tgUser.id,
            },
            {
                upsert: true,
                new: true,
            }
        );

        ctx.session.user = user;

        next();
    }
};

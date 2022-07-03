require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const dayjs = require("dayjs");
const _ = require("lodash");

const { activeUser, session } = require("./middlewares");
const Subject = require("./db/subject");
const Session = require("./db/session");
const Question = require("./db/question");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(session);
bot.use(activeUser);

const QUESTIONS_COUNT = 25;
const MAX_BALL = 50;

const getRandomQuestion = async (excludedDocuments = []) => {
    const query = {
        _id: {
            $nin: excludedDocuments,
        },
    };

    const questionsCount = await Question.countDocuments(query);
    const question = await Question.findOne(query).skip(
        Math.floor(Math.random() * questionsCount)
    );

    return question;
};

bot.start(async (ctx) => {
    const subjects = await Subject.find();

    ctx.reply(
        `Fan tanlang

O'quv yili: 2021-2022
Kurs: 3`,
        Markup.inlineKeyboard(
            subjects.map((subject) => [
                {
                    text: subject.name,
                    callback_data: `subject_${subject._id}`,
                },
            ])
        )
    );
});

bot.command("stop", async (ctx) => {
    const user = ctx.session.user;

    await Session.updateMany(
        {
            user: user._id,
            is_completed: false,
        },
        {
            is_completed: true,
        }
    );

    ctx.reply(`Boshlangan barcha testlar yakunlandi.

Qaytadan test ishlash uchun /start ni bosing.`);
});

bot.action(/subject_(.+)/, async (ctx) => {
    ctx.answerCbQuery();

    const subjectId = ctx.match?.[1];

    const subject = await Subject.findById(subjectId);

    ctx.reply(
        `Fan: ${subject.name}
Savollar soni: ${QUESTIONS_COUNT} ta
Ajratilgan vaqt: 60 daqiqa`,
        Markup.inlineKeyboard([
            [
                {
                    text: "Boshlash",
                    callback_data: `start_${subject._id}`,
                },
            ],
        ])
    );
});

bot.action(/start_(.+)/, async (ctx) => {
    const user = ctx.session.user;

    const subjectId = ctx.match?.[1];

    let session = await Session.findOne({
        user: user._id,
        is_completed: false,
    });

    if (session) {
        return ctx.reply(
            `Sizda oldinroq boshlangan test mavjud, testni yakunlagach qaytadan boshlashingiz mumkun!

Oldinroq boshlangan testlarni yakunlash uchun /stop buyrug'ini yuborishingiz mumkun`
        );
    }

    const question = await getRandomQuestion();

    if (question) {
        ctx.answerCbQuery();
        ctx.editMessageReplyMarkup();

        const options = _.shuffle(question.options);
        const correctOptionId = options.indexOf(
            question.options[question.correct_option_id]
        );

        const quiz = await ctx.replyWithQuiz(
            `1. ${question.question}`,
            options.map((option) => option.slice(0, 100)),
            {
                correct_option_id: correctOptionId,
                is_anonymous: false,
            }
        );

        await Session.create({
            user: user._id,
            subject: subjectId,
            questions: [
                {
                    question: question._id,
                    telegram_poll_id: quiz.poll.id,
                    correct_option_id: correctOptionId,
                },
            ],
        });
    } else {
        ctx.answerCbQuery(
            `Kechirasiz, afsuski bu fanga tegishli savollar topilmadi :(`,
            { show_alert: true }
        );
    }
});

bot.on("poll_answer", async (ctx) => {
    const user = ctx.session.user;
    const poll = ctx.pollAnswer;

    let session = await Session.findOne({
        user: user._id,
        is_completed: false,
    }).populate("questions.question");

    const question = session.questions.find(
        ({ telegram_poll_id }) => telegram_poll_id == poll.poll_id
    );

    if (question) {
        const isCorrectAnswer =
            question.correct_option_id == poll.option_ids[0];

        session = await Session.findOneAndUpdate(
            {
                _id: session._id,
                "questions._id": question._id,
            },
            {
                $set: {
                    "questions.$.correct": isCorrectAnswer,
                },
            },
            {
                new: true,
            }
        );

        if (session.questions.length >= QUESTIONS_COUNT) {
            const correctAnswersCount = session.questions?.filter(
                ({ correct }) => correct
            ).length;

            const incorrectAnswersCount =
                session.questions.length - correctAnswersCount;

            const startTime = dayjs(session.created_at);
            const endTime = dayjs(session.updated_at);

            const mins = endTime.diff(startTime, "minutes", true);
            const hours = parseInt(mins / 60)
                .toString()
                .padStart(2, "0");
            const minutes = dayjs().minute(mins).$m.toString().padStart(2, "0");

            ctx.telegram.sendMessage(
                user.telegram_user_id,
                `Ball: ${
                    (correctAnswersCount * MAX_BALL) / QUESTIONS_COUNT
                } (${((correctAnswersCount / QUESTIONS_COUNT) * 100).toFixed(
                    2
                )}%)
To'g'ri javoblar: ${correctAnswersCount}
Xato javoblar: ${incorrectAnswersCount}

Sarflangan vaqt: ${hours}:${minutes}`,
                Markup.inlineKeyboard([
                    [
                        {
                            text: "Qayta urinib ko'rish",
                            callback_data: `start_${session.subject}`,
                        },
                    ],
                ])
            );

            await Session.findByIdAndUpdate(session._id, {
                is_completed: true,
            });
        } else {
            const nextQuestion = await getRandomQuestion(
                session.questions?.map(({ question }) => question._id)
            );

            const options = _.shuffle(nextQuestion.options);
            const correctOptionId = options.indexOf(
                nextQuestion.options[nextQuestion.correct_option_id]
            );

            const quiz = await ctx.telegram.sendQuiz(
                user.telegram_user_id,
                `${session.questions?.length + 1}. ${nextQuestion.question}`,
                options.map((option) => option.slice(0, 100)),
                {
                    correct_option_id: correctOptionId,
                    is_anonymous: false,
                }
            );

            await Session.findByIdAndUpdate(session._id, {
                $push: {
                    questions: {
                        question: nextQuestion._id,
                        telegram_poll_id: quiz.poll.id,
                        correct_option_id: correctOptionId,
                    },
                },
            });
        }
    }
});

module.exports = bot;

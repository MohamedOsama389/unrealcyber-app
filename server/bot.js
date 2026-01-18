const { Telegraf, Markup } = require('telegraf');
const cron = require('node-cron');
const bcrypt = require('bcryptjs');

const sessions = {}; // In-memory session state for login flow

function initBot(db) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        console.error("TELEGRAM_BOT_TOKEN not found in environment variables. Bot disabled.");
        return;
    }

    const bot = new Telegraf(token);
    const siteUrl = process.env.SITE_BASE_URL || "https://unrealcyberacademy.up.railway.app";

    const SUBJECTS = ['arabic', 'social_studies', 'geometry', 'english', 'general'];

    // --- HELPERS ---

    const saveUser = (ctx) => {
        const { id, username, first_name } = ctx.from;
        db.prepare(`
            INSERT OR IGNORE INTO telegram_users (telegram_id, username, first_name) 
            VALUES (?, ?, ?)
        `).run(String(id), username || null, first_name || null);
    };

    const getLinkedUser = (telegramId) => {
        const teleUser = db.prepare('SELECT * FROM telegram_users WHERE telegram_id = ?').get(String(telegramId));
        if (teleUser && teleUser.website_user_id) {
            return db.prepare('SELECT * FROM users WHERE id = ?').get(teleUser.website_user_id);
        }
        return null;
    };
    const convertTo24h = (timeStr) => {
        // Handle HH:mm AM/PM
        const match12 = timeStr.match(/^(\d{1,2})[:.](\d{2})\s*(AM|PM)$/i);
        if (match12) {
            let [_, hours, minutes, ampm] = match12;
            hours = parseInt(hours);
            if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
            if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
            return `${String(hours).padStart(2, '0')}:${minutes}`;
        }

        // Handle pure 24h format (HH:mm)
        const match24 = timeStr.match(/^([01]\d|2[0-3])[:.]?([0-5]\d)$/);
        if (match24) {
            return `${match24[1]}:${match24[2]}`;
        }

        return null;
    };

    const convertTo12h = (time24h) => {
        if (!time24h) return "Not set";
        let [hours, minutes] = time24h.split(':');
        hours = parseInt(hours);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    };

    function sendMission(chatOrCtx, mission) {
        const telegramId = chatOrCtx.chat ? chatOrCtx.chat.id : chatOrCtx;
        const linkedUser = getLinkedUser(telegramId);
        const name = linkedUser ? linkedUser.username : "Student";

        const message = `🚀 *Mission for ${name}*\n\n` +
            `📚 *Subject:* ${mission.subject.toUpperCase()}\n` +
            `🎯 *Mission:* ${mission.title}\n\n` +
            `📝 *Brief:* ${mission.notes || 'No specific notes.'}\n\n` +
            `🔗 [Access Resources](${mission.drive_link || siteUrl + '/tasks'})\n` +
            `🌍 [Open Mission Center](${siteUrl}/tasks)`;

        if (chatOrCtx.reply) {
            chatOrCtx.replyWithMarkdown(message);
        } else {
            bot.telegram.sendMessage(chatOrCtx, message, { parse_mode: 'Markdown' }).catch(e => console.error("Error sending mission:", e));
        }
    }

    // --- COMMANDS ---

    bot.start((ctx) => {
        saveUser(ctx);
        const linkedUser = getLinkedUser(ctx.from.id);

        if (linkedUser) {
            ctx.reply(`Welcome back, ${linkedUser.username}! 🛡️\n\nYour account is linked. Use /time to change reminder settings.`);
        } else {
            ctx.reply(`Welcome to Unreal Cyber Academy Bot! 🛡️\n\nPlease link your website account to receive daily missions.\n\nUse /login to start.`);
        }
    });

    bot.command('login', (ctx) => {
        sessions[ctx.from.id] = { step: 'username' };
        ctx.reply("Please enter your website username:");
    });

    bot.command('logout', (ctx) => {
        db.prepare('UPDATE telegram_users SET website_user_id = NULL WHERE telegram_id = ?').run(String(ctx.from.id));
        ctx.reply("Logged out. Your Telegram is no longer linked to your website account.");
    });

    bot.command('time', (ctx) => {
        sessions[ctx.from.id] = { step: 'time' };
        ctx.reply("What time would you like to receive daily missions? (Format HH:mm AM/PM, e.g., 06:00 PM)");
    });

    bot.command('mission', (ctx) => {
        const mission = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC LIMIT 1').get();
        if (mission) {
            sendMission(ctx, mission);
        } else {
            ctx.reply("No missions available.");
        }
    });

    bot.command('summary', (ctx) => {
        sendWeeklySummaryToUser(ctx.from.id);
    });

    // --- MESSAGE HANDLER ---

    bot.on('text', async (ctx) => {
        const session = sessions[ctx.from.id];
        if (!session) return;

        const text = ctx.message.text.trim();

        if (session.step === 'username') {
            const user = db.prepare('SELECT * FROM users WHERE username = ?').get(text);
            if (!user) return ctx.reply("User not found. Try /login again.");
            session.username = text;
            session.step = 'password';
            ctx.reply("Enter your password:");
        }
        else if (session.step === 'password') {
            const user = db.prepare('SELECT * FROM users WHERE username = ?').get(session.username);
            const valid = bcrypt.compareSync(text, user.password);

            if (valid) {
                db.prepare('UPDATE telegram_users SET website_user_id = ? WHERE telegram_id = ?').run(user.id, String(ctx.from.id));
                // Auto-subscribe to all subjects
                SUBJECTS.forEach(sub => {
                    db.prepare('INSERT OR IGNORE INTO telegram_subscriptions (telegram_id, subject) VALUES (?, ?)').run(String(ctx.from.id), sub);
                });

                session.step = 'time';
                ctx.reply(`✅ Linked as *${user.username}*!\n\nNow, tell me what time should I remind you about your daily missions?\n(Use format HH:mm AM/PM, e.g., 07:30 AM)`, { parse_mode: 'Markdown' });
            } else {
                delete sessions[ctx.from.id];
                ctx.reply("❌ Invalid password. Use /login to try again.");
            }
        }
        else if (session.step === 'time') {
            const time24 = convertTo24h(text);
            if (time24) {
                db.prepare('UPDATE telegram_subscriptions SET reminder_time = ? WHERE telegram_id = ?').run(time24, String(ctx.from.id));
                delete sessions[ctx.from.id];
                ctx.reply(`✅ All set! I'll remind you at ${text} every day. 🥋`);
            } else {
                ctx.reply("Invalid format. Please use HH:mm AM/PM (e.g., 06:00 PM).");
            }
        }
    });

    // --- CALLBACKS ---

    bot.action(/done_(.+)/, async (ctx) => {
        const missionId = ctx.match[1];
        const telegramId = String(ctx.from.id);
        const mission = db.prepare('SELECT * FROM tasks WHERE id = ?').get(missionId);

        if (!mission) return ctx.answerCbQuery("Mission not found.");
        db.prepare('INSERT OR IGNORE INTO telegram_completions (telegram_id, subject, mission_id) VALUES (?, ?, ?)').run(telegramId, mission.subject, missionId);

        await ctx.answerCbQuery("Progress saved!");
        ctx.editMessageText(ctx.callbackQuery.message.text + "\n\n✅ *Status: Completed*", { parse_mode: 'Markdown' });
    });

    // --- CRON JOBS ---

    // Dynamic Daily Reminders (Runs every minute to check if any user needs a reminder)
    cron.schedule('* * * * *', () => {
        const now = new Date();
        const fmt = new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Cairo'
        });
        const parts = fmt.formatToParts(now);
        const hour = parts.find(p => p.type === 'hour').value;
        const minute = parts.find(p => p.type === 'minute').value;
        const currentTime = `${hour}:${minute}`;

        // Get unique users who have a reminder set for this minute
        const usersToRemind = db.prepare(`
            SELECT DISTINCT telegram_id 
            FROM telegram_subscriptions 
            WHERE reminder_time = ? AND enabled = 1
        `).all(currentTime);

        if (usersToRemind.length > 0) {
            console.log(`[Bot] ${usersToRemind.length} users scheduled for ${currentTime}`);

            // Get the absolute latest mission as the "Daily Mission"
            const mission = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC LIMIT 1').get();

            if (mission) {
                for (const user of usersToRemind) {
                    const tid = user.telegram_id;
                    const done = db.prepare('SELECT * FROM telegram_completions WHERE telegram_id = ? AND mission_id = ?').get(tid, mission.id);

                    if (!done) {
                        console.log(`[Bot] Sending daily mission reminder to ${tid}: ${mission.title}`);
                        sendMission(tid, mission);
                    } else {
                        // console.log(`[Bot] User ${tid} already completed the latest mission.`);
                    }
                }
            } else {
                console.warn("[Bot] No missions found in database to send as reminder.");
            }
        }
    });

    // Weekly Summary at Sunday 20:00
    cron.schedule('0 20 * * 0', () => {
        const users = db.prepare('SELECT telegram_id FROM telegram_users').all();
        for (const user of users) {
            sendWeeklySummaryToUser(user.telegram_id);
        }
    }, { timezone: "Africa/Cairo" });

    function sendWeeklySummaryToUser(telegramId) {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const dateStr = lastWeek.toISOString();

        const linkedUser = getLinkedUser(telegramId);
        const name = linkedUser ? linkedUser.username : "Student";

        const completions = db.prepare(`
            SELECT tc.*, t.title 
            FROM telegram_completions tc 
            JOIN tasks t ON tc.mission_id = t.id 
            WHERE tc.telegram_id = ? AND tc.completed_at > ?
        `).all(String(telegramId), dateStr);

        if (completions.length === 0) {
            bot.telegram.sendMessage(telegramId, `📊 *Weekly Summary for ${name}*\n\nYou haven't completed any missions this week. Let's aim high next week! 🚀`, { parse_mode: 'Markdown' });
            return;
        }

        const stats = {};
        completions.forEach(c => { stats[c.subject] = (stats[c.subject] || 0) + 1; });

        let statsText = "";
        for (const [sub, count] of Object.entries(stats)) {
            statsText += `🔹 ${sub.toUpperCase()}: ${count} missions\n`;
        }

        const titles = completions.map(c => `- ${c.title}`).join('\n');

        const summaryMsg = `📊 *Weekly Power Report for ${name}*\n\n` +
            `🔥 *Success Level:* ${completions.length} missions completed!\n\n` +
            `${statsText}\n` +
            `📜 *Completed Missions:*\n${titles}\n\n` +
            `Keep building your streak in the Mission Center! 🥋\n` +
            `🌍 ${siteUrl}/tasks`;

        bot.telegram.sendMessage(telegramId, summaryMsg, { parse_mode: 'Markdown' });
    }

    // --- EXTERNAL NOTIFICATIONS ---

    bot.sendCongrats = (telegramId, taskTitle, rating = 0, notes = "") => {
        const stars = "⭐".repeat(rating) || "Approved";
        const msg = `🎉 *CONGRATULATIONS!* 🏆\n\n` +
            `Your submission for mission "*${taskTitle}*" has been approved by the Commander!\n\n` +
            `🔥 *Performance:* ${stars}\n` +
            (notes ? `💬 *Commander Notes:* _${notes}_\n\n` : "") +
            `Excellent work, keep it up! 🛡️`;
        return bot.telegram.sendMessage(telegramId, msg, { parse_mode: 'Markdown' });
    };

    bot.sendDenial = (telegramId, taskTitle, reason) => {
        const msg = `❌ *MISSION UPDATE*\n\nYour submission for "*${taskTitle}*" needs improvement.\n\n📝 *Commander's Feedback:* ${reason}\n\nPlease check the Mission Center and try again! 🥋`;
        return bot.telegram.sendMessage(telegramId, msg, { parse_mode: 'Markdown' });
    };

    bot.launch();
    console.log("Telegram Bot v2.0 Initialized (12h format & Proactive flow)");

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

    return bot;
}

module.exports = { initBot };

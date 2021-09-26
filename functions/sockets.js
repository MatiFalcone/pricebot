const { io } = require("../server/server");

// SOCKETS MANAGEMENT
io.on("connection", client => {

  client.on("sendScreenshot", (data) => {

    const bot = require("../server/pricebot");

    bot.sendPhoto(data.chatId, data.url, { caption: data.caption, parse_mode: "Markdown" });

  });

});

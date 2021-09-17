const { io } = require("../server/server");
const getMaticPrice = require("../server/query/matic_price");

// SOCKETS MANAGEMENT
io.on("connection", client => {

  client.on("sendScreenshot", (data) => {

    const bot = require("../server/pricebot");

    bot.sendPhoto(data.chatId, data.url, { caption: data.caption, parse_mode: "Markdown" });

  });

});

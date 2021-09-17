var socket = io();

socket.on("connect", function() {

    console.log("Connected to pricebot backend.");

    // escuchar
    socket.on("getScreenshot", function(data) {

        console.log("The pricebot backend is asking for a screenshot.");
        console.log("Token Address: ", data.tokenAddress);
        console.log("Chart Type: ", data.chartType);
        console.log("Chat ID: ", data.chatId);
        console.log("Caption: ", data.caption);

        socket.emit("sendScreenshot", {url: "https://www.tradingview.com/x/zWnsQz2y/", chatId: data.chatId, caption: data.caption });

    });

    // escuchar
    socket.on("disconnect", function() {

        console.log("Disconnected from pricebot backend.");

    });

});


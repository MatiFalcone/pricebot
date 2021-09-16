var socket = io();

socket.on("connect", function() {

    console.log("Connected to pricebot backend.");

});

// escuchar
socket.on("disconnect", function() {

    console.log("Disconnected from pricebot backend.");

});

// escuchar
socket.on("getScreenshot", function(data) {

    console.log("The pricebot backend is asking for a screenshot.");
    console.log("Token Address: ", data.tokenAddress);
    console.log("Chart Type: ", data.chartType);
    console.log("Chart Type: ", data.chatId);

});

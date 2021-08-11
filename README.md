PolyTools Backend
-----------------

This is the first version of the PolyTools backend.

At the moment, it has the following functionality:

1. getTokenInfo: retrieves the information of the token address specified in :token using WMATIC as quote currency.

2. getLastTrades: retrieves the last 5 QuickSwap trades of the token address specified in :token

3. OHLC data: retrieves OHLC data from the last 10 QuickSwap trades of :token (using startTime/endTime range)

All the information is obtained from MATIC network, using BitQuery GraphQL.
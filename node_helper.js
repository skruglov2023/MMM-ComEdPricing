const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
    start: function() {
        console.log("Starting node_helper for module: " + this.name);
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "FETCH_DATA") {
            this.fetchData();
        }
    },

    async fetchData() {
        try {
            const responses = await Promise.all([
                fetch("https://hourlypricing.comed.com/api?type=5minutefeed").then(res => res.json()),
                fetch("https://hourlypricing.comed.com/api?type=currenthouraverage").then(res => res.json())
            ]);

            const current5MinPrice = parseFloat(responses[0][0].price);
            const last5MinPrice = parseFloat(responses[0][1].price);
            const currentHourPrice = parseFloat(responses[1][0].price);
	    const currentTime = parseFloat(responses[0][0].millisUTC);
            this.sendSocketNotification("DATA_FETCHED", { current5MinPrice, last5MinPrice, currentHourPrice, currentTime});
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }
});

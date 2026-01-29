Module.register("MMM-ComEdPricing", {
    defaults: {
        updateInterval: 300000, // 5 minutes
    },

    getStyles: function() {
        return ["MMM-ComEdPricing.css"];
    },

    start: function() {
        this.current5MinPrice = null;
        this.last5MinPrice = null;
        this.currentHourPrice = null;
	this.currentTime = null;
        this.sendSocketNotification("FETCH_DATA");
        setInterval(() => {
            this.sendSocketNotification("FETCH_DATA");
        }, this.config.updateInterval);
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "DATA_FETCHED") {
            this.last5MinPrice = this.current5MinPrice;
            this.current5MinPrice = payload.current5MinPrice;
            this.currentHourPrice = payload.currentHourPrice;
	    	this.currentTime = new Date(payload.currentTime);
            this.updateDom();
			this.sendNotification("COMED_DATA_BROADCAST", payload);
        }
    },

    getDom: function() {
        let wrapper = document.createElement("div");
        if (this.current5MinPrice !== null && this.currentHourPrice !== null) {
            let priceElement = document.createElement("div");
            priceElement.innerHTML = `Current 5-Min Price: ${this.current5MinPrice}¢/kWh`;

            let hourPriceElement = document.createElement("div");
            hourPriceElement.innerHTML = `Current Hour Avg Price: ${this.currentHourPrice}¢/kWh`;

            let arrowElement = document.createElement("div");
            if (this.last5MinPrice !== null) {
                if ((this.current5MinPrice > this.last5MinPrice) && (this.current5MinPrice > 4.0)) {
                    arrowElement.innerHTML = "&#9650;"; // Up arrow
                    arrowElement.style.color = "red";
                } else if (this.current5MinPrice < this.last5MinPrice) {
                    arrowElement.innerHTML = "&#9660;"; // Down arrow
                    arrowElement.style.color = "green";
                } else {
                    arrowElement.innerHTML = "&#9654;"; // Right arrow
                    arrowElement.style.color = "gray";
                }
            }

	    let timeOfData = document.createElement("div");
	    timeOfData.innerHTML = `Data as of: ${this.currentTime.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' })}`;
	    timeOfData.style.fontSize = "small";

            wrapper.appendChild(priceElement);
            wrapper.appendChild(hourPriceElement);
            wrapper.appendChild(arrowElement);
	    wrapper.appendChild(timeOfData);
        } else {
            wrapper.innerHTML = "Loading...";
        }
        return wrapper;
    }
});

Module.register("MMM-ComEdPricing", {
    defaults: {
        updateInterval: 300000, // 5 minutes
		timeOfDayRates: {
        offPeak: 3.291,   // cents/kWh (example)
        morning: 4.401,
        peak: 11.654,
        evening: 4.117
    },

    timePeriods: {
        offPeak: [21, 6],    // 9 PM - 6 AM
        morning: [6, 1],   // 6 AM - 1 PM
        peak: [13, 19],     // 1 PM - 7 PM
        evening: [19, 21]   // 7 PM - 9 PM
    }
    },
	getTimePeriod: function(hour) {
    const periods = this.config.timePeriods;

    for (let key in periods) {
        const [start, end] = periods[key];

        if (start < end) {
            if (hour >= start && hour < end) return key;
        } else {
            // Handles wrap-around (like 21 → 6)
            if (hour >= start || hour < end) return key;
        }
    }

    return "offPeak"; // fallback
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

    if (this.current5MinPrice !== null && this.currentHourPrice !== null && this.currentTime !== null) {

        // Determine time period
        let hour = this.currentTime.getHours();
        let period = this.getTimePeriod(hour);
        let deliveryRate = this.config.timeOfDayRates[period];
        let totalPrice = this.current5MinPrice + deliveryRate;

        // 5-min price (color via CSS)
        let priceElement = document.createElement("div");
        priceElement.innerHTML = `Current 5-Min Price: ${this.current5MinPrice}¢/kWh`;
        priceElement.classList.add("price");
        priceElement.classList.add(`period-${period}`);

        // Hour average price
        let hourPriceElement = document.createElement("div");
        hourPriceElement.innerHTML = `Current Hour Avg Price: ${this.currentHourPrice}¢/kWh`;

        // Delivery price
        let deliveryElement = document.createElement("div");
        deliveryElement.innerHTML = `Delivery (${period}): ${deliveryRate}¢/kWh`;

        // Total price
        let totalElement = document.createElement("div");
        totalElement.innerHTML = `Total Price: ${totalPrice.toFixed(2)}¢/kWh`;
        totalElement.classList.add("total-price");

        // Arrow (trend)
        let arrowElement = document.createElement("div");
        if (this.last5MinPrice !== null) {
            if ((this.current5MinPrice > this.last5MinPrice) && (this.current5MinPrice > 4.0)) {
                arrowElement.innerHTML = "&#9650;";
                arrowElement.style.color = "red";
            } else if (this.current5MinPrice < this.last5MinPrice) {
                arrowElement.innerHTML = "&#9660;";
                arrowElement.style.color = "green";
            } else {
                arrowElement.innerHTML = "&#9654;";
                arrowElement.style.color = "gray";
            }
        }

        // Timestamp
        let timeOfData = document.createElement("div");
        timeOfData.innerHTML = `Data as of: ${this.currentTime.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' })}`;
        timeOfData.style.fontSize = "small";

        // Append everything
        wrapper.appendChild(priceElement);
        wrapper.appendChild(hourPriceElement);
        wrapper.appendChild(deliveryElement);
        wrapper.appendChild(totalElement);
        wrapper.appendChild(arrowElement);
        wrapper.appendChild(timeOfData);

    } else {
        wrapper.innerHTML = "Loading...";
    }

    return wrapper;
}
});

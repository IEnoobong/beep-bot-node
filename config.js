const {google, openWeather, telegram} = require("./apiKey");

const buildGeocodeUrl = (address) => {
    return `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${google}`
};

const buildWeatherUrl = (location) => {
    return `http://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${openWeather}`
};


module.exports = {
    telegramBaseUrl: `https://api.telegram.org/bot${telegram}`,
    buildGeocodeUrl,
    buildWeatherUrl
};

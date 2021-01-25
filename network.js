const axios = require('axios');

const makePostRequest = (url, payload) => {
    return axios.post(url, payload)
};

const makeGetRequest = (url) => {
    return axios.get(url);
};

module.exports = {
    makePostRequest,
    makeGetRequest
};

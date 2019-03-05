const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.post('/new-message', (req, res) => {
    console.log(`Body is ${req.body}`);
    const {message, edited_message} = req.body
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Telegram app listening on port ${port}!`)
});

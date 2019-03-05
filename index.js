const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const {google, openWeather, telegram} = require("./apiKey");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

const users = [];
const telegramUrl = 'https://api.telegram.org/bot';

app.get('/', (req, res) => {
    const hostUrl = req.get('host');
    axios.post(`${telegramUrl}${telegram}/setWebhook`, {url: `https://${hostUrl}/${telegram}/new-message`})
        .then(() => {
            return res.end('ok');
        }).catch(reason => {
        console.log(reason.message);
        return res.end('ok');
    });
});

app.post(`/${telegram}/new-message`, (req, res) => {
    console.log(`Body is ${JSON.stringify(req.body)}`);
    const {message} = req.body;

    if (!message) {
        return res.end()
    }

    let messageText = message.text;

    // handle start
    const myNameIs = 'My name is ';
    if (messageText.indexOf('/start') === 0) {
        const reply = {
            chat_id: message.chat.id,
            text: `Hey there, what's your name?\n_Begin response with_ ${myNameIs}`,
            parse_mode: `markdown`
        };
        sendReply(reply)
            .then(() => {
                return res.end('ok');
            }).catch(reason => {
            return res.end(reason.message);
        });
    }

    const myLocationIs = 'My location is ';
    if (messageText.toLocaleLowerCase().startsWith(myNameIs.toLocaleLowerCase())) {
        const chosenName = messageText.substring(myNameIs.length);
        const user = {
            name: chosenName,
            id: message.from.id
        };
        users.push(user);
        const reply = {
            chat_id: message.chat.id,
            text: `Hello ${chosenName}, welcome to beep bot!\nI can give you information about the weather, news etc if you tell me your location :)`,
            parse_mode: `markdown`
        };

        sendReply(reply).then(() => {
            reply.text = `What's your present location?\n_Begin response with_ ${myLocationIs}`;
            sendReply(reply).then(() => {
                return res.end();
            }).catch(reason => {
                return res.end(reason.message);
            });
        }).catch(reason => {
            return res.end(reason.message);
        });
    }

    if (messageText.toLocaleLowerCase().startsWith(myLocationIs.toLocaleLowerCase())) {
        const userLocation = messageText.substring(myLocationIs.length);
        console.log('Location is ', userLocation);
        const user = users.find(user => user.id === message.from.id);
        if (user) {
            user['location'] = userLocation;
        } else {
            //Request for name
        }
        console.log('Users are ', users);
    }
});

const sendReply = message => {
    return axios.post(`${telegramUrl}${telegram}/sendMessage`, message);
};

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Telegram app listening on port ${port}!`);
});

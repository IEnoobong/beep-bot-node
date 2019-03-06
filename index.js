const express = require('express');
const bodyParser = require('body-parser');
const {telegram} = require("./apiKey");
const {telegramBaseUrl, buildGeocodeUrl, buildWeatherUrl} = require('./config');
const {makePostRequest, makeGetRequest} = require('./network');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

const users = [];

app.get('/', (req, res) => {
    const hostUrl = req.get('host');
    makePostRequest(`${telegramBaseUrl}/setWebhook`, {url: `https://${hostUrl}/${telegram}/new-message`})
        .then(() => {
            return res.end('ok');
        }).catch(reason => {
        return res.end(reason.message);
    });
});

const validateLocation = userLocation => makeGetRequest(buildGeocodeUrl(userLocation));

const getWeatherInfo = location => makeGetRequest(buildWeatherUrl(location));

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
        return requestUserName(message.chat.id, myNameIs, res);
    }

    // handle name
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
                return res.end('ok');
            }).catch(reason => {
                return res.end(reason.message);
            });
        }).catch(reason => {
            return res.end(reason.message);
        });
    }

    // handle location
    if (messageText.toLocaleLowerCase().startsWith(myLocationIs.toLocaleLowerCase())) {
        const userLocation = messageText.substring(myLocationIs.length);
        const user = users.find(user => user.id === message.from.id);
        if (user) {
            user['location'] = userLocation;
            validateLocation(userLocation).then(value => {
                if (value.data.status === 'ZERO_RESULTS') {
                    throw new Error('Unable to find that address');
                }
                const addressComponents = value.data.results[0].address_components;
                if (addressComponents.length >= 2) {
                    user['countryCode'] = addressComponents.pop().short_name;
                    user['apiLocation'] = addressComponents.pop().long_name;
                }
                const location = user.apiLocation || user.location;
                return getWeatherInfo(location)
            }).then(value => {
                const reply = {
                    chat_id: message.chat.id,
                    text: JSON.stringify(value.data.main)
                };
                return sendReply(reply);
            }).then(() => {
                return res.end('ok')
            }).catch(reason => {
                const reply = {
                    chat_id: message.chat.id,
                    text: reason.message
                };
                sendReply(reply).finally(() => {
                    return res.end(`ok`)
                })
            })
        } else {
            return requestUserName(message.chat.id, myNameIs, res)
        }
        console.log('Users are ', users);
    }
    res.end();
});

const requestUserName = (chatId, myNameIs, res) => {
    const reply = {
        chat_id: chatId,
        text: `Hey there, what's your name?\n_Begin response with_ ${myNameIs}`,
        parse_mode: `markdown`
    };
    sendReply(reply)
        .then(() => {
            return res.end('ok');
        }).catch(reason => {
        return res.end(reason.message);
    });
};

const sendReply = message => {
    return makePostRequest(`${telegramBaseUrl}/sendMessage`, message);
};

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Telegram app listening on port ${port}!`);
});

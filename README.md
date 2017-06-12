# COM3504 The Intelligent Web Assignment

## Introduction

The goal is to develop a web applcation with **[Nodejs](https://github.com/nodejs/node)** + **[Express](https://github.com/expressjs/express)** + **[SocketIO](https://github.com/socketio/socket.io)** which receives queries from the users via a HTML form and retrieve tweets about related football transfer news via **Twitter REST API** and **Twitter Streaming API**. The retrieved data is stored in **MySql** database and then analyzed to create a detailed graph with **[Chart.js](https://github.com/chartjs/Chart.js)** showing the frequency of tweets over the past weeks.

## How to run
1. Change the MySql database configuration in `config/database.js`
2. Create a `.env` file with the following information:
    ```
    TWIT_CONSUMER_KEY=<Your Twitter Consumer Key>

    TWIT_CONSUMER_SECRET=<Your Twitter Consumer Secret>

    TWIT_ACCESS=<Your Twitter Access Key>

    TWIT_ACCES_SECRET=<Your Twitter Access Secret>
    ```
3. Run `npm install`.
4. Run `npm start` and open `localhost:3000` in your browser of choice.

## Authors
- [MaheshaKulatunga](https://github.com/MaheshaKulatunga)
- [omorhefere](https://github.com/omorhefere)
- [trung674](https://github.com/trung674)

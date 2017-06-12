# COM3504 The Intelligent Web Assignment - Part 1

## Introduction

The goal is to develop a web applcation with **[Nodejs](https://github.com/nodejs/node)** + **[Express](https://github.com/expressjs/express)** + **[SocketIO](https://github.com/socketio/socket.io)** which receives queries from the users via a HTML form and retrieve tweets about related football transfer news via **Twitter REST API** and **Twitter Streaming API**. The retrieved data is stored in **MySql** database and then analyzed to create a detailed graph with **[Chart.js](https://github.com/chartjs/Chart.js)** showing the frequency of tweets over the past weeks.

If a query mentioning a football player whose name appears in the database, additional information about this player, such as his current football club name, his date of birth and his twitter screen name, will be retrieved from **[DBPedia](http://wiki.dbpedia.org/)** using **[SPARQL](https://en.wikipedia.org/wiki/SPARQL)**.

## Installation
1. Clone this repo
2. Move to the app folder in the terminal using `cd` command
3. Change the MySql database configuration in `config/database.js`
4. Create a `.env` file with the following information:
    ```
    TWIT_CONSUMER_KEY=<Your Twitter Consumer Key>
    TWIT_CONSUMER_SECRET=<Your Twitter Consumer Secret>
    TWIT_ACCESS=<Your Twitter Access Key>
    TWIT_ACCES_SECRET=<Your Twitter Access Secret>
    ```
5. Run `npm install`.
6. Run `npm start` and open `localhost:3000` in your browser of choice.

## Authors
- [MaheshaKulatunga](https://github.com/MaheshaKulatunga)
- [omorhefere](https://github.com/omorhefere)
- [trung674](https://github.com/trung674)

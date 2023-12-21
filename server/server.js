/**
 * Created by Jérémie on 01/12/2017.
 * Updated by Jérémie Garcia on  07/12/2021 - added documentation and functions
 * Updated by Jérémie Garcia on  04/12/2022 - more docs
 */

const fs = require('fs');
const path = require('path');
const express = require('express');
const kwiz = require('./kwiz_module/kwiz_module');

//make the server and the socketsio
const app = express();
const server = require('http').createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

//server static file in the public directory
app.use(express.static(path.join(__dirname, '../client/build')));


const QUIZ_MESSAGE = "quiz";
const CLIENT_NUMBER_MESSAGE = "num_of_clients";
const CLIENT_ANSWERS_MESSAGE = "clients_answers";
const CLIENT_NAMES_MESSAGE = "clients_names";

// Quand un client se connecte, on le note dans la console
io.on('connection', function (socket) {
    console.log('client connecté',socket.id);
    let clientID = socket.id;
    //add client to the list
    kwiz.add_client(clientID);

    sendNamesToClients();

    socket.on('new_pseudo', (pseudo) => {
        kwiz.set_client_name(socket.id, pseudo);
        sendNamesToClients();
        updateClientsCounter();
    });

    socket.on('disconnect', () => {
        kwiz.remove_client(socket.id);
        sendNamesToClients();
        updateClientsCounter();
    });

    //send the questions to the client
    socket.emit(QUIZ_MESSAGE, kwiz.questions());

    //starts the game
    socket.on('start_game', () => {
        const connectedPlayerNames = kwiz.get_clients_names();

        io.sockets.sockets.forEach((s) => {
            const name = kwiz.get_client_name_by_id(s.id);
            if (connectedPlayerNames.includes(name)) {
                s.emit('navigate_to_game');
                kwiz.empty_scores();
            }
        });

        sendNamesToClients();
    });

    socket.on('answer_selected', (q, opt) => {
        kwiz.update_client_answer(clientID, q, opt);
        sendAnswersToClients();
        const answers = kwiz.check_all_questions_answered();
        const allQuestionsAnswered = Object.values(answers).every(answered => answered);

        if (allQuestionsAnswered) {
            // If all questions are answered, it's game over
            const scores = kwiz.update_scores();
            io.emit('score_update', scores);
            io.emit('game_over');
            console.log(scores);
        } else if (answers[q]) {
            // If all answers for this specific question are received
            const scores = kwiz.update_scores();
            io.emit('score_update', scores);
            io.emit('all_answered', q);
        }
    });
});

//send to all clients the current number of connected clients
function updateClientsCounter (){
    let nb = kwiz.clients_count();
    io.emit(CLIENT_NUMBER_MESSAGE, nb);
}

//send to all client the current answers
function sendAnswersToClients(){
    let reply = kwiz.get_answers_counts();
    io.emit(CLIENT_ANSWERS_MESSAGE, reply);
}

//send to all client the current clients Names
function sendNamesToClients(){
    let reply = kwiz.get_clients_names();
    io.emit(CLIENT_NAMES_MESSAGE, reply);
}

server.listen(8080);

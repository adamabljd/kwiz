/**
 * Created by jgarcia on 26/11/2018.
 * Modified 26/11/2020
 * This modules contains function to process the questions and answers from clients
 */

//load questions file
let data = require('./questions.json');
let clients_data =  {};

//returns the list of questions and answers
let questions = function(){
    return data;
};

//returns the number of questions in the quiz
let questions_count = function(){
    return data.quiz.length;
};

//add a new client defined by its id (from socket.io)
let add_client = function(id){
    clients_data[id] = {};
};

//set the name of a client defined by its id (from socket.io)
let set_client_name = function (id, name){
    if(clients_data.hasOwnProperty(id)){
        clients_data[id].name = name;
    }else{
        console.error('client id ' + id, ' does not exists');
    }
};

// returns an array of clients names (if any)
let get_clients_names = function(){
    let reply = [];

    let keys = Object.keys(clients_data);
    let length = keys.length;
    let i;

    for(i = 0; i<length; i++) {
        let clientID = keys[i];
        let name = clients_data[clientID].name;
        if (name !== undefined) {
            reply.push(name);
        }
    }
    return reply;
};

//gets a client's name by id
let get_client_name_by_id = (socketId) => {
    if (clients_data[socketId] && clients_data[socketId].name) {
        return clients_data[socketId].name;
    }
    return null;
}


//remove a client with its id (from socket.io)
let remove_client = function(id){
    delete clients_data[id];
};

//returns the number of connected clients (even those without a name)
let clients_count = function (){
    return Object.keys(clients_data).length;
};

// updates the data structure containing client options for each question.
// question must be 'q1', 'q2' or 'q3'
// option must be the complete text e.g. "Allemande" or "une couleur"
let update_client_answer = function(id, question, option){
    clients_data[id][question] = option;
};

let find_option_index = function(options, option) {
    let i;
    for (i = 0; i< options.length; i++){
        if(options[i] === option){
            return i;
        }
    }
    return undefined;
};

//returns an object with counts for each answer of each question
// example: { q1: [ 1, 2, 0 ], q2: [ 2, 0, 1 ], q3: [ 1, 0, 0 ] }
let get_answers_counts = function (){

    //Create the default reply
    let reply = {};
    let question_iter;
    for (question_iter = 0; question_iter < questions_count(); question_iter++){
        reply[data.quiz[question_iter].id] = [0,0,0];
    }

    let keys = Object.keys(clients_data);
    let length = keys.length;
    let client_iter;

    for(client_iter = 0; client_iter<length; client_iter++){
        let clientID = keys[client_iter];
        let answers = clients_data[clientID];

        for (question_iter = 0; question_iter < questions_count(); question_iter++){

            let question = data.quiz[question_iter];
            let id = question.id;
            if (answers.hasOwnProperty(id)){
                //find option id in the list of options and update the counter
                let option = answers[id];
                let option_index = find_option_index(question.options, option);
                if(option_index !== undefined){
                    reply[id][option_index]++;
                }
            }
        }
    }
    return reply;
};

// Checks if all players have answered the question
let all_questions_answered = {};

// Initialize allQuestionsAnswered with question IDs and set them to false
data.quiz.forEach(question => {
    all_questions_answered[question.id] = false;
});

let check_all_questions_answered = function() {
    let keys = Object.keys(clients_data);
    Object.keys(all_questions_answered).forEach(questionId => {
        all_questions_answered[questionId] = true;
        keys.forEach(client => {
            if(!clients_data[client][questionId]){
                all_questions_answered[questionId] = false;
            }
        });
    });
    return all_questions_answered;
};

let scores = {};

let empty_scores = function() {
    scores = {};
}

let update_scores = function() {
    let keys = Object.keys(clients_data);
    keys.forEach(clientID => {
        let playerName = clients_data[clientID].name;

        if (!playerName) return;

        scores[playerName] = 0;

        data.quiz.forEach(question => {
            let correctAnswer = question.answer;
            let playerAnswer = clients_data[clientID][question.id];

            if (playerAnswer === correctAnswer) {
                scores[playerName] += 1;
            }
        });
    });

    return scores;
};

exports.empty_scores = empty_scores;
exports.update_scores = update_scores;
exports.questions = questions;
exports.find_option_index = find_option_index;
exports.add_client = add_client;
exports.remove_client = remove_client;
exports.set_client_name = set_client_name;
exports.get_clients_names = get_clients_names;
exports.update_client_answer = update_client_answer;
exports.clients_count = clients_count;
exports.get_answers_counts = get_answers_counts;
exports.get_client_name_by_id = get_client_name_by_id;
exports.check_all_questions_answered = check_all_questions_answered;

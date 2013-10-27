socket = new WebSocket("ws://192.168.1.4:3000");
game_round = 0;
game_users = [];
game_scores = [];
game_typing_states = [];
time_left = 0;
queue = [];
round_running = false;
interval_id = 0;
your_score = 0;
answer_submitted = false;
total_score = 0;

$(document).ready(function() {
	//initialize meSpeak
	meSpeak.loadConfig("http://localhost:3000/vendor/mespeak/mespeak_config.json");
	meSpeak.loadVoice('http://localhost:3000/vendor/mespeak/voices/en/en-us.json');
	
	console.log('meSpeak loaded');
	
	$('#finalDialog').modal({
		show: false
	});
});

$(document).unload(function() {
	// close the socket
	if (typeof socket !== 'undefined' && socket !== null) {
		socket.close();
	}
	
	// clean the global space
	delete socket;
	delete game_round;
	delete game_users;
	delete game_scores;
	delete game_typing_states;
	delete time_left;
	delete queue;
	delete round_running;
	delete interval_id;
	delete your_score;
	delete answer_submitted;
	delete total_score;
});

socket.onmessage = function (event) {
	console.log('Received: ' + event.data);
	var parts = event.data.split(',');
	var command = parts[0];
	switch(command) {
		case 'round':
			push_to_round_queue(parts.slice(1));
			break;
		case 'start':
			start_game(parts.slice(2));
			break;
		case 'update_scores':
			update_scores(parts.slice(1));
			break;
		case 'end':
			finish_game(parts.slice(1));
			break;
		case 'update_typing_state':
			update_typing_state(parts.slice(1));
			break;
		case 'your_score':
			update_your_score(parts[1]);
			break;
	}
}

socket.onopen = function (event) {
	console.log('Connection opened!');
	
	//start the game
	socket.send('set_name,web_user');
	socket.send('play');
	
	console.log('Game started');
};

function update_your_score(score) {
	your_score = score;
}

function send_to_server(message) {
	if (round_running) {
		socket.send(message);
	}
}

function update_typing_state(typing_states) {
	game_typing_states = typing_states;
	show_scores();
}

function push_to_round_queue(parts) {
	queue.push(parts);
	offer_round();
}

function offer_round() {
	if (!round_running && queue.length > 0) {
		var next_round_info = queue.shift();
		start_round(
			next_round_info[0],
			next_round_info[1],
			next_round_info[2]
		);
	}
}

function start_game(users) {
	game_users = [];
	game_scores = [];
	for (var i = 0; i < users.length; ++i) {
		game_users.push(users[i]);
		game_scores.push(0);
	}
	
	show_scores();
}

function finish_game(final_scores) {
	game_scores = final_scores;
	//show_scores();
	show_final_dialog();
}

function show_final_dialog() {
	$('#finalScore').html(your_score + ' of maximum ' + total_score);
	for (var i = 0; i < game_scores.length; ++i) {
		$('#finalRankings').append('<li>' + game_users[i] + ' - ' + game_scores[i] + ' points</li>');
	}
	
	$('#finalDialog').modal('show');
}

function update_scores(scores) {
	game_scores = scores;
	show_scores();
}

function show_scores() {
	$('#rankingsList').empty();
	for (var i = 0; i < game_scores.length; ++i) {
		$('#rankingsList').append('<li>' + game_users[i] + (game_typing_states[i] == 1 ? '(typing...)' : '') +
			' - ' + game_scores[i] + ' points</li>');
	}
}

function start_round(round, word, time_out) {
	clear_input_field();
	
	total_score += word.length;
	round_running = true;
	answer_submitted = false;
	game_round = round;
	$('#currentRound').html(round);
	
	meSpeak.speak(word);
	
	time_left = parseInt(time_out);
	startTimer(round);
}

function clear_input_field() {
	$('#userInput').empty();
	delete(($('#userInput')[0]).dataset.divPlaceholderContent);
	$('#timeContainer').css('color', 'black');
}

function startTimer(id) {
	interval_id = setInterval(updateTimer, 1000);
	function updateTimer() {
		$('#currentTimeLeft').html(time_left);
		if (time_left > 0) {
			if (time_left <= 4 && !answer_submitted) {
				$('#timeContainer').css('color', 'red');
			}
			time_left--;
		} else {
			clearInterval(interval_id);
			round_running = false;
			offer_round();
		}
	}
}

function finish_round(word) {
	send_to_server('answer,' + game_round + ',' + word);
	$('#timeContainer').css('color', 'green');
	answer_submitted = true;
}

$('#submitButton').click(function() {
	var word = $('#userInput').text();
	if (round_running) {
		finish_round(word);
		console.log('answer send for ' + game_round + ' ' + word);
	} else {
		console.log('no active round!');
	}
});

$('#userInput').keydown(function(e){
    if(e.keyCode == 13) {
		e.preventDefault();
		e.stopPropagation();
        $('#submitButton').trigger("click");
		
		return false;
    }
});

var userIsTyping = false;
var typingTimer;                //timer identifier
var doneTypingInterval = 1500;  //time in ms, 1.5 second for example

//on keyup, start the countdown
$('#userInput').keyup(function(){
    typingTimer = setTimeout(doneTyping, doneTypingInterval);
});

//on keydown, clear the countdown 
$('#userInput').keydown(function(){
    clearTimeout(typingTimer);
});

//user is "finished typing," do something
function doneTyping () {
	if (userIsTyping) {
		userIsTyping = false;
		console.log('end typing');
		socket.send('update_typing_state,0');
	}
}

$('#userInput').keypress(function() {
	if (!userIsTyping) {
		userIsTyping = true;
		console.log('start typing');
		socket.send('update_typing_state,1');
	}
});

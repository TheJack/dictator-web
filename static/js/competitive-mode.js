socket = new WebSocket("ws://10.0.249.104:3000");
game_round = 0;
game_users = [];
time_left = 0;

$(document).ready(function() {
	//initialize meSpeak
	meSpeak.loadConfig("http://localhost:3000/vendor/mespeak/mespeak_config.json");
	meSpeak.loadVoice('http://localhost:3000/vendor/mespeak/voices/en/en-us.json');
	
	console.log('meSpeak loaded');
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
	delete time_left;
});

socket.onmessage = function (event) {
	console.log('Received: ' + event.data);
	var parts = event.data.split(',');
	var command = parts[0];
	switch(command) {
		case 'round':
			start_round(parts[1], parts[2], parts[3]);
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
	}
}

socket.onopen = function (event) {
	console.log('Connection opened!');
	
	//start the game
	socket.send('set_name,web_user');
	socket.send('play');
	
	console.log('Game started');
};

function start_game(users) {
	game_users = [];
	var scores = [];
	for (var i = 0; i < users.length; ++i) {
		game_users.push(users[i]);
		scores.push(0);
	}
	
	update_scores(scores);
}

function finish_game(final_scores) {
	update_scores(final_scores);
	alert('game_ended');
}

function update_scores(scores) {
	$('#rankingsList').empty();
	for (var i = 0; i < scores.length; ++i) {
		$('#rankingsList').append('<li>' + game_users[i] + ' - ' + scores[i] + ' points</li>');
	}
}

function start_round(round, word, time_out) {
	game_round = round;
	$("#currentRound").html(round);
	meSpeak.speak(word);
	
	time_left = parseInt(time_out) + 1;
	interval_id = setInterval(updateTimer, 1000);
	function updateTimer() {
		if (time_left > 0) {
			time_left--;
			$('#currentTimeLeft').html(time_left);
		} else {
			clearInterval(interval_id);
		}
	}
}

function finish_round(word) {
	socket.send('answer,' + game_round + ',' + word);
}

$('#submitButton').click(function() {
	var word = $('#userInput').text();
	if (time_left > 0) {
		finish_round(word);
		console.log('answer send for ' + game_round + ' ' + word);
	} else {
		console.log('time is up');
	}
});

$('#userInput').keyup(function(e){
    if(e.keyCode == 13)
    {	e.preventDefault();
        $('#submitButton').trigger("click");
    }
});
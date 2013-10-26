var soundIsPlaying = false;

$(document).ready(function() {
	meSpeak.loadConfig('http://localhost:3000/vendor/mespeak/mespeak_config.json');
	meSpeak.loadVoice('http://localhost:3000/vendor/mespeak/voices/en/en-us.json');
});

$("#playButton").click(function() {
	if (!soundIsPlaying) {
		soundIsPlaying = true;
		var text = $("#text").text();
		$("#text").hide("fast");
		$("#playButton").hide("fast");
		meSpeak.speak(text, {}, function() {
			soundIsPlaying = false;
			console.log("finished");
			$("#text").show("fast");
			$("#playButton").show("fast");
		});
	}
});
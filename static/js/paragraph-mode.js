var soundIsPlaying = false;
var speachSpeed = 120;

$(function() {
	meSpeak.loadConfig('http://localhost:3000/vendor/mespeak/mespeak_config.json');
	meSpeak.loadVoice('http://localhost:3000/vendor/mespeak/voices/en/en-us.json');
});

$("#playButton").click(function() {
	var text = $("#text").text();
	
	if (text === '') {
		console.log('no paragraph ... skipping');
		return;
	}
	
	if (!soundIsPlaying) {
		soundIsPlaying = true;

		$("#text").hide("fast");
		$("#playButton").hide("fast");
		$('#submitButton').show();
		
		playParagraph(text, function() {
			soundIsPlaying = false;
			console.log("finished");
			
			$("#playButton").show("fast");
		});
	}
});

function playParagraph(paragraphText, cb) {
	var sentences = paragraphText.split(/\.?!/);
	
	playSentance(0);
	
	function playSentance(sentenceIndex) {
		console.log('Playing ' + sentenceIndex);
		if (sentenceIndex < sentences.length) {
			meSpeak.speak(sentences[sentenceIndex], { speed: speachSpeed }, function() {
				playSentance(sentenceIndex + 1);
			});
		} else {
			cb();
		}
	}
};

$('#speedDownButton').click(function() {
	console.log('Speed down clicked!');
	if (speachSpeed >= 31) {
		speachSpeed -= 30;
	}
	console.log('Speach speed is now' + speachSpeed);
});

$('#speedUpButton').click(function() {
	console.log('Speed up clicked!');
	speachSpeed += 30;
	console.log('Speach speed is now' + speachSpeed);
});

$('div').mouseup(function() {
    var selectedText = getSelectedText();
	if (selectedText !== '') {
		get_definition(selectedText);
	}
	
	return false;
});

function getSelectedText() {
	if (window.getSelection) {
		return window.getSelection().toString();
	} else if (document.selection) {
		return document.selection.createRange().text;
	}
	return '';
}

function get_definition(word) {
	$.ajax({
	  url: 'http://www.google.com/dictionary/json?callback=a&sl=en&tl=en&q=' + word,
	  dataType: 'jsonp',  //use jsonp data type in order to perform cross domain ajax
	  crossDomain: true,
	  success: function(response) {
		console.log(response);
		
		var rowMeaningEntries = [];
		var meanings = [];
		
		if (response.hasOwnProperty('primaries')) {
			if (response.primaries.length > 0) {
				rowMeaningEntries = jQuery.grep(response.primaries[0].entries, function(entry, index) {
					return (entry.type === 'meaning');
				});
			}
			if (response.primaries.length > 1) {
				rowMeaningEntries.push.apply(rowMeaningEntries,
					jQuery.grep(response.primaries[1].entries, function(entry, index) {
						return (entry.type === 'meaning');
					})
				);
			}
		}
		
		meanings = $.map(rowMeaningEntries, function(meaningEntry, index) {
			return {
				"definition": meaningEntry.terms[0].text,
				"examples": get_examples(meaningEntry)
			};
		});
		
		show_definition(meanings);
	  }
	});
}

function get_examples(meaningEntry) {
	if (!meaningEntry.hasOwnProperty('entries')) {
		return [];
	}
	
	return $.map(meaningEntry.entries, function(example, exampleIndex) {
		return example.terms[0].text;
	})
};

function show_definition(meanings) {
	$('#wordDefinition').empty();
	if (meanings.length > 0) {
		var mainList = $('<ul>');
		for (var i = 0; i < meanings.length; ++i) {
			var curItem = $('<li>').html(meanings[i].definition);
			if (meanings[i].examples.length > 0) {
				var subList = $('<ul>');
				for (var j = 0; j < meanings[i].examples.length; ++j) {
					var subItem = $('<li>').html(meanings[i].examples[j]);
					subList.append(subItem);
				}
				curItem.append(subList);
			}
			mainList.append(curItem);
		}
		$('#wordDefinition').append(mainList);
	} else {
		$('#wordDefinition').html('Sorry, definition not found!');
	}
};

$("#submitButton").click(function() {
	console.log('inside button');
	
	$('#userInput').prop('conteneditable', 'false');
	show_diff();
	show_side_by_side();
	
	$('#submitButton').hide();
	
	return false;
});

function show_diff() {
	var originalText = $('#text').text();
	var typedText = $('#userInput').text();
	var diff = JsDiff.diffChars(originalText, typedText);
	console.log(diff);
	
	var fragment = document.createDocumentFragment();
	for (var i=0; i < diff.length; i++) {

		if (diff[i].added && diff[i + 1] && diff[i + 1].removed) {
			var swap = diff[i];
			diff[i] = diff[i + 1];
			diff[i + 1] = swap;
		}

		var node;
		if (diff[i].removed) {
			node = document.createElement('del');
			node.appendChild(document.createTextNode(diff[i].value));
		} else if (diff[i].added) {
			node = document.createElement('ins');
			node.appendChild(document.createTextNode(diff[i].value));
		} else {
			node = document.createTextNode(diff[i].value);
		}
		fragment.appendChild(node);
	}

	result = document.getElementById('textDiff');
	result.textContent = '';
	result.appendChild(fragment);
};

function show_side_by_side() {
	$('#originalText').text($('#text').text());
	
	$('.diffLabel').show();
	$('#userInput').parent().css({float: "left", width: "50%"});
	$('#originalText').parent().css({float: "right", width: "50%"});
};
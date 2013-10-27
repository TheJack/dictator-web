
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

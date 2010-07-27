
$(document).ready(function(){
	if(window._processedServerSide === undefined) {
		$('.result').text(window._jsonData.foo);
	}
});


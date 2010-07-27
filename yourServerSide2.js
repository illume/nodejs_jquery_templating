$(document).ready(function(){
        if(window._processedServerSide === undefined) {
		$('body').append("<p>Hello from inside the document.ready call in yourServerSide2.js</p>")
		$('body').append("<p>PART 2.  Hello from yourServerSide2.js</p>")
	}
});

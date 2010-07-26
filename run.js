



// requires jsdom and node-htmlparser
//   git clone http://github.com/tautologistics/node-htmlparser.git
//   git clone http://github.com/tmpvar/jsdom.git
//   mkdir -p ~/.node_libraries/
//   mkdir -p ~/.node_libraries/node-htmlparser 
//   cp -a node-htmlparser/lib/node-htmlparser.js ~/.node_libraries/node-htmlparser
//   cp -a jsdom/lib/jsdom ~/.node_libraries/
//   - ~/.node_libraries/node-htmlparser/node-htmlparser
//   - ~/.node_libraries/jsdom

var sys = require("sys"), fs = require("fs");
var htmlparser = require("node-htmlparser/node-htmlparser");



var readFiles = function (files, whenDone) {
    // readFiles (file, whenDone(theErrs, theDatas)) reads many files at once, 
    //     and runs the whenDone function when all reading is done.

    // To read many files at once.
    var numFilesRead = 0;
    var fileData = [];
    var fileErr = [];


    for(var i=0;i < files.length; i += 1) {
        var fileName = files[i];
        var idx = i;
        fileData[fileName] = null;
        fileErr[fileName] = null;
        (function () {
		var theFileName = fileName;
		fs.readFile(fileName, function (err, data) {
					  fileData[theFileName] = data;
					  fileErr[theFileName] = err;
					  numFilesRead += 1;
					  if(numFilesRead == files.length) {
						// all finished.
						whenDone(fileErr, fileData);
					  }
		});
        })();
    }

}

var extractDoctype = function (htmlData)  {
	var html = htmlData + "";
	var idx = html.indexOf('<html');
	if (idx === -1) {
		var idx = html.indexOf('<HTML');
	}
	return html.substr(0, idx);
}








var doIt = function (theFileNames, outPut) {
	// TODO LATER: cache files if we have already read them.  Not too slow for now.
	readFiles(theFileNames, function (theErrs, theDatas) {

		var dom = require("jsdom/level1/core").dom.level1.core;
		var window = require("jsdom/browser").windowAugmentation(dom).window;
		var domToHtml = require("jsdom/browser/domtohtml").domToHtml;
		var Script = process.binding('evals').Script;



		var data = theDatas[theFileNames[0]];
		var serverSideData = theDatas[theFileNames[1]];
		var htmlData = theDatas[theFileNames[2]];
		var jsonData = theDatas[theFileNames[3]];

		//HACK TODO: extract the doctype from the document... since it is not output by the dom.
		// extract everything before '<html'
		var docType = extractDoctype(htmlData);


		//sys.puts(data);

		//window.location.href = templateUrl;

		//TODO: cache json if we have already parsed it.
		var serverSideJson = JSON.parse(jsonData); 


		//TODO: cache html parsing.
		// Load the html in.
		//window.document.innerHTML = "<!DOCTYPE html>\n<html> <body> hi there.  </body> </html>";
		window.document.innerHTML = htmlData;


		var env = {	window: window, 
				location: window.location, 
				navigator: window.navigator,
				"$" : window.jQuery };

		//TODO: cache Context based on which libraries are used.
		// eg, if just json changes, we should be fairly quick to already have jquery, and other libs loaded.
		try {
			Script.runInNewContext(data.toString() + serverSideData.toString(), env);
		} catch(e){
			sys.puts(sys.inspect(e));
		}


		//TODO: should this run the onload onready events instead?
		window._renderServerSide(serverSideJson);


		// To tell the client side we have processed the script server side already.
		// TODO: this fails with an error...
		//window.jQuery('body').append("<script type='text/javascript'>window._processedServerSide = true;</script>");

		//TODO: can use the dom directly to create the output html?
		var outputHtml = window.document.outerHTML;
		//var outputHtml = domToHtml(window.document);
		//docType = window.document.doctype;


		//HACK: since the doc type is not output, we add it in here.
		outputHtml = docType + outputHtml;
		//HACK: since the above .append does not work, we hack it in here.
		outputHtml = outputHtml.replace('</body>', "<script type='text/javascript'>window._processedServerSide = true;</script>\n</body>");
		//sys.puts(outputHtml);
		outPut(outputHtml);

	});

}



if (0) {
	// Run, then exit.

	var jsonUrl = "server.json";
	// this should define window._renderServerSide(serverSideJson);
	var serverUrl = "yourServerSide.js";
	var templateUrl = "index.html";


	// TODO: allow passing in a list of .js files to run server side.
	var theFileNames = [__dirname + "/jquery.js", 
				__dirname + "/" + serverUrl, 
				__dirname + "/" + templateUrl, 
				__dirname + "/" + jsonUrl];

	//sys.puts(JSON.stringify(theFileNames));

	doIt(theFileNames, function (data) {
		sys.puts(data);
	});

} else {
	// run as a server.
	var http = require('http');
	http.createServer(function (req, res) {

		var reqp= require('url').parse(req.url, true);

		if(reqp.pathname === "/") {
			var jsonUrl = "server.json";

			// this should define window._renderServerSide(serverSideJson);
			var serverUrl = "yourServerSide.js";
			var templateUrl = "index.html";

			// 
			//sys.puts(req.url)
			//sys.puts(JSON.stringify(urlDetails));
			//sys.puts(JSON.stringify( require('url').parse('/status?name=ryan', true)));

			var jsonUrl = reqp.query.serverJson;
			var serverUrl = reqp.query.serverJs;
			var templateUrl = reqp.query.templateUrl;

			// TODO: allow passing in a list of .js files to run server side.
			var theFileNames = [__dirname + "/jquery.js", 
						__dirname + "/" + serverUrl, 
						__dirname + "/" + templateUrl, 
						__dirname + "/" + jsonUrl];
			//sys.puts(JSON.stringify(theFileNames));

			res.writeHead(200, {'Content-Type': 'text/html'});
			//res.end('Hello World\n');
			(function () {
				doIt(theFileNames, function (data) {
					res.end(data);
				});
			})();
		} else if (reqp.pathname == "/jquery.js" || reqp.pathname == "/yourServerSide.js") {
			
			fs.readFile(__dirname + reqp.pathname, function (err, data) {
				res.writeHead(200, {'Content-Type': 'text/json'});
				res.end(data);
			});
			
		} else {
			res.writeHead(404, {'Content-Type': 'text/html'});
			res.end("not found")
		}
	}).listen(8124, "127.0.0.1");
	console.log('Server running at http://127.0.0.1:8124/');
	console.log('try url: http://localhost:8124/?serverJson=server.json&serverJs=yourServerSide.js&templateUrl=index.html')



}



// To output to stdout:
// 	node run.js
//	node run.js ./ server.json index.html jquery.js yourServerSide.js yourServerSide2.js
//	node run.js basePath jsonFile htmlFile serverSideJsFiles
// To run as a server:
// 	node run.js --server



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
	// extractDoctype() returns everything before the <html tag.
	var html = htmlData + "";
	var idx = html.indexOf('<html');
	if (idx === -1) {
		var idx = html.indexOf('<HTML');
	}
	return html.substr(0, idx);
}








var bakeHtml = function (jsonFile, serverJsFiles, htmlFile, outPutFunc) {

	var theFileNames = [htmlFile, jsonFile];

	for(var ii=0;ii < serverJsFiles.length;ii += 1) {
		theFileNames.push(serverJsFiles[ii]);
	}


	// TODO LATER: cache reading files if we have already read them.  Not too slow for now.
	readFiles(theFileNames, function (theErrs, theDatas) {

		var dom = require("jsdom/level1/core").dom.level1.core;
		var window = require("jsdom/browser").windowAugmentation(dom).window;
		var domToHtml = require("jsdom/browser/domtohtml").domToHtml;
		var Script = process.binding('evals').Script;


		var htmlData = theDatas[theFileNames[0]];
		var jsonData = theDatas[theFileNames[1]];

		// concat all of the .js into one big string.
		jsData = [];
		jsDataString = "";
		jsDataString += "\ndocument = window.document;\n";

		for(var i=2;i < theFileNames.length;i += 1) {
			var aFileName = theFileNames[i];
			var aData = theDatas[aFileName];
			jsData.push(aData);
			jsDataString += aData.toString();
			// HACK: After jquery is loaded... we tell jquery the DOM is ready.
			//if(aFileName.indexOf("jquery.js") !== -1) {
			if(i == 2 && (aFileName.indexOf("jquery") !== -1)) {
				jsDataString += "\n$ = window.jQuery;\n";
				jsDataString += "\nwindow.jQuery.isReady=true;\n";
			}
		}


		//HACK Extract the doctype from the document... since it is not output by the dom.
		// extract everything before '<html'
		var docType = extractDoctype(htmlData);


		//window.location.href = templateUrl;

		//TODO: cache json if we have already parsed it.
		var serverSideJson = JSON.parse(jsonData); 


		//TODO: cache html parsing.
		// Load the html in.
		//window.document.innerHTML = "<!DOCTYPE html>\n<html> <body> hi there.  </body> </html>";
		window.document.innerHTML = htmlData;
		window._jsonData = serverSideJson;


		var env = {	window: window, 
				location: window.location, 
				navigator: window.navigator,
				"$" : window.jQuery };

		//TODO: cache Context based on which libraries are used.
		// eg, if just json changes, we should be fairly quick to already have jquery, and other libs loaded.
		try {
			Script.runInNewContext(jsDataString, env);
		} catch(e) {
			sys.puts(sys.inspect(e));
		}


		// To tell the client side we have processed the script server side already.
		// TODO: this fails with an error...
		//window.jQuery('body').append("<script type='text/javascript'>\nwindow._processedServerSide = true;\n</script>");

		//TODO: can use the dom directly to create the output html?
		var outputHtml = window.document.outerHTML;
		//var outputHtml = domToHtml(window.document);
		//docType = window.document.doctype;


		//HACK: since the doc type is not output, we add it in here.
		outputHtml = docType + outputHtml;
		//HACK: since the above .append does not work, we hack it in here.
		outputHtml = outputHtml.replace('<body>', "<body>\n<script type='text/javascript'>\nwindow._processedServerSide = true;\n</script>\n");
		//sys.puts(outputHtml);
		outPutFunc(outputHtml);

	});
}









var basePath = __dirname;
var basePath = "./";

var runAsServer = false;
if (process.argv.length === 3 && process.argv[2] == "--server") {
	runAsServer = true;
}

if (!runAsServer) {

	// Get the files to use from the command line arguments.
	if(process.argv.length > 4) {
		var basePath = process.argv[2];
		var jsonFile = basePath + "/" + process.argv[3];
		var htmlFile = basePath + "/" + process.argv[4];
		var serverJses = process.argv.slice(5);
		var serverJsFiles = [];
		for(var ii=0; ii < serverJses.length; ii +=1) {
			serverJsFiles.push(basePath + "/" + serverJses[ii]);
		}

	} else {
		var jsonFile = basePath + "/server.json";
		var htmlFile = basePath + "/" + "index.html";
		// this should define window._renderServerSide(serverSideJson);
		var serverJsFiles = [basePath + "/jquery.js", basePath + "/yourServerSide.js"];
	}

	/*sys.puts(JSON.stringify(jsonFile));
	sys.puts(JSON.stringify(htmlFile));
	sys.puts(JSON.stringify(serverJsFiles));
	*/

	bakeHtml(jsonFile, serverJsFiles, htmlFile, function (data) {
		sys.puts(data);
	});

} else {
	// run as a server.
	var http = require('http');
	http.createServer(function (req, res) {

		var reqp= require('url').parse(req.url, true);

		if(reqp.pathname === "/") {
			
			// TODO: check the file paths are within the basePath.
			
			
			// TODO: check the paths are within the basePath.
			var basePath = reqp.query.basePath;
			var jsonUrl = reqp.query.serverJson;
			var serverJs = reqp.query.serverJs + "";
			var templateUrl = reqp.query.templateUrl;

			// Can specify a list of serverJs files by separating them with ',,,'.
			var serverJses = serverJs.split(",,,")

			var jsonFile = basePath + "/" + jsonUrl;
			var serverJsFiles = [];
			for(var ii=0; ii < serverJses.length; ii +=1) {
				serverJsFiles.push(basePath + "/" + serverJses[ii]);
			}

			var htmlFile = basePath + "/" + templateUrl;

			/*
			sys.puts(JSON.stringify(jsonFile));
			sys.puts(JSON.stringify(serverJsFiles));
			sys.puts(JSON.stringify(htmlFile));
			*/

			res.writeHead(200, {'Content-Type': 'text/html'});
			(function () {
				bakeHtml(jsonFile, serverJsFiles, htmlFile, function (data) {
					res.end(data);
				});
			})();
			
		} else {
			res.writeHead(404, {'Content-Type': 'text/html'});
			res.end("not found")
		}
	}).listen(8124, "127.0.0.1");
	console.log('Server running at http://127.0.0.1:8124/');
	console.log('try url: http://localhost:8124/?basePath=./&serverJson=server.json&serverJs=jquery.js,,,yourServerSide.js,,,yourServerSide2.js&templateUrl=index.html')

}


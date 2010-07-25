
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


var dom = require("jsdom/level1/core").dom.level1.core;
var window = require("jsdom/browser").windowAugmentation(dom).window;

var Script = process.binding('evals').Script;

var jsonUrl = "server.json";

// this should define window._renderServerSide(serverSideJson);
var serverUrl = "yourServerSide.js";
var templateUrl = "index.html";

// Hack... see below.
var docType = "";


fs.readFile(__dirname + "/jquery.js", function(err, data) {
  fs.readFile(__dirname + "/" + serverUrl, function(err2, serverSideData) {
    fs.readFile(__dirname + "/" + templateUrl, function(err3, htmlData) {
      fs.readFile(__dirname + "/" + jsonUrl, function(err4, jsonData) {


	    //window.location.href = templateUrl;
	    var serverSideJson = JSON.parse(jsonData); 

	    // Load the html in.
	    //window.document.innerHTML = "<!DOCTYPE html>\n<html> <body> hi there.  </body> </html>";
	    window.document.innerHTML = htmlData;


	    var env = {	window: window, 
			location: window.location, 
			navigator: window.navigator,
			"$" : window.jQuery,
			};

	    try {
	      Script.runInNewContext(data.toString() + serverSideData.toString(), env);
	    } catch(e){
	      sys.puts(sys.inspect(e));
	    }

            window._renderServerSide(serverSideJson);

	
	    // To tell the client side we have processed the script server side already.
	    // TODO: this fails with an error...
	    //window.jQuery('body').append("<script type='text/javascript'>window._processedServerSide = true;</script>");

            var outputHtml = window.document.outerHTML;

            //HACK: since the doc type is not output, we add it in here.
            outputHtml = docType + outputHtml;
            //HACK: since the above .append does not work, we hack it in here.
            outputHtml = outputHtml.replace('</body>', "<script type='text/javascript'>window._processedServerSide = true;</script>\n</body>");
	    sys.puts(outputHtml);

      });
    });
  });
});





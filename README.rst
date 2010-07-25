For template processing using jquery on the server side or the client side.
Using json as the data.


Uses nodejs for the javascript interpreter, and jquery for the template language, along with jsdom and node-htmlparser for the DOM and html parsing/serialising.

Why is this useful?
===================

- No need for a server to process the templates.  Either process them server side or client side.

- Data can be stored in a json file.  No need for a database for testing.  Just create json files in a text file.

- Can reuse knowledge of javascript libraries (like jquery), rather than learning one of 798394 different templating languages.

- Can keep one html file which front end web developers can edit without them needing a new template file.



To process the data on the server side.

node run.js > processed_index.html

View index.html to view it client side.

Put your server side templating in yourServerSide.js

- sample.json is given to your function in yourServerSide on the client side.

- server.json is given to server side version of the function.


Dependencies.

requires jsdom and node-htmlparser

git clone http://github.com/tautologistics/node-htmlparser.git

git clone http://github.com/tmpvar/jsdom.git

mkdir -p ~/.node_libraries/

mkdir -p ~/.node_libraries/node-htmlparser

cp -a node-htmlparser/lib/node-htmlparser.js ~/.node_libraries/node-htmlparser

cp -a jsdom/lib/jsdom ~/.node_libraries/

- ~/.node_libraries/node-htmlparser/node-htmlparser

- ~/.node_libraries/jsdom



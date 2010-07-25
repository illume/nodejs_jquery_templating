For template processing using jquery on the server side or the client side.
Using json as the data.


See top of run.js for dependencies.

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



var express = require('express');
var app = express();
app.use('/', express.static(__dirname + '/public'));
app.listen(80, () => {
    console.log('295 UI server running on port '+ 80);
});
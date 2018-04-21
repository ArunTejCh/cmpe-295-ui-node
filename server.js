let express = require('express');

const port = process.env.PORT || 80;
let app = express();

app.use('/', express.static(__dirname + '/public'));

app.listen(port, () => {
    console.log('295 UI server running on port '+ port);
});
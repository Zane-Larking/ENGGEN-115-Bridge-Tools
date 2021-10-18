express = require("express");
const app = express();
const { PORT = 3001 } = process.env;

console.log('PORT', PORT);

app.set('view engine', 'ejs');
app.use('/src/styles', express.static("src/styles"));
app.use('/src/app', express.static("src/app"));
app.use('/src/view', express.static("src/view"));

app.get('/', (req, res) => {
    // res.render('src/view/index.html');
    res.sendFile(__dirname + "/src/view/index.html");
    // res.send("This is a responce string");
})

app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`)
})
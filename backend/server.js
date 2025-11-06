import express  from 'express'
import redis from './redis.js'
import path from 'path';
import { fileURLToPath } from 'url';
const app = express()
const port = 3000

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const signInHTMLPath = path.join(__dirname, "../src/auth", "sign-in.html");
const mainAppPath = path.join(__dirname, "../src", "mainapp.html");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

redis.connect().catch(console.error);

app.get("/", (req, res) => {
  res.sendFile(signInHTMLPath);
});

//this is where the users will be entering their info to sign up and the data will be sent over to the 
//database
app.post("/signin", (req, res) => {
  const { password } = req.body;
  const storedPassword = "hello";

  if (password == storedPassword) {
    res.redirect("/mainpage");
  } else {
    res.status(401).send("Invalid username or password");
  }

});

//this is here as placeholder for when we have the login form page that will 
//check information that users enter  
app.post("/login", (req, res) => {
  const { password } = req.body;
  const storedPassword = "hello";

  if (password == storedPassword) {
    res.redirect("/mainpage");
  } else {
    res.status(401).send("Invalid username or password");
  }

});


//this is where users will be and it will be where they can enter the room code
//to begin the implementation of socket.io and join a room.
app.get("/mainpage", (req, res) => {
  res.sendFile(mainAppPath, (err) => {
    if (err) {
      console.error("Error sending page", err);
      res.status(500).send("Error loading page");
    }
  });
});



app.listen(port, () => {
    console.log(`Example app listening on port ${3000}`)
})

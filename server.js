
/********************************************************************************

* WEB322 – Assignment 06

*

* I declare that this assignment is my own work in accordance with Seneca's

* Academic Integrity Policy:

*

* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html

*

* Name: Dhrumit Ketan Parekh Student ID: 114748221 Date: 12-12-2023

* Published URL:

********************************************************************************/

const express = require("express");
const app = express();
const port = 8080;
const path = require("path");
const legoData = require("./modules/legoSets");
const authData = require('./modules/auth-service');
const bodyParser = require('body-parser');
const clientSessions = require('client-sessions');

app.use(bodyParser())
app.use(express.json())
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

authData.initialize()

legoData.initialize();

app.use((req, res, next) => {
  app.locals.currentRoute = req.path;
  next();
});


app.use(
  clientSessions({
    cookieName: 'session',
    secret: 'your-secret-key',
    duration: 24 * 60 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

const ensureLogin = (req, res, next) => {
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    next();
  }
};

app.post('/logout', (req, res) => {
  req.session.user = null;
  res.redirect('/login');
})

app.get('/', (req, res) => {
  res.locals.session = req.session;
  res.render("home");
});

app.get('/about', (req, res) => {
  res.render("about");
});

app.get('/lego/sets', async (req, res) => {
  try {
    const theme = req.query.theme;

    if (theme) {
      const setsByTheme = await legoData.getSetsByTheme(theme);
      res.render("sets", { sets: setsByTheme });
    } else {
      const allSets = await legoData.getAllSets();
      res.render("sets", { sets: allSets });
    }
  } catch (error) {
    console.error('Error in /lego/sets:', error);
    res.status(404).render("404", { message: "No Sets found for a matching theme." });
  }
});


app.get('/lego/sets/:setNum', async (req, res) => {
  const setNumParam = req.params.setNum;

  try {
    const legoSet = await legoData.getSetByNum(setNumParam);

    if (legoSet) {
      res.render("set", { set: legoSet });
    } else {
      res.status(404).render('404', { message: "Lego set not found." });
    }
  } catch (error) {
    console.log('Error in getSetByNum():', error);
    res.status(404).render("404", { message: "No Sets found for a specific set num." });
  }
});

app.get("/lego/addSet", ensureLogin, async (req, res) => {
  try {
    const themes = await legoData.getAllThemes();
    res.render("addSet", { themes });
  } catch (err) {
    res.render("500", { message: `Error: ${err.message}` });
  }
});

app.post('/lego/addSet', ensureLogin, async (req, res) => {
  try {
    const themes = await legoData.getAllThemes();
    await legoData.addSet(req.body);
    res.redirect('/lego/sets');
  } catch (err) {
    res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
});

app.get("/lego/editSet/:set_num", async (req, res) => {
  try {
    const set = await legoData.getSetByNum(req.params.set_num);
    const themes = await legoData.getAllThemes();

    res.render("editSet", { themes, set });
  } catch (err) {
    res.status(404).render("404", { message: err.message });
  }
});

app.post('/lego/editSet', ensureLogin, async (req, res) => {
  try {
    await legoData.editSet(req.body.set_num, req.body);
    res.redirect('/lego/sets');
  } catch (err) {
    res.status(500).render('500', { message: `I'm sorry, but we have encountered the following error: ${err.errors[0].message || err}` });
  }
});

app.get("/lego/deleteSet/:set_num", async (req, res) => {
  try {
    await legoData.deleteSet(req.params.set_num);
    res.redirect('/lego/sets');
  } catch (err) {
    res.status(500).render('500', { message: `I'm sorry, but we have encountered the following error: ${err.errors[0].message || err}` });
  }
});

app.get('/register', (req, res) => {
  const errorMessage = '';
  res.render('register', {
    errorMessage
  })
})

app.post('/register', async (req, res) => {
  try {
    let { userName, email, password1, password2 } = req.body;
    console.log(userName, email, password1, password2)
    if (password1 != password2) return res.status(400).render('register', { errorMessage: "Passwords do not match" });
    await authData.registerUser(userName, email, password1, password2);
    res.status(201).redirect('login');
  } catch (error) {
    res.status(500).render('500', { message: `I'm sorry, but we have encountered the following error: ${error}` })
  }
})

app.get('/login', (req, res) => {
  try {
    let errorMessage = '';
    res.render('login', { errorMessage });
  } catch (error) {
    res.status(500).render('500', { message: `I'm sorry, but we have encountered the following error: ${error}` })
  }
})

app.post('/login', async (req, res) => {
  try {
    const { userName, password } = req.body;
    const userAgent = req.get('User-Agent');
    console.log(userName, password, userAgent);
    let user = await authData.checkUser(userName, password, userAgent);
    if (user == 404) return res.render('login', { errorMessage: "User not fount" })
    if (user == 400) return res.render('login', { errorMessage: "Password not match" })
    req.session.user = user;
    res.redirect('/');
  } catch (error) {
    res.status(500).render('500', { message: `I'm sorry, but we have encountered the following error: ${error}` })
  }
})

app.get('/userHistory', ensureLogin, (req, res) => {
  let user = req.session?.user;
  res.render('userHistory', {
    user
  })
})

app.use((req, res, next) => {
  res.status(404).render("404", { message: "No view matched for a specific route" });
});

app.listen(port, () => console.log(`server listening on: ${port}`));
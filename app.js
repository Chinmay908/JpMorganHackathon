var express = require("express");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var morgan = require("morgan");
var User = require("./models/User");
var Job = require("./models/Jobs");
var Resource = require('./models/Resources');
var app = express();

// set our application port
app.set("port", 4000);
app.use(express.static("public"));
app.set("view engine", "ejs");

// set morgan to log info about our requests for development use.
app.use(morgan("dev"));

// initialize body-parser to parse incoming parameters requests to req.body
app.use(bodyParser.urlencoded({ extended: true }));

// initialize cookie-parser to allow us access the cookies stored in the browser.
app.use(cookieParser());

// initialize express-session to allow us track the logged-in user across sessions.
app.use(
  session({
    key: "user_sid",
    secret: "somerandonstuffs",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 600000,
    },
  })
);

// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
app.use((req, res, next) => {
  if (req.cookies.user_sid && !req.session.user) {
    res.clearCookie("user_sid");
  }
  next();
});

// middleware function to check for logged-in users
var sessionChecker = (req, res, next) => {
  if (req.session.user && req.cookies.user_sid) {
    res.redirect("/dashboard");
  } else {
    next();
  }
};

// route for Home-Page
app.get("/", sessionChecker, (req, res) => {
  res.redirect("/login");
});

// route for user signup
app
  .route("/signup")
  .get(sessionChecker, (req, res) => {
    //res.sendFile(__dirname + "/public/signup.html");
    res.render("signup");
  })
  .post((req, res) => {
    console.log(req.body);
    var user = new User({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      type: req.body.type,
    });
    let type = req.body.type;
    user.save((err, docs) => {
      console.log(err);
      if (err) {
        res.redirect("/signup");
      } else {
        console.log(docs);
        req.session.user = docs;
        if (type === "mentor") {
          res.render("mentorDetails");
        } else if (type === "alumini") {
          res.render("aluminiForm");
        } else if (type === "mentee") {
          res.render("menteeForm");
        } else if (type === "organisation") {
          res.render("organisationForm");
        }
        //res.redirect("/dashboard");
      }
    });
  });

// route for user Login
app
  .route("/login")
  .get(sessionChecker, (req, res) => {
    // res.sendFile(__dirname + "/public/index.html");
    res.render("login");
  })
  .post(async (req, res) => {
    var username = req.body.username,
      password = req.body.password;
      console.log(password);
    try {
      var user = await User.findOne({ username: username }).exec();
      if (!user) {
        res.redirect("/login");
      }
      user.comparePassword(password, (error, match) => {
        if (!match) {
          res.redirect("/login");
        }
      });
      req.session.user = user;
      res.redirect("/dashboard");
    } catch (error) {
      console.log(error);
    }
  });

// route for user's dashboard
app.get("/dashboard", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    //res.sendFile(__dirname + "/public/dashboard.html");
    //res.render("dashboard", { name: req.session.user.username });
    res.render("profile", { name: req.session.user.username,type:req.session.user.type,formDetails:req.session.user.formDetails });
  } else {
    res.redirect("/login");
  }
});

app.get("/getdata", (req, res) => {
  //console.log(req.session.user);
  res.send(req.session.user);
});

// route for user logout
app.get("/logout", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.clearCookie("user_sid");
    res.redirect("/");
  } else {
    res.redirect("/login");
  }
});

app.get('/connect',function(req,res){
  console.log('in connect')
  if (req.session.user && req.cookies.user_sid) {
    //res.sendFile(__dirname + "/public/dashboard.html");
    //res.render("dashboard", { name: req.session.user.username });
    User.find({username: {$ne: req.session.user.username}},function(err,users){
      if(err){
        console.log(err)
      }
      else{
        res.render('mentorsconnect',{users:users})
        //console.log(users)
      }
    })
    //res.render("mentorsconnect", { name: req.session.user.username,type:req.session.user.type,formDetails:req.session.user.formDetails });
    //res.render('mentorsconnect')
  } else {
    res.redirect("/login");
  }
})

app.get("/jobs", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    //res.sendFile(__dirname + "/public/dashboard.html");
    //res.render("dashboard", { name: req.session.user.username });
    Job.find({},function(err,jobs){
      if(err){
        console.log(err)
      }
      else{
        res.render("job.ejs", {jobs:jobs});
      }
    })
    //res.render("job.ejs", {jobs:jobs});
  } else {
    res.redirect("/login");
  }
});

app.get("/jobForm", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    //res.sendFile(__dirname + "/public/dashboard.html");
    //res.render("dashboard", { name: req.session.user.username });
    Job.find({}, function (err, jobs) {
      if (err) {
        console.log(err);
      } else {
        res.render("jobForm.ejs");
      }
    });
    //res.render("job.ejs", {jobs:jobs});
  } else {
    res.redirect("/login");
  }
});

app.post("/menteeDetails", function (req, res) {
  let formDetails = {
    name: req.body.name,
    age: req.body.age,
    gender: req.body.gender,
    education: req.body.education,
    skill: req.body.skill,
    experience: req.body.experience,
    institution: req.body.institution,
    domain: req.body.domain,
  };
  User.updateOne(
    { username: req.session.user.username, type: "mentee" },
    {
      $set: {
        formDetails: formDetails,
      },
    },
    null,
    (err, user) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/dashboard");
      }
    }
  );
});

app.post("/mentorDetails", function (req, res) {
  let formDetails = {
    name: req.body.name,
    age: req.body.age,
    gender: req.body.gender,
    field_of_interest: req.body.field_of_interest,
  };
  User.updateOne(
    { username: req.session.user.username, type: "mentor" },
    {
      $set: {
        formDetails: formDetails,
      },
    },
    null,
    (err, user) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/dashboard");
      }
    }
  );
});

app.post("/organisationDetails", function (req, res) {
  let formDetails = {
    name: req.body.name,
    place: req.body.place,
    field_of_work: req.body.field_of_work,
  };
  User.updateOne(
    { username: req.session.user.username, type: "organisation" },
    {
      $set: {
        formDetails: formDetails,
      },
    },
    null,
    (err, user) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/dashboard");
      }
    }
  );
});

app.post("/aluminiDetails", function (req, res) {
  let formDetails = {
    name: req.body.name,
    age: req.body.age,
    gender: req.body.gender,
    experience_with_org: req.body.experience_with_org,
  };
  User.updateOne(
    { username: req.session.user.username, type: "alumini" },
    {
      $set: {
        formDetails: formDetails,
      },
    },
    null,
    (err, user) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/dashboard");
      }
    }
  );
});

app.get("/profileDetails", function (req, res) {
  User.find({ _id: req.session.user._id }, function (err, user) {
    if (err) {
      console.log(err);
    } else {
      res.send({ profileDetails: user });
    }
  });
});

app.get("/allUsers", function (req, res) {
  User.find({}, function (err, users) {
    if (err) {
      console.log(err);
    } else {
      res.send({ allUsers: users });
    }
  });
});

app.post("/addJob", function (req, res) {
  let { title, description, type, salary, qualification } = req.body;
  console.log(req.body);
  let newJob = new Job({title: title, description:description, type:type, salary:salary, qualification: qualification});
  newJob.save(function (err, job) {
    if (err) {
      console.log(err);
    } else {
      return res.redirect("/jobs");
    }
  });
});

app.get("/getJobs", function (req, res) {
  Job.find({}, function (err, jobs) {
    if (err) {
      console.log(err);
    } else {
      res.send({ jobs: jobs });
    }
  });
});

app.post('/resources',function(req,res){
  let resource = new Resource(req.body.title,req.body.link);
  resource.save(function(err,resource){
    if(err){
      console.log(err);
    }
    else{
      res.send({message:'added'});
    }
  })
})

app.get('/resources',function(req,res){
  Resource.find({},function(err,resources){
    if(err){
      console.log(err);
    }
    else{
      res.send({resources:resources});
    }
  })
})

app.delete('/resources',function(req,res){
  Resource.deleteOne({_id:req.body._id},function(err,resource){
    if(err){
      console.log(err)
    }
    else{
      res.send({message:'deleted'})
    }
  })
})

// route for handling 404 requests(unavailable routes)
app.use(function (req, res, next) {
  res.status(404).send("Sorry can't find that!");
});

// start the express server
app.listen(app.get("port"), () =>
  console.log(`App started on port ${app.get("port")}`)
);

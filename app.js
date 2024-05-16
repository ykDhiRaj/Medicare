const express = require("express");

const app = express();

const path = require("path");
const bcrypt = require('bcrypt');
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const userModel = require("./models/user");
const hospitalModel = require("./models/hospital");
const adminModel = require("./models/admin");

app.set("view engine", "ejs");
app.use(express.json());
app.use(cookieParser())
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")));

app.get("/",(req,res)=>{
    res.render("index");
});

app.post("/create",async (req,res)=>{
    let{name,username,email,password} = req.body;
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(password, salt, async function(err, hash) {
            let user = await userModel.create({
                  name,
                  username,
                  email,
                  password:hash
              });
              var token = jwt.sign({ email: req.body.email }, 'shhhhh');
              res.cookie("token",token)
              res.redirect("/profile")
        });
    });
});

app.get("/login",(req,res)=>{
    res.render("login");
});

app.post("/login",async (req,res)=>{
    let{password} = req.body;
  let user = await userModel.findOne({email:req.body.email});
  if(user){
    
      bcrypt.compare(password, user.password, function(err, result) {
        if(result == true){
            var token = jwt.sign({ email: req.body.email }, 'shhhhh');
            res.cookie("token",token)
            res.redirect("/profile")
        }
        else{
            res.redirect("/login")
        }
    });
  }
  else{
    res.redirect("/login");
  }
});

app.get("/logout",(req,res)=>{
    res.cookie("token","");
    res.redirect("/login");
})

app.get("/profile",isLoggedIn,async (req,res)=>{
      let user = req.user;
      let requser = await userModel.findOne({email:user.email});
      if(requser){
          let hospitalList = await hospitalModel.find();
          res.render("profile",{hospitalList,requser});
      }
      else{
        res.send("Something went wrong")
      }
});

app.get("/appointments",isLoggedIn, async (req,res)=>{
    let appointments = await userModel.findOne().populate("accapp");
    // console.log(appointments);
    res.render("appointment",{appointments})
})


app.get("/book/:id/:userid",isLoggedIn, async(req,res)=>{
    // let user = req.user;
    let hospital = await hospitalModel.findOne({_id:req.params.id});
   let appointeduser =  await userModel.findOne({_id:req.params.userid});
   if (hospital.user.includes(req.params.userid)) {
    // If the user already has an appointment, send a response indicating that
    return res.status(400).send("User already has an appointment with this hospital.");
}
   appointeduser.appointments.push(req.params.id);
   hospital.user.push(req.params.userid);
   await appointeduser.save();
   await hospital.save();
   res.redirect("/profile");
});

app.get("/admincreate",(req,res)=>{
    let password = "1234";
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(password, salt, async function(err, hash) {
            let user = await adminModel.create({
                  name:"Admin",
                  email:"admin@mail.com",
                  password:hash
              });
              var token = jwt.sign({ email: req.body.email }, 'shhhhh');
              res.cookie("token",token)
              res.redirect("/profile")
        });
    });
});

app.get("/admin",(req,res)=>{
    res.render("admin")
})

app.post("/admin",async (req,res)=>{
    let{password} = req.body;
    let user = await adminModel.findOne({email:req.body.email});
    if(user){
      
        bcrypt.compare(password, user.password, function(err, result) {
          if(result == true){
              var token = jwt.sign({ email: req.body.email }, 'secret1');
              res.cookie("token",token)
              res.redirect("/adminprofile");
          }
          else{
              res.redirect("/login")
          }
      });
    }
    else{
      res.redirect("/login");
    }
});

app.get("/adminprofile",isAdmin, async (req,res)=>{
    let user = req.user;
    let admin = await adminModel.findOne({email:"admin@mail.com"}).populate("register")
    if(admin){
        res.render("adminprofile",{admin});
    }
});

app.get("/reject/:id",async (req,res)=>{
    let rejectedhospital = await hospitalModel.findOneAndDelete({_id:req.params.id});
    res.redirect("/adminprofile");
});

app.get("/registerhospital",(req,res)=>{
    res.render("registerhospital");
});

app.post("/registerhospital", async (req,res)=>{
    let admin = await adminModel.findOne({email:"admin@mail.com"});
    // let users = await userModel.find();
    let{name,email,password} = req.body;
    let checkhospital = await hospitalModel.findOne({email:email});
    
    if(checkhospital){
      res.send("Hospital already exists");
    } 
    else{
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(password, salt, async function(err, hash) {
            let hospital = await hospitalModel.create({
                  name,
                  email,
                  password:hash,
                  admin:admin._id
              });
              var token = jwt.sign({ email: req.body.email }, 'secret');
              res.cookie("token",token)
              admin.register.push(hospital._id);
            //   users.appointments.push(hospital._id)
              await admin.save();
            //   await users.save();
              res.redirect("/hospitalprofile");
            });
          
    });}
});

app.get("/loginhospital",(req,res)=>{
    res.render("hospitallogin");
})

app.post("/loginhospital", async (req,res)=>{
  let{password} = req.body;
  let hospital = await hospitalModel.findOne({email:req.body.email});
  if(hospital){
    
      bcrypt.compare(password, hospital.password, function(err, result) {
        if(result == true){
            var token = jwt.sign({ email: req.body.email }, 'secret');
            res.cookie("token",token)
            res.redirect("/hospitalprofile")
        }
        else{
            res.redirect("/loginhospital");
        }
    });
  }
  else{
    res.redirect("/loginhospital");
  }
});


app.get("/hospitalprofile",isHospital, async (req,res)=>{

        let user = req.user;
        let hospital =  await hospitalModel.findOne({email:user.email}).populate("user");
        res.render("request",{hospital});
        console.log(hospital);
       
})

app.get("/acceptapp/:id/:hospitalid", async (req,res)=>{
  let user = await userModel.findOne({_id:req.params.id});
  let hospital = await hospitalModel.findOne({_id:req.params.hospitalid});
  // if (!user.accapp) {
  //   user.accapp = [];
  // }
   user.accapp.push(req.params.hospitalid);
  await user.save();
//   hospital.user = hospital.user.filter(id => id.toString() !==req.params.id);
//   await hospital.save();
//   setTimeout(async ()=>{
//     hospital.user = hospital.user.filter(id => id.toString() !== req.params.id);
//       await hospital.save();
//   },24 * 60 * 60 * 1000)
  
  res.redirect("/hospitalprofile");
});

app.get("/rejectapp/:id/:hospitalid", async (req,res)=>{
//   let users = await userModel.findOne({_id:req.params.id});
  let hospital = await hospitalModel.findOne({_id:req.params.hospitalid});
//   users.accapp.push(req.params.hospitalid);
//   await users.save();
  hospital.user = hospital.user.filter(id => id.toString() !==req.params.id);
  await hospital.save();
  res.redirect("/hospitalprofile")
});


function isLoggedIn (req,res,next){

    if(req.cookies.token === "" || !req.cookies.token){
        res.redirect("/");
       
    }
    else{
      let data = jwt.verify(req.cookies.token,"shhhhh");
      req.user = data;
      next();
    }
}

function isAdmin (req,res,next){

    if(req.cookies.token === "" || !req.cookies.token){
        res.redirect("/");
       
    }
    else{
      let data = jwt.verify(req.cookies.token,"secret1");
      req.user = data;
      next();
    }
}

function isHospital (req,res,next){
    
    if(req.cookies.token === "" || !req.cookies.token ){
        res.redirect("/");
       
    }
    else{
      let data = jwt.verify(req.cookies.token,"secret");
      req.user = data;
      next();
    }
}

app.listen(3000);
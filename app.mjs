import express from "express";
import path from "path";
import mongoose from "./mongoDbConnection/mongoConnection.mjs";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import session from "express-session";
import flash from "connect-flash";
import passport from "passport";
import setUpPassport from "./setuppassport.mjs";
import routes from "./routes.mjs";
import "dotenv/config";

// Sicurezza
import helmet from "helmet";
import csurf from "csurf";

console.log("Mongoose connection state:", mongoose.connection.readyState);

const app = express();
setUpPassport();

// Configurazioni di base
app.set("port", process.env.PORT || 3000);

// esm render
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.set("views", path.join(__dirname, "views"));

app.set("view engine", "ejs");

// Middleware statici
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static("views"));
console.log("NODE_ENV:", process.env.NODE_ENV);

// =======================
// 🔒 Sicurezza
// =======================

// Nasconde l'header "X-Powered-By"
app.disable("x-powered-by");

// Helmet - Protezione generale
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://cdnjs.cloudflare.com",
          "https://maxcdn.bootstrapcdn.com"
        ],
        styleSrc: [
          "'self'",
          "https://maxcdn.bootstrapcdn.com",
          "https://cdnjs.cloudflare.com"
        ],
        fontSrc: [
          "'self'",
          "https://cdnjs.cloudflare.com",
          "https://fonts.googleapis.com",
          "https://fonts.gstatic.com",
          "https://maxcdn.bootstrapcdn.com" // 🔥 Aggiunto qui
        ],
      },
    },
    xssFilter: true,
    frameguard: { action: "deny" },
    noSniff: true,
  })
);

// Forza HTTPS (solo in produzione)
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] !== "https") {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// Protezione CSRF (solo per richieste mutabili)
app.use(
  csurf({
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    },
  })
);

// Aggiunge il token CSRF alle views
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// =======================
// 🛡️ Gestione sessioni
// =======================
app.use(
  session({
    secret: process.env.SESSION_SECRET,  // 🔐 Usa la variabile d'ambiente
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production", 
      sameSite: "strict",
    },
  })
);


app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// =======================
// 🌐 Routes
// =======================
app.use(routes);

// =======================
// 🚀 Avvio del server
// =======================
app.listen(app.get("port"), () => {
  console.log("Server started on port " + app.get("port"));
});

import mongoose from "mongoose";

mongoose.connect("mongodb://localhost:27017/test");

const db = mongoose.connection;

db.on("error", console.error.bind(console, "Errore di connessione a MongoDB:"));
db.once("open", () => {
  console.log("Connessione a MongoDB riuscita!");
});

export default mongoose; // Esporta l'istanza di mongoose

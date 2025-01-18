const mongoose = require("mongoose");

const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;

const StockSchema = new mongoose.Schema({
    data: {
        type: Array,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Stock = mongoose.model('Stock', StockSchema);

const connect = () => {
    mongoose.connect(`mongodb+srv://root:root@cluster0.ctxaz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`);

    const connection = mongoose.connection;

    connection.on('error', () => {
        console.error("Erro ao connectar com o mongoDB");
    })

    connection.on("open", () => {
        console.log("Conectado com o mongoDB");
    })
}

connect();

module.exports = Stock;
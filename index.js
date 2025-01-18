const axios = require("axios");
const cheerio = require("cheerio");
const express = require("express");
const cors = require("cors");
require("dotenv").config();



const Stock = require("./database/connection");
const app = express();
const URL = "https://investidor10.com.br/acoes";
const tags = [
    "VBBR3", "BAZA3", "GOAU3", "LEVE3", "VALE3",
    "KEPL3", "BRAP4", "CMIG4", "VLID3", "PETR3",
    "BBAS3", "CEBR5", "BBSE3", "PSSA3", "ODPV3",
    "ITUB3", "CGAS5", "CPFE3", "TIMS3", "EGIE3",
    "PRIO3", "VULC3", "ISAE3", "POMO4", "VIVA3",
    "ITSA3", "SANB11", "MILS3", "SAPR11", "CXSE3",
    "CLSC3", "TTEN3", "CSMG3", "TAEE11", "RECV3",
    "BRSR5", "BEEF3", "CSAN3", "ABEV3", "STBP3",
    "WEGE3", "BRFS3", "MYPK3", "JBSS3", "TUPY3",
    "AZUL4", "MULT3", "B3SA3", "ELET5", "UGPA3",
    "CPLE5", "RAIZ4", "SOJA3", "SLCE3", "SHUL4",
    "TASA3", "AURE3", "SUZB3", "VIVT3", "EMBR3",
    "RANI3", "BBDC3", "IGTA3", "AGRO3", "KLBN11",
    "ROMI3", "ALOS3", "JALL3", "FESA4", "USIM5",
    "BRBI11"
];

const PORT = 3003;
const CONCURRENT_LIMIT = 1;

app.use(cors());

(async () => {
    const pLimit = (await import("p-limit")).default;

    app.get("/latest-stock", async (req, res) => {
        try {
            const latestStock = await Stock.find({}).sort({ createdAt: -1 }).limit(1);

            if (!latestStock || latestStock.length === 0) {
                return res.status(404).json({ message: "Nenhum dado encontrado." });
            }

            res.status(200).json({ latestStock: latestStock[0] });
        } catch (error) {
            console.error("Erro ao buscar dados no banco", error);
            res.status(500).json({ message: "Erro ao buscar dados no banco." });
        }
    });


    app.get("/stocks", async (req, res) => {
        try {
            const stocks = await Stock.find({});

            if (stocks.length === 0) {
                return res.status(404).json({ message: "Nenhum dado encontrado." });
            }
            res.status(200).json({ stocks });
        } catch (error) {
            console.error("Erro ao buscar dados no banco", error);
            res.status(500).json({ message: "Erro ao buscar dados no banco." });
        }
    });


    app.get("/info", async (req, res) => {
        try {
            const info = await getTickes(pLimit);
            res.status(200).json({ info });
        } catch (error) {
            res.status(500).json({
                message: "Error fetching posts"
            });
        }
    });

    async function getTickes(pLimit) {
        const limit = pLimit(CONCURRENT_LIMIT);

        const promises = tags.map((tag) =>
            limit(async () => {
                try {
                    const response = await axios.get(`${URL}/${tag}`, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                        }
                    });
                    const html = response.data;
                    const $ = cheerio.load(html);

                    const indicators = {};

                    $('#table-indicators .cell').each((i, element) => {
                        const titulo = $(element).find('span.d-flex').text().trim();
                        const valor = $(element).find('div.value span').text().trim();

                        if (titulo && valor) {
                            const formattedTitulo = titulo.replace(/\s+/g, '_');
                            indicators[formattedTitulo] = valor;
                        }
                    });

                    const cotacaoTexto = $('._card.cotacao')
                        .find('._card-body')
                        .find('div:first')
                        .find('span')
                        .text()
                        .trim();

                    const src = $('.page-subheader .logo img').attr('src');
                    const logo = 'https://investidor10.com.br' + src;

                    console.log(`===== ✅ SUCESSO: ${tag} =====`);
                    console.log(`Cotação: ${cotacaoTexto}`);
                    console.log("=====================================\n");

                    return { tag, cotacao: cotacaoTexto, logo: logo, indicators };

                } catch (error) {
                    console.error(`===== ❌ ERRO: ${tag} =====`);
                    console.error(`Erro: ${error.message}`);
                    console.error("=====================================\n");
                    return { tag, indicators: null, cotacaoTexto: null };
                }
            })
        );

        const data = await Promise.all(promises); // Espera todas as promessas terminarem

        try {
            const stockData = new Stock({ data });
            await stockData.save();
            console.log("Dados salvos com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar os dados:", error.message);
        }

        return data;
    }

    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
})();


require("./database/connection");
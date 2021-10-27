const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const { MongoClient } = require("mongodb");
const port = process.env.PORT || 5000;

// setting up middlewares
app.use(cors());
app.use(express.json());
// step by step aga setup and connection er kaj ses korte hobe..
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.23ilw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();

    // LOAD ALL PRODUCTS BY GET API
    const database = client.db("Online_Shop");
    const productCollection = database.collection("products");
    const orderCollection = database.collection("orders");
    // setting up get api to load specific products based on page numbers
    app.get("/products", async (req, res) => {
      const cursor = productCollection.find({});

      //   i need to set the count value of all products before i am changing the cursor by sizing coz it works by reference..
      const count = await cursor.count();
      const page = req.query.page;
      //   i need to make it integer coz the limit should be integer value
      const size = parseInt(req.query.size);
      let products;
      if (page) {
        //   here skip for skiping the products of prvs pages and limit for getting the first 10 products after skip
        products = await cursor
          .skip(page * size)
          .limit(10)
          .toArray();
      } else {
        //   when i can figoure that i have to use await here?...i need to understand this properly
        products = await cursor.toArray();
      }
      res.json({
        count,
        products,
      });
    });
    // setting up post api for loading data from db based on keys from local db
    app.post("/products/bykeys", async (req, res) => {
      const keys = req.body;
      const query = { key: { $in: keys } };
      const products = await productCollection.find(query).toArray();
      res.json(products);
    });
    // Add Order Api
    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.json(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Updated here");
});

app.listen(port, () => {
  console.log("Listening port on", port);
});

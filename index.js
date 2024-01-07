const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cai2g.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = (req, res, next) => {
  const token = req?.headers?.authorization;
  // console.log('token in the middleware', token);
  // no token available
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const toysCollection = client.db("robots").collection("toys");
    const testimonialsCollection = client.db("robots").collection("testimonials");

    app.get("/allToys", async (req, res) => {
      // const sellerEmail = req.query.email;
      // console.log(sellerEmail);
      let query = {};
      if (req.query?.sellerEmail) {
        query = { sellerEmail: req.query.email };
      }
      const result = await toysCollection.find(query).toArray();
      res.send(result);
    });

    app.get('/testimonials', async(req, res) =>{
      const result = await testimonialsCollection.find().toArray()
      res.send(result)
    })

    app.get("/sellerToys", async (req, res) => {
      const sellerEmail = req.query.email;
      // console.log(sellerEmail);

      try {
        const query = { sellerEmail: sellerEmail };
        const sellerToys = await toysCollection.find(query).toArray();
        res.send(sellerToys);
      } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.put("/updateToy/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedBooking = req.body;
      const updateDoc = {
        $set: {
          name: updatedBooking.name,
          pictureURL: updatedBooking.pictureURL,
          pictureURL: updatedBooking.pictureURL,
          price: parseFloat(updatedBooking.price),
          rating: parseFloat(updatedBooking.rating),
          availableQuantity: parseFloat(updatedBooking.availableQuantity),
          subCategory: updatedBooking.subCategory,
          description: updatedBooking.description,
        },
      };

      const result = await toysCollection.updateOne(filter, updateDoc)
      res.send(result)
    });

    app.delete("/addedToy/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysCollection.findOne(query);
      res.send(result);
    });

    app.post("/addToy", async (req, res) => {
      const toy = req.body;
      const result = await toysCollection.insertOne(toy);
      res.send(result);
    });

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Robot is Running");
});

app.listen(port, () => {
  console.log(`Robot is Running ${port}`);
});

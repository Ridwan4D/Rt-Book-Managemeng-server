const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));
app.use(express.json())
app.use(cookieParser())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yyjvuyt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// ================================================== middle ware start ==================================================
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  // this is for no token (no token are found)
  if (!token) {
    return res.status(401).send({ message: 'Unauthorized Access' })
  }
  // in this case user have the token and we have to check is the token is valid
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
    if (err) {
      return res.status(401).send({ message: 'Unauthorized Access' })
    }
    req.user = decode;
    next();
  })
}
// ================================================== middle ware end ==================================================


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const booksCollection = client.db("libraryBooksdb").collection("books");
    const borrowCollection = client.db("libraryBooksdb").collection("borrowBooks");
    const categoryCollection = client.db("libraryBooksdb").collection("category");

    // authorization related apis
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none'
        })
        .send({ success: true })
    })
    app.post('/logout', async (req, res) => {
      const user = req.body;
      console.log("logging out user: ", user);
      res
        .clearCookie('token', { maxAge: 0 })
        .send({ success: true })
    })

    // category related apis
    app.get("/allCategories", async (req, res) => {
      const cursor = categoryCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })

    app.get("/bookOfCategory/:bookCategory", async (req, res) => {
      const query = req.params.bookCategory
      const filter = { bookCategory: query }
      console.log(query);
      const result = await booksCollection.find(filter).toArray();
      res.send(result);
    })


    // all book related apis
    app.get("/allBooks", async (req, res) => {
      const result = await booksCollection.find().toArray()
      res.send(result)
    })

    app.get("/allBooks/:id", async (req, res) => {
      const id = req.params.id
      console.log(id);
      const query = { _id: new ObjectId(id) }
      const result = await booksCollection.findOne(query)
      res.send(result)
    })


    app.post("/addBooks",verifyToken, async (req, res) => {
      const bookInfo = req.body;
      const result = await booksCollection.insertOne(bookInfo);
      res.send(result);
    })

    app.patch("/addBooks/:id", async (req, res) => {
      const id = req.params.id
      const bookInfo = req.body
      const filter = { _id: new ObjectId(id) }
      const updateQuantity = {
        $set: {
          quantity: bookInfo.quantity
        }
      }
      const result = await booksCollection.updateOne(filter, updateQuantity);
      res.send(result)
    })

    app.put("/addBooks/:id", async (req, res) => {
      const id = req.params.id
      const updatedBook = req.body
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updateBook = {
        $set: {
          image: updatedBook.image,
          book: updatedBook.book,
          author: updatedBook.author,
          selectOption: updatedBook.selectOption,
          rating: updatedBook.rating,
        }
      }
      const result = await booksCollection.updateOne(filter, updateBook, options);
      res.send(result)
    })


    // borrow book related apis
    app.get("/allBorrowBooks/:email", async (req, res) => {
      const query = { email: req.params.email };
      const result = await borrowCollection.find(query).toArray();
      res.send(result)
    })

    app.post("/addBorrowBooks", async (req, res) => {
      const bookInfo = req.body;
      const result = await borrowCollection.insertOne(bookInfo);
      res.send(result);
    })

    app.delete("/allBorrowBooks/:id", async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await borrowCollection.deleteOne(query)
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get("/", (req, res) => {
  res.send("Book library server is running")
})


app.listen(port, () => {
  console.log(`server is running from: ${port}`);
})
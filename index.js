const express = require('express');
const cors = require('cors');
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())



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

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const booksCollection = client.db("libraryBooksdb").collection("books");


    app.get("/allBooks",async(req,res)=>{
      const result = await booksCollection.find().toArray()
      res.send(result)
    })

    app.get("/allBooks/:id",async(req,res)=>{
      const id = req.params.id
      console.log(id);
      const query = {_id : new ObjectId(id)}
      const result = await booksCollection.findOne(query)
      res.send(result)
    })

    app.post("/addBooks", async (req, res) => {
      const bookInfo = req.body;
      const result = await booksCollection.insertOne(bookInfo);
      res.send(result);
    })

    app.put("/addBooks/:id",async(req,res)=>{
      const id = req.params.id
      const updatedBook = req.body
      const filter = {_id: new ObjectId(id)}
      const options = { upsert: true };
      const updateBook = {
        $set:{
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
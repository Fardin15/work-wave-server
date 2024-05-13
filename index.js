const express = require("express");
const cors = require("cors");
// const jwt = require("jsonwebtoken");
// const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 8000;

const app = express();

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
  ],
  credential: true,
  optionSuccessStatus: 200,
};

// middlewares
app.use(cors(corsOptions));
app.use(express.json());
// app.use(cookieParser());

// verify jwt middleware
// const verifyToken = (req, res, next) => {
//   const token = req.cookies?.token;
//   if (!token) {
//     return res.status(401).send({ message: "unauthorized access" });
//   }
//   if (token) {
//     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
//       if (error) {
//         return res.status(401).send({ message: "unauthorized access" });
//       }
//       console.log(decoded);
//       req.user = decoded;
//       next();
//     });
//   }
// };

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lnrcai2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // collections
    const jobsCollection = client.db("workWave").collection("jobs");
    const appliedCollection = client.db("workWave").collection("appliedJobs");

    // jwt generator
    // app.post("/jwt", async (req, res) => {
    //   const email = req.body;
    //   const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    //     expiresIn: "365d",
    //   });
    //   res
    //     .cookie("token", token, {
    //       httpOnly: true,
    //       secure: true,
    //       sameSite: "none",
    //       maxAge: 60 * 60 * 1000,
    //     })
    //     .send({ success: true });
    // });

    // clear toke on log out
    // app.get("/logout", (req, res) => {
    //   res
    //     .clearCookie("token", {
    //       httpOnly: true,
    //       secure: process.env.NODE_ENV === "production",
    //       sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    //       maxAge: 0,
    //     })
    //     .send({ success: true });
    // });

    // get all jobs data
    app.get("/jobs", async (req, res) => {
      const result = await jobsCollection.find().toArray();
      res.send(result);
    });

    // get a single jobs data
    app.get("/job/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    // post a job data in database
    app.post("/job", async (req, res) => {
      const jobData = req.body;
      const result = await jobsCollection.insertOne(jobData);
      res.send(result);
    });

    // get data for my job page which i posted by email
    app.get("/jobs/:email", async (req, res) => {
      const email = req.params.email;
      const query = { owner_email: email };
      const result = await jobsCollection.find(query).toArray();
      res.send(result);
    });

    // delete a job from database
    app.delete("/job/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.deleteOne(query);
      res.send(result);
    });

    // update jobs details in database
    app.put("/job/:id", async (req, res) => {
      const id = req.params.id;
      const jobData = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateJob = {
        $set: {
          ...jobData,
        },
      };
      const result = await jobsCollection.updateOne(query, updateJob, options);
      res.send(result);
    });

    // post applied on jobs and save data in database
    app.post("/applied", async (req, res) => {
      const appliedData = req.body;
      const result = await appliedCollection.insertOne(appliedData);
      res.send(result);
    });

    // get data for applied page by email
    app.get("/applied-jobs/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await appliedCollection.find(query).toArray();
      res.send(result);
    });

    // get data for filter by category
    app.get("/job-counts", async (req, res) => {
      const filter = req.query.filter;
      let query = {};
      if (filter) query = { category: filter };
      const result = await appliedCollection.find(query).toArray();
      res.send(result);
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
  res.send("Hello World");
});

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});

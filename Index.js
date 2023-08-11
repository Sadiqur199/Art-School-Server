const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')
const jwt = require('jsonwebtoken');
const port = process.env.Port || 5000


//middleware file  
app.use(cors())
app.use(express.json())



//json web token verify function

const verifyJwt = (req , res , next) =>{
  const authorization =  req.headers.authorization
  if(!authorization){
      return res.status(401).send({error: true , message: 'unAuthorized access '})
  }
 
  const token = authorization.split(' ')[1];
 
  jwt.verify(token , process.env.ACCESS_TOKEN_SECRET , (error , decoded) => {
   if(error){
     return res.status(401).send({error: true , message: 'unAuthorized access '})
   }
 
   req.decoded = decoded
   next();

  })
 }
 


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_KEY}@cluster0.ab4114m.mongodb.net/?retryWrites=true&w=majority`;

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
     client.connect();

       
     const Users = client.db("ArtSchool").collection("user");
     const popularClasses = client.db("ArtSchool").collection("class");
     const instructor = client.db("ArtSchool").collection("instructor");
     const selectCourse = client.db("ArtSchool").collection("course");


     //Json Web Token
     app.post('/jwt',(req,res)=>{
      const user = req.body
      const token = jwt.sign(user , process.env.ACCESS_TOKEN_SECRET,{ expiresIn: '1h' })
      res.send({token})
     })

     const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await Users.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }

     //user 

     app.get('/users',verifyJwt,verifyAdmin,async(req,res)=>{
      const result = await Users.find().toArray()
      res.send(result)
     })

     app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await Users.findOne(query);
        console.log(existingUser)
      if (existingUser) {
        return res.send({ message: 'user already exists' })
      }

      const result = await Users.insertOne(user);
      res.send(result);
    });


    app.get('/users/admin/:email',verifyJwt,async(req,res)=>{
      const email = req.params.email

      if(req.decoded.email !== email){
        res.send({admin : false})
      }

      const query = {email: email}
      const user = await Users.findOne(query)
      const result = {admin: user?.role === 'admin'}
      res.send(result)
    })

    app.get('/users/instructor/:email',verifyJwt,async(req,res)=>{
      const email = req.params.email

      if(req.decoded.email !== email){
        res.send({instructor : false})
      }

      const query = {email: email}
      const user = await Users.findOne(query)
      const result = {instructor: user?.role === 'instructor'}
      res.send(result)
    })



    app.patch('/users/admin/:id',async(req,res)=>{
      const id = req.params.id
      const filter = {_id: new ObjectId(id)}

      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };

      const result = await Users.updateOne(filter,updateDoc)
      res.send(result)

    })
    app.patch('/users/instructor/:id',async(req,res)=>{
      const id = req.params.id
      const filter = {_id: new ObjectId(id)}

      const updateDoc = {
        $set: {
          role: 'instructor'
        },
      };

      const result = await Users.updateOne(filter,updateDoc)
      res.send(result)

    })



     //popular class related api
     app.get('/class',async(req,res)=>{
      const result = await popularClasses.find().toArray()
      res.send(result)
     })
     app.get('/instructor',async(req,res)=>{
      const result = await instructor.find().toArray()
      res.send(result)
     })


     //select course
  
     app.get('/select',verifyJwt, async (req, res) => {
      const email = req.query.email;

      if (!email) {
        res.send([]);
      }

      const decodedEmail = req.decoded.email

      if(email !== decodedEmail){
        return res.status(403).send({error: true , message: 'Forbidden access '})
      }


      const query = { email: email };
      const result = await selectCourse.find(query).toArray();
      res.send(result);
    });


     app.post('/select',async(req,res)=>{
      const item = req.body;
      const result = await selectCourse.insertOne(item)
      res.send(result)

     })

     app.delete('/select/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await selectCourse.deleteOne(query);
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




app.get('/',(req,res)=>{
  res.send('Art & Carft School is running')
})

app.listen(port,()=>{
  console.log(`Art & Carft School is running port${port}`)
})


// 
// 
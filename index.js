const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt =require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;



const app = express();

//middleware
app.use(cors());
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sa2k7xp.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next){
    const authHeader =req.headers.authorization;
    if(!authHeader){
        return res.status(401).send('unauthorized access')
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
        if(err){
            return res.status(403).send({message: 'forbiden access'})
        }
        req.decoded = decoded;
        next();
    })

}

async function run(){
try{
    const categoryCollection = client.db('secondHandUser').collection('categories')
    const productCollection = client.db('secondHandUser').collection('products')
    const bookingCollection = client.db('secondHandUser').collection('bookings')
    const usersCollection = client.db('secondHandUser').collection('users')


//load categories
    app.get('/categories', async(req,res)=>{
        const query = {}
        const options = await categoryCollection.find(query).toArray();
        res.send(options)
    })

    //load category products
    app.get('/categories/:id', async(req,res)=>{
        const id = req.params.id;
        const query = {}
        const products = await productCollection.find(query).toArray();
        const product_collection = products.filter(p => p.category_id == id)
        console.log(products, id)
        res.send(product_collection)
    })

    //post modal data

    app.post('/bookings', async(req,res) =>{
        const booking = req.body
        console.log(booking)
        const result = await bookingCollection.insertOne(booking);
        res.send(result)
    })

    //order

    app.get('/bookings', verifyJWT, async (req,res)=>{
        const email = req.query.email;
        const decodedEmail = req.decoded.email;

        if(email !==decodedEmail){
            return res.status(403).send({message: 'forbidden access'});
        }
        const query = {email:email};
        const bookings = await bookingCollection.find(query).toArray();
        res.send(bookings);
    })

    //jwt
    app.get('/jwt',async(req,res) =>{
        const email =req.query.email;
        const query ={email: email};
        const user = await usersCollection.findOne(query)
        if(user){
            const token =jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '72hr'})
            return res.send({accessToken: token});
        }

        res.status(403).send({accessToken:''})
    })

    //users save
    app.post('/users', async(req,res) =>{
        const user = req.body;
        const result = await usersCollection.insertOne(user);
        res.send(result);
    })

    
}
finally{

}
}
run().catch(console.log)


app.get('/', async (req,res)=>{
    res.send('please buy a mobilePhone')
})

app.listen(port, ()=> console.log(`second hand mobile user running on ${port}`))
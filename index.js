const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const myProductsCollection = client.db('secondHandUser').collection('myProducts')


//load categories
    app.get('/categories', async(req,res)=>{
        const query = {}
        const options = await categoryCollection.find(query).toArray();
        res.send(options)
    })

    //load category products
    app.get('/singlecategories/:id', async(req,res)=>{
        const id = req.params.id;
        const query = {_id:ObjectId(id)}
        const products = await categoryCollection.findOne(query);
        res.send(products)
        // const product_collection = products.filter(p => p.category_id == id)
        // console.log(products, id)
        // res.send(product_collection)
    })

    app.get('/allProducts/:id',async(req, res)=>{
        const brand = req.params.id;
        // console.log(brand)
        const query = {Brand:brand};
        const result = await productCollection.find(query).toArray();
        console.log(result)
        res.send(result)

    })

    app.get('/reportedProducts', verifyJWT, async(req, res)=>{
        const query = {
            reported : 'true'
        }
        const product = await productCollection.find(query).toArray();
        res.send(product)
    })

    app.delete('/reportedProducts/:id', verifyJWT, async(req, res)=>{
        const id = req.params.id;
        const filter = { _id: ObjectId(id) };
        const result = await productCollection.deleteOne(filter);
        res.send(result);
    })

    app.put('/allProducts/:id',  async (req, res)=>{
        const id = req.params.id;
        const filter = { _id: ObjectId(id) };
        const updateDoc = {
            $set:{
                reported: 'true',
            }
        }
        const result = await productCollection.updateOne(filter,updateDoc)
        res.send(result);

    })


    //
    // app.put('/sellerVerify/:email', async (req,res)=>{
    //     const id = req.params.email;
    //     console.log(id)

    // })

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

    //add data 
    app.get('/addProductCategory', async(req,res)=>{
        const query= {}
        const result =await categoryCollection.find(query).toArray();
        res.send(result)

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

    app.get('/users', async(req,res)=>{
        const query ={};
        const users = await usersCollection.find(query).toArray();
        res.send(users);
    })

    //is admin check
    app.get('/users/admin/:email', async(req,res) =>{
        const email = req.params.email;
        const query = {email}
        const user = await usersCollection.findOne(query);
        res.send({isAdmin: user?.role === 'admin'});
       })
//..//

    app.post('/users', async(req,res) =>{
        const user = req.body;
        const result = await usersCollection.insertOne(user);
        res.send(result);
    })

    //user delte
        
app.delete('/users/:id',verifyJWT,async (req,res) =>{
    const id =req.params.id;
    const filter = {_id: ObjectId(id)};
    const result =await usersCollection.deleteOne(filter);
    res.send(result);

})

   


    // seller
    app.get('/sellers', async(req,res)=>{
        const query ={role: 'seller'};
        const seller = await usersCollection.find(query).toArray();
        res.send(seller);
    
    })

    //sellerDelete
app.delete('/sellers/:id',verifyJWT,async (req,res) =>{
    const id =req.params.id;
    const filter = {_id: ObjectId(id)};
    const result =await usersCollection.deleteOne(filter);
    res.send(result);

})


//verify
    app.get('/users/sellers/:email',  async(req,res)=>{
        const email = req.params.email;
        const query = {email}
        const user = await usersCollection.findOne(query);
        res.send({isSeller: user?.role === 'seller'})
    })

    //admin
    app.put('/users/admin/:id',verifyJWT, async(req,res)=>{
        const  decodedEmail =req.decoded.email;
        const query ={email: decodedEmail};
        const user =await usersCollection.findOne(query);

        if(user?.role !== 'admin'){
            return res.status(403).send({message: "forbidden acces"})
        }

        const id =req.params.id;
        const filter = {_id: ObjectId(id)}
        const options = {upsert: true};
        const updatedDoc = {
            $set:{
                role: 'admin'
            }
        }
        const result =await usersCollection.updateOne(filter, updatedDoc,options);
    })


    //seller
    app.put('/users/seller/:id', async(req,res)=>{
        const id =req.params.id;
        const filter = {_id: ObjectId(id)}
        const options = {upsert: true};
        const updateDoc = {
            $set:{
                role: 'seller'
            }
        }
    })
    

    //addmyProducts

    app.get('/myProducts/:email',verifyJWT, async(req,res)=>{
        const email = req.params.email;
        console.log(email)
        const query ={sellerEmail : email};
        const myProduct = await productCollection.find(query).toArray();
        res.send(myProduct);
    })


    app.post('/myProducts',verifyJWT, async(req,res)=>{
        const myProduct = req.body;
        const result = await productCollection.insertOne(myProduct);
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
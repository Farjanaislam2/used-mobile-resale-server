const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;



const app = express();

//middleware
app.use(cors());
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sa2k7xp.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run(){
try{
    const categoryCollection = client.db('secondHandUser').collection('categories')
    const productCollection = client.db('secondHandUser').collection('products')



    app.get('/categories', async(req,res)=>{
        const query = {}
        const options = await categoryCollection.find(query).toArray();
        res.send(options)
    })

    app.get('/categories/:id', async(req,res)=>{
        const id = req.params.id;
        const query = {}
        const products = await productCollection.find(query).toArray();
        const product_collection = products.filter(p => p.category_id == id)
        console.log(products, id)
        res.send(product_collection)
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
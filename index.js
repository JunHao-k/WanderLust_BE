const express = require('express')
const hbs = require('hbs')
const waxOn = require('wax-on')
const cors = require('cors')
const ObjectId = require('mongodb').ObjectId

require('dotenv').config()
const MongoUtil = require("./MongoUtil")
const MONGO_URI = process.env.MONGO_URI
const app = express()


app.set('view engine' , 'hbs')
app.use(express.urlencoded({
    'extended': false
}))
app.use(express.json())

// ENABLE CROSS SITE ORIGIN RESOURCES SHARING
app.use(cors());

waxOn.on(hbs.handlebars)
waxOn.setLayoutPath("./views/layouts")

async function main(){

    const db = await MongoUtil.connect(MONGO_URI , "wanderlust")
    console.log("Connected to database")
    app.get("/" , (req , res) => {
        res.send("Hello World")
    })

    app.post("/contribute" , (req , res) => {
        let type = req.body.type
        let name = req.body.name
        let description = req.body.description
        // let location = 
        let ratings = req.body.ratings
        let price = req.body.price
        let stars = req.body.stars
        // let tags_id =
        let image_url = req.body.image_url
        
        // In one /contribute route, I do 3 updateOne, one for tags one for location and one for the main collection?
        // How do I do referencing when i do Create?
        // For reviews which is an embedded object, how do I do the create with it?
    })
}

main()

app.listen(3000 , () => {
    console.log("Server has Started")
})
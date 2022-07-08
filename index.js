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


function processCheckbox(checkboxes) {
    let values = checkboxes;
    if (!values) {
        // If nothing is checked, values = undefined
        // undefined is falsely value which means !undefined == !false == true
        values = [];
    } else if (Array.isArray(values) == false){
        // If only one thing is checked
        values = [values];
    }
    return values;
}

async function main(){

    const db = await MongoUtil.connect(MONGO_URI , "wanderlust")
    console.log("Connected to database")

    // This get root path will be from the main page with the search bar
    app.get("/" , (req , res) => {
        res.send("Hello World")
    })

    /* ------------------------------------------------------------- START OF READ(GET) FOR MY LISTINGS -----------------------------------------------------------------------------*/


    // This get request will be send when user types in a country/city in the search bar
    app.get("/search" , async (req , res) => {
        let citySearch = false , countrySearch = false , bothSearch = false , bothNoSearch = false
        let criteria = {}
        let location = null , result = null

        if(req.query.country && req.query.city){
            bothSearch = true
        }
        else if(req.query.country || req.query.city === "undefined"){
            countrySearch = true
        }
        else if(req.query.country === "undefined" || req.query.city){
            citySearch = true
        }
        else{
            bothNoSearch = true
        }
        // console.log("Country name => " + req.query.country)
        // console.log("City name => " + req.query.city)
        // console.log(citySearch , countrySearch , bothSearch , bothNoSearch)

        if(countrySearch){
            criteria['country'] = {
                '$regex': req.query.country , '$options': 'i'
            }
            location = await db.collection("countries").find(criteria).toArray()
            
            result = await db.collection("listings").find({}).toArray()
            
        }
        else if(citySearch || bothSearch){
            criteria['city'] = {
                '$regex': req.query.city , '$options': 'i'
            }
            location = await db.collection("cities").find(criteria).toArray()
            result = await db.collection("listings").find({}).toArray()
        }
        // console.log(location.length)
        console.log(result)
        res.send(result)
        res.status(200)
    })


    /* ------------------------------------------------------------- END OF READ(GET) FOR MY LISTINGS -----------------------------------------------------------------------------*/


    /* ------------------------------------------------------------- START OF CREATE(POST) FOR MY LISTINGS -----------------------------------------------------------------------------*/


    app.post("/contribute" , async (req , res) => {
        let haveCity = null;
        let cityCheck = {}
        cityCheck['city'] = {
            '$regex': req.body.city , '$options': 'i'
        }
        haveCity = await db.collection("cities").find(cityCheck).toArray()

        let tagsCopy = []
        for(id of req.body.tags_id){
            tagsCopy.push(ObjectId(id))
        }

        let type = req.body.type
        let name = req.body.name
        let description = req.body.description
        let country = ObjectId(req.body.country) 
        let city = haveCity.length == 0 ? req.body.city : haveCity[0]._id
        let email = req.body.email
        let article = req.body.article
        let ratings = req.body.ratings
        let price = req.body.price
        let stars = req.body.stars
        let tags = tagsCopy
        let image_url = req.body.image_url
        let reviews = [{}]

        // if (!name) {
        //     res.status(406)
        //     res.send()
        // }

        let newListing = {
            'type': type,
            'name': name,
            'description': description,
            'country': country,
            'city': city,
            'email': email,
            'article': article,
            'ratings': ratings,
            'price': price,
            'stars': stars,
            'tags_id': tags,
            'images': image_url,
            'reviews': reviews
        }
        // console.log(newListing)
        let result = await db.collection("listings").insertOne(newListing)
        res.status(201)
        res.send(result)

        /*
            For countries and tags in the frontend part, for each input checkbox or multi-select:

                For tags checkboxes: 

                    <input type = "checkbox" className = "form-check-input" name = "tags" value = "scenery id" onChange = {this.updateFruits}/>
                    <label className = "form-check-label">Scenery</label>

                For Multi-select:

                    <div>
                        <label>Country</label>
                        <select className = "form-control-input" name = "country" value = {this.state.country} onChange = {this.updateChange}>
                            <option value = "singapore object id">Singapore</option>
                            <option value = "malaysia object id">Malaysia</option>
                            <option value = "indonesia object id">Indonesia</option>
                        </select>
                    </div>
        
        */
    //    res.redirect("/")
    })



    /* ------------------------------------------------------------- END OF CREATE(POST) FOR MY LISTINGS -----------------------------------------------------------------------------*/




    /* ------------------------------------------------------------- START OF UPDATE(PUT) FOR MY LISTINGS -----------------------------------------------------------------------------*/



    app.put("/listings/:id" , async (req , res) => {
        let haveCity = null;
        let cityCheck = {}
        cityCheck['city'] = {
            '$regex': req.body.city , '$options': 'i'
        }
        haveCity = await db.collection("cities").find(cityCheck).toArray()

        let tagsCopy = []
        for(id of req.body.tags_id){
            tagsCopy.push(ObjectId(id))
        }

        let type = req.body.type
        let name = req.body.name
        let description = req.body.description
        let country = ObjectId(req.body.country) 
        let city = haveCity.length == 0 ? req.body.city : haveCity[0]._id  
        let email = req.body.email
        let article = req.body.article
        let ratings = req.body.ratings
        let price = req.body.price
        let stars = req.body.stars
        let tags = tagsCopy
        let image_url = req.body.image_url

        let results = await db.collection('listings').updateOne({
            '_id': ObjectId(req.params.id)
        } , {
            '$set': {
                "type": type,
                "name": name,
                "description": description,
                "country": country,
                "city": city,
                'email': email,
                'article': article,
                "ratings": ratings,
                "price": price,
                "stars": stars,
                'tags_id': tags,
                'images': image_url
            }
        })
        res.status(200)
        res.json(results)
    })

    /* ------------------------------------------------------------- END OF UPDATE(PUT) FOR MY LISTINGS ----------------------------------------------------------------------------- */


    /* ------------------------------------------------------------- START OF DELETE(DELETE) FOR MY LISTINGS -----------------------------------------------------------------------------*/

    app.delete("/listings/:id" , async (req , res) => {
        console.log(req.params.id)
        let results = await db.collection("listings").deleteOne({
            "_id": ObjectId(req.params.id)
        })
        res.status(200)
        res.json({
            'status': 'Deleted'
        })
    })

    /* ------------------------------------------------------------- END OF DELETE(DELETE) FOR MY LISTINGS -----------------------------------------------------------------------------*/



}

main()

app.listen(3000 , () => {
    console.log("Server has Started")
})

/*
    Questions for the day:

    1) What can I validate for update and create?

    2) What can I validate for reviews(Embedded documents)

    3) Do you change BE later on when doing frontend to incorporate stuff like $and , $or , $all , $nin , $gt / $gte , $lt / $lte


*/
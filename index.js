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
            result = await db.collection("listings").findOne({
                "country": location[0]._id
            })
            
        }
        else if(citySearch || bothSearch){
            criteria['city'] = {
                '$regex': req.query.city , '$options': 'i'
            }
            location = await db.collection("cities").find(criteria).toArray()
            result = await db.collection("listings").findOne({
                "city": location[0]._id
            })
        }
        // console.log(location.length)
        console.log(result)
        res.send(result)
        res.status(200)
    })

    app.post("/contribute" , async (req , res) => {
        let haveCity = null;
        let cityCheck = {}
        cityCheck['city'] = {
            '$regex': req.query.city , '$options': 'i'
        }
        haveCity = await db.collection("cities").find(cityCheck).toArray()

        let tagsCopy = []
        for(id of req.body.tags_id){
            tagsCopy.push(ObjectId(id))
        }

        // console.log(haveCity)
        // console.log(req.body)
        let type = req.body.type
        let name = req.body.name
        let description = req.body.description
        let country = ObjectId(req.body.country) 
        let city = haveCity.length == 0 ? req.query.city : haveCity[0]._id
        let ratings = req.body.ratings
        let price = req.body.price
        let stars = req.body.stars
        let tags = tagsCopy
        let image_url = req.body.image_url

        let newListing = {
            'type': type,
            'name': name,
            'description': description,
            'country': country,
            'city': city,
            'ratings': ratings,
            'price': price,
            'stars': stars,
            'tags_id': tags,
            'images': image_url
        }
        console.log(newListing)
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
}

main()

app.listen(3000 , () => {
    console.log("Server has Started")
})
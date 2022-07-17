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


const validation = require('./Middlewares/validation')
const validateList = require('./Validations/validateList')

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

    async function processTags(result){
        for(eachObj of result){
            let temp = []
            for(tagId of eachObj.tags_id){
                let tagName = await db.collection('tags').findOne({
                    "_id": ObjectId(tagId)
                })
                temp.push(tagName.tag_name)
            }
            eachObj.tags_id = temp
        }
        return result
    }

    const db = await MongoUtil.connect(MONGO_URI , "wanderlust")
    console.log("Connected to database")

    // This get root path will be from the main page with the search bar
    app.get("/" , (req , res) => {
        res.send("Hello World")
    })

    /* ------------------------------------------------------------- START OF READ(GET) FOR MY LISTINGS -----------------------------------------------------------------------------*/
    app.get("/countries" , async (req , res) => {
        result = await db.collection("countries").find({}).toArray()
        res.send(result)
        res.status(200)
    })

    app.get("/tags" , async (req , res) => {
        result = await db.collection("tags").find({}).toArray()
        res.send(result)
        res.status(200)
    })

    
    
    // This get request will be send when user types in a country/city in the search bar
    app.get("/listings" , async (req , res) => {
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


        if(countrySearch){
            criteria['country'] = {
                '$regex': req.query.country , '$options': 'i'
            }
            location = await db.collection("countries").find(criteria).toArray()
            // console.log(location)

            if(location.length === 0){
                res.send("Please enter a valid country") 
            }
            else{
                result = await db.collection("listings").find({
                    "country": location[0]._id
                }).toArray()
    
                if(result.length === 0){
                    res.send("There is no listing on this particular country , want to contribute on it?")
                }
                else{
                    
                    for(country of result){
                        country.country = location[0].country
                        let cityObj = await db.collection("cities").findOne({
                            "_id": ObjectId(country.city)
                        })
                        country.city = cityObj.city
                    }
                    result = await processTags(result)
                    res.send(result)
                    res.status(200)
                }
            }
        }
        else if(citySearch || bothSearch){
            criteria['city'] = {
                '$regex': req.query.city , '$options': 'i'
            }
            location = await db.collection("cities").find(criteria).toArray()

            if(location.length === 0){
                res.send("There is no listing on this particular city, want to contribute on it?") 
            }
            else{
                result = await db.collection("listings").find({
                    "city": location[0]._id
                }).toArray()
    
                if(result.length === 0){
                    res.send("There is no listing on this particular city, want to contribute on it?")
                }
                else{
                    for(city of result){
                        city.city = location[0].city
                        let countryObj = await db.collection("countries").findOne({
                            "_id": ObjectId(city.country)
                        })
                        city.country = countryObj.country
                    }
                    result = await processTags(result)

                    res.send(result)
                    res.status(200)
                }
            }
        }
        else{
            res.status(404)
            res.send("Search field cannot be empty")
        }
    })


    /* ------------------------------------------------------------- END OF READ(GET) FOR MY LISTINGS -----------------------------------------------------------------------------*/


    /* ------------------------------------------------------------- START OF CREATE(POST) FOR MY LISTINGS -----------------------------------------------------------------------------*/


    app.post("/contribute" , validation.validation(validateList.listingSchema) , async (req , res) => {

        let haveCity = null;
        let cityCheck = {}
        cityCheck['city'] = {
            '$regex': req.body.city , '$options': 'i'
        }
        haveCity = await db.collection("cities").find(cityCheck).toArray()

        if(haveCity.length === 0){
            await db.collection("cities").insertOne({
                'city': req.body.city
            })
        }

        
        let tagsCopy = []
        for(id of req.body.tags_id){
            tagsCopy.push(ObjectId(id))
        }
        let descriptionArr = [req.body.description1 , req.body.description2 , req.body.description3]

        let type = req.body.type // Radiobuttons
        let name = req.body.name // Input ==> Cannot be empty fields and must be string
        let author = req.body.author // Input ==> Cannot be empty fields and must be string
        let description = descriptionArr // Array of 3 String inputs ==> Cannot be empty fields and must be string
        let country = ObjectId(req.body.country) // Dropdown selection 

        // Cannot do anything to verify if the city name is legit anot can only validate for empty field and string
        // Might have to use weather api or geocoding or whatever API to check if city is valid
        let city = haveCity.length === 0 ? req.body.city : haveCity[0]._id 
        let email = req.body.email // Must have @ and "." and is a string
        let article = req.body.article 
        let ratings = req.body.ratings // Maybe use a range slider 
        let price = req.body.price // Must be float/int ==> Validate for this 
        let stars = req.body.stars // Use Range slider also?
        let tags = tagsCopy // Checkboxes ==> checkbox array cannot be empty
        let image_url = req.body.image_url 
        let reviews = []

        let newListing = {
            'type': type,
            'name': name,
            'author': author,
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
        res.json(result)

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

    app.get("/get-submissions" , async (req , res) => {
        let emailSearch = false 
        let validEmail = false
        let criteria = {}

        if((req.query.email.indexOf('@') > -1) && (req.query.email.indexOf('.') > -1)){
            validEmail = true
        }
        else{
            res.send("Invalid email")
        }

        if(req.query.email && validEmail){
            emailSearch = true
        }
        

        if(emailSearch){
            criteria['email'] = {
                '$regex': req.query.email , '$options': 'i'
            }
            let result = await db.collection("listings").find(criteria).toArray()
            res.send(result)
            res.status(200)
        }
    })

    app.get("/listings/:id" , async (req , res) => {
        let result = await db.collection("listings").findOne({"_id": ObjectId(req.params.id)})
        res.status(200)
        res.send(result)
    })

    app.put("/listings/:id" , validation.validation(validateList.listingSchema) , async (req , res) => {
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

        let descriptionArr = [req.body.description1 , req.body.description2 , req.body.description3]

        let type = req.body.type
        let name = req.body.name
        let author = req.body.author
        let description = descriptionArr
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
                'author': author,
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



    /* ------------------------------------------------------------- START OF CREATE(POST) FOR MY EMBEDDED DOCUMENT (REVIEWS) -----------------------------------------------------------------------------*/



    // After getting to the main page listing clicking on any listing will lead you to another page with the reviews shown below
    // Click on add review to go to a new page through /:listingid/add
    app.get("/listings/:listingid/add-review" , async (req , res) => {
        let listingRecord = await db.collection("listings").findOne({
            "_id": ObjectId(req.params.listingid)
        } , {
            "projection":{
                'name': 1,
                'author': 1
            }
        })
        res.status(200)
        res.send(listingRecord)
    })

    app.post("/listings/:listingid/add-review" , validation.validation(validateList.reviewSchema) , async (req , res) => {
        let results = await db.collection("listings").updateOne({
            "_id": ObjectId(req.params.listingid)
        } , {
            '$push': {
                'reviews': {
                    '_id': ObjectId(),
                    'reviewer': req.body.reviewer,
                    'reviewer_email': req.body.reviewer_email,
                    'text': req.body.text
                }
            }
        })
        res.status(200)
        res.send(results)
        // res.redirect(`/listings/${req.params.listingid}`)
    })

    /* ------------------------------------------------------------- END OF CREATE(POST) FOR MY EMBEDDED DOCUMENT (REVIEWS) -----------------------------------------------------------------------------*/


    app.get("/listings/:listingid/your-reviews" , async (req , res) => {
        let reviewerEmail = req.query.email
        let reviewRecords = await db.collection("listings").find({
            "_id": ObjectId(req.params.listingid),
            'reviews.reviewer_email': reviewerEmail
        } , {
            'projection': {
                'reviews': 1
            }
        }).toArray()
        res.send(reviewRecords)
    })


    /* ------------------------------------------------------------- START OF UPDATE(POST) FOR MY EMBEDDED DOCUMENT (REVIEWS) -----------------------------------------------------------------------------*/

   app.get("/listings/:listingid/your-reviews/:reviewid/update" , async (req , res) => {
        let reviewRecord = await db.collection("listings").findOne({
            "_id": ObjectId(req.params.listingid)
        } , {
            'projection': {
                'reviews': {
                    '$elemMatch': {
                        '_id': ObjectId(req.params.reviewid)
                    }
                }
            }
        })
        res.send(reviewRecord.reviews[0].reviewer + " " + reviewRecord.reviews[0].text)
   })

   app.post("/listings/:listingid/your-reviews/:reviewid/update" ,  async (req , res) => {
        let newReviewer = req.body.reviewer
        let newEmail = req.body.email
        let newText = req.body.text
        await db.collection("listings").updateOne({
            '_id': ObjectId(req.params.listingid),
            'reviews._id': ObjectId(req.params.reviewid)
        } , {
            '$set':{
                // $ refers to position(index) of the embedded document that we want to edit whose id matches <<'notes._id': ObjectId(req.params.noteid)>>
                'reviews.$.reviewer': newReviewer,
                'reviews.$.reviewer_email': newEmail,
                'reviews.$.text': newText,
            }
        })
        res.status(200)
   })

    /* ------------------------------------------------------------- END OF UPDATE(POST) FOR MY EMBEDDED DOCUMENT (REVIEWS) -----------------------------------------------------------------------------*/




    /* ------------------------------------------------------------- START OF DELETE(POST) FOR MY EMBEDDED DOCUMENT (REVIEWS) -----------------------------------------------------------------------------*/

    app.get("/listings/:listingid/your-reviews/:reviewid/delete" , async (req , res) => {
        let reviewRecord = await db.collection("listings").findOne({
            '_id': ObjectId(req.params.listingid),
            'reviews._id': ObjectId(req.params.reviewid)
        } , {
            'projection':{
                'reviews':{
                    '$elemMatch': {
                        '_id': ObjectId(req.params.reviewid)
                    }
                }
            }
        })
        res.send(reviewRecord.reviews[0].reviewer + " " + reviewRecord.reviews[0].text)
   })

    app.post("/listings/:listingid/your-reviews/:reviewid/delete" , async (req , res) => {
        await db.collection("listings").updateOne({
            '_id': ObjectId(req.params.listingid),
        } , {
            '$pull':{
                'reviews':{
                    '_id': ObjectId(req.params.reviewid)
                }
            }
        })
        res.status(200)
        res.json({
            'status': 'Deleted'
        })
    })
    /* ------------------------------------------------------------- END OF DELETE(POST) FOR MY EMBEDDED DOCUMENT (REVIEWS) -----------------------------------------------------------------------------*/

}

main()

app.listen(8888 , () => {
    console.log("Server has Started")
})
const { object, string , array, number } = require("yup");

const stringCondition = string("value must be a string").required("This field cannot be empty").matches(/^[aA-zZ\s]+$/, "Only alphabets are allowed for this field")

const listingSchema = object({
    type: stringCondition,
    name: stringCondition,
    author: stringCondition,
    description1: string().required(),
    description2: string().required(),
    description3: string().required(),
    country: string().min(24).required(),
    city: stringCondition,
    email: string().email().required(),
    article: string().required(),
    ratings: number().min(1 , "Worst rating is 1").max(10 , "Best rating is 10").required(),
    price: number().integer().required(),
    stars: number().min(1 , "Minimum stars is 1").max(5 , "Maximum stars is 5").required(),
    tags_id: array().of(string().min(24).required()),
    image_url: string().url("This must be a valid URL").required()
})

module.exports = {
        listingSchema
}
/*
        


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






        const listingSchema = yup.object({
    type: yup.string("value must be a string").required("This field cannot be empty"),
    name: yup.string().required(),
    author: yup.string().required(),
    description1: yup.string().required(),
    description2: yup.string().required(),
    description3: yup.string().required(),
    country: yup.string().required(),
    city: yup.string().required(),
    email: yup.string().email().required(),
    article: yup.string().required(),
    ratings: yup.number().integer().required(),
    price: yup.number().integer().required(),
    stars: yup.number().integer().required(),
    tags_id: yup.array().of(yup.string()).required(),
    image_url: yup.string().url().required()
})

*/
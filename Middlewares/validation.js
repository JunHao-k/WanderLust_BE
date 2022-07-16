const validation = (schema) => async (req , res , next) => {
    const body = req.body
    try{
        await schema.validate(body)
        next()
        // return next()
    }
    catch(error){
        // return res.status(500).send("Internal Server Error")
        return res.json({error})
    }
}

module.exports = {
    validation
} 


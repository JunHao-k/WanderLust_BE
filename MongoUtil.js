const MongoClient = require('mongodb').MongoClient

let connect = async (mongouri , database) => {
    const client = await MongoClient.connect(mongouri , {
        "useUnifiedTopology": true 
    })
    const db = client.db(database)
    return db
}

// When key and value have the exact same name, we can just replace with the name of the variable
// connect ==> "connect": "connect"
module.exports = {
    connect
}
const axios = require('axios')



const answer = async () => {

    //GET 'datasetId'
    const setID = await axios.get('http://api.coxauto-interview.com/api/datasetId')

    //GET the dataset for the 'datasetId'
    //This dataset contains all 'vehicleId's
    const data = await axios.get(`http://api.coxauto-interview.com/api/${setID.data.datasetId}/vehicles`)

    /*
    1.GET specific vehicle info for each 'vehicleId' in the dataset
    2. Map all 'vehicleId's to their corresponding API requests and return the promises for each request
      into the 'promises1' array
    3. Await all promises until fulfilled then return array of responses to 'vData' */
    const promises1 = data.data.vehicleIds.map( vId => axios.get(`http://api.coxauto-interview.com/api/${setID.data.datasetId}/vehicles/${vId}`))
    const vData = await Promise.all(promises1).then( res => {
        return res
    })

    //Push the vehicle data from each response in 'vData' to 'vehicleArray'
    const vehicleArray = []
    vData.forEach(element => {
        vehicleArray.push(element.data)
    });

    /*
    1. GET specific dealer info for each 'dealerId' in 'vehicleArray'
    2. Map all 'dealerId's to their corresponding API requests and return promises for each request
    3. Await all promises until fulfilled then return array of responses to 'dData' */
    const promises2 = vehicleArray.map(vehicle => axios.get(`http://api.coxauto-interview.com/api/${setID.data.datasetId}/dealers/${vehicle.dealerId}`))
    const dData = await Promise.all(promises2).then( res => {
        return res
    })


    //Push dealer data from each request in 'dData' to 'dealerArray'
    const dealerArray = []
    dData.forEach( element => {
        dealerArray.push(element.data)
    })


    /*
    1. Check the map to see if we have encountered the dealer already
    2. If we have not seen this dealer, put the dealer in our map
    3. Push the unique dealer in 'dealerArray' into 'uniqueDealers'

    Using a map to keep track of dealers we have already seen can be wasteful here in terms of space,
    but we can remove non unique dealers in one pass this way */
    const uniqueDealers = []
    let map = new Map()

    for(let dealer of dealerArray) {
        let {dealerId, name} = dealer

        if(!map.has(dealerId)) {
            map.set(dealerId, true)

            uniqueDealers.push({
                dealerId,
                name
            })
        }
    }

    /*
    1. For each dealer in 'uniqueDealers' we check 'vehicleArray' to see which vehicles have the same 'dealerId'
    2. If the 'dealerId's match, we push the vehicle data to a dealer property called 'vehicles' */
    uniqueDealers.forEach( dealer => {
        dealer['vehicles'] = []

        vehicleArray.forEach( vehicle => {

            let {vehicleId, year, make, model} = vehicle

            if(vehicle.dealerId === dealer.dealerId) {
                dealer['vehicles'].push({vehicleId, year, make, model})
            }
        }) 
    })

    //POST an object who's 'dealers' property is 'uniqueDealers' to /answer and return the promise
    return await axios.post(`http://api.coxauto-interview.com/api/${setID.data.datasetId}/answer`, {dealers: uniqueDealers})
}

//Print the data of the fulfilled promise returned from 'answer()'
answer().then( res =>{
    console.log(res.data)
}).catch( err => {
    console.log(`Error: ${err}`);
})



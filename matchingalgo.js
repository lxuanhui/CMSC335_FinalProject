
//Returns interestMap
async function createRanking(client, databaseAndCollection, cur_user) {
    //get list of members of opposite gender
    let filter = {gender : { $ne: cur_user.gender}}
    const cursor = client.db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .find(filter);

    const result = await cursor.toArray();
    console.log(result);

    //Create map with member_id, frequency of matching interest)
    let interestMap = new Map()
    result.forEach(mem => 
        interestMap.set(mem._id, mem.interests.reduce((cnt, it) => 
        (cur_user.interests.some(i => i==it)?cnt++:cnt,0))))
    
    //sort by frequency
    interestMap = new Map([...interestMap.entries()].sort((a, b) => b[1] - a[1]));
    
    return interestMap
}
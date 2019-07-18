/////////////////////////////////////////////////////////////////
/////////////////////////////imports/////////////////////////////
/////////////////////////////////////////////////////////////////


const express = require('express');
const app     = express(); //not an import, but required to use express
const request = require('request');
const cheerio = require('cheerio');
const fs      = require('fs');


/////////////////////////////////////////////////////////////////
////////////////////////////variables////////////////////////////
/////////////////////////////////////////////////////////////////


const port = 3003; //localhost port

const allItemURIArr = [ // links to pages with item data by equipment slot
	"https://oldschool.runescape.wiki/w/Head_slot_table", 
	"https://oldschool.runescape.wiki/w/Cape_slot_table", 
	"https://oldschool.runescape.wiki/w/Neck_slot_table", 
	//"https://oldschool.runescape.wiki/w/Ranged_Strength", // not like the others
	"https://oldschool.runescape.wiki/w/Ammunition_slot_table", 
	"https://oldschool.runescape.wiki/w/Weapon_slot_table", 
	"https://oldschool.runescape.wiki/w/Shield_slot_table", 
	"https://oldschool.runescape.wiki/w/Body_slot_table", 
	"https://oldschool.runescape.wiki/w/Legs_slot_table", 
	"https://oldschool.runescape.wiki/w/Hand_slot_table", 
	"https://oldschool.runescape.wiki/w/Feet_slot_table", 
	"https://oldschool.runescape.wiki/w/Ring_slot_table", 
	"https://oldschool.runescape.wiki/w/Two-handed_slot_table"
];

//const slotNames = ["Head", "Cape", "Neck", /*"Ranged_Strength",*/ "Ammunition", "Weapon", "Shield", "Body", "Legs", "Hand", "Feet", "Ring", "Two-handed"];


/////////////////////////////////////////////////////////////////
////////////////////////////functions////////////////////////////
/////////////////////////////////////////////////////////////////


function writeJsonFile(filename, data) {
  fs.writeFile(filename, JSON.stringify(data), err => {
    if (err) {
      console.log('Error writing file', err);
    }
    else {
      console.log('File written');
    }
  })
}


/////////////////////////////////////////////////////////////////
////////////////////////////endpoints////////////////////////////
/////////////////////////////////////////////////////////////////


app.get('/', (req, res) => {
	res.send('Hello world');
})

app.get('/getData', (req, res) => {

	//function for updating dataObject properties, 
	function addPropertyToDataObject(dataObject, valueToAdd, indexString) {
		const propertiesFromIndex = pageOrderLookup[indexString];
		
		dataObject[propertiesFromIndex[0]][propertiesFromIndex[1]] = valueToAdd;
	}
	
	//used in the addPropertyToDataObject function to get the key names where the 
	//values will be stored
	const pageOrderLookup = {
		'1-1': ['attack', 'stab'],
		'1-2': ['attack', 'slash'],
		'1-3': ['attack', 'crush'],
		'1-4': ['attack', 'magic'],
		'1-5': ['attack', 'range'],
		'2-1': ['defence', 'stab'],
		'2-2': ['defence', 'slash'],
		'2-3': ['defence', 'crush'],
		'2-4': ['defence', 'magic'],
		'2-5': ['defence', 'range'],
		'3-1': ['other', 'strength'],
		'3-2': ['other', 'range_strength'],
		'3-3': ['other', 'magic_bonus'],
		'3-4': ['other', 'prayer']
	};
	
	const jsonObject = {}; //stores json to eventually be written to disk
	
	
	// iterate over each URI and make a request, then parse through the data for the
	//relevant values and create an object for each item, finally push that object to 
	//the above jsonObject
	allItemURIArr.forEach((currentURI) => {
		
		const currentItemSlot = currentURI.split('/w/')[1].split('_')[0];
		jsonObject[currentItemSlot] = [];
		console.log('currentItemSlot', currentItemSlot);
		
		request(currentURI, (err, res, body) => {
			if (err) {
			  console.log('ERROR making request, err:', err);
			  return
			}
			
			const $ = cheerio.load(body);
			const tableRows = $('table.wikitable > tbody > tr');
			
			tableRows.each((rowIndex, row) => {
				
				// first row is the 'legend' for the table and contains no data
				if (rowIndex === 0 ) { 
					return
				}
				
				const dataObject = {
					name: "",
					
					attack: {
						stab:  null,
						slash: null,
						crush: null,
						magic: null,
						range: null
					},

					defence: {
						stab:  null,
						slash: null,
						crush: null,
						magic: null,
						range: null
					},

					other: {
						strength:       null,
						range_strength: null,
						magic_bonus:    null,
						prayer:         null
					}
				}
				
				//filter out formatting elements
				const filteredRow = row.children.filter((e) => {
					if (e.type === 'text' && e.data === '\n') {
						return false
					}
					return true
				})
				
				const keys = Object.keys(filteredRow); // returns an array of strings
				
				keys.forEach((e, i) => { //iterate over those strings
					const currentElement = filteredRow[e]; // get the value associated 
					
					if (i === 0) { // item name column
						if (currentElement.children[0] && currentElement.children[0].attribs && currentElement.children[0].attribs.title) {
							dataObject.name = currentElement.children[0].attribs.title;
						}
						else {
							console.log('NO TITLE FOR CURRENTELEMENT', currentElement)
						}
					}
					
					if (i === 1) { // non-data column
						return
					}
					
					if (i > 1) { // stats
						
						const effectiveIndex = i - 1; // offset due to non-data column
						
						// used for lookup in addPropertyToDataObject function
						const indexString = 
						(Math.ceil(effectiveIndex / 5)).toString()
						+ '-' 
						+ (effectiveIndex % 5 === 0 ? 5 : effectiveIndex % 5);
						
						// get integer value of the stat
						const currentData = parseInt(currentElement.children[0].data);
					
						addPropertyToDataObject(dataObject, currentData, indexString);
						
					}
					
				})
				
				jsonObject[currentItemSlot].push(dataObject); 
				
			}) // tableRow for each
	
			writeJsonFile('officialScraped.min.json', jsonObject);
			
		}) //request
		
	}) //URI array for each
	
	res.send('getting');
	
})

app.get('*', (req, res) => {
	res.sendStatus(404)
})


app.listen(port, () => console.log(`Listening on port ${port}!`));
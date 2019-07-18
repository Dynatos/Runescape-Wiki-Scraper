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
	
	function addPropertyToDataObject(dataObject, valueToAdd, indexString) {
		const propertiesFromIndex = pageOrderLookup[indexString];
		
		dataObject[propertiesFromIndex[0]][propertiesFromIndex[1]] = valueToAdd;
	}
	
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
	
	allItemURIArr.map(e => {
		request(e, (err, res, body) => {
			if (err) {
			  console.log('encountered error during collectItemDataFromLinks, err:', err);
			}
			
			const $ = cheerio.load(body);
			const tableRows = $('table.wikitable > tbody > tr');
			
			//console.log('tableRows.length', tableRows.length);
			
			tableRows.each((tableRowIndex, currentRow) => {
				
				const currentRowChildrenWithData = currentRow.children.filter((e) => {
					return e.data !== '\n'
				});
				
				//console.log('currentRowChildrenWithData', currentRowChildrenWithData);
				
				//console.log('lengths', currentRow.children.length, currentRowChildrenWithData.length);
					
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

				currentRowChildrenWithData.forEach((element, elementIndex) => {
					
					const dataElement = element.children.filter((e) => {
						return e.children
					})
					
					const currentData = parseInt(dataElement.children[0].data);
					const currentIndex = elementIndex + 1;
					
					//console.log('currentData', currentData);
					//console.log('dataElement.children', dataElement.children);
					
					if (currentData) {
						const indexString = 
						(Math.floor(currentIndex / 5) + 1).toString()
						+ '-' 
						+ (currentIndex % 5 === 0 ? 5 : currentIndex % 5);
						
						console.log('computed indexString', indexString);
						
						addPropertyToDataObject(dataObject, currentData, indexString);
						
						console.log('should be updated dataObject', dataObject);
					}
					
					if (dataElement.children.type === "tag" && dataElement.name === "a") {
						console.log('should be item name', dataElement.attribs.title)
						dataObject.name = dataElement.attribs.title
					}
				
				})
				
				
				
				
				
				
				
				
				
				
				
				
				
				
				
				
				
				
				
				
				//console.log('e.children.length', e.children.length);
				/*currentRow.children.forEach((td, index) => {
					
					//console.log('td', td);
					
					
					
					if (!td.children || !td.children[0] || !td.children[0].data) {
						
						return;
						
					}
					
					if (td.children[0][0]) {
						
						//console.log('keys', Object.keys(td.children[0][0]));
						
					}
					
					if (td.children[0].data.startsWith('+') || td.children[0].data.startsWith('-')) {
						
						//console.log('td.children', td.children[0].data);
						
					}
					
					else {
						
						//console.log('anchor', td.children[0]);
						
					}
				});*/
			})
			
			//console.log('children', children.children('td').length);
			
			/*
			children.each((i, e) => {
				console.log('INDEX', i);
				console.log('e.children(td a)', e.children[1].children[1].attr('href'));
				//console.log('e.innerText', e.innerText());
				//console.log('e.children()', e.children());
				//console.log('e.children()[0]', e.children()[0]);
			});
			
			const contents = $('table.wikitable').children('tbody').children('tr').contents();
			*/
			
			//console.log('children', children.text());
			//console.log('contents', contents);
			
			//writeJsonFile('test.json', children);
			
		})
	})
	
	res.send('Collecting data');
	//writeJsonFile('test', {test: null})
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
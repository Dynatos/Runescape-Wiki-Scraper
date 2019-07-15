//imports
const express = require('express');
const app = express();
const port = 3003;
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');

/////////////////////////////////////////////////////////////////
////////////////////////////variables////////////////////////////
/////////////////////////////////////////////////////////////////

const allItemURIArr = [
	"https://oldschool.runescape.wiki/w/Head_slot_table", 
	"https://oldschool.runescape.wiki/w/Cape_slot_table", 
	"https://oldschool.runescape.wiki/w/Neck_slot_table", 
	"https://oldschool.runescape.wiki/w/Ranged_Strength", 
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

const slotNames = ["Head", "Cape", "Neck", "Ranged_Strength", "Ammunition", "Weapon", "Shield", "Body", "Legs", "Hand", "Feet", "Ring", "Two-handed"];

function fetchAllDataForItemSlot(slotURI) {
	
	
	
}

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

app.get('/', (req, res) => {
	res.send('Hello world');
	//writeJsonFile('test', {test: null})
})

app.get('/getAllItemLinks', (req, res) => {
	
	const fetchedData = allItemURIArr.map(e => {
		request(e, (err, res, body) => {
			if (err) {
			  console.log('encountered error during collectItemDataFromLinks, err:', err);
			}
			
			const itemStatObject = { // initialize object properties for storing the stat values from the page
				attack: {
					stab:  0,
					slash: 0,
					crush: 0,
					magic: 0,
					range: 0
				},

				defence: {
					stab:  0,
					slash: 0,
					crush: 0,
					magic: 0,
					range: 0
				},

				other: {
					strength:       0,
					range_strength: 0,
					magic_bonus:    0,
					prayer:         0
				}
			};
			
			const $ = cheerio.load(body);
			
			const tableRows = $('table.wikitable').children('tbody').children('tr');
			
			console.log('tableRows.length', tableRows.length);
			
			//console.log('children.length',children.length);
			
			tableRows.each((i, currentRow) => {
				
				
				console.log('currentRowChild', currentRow.children) 
				
				
				//console.log('e.children.length', e.children.length);
				currentRow.children.forEach((td, index) => {
					
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
				});
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

app.get('*', (req, res) => {
	res.sendStatus(404)
})


app.listen(port, () => console.log(`Listening on port ${port}!`));
//imports
const express = require('express');
const app = express();
const port = 3002;
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');

//variables
const allItemsURI = 'https://oldschoolrunescape.fandom.com/wiki/Category:Items'; // Wiki page containing links to every item's full page, where stat values are stored
const baseURI = 'https://oldschoolrunescape.fandom.com'; // Base URI for the wiki, item names can be URI encoded and concatenated with this link to make valid, scrapeable links
const allItemData = require('./osrs-item-data-no-0s.min.json'); // Temporary import for restructuring of data TODO: cleanup pipeline to create properly formatted JSON with a single function
const allItemLinkArray = require('./osrs-wiki-links-all-items.json'); // JSON Array containing valid formatted links to the wiki pages for every item 
const allItemLinkArrayLength = allItemLinkArray.length; // multi-use constant defined here for reduced performance overhead
const anchorLinkArray = []; 
const itemStatDataObjectArray = [];
const indexesThatHaveBeenRequested = [];

// Object containing querySelector strings, used for retrieving stat data during execution of the collectItemDataFromLinks function
const statTableSelectorObject = {
  
  attack: {
    stab:  'div.pi-smart-data-value[data-source="astab"]',
    slash: 'div.pi-smart-data-value[data-source="aslash"]',
    crush: 'div.pi-smart-data-value[data-source="acrush"]',
    magic: 'div.pi-smart-data-value[data-source="amagic"]',
    range: 'div.pi-smart-data-value[data-source="arange"]'
  },
  
  defence: {
    stab:  'div.pi-smart-data-value[data-source="dstab"]',
    slash: 'div.pi-smart-data-value[data-source="dslash"]',
    crush: 'div.pi-smart-data-value[data-source="dcrush"]',
    magic: 'div.pi-smart-data-value[data-source="dmagic"]',
    range: 'div.pi-smart-data-value[data-source="drange"]'
  },
  
  other: {
    strength:       'div.pi-smart-data-value[data-source="str"]',
    range_strength: 'div.pi-smart-data-value[data-source="rstr"]',
    magic_bonus:    'div.pi-smart-data-value[data-source="mdmg"]',
    prayer:         'div.pi-smart-data-value[data-source="prayer"]'
  }
  
};

// Function that takes in a starting wiki page containing 200 links to item pages (the pages have the stats we are after)we push all 
// of those anchors into one array for future mapping. This function will recursively call itself with sequential pages until it 
// finds a page without a 'next page' button (the last page). At that point the array is written to disk as JSON using the writeFile function
function collectAllItemsList(URI = allItemsURI, recursionCounter = 1) {
  
  if (!URI) { //error prevention
    console.log('collectAllItemsList called without URI, returning');
    return;
  }
  
  request(URI, (err, res, body) => { // make a web request for the page
    if (err) {
      console.log('Encountered error during collectAllItemsList, err:', err);
    }
    
    console.log('collectAllItemsList request succeeded, parsing page data. Current page count:', recursionCounter);
  
    const $ = cheerio.load(body);
    const table = 'div.category-page__members'; // querySelector for relevant element
    const nextPageAnchor = $('a.category-page__pagination-next')[0]; // querySelector for 'next page' link, if not found recursion ends
    const nextPageLink = nextPageAnchor ? nextPageAnchor.attribs.href : null; //error handle for final page
  
    // Load the section of the page containing desired anchors into cheerio, get all anchor links, push each link to anchorLinkArray
    $(table).find('a').each((i, e) => {anchorLinkArray.push(e.attribs.href)});
    
    // Pages contain 200 items max, final page doesn't contain a next button and will end the recursion
    if (nextPageLink) {
      console.log('collectAllItemsList recurring for next page of anchors');
      collectAllItemsList(nextPageLink, recursionCounter + 1);
    }
    
    else {
      console.log('nextPageLink does not exist, writing file. Final page count:', recursionCounter);
      writeFile('osrs-wiki-links-all-items.min.json', anchorLinkArray);
    }
    
  }) // end request callback
  
} // end function

// 
function collectItemDataFromLinks(index) {
  console.log('CollectItemDataFromLinks called with index', index, '--- allItemLinkArrayLength', allItemLinkArrayLength);
  
  if (!allItemLinkArray[index]) { //error handling
    console.log('CollectItemDataFromLinks called without URI, returning');
    return;
  }
  
  const URI = (baseURI + allItemLinkArray[index]); // concatenate to make a requestable link
  
  request(URI, (err, res, body) => {
    if (err) {
      console.log('encountered error during collectItemDataFromLinks, err:', err);
    }
    
    const $ = cheerio.load(body);
    
    const statTableSelectorKeys = Object.keys(statTableSelectorObject); // makes an array of strings that are used for bracket notation lookups of that object's properties
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
  
    let jLoopHasBroken = false; // j loop only breaks if there is an error getting stat data
    
    // Nested loops because our querySelectors are nested within an object not really necessary but makes sense when looking at
    // the structure of our data
    for (let i = 0; i < statTableSelectorKeys.length; i++) {
      
      if (jLoopHasBroken) { // Breaks if there is an error getting stat data
        break;
      }
      
      const currentStatTableSelectorObjectKey = statTableSelectorKeys[i];
      
      // Creates an array of our querySelectors to loop over 
      const currentObjectSelectors = Object.keys(statTableSelectorObject[currentStatTableSelectorObjectKey]);
      
      for (let j = 0; j < currentObjectSelectors.length; j++) {
        
        // cheerio call with current querySelector
        const currentDOMElement = $(statTableSelectorObject[currentStatTableSelectorObjectKey][currentObjectSelectors[j]]);
        const currentStatValue = currentDOMElement.text(); // current data we're after
        
        if (!currentStatValue) { //error handling
          console.log('Breaking out of loops with index', index);
          shouldWriteToFileOrRecurse(index);
          jLoopHasBroken = true;
          break;
        }
        
        itemStatObject[statTableSelectorKeys[i]][currentObjectSelectors[j]] = currentStatValue;
        
      } //end j loop
    } //end i loop
  
    itemStatDataObjectArray.push({
      link: URI,
      properties: itemStatObject
    });
    
    shouldWriteToFileOrRecurse(index);
    
  }) //end request call
  
}

function writeFile(filename, data) {
  fs.writeFile(filename, JSON.stringify(data), err => {
    if (err) {
      console.log('Error writing file', err);
    }
    else {
      console.log('File written');
    }
  })
}

function shouldWriteToFileOrRecurse(index) {
  const nextIndex = index + 1;
  if (indexesThatHaveBeenRequested.includes(nextIndex)) {
    return;
  }
  if (nextIndex < allItemLinkArrayLength) {
    indexesThatHaveBeenRequested.push(nextIndex);
    setTimeout( function() { collectItemDataFromLinks(nextIndex) }, 50 );
  }
  
  else {
    console.log('All items in allItemLinkArray exhausted, writing file');
    writeFile('osrs-all-item-data.min.json', itemStatDataObjectArray)
  }
}

function removeItemsWithoutStats() {
  const itemsWithData = [];
  for (let i = 0; i < allItemData.length; i++) {
    const attackKeys = Object.keys(allItemData[i].properties.attack);
    const defenceKeys = Object.keys(allItemData[i].properties.defence);
    const otherKeys = Object.keys(allItemData[i].properties.other);
    
    const mapRet = attackKeys.map((e) => {
      return allItemData[i].properties.attack[e] !== "+0";
    });
    if (mapRet.includes(true)) {
      itemsWithData.push(allItemData[i]);
      continue;
    }
    const map2Ret = defenceKeys.map((e) => {
      return allItemData[i].properties.defence[e] !== "+0";
    });
    if (map2Ret.includes(true)) {
      itemsWithData.push(allItemData[i]);
      continue;
    }
    const map3Ret = otherKeys.map((e) => {
      return allItemData[i].properties.other[e] !== "+0" && allItemData[i].properties.other[e] !== "+0%";
    });
    if (map3Ret.includes(true)) {
      itemsWithData.push(allItemData[i]);
    }
    console.log(allItemData[i].link.slice(42), 'contains only 0s');
  }
  writeFile('osrs-item-data-truly-no-0s.min.json', itemsWithData);
}

app.get('/' (req, res) => {
  res.send('Available links are /getPartialURIForEveryItem, /getItemDataFromLinks, /removeItemsWithoutStats');
})

app.get('/getPartialURIForEveryItem', (req, res) => {
  console.log('Collecting all items in list');
  
  collectAllItemsList(); // gets a partial link for every item in the game and stores it on the disk as a JSON array 
  
  res.send('Collecting all partial URIs from wiki pages');
});

app.get('/getItemDataFromLinks', (req, res) => {
  console.log('Collecting all item data from links');
  
  collectItemDataFromLinks(0);
  indexesThatHaveBeenRequested.push(0);
  
  res.send('Collecting all item data from links');
});

app.get('/removeItemsWithoutStats', (req, res) => {
  
  removeItemsWithoutStats();
  
  res.send('Removing item data that contains only values of 0')
});

app.listen(port, () => console.log(`Listening on port ${port}!`));

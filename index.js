//imports
const express = require('express');
const app = express();
const port = 3002;
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');

//variables
const allItemsURI = 'https://oldschoolrunescape.fandom.com/wiki/Category:Items';
const baseURI = 'https://oldschoolrunescape.fandom.com';
const allItemData = require('./osrs-item-data-no-0s.min.json');
const allItemLinkArray = require('./osrs-wiki-links-all-items.json');
const allItemLinkArrayLength = allItemLinkArray.length;
const anchorLinkArray = [];
const itemStatDataObjectArray = [];
const indexesThatHaveBeenRequested = [];

const requestArr = [
  {
    requestObj: {
      uri: "https://oldschoolrunescape.fandom.com/wiki/Full_helmet",
    },
    keywords: ['helmet', 'sallet']
  },
  
];

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

function collectAnchors(paramObj, i) {
  console.log('making request number', i + 1);
  request(paramObj.requestObj, (err, res, body) => {
    
    if (err) {
      console.log('encountered error during collectAnchors request number', i + 1, 'err:', err);
    }
    
    const $ = cheerio.load(body);
    
    const anchorArr = [];
  
    $("a").each(function(i, link){
      anchorArr[i] = $(link).attr("href");
    });
    
    console.log('anchorArr', anchorArr);
    
    const keywordFiltered = [];
    
    anchorArr.map((currentAnchor) => {
      return paramObj.keywords.map((e) => {
        if (!currentAnchor || !(typeof currentAnchor)) {
          return
        }
        if (currentAnchor.includes(e)) {
          keywordFiltered.push(currentAnchor)
        }
      })
    });
    
    const filteredHREFArr = keywordFiltered.filter(e => e.startsWith('/wiki/'));
    
    console.log('filteredHREFArr', filteredHREFArr);
    
  });
}

function collectAllItemsList(URI = allItemsURI) {
  
  if (!URI) {
    console.log('collectAllItemsList called without URI, returning');
    return;
  }
  
  request(URI, (err, res, body) => {
    if (err) {
      console.log('encountered error during collectAllItemsList, err:', err);
    }
    
    console.log('collectAllItemsList called');
  
    const $ = cheerio.load(body);
    const table = 'div.category-page__members';
    const nextPageAnchor = $('a.category-page__pagination-next')[0];
    const nextPageLink = nextPageAnchor ? nextPageAnchor.attribs.href : null; //error handle for final page
  
    $(table).find('a').each((i, e) => {anchorLinkArray.push(e.attribs.href)});
    
    if (nextPageLink) {
      console.log('nextPageLink exists, calling collectAllItemsList');
      collectAllItemsList(nextPageLink);
    }
    else {
      console.log('nextPageLink does not exist, writing file');
      fs.writeFile('osrs-wiki-links-all-items.min.json', JSON.stringify(anchorLinkArray), err => {
        if (err) {
          console.log('error writing file', err);
        }
        else {
          console.log('file written');
        }
      })
    }
    
  })
}

function collectItemDataFromLinks(index) {
  console.log('CollectItemDataFromLinks called with index', index, '- allItemLinkArrayLength', allItemLinkArrayLength);
  
  if (!allItemLinkArray[index]) {
    console.log('CollectItemDataFromLinks called without URI, returning');
    return;
  }
  
  const URI = (baseURI + allItemLinkArray[index]);
  
  request(URI, (err, res, body) => {
    if (err) {
      console.log('encountered error during collectItemDataFromLinks, err:', err);
    }
    
    const $ = cheerio.load(body);
    
    //console.log('$', $('div.pi-smart-data-value[data-source^="astab"]'));
    
    const statTableSelectorKeys = Object.keys(statTableSelectorObject);
    const itemStatObject = {
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
  
    let jLoopHasBroken = false;
    
    for (let i = 0; i < statTableSelectorKeys.length; i++) {
      if (jLoopHasBroken) {
        break;
      }
      const currentStatTableSelectorObjectKey = statTableSelectorKeys[i];
      const currentObjectSelectors = Object.keys(statTableSelectorObject[currentStatTableSelectorObjectKey]);
      
      for (let j = 0; j < currentObjectSelectors.length; j++) {
        
        const currentDOMElement = $(statTableSelectorObject[currentStatTableSelectorObjectKey][currentObjectSelectors[j]]);
        const currentStatValue = currentDOMElement.text();
        
        // console.log('statTableSelectorObject[currentStatTableSelectorObjectKey][currentObjectSelectors[j]]',
        //   statTableSelectorObject[currentStatTableSelectorObjectKey][currentObjectSelectors[j]]);
        
        console.log('CurrentStatValue', currentStatValue);
        
        if (!currentStatValue) {
          console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!Breaking out of loops with index', index);
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

app.get('/collectAnchors', (req, res) => {
  console.log('requesting all links in requestArr');
  requestArr.forEach(collectAnchors);
  res.send('requesting all links in requestArr');
});

app.get('/collectAllItemsList', (req, res) => {
  console.log('collecting all items in list');
  collectAllItemsList();
  res.send('collecting all items in list');
});

app.get('/collectItemDataFromLinks', (req, res) => {
  console.log('collecting all item data from links');
  // let index = 0;
  // function incremementIndex() {
  //   index++;
  // }
  collectItemDataFromLinks(0);
  indexesThatHaveBeenRequested.push(0);
  res.send('collecting all item data from links');
});

app.get('/removeItemsWithoutStats', (req, res) => {
  removeItemsWithoutStats();
  res.send('doing stuff')
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
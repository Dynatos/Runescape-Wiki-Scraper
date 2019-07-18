# Runescape-Wiki-Scraper
This app uses an Express server to scrape data from both the official Oldschool Runescape Wiki and the deprecated Fandom Wiki. The data is formatted into objects and written to the disk as JSON.

The official wiki:
https://oldschool.runescape.wiki/

The deprecated wiki:
https://oldschoolrunescape.fandom.com/wiki/Old_School_RuneScape_Wiki

I created this tool so that I could easily collect updated stat values whenever Runescape is updated. The retrieved data is used in the Runescape tools found on my personal website. 
Source code of the application that utilizes the data: https://github.com/Dynatos/personal-website
Live tools: 
https://jasonwortley.com/runescape 
https://jasonwortley.com/runescape_max_hit
This tool has no browser UI and uses the console for relevant output.

# Usage
To get started with this app simply clone the repo down, then in the command line run `npm start` for the official wiki scraper, or `npm run start-unofficial` for the deprecated scraper.

*Note: I used Node Version 10.11.0 and NPM Version 6.4.1, but other versions may work as well.*

The app will log 'Listening on port XXXX' when successfully started. 

Finally, make a request to localhost:XXXX followed by:

For the official scraper:
```
/getData
```

For the deprecated scraper:
```
/getPartialURIForEveryItem, /getItemDataFromLinks, /removeItemsWithoutStats
```


(Example URL: 'localhost:3002/getPartialURIForEveryItem')


##Official scraper
###HTTP Endpoint Breakdown:

	####`/getData`
	Iterates over the 'allItemURIArr' array, making a request to each of the URIs present. Parses the returned page, extracts relevant values, stores them, and writes JSON to the disk

## Deprecated scraper
### HTTP Endpoint Breakdown:

  #### `/getPartialURIForEveryItem`
  Hits the first of our wiki pages that contain 200 links for items in the game, listed alphabetically. Additional requests are made
  as long as a 'next' button is found on the page. The anchors are all pushed into a single array, and that array is written to the
  disk as JSON when all links have been collected.

  Wiki link containing all the anchors: https://oldschoolrunescape.fandom.com/wiki/Category:Items
    
    
  #### `/getItemDataFromLinks`
  Uses the JSON array made by /getPartialURIForEveryItem. Makes a request for each link in the array, collects the stat data, and
  writes the data as JSON to the disk when all item data has been collected.
    
    
  #### `/removeItemsWithoutStats`
  Cleans up the data collected from /getItemDataFromLinks. Loops through all item stat data objects looking for items with only 0s for 
  stats, filters them, and writes another file to the disk containing only the useful item data.


# TODO
  Add functionality to collect all item icons so that all necessary data can be collected to update https://jasonwortley.com/runescape

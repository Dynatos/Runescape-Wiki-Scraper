# Runescape-Wiki-Scraper
This app is an Express server that uses Request and Cheerio to scrape data from the Oldschool Runescape Wiki. The data is automatically formatted into objects, and written to the disk as JSON.

The wiki that this App is designed to scrape from:
https://oldschoolrunescape.fandom.com/wiki/Old_School_RuneScape_Wiki

I created this tool so that I could easily collect updated stat values whenever Runescape is updated. The retrieved data is used in the Runescape tools found on my personal website. 
Source code of the application that utilizes the data: https://github.com/Dynatos/personal-website
Live tools: https://jasonwortley.com/runescape, https://jasonwortley.com/runescape_max_hit
This tool uses the console for relevant output, rather than having a web UI.

# Usage
To get started with this app simply clone the repo down, then run 'node index.js' in the command line (I used Node Version 10.11.0 and NPM Version 6.4.1, but other version may work as well). The app will log 'Listening on port XXXX' when successfully started. From there make a request to localhost:XXXX (port number) followed by any of the following: 
/getPartialURIForEveryItem, /getItemDataFromLinks, /removeItemsWithoutStats
(Example browser URL: 'localhost:3002/getPartialURIForEveryItem')

Page function breakdown:

  /getPartialURIForEveryItem:
    Hits the first of our wiki pages that contain 200 links for items in the game, listed alphabetically. Additional requests are made
    as long as a 'next' button is found on the page. The anchors are all pushed into a single array, and that array is written to the
    disk as JSON when all links have been collected.
    Wiki link containing all the anchors: https://oldschoolrunescape.fandom.com/wiki/Category:Items
    
    
  /getItemDataFromLinks:
    Uses the JSON array made by /getPartialURIForEveryItem. Makes a request for each link in the array, collects the stat data, and
    writes the data as JSON to the disk when all item data has been collected.
    
    
  /removeItemsWithoutStats:
    Cleans up the data collected from /getItemDataFromLinks. Loops through all item stat data objects looking for items with only 0s for 
    stats, filters them, and writes another file to the disk containing only the useful item data.


# TODO
  Add functionality to collect all item icons so that all necessary data can be collected to update https://jasonwortley.com/runescape
  ? Create a browser UI

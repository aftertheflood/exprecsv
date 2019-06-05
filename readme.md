# ExpreCSV

An awkwardly titled server for accessing CSVs (and a few other things) from Google spreadsheets written in [NodeJS](https://nodejs.org/en/) and based on [Express](https://expressjs.com/)

### Motivation

I wanted a way to quickly prototype data driven applications without needing to spend too much time upfront modeling data.

## Routes

Once the app is up and running and ha access to some google sheets then the following routes exists.

  __[DOMAIN]/data/:sheetId.json__
  A summary of available sheets for a given Google doc specified by _:sheetId_

  __[DOMAIN]/data/:sheetId/:worksheetTitle.csv__
  A CSV of the worksheet called _:worksheetTitle_ from the doc specified by _:sheetId_

  __[DOMAIN]/data/:sheetId/:worksheetTitle.csv__
  See above, but JSON

  __[DOMAIN]/data/:sheetId/dictionary/:worksheetTitle-by-:key.json__
  A JSON object where the property defined by _:key_ can be used to look up records

  __[DOMAIN]/data/:sheetId/find/:key=:value-in-:worksheetTitle.json__
  A JSON array of rows in the worksheet where the _:key_ column is equal to a specified _:value_ can be used for simple filtering
 
---

## Google sheet restrictions

Column names in the spreadsheets can't be _id_

## Google-spreadsheet authentiction

https://github.com/theoephraim/node-google-spreadsheet

If you are using Heroku or another environment where you cannot save a local file, you may just pass in an object with
 
 client_email -- your service account's email address
 private_key -- the private key found in the JSON file

Internally, this uses a JWT client to generate a new auth token for your service account that is valid for 1 hour. The token will be automatically regenerated when it expires.

SPECIAL NOTE FOR HEROKU USERS

Save your private key to a text file
Replace \n with actual line breaks
Replace \u003d with =
heroku config:add GOOGLE_PRIVATE_KEY="$(cat yourfile.txt)"
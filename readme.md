Column names can't be id

## google-spreadsheet authentiction

https://github.com/theoephraim/node-google-spreadsheet

If you are using heroku or another environment where you cannot save a local file, you may just pass in an object with

client_email -- your service account's email address
private_key -- the private key found in the JSON file

Internally, this uses a JWT client to generate a new auth token for your service account that is valid for 1 hour. The token will be automatically regenerated when it expires.

SPECIAL NOTE FOR HEROKU USERS

Save your private key to a text file
Replace \n with actual line breaks
Replace \u003d with =
heroku config:add GOOGLE_PRIVATE_KEY="$(cat yourfile.txt)"
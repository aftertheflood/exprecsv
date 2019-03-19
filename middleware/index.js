const GoogleSpreadsheet = require('google-spreadsheet');
const LRU = require('lru-cache');
const {csvFormat} = require('d3-dsv');
//const credsJson = require('../creds.json');

const creds = {
  client_email: process.env.SERVICE_EMAIL, //? process.env.SERVICE_EMAIL : credsJson.client_email, // 'yourserviceaccountemailhere@google.com',
  private_key: process.env.GOOGLE_PRIVATE_KEY //? process.env.GOOGLE_PRIVATE_KEY : credsJson.private_key, // 'your long private key stuff here'
}

const cache = new LRU({ 
  max: 500,
  length:  (n, key) => (n * 2 + key.length),
  dispose: (key, n) => { n.close(); },
  maxAge: 1000 * 60 * 60 
});

const fileFormat = (url)=>{
  const elements = String(url).split('?')[0].split('.');
  return elements[elements.length-1];
}

module.exports = {
  setCache: (key, value)=> cache.set(key, value),
  lru: (req, res, next)=>{
    req.sheetId = req.params.sheetId;
    req.worksheetTitle = req.params.worksheetTitle;
    req.cacheKey = req.originalUrl
      .split(/[\/\.]/g)
      .filter(d=>d!='')
      .map((d,i)=>{
        return `${d.split('?')[0]}-${i}`
      }).join('.');
    
    const cached = cache.get(req.cacheKey);
    if(cached){
      console.log('cached');
      if(fileFormat(req.originalUrl) === 'csv'){
        res.setHeader('Content-Type', 'text/csv');
        res.send(csvFormat(req.rows));
      }else{
        res.json(cached);
      }
    }else{
      console.log('not cached');
      next();
    }
  },
  getSheetInfo: (req, res, next) => {
    req.sheetId = req.params.sheetId;
    req.worksheetTitle = req.params.worksheetTitle;
    req.sheet = new GoogleSpreadsheet(req.sheetId);
    req.sheet.useServiceAccountAuth(creds, next);
  },
  getWorksheetList: (req, res, next)=>{ 
    req.sheet.getInfo((err, info) => {
      req.worksheets = info.worksheets.map(d=>d.title);
      next();
    });
  },
  getWorksheet: (req, res, next) => {
    req.sheet.getInfo((err, info) => {
      //only include spreadsheets which we have marked 'data'
      req.worksheets = info.worksheets
        .filter(worksheet=>(worksheet.title === req.worksheetTitle));

      if(req.worksheets.length>0) {
        req.worksheets[0].getRows({}, (err, rows)=>{
          const keys = Object.keys(rows[0]) // filter our the standard row keys
            .filter(k => !( k==='_xml' || k==='id' || k==='_links' || k==='save' || k==='del'));

          req.rows = rows.map(row=>{
            const strippedRow = {}
            keys.forEach(d=>{ strippedRow[d] = row[d]; })
            return strippedRow;
          });
          next();
        })
      } else {
        next();
      }
    });
  }
};
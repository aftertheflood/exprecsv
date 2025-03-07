const GoogleSpreadsheet = require('google-spreadsheet');
const LRU = require('lru-cache');
const {csvFormat} = require('d3-dsv');

const creds = {
  client_email: process.env.SERVICE_EMAIL,
  private_key: process.env.GOOGLE_PRIVATE_KEY
}

const cache = new LRU({ 
  max: 500,
  length:  (n, key) => (n * 2 + key.length),
  dispose: (key, n) => { n="" },
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
    
    if(cached && req.query.bust != process.env.BUSTER){
      if(fileFormat(req.originalUrl) === 'csv'){
        res.setHeader('Content-Type', 'text/csv');
        res.send(csvFormat(req.rows));
      } else {
        res.json(cached);
      }
    }else{
      if( req.query.bust == process.env.BUSTER ){ console.warn('BUSTED! ', req.originalUrl); }
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
      if (err) {
        console.log('ERR getWorksheetList'); 
        next(err); // Pass errors to Express. 
      }else{
        req.worksheets = info.worksheets.map(d=>d.title);
        next();
      }
    });
  },
  getWorksheet: (req, res, next) => {
    req.sheet.getInfo((err, info) => {
      if (err) {
        console.log('ERR getInfo');
        next(err); // Pass errors to Express.
      }else{
        req.worksheets = info.worksheets
          .filter(worksheet=>(worksheet.title === req.worksheetTitle));

        if(req.worksheets.length>0) {
          req.worksheets[0].getRows({}, (err, rows)=>{
            if (err) { 
              console.log('ERR getRows');
              next(err);// Pass errors to Express. 
            }else{
              const keys = Object.keys(rows[0]) // filter our the standard row keys
                .filter(k => !( k==='_xml' || k==='id' || k==='_links' || k==='save' || k==='del'));

              req.rows = rows.map(row=>{
                const strippedRow = {}
                keys.forEach(d=>{ strippedRow[d] = row[d]; })
                return strippedRow;
              });
              next();
            }
          })
        } else {
          next();
        }
      } 

    });
  }
};
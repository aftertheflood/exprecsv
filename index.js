require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors')
const {csvFormat} = require('d3-dsv');
const {lru, getSheetInfo, getWorksheet, getWorksheetList, setCache} = require('./middleware');

const app = express();

app.use(helmet());
app.use(cors());

const config={ sitename: 'ExpreCSV (CORS enabled)' };

app.get('/', (req, res)=>{
  res.json(`${config.sitename}`);
});

app.get('/data/:sheetId/:worksheetTitle.csv',
  lru, getSheetInfo, getWorksheet,
  function (req, res) {
    if(req.cacheKey){
      setCache(req.cacheKey, req.rows);
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `inline;filename="${req.worksheetTitle}.csv"`)
    res.send(csvFormat(req.rows));
  });

app.get('/data/:sheetId/:worksheetTitle.json',
  lru, getSheetInfo, getWorksheet,
  function (req, res) {
    if(req.cacheKey){
      setCache(req.cacheKey, req.rows);
    }
    res.json(req.rows);
  });

app.get('/data/:sheetId/dictionary/:worksheetTitle-by-:key.json',
  lru, getSheetInfo, getWorksheet,
  function (req, res) {
    const dictionary = req.rows.reduce((acc, current)=>{
      if(!acc[current[req.params.key]]){
        acc[current[req.params.key]] = [];
      }
      acc[current[req.params.key]].push(current);
      return acc;
    },{});

    if(req.cacheKey){
      setCache(req.cacheKey, dictionary);
    }
    res.json(dictionary);
  });

app.get('/data/:sheetId/find/:key-:value-in-:worksheetTitle.json',
  lru, getSheetInfo, getWorksheet,
  function (req, res) {
    const found = req.rows.filter( row=>(row[req.params.key] == decodeURI(req.params.value)) );

    if(req.cacheKey){
      setCache(req.cacheKey, found);
    }
    res.json(found);
  });

app.get('/data/:sheetId.json',
  lru, getSheetInfo, getWorksheetList,
  function (req, res) {
    const host = req.get('host');
    const protocol = req.protocol;
    const worksheets = req.worksheets.map(title => ({
      title,
      json: `${protocol}://${host}/data/${req.sheetId}/${title}.json`,
      csv: `${protocol}://${host}/data/${req.sheetId}/${title}.csv`,
      dict: `${protocol}://${host}/data/${req.sheetId}/dictionary/${title}-by-[column].json`,
      find: `${protocol}://${host}/data/${req.sheetId}/find/[column]-[value]-in-${title}.json`
    })); 
    if(req.cacheKey){
      setCache(req.cacheKey, { worksheets });
    }
    res.json({ worksheets });
  });

app.use(function(err, req, res, next) {
  console.error('ERROR handler', err.message); // Log error message in our server's console
  res.status(500)
    .json({
      status: 500,
      err: err.message
    }); // All HTTP requests must have a response, so let's send back an error with its status code and message
});

app.use(function (req, res, next) {
  res.status(404).json({
    status:404, 
    message:`Sorry! Couldn\'t find ${req.originalUrl}`
  });
});

const port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log(`ExpreCSV is running on ${port}`);
});

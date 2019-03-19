require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const {csvFormat} = require('d3-dsv');

const middleware = require('./middleware');
const app = express();

app.use(helmet());

const config={ sitename: 'ExpreCSV' };

app.get('/', (req, res)=>{
  res.json(`${config.sitename}`);
});

app.get('/data/:sheetId/:worksheetTitle.csv',
  middleware.lru,
  middleware.getSheetInfo,
  middleware.getWorksheet,
  function (req, res) {
    if(req.cacheKey){
      middleware.setCache(req.cacheKey, req.rows);
    }
    res.setHeader('Content-Type', 'text/csv');
    res.send(csvFormat(req.rows));
  });

app.get('/data/:sheetId/:worksheetTitle.json',
  middleware.lru,
  middleware.getSheetInfo, 
  middleware.getWorksheet,
  function (req, res) {
    if(req.cacheKey){
      middleware.setCache(req.cacheKey, req.rows);
    }
    res.json(req.rows);
  });

app.get('/data/:sheetId/dictionary/:worksheetTitle-by-:key.json',
  middleware.lru,
  middleware.getSheetInfo, 
  middleware.getWorksheet,
  function (req, res) {
    const dictionary = req.rows.reduce((acc, current)=>{
      acc[current[req.params.key]] = current;
      return acc;
    },{});

    if(req.cacheKey){
      middleware.setCache(req.cacheKey, dictionary);
    }
    res.json(dictionary);
  });

app.get('/data/:sheetId.json',
  middleware.lru,
  middleware.getSheetInfo, 
  middleware.getWorksheetList,
  function (req, res) {
    const worksheets = req.worksheets.map(title => ({
      title,
      json:`/data/${req.sheetId}/${title}.json`,
      csv:`/data/${req.sheetId}/${title}.csv`,
      dict:`/data/${req.sheetId}/dict/${title}.json`
    })); 
    if(req.cacheKey){
      middleware.setCache(req.cacheKey, { worksheets });
    }
    res.json({ worksheets });
  });

const port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log(`ExpreCSV is running on ${port}`);
});

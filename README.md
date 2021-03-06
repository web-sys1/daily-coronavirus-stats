# Daily Coronavirus Statistics

Source: [ecdc.europa.eu](https://www.ecdc.europa.eu/en/publications-data/download-todays-data-geographic-distribution-covid-19-cases-worldwide)

## Data

[Explore the data on the data branch here.](https://github.com/Tiim/daily-coronavirus-stats/tree/data)

### Time Series Format

- [Time Series (json)](https://raw.githubusercontent.com/Tiim/daily-coronavirus-stats/data/data.json):

```json
[
  {
    "date": "yyyy-mm-dd",
    "[geoId]": {
      "newCases": 0,
      "newDeaths": 0
    }
  }
]
```

For a list of country codes (`geoId`) see countries.json

### Country List Text

- [Countries (txt)](https://raw.githubusercontent.com/Tiim/daily-coronavirus-stats/data/countries.txt)

A newline separated list of all country full names

### Countries List Json

- [Countries (json)](https://github.com/Tiim/daily-coronavirus-stats/blob/data/countries.json)

```json
[
  {
    "geoId": "CH",
    "countryName": "Switzerland",
    "eu": "Non-EU/EEA | EU | 0"
  }
]
```

### Scrape Metadata

- [Metadata (json)](https://github.com/Tiim/daily-coronavirus-stats/blob/data/meta.json)

Example:

```json
{
  "lastScrape": "2020-03-18T17:58:57.470Z",
  "lastSourceUpdate": {
    "url": "https://www.ecdc.europa.eu/sites/default/files/documents/COVID-19-geographic-disbtribution-worldwide-2020-03-18.xls",
    "date": "2020-03-18",
    "fileExtension": "xls",
    "header_lastModified": "Wed, 18 Mar 2020 11:33:02 GMT"
  }
}
```

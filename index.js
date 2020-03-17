import fetch from "node-fetch";
import { createWriteStream } from "fs";
import wait from "waait";
import XLSX from "xlsx";
import { writeFileSync } from "fs";

start();

async function start() {
  const sourceUpdate = await downloadCurrentData("data.xlsx");
  await wait(2000); // Hack to make sure the file is properly closed
  const rawData = parse("data.xlsx");
  const { timeSeries, countries } = formatData(rawData);
  const meta = {
    lastScrape: new Date(),
    lastSourceUpdate: sourceUpdate
  };

  writeFileSync("data/data.json", JSON.stringify(timeSeries, null, 2));
  writeFileSync("data/countries.json", JSON.stringify(countries, null, 2));
  writeFileSync("data/countries.txt", countryList(countries));
  writeFileSync("data/meta.json", JSON.stringify(meta, null, 2));
  console.log(rawData.length + " total entries");
  console.log(countries.length + " countries");
  console.log(timeSeries.length + " days");
}

function countryList(countries) {
  return countries.map(c => c.countryName).join("\n");
}

function formatData(data) {
  const grouped = data
    .map(d => ({ ...d, date: new Date(d.date).toISOString().substr(0, 10) }))
    .reduce(
      (acc, cur) => {
        if (!acc.timeSeries[cur.date]) {
          acc.timeSeries[cur.date] = {
            date: cur.date
          };
        }
        acc.timeSeries[cur.date][cur.geoId] = {
          newCases: cur.newCases,
          newDeaths: cur.newDeaths
        };
        acc.countries[cur.geoId] = {
          geoId: cur.geoId,
          countryName: cur.countryName
        };
        return acc;
      },
      { timeSeries: {}, countries: {} }
    );
  // Convert timeSeries from object to array
  grouped.timeSeries = Object.values(grouped.timeSeries);
  grouped.timeSeries.sort((a, b) => new Date(a.date) - new Date(b.date));

  //Convert countries from object to array
  grouped.countries = Object.values(grouped.countries);
  grouped.countries.sort((a, b) => a.countryName.localeCompare(b.countryName));

  return grouped;
}

function parse(file) {
  const wb = XLSX.readFile(file, {
    dateNF: "yyyy-mm-dd",
    cellDates: true
  });
  var ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils
    .sheet_to_json(ws, {
      header: [
        "date",
        "day",
        "month",
        "year",
        "newCases",
        "newDeaths",
        "countryName",
        "geoId"
      ],
      dateNF: "yyyy-mm-dd"
    })
    .slice(1);
}

function getDate(date, daysAgo) {
  const d = new Date(date);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().substr(0, 10);
}

async function downloadCurrentData(file) {
  let date = new Date();

  let error = 0;
  let res;
  let d;
  while (error < 10) {
    d = getDate(date, error);
    const url = `https://www.ecdc.europa.eu/sites/default/files/documents/COVID-19-geographic-disbtribution-worldwide-${d}.xlsx`;
    res = await fetch(url);
    if (res.status !== 200) {
      console.log("File not found for date " + d);
      error += 1;
      await wait(3000);
    } else {
      console.log("Successful for date " + d);
      error = 0;
      break;
    }
  }

  const fileStream = createWriteStream(file);
  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", reject);
    res.body.on("finish", resolve);
  });
  return d;
}

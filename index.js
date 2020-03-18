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

function getNextUrl(data) {
  //Default data
  if (data == null) {
    data = {
      xlsx: false,
      daysAgo: 0
    };
  }
  // abort if 10 days tried
  if (data.daysAgo > 10) {
    return null;
  }
  const d = getDate(new Date(), data.daysAgo);
  const ext = data.xlsx ? "xlsx" : "xls";
  const url = `https://www.ecdc.europa.eu/sites/default/files/documents/COVID-19-geographic-disbtribution-worldwide-${d}.${ext}`;
  return {
    xlsx: !data.xlsx,
    daysAgo: data.xlsx ? data.daysAgo + 1 : data.daysAgo,
    url,
    file: `date: ${d}, type: ${ext}`,
    meta: {
      url,
      date: d,
      fileExtension: ext
    }
  };
}

async function downloadCurrentData(file) {
  let date = new Date();

  let res;
  let data = getNextUrl();
  while (data) {
    res = await fetch(data.url);
    if (res.status !== 200) {
      console.log("File not found " + data.file);
      await wait(3000);
    } else {
      console.log("Successful " + data.file);
      break;
    }
    data = getNextUrl(data);
  }

  const headers = res.headers;
  const header_lastModified = headers.get("last-modified");

  const fileStream = createWriteStream(file);
  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", reject);
    res.body.on("finish", resolve);
  });
  return { ...data.meta, header_lastModified };
}

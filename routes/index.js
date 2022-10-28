var express = require("express");
var router = express.Router();
var parser = require("jsfromxml");
let fs = require("fs");
// const axios = require("axios");
var parseString = require("xml2js").parseString;
// var xml = "<root>Hello xml2js!</root>";
const multer = require("multer");
const path = require("path");
let xml = require("../models/xmlBunch");
const { chromium } = require("playwright");
const workerpool = require("workerpool");
const pool = workerpool.pool();
const ejs = require("ejs");
const axios = require("axios");
let async = require("async");
const e = require("express");
const JSZip = require("jszip");
// const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

/* GET home page. */
router.get("/", async (req, res) => {
  // pool.exec(delelePreviousFiles);
  delelePreviousFiles();
  res.render("index");
});

router.get("/status", (req, res) => {
  fs.readdir("./pdfs", (err, data) => {
    let nn = data.length.toString();
    console.log(data, "pdfssssssssss", data.length);
    res.send(nn);
  });
});

router.get("/downloadzip", (req, res) => {
  zipFolder();
  checkMasterZip(res);
});

router.get("/dealwithallpdf/:payloadid/:payload_index", async (req, res) => {
  let payloadid = req.params.payloadid;
  let payloadindex = req.params.payload_index;
  let toDealWith = await xml.findById(payloadid);
  console.log(toDealWith, "payload000000000");

  res.render(
    "pdfpage",
    toDealWith.arrayOfXmls[parseInt(payloadindex)],
    function (err, html) {
      console.log(
        payloadindex,
        "payloadIndex",
        typeof payloadindex,
        "------------",
        typeof html
      );
      if (typeof html == "string") {
        fs.writeFile(`./htmls/html${payloadindex}.html`, html, function (err) {
          if (err) console.log(err);
          console.log("Saved!");
        });
      }
      res.send(html);
    }
  );

  // sendRequestTopage(0, payloadid);
  // turnAllToPdf(toDealWith.arrayOfXmls, payloadid);
});

router.get("/pdfzip", async (req, res) => {
  let id = req.query.id;
  let toDealWith = await xml.findById(id);

  // res.send()
  // console.log(await toDealWith.arrayOfXmls[0], "jjjjj");

  res.redirect(`/dealwithallpdf/${id}/0`);

  // res.render("pdfpage", await toDealWith.arrayOfXmls[0]);
});

router.post("/pdf", upload.array("pdf"), async (req, res) => {
  let arrayOFUploadedXmls = req.files;
  let newxml = new xml({
    name: new Date().toString(),
    arrayOfXmls: [],
  });

  newxml.save().then(() => {
    arrayOFUploadedXmls.forEach((xml, ind) => {
      readAndExtract(xml, newxml._id);

      if (ind == arrayOFUploadedXmls.length - 1) {
        console.log("reached*******");
        setTimeout(() => {
          for (i = 0; i <= arrayOFUploadedXmls.length; i++) {
            axios.get(
              `http://localhost:3000/dealwithallpdf/${newxml._id}/${i}`
            );
          }
        }, 9000);
      }
    });
  });

  isNoOfHtmlEqualUploadedXmls(arrayOFUploadedXmls.length);

  // setTimeout(() => {
  //   for (i = 0; i <= arrayOFUploadedXmls.length; i++) {
  //     axios.get(`http://localhost:3000/dealwithallpdf/${newxml._id}/${i}`);
  //   }
  // }, 9000);

  res.render("loading", { no: arrayOFUploadedXmls.length });
});

async function turnAllToPdf(arr, id) {
  ttpdf(arr, id);
}

module.exports = router;

function getTirePressureMonitor(arr) {
  let finalWarning = [];
  warning = arr.map((data) => {
    if (data.$.value >= 1) {
      return data;
    }
  });

  warning.forEach((data) => {
    if (data != null) {
      finalWarning.push(data);
    }
  });

  return finalWarning.length > 0 ? finalWarning : false;
}

// const { chromium } = require("playwright");
// const fs = require("fs");

function sendRequestTopage(id, index) {
  axios.get(`http://localhost:3000/dealwithallpdf/${id}/${index}`);
}

async function readAndExtract(filename, id) {
  var dataPayload001;
  fs.readFile(`./uploads/${filename.filename}`, async (err, load) => {
    data = load.toString();

    parseString(data, async function (err, result) {
      // array of information
      let infoArr = result.VDoc.VDocSection;
      let infoArr2 = result.VDoc.VDocSection[0].DataItems[0].Item;

      //info2
      let info2 = result.VDoc.VDocSection[0].DataItems[2];
      let info2Ready = info2.CodeScanSystems[0].System;
      let title =
        result.VDoc.VDocSection[0].DataItems[2].CodeScanType[0].$.value;
      let date = result.VDoc.$.DateCreated;
      let systemDetected = info2.CodeScanSystems[0].$.value;
      // res.send(info2.CodeScanSystems[0].System);
      let warningSection = getTirePressureMonitor(
        info2.CodeScanSystems[0].System
      );
      let readinessSection = info2.ReadinessMonitorsTestsComplete;

      let payLoad = {
        info1: infoArr2,
        info2: info2Ready,
        title: title,
        date: date,
        noDetected: systemDetected,
        warningSection: warningSection,
        readiness: readinessSection,
      };

      let addNewXMl = await xml.findById(id);
      // console.log(addNewXMl);

      await addNewXMl.arrayOfXmls.push(payLoad);
      await addNewXMl.save();
    });
  });

  // return dataPayload001;
}
function isNoOfHtmlEqualUploadedXmls(noOfUploadedXml) {
  fs.readdir("./htmls", function (err, data) {
    if (err) {
      console.log(err);
    }
    console.log(data);
    if (data.length == noOfUploadedXml) {
      for (i = 0; i <= noOfUploadedXml - 1; i++) {
        console.log(data[i + 1], "htmlfile");
        if (data[i]) {
          turnToPdf(data[i], i.toString());
        }
      }
    } else {
      isNoOfHtmlEqualUploadedXmls(noOfUploadedXml);
    }
    console.log(data.length, "no of file present");
  });
}

async function turnToPdf(htmlfile, name) {
  // launch a new chrome instance
  const browser = await chromium.launch({
    headless: true,
  });

  // create a new page
  const page = await browser.newPage();

  // set your html as the pages content
  const html = fs.readFileSync(`./htmls/${htmlfile}`, "utf8");
  await page.setContent(html, {
    waitUntil: "domcontentloaded",
  });

  await page.emulateMedia({
    media: "screen",
    css: "-webkit-print-color-adjust",
  });
  await page.pdf({
    format: "A4",
    path: `./pdfs/pdf${name}.pdf`,
  });

  // close the browser
  await browser.close();
}

function zipFolder() {
  const zip = new JSZip();

  try {
    fs.readdir("./pdfs", function (err, data) {
      data.forEach((name, index) => {
        let datax = fs.readFileSync(`./pdfs/${name}`);
        zip.file(`pdf${index}.pdf`, datax);
        console.log(index, "loading zip............");
        if (index == data.length - 1) {
          setTimeout(() => {
            zip
              .generateNodeStream({ type: "nodebuffer", streamFiles: true })
              .pipe(fs.createWriteStream("masterZip.zip"))
              .on("finish", function () {
                console.log("sample.zip written.");
              });
          }, 9000);
        }
      });
    });

    // const pdfData = fs.readFileSync("sample.pdf");
    // zip.file("PDFFile.pdf", pdfData);

    // zip.file("Textfile.txt", "Hello NodeJS\n");
  } catch (err) {
    console.error(err);
  }
}

function checkMasterZip(res) {
  const path = "./masterZip.zip";

  if (fs.existsSync(path)) {
    res.download(path);
  } else {
    setTimeout(() => {
      if (fs.existsSync(path)) {
        res.download(path);
      }
    }, 18000);
  }
}

function delelePreviousFiles() {
  const directory = "./pdfs";

  fs.readdir(directory, (err, files) => {
    if (err) console.log(err);

    if (files.length != 0) {
      for (const file of files) {
        fs.unlink(path.join(directory, file), (err) => {
          if (err) console.log(err);
        });
      }
    }
  });

  const directory2 = "./htmls";

  fs.readdir(directory2, (err, files) => {
    if (err) console.log(err);

    if (files.length != 0) {
      for (const file of files) {
        fs.unlink(path.join(directory2, file), (err) => {
          if (err) console.log(err);
        });
      }
    }
  });

  if (fs.existsSync("./masterZip.zip")) {
    fs.unlink("masterZip.zip", (err, success) => {
      if (err) {
        console.log(err);
      }
      console.log(success, "sucesss deleting zipfile----------");
    });
  }
}
// zipFolder();

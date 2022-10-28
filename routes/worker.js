// const playwright = require("playwright");
// const workerpool = require("workerpool");
// const pool = workerpool.pool();

// async function ttpdf(arr, idd) {
//   let browser = await playwright.chromium.launch();
//   let page = await browser.newPage();

//   for (i = 0; i <= arr.length; i++) {
//     let status = await page.goto(
//       `http://localhost:3000/dealwithallpdf/${idd}/${arr[i].index}`,
//       {
//         timeout: 0,
//       }
//     );
//     status = status.status();
//     if (status != 404) {
//       //   page.pdf({ path: `pdf${i}.pdf` });
//       console.log("sucess");
//     }
//   }
// }

// workerpool.worker({
//   ttpdf: ttpdf,
// });

fs.appendFile("../app.js", "console.log('jjjj)", function (err) {
  if (err) {
    console.log(err);
  }
  console.log("changesd....");
});

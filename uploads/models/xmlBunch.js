let mongoose = require("mongoose");

let xmlBunchSchmea = mongoose.Schema({
  name: { type: String },
  arrayOfXmls: [{}],
});

module.exports = mongoose.model("xmls", xmlBunchSchmea);

// { info1: infoArr2,
//     info2: info2Ready,
//     title: title,
//     date: date,
//     noDetected: systemDetected,
//     warningSection: warningSection,
//     readiness: readinessSection,}

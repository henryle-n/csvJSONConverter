// #################### SET UP VARIABLES ########################
// what name for the breakdown section

let nameOfBreakdownSection = 'lineItemDetails';
let breakdownCSVFileName = 'CO2breakdown.csv';
let mainBodyCSVFileName = 'mainData.csv'
let doYouNeedBreakdownSection = true; // this will add the breakdown in the metadata
var listOfToBeSumInMainBody = ['readyTime', 'dieselSavedVolume', 'dieselSavedCost', 'CO2eReduction', 'chargeAmount'];
// let doYouNeedBreakdownSection = false; // this will NOT add the breakdown to the metadata


// ##############################################################
import * as fs from 'fs';
let breakdownCSVPath = `./${breakdownCSVFileName}`;
let mainBodyCSVPath = `./${mainBodyCSVFileName}`;
var _mainData;
var _breakdownData;
// listOfToBeSumInMainBody = listOfToBeSumInMainBody.map(e => `total${e.charAt(0).toUpperCase()}${e.slice(1)}`);
console.log("===>>> listOfToBeSumInMainBody :: ", listOfToBeSumInMainBody);

fs.existsSync(mainBodyCSVPath) ? _mainData = fs.readFileSync(mainBodyCSVPath, "utf8") : console.log('WARNING :: No Main Body CSV detected ...');
fs.existsSync(breakdownCSVPath) ? _breakdownData = fs.readFileSync(breakdownCSVPath, "utf8") : console.log('WARNING :: No Breakdown CSV detected ...');


// import * as breakdownJSON from './breakdown.json';
// const breakdownJSON = JSON.parse(fs.readFileSync(new URL('./breakdown.json',
//     import.meta.url)));


const toBeConvToDate = ['fieldTicketDate', 'opsStartDate', 'opsEndDate', 'transactionDate'];
const toBeConvToNum = ['amount', 'originalFieldTicketQty', 'CO2Quantity'];


const jsonConverter = (feedData, breakdownORNOT) => {

    let tempDataArr = csvToJSON(feedData);
    let tempBreakDownArr = csvToJSON(_breakdownData);
    // console.log("===>>>> tempBreakDownArr", tempBreakDownArr[0]);

    // tempBreakDownArr = tempBreakDownArr.filter(item => Object.keys(item)[0] ? true : false);

    var breakDownArr = [];
    // let dateArr = [...new Set(tempBreakDownArr.map(item => item.transactionDate.split("T")[0]))];
    let dateArr = [...new Set(tempBreakDownArr.map(item => new Date(item.transactionDate).toISOString().split("T")[0]))];

    // let dateArr = [...new Set(tempBreakDownArr.map(item => new Date(item.transactionDate)))]
    console.log(` === >>> dateArr & length::${dateArr} &&& ${dateArr.length}`);

    for (let i = 0; i < dateArr.length; i++) {
        // console.log("tempBreakDownArr - Line 39", tempBreakDownArr);
        breakDownArr.push(tempBreakDownArr.filter(item => {
            return (new Date(item.transactionDate).toISOString().split("T")[0] == dateArr[i]);
            // return (new Date(item.transactionDate));
        }));
        // console.log('+++>>> KK', KK);

    }
    // console.log('+++>>> breakDownArr', breakDownArr);

    let totalAdded = 0;

    if (breakdownORNOT == true) {
        breakDownArr.length == tempDataArr.length ?
            console.log("adding all breakdowns ") :
            console.log(`WARNING ::: breakdown & mainData are NOT the same in length >>> 
        ${breakDownArr.length} breakDown vs. ${tempDataArr.length} mainBody!!!`);

        tempDataArr.forEach((e, index) => {
            // console.log("===>>> listOfToBeSumInMainBody 68 :: ", listOfToBeSumInMainBody[0]);
            // console.log('===>>> before adding breakdown e0 :: ', e)
            e[nameOfBreakdownSection] = (breakDownArr[index]);


            //  create additional field for the main Body if we need to calculate some total cost
            // from all breakdown in that day
            for (let i = 0; i < listOfToBeSumInMainBody.length; i++) {
                let totalAttr = `total${listOfToBeSumInMainBody[i].charAt(0).toUpperCase()}${listOfToBeSumInMainBody[i].slice(1)}`;
                if (e[nameOfBreakdownSection] && e[nameOfBreakdownSection].length > 0) {
                    e[totalAttr] = e[nameOfBreakdownSection].map(bd => bd[`${listOfToBeSumInMainBody[i]}`]).reduce((a, b) => +((parseFloat(a) + parseFloat(b)).toFixed(2)));

                    // ### custom adding more metadata for the main body
                    e['transactionDate'] = new Date(`${dateArr[index]}T23:59:59.000Z`);
                    e['dieselRate'] = breakDownArr[index][0].dieselRate;
                    e['amount'] = e['totalChargeAmount'];
                    e['variableRateCharge'] = '20%';

                } else {
                    // e[totalAttr] = 0;
                    // e[nameOfBreakdownSection] = null;

                    // console.log(`!!! WARNING !!! :: Possible missing ${nameOfBreakdownSection} for day #${index+1}.
                    // Check your data and rerun again.
                    // Day #${index+1} is NOT added"                    
                    // `);
                    continue; // skip over one iteration due to the empty breakdown
                }
            };

        });


    } else {
        console.log(`===>>> TOTAL::"ZERO" days has breakdown added!`);

    };

    tempDataArr = tempDataArr.filter(item => item[nameOfBreakdownSection]);
    console.log(`===>>> TOTAL:: ${tempDataArr.length} days were processed. `)

    return tempDataArr;
};

const csvToJSON = (csvArr) => {
    let rows = csvArr.split('\r\n');
    let headers = rows[0].split(',');


    let outputArr = rows.slice(1).map((eachRow, mapIndex) => {
        var tempObject = eachRow.split(',');


        tempObject = tempObject.reduce((total, currentValue, currentIndex) => {
            var dataObj = {};
            if (toBeConvToDate.includes(headers[currentIndex])) {
                // console.log('date detected! converting ....', headers[currentIndex]);
                dataObj[headers[currentIndex]] = new Date(currentValue);

            } else if (toBeConvToNum.includes(headers[currentIndex])) {
                // console.log('number detected! converting ....');
                dataObj[headers[currentIndex]] = parseFloat(currentValue);

            } else {
                if (isNaN(parseFloat(currentValue))) {
                    dataObj[headers[currentIndex]] = currentValue
                } else {
                    dataObj[headers[currentIndex]] = parseFloat(currentValue)
                };
                // dataObj[headers[currentIndex]] = currentValue;
                // console.log('date or num NOT detected ! ', headers[currentIndex]);
            }

            return {
                ...total,
                ...dataObj,
            };

        }, {});
        return tempObject;
    });


    // in case I got some empty rows in the csv that accidentally got added in the object
    return outputArr.filter(e => {
        if (e) {
            return Object.values(e)[0] != 0 ? true : false;
        } else return false;
    });
};


// let tobeCovCSV = _mainData;
const blockMetaData = jsonConverter(_mainData, doYouNeedBreakdownSection)
console.log("===>>> blockMetaData :: ", blockMetaData);
// console.log("===>>> 1st breakdown of blockMetaData :: ", blockMetaData[0][nameOfBreakdownSection]);



//###################### ONLY use if want to export to a JSON output file before writting blocks ##################################
let outputJSON = JSON.stringify(blockMetaData);

fs.writeFile("./outputBlockMetaData.json", outputJSON, err => {
    if (err) {
        console.log("!!! ERROR !!! :: ", err);
    } else {
        console.log('Successfully exported output JSON');
    }
});
// ###################################################################################################################################



export default csvToJSON;
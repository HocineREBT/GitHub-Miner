/* Include the GitHub-Miner Component */
const gm = require("../IssuesCollector");

/* Specify the search query parameters */
let query 		= "type:pr author:app/Dependabot-preview label:security";
let initialDate = "2021-04-01";
let finalDate 	= "2021-04-07";

let ranges = [
	[initialDate, finalDate]
	];

let destFolder = "./Results/";

let mode = 2;

/* Encode the query */
let encodedQuery = encodeURIComponent(query);


/*---------- Execution Step (1) ----------*/
gm.seachSampling(encodedQuery, ranges, destFolder + "Dates/", mode);


/*---------- Execution Step (2) ----------*/
gm.outlierFiltering(destFolder + "Dates/", destFolder + "Filtered-Dates/", 1);


/*---------- Execution Step (3) ----------*/
gm.queryAdjustment(encodedQuery, destFolder + "Filtered-Dates/large_dates_1.json", destFolder + "Dates/", 120, 1, mode);


/*---------- Execution Step (4) ----------*/
gm.issuesCollection(encodedQuery, destFolder + "Dates/", destFolder + "Data/", mode);


/*---------- Execution Step (5) ----------*/
gm.dataAnalysis(destFolder + "Data/", destFolder + "Summary/", false);

gm.dataSummary(destFolder + "Data/", destFolder + "Summary/", false);

gm.extractUsers(destFolder + "Data/", destFolder + "Summary/", false);

gm.extractPulls(destFolder + "Data/", destFolder + "Summary/", false);

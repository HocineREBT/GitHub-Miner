/**************************************************

				Issues Collector
		GitHub-Miner Component - Part 1

	Created by	: (Anonymous)
	Created at	: 30/06/2021
	Last Update : 05/04/2023

	------------------------

	Execution	: The pipeline should go as follows
				  (1) Search Sampling
				  (2) Outlier Filtering
				  (3) Query Adjustment
				  (*) Query Readjustment (Optional - If required)
				  (4) Issues Collection
				  (5) Data Analysis / Summary

****************************************************/


/***	 Adding dependencies		***/
const fs 			= require('fs');
const fss 			= require('fs').promises;
const axios 		= require('axios');
const moment		= require('moment');
const csvWriter = require('csv-write-stream');


/***		Global Variables		***/
var ENDPOINT 	= "https://api.github.com/search/issues";



/***************** Utility Functions *****************/

/*** 	A sub-function : Allows to run the query through pages and handle the data saving ***/
const runQuery = async (query, currDate, nextDate, count, path, mode) => {
	let finalQuery = query + "+created:" + currDate + ".." + nextDate;
	let dir = currDate.replace(/:/g, "T") + "_" + nextDate.replace(/:/g, "T");
	if (!fs.existsSync(path + dir)) {
		fs.mkdirSync(path + dir);
	}
	let pages = Math.ceil(count/100)
	for (var i = 1; i <= 10; i++) {
		let index = i;
		let fileName = "data_" + currDate.replace(/:/g, "T") + "_" + nextDate.replace(/:/g, "T") + "_" + (("0" + index).slice(-2)) + ".json";
		let filePath = path + dir + "/" + fileName;
		let url = ENDPOINT + "?q=" + finalQuery + "&per_page=100&page=" + index;
		let bool = await handleRequest(url, filePath, fileName, mode);
		if (!bool) return false;
	}
	return true;
}


/*** 	A sub-function : Allows to handle the query request one by one ***/
const handleRequest = async (url, path, fileName, mode) => {
	try {
		let response = await axios.get(url);
		fs.writeFile(path, JSON.stringify(response.data, null, 4), (err) => {
		   	if (err) throw err;
		   	if (mode == 2)
		   		console.log("(+) File '" + fileName + "' saved succefully !");
		});
		return true;

	} catch (err) {
		console.log(err);
		return false;
	}
};


/*** 	A utility function : Allows to get the next day of a given date (Format: YYYY-MM-DD) ***/
function nextDay(currentDay, days) {
	let nextDay = moment(currentDay, "YYYY-MM-DD");
	nextDay.add(days, "days");
	nextDay = nextDay.format("YYYY-MM-DD");
	if (nextDay.localeCompare(currentDay) == 0) {
		//throw 'The function nextDay returns the same result as the input !';
		return nextDay(currentDay, 2*days);
	}
	return nextDay;
}


/*** 	A utility function : Gets the next hours of a datetime ***/
function nextHours(datetime, hours) {
	let date = moment(datetime);
	let result = date.add(hours, 'hours');
	result = result.format("YYYY-MM-DDTHH:mm:ss");
	if (result.localeCompare(datetime) == 0) {
		//throw 'The function nextHours returns the same result as the input !';
		return nextHours(datetime, 2*hours);
	}
	return result;
}


/*** 	A utility function : Gets the next minutes of a datetime ***/
function nextMinutes(datetime, minutes) {
	let date = moment(datetime);
	let result = date.add(minutes, 'minutes');
	result = result.format("YYYY-MM-DDTHH:mm:ss");
	if (result.localeCompare(datetime) == 0) {
		//throw 'The function nextMinutes returns the same result as the input !';
		return nextMinutes(datetime, 2*minutes);
	}
	return result;
}


/*** 	A utility function : Allows to save the last date as pointer in case of API error ***/
function updatePointer(date, fileName) {
	let timestamp = moment().format();
	// Save the pointer file
    let path = fileName + '.csv';
    let writer = csvWriter();
    if (!fs.existsSync(path))
    	writer = csvWriter({ headers: ["timestamp", "datetime"]});
    else
    	writer = csvWriter({sendHeaders: false});
    writer.pipe(fs.createWriteStream(path, {flags: 'a'}));
    writer.write({
    	timestamp:timestamp,
        datetime:date,
    });
    writer.end();
    console.log("(!) Pointer File '" + fileName + "' updated !");
}


/*** 	A utility function : Get only the directories in the specified path ***/
function getDirectories(path) {
  	return fs.readdirSync(path).filter(function (file) {
    	return fs.statSync(path + file).isDirectory();
  	});
}


/*** 	A utility function : Get the list of files in the specified path ***/
function getFiles(path) {
	return fs.readdirSync(path);
}


/*** 	A utility function : Allows to verify if a user is a BOT ***/
function isBot(type, login) {
	if (type.localeCompare("Bot") == 0)
		return true;
	return false;
}


/*** 	A utility function : Transform a Map to Object ***/
function mapToObject(map) {
	let obj = {};
	for (let [k, v] of map) {
		obj[k] = v;
	}
	return obj;
}


/*** 	A utility function : Force the server to sleep ***/
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}



/***************** Main Functions *****************/

/*** 	The date picker function : Allows to automatically select the pagination dates for a given query ***/
async function datePicker(query, first_creation_date, last_creation_date, destindation_file, mode) {
	if (mode == 1 || mode == 2)
		console.log(" (i) The period 	: [" + first_creation_date + ", " + last_creation_date + "]");
	let TOTAL_REQUESTS = 0;
	let exit = 0;
	let obj = {
		dates: []
	};
	let initialDate = first_creation_date;
	let finalDate = initialDate;
	while (finalDate.localeCompare(last_creation_date) <= 0) {
		let count = 0;
		let savedCount = 0;
		let savedDate = finalDate;
		while (count < 1000 && finalDate.localeCompare(last_creation_date) <= 0) {
			savedCount = count;
			let finalQuery = query + "+created:" + initialDate + ".." + finalDate;
			let url = ENDPOINT + "?q=" + finalQuery;
			try {		
				let response = await axios.get(url);
				TOTAL_REQUESTS += 1;
				// The API limit is 10 requests per minute (60 sec)
				if (TOTAL_REQUESTS % 10 == 0) {
					if (mode == 2)
						console.log(" (i) Total of requests sent: " + TOTAL_REQUESTS + ", from: " + initialDate + " until: " + finalDate + " ...");
					await sleep(60*1000);
				}
				count = response.data.total_count;
			} catch (error) {
				console.log(error);
				exit = 1;
				updatePointer(finalDate, "date_picker_pointer");
				break;
			}
			if (count <= 1000 || (count > 1000 && savedCount == 0)) {
				savedDate = finalDate;
				finalDate = nextDay(finalDate, 1);
			}
		}
		if (savedCount == 0) {
			savedCount = count;
		}
		let item = [initialDate, savedDate, savedCount];
		obj.dates.push(item);
		if (mode == 2)
			console.log("=> Item saved: " + item);
		initialDate = finalDate;
		if (exit) break;
	}
	fs.writeFile(destindation_file, JSON.stringify(obj, null, 4), (error) => {
		if (error) throw error;
		console.log("(+) Dates file '" + first_creation_date + "_" + last_creation_date + "' saved succefully !");
	});
}


/*** 	The data miner function : Allows to collect PR-related issues from GitHub using the pagination dates ***/
async function dataMiner(query, dates_file_path, destination_folder, mode) {
	let TOTAL_REQUESTS = 0;
	try {
		const data = await fss.readFile(dates_file_path);
		let content = JSON.parse(data);
		for (var i = 0; i < content.dates.length; i++) {
			range = content.dates[i];
			let currDate = range[0];
			let nextDate = range[1];
			let count = range[2];			
			let res = await runQuery(query, currDate, nextDate, count, destination_folder, mode);
			TOTAL_REQUESTS += 10;
			// The API limit is 10 requests per minute (60 sec)
			if (TOTAL_REQUESTS % 10 == 0) {
				if (mode == 2)
					console.log(" (i) Total of requests sent: " + TOTAL_REQUESTS + ". Please wait ...");
				await sleep(60*1000);
			}
			if (!res) {
				updatePointer(currDate, "data_miner_pointer");
				break;
			}
			console.log("(+) Data saved successfully for [" + currDate + ", " + nextDate + "]")
		}
	} catch (err) {
		console.log(err);
	}
}


/*** 	The date fetcher function : Allows to automatically truncate the datetime for days having more than 1000 PRs ***/
async function dateFetcher(query, src_dates, destination_folder, minutes, file_index, mode) {
	let TOTAL_REQUESTS = 0;
	let MIN = minutes;
	let exit = 0;
	let write = false;
	let index = file_index;
	let obj = {
		dates: []
	};
	const data = await fss.readFile(src_dates);
	let content = JSON.parse(data);
	for (var i = 0; i < content.dates.length; i++) {
		let currentDay = content.dates[i][0];
		let initialDate = currentDay + "T00:00:00";
		let nextDate = nextMinutes(initialDate, MIN);
		let finalDate = currentDay + "T23:59:59";
		while (nextDate.localeCompare(finalDate) <= 0) {
			let count = 0;
			let savedCount = 0;
			while (count < 1000 && nextDate.localeCompare(finalDate) <= 0) {
				savedCount = count;
				let finalQuery = query + "+created:" + initialDate + ".." + nextDate;
				let url = ENDPOINT + "?q=" + finalQuery;
				try {		
					let response = await axios.get(url);
					TOTAL_REQUESTS += 1;
					// The API limit is 10 requests per minute (60 sec)
					if (TOTAL_REQUESTS % 10 == 0) {
						if (mode == 2)
							console.log(" (i) Total of requests sent: " + TOTAL_REQUESTS + ", from: " + initialDate + " until: " + nextDate + " ...");
						await sleep(60*1000);
					}
					count = response.data.total_count;
				} catch (error) {
					console.log(error);
					exit = 1;
					updatePointer(nextDate, "date_fetcher_pointer");
					break;
				}
				if (count <= 1000 || (count > 1000 && savedCount == 0)) {
					savedDate = nextDate;
					nextDate = nextMinutes(nextDate, MIN);
					if (nextDate.localeCompare(nextDay(currentDay, 1) + "T00:00:00") == 0) {
						nextDate = finalDate;
					}
				}
			}
			if (savedCount == 0) {
				savedCount = count;
			}
			let item = [initialDate, savedDate, savedCount];
			obj.dates.push(item);
			write = false;
			if (mode == 2)
				console.log("=> Item saved: " + item);
			// Write the file
			if (obj.dates.length == 100) {
				fs.writeFile(destination_folder + "fetched_dates_" + index + ".json", JSON.stringify(obj, null, 4), (error) => {
					if (error) throw error;
					console.log("(+) Fetched dates file " + index + " saved succefully !");
				});
				write = true;
				index += 1;
				obj = {
					dates: []
				};
			}
			// Update the initial date
			initialDate = savedDate.slice(0, -1) + "1";
			if (exit) break;
		}
	}
	if (!write) {
		fs.writeFile(destination_folder + "fetched_dates_" + index + ".json", JSON.stringify(obj, null, 4), (error) => {
			if (error) throw error;
			console.log("(+) Fetched dates file " + index + " saved succefully !");
		});
	}
}


/*** 	The date refetcher function : Allows to automatically truncate the datetime for hours having more than 1000 PRs ***/
async function dateRefetcher(query, src_dates, destination_folder, minutes, file_index, mode) {
	let TOTAL_REQUESTS = 0;
	let MIN = minutes;
	let exit = 0;
	let write = false;
	let index = file_index;
	let obj = {
		dates: []
	};
	const data = await fss.readFile(src_dates);
	let content = JSON.parse(data);
	for (var i = 0; i < content.dates.length; i++) {
		let changed = false;
		let initialDate	= content.dates[i][0];
		let finalDate 	= content.dates[i][1];
		let nextDate 	= nextMinutes(initialDate, MIN).slice(0, -1) + "0";
		if (nextDate.localeCompare(finalDate) > 0 && !changed) {
			nextDate = finalDate;
			changed = true;
		}
		while (nextDate.localeCompare(finalDate) <= 0) {
			let count = 0;
			let savedCount = 0;
			while (count < 1000 && nextDate.localeCompare(finalDate) <= 0) {
				savedCount = count;
				let finalQuery = query + "+created:" + initialDate + ".." + nextDate;
				let url = ENDPOINT + "?q=" + finalQuery;
				try {		
					let response = await axios.get(url);
					TOTAL_REQUESTS += 1;
					// The API limit is 10 requests per minute (60 sec)
					if (TOTAL_REQUESTS % 10 == 0) {
						if (mode == 2)
							console.log(" (i) Total of requests sent: " + TOTAL_REQUESTS + ", from: " + initialDate + " until: " + nextDate + " ...");
						await sleep(60*1000);
					}
					count = response.data.total_count;
				} catch (error) {
					console.log(error);
					exit = 1;
					updatePointer(nextDate, "date_refetcher_pointer");
					break;
				}
				if (count <= 1000 || (count > 1000 && savedCount == 0)) {
					savedDate = nextDate;
					nextDate = nextMinutes(nextDate, MIN);
					if (nextDate.localeCompare(finalDate) > 0 && !changed) {
						nextDate = finalDate;
						changed = true;
					}
				}
			}
			if (savedCount == 0) {
				savedCount = count;
			}
			let item = [initialDate, savedDate, savedCount];
			obj.dates.push(item);
			write = false;
			if (mode == 2)
				console.log("=> Item saved: " + item);
			// Write the file
			if (obj.dates.length == 100) {
				fs.writeFile(destination_folder + "refetched_dates_" + index + ".json", JSON.stringify(obj, null, 4), (error) => {
					if (error) throw error;
					console.log("(+) Refetched dates file " + index + " saved succefully !");
				});
				write = true;
				index += 1;
				obj = {
					dates: []
				};
			}
			// Update the initial date
			initialDate = savedDate.slice(0, -1) + "1";
			if (exit) break;
		}
	}
	if (!write) {
		fs.writeFile(destination_folder + "refetched_dates_" + index + ".json", JSON.stringify(obj, null, 4), (error) => {
			if (error) throw error;
			console.log("(+) Refetched dates file " + index + " saved succefully !");
		});
	}
}


/*** 	The data analyzer function : Allows to read the collected data and summarize some general stats about the number of PRs per state and user  ***/
async function dataAnalyzer(src_folder, destination_folder, filter_bots) {
	let repos = new Set();
	let depen = new Set();
	let results = new Map();
	let users = new Map();
	users.set("User", 0);
	users.set("Bot", {});

	let dir = src_folder;
	let dirs = getDirectories(dir);
	for (var i = 0; i < dirs.length; i++) {
		let currentDir = dirs[i];
		// Read all the JSON files in the current directory
		let filenames = getFiles(dir + currentDir + '/');
		for (var j = 0; j < filenames.length; j++) {
			let src = dir + currentDir + '/' + filenames[j];
			let data = await fss.readFile(src);
			let content = JSON.parse(data);
			// Get info from the content of the current file
			for (var k = 0; k < content.items.length; k++) {
				let item = content.items[k];
				// Perform the filter to skip this iteration
				if (filter_bots && isBot(item.user.type, item.user.login))
					continue;
				// Add the repository to the repos set
				repos.add(item.repository_url);
				// Add the dependency to the depen set
				depen.add(item.title);
				// Get the year + month
				let key = item.created_at.substring(0, 7);
				// Get the state
				let state = item.state;
				// Update the map
				if (!results.has(key)) {
					let stats = {};
					stats[state] = 1;
					results.set(key, stats);
				}
				else {
					let value = results.get(key);
					if (value[state] == undefined) {
						value[state] = 1;
						results.set(key, value);
					}
					else {
						value[state] += 1;
						results.set(key, value);
					}
				}
				// Update the users map
				let user = item.user;
				if (user.type.localeCompare("User") == 0) {
					let val = users.get("User");
					val += 1;
					users.set("User", val);
				} 
				else if (user.type.localeCompare("Bot") == 0) {
					let val = users.get("Bot");
					let username = user.login;
					if (val[username] == undefined) {
						val[username] = 1;
						users.set("Bot", val);
					}
					else {
						val[username] += 1;
						users.set("Bot", val);
					}
				}
			}
		}
	}
	fs.writeFile(destination_folder + 'PR_Distribution_Per_State_Month.json', JSON.stringify(mapToObject(results), null, 4), (error) => {
		if (error) throw error;
		console.log("(+) Stats File saved succefully !");

		console.log("-> Total repositories (Projects) : " + repos.size);
		console.log("-> Total dependency updates (PR Titles) : " + depen.size);
	});

	fs.writeFile(destination_folder + 'PR_Distribution_Per_Author.json', JSON.stringify(mapToObject(users), null, 4), (error) => {
		if (error) throw error;
		console.log("(+) Users File saved succefully !");
	});
}


/*** 	The data summarizer function : Allows to read the collected dataset and provide a summary of the most relevant information through a CSV file  ***/
async function dataSummarizer(src_folder, destination_folder, filter_bots) {
    let dir = src_folder;
	let dirs = getDirectories(dir);
	for (var i = 0; i < dirs.length; i++) {
		let currentDir = dirs[i];
		// Read all the JSON files in the current directory
		let filenames = getFiles(dir + currentDir + '/');
		for (var j = 0; j < filenames.length; j++) {
			let src = dir + currentDir + '/' + filenames[j];
			let data = await fss.readFile(src);
			let content = JSON.parse(data);
			// Get info from the content of the current file
			for (var k = 0; k < content.items.length; k++) {
				let item = content.items[k];
				// Perform the filter to skip this iteration
				if (filter_bots && isBot(item.user.type, item.user.login))
					continue;
				// Get all the useful information for each item
				let url = item.html_url;
                let created_at = item.created_at;
                let updated_at = item.updated_at;
                let merged_at = null;
                let closed_at = null;
                if (item.merged_at != undefined)
                    merged_at = item.merged_at;
                if (item.closed_at != undefined)
                    closed_at = item.closed_at;
                let login = item.user.login + " (" + item.user.type + ")";
                let state = item.state;
                let assignee = null;
                if (item.assignee != null) 
                    assignee = item.assignee.login + " (" + item.assignee.type + ")";
                let assignees = [];
                for (var l = 0; l < item.assignees.length; l++) {
                    assignees.push(item.assignees[l].login + " (" + item.assignees[l].type + ")");
                }
                let labels = [];
                for (var l = 0; l < item.labels.length; l++) {
                    labels.push(item.labels[l].name);
                }
                // Save the information in the CSV File
                let path = destination_folder + 'Summary.csv';
                let writer = csvWriter();
                if (!fs.existsSync(path))
                    writer = csvWriter({ headers: ["url", "created_at", "updated_at", "merged_at", "closed_at",
                    	"login", "state", "assignee", "assignees", "labels"]});
                else
                    writer = csvWriter({sendHeaders: false});
                writer.pipe(fs.createWriteStream(path, {flags: 'a'}));
                writer.write({
                    url:url,
                    created_at:created_at,
                    updated_at:updated_at,
                    merged_at:merged_at,
                    closed_at:closed_at,
                    login:login,
                    state:state,
                    assignee:assignee,
                    assignees:assignees,
                    labels:labels
                });
                writer.end();
			}
		}
	}
    console.log("(+) All information saved in CSV file successfully !");
}


/*** 	The get users function : Allows to extract the list of users who created the PRs in dataset ***/
async function getUsers(src_folder, destination_folder, filter_bots) {
	let dir = src_folder;
	let dirs = getDirectories(dir);
	for (var i = 0; i < dirs.length; i++) {
		let currentDir = dirs[i];
		// Read all the JSON files in the current directory
		let filenames = getFiles(dir + currentDir + '/');
		for (var j = 0; j < filenames.length; j++) {
			let src = dir + currentDir + '/' + filenames[j];
			let data = await fss.readFile(src);
			let content = JSON.parse(data);
			// Get info from the content of the current file
			for (var k = 0; k < content.items.length; k++) {
				let item = content.items[k];
				// Perform the filter to skip this iteration
				if (filter_bots && isBot(item.user.type, item.user.login))
					continue;

				// Get all the useful information for each item
                let login = item.user.login;
                
                // Save the information in the CSV File
                let path = destination_folder + 'Users.csv';
                let writer = csvWriter();
                if (!fs.existsSync(path))
                    writer = csvWriter({ headers: ["author"]});
                else
                    writer = csvWriter({sendHeaders: false});
                writer.pipe(fs.createWriteStream(path, {flags: 'a'}));
                writer.write({
                    author:login
                });
                writer.end();
			}
		}
	}
    console.log("(+) Users input saved in CSV file successfully !");
}


/*** 	The get pull requests function : Allows to extract pull request identifier : 'Repository Owner', 'Repository Name', 'Number of PR' ***/
async function getPulls(src_folder, destination_folder, filter_bots) {
	let dir = src_folder;
	let dirs = getDirectories(dir);
	for (var i = 0; i < dirs.length; i++) {
		let currentDir = dirs[i];
		// Read all the JSON files in the current directory
		let filenames = getFiles(dir + currentDir + '/');
		for (var j = 0; j < filenames.length; j++) {
			let src = dir + currentDir + '/' + filenames[j];
			let data = await fss.readFile(src);
			let content = JSON.parse(data);
			// Get info from the content of the current file
			for (var k = 0; k < content.items.length; k++) {
				let item = content.items[k];
				// Perform the filter to skip this iteration
				if (filter_bots && isBot(item.user.type, item.user.login))
					continue;

				// Get all the useful information for each item
				let pull_url = item.pull_request.url.split("/");
                let owner = pull_url[pull_url.length - 4];
                let repo = pull_url[pull_url.length - 3];
                let pull_number = pull_url[pull_url.length - 1];
                
                // Save the information in the CSV File
                let path = destination_folder + 'PRs.csv';
                let writer = csvWriter();
                if (!fs.existsSync(path))
                    writer = csvWriter({ headers: ["owner", "repo", "number"]});
                else
                    writer = csvWriter({sendHeaders: false});
                writer.pipe(fs.createWriteStream(path, {flags: 'a'}));
                writer.write({
                    owner:owner,
                    repo:repo,
                    number:pull_number
                });
                writer.end();
			}
		}
	}
    console.log("(+) Pull Requests input saved in CSV file successfully !");
}



/***************** Exported Functions *****************/


async function seachSampling(query, ranges, destination_folder, mode) {
	console.log("________________________________________________________________");
	console.log("*************** Search Sampling Process Launched ***************");
	console.log("________________________________________________________________");
	if (mode == 1 || mode == 2)
		console.log(" (i) For the query : " + decodeURIComponent(query));
	for (var i = 0; i < ranges.length; i++) {
		let initDate 	= ranges[i][0];
		let finalDate 	= ranges[i][1];
		let destFile 	= destination_folder + initDate + '_' + finalDate + '.json';
		await datePicker(query, initDate, finalDate, destFile, mode);
		await sleep(60*1000);
	}
}

async function outlierFiltering(src_dates_folder, destination_folder, step) {
	console.log("__________________________________________________________________");
	console.log("*************** Outlier Filtering Process Launched ***************");
	console.log("__________________________________________________________________");
	let obj = {
		dates: []
	};
	let filenames = getFiles(src_dates_folder);
	for (var i = 0; i < filenames.length; i++) {
		let objOld = {
			dates: []
		};
		let srcDates = src_dates_folder + filenames[i];
		if (!srcDates.endsWith(".json")) {
			continue;
		}
		const data = await fss.readFile(srcDates);
		let content = JSON.parse(data);
		content.dates.forEach(range => {
			if (range[2] > 1000) {
				obj.dates.push(range);
			}
			else {
				objOld.dates.push(range);
			}
		});
		fs.writeFile(srcDates, JSON.stringify(objOld, null, 4), (error) => {
			if (error) throw error;
			console.log("(+) Dates file '" + filenames[i] + "' updated succefully !");
		});
	}
	fs.writeFile(destination_folder + 'large_dates_' + step + '.json', JSON.stringify(obj, null, 4), (error) => {
		if (error) throw error;
		console.log("(+) Large Dates file for step (" + step + ") saved succefully !");
	});
}

async function queryAdjustment(query, src_dates_file, destination_folder, minutes, file_index, mode) {
	console.log("_________________________________________________________________");
	console.log("*************** Query Adjustment Process Launched ***************");
	console.log("_________________________________________________________________");
	if (mode == 1 || mode == 2)
		console.log(" (i) For the query : " + decodeURIComponent(query));
	dateFetcher(query, src_dates_file, destination_folder, minutes, file_index, mode);
}

async function queryReadjustment(query, src_dates_file, destination_folder, minutes, file_index, mode) {
	console.log("___________________________________________________________________");
	console.log("*************** Query Readjustment Process Launched ***************");
	console.log("___________________________________________________________________");
	if (mode == 1 || mode == 2)
		console.log(" (i) For the query : " + decodeURIComponent(query));
	dateRefetcher(query, src_dates_file, destination_folder, minutes, file_index, mode);
}

async function issuesCollection(query, src_dates_folder, destination_folder, mode) {
	console.log("__________________________________________________________________");
	console.log("*************** Issues Collection Process Launched ***************");
	console.log("__________________________________________________________________");
	if (mode == 1 || mode == 2)
		console.log(" (i) For the query : " + decodeURIComponent(query));
	let filenames = getFiles(src_dates_folder);
	for (var i = 0; i < filenames.length; i++) {
		let srcDates = src_dates_folder + filenames[i];
		if (!srcDates.endsWith(".json")) {
			continue;
		}
		await dataMiner(query, srcDates, destination_folder, mode);
		await sleep(60*1000);
	}
}


async function dataAnalysis(src_folder, destination_folder, filter_bots) {
	console.log("_____________________________________________");
	console.log("*************** Data Analysis ***************");
	console.log("_____________________________________________");
	dataAnalyzer(src_folder, destination_folder, filter_bots);
}


async function dataSummary(src_folder, destination_folder, filter_bots) {
	console.log("____________________________________________");
	console.log("*************** Data Summary ***************");
	console.log("____________________________________________");
	dataSummarizer(src_folder, destination_folder, filter_bots);
}


async function extractUsers(src_folder, destination_folder, filter_bots) {
	console.log("____________________________________________________");
	console.log("*************** User Data Extraction ***************");
	console.log("____________________________________________________");
	getUsers(src_folder, destination_folder, filter_bots);
}


async function extractPulls(src_folder, destination_folder, filter_bots) {
	console.log("____________________________________________________________");
	console.log("*************** Pull Request Data Extraction ***************");
	console.log("____________________________________________________________");
	getPulls(src_folder, destination_folder, filter_bots);
}




/*************************************
	Exporting the visible operations :
**************************************/

module.exports.seachSampling 		= seachSampling;
module.exports.outlierFiltering 	= outlierFiltering;
module.exports.queryAdjustment 		= queryAdjustment;
module.exports.queryReadjustment 	= queryReadjustment;
module.exports.issuesCollection 	= issuesCollection;
module.exports.dataAnalysis 		= dataAnalysis;
module.exports.dataSummary 			= dataSummary;
module.exports.extractUsers 		= extractUsers;
module.exports.extractPulls 		= extractPulls;


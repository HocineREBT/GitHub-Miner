## Issues Collection Pipeline
The pipeline should be run as follows :

![Issues Collection Pipeline](Issues-Collection-Process.png?raw=true)

## Documentation
We describe the function and the parameters for each method :

### 1. Search Sampling
This method allows to automatically select the pagination for creation dates for a given query.
- `query` : The search query as used by the GitHub API Search.
- `ranges` : An array that contains the ranges for the initial and final date of running a query. Allows to perform the execution step by step (recommanded to be each year).
- `destination_folder` : The destination path to the folder containing the results.
- `mode` : A indicator of the execution log mode. The values are : "0" for minimal info display, "1" for medium, and "2" for all info display.

> Execution time : proportionate to the number of days in ranges. Requires 1 min for each 10 days.

### 2. Outlier Filtering
This method allows to perform a filter to exclude entries that contain more than 1000 search results (pull requests) for a time period.
- `src_dates_folder` : The source path to the folder containing the files with initial and final creation dates.
- `destination_folder` : The destination path to the folder containing the results.
- `step` : An integer value that represents the current step in which dates are being filtered.

> Execution time : proportionate to the number of entries in each file. However, the execution time is negligeable.

### 3. Query Adjustment
This method allows to automatically truncate the datetime for days having more than 1000 search results (pull requests).
- `query` : The search query as used by the GitHub API Search.
- `src_dates_file` : The source path to the file containing the dates that needs to be truncated.
- `destination_folder` : The destination path to the folder containing the results.
- `minutes` : The duration in minutes that needs to be considered between the initial and final creation date.
- `file_index` : The starting index for the resulting files.
- `mode` : A indicator of the execution log mode. The values are : "0" for minimal info display, "1" for medium, and "2" for all info display.

> Execution time : proportionate to the number of entries in the source file and the duration. Requires 1 min for each 10 queries.

### 4. Query Readjustment
This method allows to automatically truncate the datetime for hours (after first fetching operation) having more than 1000 search results (pull requests).
- `query` : The search query as used by the GitHub API Search.
- `src_dates_file` : The source path to the file containing the dates that needs to be truncated.
- `destination_folder` : The destination path to the folder containing the results.
- `minutes` : The duration in minutes that needs to be considered between the initial and final creation date.
- `file_index` : The starting index for the resulting files.
- `mode` : A indicator of the execution log mode. The values are : "0" for minimal info display, "1" for medium, and "2" for all info display.

> Execution time : proportionate to the number of entries in the source file and the duration. Requires 1 min for each 10 queries.

### 5. Issues Collection
This method allows to mine and collect pull requests from GitHub using the pagination dates.
- `query` : The search query as used by the GitHub API Search.
- `src_dates_folder` : The source path to the folder containing the files with initial and final creation dates.
- `destination_folder` : The destination path to the folder containing the results.
- `mode` : A indicator of the execution log mode. The values are : "0" for minimal info display, "1" for medium, and "2" for all info display.

> Execution time : Theoretically, proportionate to the total results of the search query. Requires 1 min for each 1000 results. In practice, proportionate to the number of entries in every file in the source folder. Requires 1 min for each 1 entry.


### 6. Data Analysis
This method allows to read the collected dataset and provide some statistics about the number of PRs per state and per user.
- `src_folder` : The source path to the folder containing the dataset.
- `destination_folder` : The destination path to the folder containing the results.
- `filter_bots` : A boolean to determine whether to filter out *Bot* users or not.

> Execution time : proportionate to the size of the dataset and relative to the IO operations.

### 7. Data Summary
This method allows to read the collected dataset and provide a summary of the most relevant information in the dataset through a CSV file.
- `src_folder` : The source path to the folder containing the dataset.
- `destination_folder` : The destination path to the folder containing the results.
- `filter_bots` : A boolean to determine whether to filter out *Bot* users or not.

> Execution time : proportionate to the size of the dataset and relative to the IO operations.

### 8. Extract Users
This method allows to extract the list of users who created the PRs in the dataset.
- `src_folder` : The source path to the folder containing the dataset.
- `destination_folder` : The destination path to the folder containing the results.
- `filter_bots` : A boolean to determine whether to filter out *Bot* users or not.

> Execution time : proportionate to the size of the dataset and relative to the IO operations.

### 9. Extract Pulls
This method allows to extract pull request identifier : as ['Repository Owner', 'Repository Name', 'Pull Request Number'].
- `src_folder` : The source path to the folder containing the dataset.
- `destination_folder` : The destination path to the folder containing the results.
- `filter_bots` : A boolean to determine whether to filter out *Bot* users or not.

> Execution time : proportionate to the size of the dataset and relative to the IO operations.

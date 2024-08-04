# GitHub-Miner
In this repository, we host the artefacts of our data collection pipeline GitHub-Miner for our study: **_Dependabot and Security Pull Requests: Large Empirical Study_** ([Link](https://rdcu.be/dPwfw)).
The pipeline allows to mine and collect pull request-related issues using the GitHub Search API. Then, extract data related to users, repositories, pull requests, and commits.

## Citation
This pipeline is the work of the Empirical Software Engineering journal paper "_Dependabot and security pull requests: large empirical study_":

> Rebatchi, Hocine, Tégawendé F. Bissyandé, and Naouel Moha. “Dependabot and Security Pull Requests: Large Empirical Study.” Empirical Software Engineering 29, no. 5 (July 30, 2024): 128. https://doi.org/10.1007/s10664-024-10523-y.


## Execution
The execution of the GitHub-Miner pipeline should go through the following steps:

![GitHub-Miner Pipeline](GitHub-Miner-Process.png?raw=true)


## Example
- An example for the **Issues Collection** process execution as well as the resulting data is provided [Here](Issues-Collection/Example/Example.js)
- Also, an example for the **Data Extraction** process execution and the resulting data is provided [Here](Data-Extraction/DataExtractor.ipynb)

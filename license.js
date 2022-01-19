/*
 * Copyright 2021 ZUP IT SERVICOS EM TECNOLOGIA E INOVACAO SA
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const core = require('@actions/core')
const github = require('@actions/github')
const fs = require("fs");
const util = require("util");
const chalk = require("chalk");

function getRequiredDateLicenseText(startDateLicense) {
    const currentYear = new Date().getFullYear()
    if (startDateLicense < currentYear) {
        return  `Copyright ${startDateLicense}, ${currentYear}`
    }
    return `Copyright ${startDateLicense}`
}
function hasCorrectCopyrightDate(copyrightFile, startDateLicense) {
    const  requiredDateText = getRequiredDateLicenseText(startDateLicense)
    return copyrightFile.includes(requiredDateText)
}

async function openFile(name) {
    return await new Promise(
        (resolve,reject) => {
            fs.open(name, 'r', (error, fd) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(fd)
                }
            })
        })
}

function checkLineOnFile(line, copyrightFile, fileName) {
    if (!copyrightFile.includes(line)) {
        console.log('File '+chalk.yellow(fileName+": ") + chalk.red(`Missing or Misspelling  the required text: "${line}" `))
        return false
    }
    return true
}

async function checkLicenseFile(fileName, config, fd) {
    let buffer = Buffer.alloc(8000)
    return await new Promise(
        (resolve, reject) => {
            fs.read(fd, buffer, 0, 8000, 0, (err) => {
                if (err) {
                    console.error(`Error reading file ${err}`)
                }
                const copyrightFile = buffer.toString('utf-8')
                const allCopyrightIncluded = config.copyrightContent.every(
                    line => checkLineOnFile(line, copyrightFile, fileName)
                )

                if (!allCopyrightIncluded) {
                    console.log('File '+chalk.yellow(fileName+": ") + chalk.red('Wrong license header!'))
                    reject(fileName)
                } else {

                    const correctDate = hasCorrectCopyrightDate(copyrightFile, config.startDateLicense)
                    if (correctDate) {
                        console.log('File ' + chalk.yellow(fileName+": ") + chalk.green('ok!'))
                        resolve()
                    } else {
                        const requiredDateMessage = `Fix license header date! Expected "${getRequiredDateLicenseText(config.startDateLicense)}"`
                        console.log('File '+ chalk.yellow(fileName+": ")+ chalk.red(requiredDateMessage))
                        reject(fileName)
                    }
                }
            })
        })
    }

async function checkFilesLicense(filesPr, config) {
    let errors = []
    for ( let file of filesPr) {
        const fd = await openFile(file)
        try{
            await checkLicenseFile(file, config, fd)
        } catch (error) {
            errors.push(error)
        }
    }
    if (errors.length) {
        return({
            title: `Quantity of files with copyright errors: ${errors.length}`,
            details: `Files : ${util.inspect(errors)}`
        })
    }
}

function removeIgnoredFiles(filesPr, fileNames) {
    return filesPr.filter( filePr => {
        const isIgnored = !fileNames.includes(filePr)
        if (isIgnored) {
            console.log('File: ' + chalk.yellow(filePr+": ") + chalk.green('ignored!'))
            return false
        }
        return true
    }
    )
}

const checkLicense = async (fileNames, config) => {
    const token = core.getInput('token') || process.env.TOKEN
    const octokit = github.getOctokit(token)
    const prNumber = github.context.payload.pull_request.number
    const owner = github.context.payload.repository.owner.login
    const repo = github.context.payload.repository.name
     config = {
        ...config,
        owner: owner,
        repo: repo,
       octokit: octokit
    }

    const responsePr = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', ({
        owner: config.owner,
        repo: config.repo,
        pull_number: prNumber
    }))

    const responseCompare = await octokit.request('GET /repos/{owner}/{repo}/compare/{basehead}', {
        owner: config.owner,
        repo: config.repo,
        basehead: `${responsePr.data.base.sha}...${responsePr.data.head.sha}`
    })

    const prFilesName = responseCompare.data.files.map(it => {
        return it.filename
    })
    const filesFiltered = removeIgnoredFiles(prFilesName, fileNames)
    return await checkFilesLicense(filesFiltered, config)

}


exports.checkLicense = checkLicense
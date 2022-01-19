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
const core = require("@actions/core");
const fs = require("fs");

const readFile = (fileName) => {
        if (!fs.existsSync(fileName)) {
            console.log("Config file not found");
            core.setFailed('Action failed');
            return
        }
        return fs.readFileSync(fileName, 'utf-8');
}

const checkBOMInJSON = (stringFile) => {
    if (stringFile.charCodeAt(0) === 0xFEFF) {
        return stringFile.slice(1);
    }
    return stringFile
}
const readAndValidateConfigFile = (fileName) => {
    const fileData = readFile(fileName)
    if (!fileData) {
        const errorMsg = `Missing ${fileName}`
        core.setFailed(errorMsg)
        throw new Error()
    }
    const fileFiltered = checkBOMInJSON(fileData)
    let dataObject = JSON.parse(fileFiltered)
    if (!dataObject.copyright || !dataObject.startDateLicense) {
        const errorMsg = "Missing copyright or startDateLicense entry on config file. Check your config.json."
        core.setFailed(errorMsg)
        throw new Error()
    }
    return dataObject
}
module.exports = {
    readFile, checkBOMInJSON, readAndValidateConfigFile
}



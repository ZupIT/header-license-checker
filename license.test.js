const nock = require('nock')
const {checkLicense} = require("./license");
const fs = require('fs')
const path = require('path')
const os = require('os')
const {readAndValidateConfigFile} = require("./file");
const core = require('@actions/core')
const github = require('@actions/github')

function setTestInput(name, value) {
        process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`]=value;
}



describe('when checking license ',  () => {
    beforeEach(() => {
        nock('https://api.github.com')
            .get('/repos/test-org/test-repo/pulls/1')
            .reply(200, {
                "number":1,
                "state":"closed",
                "locked":false,
                "title":"Update README.md",
                "head": {
                    "label": "ZupIT:thallesfreitaszup-patch-1",
                    "ref": "thallesfreitaszup-patch-1",
                    "sha": "8e10d4b4d911000fcdbd3b852a35233b90dc7474",
                },
                "base":{
                    "label":"ZupIT:main",
                    "ref":"main",
                    "sha":"c80f870b21e9ba36bb35f11c77ac068a40ae5e45",
                }
            })
        nock('https://api.github.com')
            .get('/repos/test-org/test-repo/compare/c80f870b21e9ba36bb35f11c77ac068a40ae5e45...8e10d4b4d911000fcdbd3b852a35233b90dc7474')
            .reply(200, {
                "files": [
                    {
                        "sha": "a1a0173f1e58265b6a3a2237f09e197bb63c24f8",
                        "filename": "/tmp/test.txt",
                        "status": "modified",
                        "additions": 1,
                        "deletions": 1,
                        "changes": 2,
                        "blob_url": "https://github.com/ZupIT/header-license-checker/blob/8e10d4b4d911000fcdbd3b852a35233b90dc7474/README.md",
                        "raw_url": "https://github.com/ZupIT/header-license-checker/raw/8e10d4b4d911000fcdbd3b852a35233b90dc7474/README.md",
                        "contents_url": "https://api.github.com/repos/ZupIT/header-license-checker/contents/README.md?ref=8e10d4b4d911000fcdbd3b852a35233b90dc7474",
                        "patch": "@@ -1,4 +1,4 @@\n-# actions-license\n+# header-license-checker\n This action checks the license headers in the files of  pull requests.\n Inspired on [Deno License Checker]\n "
                    }
                ]
            })
    })
    afterEach( () => {
        removeTestFile()
    })
    it("should return error when license date of file it's outdated", async () => {
        const configJsonPath = createConfigJson()
        const fileName  = createTestFileWithLicenseDateOutdated()
        const arrayFilesErrors = [fileName]
        const config = readAndValidateConfigFile(configJsonPath)
        setTestInput("token", "dummy-token")

        github.context.payload  = {
            pull_request : {
                number : 1
            },
            repository: {
                owner : {
                    login :'test-org'
                },
                name: 'test-repo'
            }
        }

        const errors = await checkLicense([fileName], {startDateLicense: config.startDateLicense, copyrightContent: config.copyright})
        expect((errors.title)).toEqual('Quantity of files with copyright errors: 1')
        expect((errors.details)).toEqual(`Files : [ '${fileName}' ]`)
    })

    it("should return error when file has a misspelling license header", async () => {
        const configJsonPath = createConfigJson()
        const fileName  = createTestFileWithMisspellingLicense()
        const config = readAndValidateConfigFile(configJsonPath)
        setTestInput("token", "dummy-token")

        github.context.payload  = {
            pull_request : {
                number : 1
            },
            repository: {
                owner : {
                    login :'test-org'
                },
                name: 'test-repo'
            }
        }

        const errors = await checkLicense([fileName], {startDateLicense: config.startDateLicense, copyrightContent: config.copyright})
        expect((errors.title)).toEqual('Quantity of files with copyright errors: 1')
        expect((errors.details)).toEqual(`Files : [ '${fileName}' ]`)
    })

    it("should not return error when license date of files is updated", async () => {
        const configJsonPath = createConfigJson()
        const fileName  = createTestFileWithLicenseDateUpdated()
        const arrayFilesErrors = []
        const config = readAndValidateConfigFile(configJsonPath)
        setTestInput("token", "dummy-token")

        github.context.payload  = {
            pull_request : {
                number : 1
            },
            repository: {
                owner : {
                    login :'test-org'
                },
                name: 'test-repo'
            }
        }
       const errors = await checkLicense([fileName], {startDateLicense: config.startDateLicense, copyrightContent: config.copyright})
        expect(errors).toBeUndefined()
    })


})

function createTestFileWithLicenseDateOutdated() {
    const dateFile = new Date().getFullYear()-1
    const data = `
        * Copyright ${dateFile} ZUP IT SERVICOS EM TECNOLOGIA E INOVACAO SA
        *
        * Licensed under the Apache License, Version 2.0 (the \"License\");
        * you may not use this file except in compliance with the License.
        * You may obtain a copy of the License at
        *
        *     http://www.apache.org/licenses/LICENSE-2.0
        *
        * Unless required by applicable law or agreed to in writing, software
        * distributed under the License is distributed on an \"AS IS\" BASIS,
        * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
        * See the License for the specific language governing permissions and
        * limitations under the License.
        * `
    const path = "/tmp/test.txt"
    fs.writeFileSync(path, data)
    return path;
}

function createTestFileWithMisspellingLicense() {
    const dateFile = new Date().getFullYear()-1
    const data = `
        * Copiright ${dateFile} ZUP IT SERVICOS EM TECNOLOGIA E INOVACAO SA
        *
        * Licensed under the Apache License, Version 2.0 (the \"License\");
        * you may not use this file except in compliance with the License.
        * You may obtain a copy of the License at
        *
        *     http://www.apache.org/licenses/LICENSE-2.0
        *
        * Unless required by applicable law or agreed to in writing, software
        * distributed under the License is distributed on an \"AS IS\" BASIS,
        * WITHOUT WARRANTIES OR CONDITIONSdada OF ANY KIND, either express or implied.
        * See the License for the specific language governing permissions and
        * limitations under the License.
        * `
    const path = "/tmp/test.txt"
    fs.writeFileSync(path, data)
    return path;
}

function createTestFileWithLicenseDateUpdated() {
    const dateFile = new Date().getFullYear()
    const data = `
        * Copyright ${dateFile} ZUP IT SERVICOS EM TECNOLOGIA E INOVACAO SA
        *
        * Licensed under the Apache License, Version 2.0 (the \"License\");
        * you may not use this file except in compliance with the License.
        * You may obtain a copy of the License at
        *
        *     http://www.apache.org/licenses/LICENSE-2.0
        *
        * Unless required by applicable law or agreed to in writing, software
        * distributed under the License is distributed on an \"AS IS\" BASIS,
        * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
        * See the License for the specific language governing permissions and
        * limitations under the License.
        * `
    const path = "/tmp/test.txt"
    fs.writeFileSync(path, data)
    return path;
}

function removeTestFile() {
    fs.unlink('/tmp/test.txt', (err) => {
        if (err) throw err;
    });
}
function createConfigJson() {
    const currentYear = new Date().getFullYear()
    const path = "/tmp/config.json"
    const data = `{
  "copyright": [
    "Copyright",
    "ZUP IT SERVICOS EM TECNOLOGIA E INOVACAO SA",
    "Licensed under the Apache License, Version 2.0 (the \\"License\\");",
    "you may not use this file except in compliance with the License.",
    "You may obtain a copy of the License at",
    "http://www.apache.org/licenses/LICENSE-2.0",
    "Unless required by applicable law or agreed to in writing, software",
    "distributed under the License is distributed on an \\"AS IS\\" BASIS,",
    "WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.",
    "See the License for the specific language governing permissions and",
    "limitations under the License."
  ],
  "ignore": [],
  "startDateLicense": ${currentYear}
}`
    fs.writeFileSync(path, data)
    return path
}

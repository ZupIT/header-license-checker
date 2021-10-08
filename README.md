# actions-license
This action checks the license headers in the files of  pull requests.
Inspired on [Deno License Checker]

# Usage

Create a `config.json` like the following:

```
"copyright": [
    "Copyright",
    "Licensed under the **, Version 2.0 (the \"License\");", // Put your license here in a array format
  ],
  "ignore": [
    "node_modules/**", //Put the file pattern you want to ignore on the check
    "**.md",
    "**.json",
    "**.png",
    "**.idea",
    ".github",
    ".git",
    ".gitignore",
    ".vscode",
    "coverage/**",
    "upgrades/**",
    "**.svg"
  ],
``` 

Add on your github workflow:

```
steps:
      - uses: actions/checkout@v2
      - name: Check License and license year on prs
        uses: ZupIT/header-license-checker@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
        env:
          FORCE_COLOR: 3

``` 


If you don't want to ignore dot files on the analysis, use this configuration:

```
steps:
      - uses: actions/checkout@v2
      - name: Check License and license year on prs
        uses: ZupIT/header-license-checker@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          ignoreDotFiles: "true"
          
        env:
          FORCE_COLOR: 3
          

``` 
[Deno license checker]: https://github.com/kt3k/deno_license_checker
  

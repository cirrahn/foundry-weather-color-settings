import fs from "fs";
import path from "path";

export class RollupManifestBuilder {
	static getPlugin (systemPath) {
		return {
			name: "buildManifest",

			generateBundle () {
				const packageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));

				const manifestJson = {
					"id": packageJson.name,
					"title": "Weather Color Settings",
					"description": `Add weather color customization options to your scenes!`,
					"version": packageJson.version,
					"authors": [
						{
							"name": "cirrahn",
							"url": "https://www.patreon.com/cirrahn",
							"discord": "Murray#3081",
							"flags": {
								"patreon": "cirrahn",
								"github": "cirrahn"
							}
						}
					],
					"keywords": [
						"visuals"
					],
					"languages": [
						{
							"lang": "en",
							"name": "English",
							"path": "lang/en.json"
						}
					],
					"readme": "README.md",
					"license": "MIT",
					"manifest": `https://github.com/cirrahn/foundry-${packageJson.name}/releases/latest/download/module.json`,
					"download": `https://github.com/cirrahn/foundry-${packageJson.name}/releases/download/v${packageJson.version}/${packageJson.name}.zip`,
					"changelog": `https://raw.githubusercontent.com/cirrahn/foundry-${packageJson.name}/main/CHANGELOG.md`,

					"compatibility": {
						"minimum": "11",
						"verified": "11.300"
					},
					"esmodules": [
						"module.js"
					],
					"styles": [
						"css/main.css"
					],
					"relationships": {
						"requires": [
							{
								"id": "lib-wrapper",
								"type": "module",
							}
						]
					},
				}

				fs.writeFileSync(path.join(systemPath, "module.json"), JSON.stringify(manifestJson, null, "\t"), "utf-8");
			},
		};
	}
}

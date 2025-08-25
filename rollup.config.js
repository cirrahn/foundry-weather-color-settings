import * as fs from "fs";
import * as path from "path";
import copy from "rollup-plugin-copy";
import scss from "rollup-plugin-scss";
import {getBuildPath} from "./foundry-path.js";
import {RollupManifestBuilder} from "./build/rollup-plugin-manifest-builder.js";

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));

const systemPath = getBuildPath(packageJson.name);

console.log(`Bundling to ${systemPath}`);

export default {
	input: ["module/js/Main.js"],
	output: {
		file: path.join(systemPath, "module.js"),
	},
	plugins: [
		RollupManifestBuilder.getPlugin(systemPath),
		scss({fileName: "css/main.css"}),
		copy({
			targets: [
				{src: "module/lang/*", dest: path.join(systemPath, "lang")},
			],
		}),
	],
	onwarn (warning, warn) {
		// suppress eval warnings
		if (warning.code === "EVAL") return;
		warn(warning);
	},
};

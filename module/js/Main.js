import "../scss/main.scss";

class Consts {
	static MODULE_ID = "weather-color-settings";
}

class WeatherColorManager {
	static _FLAGS = [
		{name: "Fog Color", flag: "color-fog"},
		{name: "Rain Color", flag: "color-rain"},
		{name: "Snow Color", flag: "color-snow"},
	];

	static _FLAG_PREFIX = `flags.${Consts.MODULE_ID}`;

	/* -------------------------------------------- */

	static _TEMP_VALUES = {};

	static _resetScenePreview () {
		return !!Object.keys(this._TEMP_VALUES)
			.filter(k => this._TEMP_VALUES[k])
			.map(k => delete this._TEMP_VALUES[k]).length;
	}

	/* -------------------------------------------- */

	static bindHooks () {
		Hooks.on("init", this._onHook_init.bind(this));
		Hooks.on("renderSceneConfig", this._onHook_renderSceneConfig.bind(this));
	}

	/* -------------------------------------------- */

	static _onHook_init () {
		this._onHook_init_Scene();
		this._onHook_init_SceneConfig();
		this._onHook_init_fragmentShader();
	}

	static _onHook_init_Scene () {
		libWrapper.register(
			Consts.MODULE_ID,
			`Scene.prototype._onUpdate`,
			(fn, ...args) => {
				const out = fn(...args);
				const [data] = args;
				if (Object.keys(foundry.utils.flattenObject(data)).some(k => k.startsWith(this._FLAG_PREFIX))) canvas.weather.draw();
				return out;
			},
			"WRAPPER",
		);
	}

	static _onHook_init_SceneConfig () {
		const setTempVal = (k, v) => {
			this._TEMP_VALUES[k.slice(this._FLAG_PREFIX.length + 1)] = v;
		};

		libWrapper.register(
			Consts.MODULE_ID,
			`foundry.applications.sheets.SceneConfig.prototype._onChangeForm`,
			(fn, ...args) => {
				const [, evt] = args;
				if (evt.target.name?.startsWith(this._FLAG_PREFIX)) setTempVal(evt.target.name, evt.target.value);
				if (evt.target.dataset?.edit?.startsWith(this._FLAG_PREFIX)) setTempVal(evt.target.dataset.edit, evt.target.value);
				return fn(...args);
			},
			"WRAPPER",
		);

		libWrapper.register(
			Consts.MODULE_ID,
			`foundry.applications.sheets.SceneConfig.prototype._previewScene`,
			(fn, ...args) => {
				const out = fn(...args);
				const [changed] = args;
				if (!changed) return out;
				if (changed.startsWith(this._FLAG_PREFIX)) canvas.weather.draw();
				return out;
			},
			"WRAPPER",
		);

		libWrapper.register(
			Consts.MODULE_ID,
			`foundry.applications.sheets.SceneConfig.prototype._processSubmitData`,
			async (fn, ...args) => {
				this._resetScenePreview();
				return fn(...args);
			},
			"WRAPPER",
		);

		libWrapper.register(
			Consts.MODULE_ID,
			`foundry.applications.sheets.SceneConfig.prototype.close`,
			async (fn, ...args) => {
				if (this._resetScenePreview()) canvas.weather.draw();
				return fn(...args);
			},
			"WRAPPER",
		);
	}

	static _onHook_init_fragmentShader () {
		libWrapper.register(
			Consts.MODULE_ID,
			`foundry.canvas.rendering.shaders.FogShader.fragmentShader`,
			(fn, ...args) => {
				const out = fn(...args);
				const colorRaw = this._TEMP_VALUES["color-fog"] ?? canvas.scene.getFlag(Consts.MODULE_ID, "color-fog");
				if (!colorRaw) return out;

				const color = foundry.utils.Color.from(colorRaw);
				return out
					.replace(
						"return vec3(0.9, 0.85, 1.0) * mist;",
						`return vec3(${color.r}, ${color.g}, ${color.b}) * mist;`,
					);
			},
			"WRAPPER",
		);

		// Can't use libWrapper as this is a static property, not a getter
		const RainShader_fragmentShader = foundry.canvas.rendering.shaders.RainShader.fragmentShader;
		Object.defineProperty(foundry.canvas.rendering.shaders.RainShader, "fragmentShader", {
			get () {
				const colorRaw = WeatherColorManager._TEMP_VALUES["color-rain"] ?? canvas.scene.getFlag(Consts.MODULE_ID, "color-rain");
				if (!colorRaw) return RainShader_fragmentShader;

				const color = foundry.utils.Color.from(colorRaw);
				return RainShader_fragmentShader
					.replace(
						"vec4(vec3(computeRain(vUvs, time)) * tint, 1.0) * alpha * mask * opacity",
						`vec4(vec3(computeRain(vUvs, time) * vec3(${color.r}, ${color.g}, ${color.b})) * tint, 1.0) * alpha * mask * opacity`,
					);
			},
		});

		// Can't use libWrapper as this is a static property, not a getter
		const SnowShader_fragmentShader = foundry.canvas.rendering.shaders.SnowShader.fragmentShader;
		Object.defineProperty(foundry.canvas.rendering.shaders.SnowShader, "fragmentShader", {
			get () {
				const colorRaw = WeatherColorManager._TEMP_VALUES["color-snow"] ?? canvas.scene.getFlag(Consts.MODULE_ID, "color-snow");
				if (!colorRaw) return SnowShader_fragmentShader;

				const color = foundry.utils.Color.from(colorRaw);
				return SnowShader_fragmentShader
					.replace(
						"vec4(vec3(accumulation) * tint, 1.0) * mask * alpha",
						`vec4(vec3(accumulation) * vec3(${color.r}, ${color.g}, ${color.b}) * tint, 1.0) * mask * alpha;`,
					);
			},
		});
	}

	/* -------------------------------------------- */

	static _onHook_renderSceneConfig (app, html, options) {
		const $html = $(html);
		const $wrpWeather = $html.find(`select[name="weather"]`).closest(".form-group");

		const $getRowFlag = ({name, flag}) => {
			const flagVal = canvas.scene.getFlag(Consts.MODULE_ID, flag);

			const $picker = $(`<color-picker name="flags.${Consts.MODULE_ID}.${flag}" value="${flagVal || ""}"></color-picker>`);

			return $(`<div class="form-fields weathercl__row-flag"></div>`)
				.append(`<div class="weathercl__lbl-flag">${name}</div>`)
				.append($picker);
		};

		$(`<div class="form-group"></div>`)
			.append($(`<label>Weather Color</label>`))
			.append(
				$(`<div class="flexcol"></div>`)
					.append(this._FLAGS.map($getRowFlag)),
			)
			.append($(`<p class="hint">Adjust the coloration of the active Weather Effect(s).</p>`))
			.insertAfter($wrpWeather);

		app.setPosition({
			width: app.position.width,
			height: "auto",
		});
	}
}

WeatherColorManager.bindHooks();

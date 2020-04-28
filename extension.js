const Main = imports.ui.main;
const Lang = imports.lang;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const Clutter = imports.gi.Clutter;
const ExtensionUtils = imports.misc.extensionUtils;
const Self = ExtensionUtils.getCurrentExtension();
const Convenience = Self.imports.convenience;

const SHORTCUT = 'invert-value-shortcut';

const InvertValueEffect = new Lang.Class({
	Name: 'InvertValueEffect',
	Extends: Clutter.ShaderEffect,

	vfunc_get_static_shader_source: function() {
		return ' \
			uniform sampler2D tex; \
			\
			vec3 rgb2hsb( in vec3 c ){ \
			    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0); \
			    vec4 p = mix(vec4(c.bg, K.wz), \
					 vec4(c.gb, K.xy), \
					 step(c.b, c.g)); \
			    vec4 q = mix(vec4(p.xyw, c.r), \
					 vec4(c.r, p.yzx), \
					 step(p.x, c.r)); \
			    float d = q.x - min(q.w, q.y); \
			    float e = 1.0e-10; \
			    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), \
					d / (q.x + e), \
					q.x); \
			} \
			\
			vec3 hsb2rgb( in vec3 c ){ \
			    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0), \
						     6.0)-3.0)-1.0, \
					     0.0, \
					     1.0 ); \
			    rgb = rgb*rgb*(3.0-2.0*rgb); \
			    return c.z * mix(vec3(1.0), rgb, c.y); \
			} \
			\
			void main() { \
				vec4 color = texture2D(tex, cogl_tex_coord_in[0].st); \
				if(color.a > 0.0) { \
					color.rgb /= color.a; \
				} \
				color.rgb = vec3(1.0, 1.0, 1.0) - color.rgb; \
				vec3 color_hsb = rgb2hsb(color.rgb); \
				color_hsb.x = color_hsb.x - 0.5; \
				color.rgb = hsb2rgb(color_hsb); \
				color.rgb *= color.a; \
				cogl_color_out = color * cogl_color_in; \
			} \
		';
	},

	vfunc_paint_target: function(paint_context) {
		this.set_uniform_value("tex", 0);
		this.parent(paint_context);
	}
});

function InvertValue() {
	this.settings = Convenience.getSettings();
}

InvertValue.prototype = {
	toggle_effect: function() {
		global.get_window_actors().forEach(function(actor) {
			let meta_window = actor.get_meta_window();
			if(meta_window.has_focus()) {
				if(actor.get_effect('invert-value')) {
					actor.remove_effect_by_name('invert-value');
					delete meta_window._invert_value_tag;
				}
				else {
					let effect = new  InvertValueEffect();
					actor.add_effect_with_name('invert-value', effect);
					meta_window._invert_value_tag = true;
				}
			}
		}, this);
	},

    enable: function() {
		Main.wm.addKeybinding(
			SHORTCUT,
			this.settings,
			Meta.KeyBindingFlags.NONE,
			Shell.ActionMode.NORMAL,
			Lang.bind(this, this.toggle_effect)
		);

		global.get_window_actors().forEach(function(actor) {
			let meta_window = actor.get_meta_window();
			if(meta_window.hasOwnProperty('_invert_value_tag')) {
				let effect = new InvertValueEffect();
				actor.add_effect_with_name('invert-value', effect);
			}
		}, this);
	},

	disable: function() {
	    Main.wm.removeKeybinding(SHORTCUT);

		global.get_window_actors().forEach(function(actor) {
			actor.remove_effect_by_name('invert-value');
		}, this);
	}
};

let invert_value;

function init() {
}

function enable() {
	invert_value = new InvertValue();
	invert_value.enable();
}

function disable() {
	invert_value.disable();
	invert_value = null;
}


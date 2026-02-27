import type { ModuleOptions } from "./module";
import type { FeaturesName } from "./runtime/core/types";

export function isFeatureDevtoolsEnabled(options: ModuleOptions, feature: FeaturesName): boolean {
    return typeof options.features[feature] === 'object' ? options.features[feature].devtools : !!options.features[feature]
}

export function isFeatureEnabled(options: ModuleOptions, feature: FeaturesName): boolean {
    return !!options.features[feature]
}

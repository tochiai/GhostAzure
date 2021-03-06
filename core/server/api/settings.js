// # Settings API
var _            = require('lodash'),
    dataProvider = require('../models'),
    when         = require('when'),
    config       = require('../config'),
    canThis      = require('../permissions').canThis,
    errors       = require('../errors'),
    utils        = require('./utils'),

    docName      = 'settings',
    settings,

    updateSettingsCache,
    settingsFilter,
    filterPaths,
    readSettingsResult,
    settingsResult,
    canEditAllSettings,

    /**
     * ## Cache
     * Holds cached settings
     * @private
     * @type {{}}
     */
    settingsCache = {};


/**
 * ### Update Settings Cache
 * Maintain the internal cache of the settings object
 * @public
 * @param settings
 * @returns {Settings}
 */
updateSettingsCache = function (settings) {
    settings = settings || {};

    if (!_.isEmpty(settings)) {
        _.map(settings, function (setting, key) {
            settingsCache[key] = setting;
        });

        return when(settingsCache);
    }

    return dataProvider.Settings.findAll()
        .then(function (result) {
            settingsCache = readSettingsResult(result.models);

            return settingsCache;
        });
};

// ## Helpers

/**
 * ### Settings Filter
 * Filters an object based on a given filter object
 * @private
 * @param settings
 * @param filter
 * @returns {*}
 */
settingsFilter = function (settings, filter) {
    return _.object(_.filter(_.pairs(settings), function (setting) {
        if (filter) {
            return _.some(filter.split(','), function (f) {
                return setting[1].type === f;
            });
        }
        return true;
    }));
};

/**
 * ### Filter Paths
 * Normalizes paths read by require-tree so that the apps and themes modules can use them. Creates an empty
 * array (res), and populates it with useful info about the read packages like name, whether they're active
 * (comparison with the second argument), and if they have a package.json, that, otherwise false
 * @private
 * @param   {object}            paths       as returned by require-tree()
 * @param   {array/string}      active      as read from the settings object
 * @returns {Array}                         of objects with useful info about apps / themes
 */
filterPaths = function (paths, active) {
    var pathKeys = Object.keys(paths),
        res = [],
        item;

    // turn active into an array (so themes and apps can be checked the same)
    if (!Array.isArray(active)) {
        active = [active];
    }

    _.each(pathKeys, function (key) {
        //do not include hidden files or _messages
        if (key.indexOf('.') !== 0 &&
                key !== '_messages' &&
                key !== 'README.md'
                ) {
            item = {
                name: key
            };
            if (paths[key].hasOwnProperty('package.json')) {
                item.package = paths[key]['package.json'];
            } else {
                item.package = false;
            }

            if (_.indexOf(active, key) !== -1) {
                item.active = true;
            }
            res.push(item);
        }
    });
    return res;
};


/**
 * ### Read Settings Result
 * @private
 * @param settingsModels
 * @returns {Settings}
 */
readSettingsResult = function (settingsModels) {
    var settings = _.reduce(settingsModels, function (memo, member) {
            if (!memo.hasOwnProperty(member.attributes.key)) {
                memo[member.attributes.key] = member.attributes;
            }

            return memo;
        }, {}),
        themes = config().paths.availableThemes,
        apps = config().paths.availableApps,
        res;

    if (settings.activeTheme) {
        res = filterPaths(themes, settings.activeTheme.value);

        settings.availableThemes = {
            key: 'availableThemes',
            value: res,
            type: 'theme'
        };
    }

    if (settings.activeApps) {
        res = filterPaths(apps, JSON.parse(settings.activeApps.value));

        settings.availableApps = {
            key: 'availableApps',
            value: res,
            type: 'app'
        };
    }

    return settings;
};

/**
 * ### Settings Result
 * @private
 * @param settings
 * @param type
 * @returns {{settings: *}}
 */
settingsResult = function (settings, type) {
    var filteredSettings = _.values(settingsFilter(settings, type)),
        result = {
            settings: filteredSettings,
            meta: {}
        };

    if (type) {
        result.meta.filters = {
            type: type
        };
    }

    return result;
};

/**
 * ### Can Edit All Settings
 * Check that this edit request is allowed for all settings requested to be updated
 * @private
 * @param settingsInfo
 * @returns {*}
 */
canEditAllSettings = function (settingsInfo, options) {
    var checks = _.map(settingsInfo, function (settingInfo) {
        var setting = settingsCache[settingInfo.key];

        if (!setting) {
            return when.reject(new errors.NotFoundError('Unable to find setting: ' + settingInfo.key));
        }

        if (setting.type === 'core' && !(options.context && options.context.internal)) {
            return when.reject(
                new errors.NoPermissionError('Attempted to access core setting from external request')
            );
        }

        return canThis(options.context).edit.setting(settingInfo.key);
    });

    return when.all(checks);
};

// ## API Methods
settings = {

    /**
     * ### Browse
     * @param options
     * @returns {*}
     */
    browse: function browse(options) {
        options = options || {};

        var result = settingsResult(settingsCache, options.type);

        // If there is no context, return only blog settings
        if (!options.context) {
            return when(_.filter(result.settings, function (setting) { return setting.type === 'blog'; }));
        }

        // Otherwise return whatever this context is allowed to browse
        return canThis(options.context).browse.setting().then(function () {
            // Omit core settings unless internal request
            if (!options.context.internal) {
                result.settings = _.filter(result.settings, function (setting) { return setting.type !== 'core'; });
            }

            return result;
        });
    },

    /**
     * ### Read
     * @param options
     * @returns {*}
     */
    read: function read(options) {
        if (_.isString(options)) {
            options = { key: options };
        }

        var setting = settingsCache[options.key],
            result = {};

        if (!setting) {
            return when.reject(new errors.NotFoundError('Unable to find setting: ' + options.key));
        }

        result[options.key] = setting;

        if (setting.type === 'core' && !(options.context && options.context.internal)) {
            return when.reject(
                new errors.NoPermissionError('Attempted to access core setting from external request')
            );
        }

        if (setting.type === 'blog') {
            return when(settingsResult(result));
        }

        return canThis(options.context).read.setting(options.key).then(function () {
            return settingsResult(result);
        }, function () {
            return when.reject(new errors.NoPermissionError('You do not have permission to read settings.'));
        });
    },

    /**
     * ### Edit
     * Update properties of a post
     * @param {{settings: }} object Setting or a single string name
     * @param {{id (required), include,...}} options (optional) or a single string value
     * @return {Promise(Setting)} Edited Setting
     */
    edit: function edit(object, options) {
        options = options || {};
        var self = this,
            type;

        // Allow shorthand syntax where a single key and value are passed to edit instead of object and options
        if (_.isString(object)) {
            object = { settings: [{ key: object, value: options }]};
        }

        //clean data
        _.each(object.settings, function (setting) {
            if (!_.isString(setting.value)) {
                setting.value = JSON.stringify(setting.value);
            }
        });

        type = _.find(object.settings, function (setting) { return setting.key === 'type'; });
        if (_.isObject(type)) {
            type = type.value;
        }

        object.settings = _.reject(object.settings, function (setting) {
            return setting.key === 'type' || setting.key === 'availableThemes' || setting.key === 'availableApps';
        });

        return canEditAllSettings(object.settings, options).then(function () {
            return utils.checkObject(object, docName).then(function (checkedData) {
                options.user = self.user;
                return dataProvider.Settings.edit(checkedData.settings, options);
            }).then(function (result) {
                var readResult = readSettingsResult(result);

                return updateSettingsCache(readResult).then(function () {
                    return config.theme.update(settings, config().url);
                }).then(function () {
                    return settingsResult(readResult, type);
                });
            });
        });
    }
};

module.exports = settings;
module.exports.updateSettingsCache = updateSettingsCache;

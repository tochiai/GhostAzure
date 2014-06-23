define("ghost/app", 
  ["ember/resolver","ghost/fixtures/init","ghost/initializers/current-user","ghost/initializers/csrf","ghost/initializers/notifications","ghost/initializers/trailing-history","ghost/utils/link-view","ghost/utils/text-field","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __exports__) {
    "use strict";
    var Resolver = __dependency1__["default"];

    var initFixtures = __dependency2__["default"];

    var injectCurrentUser = __dependency3__["default"];

    var injectCsrf = __dependency4__["default"];

    var registerNotifications = __dependency5__.registerNotifications;
    var injectNotifications = __dependency5__.injectNotifications;

    var registerTrailingLocationHistory = __dependency6__["default"];



    
    var App = Ember.Application.extend({
        /**
         * These are debugging flags, they are useful during development
         */
        LOG_ACTIVE_GENERATION: true,
        LOG_MODULE_RESOLVER: true,
        LOG_TRANSITIONS: true,
        LOG_TRANSITIONS_INTERNAL: true,
        LOG_VIEW_LOOKUPS: true,
        modulePrefix: 'ghost',
        Resolver: Resolver['default']
    });
    
    initFixtures();
    
    App.initializer(injectCurrentUser);
    App.initializer(injectCsrf);
    App.initializer(registerNotifications);
    App.initializer(injectNotifications);
    App.initializer(registerTrailingLocationHistory);
    
    __exports__["default"] = App;
  });
define("ghost/assets/vendor/loader", 
  [],
  function() {
    "use strict";
    var define, requireModule, require, requirejs;
    
    (function() {
      var registry = {}, seen = {}, state = {};
      var FAILED = false;
    
      define = function(name, deps, callback) {
        registry[name] = {
          deps: deps,
          callback: callback
        };
      };
    
      requirejs = require = requireModule = function(name) {
        if (state[name] !== FAILED &&
            seen.hasOwnProperty(name)) {
          return seen[name];
        }
    
        if (!registry.hasOwnProperty(name)) {
          throw new Error('Could not find module ' + name);
        }
    
        var mod = registry[name];
        var deps = mod.deps;
        var callback = mod.callback;
        var reified = [];
        var exports;
        var value;
        var loaded = false;
    
        seen[name] = { }; // enable run-time cycles
    
        try {
          for (var i=0, l=deps.length; i<l; i++) {
            if (deps[i] === 'exports') {
              reified.push(exports = {});
            } else {
              reified.push(requireModule(resolve(deps[i], name)));
            }
          }
    
          value = callback.apply(this, reified);
          loaded = true;
        } finally {
          if (!loaded) {
            state[name] = FAILED;
          }
        }
        return seen[name] = exports || value;
      };
    
      function resolve(child, name) {
        if (child.charAt(0) !== '.') { return child; }
    
        var parts = child.split('/');
        var parentBase = name.split('/').slice(0, -1);
    
        for (var i = 0, l = parts.length; i < l; i++) {
          var part = parts[i];
    
          if (part === '..') { parentBase.pop(); }
          else if (part === '.') { continue; }
          else { parentBase.push(part); }
        }
    
        return parentBase.join('/');
      }
    
      requirejs._eak_seen = registry;
      requirejs.clear = function(){
        requirejs._eak_seen = registry = {};
        seen = {};
      };
    })();
  });
define("ghost/components/-codemirror", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /* global CodeMirror*/
    
    var onChangeHandler = function (cm) {
        cm.component.set('value', cm.getDoc().getValue());
    };
    
    var onScrollHandler = function (cm) {
        var scrollInfo = cm.getScrollInfo(),
            percentage = scrollInfo.top / scrollInfo.height,
            component = cm.component;
    
        // throttle scroll updates
        component.throttle = Ember.run.throttle(component, function () {
            this.set('scrollPosition', percentage);
        }, 50);
    };
    
    var Codemirror = Ember.TextArea.extend({
        initCodemirror: function () {
            // create codemirror
            this.codemirror = CodeMirror.fromTextArea(this.get('element'), {
                lineWrapping: true
            });
            this.codemirror.component = this; // save reference to this
    
            // propagate changes to value property
            this.codemirror.on('change', onChangeHandler);
    
            // on scroll update scrollPosition property
            this.codemirror.on('scroll', onScrollHandler);
        }.on('didInsertElement'),
    
        removeThrottle: function () {
            Ember.run.cancel(this.throttle);
        }.on('willDestroyElement'),
    
        removeCodemirrorHandlers: function () {
            // not sure if this is needed.
            this.codemirror.off('change', onChangeHandler);
            this.codemirror.off('scroll', onScrollHandler);
        }.on('willDestroyElement')
    });
    
    __exports__["default"] = Codemirror;
  });
define("ghost/components/-markdown", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var Markdown = Ember.Component.extend({
        adjustScrollPosition: function () {
            var scrollWrapper = this.$('.entry-preview-content').get(0),
            // calculate absolute scroll position from percentage
                scrollPixel = scrollWrapper.scrollHeight * this.get('scrollPosition');
    
            scrollWrapper.scrollTop = scrollPixel; // adjust scroll position
        }.observes('scrollPosition')
    });
    
    __exports__["default"] = Markdown;
  });
define("ghost/components/activating-list-item", 
  ["exports"],
  function(__exports__) {
    "use strict";
    __exports__["default"] = Ember.Component.extend({
        tagName: 'li',
        classNameBindings: ['active'],
        active: false
    });
  });
define("ghost/components/blur-text-field", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var BlurTextField = Ember.TextField.extend({
        selectOnClick: false,
        click: function (event) {
            if (this.get('selectOnClick')) {
                event.currentTarget.select();
            }
        },
        focusOut: function () {
            this.sendAction('action', this.get('value'));
        }
    });
    
    __exports__["default"] = BlurTextField;
  });
define("ghost/components/file-upload", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var FileUpload = Ember.Component.extend({
        _file: null,
        uploadButtonText: 'Text',
        uploadButtonDisabled: true,
        change: function (event) {
            this.set('uploadButtonDisabled', false);
            this.sendAction('onAdd');
            this._file = event.target.files[0];
        },
        actions: {
            upload: function () {
                var self = this;
                if (!this.uploadButtonDisabled && self._file) {
                    self.sendAction('onUpload', self._file);
                }
    
                // Prevent double post by disabling the button.
                this.set('uploadButtonDisabled', true);
            }
        }
    });
    
    __exports__["default"] = FileUpload;
  });
define("ghost/components/gh-form", 
  ["exports"],
  function(__exports__) {
    "use strict";
    __exports__["default"] = Ember.View.extend({
        tagName: 'form',
        attributeBindings: ['enctype'],
        reset: function () {
            this.$().get(0).reset();
        },
        didInsertElement: function () {
            this.get('controller').on('reset', this, this.reset);
        },
        willClearRender: function () {
            this.get('controller').off('reset', this, this.reset);
        }
    });
  });
define("ghost/components/ghost-notification", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var NotificationComponent = Ember.Component.extend({
        classNames: ['js-bb-notification'],
    
        didInsertElement: function () {
            var self = this;
    
            self.$().on('animationend webkitAnimationEnd oanimationend MSAnimationEnd', function (event) {
                /* jshint unused: false */
                self.notifications.removeObject(self.get('message'));
            });
        },
    
        actions: {
            closeNotification: function () {
                var self = this;
                self.notifications.removeObject(self.get('message'));
            }
        }
    });
    
    __exports__["default"] = NotificationComponent;
  });
define("ghost/components/ghost-notifications", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var NotificationsComponent = Ember.Component.extend({
        tagName: 'aside',
        classNames: 'notifications',
        messages: Ember.computed.alias('notifications')
    });
    
    __exports__["default"] = NotificationsComponent;
  });
define("ghost/components/ghost-popover", 
  ["exports"],
  function(__exports__) {
    "use strict";
    
    var GhostPopover = Ember.Component.extend({
        classNames: 'ghost-popover',
        classNameBindings: ['open'],
        open: false
    });
    
    __exports__["default"] = GhostPopover;
  });
define("ghost/components/modal-dialog", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var ModalDialog = Ember.Component.extend({
        didInsertElement: function () {
            this.$('#modal-container').fadeIn(50);
    
            this.$('.modal-background').show().fadeIn(10, function () {
                $(this).addClass('in');
            });
    
            this.$('.js-modal').addClass('in');
        },
    
        willDestroyElement: function () {
    
            this.$('.js-modal').removeClass('in');
    
            this.$('.modal-background').removeClass('in');
    
            return this._super();
        },
    
        actions: {
            closeModal: function () {
                this.sendAction();
            },
            confirm: function (type) {
                var func = this.get('confirm.' + type + '.func');
                if (typeof func === 'function') {
                    func();
                }
                this.sendAction();
            }
        },
    
        klass: function () {
            var classNames = [];
    
            classNames.push(this.get('type') ? 'modal-' + this.get('type') : 'modal');
    
            if (this.get('style')) {
                this.get('style').split(',').forEach(function (style) {
                    classNames.push('modal-style-' + style);
                });
            }
    
            classNames.push(this.get('animation'));
    
            return classNames.join(' ');
        }.property('type', 'style', 'animation'),
    
        acceptButtonClass: function () {
            return this.get('confirm.accept.buttonClass') ? this.get('confirm.accept.buttonClass') : 'button-add';
        }.property('confirm.accept.buttonClass'),
    
        rejectButtonClass: function () {
            return this.get('confirm.reject.buttonClass') ? this.get('confirm.reject.buttonClass') : 'button-delete';
        }.property('confirm.reject.buttonClass')
    });
    
    __exports__["default"] = ModalDialog;
  });
define("ghost/components/upload-modal", 
  ["ghost/components/modal-dialog","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    /*global console */
    
    var ModalDialog = __dependency1__["default"];

    
    var UploadModal = ModalDialog.extend({
        layoutName: 'components/modal-dialog',
    
        didInsertElement: function () {
            this._super();
    
            // @TODO: get this real
            console.log('UploadController:afterRender');
            // var filestorage = $('#' + this.options.model.id).data('filestorage');
            // this.$('.js-drop-zone').upload({fileStorage: filestorage});
        },
    
        actions: {
            closeModal: function () {
                this.sendAction();
            },
            confirm: function (type) {
                var func = this.get('confirm.' + type + '.func');
                if (typeof func === 'function') {
                    func();
                }
                this.sendAction();
            }
        },
    
    });
    
    __exports__["default"] = UploadModal;
  });
define("ghost/controllers/application", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var ApplicationController = Ember.Controller.extend({
        isSignedIn: Ember.computed.bool('user.isSignedIn'),
    
        actions: {
            toggleMenu: function () {
                this.toggleProperty('showMenu');
            }
        }
    });
    
    __exports__["default"] = ApplicationController;
  });
define("ghost/controllers/debug", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /*global alert, console */
    
    var Debug = Ember.Controller.extend(Ember.Evented, {
        uploadButtonText: 'Import',
        actions: {
            importData: function (file) {
                var self = this;
                this.set('uploadButtonText', 'Importing');
                this.get('model').importFrom(file)
                    .then(function (response) {
                        console.log(response);
                        alert('@TODO: success');
                    })
                    .catch(function (response) {
                        console.log(response);
                        alert('@TODO: error');
                    })
                    .finally(function () {
                        self.set('uploadButtonText', 'Import');
                        self.trigger('reset');
                    });
            },
            sendTestEmail: function () {
                this.get('model').sendTestEmail()
                    .then(function (response) {
                        console.log(response);
                        alert('@TODO: success');
                    })
                    .catch(function (response) {
                        console.log(response);
                        alert('@TODO: error');
                    });
            }
        }
    });
    
    __exports__["default"] = Debug;
  });
define("ghost/controllers/forgotten", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /*global console, alert */
    
    var ForgottenController = Ember.Controller.extend({
        email: '',
        actions: {
            submit: function () {
                var self = this;
                self.user.fetchForgottenPasswordFor(this.email)
                    .then(function () {
                        alert('@TODO Notification: Success');
                        self.transitionToRoute('signin');
                    })
                    .catch(function (response) {
                        alert('@TODO');
                        console.log(response);
                    });
            }
        }
    });
    
    __exports__["default"] = ForgottenController;
  });
define("ghost/controllers/modals/delete-all", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /*global alert */
    
    var DeleteAllController = Ember.Controller.extend({
        confirm: {
            accept: {
                func: function () {
                    // @TODO make the below real :)
                    alert('Deleting everything!');
                    // $.ajax({
                    //     url: Ghost.paths.apiRoot + '/db/',
                    //     type: 'DELETE',
                    //     headers: {
                    //         'X-CSRF-Token': $("meta[name='csrf-param']").attr('content')
                    //     },
                    //     success: function onSuccess(response) {
                    //         if (!response) {
                    //             throw new Error('No response received from server.');
                    //         }
                    //         if (!response.message) {
                    //             throw new Error(response.detail || 'Unknown error');
                    //         }
    
                    //         Ghost.notifications.addItem({
                    //             type: 'success',
                    //             message: response.message,
                    //             status: 'passive'
                    //         });
    
                    //     },
                    //     error: function onError(response) {
                    //         var responseText = JSON.parse(response.responseText),
                    //             message = responseText && responseText.error ? responseText.error : 'unknown';
                    //         Ghost.notifications.addItem({
                    //             type: 'error',
                    //             message: ['A problem was encountered while deleting content from your blog. Error: ', message].join(''),
                    //             status: 'passive'
                    //         });
    
                    //     }
                    // });
                },
                text: "Delete",
                buttonClass: "button-delete"
            },
            reject: {
                func: function () {
                    return true;
                },
                text: "Cancel",
                buttonClass: "button"
            }
        }
    });
    
    __exports__["default"] = DeleteAllController;
  });
define("ghost/controllers/modals/delete-post", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /*global alert */
    
    var DeletePostController = Ember.Controller.extend({
        confirm: {
            accept: {
                func: function () {
                    // @TODO: make this real
                    alert('Deleting post');
                    // self.model.destroy({
                    //     wait: true
                    // }).then(function () {
                    //     // Redirect to content screen if deleting post from editor.
                    //     if (window.location.pathname.indexOf('editor') > -1) {
                    //         window.location = Ghost.paths.subdir + '/ghost/content/';
                    //     }
                    //     Ghost.notifications.addItem({
                    //         type: 'success',
                    //         message: 'Your post has been deleted.',
                    //         status: 'passive'
                    //     });
                    // }, function () {
                    //     Ghost.notifications.addItem({
                    //         type: 'error',
                    //         message: 'Your post could not be deleted. Please try again.',
                    //         status: 'passive'
                    //     });
                    // });
                },
                text: "Delete",
                buttonClass: "button-delete"
            },
            reject: {
                func: function () {
                    return true;
                },
                text: "Cancel",
                buttonClass: "button"
            }
        },
    });
    
    __exports__["default"] = DeletePostController;
  });
define("ghost/controllers/modals/upload", 
  ["exports"],
  function(__exports__) {
    "use strict";
    
    var UploadController = Ember.Controller.extend({
        confirm: {
            reject: {
                func: function () { // The function called on rejection
                    return true;
                },
                buttonClass: true,
                text: "Cancel" // The reject button text
            }
        }
    });
    
    __exports__["default"] = UploadController;
  });
define("ghost/controllers/posts/post", 
  ["ghost/utils/date-formatting","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var parseDateString = __dependency1__.parseDateString;
    var formatDate = __dependency1__.formatDate;

    
    var equal = Ember.computed.equal;
    
    var PostController = Ember.ObjectController.extend({
    
        isPublished: equal('status', 'published'),
        isDraft: equal('status', 'draft'),
        isEditingSettings: false,
        isStaticPage: function (key, val) {
            if (arguments.length > 1) {
                this.set('model.page', val ? 1 : 0);
                this.get('model').save('page').then(function () {
                    this.notifications.showSuccess('Succesfully converted ' + (val ? 'to static page' : 'to post'));
                }, this.notifications.showErrors);
            }
            return !!this.get('model.page');
        }.property('model.page'),
    
        isOnServer: function () {
            return this.get('model.id') !== undefined;
        }.property('model.id'),
    
        newSlugBinding: Ember.Binding.oneWay('model.slug'),
        slugPlaceholder: null,
        // Requests a new slug when the title was changed
        updateSlugPlaceholder: function () {
            var model,
                self = this,
                title = this.get('title');
    
            // If there's a title present we want to
            // validate it against existing slugs in the db
            // and then update the placeholder value.
            if (title) {
                model = self.get('model');
                model.generateSlug().then(function (slug) {
                    self.set('slugPlaceholder', slug);
                }, function () {
                    self.notifications.showWarn('Unable to generate a slug for "' + title + '"');
                });
            } else {
                // If there's no title set placeholder to blank
                // and don't make an ajax request to server
                // for a proper slug (as there won't be any).
                self.set('slugPlaceholder', '');
            }
        }.observes('model.title'),
    
        publishedAt: null,
        publishedAtChanged: function () {
            this.set('publishedAt', formatDate(this.get('model.published_at')));
        }.observes('model.published_at'),
            
        actions: {
            editSettings: function () {
                this.toggleProperty('isEditingSettings');
                if (this.get('isEditingSettings')) {
                    //Stop editing if the user clicks outside the settings view
                    Ember.run.next(this, function () {
                        var self = this;
                        // @TODO has a race condition with click on the editSettings action
                        $(document).one('click', function () {
                            self.toggleProperty('isEditingSettings');
                        });
                    });
                }
            },
            updateSlug: function () {
                var newSlug = this.get('newSlug'),
                    slug = this.get('model.slug'),
                    placeholder = this.get('slugPlaceholder'),
                    self = this;
                
                newSlug = (!newSlug && placeholder) ? placeholder : newSlug;
                
                // Ignore unchanged slugs
                if (slug === newSlug) {
                    return;
                }
                //reset to model's slug on empty string
                if (!newSlug) {
                    this.set('newSlug', slug);
                    return;
                }
    
                //Validation complete
                this.set('model.slug', newSlug);
    
                // If the model doesn't currently
                // exist on the server
                // then just update the model's value
                if (!this.get('isOnServer')) {
                    return;
                }
                
                this.get('model').save('slug').then(function () {
                    self.notifications.showSuccess('Permalink successfully changed to <strong>' + this.get('model.slug') + '</strong>.');
                }, this.notifications.showErrors);
            },
    
            updatePublishedAt: function (userInput) {
                var errMessage = '',
                    newPubDate = formatDate(parseDateString(userInput)),
                    pubDate = this.get('publishedAt'),
                    newPubDateMoment,
                    pubDateMoment;
    
                // if there is no new pub date, mark that until the post is published,
                //    when we'll fill in with the current time.
                if (!newPubDate) {
                    this.set('publishedAt', '');
                    return;
                }
    
                // Check for missing time stamp on new data
                // If no time specified, add a 12:00
                if (newPubDate && !newPubDate.slice(-5).match(/\d+:\d\d/)) {
                    newPubDate += " 12:00";
                }
    
                newPubDateMoment = parseDateString(newPubDate);
    
                // If there was a published date already set
                if (pubDate) {
                    // Check for missing time stamp on current model
                    // If no time specified, add a 12:00
                    if (!pubDate.slice(-5).match(/\d+:\d\d/)) {
                        pubDate += " 12:00";
                    }
    
                    pubDateMoment = parseDateString(pubDate);
    
                    // Quit if the new date is the same
                    if (pubDateMoment.isSame(newPubDateMoment)) {
                        return;
                    }
                }
    
                // Validate new Published date
                if (!newPubDateMoment.isValid() || newPubDate.substr(0, 12) === "Invalid date") {
                    errMessage = 'Published Date must be a valid date with format: DD MMM YY @ HH:mm (e.g. 6 Dec 14 @ 15:00)';
                }
    
                if (newPubDateMoment.diff(new Date(), 'h') > 0) {
                    errMessage = 'Published Date cannot currently be in the future.';
                }
    
                if (errMessage) {
                    // Show error message
                    this.notifications.showError(errMessage);
                    //Hack to push a "change" when it's actually staying
                    //  the same.
                    //This alerts the listener on post-settings-menu
                    this.notifyPropertyChange('publishedAt');
                    return;
                }
    
                //Validation complete
                this.set('model.published_at', newPubDateMoment.toDate());
    
                // If the model doesn't currently
                // exist on the server
                // then just update the model's value
                if (!this.get('isOnServer')) {
                    return;
                }
                
                this.get('model').save('published_at').then(function () {
                    this.notifications.showSuccess('Publish date successfully changed to <strong>' + this.get('publishedAt') + '</strong>.');
                }, this.notifications.showErrors);
            }
        }
    });
    
    __exports__["default"] = PostController;
  });
define("ghost/controllers/reset", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /*global alert, console */
    var ResetController = Ember.Controller.extend({
        passwords: {
            newPassword: '',
            ne2Password: ''
        },
        token: '',
        submitButtonDisabled: false,
        actions: {
            submit: function () {
                var self = this;
                this.set('submitButtonDisabled', true);
                
                this.user.resetPassword(this.passwords, this.token)
                    .then(function () {
                        alert('@TODO Notification : Success');
                        self.transitionToRoute('signin');
                    })
                    .catch(function (response) {
                        alert('@TODO Notification : Failure');
                        console.log(response);
                    })
                    .finally(function () {
                        self.set('submitButtonDisabled', false);
                    });
            }
        }
    });
    
    __exports__["default"] = ResetController;
  });
define("ghost/controllers/settings/general", 
  ["exports"],
  function(__exports__) {
    "use strict";
    
    var elementLookup = {
        title: '#blog-title',
        description: '#blog-description',
        email: '#email-address',
        postsPerPage: '#postsPerPage'
    };
    
    var SettingsGeneralController = Ember.ObjectController.extend({
        isDatedPermalinks: function (key, value) {
            // setter
            if (arguments.length > 1) {
                this.set('permalinks', value ? '/:year/:month/:day/:slug/' : '/:slug/');
            }
    
            // getter
            var slugForm = this.get('permalinks');
    
            return slugForm !== '/:slug/';
        }.property('permalinks'),
    
        actions: {
            'save': function () {
                // Validate and save settings
                var model = this.get('model'),
                    // @TODO: Don't know how to scope this to this controllers view because this.view is null
                    errs = model.validate();
    
                if (errs.length > 0) {
                    // Set the actual element from this view based on the error
                    errs.forEach(function (err) {
                        // @TODO: Probably should still be scoped to this controllers root element.
                        err.el = $(elementLookup[err.el]);
                    });
    
                    // Let the applicationRoute handle validation errors
                    this.send('handleValidationErrors', errs);
                } else {
                    model.save().then(function () {
                        // @TODO: Notification of success
                        window.alert('Saved data!');
                    }, function () {
                        // @TODO: Notification of error
                        window.alert('Error saving data');
                    });
                }
            },
    
            'uploadLogo': function () {
                // @TODO: Integrate with Modal component
            },
    
            'uploadCover': function () {
                // @TODO: Integrate with Modal component
            }
        }
    });
    
    __exports__["default"] = SettingsGeneralController;
  });
define("ghost/controllers/settings/user", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /*global alert */
    
    var SettingsUserController = Ember.Controller.extend({
        cover: function () {
            // @TODO: add {{asset}} subdir path
            return this.user.getWithDefault('cover', '/shared/img/user-cover.png');
        }.property('user.cover'),
    
        coverTitle: function () {
            return this.get('user.name') + '\'s Cover Image';
        }.property('user.name'),
    
        image: function () {
            // @TODO: add {{asset}} subdir path
            return 'background-image: url(' + this.user.getWithDefault('image', '/shared/img/user-image.png') + ')';
        }.property('user.image'),
    
        actions: {
            save: function () {
                alert('@TODO: Saving user...');
    
                if (this.user.validate().get('isValid')) {
                    this.user.save().then(function (response) {
                        alert('Done saving' + JSON.stringify(response));
                    }, function () {
                        alert('Error saving.');
                    });
                } else {
                    alert('Errors found! ' + JSON.stringify(this.user.get('errors')));
                }
            },
    
            password: function () {
                alert('@TODO: Changing password...');
                var passwordProperties = this.getProperties('password', 'newPassword', 'ne2Password');
    
                if (this.user.validatePassword(passwordProperties).get('passwordIsValid')) {
                    this.user.saveNewPassword(passwordProperties).then(function () {
                        alert('Success!');
                        // Clear properties from view
                        this.setProperties({
                            'password': '',
                            'newpassword': '',
                            'ne2password': ''
                        });
                    }.bind(this), function (errors) {
                        alert('Errors ' + JSON.stringify(errors));
                    });
                } else {
                    alert('Errors found! ' + JSON.stringify(this.user.get('passwordErrors')));
                }
            }
        }
    
    });
    
    __exports__["default"] = SettingsUserController;
  });
define("ghost/fixtures/init", 
  ["ghost/fixtures/posts","ghost/fixtures/users","ghost/fixtures/settings","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var postFixtures = __dependency1__["default"];

    var userFixtures = __dependency2__["default"];

    var settingsFixtures = __dependency3__["default"];

    
    var response = function (responseBody, status) {
        status = status || 200;
        var textStatus = (status === 200) ? 'success' : 'error';
    
        return {
            response: responseBody,
            jqXHR: { status: status },
            textStatus: textStatus
        };
    };
    
    var user = function (status) {
        return response(userFixtures.findBy('id', 1), status);
    };
    
    var post = function (id, status) {
        return response(postFixtures.findBy('id', id), status);
    };
    
    var posts = function (status) {
        return response({
            'posts': postFixtures,
            'page': 1,
            'limit': 15,
            'pages': 1,
            'total': 2
        }, status);
    };
    
    var settings = function (status) {
        return response(settingsFixtures, status);
    };
    
    var defineFixtures = function (status) {
        ic.ajax.defineFixture('/ghost/api/v0.1/posts', posts(status));
        ic.ajax.defineFixture('/ghost/api/v0.1/posts/1', post(1, status));
        ic.ajax.defineFixture('/ghost/api/v0.1/posts/2', post(2, status));
        ic.ajax.defineFixture('/ghost/api/v0.1/posts/3', post(3, status));
        ic.ajax.defineFixture('/ghost/api/v0.1/posts/4', post(4, status));
        ic.ajax.defineFixture('/ghost/api/v0.1/posts/slug/test%20title/', response('generated-slug', status));
    
        ic.ajax.defineFixture('/ghost/api/v0.1/users/me/', user(status));
        ic.ajax.defineFixture('/ghost/changepw/', response({
            msg: 'Password changed successfully'
        }));
        ic.ajax.defineFixture('/ghost/api/v0.1/forgotten/', response({
            redirect: '/ghost/signin/'
        }));
        ic.ajax.defineFixture('/ghost/api/v0.1/reset/', response({
            msg: 'Password changed successfully'
        }));
        ic.ajax.defineFixture('/ghost/api/v0.1/settings/?type=blog,theme,app', settings(status));
    };
    
    __exports__["default"] = defineFixtures;
  });
define("ghost/fixtures/posts", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var posts =  [
        {
            "id": 0,
            "uuid": "8b506b1a-2111-48c7-9870-cc7bf96bdc75",
            "status": "published ",
            "title": "cillum incididunt nisi culpa esse duis cupidatat ullamco",
            "slug": "cillum-incididunt-nisi-culpa-esse-duis-cupidatat-ullamco",
            "markdown": "Deserunt irure est voluptate deserunt. Veniam et commodo irure incididunt velit cupidatat aliquip eu ipsum excepteur consectetur id. Occaecat ex laborum velit sit nisi qui magna quis reprehenderit incididunt. Sunt ullamco ea tempor qui enim minim pariatur laboris.\r\nAnim dolore qui labore fugiat aliqua excepteur voluptate est. Voluptate ex ad consectetur cupidatat ea aliquip consectetur irure non eu duis. Eiusmod laborum ullamco tempor occaecat commodo occaecat ut. Qui nulla excepteur elit nisi cupidatat elit nulla exercitation labore ea.\r\nNostrud occaecat proident dolore duis culpa id et reprehenderit pariatur ad pariatur. Velit commodo excepteur consectetur laborum laboris exercitation id. Exercitation cillum ad voluptate minim officia mollit irure labore ipsum culpa reprehenderit. Laboris tempor est laboris aute.\r\nEsse occaecat qui reprehenderit eu esse minim. Officia incididunt ad exercitation cupidatat cupidatat. Excepteur incididunt laboris id enim reprehenderit incididunt sit nostrud Lorem incididunt nostrud consectetur. Consequat elit labore nulla velit elit labore officia sit minim ipsum pariatur velit commodo.\r\nDuis Lorem excepteur excepteur sunt eu ullamco aliqua excepteur ipsum sit. Ad ea exercitation cillum adipisicing est. Labore voluptate consectetur adipisicing labore tempor dolor. Fugiat enim est tempor tempor consectetur qui aliqua do dolor. Veniam eu commodo quis reprehenderit eiusmod nulla laboris nostrud aliquip non eiusmod excepteur cupidatat. Veniam duis dolor mollit veniam velit.\r\nOccaecat Lorem fugiat fugiat excepteur dolor nulla nisi duis nisi anim. Aliquip irure veniam do incididunt labore nulla dolor mollit labore commodo eu tempor. Id culpa incididunt eiusmod consequat in deserunt aute occaecat Lorem non. In tempor ut aute aliquip veniam occaecat aliquip sit aute pariatur enim adipisicing velit dolor. Veniam laborum ea adipisicing duis velit elit.\r\nVeniam officia irure minim incididunt eiusmod. Ad velit consequat culpa culpa irure qui mollit excepteur eu aute dolore. Commodo fugiat mollit deserunt cupidatat nulla. Pariatur esse excepteur pariatur qui consequat excepteur magna ex enim ea. Est et sunt consectetur dolor sint eu enim.\r\nEsse ipsum exercitation duis veniam commodo incididunt exercitation consequat nostrud. Irure laborum eiusmod sint veniam magna. Magna est elit adipisicing deserunt aliqua pariatur. Velit est sint cillum ea adipisicing.\r\nDuis ut magna voluptate eiusmod amet ut qui magna sint culpa. Nulla aliquip excepteur culpa id cillum. Sunt sunt sit officia culpa labore est eu est deserunt. Consequat esse sit enim sunt culpa sit exercitation tempor. Dolor eu aliquip id cupidatat excepteur commodo minim labore qui esse laborum exercitation laborum.\r\nElit in eu Lorem fugiat officia esse ipsum excepteur aliquip duis nisi irure ipsum. Laboris aliqua do labore nisi veniam ea exercitation esse. Sit ut et qui proident qui cupidatat eu ea aute incididunt tempor in nisi.\r\n",
            "html": "<p>Deserunt irure est voluptate deserunt. Veniam et commodo irure incididunt velit cupidatat aliquip eu ipsum excepteur consectetur id. Occaecat ex laborum velit sit nisi qui magna quis reprehenderit incididunt. Sunt ullamco ea tempor qui enim minim pariatur laboris.\r\nAnim dolore qui labore fugiat aliqua excepteur voluptate est. Voluptate ex ad consectetur cupidatat ea aliquip consectetur irure non eu duis. Eiusmod laborum ullamco tempor occaecat commodo occaecat ut. Qui nulla excepteur elit nisi cupidatat elit nulla exercitation labore ea.\r\nNostrud occaecat proident dolore duis culpa id et reprehenderit pariatur ad pariatur. Velit commodo excepteur consectetur laborum laboris exercitation id. Exercitation cillum ad voluptate minim officia mollit irure labore ipsum culpa reprehenderit. Laboris tempor est laboris aute.\r\nEsse occaecat qui reprehenderit eu esse minim. Officia incididunt ad exercitation cupidatat cupidatat. Excepteur incididunt laboris id enim reprehenderit incididunt sit nostrud Lorem incididunt nostrud consectetur. Consequat elit labore nulla velit elit labore officia sit minim ipsum pariatur velit commodo.\r\nDuis Lorem excepteur excepteur sunt eu ullamco aliqua excepteur ipsum sit. Ad ea exercitation cillum adipisicing est. Labore voluptate consectetur adipisicing labore tempor dolor. Fugiat enim est tempor tempor consectetur qui aliqua do dolor. Veniam eu commodo quis reprehenderit eiusmod nulla laboris nostrud aliquip non eiusmod excepteur cupidatat. Veniam duis dolor mollit veniam velit.\r\nOccaecat Lorem fugiat fugiat excepteur dolor nulla nisi duis nisi anim. Aliquip irure veniam do incididunt labore nulla dolor mollit labore commodo eu tempor. Id culpa incididunt eiusmod consequat in deserunt aute occaecat Lorem non. In tempor ut aute aliquip veniam occaecat aliquip sit aute pariatur enim adipisicing velit dolor. Veniam laborum ea adipisicing duis velit elit.\r\nVeniam officia irure minim incididunt eiusmod. Ad velit consequat culpa culpa irure qui mollit excepteur eu aute dolore. Commodo fugiat mollit deserunt cupidatat nulla. Pariatur esse excepteur pariatur qui consequat excepteur magna ex enim ea. Est et sunt consectetur dolor sint eu enim.\r\nEsse ipsum exercitation duis veniam commodo incididunt exercitation consequat nostrud. Irure laborum eiusmod sint veniam magna. Magna est elit adipisicing deserunt aliqua pariatur. Velit est sint cillum ea adipisicing.\r\nDuis ut magna voluptate eiusmod amet ut qui magna sint culpa. Nulla aliquip excepteur culpa id cillum. Sunt sunt sit officia culpa labore est eu est deserunt. Consequat esse sit enim sunt culpa sit exercitation tempor. Dolor eu aliquip id cupidatat excepteur commodo minim labore qui esse laborum exercitation laborum.\r\nElit in eu Lorem fugiat officia esse ipsum excepteur aliquip duis nisi irure ipsum. Laboris aliqua do labore nisi veniam ea exercitation esse. Sit ut et qui proident qui cupidatat eu ea aute incididunt tempor in nisi.\r\n</p>",
            "image": null,
            "featured": 0,
            "page": 9,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 0,
                "uuid": "7c0896f2-c925-4b6b-a943-0699d9f00fd2",
                "name": "Rosie Chambers",
                "slug": "rosie-chambers",
                "email": "rosiechambers@sustenza.com",
                "bio": "",
                "website": "",
                "location": "est labore",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-08-31T00:04:12.354 +04:00",
                "updated_at": "2013-06-11T04:22:06.916 +04:00"
            },
            "created_at": "2013-07-18T05:18:11.156 +04:00",
            "created_by": {
                "id": 8,
                "uuid": "352124f6-7741-4f3c-a93b-631d656cdf75",
                "name": "Sandoval Bradley",
                "slug": "sandoval-bradley",
                "email": "sandovalbradley@sustenza.com",
                "bio": "",
                "website": "",
                "location": "duis ea labore",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-06-11T20:53:45.698 +04:00",
                "updated_at": "2012-02-27T02:19:16.427 +05:00"
            },
            "updated_at": "2013-04-12T02:08:41.865 +04:00",
            "updated_by": {
                "id": 5,
                "uuid": "a3a8388f-f47e-43e7-8eeb-a07a1becc59e",
                "name": "Noble Garrett",
                "slug": "noble-garrett",
                "email": "noblegarrett@sustenza.com",
                "bio": "",
                "website": "",
                "location": "et",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-09-28T11:04:36.608 +04:00",
                "updated_at": "2013-03-02T03:51:29.829 +05:00"
            },
            "published_at": "2014-02-16T15:58:19.991 +05:00",
            "published_by": {
                "id": 8,
                "uuid": "1ebe5e07-d57d-4e6d-bbde-51c3e5e1af77",
                "name": "Mason Dotson",
                "slug": "mason-dotson",
                "email": "masondotson@sustenza.com",
                "bio": "",
                "website": "",
                "location": "eu velit",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-04-26T09:03:07.732 +04:00",
                "updated_at": "2013-08-21T16:24:56.893 +04:00"
            },
            "tags": [
                {
                    "id": 100,
                    "uuid": "826f9dfa-1b40-43e9-aae0-6e0621627023",
                    "name": "esse consequat cupidatat",
                    "slug": "esse-consequat-cupidatat",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-07-22T14:33:58.433 +04:00",
                    "created_by": 8,
                    "updated_at": "2014-03-20T18:18:07.906 +04:00",
                    "updated_by": 1
                },
                {
                    "id": 64,
                    "uuid": "0e9a1c83-4ce1-4edf-b72f-8b9a6af77ccb",
                    "name": "duis voluptate",
                    "slug": "duis-voluptate",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-12-11T01:43:34.006 +05:00",
                    "created_by": 5,
                    "updated_at": "2013-11-04T02:57:05.065 +05:00",
                    "updated_by": 4
                },
                {
                    "id": 24,
                    "uuid": "6e39d427-5062-47a0-97ec-13317f967e9c",
                    "name": "tempor sit nulla",
                    "slug": "tempor-sit-nulla",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-05-05T07:38:30.761 +04:00",
                    "created_by": 5,
                    "updated_at": "2012-03-11T15:11:33.359 +04:00",
                    "updated_by": 10
                },
                {
                    "id": 27,
                    "uuid": "1a2d8ab0-3cea-45e3-b200-518bdb1e3c8a",
                    "name": "eiusmod",
                    "slug": "eiusmod",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-05-07T21:45:47.179 +04:00",
                    "created_by": 3,
                    "updated_at": "2012-02-29T18:41:28.798 +05:00",
                    "updated_by": 5
                },
                {
                    "id": 99,
                    "uuid": "a5f18e36-a8b8-4063-a148-a96ec30329c0",
                    "name": "incididunt",
                    "slug": "incididunt",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-10-10T05:25:49.056 +04:00",
                    "created_by": 2,
                    "updated_at": "2012-05-14T14:57:59.484 +04:00",
                    "updated_by": 8
                },
                {
                    "id": 54,
                    "uuid": "bd36803a-2c92-4426-b1d8-6d9efcdab7cd",
                    "name": "enim",
                    "slug": "enim",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-02-18T02:03:38.714 +05:00",
                    "created_by": 7,
                    "updated_at": "2012-06-02T02:54:19.675 +04:00",
                    "updated_by": 2
                },
                {
                    "id": 57,
                    "uuid": "b6544993-0980-4c10-942f-4b464673845a",
                    "name": "deserunt tempor",
                    "slug": "deserunt-tempor",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-12-31T12:34:57.248 +05:00",
                    "created_by": 5,
                    "updated_at": "2013-04-13T13:24:37.282 +04:00",
                    "updated_by": 9
                },
                {
                    "id": 54,
                    "uuid": "dfd280ec-1063-4a82-9022-e396cb43d714",
                    "name": "velit ut occaecat",
                    "slug": "velit-ut-occaecat",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-05-26T05:09:05.743 +04:00",
                    "created_by": 9,
                    "updated_at": "2013-09-14T13:22:54.527 +04:00",
                    "updated_by": 8
                },
                {
                    "id": 93,
                    "uuid": "64c13b4e-f32c-4c1e-b30e-155f74bd7279",
                    "name": "labore",
                    "slug": "labore",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-04-09T05:55:37.304 +04:00",
                    "created_by": 3,
                    "updated_at": "2012-12-31T01:34:41.961 +05:00",
                    "updated_by": 7
                },
                {
                    "id": 91,
                    "uuid": "14f6900f-5353-4ba6-b33c-7a6456e1dbd6",
                    "name": "laborum nostrud culpa",
                    "slug": "laborum-nostrud-culpa",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-01-23T16:39:44.711 +05:00",
                    "created_by": 6,
                    "updated_at": "2013-03-05T04:57:24.910 +05:00",
                    "updated_by": 7
                }
            ]
        },
        {
            "id": 1,
            "uuid": "328287f7-7186-4bb3-a757-91cb62ea8644",
            "status": "draft",
            "title": "cupidatat anim adipisicing elit aliqua ut",
            "slug": "cupidatat-anim-adipisicing-elit-aliqua-ut",
            "markdown": "Voluptate deserunt veniam Lorem anim fugiat sint dolor dolore cupidatat sint occaecat duis tempor. Do nulla aliqua laborum laboris deserunt in quis ea aute dolore incididunt dolore. Laboris exercitation ea eu consequat consectetur. Consectetur proident adipisicing nulla aliqua duis esse quis minim anim adipisicing eiusmod. Dolor est sint fugiat et reprehenderit ea ea amet velit eu laborum et proident ex. Fugiat ad in quis aliquip. Ex dolore culpa veniam ullamco reprehenderit quis.\r\nIncididunt magna esse non aliqua deserunt dolore eu dolor sint nostrud amet laboris excepteur. Ipsum nisi duis sunt ex ea pariatur incididunt commodo. Excepteur fugiat culpa commodo esse et elit incididunt aute nostrud.\r\nIrure velit ex voluptate excepteur pariatur voluptate Lorem sunt esse quis. Qui velit reprehenderit eiusmod laborum ad enim ullamco ipsum id eiusmod dolor proident laborum elit. Amet in est nostrud ut labore quis labore reprehenderit sit aute cillum ipsum consectetur pariatur.\r\nLaboris anim mollit ut veniam proident reprehenderit consectetur anim officia proident id. Nostrud consequat elit cillum laborum exercitation et eu Lorem. Deserunt ipsum nulla non dolore labore excepteur in amet et nostrud sit.\r\nDolore do enim reprehenderit veniam irure duis deserunt magna. Anim aliqua sit sit tempor proident deserunt elit pariatur sit tempor. Id sunt incididunt reprehenderit occaecat. Sint ea in occaecat laboris.\r\nAute in culpa exercitation laborum irure qui quis dolor eu fugiat ea. Sint excepteur eiusmod sit ex cillum ut laborum consequat dolore nulla non ullamco ullamco minim. Qui elit officia laboris et eiusmod enim commodo sint laborum magna. Eu sunt quis excepteur consectetur ipsum amet elit voluptate.\r\n",
            "html": "<p>Voluptate deserunt veniam Lorem anim fugiat sint dolor dolore cupidatat sint occaecat duis tempor. Do nulla aliqua laborum laboris deserunt in quis ea aute dolore incididunt dolore. Laboris exercitation ea eu consequat consectetur. Consectetur proident adipisicing nulla aliqua duis esse quis minim anim adipisicing eiusmod. Dolor est sint fugiat et reprehenderit ea ea amet velit eu laborum et proident ex. Fugiat ad in quis aliquip. Ex dolore culpa veniam ullamco reprehenderit quis.\r\nIncididunt magna esse non aliqua deserunt dolore eu dolor sint nostrud amet laboris excepteur. Ipsum nisi duis sunt ex ea pariatur incididunt commodo. Excepteur fugiat culpa commodo esse et elit incididunt aute nostrud.\r\nIrure velit ex voluptate excepteur pariatur voluptate Lorem sunt esse quis. Qui velit reprehenderit eiusmod laborum ad enim ullamco ipsum id eiusmod dolor proident laborum elit. Amet in est nostrud ut labore quis labore reprehenderit sit aute cillum ipsum consectetur pariatur.\r\nLaboris anim mollit ut veniam proident reprehenderit consectetur anim officia proident id. Nostrud consequat elit cillum laborum exercitation et eu Lorem. Deserunt ipsum nulla non dolore labore excepteur in amet et nostrud sit.\r\nDolore do enim reprehenderit veniam irure duis deserunt magna. Anim aliqua sit sit tempor proident deserunt elit pariatur sit tempor. Id sunt incididunt reprehenderit occaecat. Sint ea in occaecat laboris.\r\nAute in culpa exercitation laborum irure qui quis dolor eu fugiat ea. Sint excepteur eiusmod sit ex cillum ut laborum consequat dolore nulla non ullamco ullamco minim. Qui elit officia laboris et eiusmod enim commodo sint laborum magna. Eu sunt quis excepteur consectetur ipsum amet elit voluptate.\r\n</p>",
            "image": null,
            "featured": 0,
            "page": 0,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 9,
                "uuid": "743337a8-3d89-4f5e-b851-55ce6f8ea099",
                "name": "Lynne Acevedo",
                "slug": "lynne-acevedo",
                "email": "lynneacevedo@sustenza.com",
                "bio": "",
                "website": "",
                "location": "labore",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-05-16T21:08:34.212 +04:00",
                "updated_at": "2012-01-01T07:26:07.296 +05:00"
            },
            "created_at": "2013-05-10T14:01:44.575 +04:00",
            "created_by": {
                "id": 0,
                "uuid": "82632a19-3c85-4e3d-b906-004b31c76916",
                "name": "Tillman Mullins",
                "slug": "tillman-mullins",
                "email": "tillmanmullins@sustenza.com",
                "bio": "",
                "website": "",
                "location": "enim",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-11-16T23:13:15.578 +05:00",
                "updated_at": "2013-07-13T13:16:52.339 +04:00"
            },
            "updated_at": "2013-08-27T21:27:37.860 +04:00",
            "updated_by": {
                "id": 7,
                "uuid": "aa07b7ce-6a2a-4ba5-b4a5-bb64bcd8293f",
                "name": "Rice Solomon",
                "slug": "rice-solomon",
                "email": "ricesolomon@sustenza.com",
                "bio": "",
                "website": "",
                "location": "officia",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-05-14T15:20:08.549 +04:00",
                "updated_at": "2012-11-17T22:26:50.302 +05:00"
            },
            "published_at": "2012-10-25T03:04:54.144 +04:00",
            "published_by": {
                "id": 2,
                "uuid": "f5466031-0d71-44a5-8dbc-212b3e016c5f",
                "name": "Glass Justice",
                "slug": "glass-justice",
                "email": "glassjustice@sustenza.com",
                "bio": "",
                "website": "",
                "location": "exercitation aute dolor",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-05-28T10:01:04.360 +04:00",
                "updated_at": "2013-09-08T18:54:00.931 +04:00"
            },
            "tags": []
        },
        {
            "id": 2,
            "uuid": "da61a710-8267-40f0-853c-c6d3e68f23ec",
            "status": "draft",
            "title": "nostrud voluptate",
            "slug": "nostrud-voluptate",
            "markdown": "Consequat non aute consequat aliqua laboris nisi eiusmod. Cupidatat reprehenderit consequat dolor tempor excepteur consequat tempor dolore dolore ex aliquip. Lorem consequat quis fugiat culpa dolore. Quis Lorem magna ullamco aute voluptate ut labore culpa nulla minim dolor ad laborum commodo. Cupidatat enim magna irure enim dolore non tempor ullamco ad proident aute dolore veniam exercitation. Deserunt adipisicing ad consectetur quis. Consectetur cupidatat sint tempor elit Lorem Lorem.\r\nIn tempor id fugiat dolore non anim. Culpa veniam laborum excepteur aliquip ullamco. Tempor labore ex et ipsum qui occaecat laborum officia. Officia tempor ullamco adipisicing fugiat est. Irure enim mollit ipsum culpa non ad. Aliqua eiusmod ut occaecat aliqua dolore occaecat ut esse eiusmod qui.\r\n",
            "html": "<p>Consequat non aute consequat aliqua laboris nisi eiusmod. Cupidatat reprehenderit consequat dolor tempor excepteur consequat tempor dolore dolore ex aliquip. Lorem consequat quis fugiat culpa dolore. Quis Lorem magna ullamco aute voluptate ut labore culpa nulla minim dolor ad laborum commodo. Cupidatat enim magna irure enim dolore non tempor ullamco ad proident aute dolore veniam exercitation. Deserunt adipisicing ad consectetur quis. Consectetur cupidatat sint tempor elit Lorem Lorem.\r\nIn tempor id fugiat dolore non anim. Culpa veniam laborum excepteur aliquip ullamco. Tempor labore ex et ipsum qui occaecat laborum officia. Officia tempor ullamco adipisicing fugiat est. Irure enim mollit ipsum culpa non ad. Aliqua eiusmod ut occaecat aliqua dolore occaecat ut esse eiusmod qui.\r\n</p>",
            "image": null,
            "featured": 0,
            "page": 3,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 10,
                "uuid": "4296ad81-232b-4fe7-85b5-fcaae7b307de",
                "name": "Vonda Fletcher",
                "slug": "vonda-fletcher",
                "email": "vondafletcher@sustenza.com",
                "bio": "",
                "website": "",
                "location": "amet et fugiat",
                "status": "active",
                "language": "en_US",
                "created_at": "2014-01-03T06:30:17.812 +05:00",
                "updated_at": "2013-06-18T05:21:49.471 +04:00"
            },
            "created_at": "2012-08-14T22:36:39.584 +04:00",
            "created_by": {
                "id": 9,
                "uuid": "09a76245-d0c6-4eee-acd7-120a42c26361",
                "name": "Therese Sullivan",
                "slug": "therese-sullivan",
                "email": "theresesullivan@sustenza.com",
                "bio": "",
                "website": "",
                "location": "nulla sunt aute",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-10-28T08:30:09.129 +04:00",
                "updated_at": "2014-02-20T02:57:21.598 +05:00"
            },
            "updated_at": "2012-06-02T17:29:12.180 +04:00",
            "updated_by": {
                "id": 4,
                "uuid": "5f569369-2f1f-49cf-8d74-00135a0f7620",
                "name": "Catherine Duncan",
                "slug": "catherine-duncan",
                "email": "catherineduncan@sustenza.com",
                "bio": "",
                "website": "",
                "location": "pariatur",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-09-27T03:39:10.992 +04:00",
                "updated_at": "2013-09-14T17:52:52.463 +04:00"
            },
            "published_at": "2013-04-18T12:30:43.830 +04:00",
            "published_by": {
                "id": 0,
                "uuid": "dd01aa97-33bf-4eee-8d8d-70fe72c524bf",
                "name": "Araceli Mcdowell",
                "slug": "araceli-mcdowell",
                "email": "aracelimcdowell@sustenza.com",
                "bio": "",
                "website": "",
                "location": "ad et labore",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-03-20T00:02:21.363 +04:00",
                "updated_at": "2013-11-03T14:53:30.566 +05:00"
            },
            "tags": [
                {
                    "id": 8,
                    "uuid": "6bb226ba-5a39-4aab-9f97-51e77c127649",
                    "name": "aliquip ea",
                    "slug": "aliquip-ea",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-03-07T00:22:10.435 +05:00",
                    "created_by": 0,
                    "updated_at": "2012-10-23T15:34:50.418 +04:00",
                    "updated_by": 9
                },
                {
                    "id": 95,
                    "uuid": "dd85ac1c-9ae8-4ace-99d5-011b906a90fe",
                    "name": "ex culpa reprehenderit",
                    "slug": "ex-culpa-reprehenderit",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-12-18T10:23:34.680 +05:00",
                    "created_by": 8,
                    "updated_at": "2013-08-03T06:15:51.633 +04:00",
                    "updated_by": 2
                },
                {
                    "id": 26,
                    "uuid": "7371d22c-e61f-4b91-80fa-9a00f5fbda9f",
                    "name": "dolor veniam",
                    "slug": "dolor-veniam",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-06-08T06:15:25.420 +04:00",
                    "created_by": 10,
                    "updated_at": "2012-09-08T15:32:37.477 +04:00",
                    "updated_by": 2
                },
                {
                    "id": 96,
                    "uuid": "8a79c5d0-be3f-4da9-a6ec-6ff33fafe96a",
                    "name": "dolor cillum",
                    "slug": "dolor-cillum",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-03-08T11:11:25.699 +05:00",
                    "created_by": 9,
                    "updated_at": "2012-09-13T04:59:20.886 +04:00",
                    "updated_by": 10
                },
                {
                    "id": 3,
                    "uuid": "2c2deaec-42af-454a-86ec-5d420ecb0bb2",
                    "name": "esse",
                    "slug": "esse",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-04-17T11:32:02.321 +04:00",
                    "created_by": 1,
                    "updated_at": "2013-08-16T00:48:22.648 +04:00",
                    "updated_by": 0
                },
                {
                    "id": 34,
                    "uuid": "502b1164-fbfa-4c46-b0b5-1adfb50b59b9",
                    "name": "occaecat reprehenderit et",
                    "slug": "occaecat-reprehenderit-et",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-10-20T10:15:14.034 +04:00",
                    "created_by": 6,
                    "updated_at": "2012-11-27T22:08:59.596 +05:00",
                    "updated_by": 2
                },
                {
                    "id": 56,
                    "uuid": "fe60be80-d91d-4f01-9fbf-aae1095eec92",
                    "name": "ipsum",
                    "slug": "ipsum",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-05-19T14:12:16.484 +04:00",
                    "created_by": 2,
                    "updated_at": "2014-03-09T10:11:09.831 +04:00",
                    "updated_by": 4
                },
                {
                    "id": 71,
                    "uuid": "a81d332f-15c2-47a0-a295-87574c84e8b0",
                    "name": "ex minim consequat",
                    "slug": "ex-minim-consequat",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-02-08T14:06:00.640 +05:00",
                    "created_by": 2,
                    "updated_at": "2012-03-15T11:11:26.572 +04:00",
                    "updated_by": 3
                },
                {
                    "id": 62,
                    "uuid": "111083f3-5b0f-45f3-9ebe-78de76f4f267",
                    "name": "exercitation cillum",
                    "slug": "exercitation-cillum",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-12-03T18:10:50.193 +05:00",
                    "created_by": 10,
                    "updated_at": "2012-11-12T15:19:38.944 +05:00",
                    "updated_by": 0
                }
            ]
        },
        {
            "id": 3,
            "uuid": "5a446012-772b-46bb-958f-c01c76ac65a0",
            "status": "published ",
            "title": "id",
            "slug": "id",
            "markdown": "Adipisicing duis do ea voluptate. Deserunt ad ut qui id aute enim esse ea aute fugiat dolore aliqua proident aliqua. Anim eu adipisicing nisi laboris mollit non ea quis veniam velit in. Ut voluptate nulla est cillum reprehenderit magna nulla tempor occaecat non ex aute. Nisi laborum nostrud sunt cupidatat ullamco fugiat Lorem eiusmod aliqua cillum elit culpa ut excepteur.\r\n",
            "html": "<p>Adipisicing duis do ea voluptate. Deserunt ad ut qui id aute enim esse ea aute fugiat dolore aliqua proident aliqua. Anim eu adipisicing nisi laboris mollit non ea quis veniam velit in. Ut voluptate nulla est cillum reprehenderit magna nulla tempor occaecat non ex aute. Nisi laborum nostrud sunt cupidatat ullamco fugiat Lorem eiusmod aliqua cillum elit culpa ut excepteur.\r\n</p>",
            "image": null,
            "featured": 0,
            "page": 1,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 3,
                "uuid": "8d5d4578-6bdc-49fa-bcf4-74d3ca55e8c1",
                "name": "Riggs Waller",
                "slug": "riggs-waller",
                "email": "riggswaller@sustenza.com",
                "bio": "",
                "website": "",
                "location": "dolore non",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-02-19T04:53:44.293 +05:00",
                "updated_at": "2012-04-06T18:48:20.576 +04:00"
            },
            "created_at": "2013-09-09T14:21:33.122 +04:00",
            "created_by": {
                "id": 2,
                "uuid": "864a1a58-2d94-4b9b-bfa4-1e2692b42329",
                "name": "Washington Matthews",
                "slug": "washington-matthews",
                "email": "washingtonmatthews@sustenza.com",
                "bio": "",
                "website": "",
                "location": "dolore",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-04-14T10:11:08.847 +04:00",
                "updated_at": "2013-10-28T06:36:18.648 +04:00"
            },
            "updated_at": "2012-07-25T08:29:01.155 +04:00",
            "updated_by": {
                "id": 0,
                "uuid": "642d890a-afb0-4c36-bd6c-a111305cf5e0",
                "name": "Karla Wheeler",
                "slug": "karla-wheeler",
                "email": "karlawheeler@sustenza.com",
                "bio": "",
                "website": "",
                "location": "ut non nostrud",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-07-02T14:45:29.786 +04:00",
                "updated_at": "2012-11-12T05:48:07.393 +05:00"
            },
            "published_at": "2013-03-17T21:23:08.362 +04:00",
            "published_by": {
                "id": 9,
                "uuid": "2a78fe80-c8d9-4e39-b2f9-15f12ff4110d",
                "name": "Ola Sanders",
                "slug": "ola-sanders",
                "email": "olasanders@sustenza.com",
                "bio": "",
                "website": "",
                "location": "consectetur id sint",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-01-09T05:26:15.695 +05:00",
                "updated_at": "2012-05-05T10:35:17.733 +04:00"
            },
            "tags": [
                {
                    "id": 40,
                    "uuid": "e109034a-d5ee-4ffa-b9c5-0165e916af28",
                    "name": "elit",
                    "slug": "elit",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-09-28T17:18:20.956 +04:00",
                    "created_by": 10,
                    "updated_at": "2013-09-27T11:56:40.488 +04:00",
                    "updated_by": 2
                },
                {
                    "id": 34,
                    "uuid": "146d3644-c761-4e0a-aac9-a629441aac92",
                    "name": "labore",
                    "slug": "labore",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-10-11T11:17:50.810 +04:00",
                    "created_by": 6,
                    "updated_at": "2013-01-12T14:04:38.034 +05:00",
                    "updated_by": 1
                },
                {
                    "id": 14,
                    "uuid": "3523c227-f4a6-4522-a0b3-54bd48816d90",
                    "name": "elit",
                    "slug": "elit",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-05-02T07:46:01.181 +04:00",
                    "created_by": 1,
                    "updated_at": "2012-12-21T02:31:25.261 +05:00",
                    "updated_by": 10
                },
                {
                    "id": 56,
                    "uuid": "53235310-03ee-4553-a89d-bad513050b92",
                    "name": "mollit laborum cillum",
                    "slug": "mollit-laborum-cillum",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-08-09T23:31:21.147 +04:00",
                    "created_by": 5,
                    "updated_at": "2012-05-14T23:08:12.539 +04:00",
                    "updated_by": 1
                },
                {
                    "id": 55,
                    "uuid": "edef87c5-0b20-4e70-b947-f5f88a9f2235",
                    "name": "id est mollit",
                    "slug": "id-est-mollit",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-10-14T19:51:40.659 +04:00",
                    "created_by": 9,
                    "updated_at": "2012-07-23T02:56:53.814 +04:00",
                    "updated_by": 7
                },
                {
                    "id": 72,
                    "uuid": "c2eecd37-1160-47e4-ac34-9d2b93488838",
                    "name": "qui do qui",
                    "slug": "qui-do-qui",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-01-14T12:34:10.722 +05:00",
                    "created_by": 1,
                    "updated_at": "2012-02-09T16:22:55.391 +05:00",
                    "updated_by": 0
                },
                {
                    "id": 35,
                    "uuid": "61e109cd-88e9-4ee3-ae4c-6b41ab4b6bf9",
                    "name": "elit eiusmod",
                    "slug": "elit-eiusmod",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-05-24T04:20:50.807 +04:00",
                    "created_by": 5,
                    "updated_at": "2012-08-19T19:17:38.068 +04:00",
                    "updated_by": 0
                },
                {
                    "id": 78,
                    "uuid": "d283fa2d-27d2-4d68-8d5a-d2baf89048b8",
                    "name": "tempor voluptate irure",
                    "slug": "tempor-voluptate-irure",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-08-25T02:54:08.833 +04:00",
                    "created_by": 9,
                    "updated_at": "2013-03-22T01:42:59.527 +04:00",
                    "updated_by": 7
                },
                {
                    "id": 37,
                    "uuid": "d897fffd-fb50-4c4f-91f1-517b6d2727f3",
                    "name": "voluptate aute labore",
                    "slug": "voluptate-aute-labore",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-09-17T18:53:29.681 +04:00",
                    "created_by": 0,
                    "updated_at": "2013-05-23T09:31:31.335 +04:00",
                    "updated_by": 9
                },
                {
                    "id": 10,
                    "uuid": "c08cacab-bfcd-49d5-9329-69f5813ba539",
                    "name": "adipisicing",
                    "slug": "adipisicing",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-11-13T11:50:31.480 +05:00",
                    "created_by": 1,
                    "updated_at": "2012-06-25T06:11:59.336 +04:00",
                    "updated_by": 0
                }
            ]
        },
        {
            "id": 4,
            "uuid": "8fd4d68d-5602-48d5-831f-2db55822a2ef",
            "status": "draft",
            "title": "aliquip officia",
            "slug": "aliquip-officia",
            "markdown": "Irure cillum eiusmod incididunt elit Lorem elit. Enim non excepteur labore nostrud ipsum nulla ad magna Lorem amet sint occaecat consequat. Laboris Lorem dolore adipisicing elit enim.\r\nConsequat labore fugiat minim consectetur dolor duis cupidatat. Amet laborum reprehenderit minim commodo dolor. Amet exercitation eiusmod labore laborum excepteur occaecat velit irure officia aliqua incididunt sit. Et ut adipisicing elit irure dolore commodo ea. Do elit nisi consequat esse officia ea. Aliquip excepteur cupidatat sunt deserunt aute Lorem est sunt aliqua officia velit enim ex.\r\n",
            "html": "<p>Irure cillum eiusmod incididunt elit Lorem elit. Enim non excepteur labore nostrud ipsum nulla ad magna Lorem amet sint occaecat consequat. Laboris Lorem dolore adipisicing elit enim.\r\nConsequat labore fugiat minim consectetur dolor duis cupidatat. Amet laborum reprehenderit minim commodo dolor. Amet exercitation eiusmod labore laborum excepteur occaecat velit irure officia aliqua incididunt sit. Et ut adipisicing elit irure dolore commodo ea. Do elit nisi consequat esse officia ea. Aliquip excepteur cupidatat sunt deserunt aute Lorem est sunt aliqua officia velit enim ex.\r\n</p>",
            "image": null,
            "featured": 0,
            "page": 6,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 4,
                "uuid": "9cec59b8-bc7a-4032-a5af-bafcedac9ea6",
                "name": "Leonard Rosales",
                "slug": "leonard-rosales",
                "email": "leonardrosales@sustenza.com",
                "bio": "",
                "website": "",
                "location": "quis nostrud magna",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-03-15T07:28:35.856 +04:00",
                "updated_at": "2012-03-17T08:58:46.679 +04:00"
            },
            "created_at": "2013-09-05T00:16:53.771 +04:00",
            "created_by": {
                "id": 9,
                "uuid": "e45551d6-ece1-4ae4-8760-27221cecc362",
                "name": "Soto Ewing",
                "slug": "soto-ewing",
                "email": "sotoewing@sustenza.com",
                "bio": "",
                "website": "",
                "location": "aliquip ea",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-12-01T05:34:43.792 +05:00",
                "updated_at": "2013-06-07T03:36:39.671 +04:00"
            },
            "updated_at": "2012-06-24T23:03:08.551 +04:00",
            "updated_by": {
                "id": 0,
                "uuid": "4dc4ec5f-739a-453a-99ed-04e56c4206f5",
                "name": "Bauer Bright",
                "slug": "bauer-bright",
                "email": "bauerbright@sustenza.com",
                "bio": "",
                "website": "",
                "location": "consectetur dolor proident",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-06-15T04:55:15.134 +04:00",
                "updated_at": "2014-03-29T02:51:10.913 +04:00"
            },
            "published_at": "2012-10-26T17:57:14.179 +04:00",
            "published_by": {
                "id": 7,
                "uuid": "0bb46f8b-1e8d-4bcb-9833-9a3cdf14b27f",
                "name": "Wood Hood",
                "slug": "wood-hood",
                "email": "woodhood@sustenza.com",
                "bio": "",
                "website": "",
                "location": "enim dolor sit",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-07-23T11:16:36.417 +04:00",
                "updated_at": "2014-02-20T13:49:32.657 +05:00"
            },
            "tags": [
                {
                    "id": 82,
                    "uuid": "fd0a551c-86ca-40ea-be5a-e57e2a319649",
                    "name": "deserunt mollit",
                    "slug": "deserunt-mollit",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-04-24T19:02:29.056 +04:00",
                    "created_by": 1,
                    "updated_at": "2013-03-02T20:45:37.532 +05:00",
                    "updated_by": 10
                },
                {
                    "id": 49,
                    "uuid": "bb568f28-be77-4921-88ec-25bd72fd2cc2",
                    "name": "occaecat voluptate est",
                    "slug": "occaecat-voluptate-est",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-08-04T12:28:16.741 +04:00",
                    "created_by": 4,
                    "updated_at": "2012-05-01T07:37:16.839 +04:00",
                    "updated_by": 4
                },
                {
                    "id": 36,
                    "uuid": "c0ea2013-3f30-4e50-9452-43722500d170",
                    "name": "ut",
                    "slug": "ut",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-03-29T07:18:41.028 +04:00",
                    "created_by": 5,
                    "updated_at": "2013-09-22T17:50:02.713 +04:00",
                    "updated_by": 1
                },
                {
                    "id": 80,
                    "uuid": "e793051e-1344-4d07-9142-ca31fd545a3f",
                    "name": "laborum",
                    "slug": "laborum",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-12-22T22:18:53.287 +05:00",
                    "created_by": 0,
                    "updated_at": "2013-09-30T11:39:48.773 +04:00",
                    "updated_by": 5
                },
                {
                    "id": 95,
                    "uuid": "48304f75-5927-4ba2-a4aa-2d883908d8fe",
                    "name": "ut magna",
                    "slug": "ut-magna",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-05-31T20:31:07.936 +04:00",
                    "created_by": 6,
                    "updated_at": "2013-05-23T15:11:35.821 +04:00",
                    "updated_by": 0
                },
                {
                    "id": 97,
                    "uuid": "855eaf91-1a36-4f59-9aef-972d7885524a",
                    "name": "laboris minim",
                    "slug": "laboris-minim",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-07-08T04:09:18.425 +04:00",
                    "created_by": 3,
                    "updated_at": "2012-03-21T10:17:45.196 +04:00",
                    "updated_by": 7
                },
                {
                    "id": 52,
                    "uuid": "24ec5385-d81d-4745-9df6-3fb327fcdd95",
                    "name": "magna",
                    "slug": "magna",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-04-27T22:28:03.050 +04:00",
                    "created_by": 1,
                    "updated_at": "2014-03-23T02:17:26.093 +04:00",
                    "updated_by": 3
                },
                {
                    "id": 84,
                    "uuid": "8996caf5-c43c-4ae1-b46b-d81ec0dd1343",
                    "name": "duis",
                    "slug": "duis",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-06-26T23:34:27.907 +04:00",
                    "created_by": 0,
                    "updated_at": "2014-01-30T17:51:51.992 +05:00",
                    "updated_by": 5
                }
            ]
        },
        {
            "id": 5,
            "uuid": "5b4df548-1d2b-462f-9b5f-5dc3cff8c0f8",
            "status": "published ",
            "title": "et aute sunt",
            "slug": "et-aute-sunt",
            "markdown": "Ea cupidatat deserunt anim occaecat in in do mollit proident culpa sit magna duis sunt. Id sit reprehenderit do esse proident fugiat dolore eu amet nulla elit nostrud amet. Ut sunt quis ex ullamco labore non eiusmod adipisicing cupidatat dolore. Anim quis nostrud proident tempor. Fugiat quis aliquip culpa cupidatat commodo. Ut voluptate anim est occaecat.\r\nVoluptate sunt et incididunt culpa esse anim tempor cillum nisi eu aliquip. Magna magna commodo cillum officia. Esse aute occaecat culpa minim pariatur veniam dolore exercitation laborum laborum aliqua enim. Ex velit exercitation consectetur ad amet minim culpa occaecat in est elit adipisicing non fugiat.\r\nOccaecat dolor consequat laboris officia esse in ut duis qui adipisicing. Laboris exercitation cupidatat anim aute laboris reprehenderit officia nulla amet labore officia ex eiusmod. Lorem ut sunt deserunt pariatur nulla reprehenderit cupidatat in excepteur duis nisi veniam in.\r\nConsequat dolore in occaecat do minim ut fugiat irure velit. Aliqua est fugiat quis occaecat eiusmod irure anim exercitation nisi aliquip occaecat sint fugiat. Et velit eu ea aute occaecat aliqua sit irure aliqua. Pariatur irure amet deserunt Lorem nisi proident.\r\nCillum minim consectetur cupidatat fugiat est cupidatat. Eu est in cupidatat veniam occaecat occaecat commodo eiusmod officia mollit. Ad enim eu minim occaecat eiusmod ad sint id. Exercitation mollit sunt sit do minim adipisicing.\r\n",
            "html": "<p>Ea cupidatat deserunt anim occaecat in in do mollit proident culpa sit magna duis sunt. Id sit reprehenderit do esse proident fugiat dolore eu amet nulla elit nostrud amet. Ut sunt quis ex ullamco labore non eiusmod adipisicing cupidatat dolore. Anim quis nostrud proident tempor. Fugiat quis aliquip culpa cupidatat commodo. Ut voluptate anim est occaecat.\r\nVoluptate sunt et incididunt culpa esse anim tempor cillum nisi eu aliquip. Magna magna commodo cillum officia. Esse aute occaecat culpa minim pariatur veniam dolore exercitation laborum laborum aliqua enim. Ex velit exercitation consectetur ad amet minim culpa occaecat in est elit adipisicing non fugiat.\r\nOccaecat dolor consequat laboris officia esse in ut duis qui adipisicing. Laboris exercitation cupidatat anim aute laboris reprehenderit officia nulla amet labore officia ex eiusmod. Lorem ut sunt deserunt pariatur nulla reprehenderit cupidatat in excepteur duis nisi veniam in.\r\nConsequat dolore in occaecat do minim ut fugiat irure velit. Aliqua est fugiat quis occaecat eiusmod irure anim exercitation nisi aliquip occaecat sint fugiat. Et velit eu ea aute occaecat aliqua sit irure aliqua. Pariatur irure amet deserunt Lorem nisi proident.\r\nCillum minim consectetur cupidatat fugiat est cupidatat. Eu est in cupidatat veniam occaecat occaecat commodo eiusmod officia mollit. Ad enim eu minim occaecat eiusmod ad sint id. Exercitation mollit sunt sit do minim adipisicing.\r\n</p>",
            "image": null,
            "featured": 1,
            "page": 2,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 0,
                "uuid": "2d552d58-52b7-4d9b-bcdb-da5e388b890a",
                "name": "Warner Camacho",
                "slug": "warner-camacho",
                "email": "warnercamacho@sustenza.com",
                "bio": "",
                "website": "",
                "location": "reprehenderit officia",
                "status": "active",
                "language": "en_US",
                "created_at": "2014-01-17T02:28:25.946 +05:00",
                "updated_at": "2012-09-14T19:47:36.006 +04:00"
            },
            "created_at": "2012-06-28T08:50:47.620 +04:00",
            "created_by": {
                "id": 2,
                "uuid": "1ec8f190-e95e-4b9a-9a57-d3250133c9ff",
                "name": "Carson Ferguson",
                "slug": "carson-ferguson",
                "email": "carsonferguson@sustenza.com",
                "bio": "",
                "website": "",
                "location": "reprehenderit eiusmod sint",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-04-23T05:46:17.461 +04:00",
                "updated_at": "2012-01-27T22:49:01.834 +05:00"
            },
            "updated_at": "2014-02-17T19:03:53.703 +05:00",
            "updated_by": {
                "id": 6,
                "uuid": "b9b6f261-cfde-4538-b217-3990c8b6ee35",
                "name": "Mable Shaw",
                "slug": "mable-shaw",
                "email": "mableshaw@sustenza.com",
                "bio": "",
                "website": "",
                "location": "reprehenderit",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-04-24T18:51:21.550 +04:00",
                "updated_at": "2012-03-23T12:52:33.431 +04:00"
            },
            "published_at": "2013-06-10T14:52:29.166 +04:00",
            "published_by": {
                "id": 6,
                "uuid": "928cf9ff-1a22-448b-bb07-e4a154e25da0",
                "name": "Lott Finch",
                "slug": "lott-finch",
                "email": "lottfinch@sustenza.com",
                "bio": "",
                "website": "",
                "location": "ullamco sint id",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-08-10T08:07:11.161 +04:00",
                "updated_at": "2012-05-26T03:58:07.968 +04:00"
            },
            "tags": [
                {
                    "id": 37,
                    "uuid": "3dea4b2d-8c49-4a4f-b7d1-d27f252b9a0d",
                    "name": "enim et",
                    "slug": "enim-et",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-12-23T05:12:07.929 +05:00",
                    "created_by": 10,
                    "updated_at": "2014-02-07T02:10:43.192 +05:00",
                    "updated_by": 6
                },
                {
                    "id": 13,
                    "uuid": "a5441e00-fdb0-4d6c-96dc-481334e6dc23",
                    "name": "velit cupidatat",
                    "slug": "velit-cupidatat",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-01-23T02:35:47.506 +05:00",
                    "created_by": 6,
                    "updated_at": "2013-03-06T01:23:44.641 +05:00",
                    "updated_by": 8
                },
                {
                    "id": 36,
                    "uuid": "9d210f41-1fe7-4856-9982-1f739ad258af",
                    "name": "proident ipsum",
                    "slug": "proident-ipsum",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-01-12T02:14:06.917 +05:00",
                    "created_by": 9,
                    "updated_at": "2012-02-15T10:17:46.144 +05:00",
                    "updated_by": 1
                },
                {
                    "id": 19,
                    "uuid": "cb05c3f9-17c9-4307-aa52-0b7756700616",
                    "name": "ipsum amet",
                    "slug": "ipsum-amet",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-07-20T03:33:54.117 +04:00",
                    "created_by": 6,
                    "updated_at": "2012-03-22T11:00:42.200 +04:00",
                    "updated_by": 8
                },
                {
                    "id": 37,
                    "uuid": "377308ff-21a4-4558-b5c3-52f80ba0130f",
                    "name": "fugiat proident",
                    "slug": "fugiat-proident",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-08-08T15:58:50.904 +04:00",
                    "created_by": 7,
                    "updated_at": "2014-04-20T19:31:39.230 +04:00",
                    "updated_by": 0
                },
                {
                    "id": 97,
                    "uuid": "a3ff4a3f-aa18-42a9-bb51-68e34ac657b6",
                    "name": "sit",
                    "slug": "sit",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-02-25T08:00:08.889 +05:00",
                    "created_by": 9,
                    "updated_at": "2014-01-19T07:46:51.083 +05:00",
                    "updated_by": 5
                },
                {
                    "id": 97,
                    "uuid": "9d0d44fc-ffba-4cc0-906f-9cedd0865cf9",
                    "name": "non sit",
                    "slug": "non-sit",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-04-11T21:52:37.090 +04:00",
                    "created_by": 7,
                    "updated_at": "2013-05-01T18:21:44.436 +04:00",
                    "updated_by": 1
                }
            ]
        },
        {
            "id": 6,
            "uuid": "258b02c2-df02-4f99-959a-40214850055a",
            "status": "draft",
            "title": "nostrud adipisicing ut nisi deserunt magna Lorem id id in",
            "slug": "nostrud-adipisicing-ut-nisi-deserunt-magna-Lorem-id-id-in",
            "markdown": "Cupidatat mollit exercitation labore esse. Eu deserunt duis eiusmod dolore deserunt. Veniam adipisicing dolore fugiat qui Lorem nulla mollit. Quis ad labore cillum elit aute aliquip voluptate mollit ipsum proident laboris.\r\nMagna ex aliquip commodo elit excepteur. Consequat fugiat exercitation dolor ut. Sint eiusmod culpa fugiat proident non ex id et commodo officia ex eiusmod Lorem duis. Cillum magna commodo reprehenderit deserunt voluptate proident do adipisicing cillum mollit anim proident pariatur. Laborum sit consectetur tempor ea ullamco adipisicing. Sit proident tempor Lorem adipisicing reprehenderit sunt sit eu cillum culpa proident ad cupidatat. Deserunt cillum eu tempor consectetur mollit reprehenderit consectetur in quis ea cillum ut sint.\r\nTempor cupidatat id nostrud sint mollit cupidatat eiusmod labore ullamco cillum pariatur. Non pariatur adipisicing nulla proident officia aliquip cupidatat sit culpa officia aliquip. Reprehenderit duis irure incididunt occaecat. Sint voluptate cupidatat aliqua sint pariatur ex eu deserunt reprehenderit eu ipsum velit do esse. Nisi in eiusmod incididunt ullamco aliquip non. Proident amet sint proident cillum Lorem irure Lorem officia sint.\r\nFugiat adipisicing exercitation adipisicing anim aliqua aliquip. Excepteur velit pariatur laboris proident anim esse non ea exercitation cupidatat. Amet nulla aute velit exercitation minim est commodo aliquip cillum ex. Ex eu tempor aliqua nulla adipisicing elit non sunt.\r\nTempor exercitation dolor ex aliqua irure laboris occaecat tempor. Reprehenderit elit fugiat ut minim consequat sint eu culpa dolor pariatur magna. Ex deserunt laboris eiusmod ipsum adipisicing. Quis reprehenderit est ullamco ipsum proident enim duis veniam. Ipsum esse veniam culpa exercitation ipsum sit pariatur amet amet est aliqua tempor sint. Ad sint consectetur cillum est.\r\nIn ut labore cillum nisi. Nostrud dolor laborum enim labore. Cillum qui magna fugiat proident occaecat amet ad duis sit ullamco fugiat in. Do et incididunt dolore aliquip ad magna do Lorem elit ea enim. Ea aliquip fugiat magna amet nostrud commodo mollit. Voluptate culpa adipisicing ut irure veniam veniam.\r\nId aliqua dolore voluptate aliqua sit non ex fugiat officia laborum commodo. Exercitation irure veniam eu officia cupidatat. Ex mollit fugiat do sit non aliqua nostrud sint est. Ad eiusmod non labore do ea aliquip duis laborum non Lorem sit id ut. Reprehenderit aliqua adipisicing nostrud adipisicing id ad duis.\r\n",
            "html": "<p>Cupidatat mollit exercitation labore esse. Eu deserunt duis eiusmod dolore deserunt. Veniam adipisicing dolore fugiat qui Lorem nulla mollit. Quis ad labore cillum elit aute aliquip voluptate mollit ipsum proident laboris.\r\nMagna ex aliquip commodo elit excepteur. Consequat fugiat exercitation dolor ut. Sint eiusmod culpa fugiat proident non ex id et commodo officia ex eiusmod Lorem duis. Cillum magna commodo reprehenderit deserunt voluptate proident do adipisicing cillum mollit anim proident pariatur. Laborum sit consectetur tempor ea ullamco adipisicing. Sit proident tempor Lorem adipisicing reprehenderit sunt sit eu cillum culpa proident ad cupidatat. Deserunt cillum eu tempor consectetur mollit reprehenderit consectetur in quis ea cillum ut sint.\r\nTempor cupidatat id nostrud sint mollit cupidatat eiusmod labore ullamco cillum pariatur. Non pariatur adipisicing nulla proident officia aliquip cupidatat sit culpa officia aliquip. Reprehenderit duis irure incididunt occaecat. Sint voluptate cupidatat aliqua sint pariatur ex eu deserunt reprehenderit eu ipsum velit do esse. Nisi in eiusmod incididunt ullamco aliquip non. Proident amet sint proident cillum Lorem irure Lorem officia sint.\r\nFugiat adipisicing exercitation adipisicing anim aliqua aliquip. Excepteur velit pariatur laboris proident anim esse non ea exercitation cupidatat. Amet nulla aute velit exercitation minim est commodo aliquip cillum ex. Ex eu tempor aliqua nulla adipisicing elit non sunt.\r\nTempor exercitation dolor ex aliqua irure laboris occaecat tempor. Reprehenderit elit fugiat ut minim consequat sint eu culpa dolor pariatur magna. Ex deserunt laboris eiusmod ipsum adipisicing. Quis reprehenderit est ullamco ipsum proident enim duis veniam. Ipsum esse veniam culpa exercitation ipsum sit pariatur amet amet est aliqua tempor sint. Ad sint consectetur cillum est.\r\nIn ut labore cillum nisi. Nostrud dolor laborum enim labore. Cillum qui magna fugiat proident occaecat amet ad duis sit ullamco fugiat in. Do et incididunt dolore aliquip ad magna do Lorem elit ea enim. Ea aliquip fugiat magna amet nostrud commodo mollit. Voluptate culpa adipisicing ut irure veniam veniam.\r\nId aliqua dolore voluptate aliqua sit non ex fugiat officia laborum commodo. Exercitation irure veniam eu officia cupidatat. Ex mollit fugiat do sit non aliqua nostrud sint est. Ad eiusmod non labore do ea aliquip duis laborum non Lorem sit id ut. Reprehenderit aliqua adipisicing nostrud adipisicing id ad duis.\r\n</p>",
            "image": null,
            "featured": 0,
            "page": 10,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 2,
                "uuid": "af1e6ddd-6079-41b4-997c-df500e39e49d",
                "name": "Finley Dominguez",
                "slug": "finley-dominguez",
                "email": "finleydominguez@sustenza.com",
                "bio": "",
                "website": "",
                "location": "consectetur laborum eiusmod",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-01-20T06:49:13.434 +05:00",
                "updated_at": "2012-04-14T10:20:53.970 +04:00"
            },
            "created_at": "2014-04-26T11:37:55.769 +04:00",
            "created_by": {
                "id": 0,
                "uuid": "79d41569-4ebe-4092-b261-7d1d07caa13c",
                "name": "Diaz Blevins",
                "slug": "diaz-blevins",
                "email": "diazblevins@sustenza.com",
                "bio": "",
                "website": "",
                "location": "pariatur quis laborum",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-10-13T18:50:19.012 +04:00",
                "updated_at": "2013-07-24T06:17:31.924 +04:00"
            },
            "updated_at": "2014-03-14T06:12:55.913 +04:00",
            "updated_by": {
                "id": 1,
                "uuid": "d9a8986c-8c25-4517-b678-4d958d5469f0",
                "name": "Cecilia Hull",
                "slug": "cecilia-hull",
                "email": "ceciliahull@sustenza.com",
                "bio": "",
                "website": "",
                "location": "elit",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-06-10T10:07:09.748 +04:00",
                "updated_at": "2013-03-04T23:21:43.983 +05:00"
            },
            "published_at": "2013-07-17T03:38:49.749 +04:00",
            "published_by": {
                "id": 1,
                "uuid": "9a21e2a0-b393-47e6-a7f9-3f623122d36b",
                "name": "Nola Landry",
                "slug": "nola-landry",
                "email": "nolalandry@sustenza.com",
                "bio": "",
                "website": "",
                "location": "aute",
                "status": "active",
                "language": "en_US",
                "created_at": "2014-04-21T12:13:17.218 +04:00",
                "updated_at": "2013-06-27T16:27:21.428 +04:00"
            },
            "tags": []
        },
        {
            "id": 7,
            "uuid": "d3b49bf3-099e-4591-9394-9b91025142ce",
            "status": "draft",
            "title": "fugiat fugiat ad adipisicing anim",
            "slug": "fugiat-fugiat-ad-adipisicing-anim",
            "markdown": "Sunt nostrud ut duis proident dolore aute non excepteur. Aliquip ea aliqua do magna culpa commodo proident esse nostrud dolor irure ut exercitation tempor. Proident enim cupidatat reprehenderit nisi cupidatat fugiat ut irure incididunt et magna.\r\n",
            "html": "<p>Sunt nostrud ut duis proident dolore aute non excepteur. Aliquip ea aliqua do magna culpa commodo proident esse nostrud dolor irure ut exercitation tempor. Proident enim cupidatat reprehenderit nisi cupidatat fugiat ut irure incididunt et magna.\r\n</p>",
            "image": null,
            "featured": 1,
            "page": 10,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 6,
                "uuid": "4dc6783a-cb6a-4e41-a446-6a019baad0dd",
                "name": "Brittney Mcleod",
                "slug": "brittney-mcleod",
                "email": "brittneymcleod@sustenza.com",
                "bio": "",
                "website": "",
                "location": "officia",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-02-18T17:22:13.683 +05:00",
                "updated_at": "2013-01-22T09:34:01.420 +05:00"
            },
            "created_at": "2012-12-26T21:49:19.111 +05:00",
            "created_by": {
                "id": 3,
                "uuid": "e670c349-b44c-4c9c-9872-844b7f3452e0",
                "name": "Dorothy Hendricks",
                "slug": "dorothy-hendricks",
                "email": "dorothyhendricks@sustenza.com",
                "bio": "",
                "website": "",
                "location": "commodo cillum esse",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-01-01T23:14:26.319 +05:00",
                "updated_at": "2013-11-30T20:37:22.175 +05:00"
            },
            "updated_at": "2013-12-19T21:59:14.778 +05:00",
            "updated_by": {
                "id": 2,
                "uuid": "d2949956-8b48-494e-b5de-793ed9e5ef08",
                "name": "Holloway Rosario",
                "slug": "holloway-rosario",
                "email": "hollowayrosario@sustenza.com",
                "bio": "",
                "website": "",
                "location": "sit",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-07-28T00:04:34.200 +04:00",
                "updated_at": "2012-03-29T09:47:16.045 +04:00"
            },
            "published_at": "2012-05-16T03:47:23.585 +04:00",
            "published_by": {
                "id": 4,
                "uuid": "df9899c5-be55-41b6-9bbf-3cb4de208dc9",
                "name": "Chandler Booker",
                "slug": "chandler-booker",
                "email": "chandlerbooker@sustenza.com",
                "bio": "",
                "website": "",
                "location": "voluptate nostrud qui",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-04-26T04:50:37.468 +04:00",
                "updated_at": "2012-01-28T16:29:51.611 +05:00"
            },
            "tags": [
                {
                    "id": 29,
                    "uuid": "46ce9a58-2e04-44b2-8891-257169f6029e",
                    "name": "et duis sunt",
                    "slug": "et-duis-sunt",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-10-26T11:52:42.636 +04:00",
                    "created_by": 4,
                    "updated_at": "2013-03-03T12:25:47.484 +05:00",
                    "updated_by": 6
                },
                {
                    "id": 33,
                    "uuid": "8df7970c-e01d-4aaa-97f5-e8702b639302",
                    "name": "cupidatat",
                    "slug": "cupidatat",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-04-04T16:54:31.714 +04:00",
                    "created_by": 0,
                    "updated_at": "2012-06-03T17:38:15.800 +04:00",
                    "updated_by": 3
                },
                {
                    "id": 3,
                    "uuid": "351b94fa-6f8e-43c8-b7d3-32bf95587eab",
                    "name": "laboris",
                    "slug": "laboris",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-11-07T07:36:55.260 +05:00",
                    "created_by": 2,
                    "updated_at": "2013-09-06T05:16:25.961 +04:00",
                    "updated_by": 6
                },
                {
                    "id": 33,
                    "uuid": "cbfeeb02-bd2e-4632-95ce-d3356741c414",
                    "name": "consectetur commodo Lorem",
                    "slug": "consectetur-commodo-lorem",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-02-27T20:35:16.139 +05:00",
                    "created_by": 3,
                    "updated_at": "2013-10-13T01:47:29.395 +04:00",
                    "updated_by": 7
                },
                {
                    "id": 93,
                    "uuid": "3c2eb831-4db0-438d-8798-1b9e6af319d0",
                    "name": "excepteur",
                    "slug": "excepteur",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-03-16T06:22:30.000 +04:00",
                    "created_by": 3,
                    "updated_at": "2013-03-07T19:07:26.475 +05:00",
                    "updated_by": 5
                }
            ]
        },
        {
            "id": 8,
            "uuid": "309280e4-8260-416f-a647-db31c30699f7",
            "status": "draft",
            "title": "aute ut",
            "slug": "aute-ut",
            "markdown": "Irure voluptate tempor ut occaecat labore ullamco. Do irure mollit cillum eu id excepteur. Cupidatat velit aliqua Lorem aliqua qui incididunt duis nisi aute mollit anim ad sunt qui. Laborum sit occaecat magna reprehenderit aute dolor elit. Velit voluptate sit nulla exercitation tempor irure eu cillum. Quis elit sunt nisi velit minim dolor laboris eu.\r\nNon ipsum fugiat culpa sint incididunt qui do et ex. Dolor culpa excepteur consectetur ullamco. Anim adipisicing aliquip officia labore excepteur minim irure culpa commodo do. Fugiat nisi labore non anim esse anim magna tempor qui laboris commodo laboris Lorem nisi. Aliquip amet adipisicing minim quis id est et.\r\nAliqua irure officia aliquip minim minim reprehenderit id. Ipsum mollit consectetur in eiusmod. Laborum veniam magna incididunt non eu mollit est qui dolor. Nostrud reprehenderit deserunt incididunt sunt qui officia anim aute irure quis nostrud.\r\nQui officia Lorem veniam elit deserunt minim anim. Sit non labore sit dolor sint ad sunt mollit est. Ipsum ex cillum ipsum ex exercitation ut culpa laborum elit sint velit deserunt eiusmod. Minim velit veniam aliquip cillum eiusmod. Ipsum duis dolor duis ex elit officia voluptate enim esse esse cupidatat do consectetur. Mollit adipisicing eiusmod ea laboris officia esse labore incididunt minim.\r\nEu nulla enim adipisicing eiusmod occaecat sunt amet sint pariatur nisi ut. Laborum pariatur consequat ea aute laboris adipisicing irure cupidatat culpa ut aute esse ut. Nostrud tempor laboris aute deserunt Lorem. Labore et pariatur enim minim dolore elit qui enim nostrud sit ut incididunt cillum.\r\nSit laborum commodo sunt consectetur elit eu proident cupidatat amet aliquip ea sint Lorem. Incididunt ex adipisicing minim eu in commodo velit excepteur anim. Ex magna magna ut incididunt sunt excepteur esse magna pariatur. Est aliqua deserunt labore nulla laborum esse non excepteur. Tempor consectetur Lorem incididunt officia consequat. Id magna voluptate ex sunt enim labore reprehenderit dolor est eu eu labore.\r\nAliquip do esse et proident fugiat dolore nisi elit qui adipisicing. Velit cillum deserunt ea velit consectetur ad commodo eu anim. Nulla deserunt consectetur tempor commodo adipisicing amet cillum veniam et ipsum ex est veniam. Fugiat ullamco non exercitation ullamco labore id incididunt pariatur dolore.\r\nQui quis dolor quis nulla aute laborum aliquip dolore cupidatat nulla. Voluptate eiusmod nisi cillum do occaecat commodo elit reprehenderit minim amet. Quis amet voluptate sint cillum minim elit nulla ea adipisicing eiusmod.\r\nExercitation exercitation laborum laborum exercitation sint eiusmod velit nulla ea culpa ex. Ullamco proident nulla sunt duis ut. Laboris irure occaecat labore eiusmod consectetur ut sint dolor. Enim Lorem ea sint ex reprehenderit proident quis consequat aliquip laborum non.\r\nUllamco reprehenderit sint et nisi dolor excepteur irure excepteur minim sint proident officia. Nisi Lorem voluptate esse velit sunt exercitation adipisicing in. Nostrud do nulla do quis laboris deserunt cupidatat velit enim consequat reprehenderit ea aliqua veniam. Dolor laboris voluptate non non aliquip. Ex Lorem do ut sunt culpa voluptate.\r\n",
            "html": "<p>Irure voluptate tempor ut occaecat labore ullamco. Do irure mollit cillum eu id excepteur. Cupidatat velit aliqua Lorem aliqua qui incididunt duis nisi aute mollit anim ad sunt qui. Laborum sit occaecat magna reprehenderit aute dolor elit. Velit voluptate sit nulla exercitation tempor irure eu cillum. Quis elit sunt nisi velit minim dolor laboris eu.\r\nNon ipsum fugiat culpa sint incididunt qui do et ex. Dolor culpa excepteur consectetur ullamco. Anim adipisicing aliquip officia labore excepteur minim irure culpa commodo do. Fugiat nisi labore non anim esse anim magna tempor qui laboris commodo laboris Lorem nisi. Aliquip amet adipisicing minim quis id est et.\r\nAliqua irure officia aliquip minim minim reprehenderit id. Ipsum mollit consectetur in eiusmod. Laborum veniam magna incididunt non eu mollit est qui dolor. Nostrud reprehenderit deserunt incididunt sunt qui officia anim aute irure quis nostrud.\r\nQui officia Lorem veniam elit deserunt minim anim. Sit non labore sit dolor sint ad sunt mollit est. Ipsum ex cillum ipsum ex exercitation ut culpa laborum elit sint velit deserunt eiusmod. Minim velit veniam aliquip cillum eiusmod. Ipsum duis dolor duis ex elit officia voluptate enim esse esse cupidatat do consectetur. Mollit adipisicing eiusmod ea laboris officia esse labore incididunt minim.\r\nEu nulla enim adipisicing eiusmod occaecat sunt amet sint pariatur nisi ut. Laborum pariatur consequat ea aute laboris adipisicing irure cupidatat culpa ut aute esse ut. Nostrud tempor laboris aute deserunt Lorem. Labore et pariatur enim minim dolore elit qui enim nostrud sit ut incididunt cillum.\r\nSit laborum commodo sunt consectetur elit eu proident cupidatat amet aliquip ea sint Lorem. Incididunt ex adipisicing minim eu in commodo velit excepteur anim. Ex magna magna ut incididunt sunt excepteur esse magna pariatur. Est aliqua deserunt labore nulla laborum esse non excepteur. Tempor consectetur Lorem incididunt officia consequat. Id magna voluptate ex sunt enim labore reprehenderit dolor est eu eu labore.\r\nAliquip do esse et proident fugiat dolore nisi elit qui adipisicing. Velit cillum deserunt ea velit consectetur ad commodo eu anim. Nulla deserunt consectetur tempor commodo adipisicing amet cillum veniam et ipsum ex est veniam. Fugiat ullamco non exercitation ullamco labore id incididunt pariatur dolore.\r\nQui quis dolor quis nulla aute laborum aliquip dolore cupidatat nulla. Voluptate eiusmod nisi cillum do occaecat commodo elit reprehenderit minim amet. Quis amet voluptate sint cillum minim elit nulla ea adipisicing eiusmod.\r\nExercitation exercitation laborum laborum exercitation sint eiusmod velit nulla ea culpa ex. Ullamco proident nulla sunt duis ut. Laboris irure occaecat labore eiusmod consectetur ut sint dolor. Enim Lorem ea sint ex reprehenderit proident quis consequat aliquip laborum non.\r\nUllamco reprehenderit sint et nisi dolor excepteur irure excepteur minim sint proident officia. Nisi Lorem voluptate esse velit sunt exercitation adipisicing in. Nostrud do nulla do quis laboris deserunt cupidatat velit enim consequat reprehenderit ea aliqua veniam. Dolor laboris voluptate non non aliquip. Ex Lorem do ut sunt culpa voluptate.\r\n</p>",
            "image": null,
            "featured": 0,
            "page": 6,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 9,
                "uuid": "36213a81-2804-4461-8d21-c79f50c618b7",
                "name": "Elvira Porter",
                "slug": "elvira-porter",
                "email": "elviraporter@sustenza.com",
                "bio": "",
                "website": "",
                "location": "in fugiat consequat",
                "status": "active",
                "language": "en_US",
                "created_at": "2014-02-11T19:31:35.970 +05:00",
                "updated_at": "2013-11-15T01:22:09.677 +05:00"
            },
            "created_at": "2013-04-11T01:13:28.605 +04:00",
            "created_by": {
                "id": 7,
                "uuid": "397477b7-a918-4358-9759-1937f7a9b35a",
                "name": "Concepcion Kennedy",
                "slug": "concepcion-kennedy",
                "email": "concepcionkennedy@sustenza.com",
                "bio": "",
                "website": "",
                "location": "pariatur",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-04-18T09:18:50.064 +04:00",
                "updated_at": "2012-04-13T15:06:26.328 +04:00"
            },
            "updated_at": "2012-01-04T00:46:26.426 +05:00",
            "updated_by": {
                "id": 1,
                "uuid": "f1224a8e-7e6f-4479-b752-b006e2590067",
                "name": "Dale Clarke",
                "slug": "dale-clarke",
                "email": "daleclarke@sustenza.com",
                "bio": "",
                "website": "",
                "location": "aliqua laborum",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-06-22T13:25:27.028 +04:00",
                "updated_at": "2012-02-02T23:44:16.256 +05:00"
            },
            "published_at": "2014-02-17T12:27:23.491 +05:00",
            "published_by": {
                "id": 8,
                "uuid": "8a9a9c66-52a3-4cb7-bfd5-95023c9787aa",
                "name": "Beasley Sharp",
                "slug": "beasley-sharp",
                "email": "beasleysharp@sustenza.com",
                "bio": "",
                "website": "",
                "location": "tempor",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-08-27T19:51:21.185 +04:00",
                "updated_at": "2012-12-11T20:55:44.353 +05:00"
            },
            "tags": [
                {
                    "id": 29,
                    "uuid": "459cbde6-4c91-4430-9e09-8ab8bb357884",
                    "name": "in exercitation",
                    "slug": "in-exercitation",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-02-22T19:04:56.723 +05:00",
                    "created_by": 1,
                    "updated_at": "2014-01-16T02:25:02.663 +05:00",
                    "updated_by": 10
                },
                {
                    "id": 96,
                    "uuid": "91d16c40-03b9-407f-97d6-cc8676fd5568",
                    "name": "enim esse in",
                    "slug": "enim-esse-in",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-06-26T18:34:05.987 +04:00",
                    "created_by": 5,
                    "updated_at": "2012-10-08T20:02:57.810 +04:00",
                    "updated_by": 5
                },
                {
                    "id": 33,
                    "uuid": "34573109-7f41-4772-be3a-eae8e021ce24",
                    "name": "consequat nostrud",
                    "slug": "consequat-nostrud",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-09-11T13:22:30.673 +04:00",
                    "created_by": 8,
                    "updated_at": "2013-12-06T11:31:22.188 +05:00",
                    "updated_by": 10
                },
                {
                    "id": 58,
                    "uuid": "0cc817fc-4292-4d9f-81b0-d1345d93cdf8",
                    "name": "laborum",
                    "slug": "laborum",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-09-15T16:39:31.723 +04:00",
                    "created_by": 5,
                    "updated_at": "2013-02-26T07:54:02.592 +05:00",
                    "updated_by": 6
                }
            ]
        },
        {
            "id": 9,
            "uuid": "bcd8a2e0-3380-4808-8541-e245f0cb1ce1",
            "status": "draft",
            "title": "do consequat proident deserunt voluptate in magna occaecat",
            "slug": "do-consequat-proident-deserunt-voluptate-in-magna-occaecat",
            "markdown": "Ut nisi laboris reprehenderit exercitation reprehenderit elit eiusmod anim irure. Qui commodo fugiat adipisicing ipsum anim quis fugiat eiusmod dolore consectetur voluptate ullamco. Ut esse incididunt mollit consequat eu irure. Cillum velit et Lorem adipisicing enim ipsum incididunt laboris irure proident aliquip.\r\nMinim cillum eiusmod excepteur officia minim officia sunt quis qui ut elit quis adipisicing duis. Voluptate sunt quis nostrud quis magna deserunt. Esse nulla nisi sint eiusmod occaecat ea labore tempor minim voluptate magna esse excepteur.\r\nSunt et cillum consequat incididunt ea nostrud labore. Adipisicing do ex eiusmod veniam. Sit cillum duis incididunt aliqua mollit dolore velit laborum eiusmod pariatur laboris quis nostrud ipsum.\r\n",
            "html": "<p>Ut nisi laboris reprehenderit exercitation reprehenderit elit eiusmod anim irure. Qui commodo fugiat adipisicing ipsum anim quis fugiat eiusmod dolore consectetur voluptate ullamco. Ut esse incididunt mollit consequat eu irure. Cillum velit et Lorem adipisicing enim ipsum incididunt laboris irure proident aliquip.\r\nMinim cillum eiusmod excepteur officia minim officia sunt quis qui ut elit quis adipisicing duis. Voluptate sunt quis nostrud quis magna deserunt. Esse nulla nisi sint eiusmod occaecat ea labore tempor minim voluptate magna esse excepteur.\r\nSunt et cillum consequat incididunt ea nostrud labore. Adipisicing do ex eiusmod veniam. Sit cillum duis incididunt aliqua mollit dolore velit laborum eiusmod pariatur laboris quis nostrud ipsum.\r\n</p>",
            "image": null,
            "featured": 1,
            "page": 7,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 9,
                "uuid": "763ed9f0-07b8-4718-8544-d8666c46f3c7",
                "name": "Bertie Mcdaniel",
                "slug": "bertie-mcdaniel",
                "email": "bertiemcdaniel@sustenza.com",
                "bio": "",
                "website": "",
                "location": "fugiat amet deserunt",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-11-30T20:15:54.308 +05:00",
                "updated_at": "2013-03-05T11:25:13.379 +05:00"
            },
            "created_at": "2012-09-20T00:46:24.961 +04:00",
            "created_by": {
                "id": 5,
                "uuid": "6e88d832-a274-4b8e-ac87-b50c8eeb0efc",
                "name": "Naomi Allen",
                "slug": "naomi-allen",
                "email": "naomiallen@sustenza.com",
                "bio": "",
                "website": "",
                "location": "et",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-11-03T04:20:22.752 +04:00",
                "updated_at": "2012-10-19T22:44:13.370 +04:00"
            },
            "updated_at": "2012-11-07T16:17:09.287 +05:00",
            "updated_by": {
                "id": 8,
                "uuid": "ac3bb764-aa00-4a17-9c00-332f8fb5f2e9",
                "name": "Beryl Wood",
                "slug": "beryl-wood",
                "email": "berylwood@sustenza.com",
                "bio": "",
                "website": "",
                "location": "consequat sunt cupidatat",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-05-14T14:01:48.020 +04:00",
                "updated_at": "2012-03-27T16:37:48.491 +04:00"
            },
            "published_at": "2013-09-17T10:17:19.496 +04:00",
            "published_by": {
                "id": 4,
                "uuid": "0cf062f2-8d8b-4fc0-9e23-f3e3b0985105",
                "name": "Deanne Winters",
                "slug": "deanne-winters",
                "email": "deannewinters@sustenza.com",
                "bio": "",
                "website": "",
                "location": "aliqua consectetur",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-03-29T07:20:41.806 +04:00",
                "updated_at": "2012-03-02T10:35:40.082 +05:00"
            },
            "tags": [
                {
                    "id": 85,
                    "uuid": "3438f35c-bfac-400a-9074-d5b046be7558",
                    "name": "excepteur excepteur",
                    "slug": "excepteur-excepteur",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-03-23T22:27:48.649 +04:00",
                    "created_by": 1,
                    "updated_at": "2013-10-07T16:38:15.683 +04:00",
                    "updated_by": 3
                },
                {
                    "id": 4,
                    "uuid": "305843e4-2436-4bbd-bc0d-1185fb370697",
                    "name": "commodo culpa",
                    "slug": "commodo-culpa",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-03-07T00:43:33.572 +05:00",
                    "created_by": 5,
                    "updated_at": "2012-09-20T04:03:46.013 +04:00",
                    "updated_by": 6
                },
                {
                    "id": 74,
                    "uuid": "95e4c131-3b3a-4177-a1af-9f9c2e681470",
                    "name": "amet",
                    "slug": "amet",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-05-08T13:09:29.532 +04:00",
                    "created_by": 8,
                    "updated_at": "2013-03-29T06:30:59.149 +04:00",
                    "updated_by": 4
                },
                {
                    "id": 23,
                    "uuid": "067bbfba-a540-41bf-baf2-3bb816960f42",
                    "name": "elit laboris sit",
                    "slug": "elit-laboris-sit",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-04-12T12:43:12.108 +04:00",
                    "created_by": 1,
                    "updated_at": "2012-09-09T17:46:17.976 +04:00",
                    "updated_by": 1
                },
                {
                    "id": 14,
                    "uuid": "1eb4b826-24a3-4912-9c99-b916da01c81a",
                    "name": "ex aliquip esse",
                    "slug": "ex-aliquip-esse",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-12-23T07:51:24.759 +05:00",
                    "created_by": 4,
                    "updated_at": "2013-07-29T16:52:45.605 +04:00",
                    "updated_by": 4
                },
                {
                    "id": 54,
                    "uuid": "926af630-37d5-44f3-8ee8-0a656468e10e",
                    "name": "exercitation ullamco in",
                    "slug": "exercitation-ullamco-in",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-12-14T02:26:49.852 +05:00",
                    "created_by": 5,
                    "updated_at": "2012-07-29T21:16:07.386 +04:00",
                    "updated_by": 1
                },
                {
                    "id": 76,
                    "uuid": "eed6c9ae-e3b0-4270-bfd8-854c56fdc3c8",
                    "name": "tempor id pariatur",
                    "slug": "tempor-id-pariatur",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-07-23T21:16:09.307 +04:00",
                    "created_by": 10,
                    "updated_at": "2013-11-06T01:08:43.395 +05:00",
                    "updated_by": 3
                }
            ]
        },
        {
            "id": 10,
            "uuid": "73c45d7f-d1db-4f11-9661-4944d51a41f3",
            "status": "draft",
            "title": "aliquip exercitation",
            "slug": "aliquip-exercitation",
            "markdown": "Cillum laborum nulla laboris nulla in voluptate quis sit dolor. Reprehenderit enim ipsum enim non duis. Ex qui sit ullamco aliqua dolor qui sit minim eiusmod non ullamco nostrud elit. Velit enim Lorem dolor cillum officia. Ad qui amet velit qui eu mollit do est ipsum dolor adipisicing. Incididunt id est amet quis proident est sunt et irure magna eiusmod in. Anim ipsum voluptate laborum esse dolor deserunt ullamco mollit nulla.\r\nAd fugiat est ipsum ipsum aliquip fugiat sunt cupidatat. Exercitation amet voluptate incididunt cupidatat nisi id. Et adipisicing ad exercitation fugiat eu elit cupidatat incididunt aliquip quis ea aliqua.\r\nMollit ex laboris est ut exercitation. Non veniam mollit dolore culpa ipsum sunt. Deserunt eu eu duis eu exercitation in sint est velit. Nulla laborum aliqua irure minim. Labore dolore labore nostrud sint.\r\nConsequat sit ea exercitation adipisicing eiusmod cupidatat irure adipisicing deserunt in adipisicing laboris. Excepteur incididunt excepteur Lorem eiusmod aute deserunt enim pariatur esse irure consequat sint dolore ullamco. Aute proident dolore eu voluptate ullamco voluptate nisi elit duis nisi qui incididunt. Dolore reprehenderit labore exercitation ad ipsum ad tempor consectetur.\r\nEu culpa cupidatat elit quis Lorem. Culpa amet occaecat amet nostrud anim velit adipisicing quis adipisicing occaecat. Velit eu enim sunt voluptate dolor cillum occaecat irure cupidatat magna.\r\nEsse magna dolor cillum nulla commodo. Irure consectetur deserunt veniam aliqua commodo tempor exercitation. Id et laboris eiusmod dolor non dolore sit culpa mollit eu ex cupidatat eiusmod.\r\nDeserunt ea ad pariatur reprehenderit pariatur tempor quis esse nostrud eu dolore et velit. Nisi irure velit culpa veniam mollit proident nulla tempor consequat. Ullamco proident enim ad nostrud fugiat minim voluptate consectetur non nostrud.\r\nReprehenderit est veniam nulla est nisi adipisicing eu esse consequat ex pariatur commodo velit. Qui sint eu enim enim esse. Nisi quis aute mollit et ipsum esse in et exercitation mollit id irure minim. Est laborum ad incididunt anim officia commodo consectetur dolor mollit deserunt adipisicing veniam cupidatat. Ut aliqua tempor labore et ea aliquip ea.\r\n",
            "html": "<p>Cillum laborum nulla laboris nulla in voluptate quis sit dolor. Reprehenderit enim ipsum enim non duis. Ex qui sit ullamco aliqua dolor qui sit minim eiusmod non ullamco nostrud elit. Velit enim Lorem dolor cillum officia. Ad qui amet velit qui eu mollit do est ipsum dolor adipisicing. Incididunt id est amet quis proident est sunt et irure magna eiusmod in. Anim ipsum voluptate laborum esse dolor deserunt ullamco mollit nulla.\r\nAd fugiat est ipsum ipsum aliquip fugiat sunt cupidatat. Exercitation amet voluptate incididunt cupidatat nisi id. Et adipisicing ad exercitation fugiat eu elit cupidatat incididunt aliquip quis ea aliqua.\r\nMollit ex laboris est ut exercitation. Non veniam mollit dolore culpa ipsum sunt. Deserunt eu eu duis eu exercitation in sint est velit. Nulla laborum aliqua irure minim. Labore dolore labore nostrud sint.\r\nConsequat sit ea exercitation adipisicing eiusmod cupidatat irure adipisicing deserunt in adipisicing laboris. Excepteur incididunt excepteur Lorem eiusmod aute deserunt enim pariatur esse irure consequat sint dolore ullamco. Aute proident dolore eu voluptate ullamco voluptate nisi elit duis nisi qui incididunt. Dolore reprehenderit labore exercitation ad ipsum ad tempor consectetur.\r\nEu culpa cupidatat elit quis Lorem. Culpa amet occaecat amet nostrud anim velit adipisicing quis adipisicing occaecat. Velit eu enim sunt voluptate dolor cillum occaecat irure cupidatat magna.\r\nEsse magna dolor cillum nulla commodo. Irure consectetur deserunt veniam aliqua commodo tempor exercitation. Id et laboris eiusmod dolor non dolore sit culpa mollit eu ex cupidatat eiusmod.\r\nDeserunt ea ad pariatur reprehenderit pariatur tempor quis esse nostrud eu dolore et velit. Nisi irure velit culpa veniam mollit proident nulla tempor consequat. Ullamco proident enim ad nostrud fugiat minim voluptate consectetur non nostrud.\r\nReprehenderit est veniam nulla est nisi adipisicing eu esse consequat ex pariatur commodo velit. Qui sint eu enim enim esse. Nisi quis aute mollit et ipsum esse in et exercitation mollit id irure minim. Est laborum ad incididunt anim officia commodo consectetur dolor mollit deserunt adipisicing veniam cupidatat. Ut aliqua tempor labore et ea aliquip ea.\r\n</p>",
            "image": null,
            "featured": 1,
            "page": 6,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 3,
                "uuid": "a8035673-4c57-4f17-8338-1ce771bb8e83",
                "name": "Whitehead Tillman",
                "slug": "whitehead-tillman",
                "email": "whiteheadtillman@sustenza.com",
                "bio": "",
                "website": "",
                "location": "tempor fugiat",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-12-17T12:47:19.328 +05:00",
                "updated_at": "2013-08-04T09:36:12.477 +04:00"
            },
            "created_at": "2012-07-22T00:31:25.240 +04:00",
            "created_by": {
                "id": 1,
                "uuid": "597b4664-cfba-4096-89ed-0a814e1f0f05",
                "name": "Katy Ayers",
                "slug": "katy-ayers",
                "email": "katyayers@sustenza.com",
                "bio": "",
                "website": "",
                "location": "minim",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-07-31T04:10:55.734 +04:00",
                "updated_at": "2013-03-20T18:30:54.415 +04:00"
            },
            "updated_at": "2014-01-12T06:41:45.325 +05:00",
            "updated_by": {
                "id": 9,
                "uuid": "4453f7c5-742f-4cd1-9062-fba8d945bf89",
                "name": "Humphrey Miles",
                "slug": "humphrey-miles",
                "email": "humphreymiles@sustenza.com",
                "bio": "",
                "website": "",
                "location": "voluptate ullamco velit",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-07-18T07:38:40.777 +04:00",
                "updated_at": "2013-06-25T23:44:28.608 +04:00"
            },
            "published_at": "2014-01-23T22:03:17.970 +05:00",
            "published_by": {
                "id": 10,
                "uuid": "ac8f5d3a-b744-48c9-8f46-61ea57ea0024",
                "name": "Paula Byers",
                "slug": "paula-byers",
                "email": "paulabyers@sustenza.com",
                "bio": "",
                "website": "",
                "location": "minim aute ipsum",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-06-29T07:26:44.634 +04:00",
                "updated_at": "2013-03-08T21:46:36.655 +05:00"
            },
            "tags": [
                {
                    "id": 42,
                    "uuid": "a4760ff9-0fa4-442a-b359-7f29d3c7fe21",
                    "name": "et ad cillum",
                    "slug": "et-ad-cillum",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-09-05T09:59:43.271 +04:00",
                    "created_by": 5,
                    "updated_at": "2013-12-10T13:40:38.600 +05:00",
                    "updated_by": 10
                },
                {
                    "id": 59,
                    "uuid": "314154a6-97ed-4355-b1bb-c9ee0176f1e7",
                    "name": "ea nulla",
                    "slug": "ea-nulla",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-11-16T07:56:58.585 +05:00",
                    "created_by": 4,
                    "updated_at": "2013-01-16T19:20:48.110 +05:00",
                    "updated_by": 9
                },
                {
                    "id": 26,
                    "uuid": "9c093524-cf35-48e9-b586-5bcd2d332d91",
                    "name": "cillum exercitation",
                    "slug": "cillum-exercitation",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-09-06T10:28:53.703 +04:00",
                    "created_by": 1,
                    "updated_at": "2012-03-10T16:36:30.978 +05:00",
                    "updated_by": 6
                }
            ]
        },
        {
            "id": 11,
            "uuid": "11f31e04-8ab2-4651-90a5-ce15d1690e35",
            "status": "draft",
            "title": "sunt eu consectetur et labore labore aute mollit amet qui",
            "slug": "sunt-eu-consectetur-et-labore-labore-aute-mollit-amet-qui",
            "markdown": "Aliquip deserunt id excepteur ea voluptate culpa est officia sunt sunt dolore ipsum. Exercitation mollit minim irure culpa. Proident laboris voluptate nulla fugiat ad adipisicing aute et in cillum eu dolore. Reprehenderit sunt Lorem cillum sit qui. Ut est minim qui ut dolor. Voluptate duis esse nostrud voluptate fugiat ea.\r\nAdipisicing ex Lorem dolore enim dolor ullamco aute proident dolor est. Anim esse commodo reprehenderit non nisi cillum incididunt tempor aliquip ut est ut culpa officia. Reprehenderit nulla dolore pariatur est eu aute dolore deserunt dolore velit laboris dolor labore. Aliqua quis nulla ad ea Lorem. Ullamco ea esse mollit dolor voluptate dolore Lorem non velit.\r\nAliqua reprehenderit dolore dolor labore aute. Aliqua ut minim ea culpa enim est qui laborum officia eu laborum. Lorem dolor fugiat ex tempor ea enim. Ad deserunt non culpa aliqua do elit ut cillum consectetur amet. Qui tempor ea commodo do et excepteur nulla in qui. Reprehenderit laboris consectetur tempor nisi.\r\nAdipisicing voluptate ea nostrud est velit esse cillum do. Cupidatat occaecat id irure incididunt. Quis ipsum dolore ipsum consectetur excepteur exercitation cillum qui pariatur quis nulla sunt esse. Nostrud dolore eu magna cupidatat consectetur officia irure ea nostrud. Enim est ex ex culpa labore quis irure. Occaecat est excepteur duis culpa sint officia culpa commodo velit irure officia duis et. Et nulla eiusmod veniam do exercitation elit sit tempor cupidatat velit.\r\nAmet proident commodo culpa elit consectetur anim incididunt adipisicing deserunt deserunt. Pariatur ipsum nostrud cillum aliquip commodo ipsum aliqua qui id duis occaecat consectetur ut dolore. Sint et ipsum reprehenderit amet deserunt occaecat tempor reprehenderit sit minim occaecat. Ut aliqua aute excepteur et pariatur magna consequat culpa labore eu Lorem incididunt. Officia amet ipsum voluptate irure dolore exercitation tempor duis elit incididunt veniam sunt sint.\r\nDeserunt eu aliquip incididunt dolore cupidatat tempor. Ut sint labore mollit labore ex anim exercitation cupidatat laborum aliquip. Reprehenderit consectetur quis deserunt incididunt. Sint exercitation sint irure excepteur magna incididunt ipsum dolore velit dolore.\r\nDo eu aliqua incididunt amet cillum excepteur. Irure dolore magna aliqua laborum dolore cillum esse veniam ea eiusmod. Sunt dolor non mollit nulla esse irure esse aute dolor cillum exercitation nulla commodo. Occaecat eu est sunt est ad anim sunt duis laboris ipsum nostrud. Ullamco sint minim culpa eu consectetur consequat minim enim sit laborum non commodo tempor consectetur.\r\nCommodo velit id nulla consequat id dolore sit reprehenderit et deserunt. Elit excepteur dolor esse consectetur est laborum exercitation nulla ex do culpa laborum. Ex enim irure commodo mollit ut labore enim qui amet consectetur. Fugiat esse nisi voluptate magna deserunt id pariatur pariatur veniam. Deserunt esse do incididunt est adipisicing qui ad ex. Labore nostrud est duis esse reprehenderit consectetur irure sunt sint anim.\r\nIrure occaecat minim fugiat incididunt mollit. Fugiat elit laborum laborum velit proident dolor nulla nulla. Ad ea ullamco ut proident Lorem reprehenderit consectetur velit aute dolor. Exercitation tempor ad nisi irure et consectetur irure. Tempor ut consectetur et adipisicing commodo elit et fugiat sunt. Elit eu exercitation reprehenderit pariatur sit Lorem incididunt pariatur nulla minim commodo laborum.\r\n",
            "html": "<p>Aliquip deserunt id excepteur ea voluptate culpa est officia sunt sunt dolore ipsum. Exercitation mollit minim irure culpa. Proident laboris voluptate nulla fugiat ad adipisicing aute et in cillum eu dolore. Reprehenderit sunt Lorem cillum sit qui. Ut est minim qui ut dolor. Voluptate duis esse nostrud voluptate fugiat ea.\r\nAdipisicing ex Lorem dolore enim dolor ullamco aute proident dolor est. Anim esse commodo reprehenderit non nisi cillum incididunt tempor aliquip ut est ut culpa officia. Reprehenderit nulla dolore pariatur est eu aute dolore deserunt dolore velit laboris dolor labore. Aliqua quis nulla ad ea Lorem. Ullamco ea esse mollit dolor voluptate dolore Lorem non velit.\r\nAliqua reprehenderit dolore dolor labore aute. Aliqua ut minim ea culpa enim est qui laborum officia eu laborum. Lorem dolor fugiat ex tempor ea enim. Ad deserunt non culpa aliqua do elit ut cillum consectetur amet. Qui tempor ea commodo do et excepteur nulla in qui. Reprehenderit laboris consectetur tempor nisi.\r\nAdipisicing voluptate ea nostrud est velit esse cillum do. Cupidatat occaecat id irure incididunt. Quis ipsum dolore ipsum consectetur excepteur exercitation cillum qui pariatur quis nulla sunt esse. Nostrud dolore eu magna cupidatat consectetur officia irure ea nostrud. Enim est ex ex culpa labore quis irure. Occaecat est excepteur duis culpa sint officia culpa commodo velit irure officia duis et. Et nulla eiusmod veniam do exercitation elit sit tempor cupidatat velit.\r\nAmet proident commodo culpa elit consectetur anim incididunt adipisicing deserunt deserunt. Pariatur ipsum nostrud cillum aliquip commodo ipsum aliqua qui id duis occaecat consectetur ut dolore. Sint et ipsum reprehenderit amet deserunt occaecat tempor reprehenderit sit minim occaecat. Ut aliqua aute excepteur et pariatur magna consequat culpa labore eu Lorem incididunt. Officia amet ipsum voluptate irure dolore exercitation tempor duis elit incididunt veniam sunt sint.\r\nDeserunt eu aliquip incididunt dolore cupidatat tempor. Ut sint labore mollit labore ex anim exercitation cupidatat laborum aliquip. Reprehenderit consectetur quis deserunt incididunt. Sint exercitation sint irure excepteur magna incididunt ipsum dolore velit dolore.\r\nDo eu aliqua incididunt amet cillum excepteur. Irure dolore magna aliqua laborum dolore cillum esse veniam ea eiusmod. Sunt dolor non mollit nulla esse irure esse aute dolor cillum exercitation nulla commodo. Occaecat eu est sunt est ad anim sunt duis laboris ipsum nostrud. Ullamco sint minim culpa eu consectetur consequat minim enim sit laborum non commodo tempor consectetur.\r\nCommodo velit id nulla consequat id dolore sit reprehenderit et deserunt. Elit excepteur dolor esse consectetur est laborum exercitation nulla ex do culpa laborum. Ex enim irure commodo mollit ut labore enim qui amet consectetur. Fugiat esse nisi voluptate magna deserunt id pariatur pariatur veniam. Deserunt esse do incididunt est adipisicing qui ad ex. Labore nostrud est duis esse reprehenderit consectetur irure sunt sint anim.\r\nIrure occaecat minim fugiat incididunt mollit. Fugiat elit laborum laborum velit proident dolor nulla nulla. Ad ea ullamco ut proident Lorem reprehenderit consectetur velit aute dolor. Exercitation tempor ad nisi irure et consectetur irure. Tempor ut consectetur et adipisicing commodo elit et fugiat sunt. Elit eu exercitation reprehenderit pariatur sit Lorem incididunt pariatur nulla minim commodo laborum.\r\n</p>",
            "image": null,
            "featured": 1,
            "page": 7,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 4,
                "uuid": "8fb26962-4542-4d10-8586-1157abd47b5a",
                "name": "Dina Young",
                "slug": "dina-young",
                "email": "dinayoung@sustenza.com",
                "bio": "",
                "website": "",
                "location": "anim",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-09-30T21:34:58.317 +04:00",
                "updated_at": "2012-05-17T22:12:39.114 +04:00"
            },
            "created_at": "2014-02-18T19:09:13.101 +05:00",
            "created_by": {
                "id": 9,
                "uuid": "25332312-25e8-48fd-9375-6f4a63099886",
                "name": "Sweet Hooper",
                "slug": "sweet-hooper",
                "email": "sweethooper@sustenza.com",
                "bio": "",
                "website": "",
                "location": "est velit ullamco",
                "status": "active",
                "language": "en_US",
                "created_at": "2014-01-28T11:07:14.951 +05:00",
                "updated_at": "2013-04-02T06:11:01.646 +04:00"
            },
            "updated_at": "2012-06-21T13:54:06.554 +04:00",
            "updated_by": {
                "id": 1,
                "uuid": "df0df8bf-7586-439e-a945-bb3f240e85cb",
                "name": "Berg Peters",
                "slug": "berg-peters",
                "email": "bergpeters@sustenza.com",
                "bio": "",
                "website": "",
                "location": "voluptate qui",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-11-04T08:45:39.051 +05:00",
                "updated_at": "2012-11-28T11:23:04.495 +05:00"
            },
            "published_at": "2014-02-14T20:35:21.182 +05:00",
            "published_by": {
                "id": 2,
                "uuid": "ee7e130e-af84-446e-8456-966b7116032c",
                "name": "Howell Holman",
                "slug": "howell-holman",
                "email": "howellholman@sustenza.com",
                "bio": "",
                "website": "",
                "location": "veniam reprehenderit ullamco",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-07-03T12:00:17.504 +04:00",
                "updated_at": "2013-04-26T05:55:23.813 +04:00"
            },
            "tags": [
                {
                    "id": 10,
                    "uuid": "de288c4f-80d3-4bd3-99d0-22c94001560f",
                    "name": "velit fugiat",
                    "slug": "velit-fugiat",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-04-05T09:34:42.079 +04:00",
                    "created_by": 7,
                    "updated_at": "2014-04-09T12:47:39.368 +04:00",
                    "updated_by": 5
                },
                {
                    "id": 68,
                    "uuid": "f629994f-3fc6-4d00-b1ec-ea5c8df23c4a",
                    "name": "consectetur deserunt laboris",
                    "slug": "consectetur-deserunt-laboris",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-07-02T21:33:48.192 +04:00",
                    "created_by": 5,
                    "updated_at": "2012-09-29T14:38:55.853 +04:00",
                    "updated_by": 8
                },
                {
                    "id": 76,
                    "uuid": "51c35aa1-bc5c-4941-8a4d-7ef520fccd2d",
                    "name": "eu exercitation id",
                    "slug": "eu-exercitation-id",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-12-29T14:14:05.090 +05:00",
                    "created_by": 2,
                    "updated_at": "2012-10-02T02:34:36.539 +04:00",
                    "updated_by": 7
                },
                {
                    "id": 78,
                    "uuid": "760c78e7-8224-40f3-9e5b-1c7a5e7b782d",
                    "name": "duis culpa",
                    "slug": "duis-culpa",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-01-20T11:55:11.614 +05:00",
                    "created_by": 0,
                    "updated_at": "2013-07-24T07:44:17.974 +04:00",
                    "updated_by": 10
                },
                {
                    "id": 55,
                    "uuid": "124f1bd2-6dd2-45d8-989f-5c73cfe6cb52",
                    "name": "enim",
                    "slug": "enim",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-03-25T21:34:47.926 +04:00",
                    "created_by": 9,
                    "updated_at": "2013-04-01T02:25:11.773 +04:00",
                    "updated_by": 4
                },
                {
                    "id": 23,
                    "uuid": "9b455cc3-083d-4d65-a149-c0d92fa29413",
                    "name": "esse adipisicing",
                    "slug": "esse-adipisicing",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-08-06T07:44:18.706 +04:00",
                    "created_by": 10,
                    "updated_at": "2013-11-28T11:22:14.632 +05:00",
                    "updated_by": 2
                },
                {
                    "id": 61,
                    "uuid": "47d242fb-3e68-4f2c-a2c2-d06244a2efd4",
                    "name": "eiusmod",
                    "slug": "eiusmod",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-10-01T05:48:01.180 +04:00",
                    "created_by": 3,
                    "updated_at": "2012-10-06T14:58:40.539 +04:00",
                    "updated_by": 6
                },
                {
                    "id": 68,
                    "uuid": "94b30485-dccb-45cf-aca1-2a5e1fe5412c",
                    "name": "ad exercitation elit",
                    "slug": "ad-exercitation-elit",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-04-18T21:21:38.725 +04:00",
                    "created_by": 8,
                    "updated_at": "2012-02-13T15:58:59.071 +05:00",
                    "updated_by": 8
                },
                {
                    "id": 68,
                    "uuid": "f7a2b218-3a0d-4c0c-95b4-c0b65ffbbec0",
                    "name": "ex eu Lorem",
                    "slug": "ex-eu-lorem",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-09-13T03:20:42.601 +04:00",
                    "created_by": 6,
                    "updated_at": "2012-04-15T11:45:34.632 +04:00",
                    "updated_by": 8
                },
                {
                    "id": 65,
                    "uuid": "57e4a026-8148-49c5-8cd3-6364c469f815",
                    "name": "minim nulla cupidatat",
                    "slug": "minim-nulla-cupidatat",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-02-09T18:35:15.059 +05:00",
                    "created_by": 6,
                    "updated_at": "2012-07-19T06:37:55.912 +04:00",
                    "updated_by": 9
                }
            ]
        },
        {
            "id": 12,
            "uuid": "335d734a-1a08-4dcd-855f-3ef3c631b36e",
            "status": "published ",
            "title": "veniam dolor duis velit tempor",
            "slug": "veniam-dolor-duis-velit-tempor",
            "markdown": "Laboris ullamco ex fugiat fugiat deserunt excepteur adipisicing incididunt. Minim veniam in aliqua est exercitation consectetur dolore ea eiusmod. Voluptate exercitation Lorem nisi et sunt laborum. Anim non pariatur aliquip consectetur aute non fugiat consectetur nisi sit velit officia enim incididunt.\r\nEst pariatur mollit laboris commodo pariatur quis. Laborum sit consequat Lorem et sint non consequat non exercitation. Excepteur id adipisicing exercitation deserunt culpa eu culpa tempor ut ad consequat ad irure.\r\n",
            "html": "<p>Laboris ullamco ex fugiat fugiat deserunt excepteur adipisicing incididunt. Minim veniam in aliqua est exercitation consectetur dolore ea eiusmod. Voluptate exercitation Lorem nisi et sunt laborum. Anim non pariatur aliquip consectetur aute non fugiat consectetur nisi sit velit officia enim incididunt.\r\nEst pariatur mollit laboris commodo pariatur quis. Laborum sit consequat Lorem et sint non consequat non exercitation. Excepteur id adipisicing exercitation deserunt culpa eu culpa tempor ut ad consequat ad irure.\r\n</p>",
            "image": null,
            "featured": 0,
            "page": 8,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 10,
                "uuid": "58f6f7b4-2166-40b1-8897-f7b92e951b87",
                "name": "Banks Livingston",
                "slug": "banks-livingston",
                "email": "bankslivingston@sustenza.com",
                "bio": "",
                "website": "",
                "location": "adipisicing",
                "status": "active",
                "language": "en_US",
                "created_at": "2014-01-09T02:18:28.802 +05:00",
                "updated_at": "2012-09-06T10:49:39.279 +04:00"
            },
            "created_at": "2013-05-27T06:54:30.008 +04:00",
            "created_by": {
                "id": 8,
                "uuid": "9192c5cf-9f5c-49b4-b27e-25b5df546cc3",
                "name": "Macdonald Ellison",
                "slug": "macdonald-ellison",
                "email": "macdonaldellison@sustenza.com",
                "bio": "",
                "website": "",
                "location": "laborum voluptate",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-01-17T19:07:54.625 +05:00",
                "updated_at": "2013-06-10T14:38:48.769 +04:00"
            },
            "updated_at": "2013-05-25T06:30:40.000 +04:00",
            "updated_by": {
                "id": 9,
                "uuid": "4921371c-9429-4001-98b2-3bdd9f5500e6",
                "name": "Mueller Workman",
                "slug": "mueller-workman",
                "email": "muellerworkman@sustenza.com",
                "bio": "",
                "website": "",
                "location": "aute irure",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-07-20T07:59:56.766 +04:00",
                "updated_at": "2013-01-27T15:28:58.959 +05:00"
            },
            "published_at": "2013-06-01T08:10:08.271 +04:00",
            "published_by": {
                "id": 9,
                "uuid": "0e9afc10-320d-4838-b754-93e8e93dbf80",
                "name": "Tiffany Mckay",
                "slug": "tiffany-mckay",
                "email": "tiffanymckay@sustenza.com",
                "bio": "",
                "website": "",
                "location": "amet est quis",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-08-10T05:24:02.810 +04:00",
                "updated_at": "2014-01-14T02:03:42.353 +05:00"
            },
            "tags": []
        },
        {
            "id": 13,
            "uuid": "9d176f99-9bc4-4599-8ffe-efdc85724c8b",
            "status": "draft",
            "title": "fugiat nisi laborum",
            "slug": "fugiat-nisi-laborum",
            "markdown": "Eiusmod exercitation irure quis do. Reprehenderit aliqua veniam laboris consequat. Incididunt sint laborum cillum esse nulla proident veniam nisi veniam. Tempor amet est non non deserunt qui reprehenderit reprehenderit sint consequat eiusmod. Ut exercitation minim veniam do.\r\nSint tempor ea do commodo velit sit aliqua dolor irure minim non aute sint. Ipsum in commodo sit voluptate. Culpa deserunt esse eu consectetur qui. Anim culpa voluptate magna quis et voluptate.\r\nAliqua nisi sunt consectetur mollit enim cupidatat pariatur. Sunt eu aliqua laborum exercitation ipsum minim consequat irure ut nulla. Sint veniam ad excepteur consequat irure esse velit cupidatat laboris laborum consequat irure cillum. Consequat exercitation in ullamco veniam do do laboris anim reprehenderit Lorem culpa. Irure ipsum adipisicing exercitation voluptate. Sunt enim ad officia proident aliqua non dolor anim. Elit excepteur in ex duis enim.\r\nSit dolore cupidatat quis dolore velit proident laborum culpa ut. In velit consequat officia veniam. Consequat nisi aliquip cillum commodo duis cillum consectetur non excepteur. Ipsum laborum sint ullamco anim. Exercitation sint aliquip fugiat consectetur adipisicing ut.\r\nElit sint anim sint quis nisi fugiat esse. Do fugiat nostrud dolor mollit et laboris laborum enim exercitation occaecat. Et ex Lorem dolore excepteur nisi magna sint adipisicing aliquip aute ut aute. Occaecat consequat aliquip ad aliqua labore laboris ad magna culpa aute occaecat cillum laboris pariatur. Aute aute aliqua est ea excepteur dolor. Anim cupidatat laborum reprehenderit officia. Mollit nisi dolor nulla tempor id veniam culpa tempor ex veniam.\r\nFugiat amet fugiat commodo magna dolor dolore esse occaecat est ea fugiat adipisicing. Exercitation occaecat proident laborum sunt ex id anim adipisicing veniam minim occaecat sint do minim. Nulla reprehenderit nulla nostrud culpa mollit exercitation et qui nulla sunt non exercitation nostrud dolor. Id non id mollit qui ex ipsum aliquip.\r\n",
            "html": "<p>Eiusmod exercitation irure quis do. Reprehenderit aliqua veniam laboris consequat. Incididunt sint laborum cillum esse nulla proident veniam nisi veniam. Tempor amet est non non deserunt qui reprehenderit reprehenderit sint consequat eiusmod. Ut exercitation minim veniam do.\r\nSint tempor ea do commodo velit sit aliqua dolor irure minim non aute sint. Ipsum in commodo sit voluptate. Culpa deserunt esse eu consectetur qui. Anim culpa voluptate magna quis et voluptate.\r\nAliqua nisi sunt consectetur mollit enim cupidatat pariatur. Sunt eu aliqua laborum exercitation ipsum minim consequat irure ut nulla. Sint veniam ad excepteur consequat irure esse velit cupidatat laboris laborum consequat irure cillum. Consequat exercitation in ullamco veniam do do laboris anim reprehenderit Lorem culpa. Irure ipsum adipisicing exercitation voluptate. Sunt enim ad officia proident aliqua non dolor anim. Elit excepteur in ex duis enim.\r\nSit dolore cupidatat quis dolore velit proident laborum culpa ut. In velit consequat officia veniam. Consequat nisi aliquip cillum commodo duis cillum consectetur non excepteur. Ipsum laborum sint ullamco anim. Exercitation sint aliquip fugiat consectetur adipisicing ut.\r\nElit sint anim sint quis nisi fugiat esse. Do fugiat nostrud dolor mollit et laboris laborum enim exercitation occaecat. Et ex Lorem dolore excepteur nisi magna sint adipisicing aliquip aute ut aute. Occaecat consequat aliquip ad aliqua labore laboris ad magna culpa aute occaecat cillum laboris pariatur. Aute aute aliqua est ea excepteur dolor. Anim cupidatat laborum reprehenderit officia. Mollit nisi dolor nulla tempor id veniam culpa tempor ex veniam.\r\nFugiat amet fugiat commodo magna dolor dolore esse occaecat est ea fugiat adipisicing. Exercitation occaecat proident laborum sunt ex id anim adipisicing veniam minim occaecat sint do minim. Nulla reprehenderit nulla nostrud culpa mollit exercitation et qui nulla sunt non exercitation nostrud dolor. Id non id mollit qui ex ipsum aliquip.\r\n</p>",
            "image": null,
            "featured": 1,
            "page": 6,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 3,
                "uuid": "972de8fd-a7e1-4295-887e-d30ce4d51eb7",
                "name": "Frieda Davis",
                "slug": "frieda-davis",
                "email": "friedadavis@sustenza.com",
                "bio": "",
                "website": "",
                "location": "deserunt",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-08-21T17:36:57.284 +04:00",
                "updated_at": "2013-07-24T04:19:35.081 +04:00"
            },
            "created_at": "2014-04-10T00:12:24.818 +04:00",
            "created_by": {
                "id": 5,
                "uuid": "f58ec4b3-2976-406f-96ab-8e756aedb485",
                "name": "Nicole Burgess",
                "slug": "nicole-burgess",
                "email": "nicoleburgess@sustenza.com",
                "bio": "",
                "website": "",
                "location": "sunt",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-03-16T03:29:24.846 +04:00",
                "updated_at": "2013-09-18T06:02:33.423 +04:00"
            },
            "updated_at": "2014-03-14T04:23:15.658 +04:00",
            "updated_by": {
                "id": 5,
                "uuid": "6a90abbf-e1a1-4991-bae5-3cf297cb0310",
                "name": "Hicks Orr",
                "slug": "hicks-orr",
                "email": "hicksorr@sustenza.com",
                "bio": "",
                "website": "",
                "location": "reprehenderit amet",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-05-21T06:15:20.144 +04:00",
                "updated_at": "2013-04-09T11:11:41.265 +04:00"
            },
            "published_at": "2013-11-16T10:37:20.959 +05:00",
            "published_by": {
                "id": 7,
                "uuid": "a5ea8cf0-5684-4073-8b30-95cd90125e67",
                "name": "Tia Pratt",
                "slug": "tia-pratt",
                "email": "tiapratt@sustenza.com",
                "bio": "",
                "website": "",
                "location": "dolor nostrud culpa",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-07-10T05:19:30.538 +04:00",
                "updated_at": "2013-12-15T14:47:19.246 +05:00"
            },
            "tags": []
        },
        {
            "id": 14,
            "uuid": "93a3469e-dc6d-42d5-82a8-4c5349bfb116",
            "status": "draft",
            "title": "aliqua ea velit amet Lorem nisi ad eiusmod",
            "slug": "aliqua-ea-velit-amet-Lorem-nisi-ad-eiusmod",
            "markdown": "Eu id dolor incididunt ex ea consectetur voluptate nisi. Fugiat exercitation nulla enim cupidatat duis culpa incididunt et. Consequat consectetur est ullamco esse eiusmod mollit. Nulla in incididunt ipsum Lorem nostrud sit deserunt excepteur tempor exercitation ullamco. Nulla cillum sint occaecat pariatur aliquip anim dolor ea nulla et pariatur laborum incididunt. Adipisicing adipisicing tempor et dolor labore adipisicing tempor nostrud sit ullamco ut nulla ullamco esse.\r\n",
            "html": "<p>Eu id dolor incididunt ex ea consectetur voluptate nisi. Fugiat exercitation nulla enim cupidatat duis culpa incididunt et. Consequat consectetur est ullamco esse eiusmod mollit. Nulla in incididunt ipsum Lorem nostrud sit deserunt excepteur tempor exercitation ullamco. Nulla cillum sint occaecat pariatur aliquip anim dolor ea nulla et pariatur laborum incididunt. Adipisicing adipisicing tempor et dolor labore adipisicing tempor nostrud sit ullamco ut nulla ullamco esse.\r\n</p>",
            "image": null,
            "featured": 1,
            "page": 3,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 8,
                "uuid": "a05a017d-9c09-4e3c-b68a-5093d8a6a8f3",
                "name": "Erma Leblanc",
                "slug": "erma-leblanc",
                "email": "ermaleblanc@sustenza.com",
                "bio": "",
                "website": "",
                "location": "est",
                "status": "active",
                "language": "en_US",
                "created_at": "2014-04-10T22:56:38.961 +04:00",
                "updated_at": "2013-04-05T00:33:47.593 +04:00"
            },
            "created_at": "2013-10-30T23:42:24.892 +04:00",
            "created_by": {
                "id": 8,
                "uuid": "6b650cf8-387c-4437-ae03-e457d4c94a54",
                "name": "Singleton Robinson",
                "slug": "singleton-robinson",
                "email": "singletonrobinson@sustenza.com",
                "bio": "",
                "website": "",
                "location": "incididunt",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-10-15T10:42:56.409 +04:00",
                "updated_at": "2013-10-26T03:09:09.941 +04:00"
            },
            "updated_at": "2013-05-07T15:59:53.597 +04:00",
            "updated_by": {
                "id": 3,
                "uuid": "347f1654-abe5-435f-8912-8f59e9674ba4",
                "name": "Maritza Carrillo",
                "slug": "maritza-carrillo",
                "email": "maritzacarrillo@sustenza.com",
                "bio": "",
                "website": "",
                "location": "in",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-02-22T10:36:10.106 +05:00",
                "updated_at": "2014-03-08T02:30:42.117 +05:00"
            },
            "published_at": "2012-01-26T10:07:06.076 +05:00",
            "published_by": {
                "id": 5,
                "uuid": "f55dd219-8cb9-488d-8e4b-e84b666885db",
                "name": "Sargent Turner",
                "slug": "sargent-turner",
                "email": "sargentturner@sustenza.com",
                "bio": "",
                "website": "",
                "location": "duis magna",
                "status": "active",
                "language": "en_US",
                "created_at": "2014-03-27T04:08:00.605 +04:00",
                "updated_at": "2014-03-09T01:49:25.088 +05:00"
            },
            "tags": [
                {
                    "id": 1,
                    "uuid": "e4be60d2-bd2b-4723-a2c2-f8bd61e1c6a2",
                    "name": "esse in nisi",
                    "slug": "esse-in-nisi",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-01-09T06:19:17.641 +05:00",
                    "created_by": 9,
                    "updated_at": "2013-12-21T13:24:51.622 +05:00",
                    "updated_by": 1
                },
                {
                    "id": 25,
                    "uuid": "073cb0f1-8b2d-4acf-ada3-8a10c3de0796",
                    "name": "velit anim aliqua",
                    "slug": "velit-anim-aliqua",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-02-05T16:02:33.379 +05:00",
                    "created_by": 8,
                    "updated_at": "2012-12-01T11:55:04.335 +05:00",
                    "updated_by": 1
                },
                {
                    "id": 97,
                    "uuid": "60f29bdf-f23e-4b3c-a296-e18de3935e5d",
                    "name": "quis irure aute",
                    "slug": "quis-irure-aute",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-03-06T13:43:56.636 +05:00",
                    "created_by": 5,
                    "updated_at": "2012-06-29T10:14:18.715 +04:00",
                    "updated_by": 9
                },
                {
                    "id": 16,
                    "uuid": "6c97e412-d92d-46d9-870f-f2525a1d3823",
                    "name": "sint aliquip",
                    "slug": "sint-aliquip",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-01-21T04:48:50.460 +05:00",
                    "created_by": 10,
                    "updated_at": "2012-01-18T04:44:50.880 +05:00",
                    "updated_by": 10
                },
                {
                    "id": 16,
                    "uuid": "02b288d6-8536-4531-86a7-9d44ac584163",
                    "name": "sunt id",
                    "slug": "sunt-id",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-02-25T08:52:56.625 +05:00",
                    "created_by": 3,
                    "updated_at": "2013-11-02T11:23:20.750 +04:00",
                    "updated_by": 4
                },
                {
                    "id": 77,
                    "uuid": "6a170f0a-fd55-446b-8dfb-33a2238a0ff0",
                    "name": "est",
                    "slug": "est",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-06-06T23:09:02.471 +04:00",
                    "created_by": 0,
                    "updated_at": "2012-11-05T16:42:43.595 +05:00",
                    "updated_by": 6
                },
                {
                    "id": 71,
                    "uuid": "ec9aaf63-fa3c-4823-97f1-735cf1626cb1",
                    "name": "minim sit eu",
                    "slug": "minim-sit-eu",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-03-29T00:46:23.159 +04:00",
                    "created_by": 5,
                    "updated_at": "2012-09-03T14:57:47.513 +04:00",
                    "updated_by": 2
                },
                {
                    "id": 63,
                    "uuid": "7fb1af0b-b328-4b9b-8669-507075022f8a",
                    "name": "culpa aliqua aute",
                    "slug": "culpa-aliqua-aute",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-06-23T15:53:43.572 +04:00",
                    "created_by": 3,
                    "updated_at": "2014-04-04T11:40:39.296 +04:00",
                    "updated_by": 3
                },
                {
                    "id": 92,
                    "uuid": "a49f2d01-04f4-461f-b1d9-934f6d86ed6c",
                    "name": "minim consectetur nulla",
                    "slug": "minim-consectetur-nulla",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-10-10T00:12:17.263 +04:00",
                    "created_by": 6,
                    "updated_at": "2014-02-13T13:28:30.885 +05:00",
                    "updated_by": 10
                },
                {
                    "id": 87,
                    "uuid": "d415fee0-08f8-4e25-9665-e2851b15a3bc",
                    "name": "cillum et",
                    "slug": "cillum-et",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-12-17T18:38:33.382 +05:00",
                    "created_by": 5,
                    "updated_at": "2013-03-01T08:45:10.611 +05:00",
                    "updated_by": 2
                }
            ]
        },
        {
            "id": 15,
            "uuid": "54482287-1f9a-4834-9b1d-5ea14d765135",
            "status": "draft",
            "title": "quis sint irure sint aliqua",
            "slug": "quis-sint-irure-sint-aliqua",
            "markdown": "Enim sit aliquip ex ex do et enim mollit minim mollit cillum. Sunt cupidatat et labore do ut occaecat reprehenderit occaecat enim occaecat aute velit ex. Consectetur mollit nisi aliqua occaecat amet. Eu commodo duis deserunt reprehenderit enim mollit cillum occaecat amet et duis deserunt. Est excepteur nostrud consectetur ipsum exercitation deserunt id. Velit ullamco laboris ad excepteur sit commodo nostrud et. In exercitation eiusmod eiusmod cillum reprehenderit proident nisi Lorem.\r\n",
            "html": "<p>Enim sit aliquip ex ex do et enim mollit minim mollit cillum. Sunt cupidatat et labore do ut occaecat reprehenderit occaecat enim occaecat aute velit ex. Consectetur mollit nisi aliqua occaecat amet. Eu commodo duis deserunt reprehenderit enim mollit cillum occaecat amet et duis deserunt. Est excepteur nostrud consectetur ipsum exercitation deserunt id. Velit ullamco laboris ad excepteur sit commodo nostrud et. In exercitation eiusmod eiusmod cillum reprehenderit proident nisi Lorem.\r\n</p>",
            "image": null,
            "featured": 0,
            "page": 0,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 1,
                "uuid": "ef32b6b5-3e0e-4af3-8e27-9c765c13f937",
                "name": "Whitney Velasquez",
                "slug": "whitney-velasquez",
                "email": "whitneyvelasquez@sustenza.com",
                "bio": "",
                "website": "",
                "location": "esse",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-03-06T15:28:15.560 +05:00",
                "updated_at": "2014-05-06T01:48:06.555 +04:00"
            },
            "created_at": "2013-08-05T23:32:50.976 +04:00",
            "created_by": {
                "id": 0,
                "uuid": "32ae3647-5874-479d-9a2e-1575f708a51d",
                "name": "Witt Clayton",
                "slug": "witt-clayton",
                "email": "wittclayton@sustenza.com",
                "bio": "",
                "website": "",
                "location": "nisi minim qui",
                "status": "active",
                "language": "en_US",
                "created_at": "2014-02-28T12:24:44.513 +05:00",
                "updated_at": "2012-11-02T20:16:34.033 +04:00"
            },
            "updated_at": "2012-07-21T08:44:43.981 +04:00",
            "updated_by": {
                "id": 1,
                "uuid": "8b7c669e-8bc0-497d-9e62-c27dafa34183",
                "name": "Moses Terrell",
                "slug": "moses-terrell",
                "email": "mosesterrell@sustenza.com",
                "bio": "",
                "website": "",
                "location": "culpa elit",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-10-09T04:11:19.151 +04:00",
                "updated_at": "2013-09-11T07:22:47.454 +04:00"
            },
            "published_at": "2013-03-08T04:14:32.050 +05:00",
            "published_by": {
                "id": 7,
                "uuid": "1a77f095-f792-42a1-b09f-619611ab4ab6",
                "name": "Duke Cameron",
                "slug": "duke-cameron",
                "email": "dukecameron@sustenza.com",
                "bio": "",
                "website": "",
                "location": "eu incididunt",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-06-20T08:02:51.573 +04:00",
                "updated_at": "2012-02-24T18:47:59.393 +05:00"
            },
            "tags": [
                {
                    "id": 32,
                    "uuid": "799a045e-6932-4e39-9bfd-1b2a025bc37e",
                    "name": "cillum",
                    "slug": "cillum",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-11-13T07:48:29.713 +05:00",
                    "created_by": 5,
                    "updated_at": "2012-06-14T07:42:38.033 +04:00",
                    "updated_by": 2
                },
                {
                    "id": 79,
                    "uuid": "f5b09044-fcbc-48bb-8a70-705adb93bea6",
                    "name": "quis anim minim",
                    "slug": "quis-anim-minim",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-04-28T06:01:25.285 +04:00",
                    "created_by": 7,
                    "updated_at": "2013-07-11T23:01:45.203 +04:00",
                    "updated_by": 8
                },
                {
                    "id": 91,
                    "uuid": "644999a9-af8c-4462-bafe-aa0f5959e4af",
                    "name": "irure eu",
                    "slug": "irure-eu",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-04-22T02:30:52.033 +04:00",
                    "created_by": 2,
                    "updated_at": "2013-11-05T04:56:32.077 +05:00",
                    "updated_by": 2
                },
                {
                    "id": 72,
                    "uuid": "b629aebb-4c0c-49b4-8b35-9936d1a733f8",
                    "name": "aliqua consequat nostrud",
                    "slug": "aliqua-consequat-nostrud",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-03-06T23:31:10.097 +05:00",
                    "created_by": 3,
                    "updated_at": "2012-09-25T07:09:35.851 +04:00",
                    "updated_by": 3
                },
                {
                    "id": 59,
                    "uuid": "3575c5e0-98fe-43f7-b02c-b11e41a02a8c",
                    "name": "qui do",
                    "slug": "qui-do",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-04-02T18:32:41.721 +04:00",
                    "created_by": 0,
                    "updated_at": "2013-06-07T08:53:58.729 +04:00",
                    "updated_by": 8
                },
                {
                    "id": 84,
                    "uuid": "e55fa2eb-62fd-4a69-b27a-a27d97ebb655",
                    "name": "qui",
                    "slug": "qui",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-01-17T15:15:41.427 +05:00",
                    "created_by": 2,
                    "updated_at": "2013-02-20T21:52:49.410 +05:00",
                    "updated_by": 6
                }
            ]
        },
        {
            "id": 16,
            "uuid": "8eac75e3-5729-4061-b9e5-4f9cdc7feb4e",
            "status": "published ",
            "title": "ex qui exercitation",
            "slug": "ex-qui-exercitation",
            "markdown": "Laboris tempor est dolor cupidatat. Est excepteur nisi amet Lorem pariatur. Commodo ullamco in cillum eiusmod consectetur tempor cupidatat do. Sunt do consequat laboris mollit consectetur adipisicing sit aliquip in anim est mollit do.\r\n",
            "html": "<p>Laboris tempor est dolor cupidatat. Est excepteur nisi amet Lorem pariatur. Commodo ullamco in cillum eiusmod consectetur tempor cupidatat do. Sunt do consequat laboris mollit consectetur adipisicing sit aliquip in anim est mollit do.\r\n</p>",
            "image": null,
            "featured": 0,
            "page": 2,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 1,
                "uuid": "258e762f-a769-4719-ac8b-11823b403273",
                "name": "Jones Irwin",
                "slug": "jones-irwin",
                "email": "jonesirwin@sustenza.com",
                "bio": "",
                "website": "",
                "location": "voluptate qui",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-03-15T04:56:39.398 +04:00",
                "updated_at": "2012-03-06T03:56:09.557 +05:00"
            },
            "created_at": "2013-12-15T11:25:14.082 +05:00",
            "created_by": {
                "id": 8,
                "uuid": "1df92eb9-4acb-4ae3-9fff-115f232c301f",
                "name": "Arnold Castillo",
                "slug": "arnold-castillo",
                "email": "arnoldcastillo@sustenza.com",
                "bio": "",
                "website": "",
                "location": "incididunt",
                "status": "active",
                "language": "en_US",
                "created_at": "2014-02-15T15:45:30.998 +05:00",
                "updated_at": "2012-09-24T06:25:24.791 +04:00"
            },
            "updated_at": "2012-12-21T22:26:29.305 +05:00",
            "updated_by": {
                "id": 9,
                "uuid": "7c47a15d-a250-4bf3-b309-d3efdf4a29c8",
                "name": "Marisol Hinton",
                "slug": "marisol-hinton",
                "email": "marisolhinton@sustenza.com",
                "bio": "",
                "website": "",
                "location": "velit anim",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-12-22T19:10:36.551 +05:00",
                "updated_at": "2014-03-09T22:16:46.593 +04:00"
            },
            "published_at": "2012-02-11T10:12:50.815 +05:00",
            "published_by": {
                "id": 1,
                "uuid": "831bc95c-c53d-4d04-a196-c9ce30199fd3",
                "name": "Cynthia Riddle",
                "slug": "cynthia-riddle",
                "email": "cynthiariddle@sustenza.com",
                "bio": "",
                "website": "",
                "location": "sit exercitation",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-11-20T06:47:46.803 +05:00",
                "updated_at": "2012-07-09T11:31:40.215 +04:00"
            },
            "tags": [
                {
                    "id": 75,
                    "uuid": "bc96cc6b-2c90-42fa-927c-13dde798dab6",
                    "name": "irure veniam",
                    "slug": "irure-veniam",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-02-04T21:57:11.571 +05:00",
                    "created_by": 1,
                    "updated_at": "2012-02-02T22:55:23.230 +05:00",
                    "updated_by": 3
                }
            ]
        },
        {
            "id": 17,
            "uuid": "11b10c37-de86-41f1-8905-e9bf46c847a7",
            "status": "published ",
            "title": "eiusmod in",
            "slug": "eiusmod-in",
            "markdown": "In aute non exercitation commodo dolore fugiat laborum duis mollit cupidatat duis ipsum exercitation. Laboris velit culpa ea consectetur mollit exercitation aute. Qui aliqua commodo officia quis amet laboris sunt. Commodo cupidatat dolor aliqua consectetur duis ad amet labore qui Lorem cillum labore cupidatat quis.\r\nEa consequat amet deserunt amet pariatur pariatur ea. Et mollit consectetur occaecat cupidatat aliqua do incididunt adipisicing dolore dolore magna consectetur fugiat non. Esse deserunt elit dolor amet occaecat excepteur anim. Eu velit eu consequat ut nisi do laborum ipsum reprehenderit eu laborum. Officia non ut elit ad duis laborum non fugiat eiusmod adipisicing excepteur irure dolore. Magna excepteur voluptate consequat ea deserunt sit duis cupidatat et ad minim. Aute laborum cillum do adipisicing.\r\nDolor incididunt consectetur in consequat. Tempor nostrud commodo officia do in in et. Sint eiusmod ut officia dolor id sit esse minim. Proident magna sunt do reprehenderit voluptate. Mollit pariatur aliqua esse ad ea exercitation do est reprehenderit adipisicing pariatur nulla. Sint amet sint ut adipisicing. Consectetur commodo esse est laborum ut exercitation est et.\r\nUt dolor qui magna cupidatat id consequat. Sunt proident incididunt incididunt veniam duis ut ut ad veniam. Laboris eiusmod consectetur culpa et. Ex nostrud aliquip laboris qui. Ad laboris cupidatat cillum esse amet nostrud consectetur reprehenderit proident.\r\n",
            "html": "<p>In aute non exercitation commodo dolore fugiat laborum duis mollit cupidatat duis ipsum exercitation. Laboris velit culpa ea consectetur mollit exercitation aute. Qui aliqua commodo officia quis amet laboris sunt. Commodo cupidatat dolor aliqua consectetur duis ad amet labore qui Lorem cillum labore cupidatat quis.\r\nEa consequat amet deserunt amet pariatur pariatur ea. Et mollit consectetur occaecat cupidatat aliqua do incididunt adipisicing dolore dolore magna consectetur fugiat non. Esse deserunt elit dolor amet occaecat excepteur anim. Eu velit eu consequat ut nisi do laborum ipsum reprehenderit eu laborum. Officia non ut elit ad duis laborum non fugiat eiusmod adipisicing excepteur irure dolore. Magna excepteur voluptate consequat ea deserunt sit duis cupidatat et ad minim. Aute laborum cillum do adipisicing.\r\nDolor incididunt consectetur in consequat. Tempor nostrud commodo officia do in in et. Sint eiusmod ut officia dolor id sit esse minim. Proident magna sunt do reprehenderit voluptate. Mollit pariatur aliqua esse ad ea exercitation do est reprehenderit adipisicing pariatur nulla. Sint amet sint ut adipisicing. Consectetur commodo esse est laborum ut exercitation est et.\r\nUt dolor qui magna cupidatat id consequat. Sunt proident incididunt incididunt veniam duis ut ut ad veniam. Laboris eiusmod consectetur culpa et. Ex nostrud aliquip laboris qui. Ad laboris cupidatat cillum esse amet nostrud consectetur reprehenderit proident.\r\n</p>",
            "image": null,
            "featured": 0,
            "page": 4,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 9,
                "uuid": "a70d35a2-d27c-4bcf-a41d-6f35199a6c48",
                "name": "Madden Gray",
                "slug": "madden-gray",
                "email": "maddengray@sustenza.com",
                "bio": "",
                "website": "",
                "location": "dolore dolor",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-03-20T20:05:05.032 +04:00",
                "updated_at": "2012-03-18T15:49:48.685 +04:00"
            },
            "created_at": "2012-02-03T00:22:27.826 +05:00",
            "created_by": {
                "id": 4,
                "uuid": "4f1bcb61-fc10-4e50-bf63-9d089b43e3e0",
                "name": "Ingrid Spencer",
                "slug": "ingrid-spencer",
                "email": "ingridspencer@sustenza.com",
                "bio": "",
                "website": "",
                "location": "ad",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-07-05T18:00:42.464 +04:00",
                "updated_at": "2014-04-23T04:57:18.316 +04:00"
            },
            "updated_at": "2013-10-05T19:55:38.684 +04:00",
            "updated_by": {
                "id": 10,
                "uuid": "9bebcd9f-5221-4f4a-8a8b-6779c6b3ecff",
                "name": "Roy Farley",
                "slug": "roy-farley",
                "email": "royfarley@sustenza.com",
                "bio": "",
                "website": "",
                "location": "voluptate",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-10-26T06:41:20.175 +04:00",
                "updated_at": "2012-03-27T14:57:32.976 +04:00"
            },
            "published_at": "2012-11-27T22:09:36.783 +05:00",
            "published_by": {
                "id": 1,
                "uuid": "4cb68e2a-b2f4-462c-8582-31e5f12e19e3",
                "name": "Marylou Price",
                "slug": "marylou-price",
                "email": "marylouprice@sustenza.com",
                "bio": "",
                "website": "",
                "location": "sint mollit",
                "status": "active",
                "language": "en_US",
                "created_at": "2014-02-21T13:00:48.439 +05:00",
                "updated_at": "2012-08-13T18:17:47.142 +04:00"
            },
            "tags": [
                {
                    "id": 11,
                    "uuid": "38fe6bbc-0f51-4885-90ef-6855c4ef60b5",
                    "name": "non",
                    "slug": "non",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-02-24T05:43:30.423 +05:00",
                    "created_by": 2,
                    "updated_at": "2012-03-03T03:43:05.543 +05:00",
                    "updated_by": 10
                },
                {
                    "id": 15,
                    "uuid": "7926173c-7655-4808-8a75-efb1bcad1439",
                    "name": "elit",
                    "slug": "elit",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-02-16T16:42:11.856 +05:00",
                    "created_by": 3,
                    "updated_at": "2013-07-05T05:58:37.642 +04:00",
                    "updated_by": 5
                },
                {
                    "id": 4,
                    "uuid": "801623a5-76f8-4673-8789-dfc68c8589c6",
                    "name": "excepteur anim",
                    "slug": "excepteur-anim",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-02-01T18:56:30.331 +05:00",
                    "created_by": 0,
                    "updated_at": "2013-01-21T09:44:07.442 +05:00",
                    "updated_by": 4
                },
                {
                    "id": 20,
                    "uuid": "3306b75e-f06f-4c3e-af38-513da401f218",
                    "name": "sunt exercitation",
                    "slug": "sunt-exercitation",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-01-30T12:34:47.452 +05:00",
                    "created_by": 1,
                    "updated_at": "2012-06-21T18:12:24.099 +04:00",
                    "updated_by": 10
                },
                {
                    "id": 65,
                    "uuid": "c9eb6d2d-5e81-4503-9e3d-bd03dfb59c88",
                    "name": "irure",
                    "slug": "irure",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-08-06T18:55:29.961 +04:00",
                    "created_by": 8,
                    "updated_at": "2013-05-15T23:16:27.378 +04:00",
                    "updated_by": 5
                },
                {
                    "id": 25,
                    "uuid": "f97a1213-4aeb-4add-9d38-dc1f25392c90",
                    "name": "mollit",
                    "slug": "mollit",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-12-12T09:48:47.421 +05:00",
                    "created_by": 9,
                    "updated_at": "2012-02-12T15:02:26.028 +05:00",
                    "updated_by": 8
                },
                {
                    "id": 88,
                    "uuid": "bba85b3a-4ac0-4289-969e-d6c14767c9bf",
                    "name": "esse",
                    "slug": "esse",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-01-17T15:42:06.266 +05:00",
                    "created_by": 4,
                    "updated_at": "2014-01-02T16:56:29.414 +05:00",
                    "updated_by": 6
                },
                {
                    "id": 29,
                    "uuid": "852178ac-d46f-4162-b07d-855b197141bc",
                    "name": "cillum",
                    "slug": "cillum",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-03-03T09:47:57.143 +05:00",
                    "created_by": 5,
                    "updated_at": "2012-12-02T13:17:25.426 +05:00",
                    "updated_by": 7
                },
                {
                    "id": 1,
                    "uuid": "9f3169a0-5258-40be-b8e4-5e41a67f4ef7",
                    "name": "deserunt cupidatat irure",
                    "slug": "deserunt-cupidatat-irure",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-03-27T14:13:20.653 +04:00",
                    "created_by": 5,
                    "updated_at": "2013-06-19T13:48:42.609 +04:00",
                    "updated_by": 9
                }
            ]
        },
        {
            "id": 18,
            "uuid": "9b7fed7c-3eec-43a2-a1ad-f0b638bcc0d6",
            "status": "published ",
            "title": "qui culpa amet eiusmod cupidatat",
            "slug": "qui-culpa-amet-eiusmod-cupidatat",
            "markdown": "Ut quis tempor voluptate magna labore adipisicing sit labore irure. Nisi Lorem sint voluptate minim labore anim ullamco quis et velit dolore consectetur enim. Excepteur esse sint do anim aute nisi.\r\nCulpa aute velit ipsum sunt ex elit adipisicing veniam id. Aute qui esse amet incididunt velit ea amet ut Lorem ullamco officia. Irure ut incididunt laborum sunt do eu est irure ut do esse. Labore reprehenderit est anim laboris incididunt non id quis exercitation deserunt deserunt elit eu. Duis enim occaecat aliqua aliquip id et laborum ipsum ut qui dolore sunt. Sunt excepteur cupidatat voluptate ullamco.\r\nDolore fugiat aliquip est anim laboris excepteur excepteur. Culpa ex ad ullamco labore aliquip mollit veniam nisi amet velit. Ex anim ullamco minim exercitation irure.\r\nIpsum tempor nulla in qui incididunt quis Lorem esse in. Id velit culpa cupidatat nostrud commodo ullamco reprehenderit. Sunt non est ut cillum cillum exercitation. Ad non ipsum mollit pariatur ullamco culpa. Culpa esse est et sint laboris veniam proident consequat.\r\nVelit proident sunt esse minim ullamco. Reprehenderit eiusmod reprehenderit sint quis adipisicing deserunt ullamco est. Deserunt eiusmod exercitation sit duis nostrud amet est consectetur ipsum cupidatat. Eiusmod velit culpa mollit adipisicing qui.\r\nAd excepteur laboris deserunt qui sunt minim do esse eu. Aliquip ut adipisicing duis et elit veniam nulla cupidatat minim non ut tempor eu aute. Aliqua incididunt eiusmod et dolor. Sint ullamco proident voluptate aliquip cupidatat cillum. Consequat qui non consectetur ad tempor ex nulla est pariatur. Culpa ea ex in et magna voluptate officia consectetur do aute veniam. Nostrud non occaecat excepteur cupidatat minim dolor dolor.\r\nReprehenderit ad elit in fugiat fugiat aute commodo. Nostrud culpa dolore eu laborum duis ea est laboris magna mollit ex velit amet. Id minim veniam irure nostrud velit sunt. Minim laboris proident veniam id quis qui ex eiusmod ad aliquip dolor pariatur Lorem. Fugiat esse qui excepteur velit sint magna occaecat in dolore laboris.\r\n",
            "html": "<p>Ut quis tempor voluptate magna labore adipisicing sit labore irure. Nisi Lorem sint voluptate minim labore anim ullamco quis et velit dolore consectetur enim. Excepteur esse sint do anim aute nisi.\r\nCulpa aute velit ipsum sunt ex elit adipisicing veniam id. Aute qui esse amet incididunt velit ea amet ut Lorem ullamco officia. Irure ut incididunt laborum sunt do eu est irure ut do esse. Labore reprehenderit est anim laboris incididunt non id quis exercitation deserunt deserunt elit eu. Duis enim occaecat aliqua aliquip id et laborum ipsum ut qui dolore sunt. Sunt excepteur cupidatat voluptate ullamco.\r\nDolore fugiat aliquip est anim laboris excepteur excepteur. Culpa ex ad ullamco labore aliquip mollit veniam nisi amet velit. Ex anim ullamco minim exercitation irure.\r\nIpsum tempor nulla in qui incididunt quis Lorem esse in. Id velit culpa cupidatat nostrud commodo ullamco reprehenderit. Sunt non est ut cillum cillum exercitation. Ad non ipsum mollit pariatur ullamco culpa. Culpa esse est et sint laboris veniam proident consequat.\r\nVelit proident sunt esse minim ullamco. Reprehenderit eiusmod reprehenderit sint quis adipisicing deserunt ullamco est. Deserunt eiusmod exercitation sit duis nostrud amet est consectetur ipsum cupidatat. Eiusmod velit culpa mollit adipisicing qui.\r\nAd excepteur laboris deserunt qui sunt minim do esse eu. Aliquip ut adipisicing duis et elit veniam nulla cupidatat minim non ut tempor eu aute. Aliqua incididunt eiusmod et dolor. Sint ullamco proident voluptate aliquip cupidatat cillum. Consequat qui non consectetur ad tempor ex nulla est pariatur. Culpa ea ex in et magna voluptate officia consectetur do aute veniam. Nostrud non occaecat excepteur cupidatat minim dolor dolor.\r\nReprehenderit ad elit in fugiat fugiat aute commodo. Nostrud culpa dolore eu laborum duis ea est laboris magna mollit ex velit amet. Id minim veniam irure nostrud velit sunt. Minim laboris proident veniam id quis qui ex eiusmod ad aliquip dolor pariatur Lorem. Fugiat esse qui excepteur velit sint magna occaecat in dolore laboris.\r\n</p>",
            "image": null,
            "featured": 1,
            "page": 9,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 2,
                "uuid": "e0c3e826-46f1-40ba-9ffd-4de0a2c19638",
                "name": "Queen Burris",
                "slug": "queen-burris",
                "email": "queenburris@sustenza.com",
                "bio": "",
                "website": "",
                "location": "voluptate officia cillum",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-06-11T20:36:37.718 +04:00",
                "updated_at": "2014-03-21T00:46:00.183 +04:00"
            },
            "created_at": "2013-05-24T08:51:30.527 +04:00",
            "created_by": {
                "id": 8,
                "uuid": "bf2c6128-6017-4910-95e2-d22ab2fd4111",
                "name": "Ward Alexander",
                "slug": "ward-alexander",
                "email": "wardalexander@sustenza.com",
                "bio": "",
                "website": "",
                "location": "reprehenderit",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-03-01T11:25:06.471 +05:00",
                "updated_at": "2013-04-20T18:20:03.698 +04:00"
            },
            "updated_at": "2013-08-05T14:59:34.903 +04:00",
            "updated_by": {
                "id": 0,
                "uuid": "94b80b3c-b0a7-401d-b126-364912243d28",
                "name": "Lynnette Whitley",
                "slug": "lynnette-whitley",
                "email": "lynnettewhitley@sustenza.com",
                "bio": "",
                "website": "",
                "location": "cupidatat",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-10-29T04:45:14.892 +04:00",
                "updated_at": "2013-11-01T04:39:02.606 +04:00"
            },
            "published_at": "2013-03-16T08:30:35.874 +04:00",
            "published_by": {
                "id": 3,
                "uuid": "28ad0e59-39c9-450a-81d0-6a152a7af537",
                "name": "Maureen Harvey",
                "slug": "maureen-harvey",
                "email": "maureenharvey@sustenza.com",
                "bio": "",
                "website": "",
                "location": "ipsum ut reprehenderit",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-01-12T19:11:23.515 +05:00",
                "updated_at": "2014-04-23T09:31:37.537 +04:00"
            },
            "tags": [
                {
                    "id": 38,
                    "uuid": "be9bbd51-5675-4f9d-ac42-ab2d924dc393",
                    "name": "sint quis nostrud",
                    "slug": "sint-quis-nostrud",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-03-17T17:41:09.165 +04:00",
                    "created_by": 4,
                    "updated_at": "2013-06-27T15:13:03.048 +04:00",
                    "updated_by": 8
                },
                {
                    "id": 95,
                    "uuid": "4fe4c53f-11a0-4b44-8790-abd0e7960d1f",
                    "name": "eiusmod",
                    "slug": "eiusmod",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-03-28T02:16:26.415 +04:00",
                    "created_by": 6,
                    "updated_at": "2012-09-07T13:14:19.770 +04:00",
                    "updated_by": 7
                },
                {
                    "id": 21,
                    "uuid": "e2089ce0-e395-4498-be68-3761983a7d39",
                    "name": "aute nisi",
                    "slug": "aute-nisi",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-02-22T17:36:42.195 +05:00",
                    "created_by": 1,
                    "updated_at": "2012-03-07T08:49:18.035 +05:00",
                    "updated_by": 1
                },
                {
                    "id": 55,
                    "uuid": "5090adb6-6470-4a42-8b1f-cb8cebf4af52",
                    "name": "cupidatat nisi Lorem",
                    "slug": "cupidatat-nisi-lorem",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-04-18T01:23:53.628 +04:00",
                    "created_by": 4,
                    "updated_at": "2012-12-14T02:25:25.738 +05:00",
                    "updated_by": 4
                },
                {
                    "id": 18,
                    "uuid": "7432b2d5-9b89-4979-938f-7b75359343a9",
                    "name": "pariatur duis",
                    "slug": "pariatur-duis",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-05-30T20:46:40.577 +04:00",
                    "created_by": 6,
                    "updated_at": "2013-06-29T15:49:48.163 +04:00",
                    "updated_by": 8
                },
                {
                    "id": 70,
                    "uuid": "61a14542-8559-44b2-8a43-5a62c210e78e",
                    "name": "anim",
                    "slug": "anim",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-09-05T05:53:05.405 +04:00",
                    "created_by": 8,
                    "updated_at": "2014-04-13T05:45:38.089 +04:00",
                    "updated_by": 1
                }
            ]
        },
        {
            "id": 19,
            "uuid": "cbcdb48a-bfb7-46cf-9b52-4adf433714fe",
            "status": "draft",
            "title": "ea consectetur qui mollit consequat excepteur proident",
            "slug": "ea-consectetur-qui-mollit-consequat-excepteur-proident",
            "markdown": "Amet velit veniam proident magna anim eu sint tempor et eu quis voluptate. Sint ex excepteur sint velit pariatur. Minim consequat nisi dolore duis est sunt fugiat do ex incididunt qui commodo laborum laboris. Cupidatat eu ex sit Lorem esse sunt sunt. Reprehenderit anim consectetur commodo exercitation. Anim ex officia voluptate ea adipisicing velit minim anim ipsum enim.\r\nOfficia occaecat id qui irure dolor elit velit cillum laborum. Amet incididunt dolore quis irure dolore et quis. Lorem nulla proident minim culpa cupidatat proident Lorem esse ea magna esse esse.\r\nDo deserunt do cillum irure et officia cillum Lorem. Exercitation ullamco minim ipsum dolor est exercitation laborum ipsum adipisicing ad ad fugiat dolor. Reprehenderit et sint nulla labore consequat veniam aute culpa labore incididunt reprehenderit aliqua duis reprehenderit. Aliqua consectetur aliqua cupidatat aliqua sint officia deserunt voluptate in enim qui consequat. Aliquip nisi nisi veniam aute laboris laboris sunt. Labore et cillum excepteur sunt. Adipisicing consequat sint voluptate laborum tempor anim adipisicing.\r\nLabore in velit veniam magna est commodo. Qui incididunt ipsum anim ullamco. Est nulla officia dolore aliquip pariatur mollit ipsum amet minim non veniam nisi laboris ad. Proident nisi esse culpa nostrud voluptate consequat duis qui.\r\n",
            "html": "<p>Amet velit veniam proident magna anim eu sint tempor et eu quis voluptate. Sint ex excepteur sint velit pariatur. Minim consequat nisi dolore duis est sunt fugiat do ex incididunt qui commodo laborum laboris. Cupidatat eu ex sit Lorem esse sunt sunt. Reprehenderit anim consectetur commodo exercitation. Anim ex officia voluptate ea adipisicing velit minim anim ipsum enim.\r\nOfficia occaecat id qui irure dolor elit velit cillum laborum. Amet incididunt dolore quis irure dolore et quis. Lorem nulla proident minim culpa cupidatat proident Lorem esse ea magna esse esse.\r\nDo deserunt do cillum irure et officia cillum Lorem. Exercitation ullamco minim ipsum dolor est exercitation laborum ipsum adipisicing ad ad fugiat dolor. Reprehenderit et sint nulla labore consequat veniam aute culpa labore incididunt reprehenderit aliqua duis reprehenderit. Aliqua consectetur aliqua cupidatat aliqua sint officia deserunt voluptate in enim qui consequat. Aliquip nisi nisi veniam aute laboris laboris sunt. Labore et cillum excepteur sunt. Adipisicing consequat sint voluptate laborum tempor anim adipisicing.\r\nLabore in velit veniam magna est commodo. Qui incididunt ipsum anim ullamco. Est nulla officia dolore aliquip pariatur mollit ipsum amet minim non veniam nisi laboris ad. Proident nisi esse culpa nostrud voluptate consequat duis qui.\r\n</p>",
            "image": null,
            "featured": 0,
            "page": 3,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 2,
                "uuid": "4a7777d2-30bf-49e6-91d3-49fd43c63573",
                "name": "Margaret Sweeney",
                "slug": "margaret-sweeney",
                "email": "margaretsweeney@sustenza.com",
                "bio": "",
                "website": "",
                "location": "ullamco deserunt",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-12-31T18:22:08.176 +05:00",
                "updated_at": "2012-12-11T00:08:27.135 +05:00"
            },
            "created_at": "2014-03-01T02:16:33.927 +05:00",
            "created_by": {
                "id": 5,
                "uuid": "06d89b5e-cabf-4088-b26b-9813e88b8b59",
                "name": "Brooks Potter",
                "slug": "brooks-potter",
                "email": "brookspotter@sustenza.com",
                "bio": "",
                "website": "",
                "location": "cillum aute",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-11-26T09:16:19.673 +05:00",
                "updated_at": "2013-07-27T13:12:48.859 +04:00"
            },
            "updated_at": "2013-10-25T23:54:38.216 +04:00",
            "updated_by": {
                "id": 9,
                "uuid": "b560bbe4-bc99-4277-a33f-1753c6317f78",
                "name": "Adkins Blair",
                "slug": "adkins-blair",
                "email": "adkinsblair@sustenza.com",
                "bio": "",
                "website": "",
                "location": "culpa consectetur",
                "status": "active",
                "language": "en_US",
                "created_at": "2014-02-12T18:16:31.884 +05:00",
                "updated_at": "2014-01-13T04:04:53.910 +05:00"
            },
            "published_at": "2014-04-15T07:40:10.064 +04:00",
            "published_by": {
                "id": 5,
                "uuid": "db9c1d9b-9867-40c8-89c0-e9633f7de5d0",
                "name": "Foster Gill",
                "slug": "foster-gill",
                "email": "fostergill@sustenza.com",
                "bio": "",
                "website": "",
                "location": "pariatur proident",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-05-28T05:25:32.459 +04:00",
                "updated_at": "2013-08-16T03:39:55.160 +04:00"
            },
            "tags": [
                {
                    "id": 75,
                    "uuid": "268c2d93-954e-448d-8f45-ffec06f2ad82",
                    "name": "fugiat",
                    "slug": "fugiat",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-05-03T09:23:48.258 +04:00",
                    "created_by": 6,
                    "updated_at": "2012-04-01T19:19:52.133 +04:00",
                    "updated_by": 2
                },
                {
                    "id": 69,
                    "uuid": "8128cd5a-5555-42c4-a854-0c28cfa00632",
                    "name": "anim",
                    "slug": "anim",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-11-28T11:03:15.358 +05:00",
                    "created_by": 6,
                    "updated_at": "2012-08-04T04:14:44.341 +04:00",
                    "updated_by": 2
                },
                {
                    "id": 18,
                    "uuid": "a19f8a43-c05e-4128-99d0-4e6b9a754857",
                    "name": "tempor esse qui",
                    "slug": "tempor-esse-qui",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-01-21T04:23:55.673 +05:00",
                    "created_by": 0,
                    "updated_at": "2012-01-22T14:06:43.137 +05:00",
                    "updated_by": 9
                },
                {
                    "id": 30,
                    "uuid": "211b6275-ca95-4ad2-be7b-46010d8558b2",
                    "name": "officia dolor",
                    "slug": "officia-dolor",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-10-10T18:25:38.411 +04:00",
                    "created_by": 6,
                    "updated_at": "2012-01-02T10:01:27.768 +05:00",
                    "updated_by": 0
                },
                {
                    "id": 38,
                    "uuid": "888e215d-243c-427f-87e0-9136bd32309c",
                    "name": "adipisicing",
                    "slug": "adipisicing",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-05-27T09:09:43.121 +04:00",
                    "created_by": 6,
                    "updated_at": "2012-02-20T22:11:44.180 +05:00",
                    "updated_by": 6
                },
                {
                    "id": 31,
                    "uuid": "745f1f00-7492-45d0-8bc6-26624d0eb9c8",
                    "name": "duis",
                    "slug": "duis",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-07-03T11:07:16.596 +04:00",
                    "created_by": 5,
                    "updated_at": "2013-02-02T02:48:57.223 +05:00",
                    "updated_by": 10
                },
                {
                    "id": 1,
                    "uuid": "c4b260c1-1094-4355-ba22-bb952de81d2a",
                    "name": "exercitation in",
                    "slug": "exercitation-in",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-02-09T06:56:31.259 +05:00",
                    "created_by": 3,
                    "updated_at": "2013-08-06T22:06:23.929 +04:00",
                    "updated_by": 6
                }
            ]
        },
        {
            "id": 20,
            "uuid": "94dfebea-9855-4a24-acc7-6fcfc5a5b079",
            "status": "published ",
            "title": "amet incididunt est cillum quis duis reprehenderit",
            "slug": "amet-incididunt-est-cillum-quis-duis-reprehenderit",
            "markdown": "Ut commodo veniam enim mollit aliqua sunt eiusmod ex aliquip fugiat mollit. Dolore ea reprehenderit Lorem eu magna. Ullamco aliquip enim mollit anim velit velit cillum quis anim exercitation veniam aliquip. Officia dolor commodo esse reprehenderit adipisicing officia velit consectetur. Aliquip labore pariatur et minim cillum sit aute nulla Lorem. Irure reprehenderit ea cillum anim. Voluptate qui ullamco irure consequat nulla sit proident proident officia id cupidatat aliqua.\r\nVeniam cillum enim Lorem qui irure. Tempor consequat nostrud labore aute quis do do consequat incididunt dolore officia pariatur. Ea nulla deserunt mollit tempor. Occaecat magna non velit qui irure mollit laborum incididunt id aliqua. Sint et est duis irure veniam commodo. Mollit exercitation elit proident pariatur aliqua exercitation. Nulla aute fugiat eiusmod non voluptate sunt qui commodo laborum consequat.\r\n",
            "html": "<p>Ut commodo veniam enim mollit aliqua sunt eiusmod ex aliquip fugiat mollit. Dolore ea reprehenderit Lorem eu magna. Ullamco aliquip enim mollit anim velit velit cillum quis anim exercitation veniam aliquip. Officia dolor commodo esse reprehenderit adipisicing officia velit consectetur. Aliquip labore pariatur et minim cillum sit aute nulla Lorem. Irure reprehenderit ea cillum anim. Voluptate qui ullamco irure consequat nulla sit proident proident officia id cupidatat aliqua.\r\nVeniam cillum enim Lorem qui irure. Tempor consequat nostrud labore aute quis do do consequat incididunt dolore officia pariatur. Ea nulla deserunt mollit tempor. Occaecat magna non velit qui irure mollit laborum incididunt id aliqua. Sint et est duis irure veniam commodo. Mollit exercitation elit proident pariatur aliqua exercitation. Nulla aute fugiat eiusmod non voluptate sunt qui commodo laborum consequat.\r\n</p>",
            "image": null,
            "featured": 1,
            "page": 2,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 1,
                "uuid": "82207e62-40f6-41b3-bfe0-30cbeb18db10",
                "name": "Lowery Burns",
                "slug": "lowery-burns",
                "email": "loweryburns@sustenza.com",
                "bio": "",
                "website": "",
                "location": "culpa ad anim",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-07-16T16:47:06.101 +04:00",
                "updated_at": "2012-03-19T10:04:45.708 +04:00"
            },
            "created_at": "2014-04-14T21:02:21.286 +04:00",
            "created_by": {
                "id": 9,
                "uuid": "4a4667eb-f8d5-4c07-8b96-e81f61e5a348",
                "name": "Marsha Bishop",
                "slug": "marsha-bishop",
                "email": "marshabishop@sustenza.com",
                "bio": "",
                "website": "",
                "location": "amet",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-06-09T07:47:31.515 +04:00",
                "updated_at": "2012-08-30T14:23:53.483 +04:00"
            },
            "updated_at": "2014-04-23T14:18:29.449 +04:00",
            "updated_by": {
                "id": 8,
                "uuid": "6fa1c3ff-70b9-4eb0-8a7d-371e3b9ceaac",
                "name": "Marshall Lowe",
                "slug": "marshall-lowe",
                "email": "marshalllowe@sustenza.com",
                "bio": "",
                "website": "",
                "location": "qui occaecat fugiat",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-05-15T01:09:15.430 +04:00",
                "updated_at": "2014-03-17T10:36:05.072 +04:00"
            },
            "published_at": "2013-05-15T23:31:24.996 +04:00",
            "published_by": {
                "id": 9,
                "uuid": "805626ea-2828-499a-9fd9-7c2895344e18",
                "name": "Gill Cantrell",
                "slug": "gill-cantrell",
                "email": "gillcantrell@sustenza.com",
                "bio": "",
                "website": "",
                "location": "cillum quis tempor",
                "status": "active",
                "language": "en_US",
                "created_at": "2014-04-29T20:04:00.693 +04:00",
                "updated_at": "2012-10-28T16:30:29.173 +04:00"
            },
            "tags": [
                {
                    "id": 4,
                    "uuid": "9e61a38d-1bc2-44e1-b376-bb376cca512e",
                    "name": "dolore excepteur tempor",
                    "slug": "dolore-excepteur-tempor",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-09-07T08:37:07.306 +04:00",
                    "created_by": 9,
                    "updated_at": "2012-09-25T16:15:48.048 +04:00",
                    "updated_by": 5
                },
                {
                    "id": 71,
                    "uuid": "29e8e0ea-71aa-4111-a8e0-7cb5a7018013",
                    "name": "amet pariatur cillum",
                    "slug": "amet-pariatur-cillum",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-08-04T23:57:04.514 +04:00",
                    "created_by": 9,
                    "updated_at": "2013-07-26T04:03:24.812 +04:00",
                    "updated_by": 5
                },
                {
                    "id": 91,
                    "uuid": "b02391a7-e1f8-43f3-bf3d-16a5c0bd3c75",
                    "name": "esse",
                    "slug": "esse",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-01-07T02:04:40.805 +05:00",
                    "created_by": 7,
                    "updated_at": "2012-07-16T11:27:34.882 +04:00",
                    "updated_by": 5
                },
                {
                    "id": 97,
                    "uuid": "812128f6-2a42-41cb-a863-61a955d90649",
                    "name": "qui est ea",
                    "slug": "qui-est-ea",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-10-29T06:30:40.706 +04:00",
                    "created_by": 2,
                    "updated_at": "2012-07-27T23:09:29.600 +04:00",
                    "updated_by": 0
                },
                {
                    "id": 94,
                    "uuid": "ab268eb2-5a39-47cb-a006-679441bb976b",
                    "name": "quis",
                    "slug": "quis",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-07-14T16:19:26.822 +04:00",
                    "created_by": 3,
                    "updated_at": "2013-12-03T09:58:16.960 +05:00",
                    "updated_by": 9
                },
                {
                    "id": 50,
                    "uuid": "da1abff3-7504-4f53-ae20-1a3f1dc7cb42",
                    "name": "et id proident",
                    "slug": "et-id-proident",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-09-26T06:36:48.974 +04:00",
                    "created_by": 0,
                    "updated_at": "2013-11-05T14:29:52.826 +05:00",
                    "updated_by": 9
                },
                {
                    "id": 59,
                    "uuid": "416ee7b5-ce47-4ee9-9d49-371dcf065e45",
                    "name": "nostrud",
                    "slug": "nostrud",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-01-01T07:37:51.947 +05:00",
                    "created_by": 9,
                    "updated_at": "2012-06-01T03:47:51.610 +04:00",
                    "updated_by": 10
                },
                {
                    "id": 58,
                    "uuid": "96377c44-7c1b-4cd1-bb44-83e12ba6f701",
                    "name": "nulla",
                    "slug": "nulla",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-06-09T11:24:24.041 +04:00",
                    "created_by": 4,
                    "updated_at": "2013-08-03T05:56:49.150 +04:00",
                    "updated_by": 9
                },
                {
                    "id": 91,
                    "uuid": "e8e9e6d1-0f05-45b3-b8b9-994b28ee14ea",
                    "name": "ipsum",
                    "slug": "ipsum",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-01-09T09:01:03.981 +05:00",
                    "created_by": 3,
                    "updated_at": "2014-03-14T02:59:37.432 +04:00",
                    "updated_by": 10
                },
                {
                    "id": 54,
                    "uuid": "1964b4f7-24f3-40eb-b9d5-6421f54c7272",
                    "name": "et sit fugiat",
                    "slug": "et-sit-fugiat",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-02-08T20:50:09.643 +05:00",
                    "created_by": 4,
                    "updated_at": "2014-04-22T09:56:16.104 +04:00",
                    "updated_by": 10
                }
            ]
        },
        {
            "id": 21,
            "uuid": "9d3edf64-f606-4bcb-be50-b1fabc3c3180",
            "status": "published ",
            "title": "ex sunt",
            "slug": "ex-sunt",
            "markdown": "Aliqua nisi incididunt minim officia adipisicing nulla in irure quis cupidatat irure tempor ut. Id voluptate quis sit est cupidatat ex excepteur fugiat. Tempor nostrud do ipsum anim id laboris ut aliquip fugiat ea. Sit do magna ea et amet labore aliquip nostrud. Cupidatat nostrud quis excepteur consectetur qui culpa consequat sint enim mollit ipsum labore. Occaecat do fugiat qui consequat aliquip. Voluptate fugiat est veniam proident incididunt cillum do commodo.\r\nProident eiusmod qui incididunt excepteur aliqua enim voluptate veniam et dolore nisi est magna proident. Nostrud veniam officia cillum reprehenderit exercitation culpa anim aute laboris non sit sunt. Culpa anim cupidatat aute occaecat qui minim nisi duis non ipsum mollit. Excepteur quis sunt dolore minim excepteur dolor officia magna sit ipsum deserunt irure. Ex ipsum cillum ipsum consectetur sint.\r\nPariatur sint laboris excepteur duis. Occaecat aliqua dolor occaecat sit ullamco incididunt dolore nisi consequat ut eu. Exercitation fugiat ex eu esse ullamco non ex occaecat dolor in cupidatat anim dolor.\r\nMollit minim non in ut qui non sunt. Fugiat sit do nisi excepteur tempor occaecat esse ipsum consectetur. Qui laboris et enim est.\r\nCupidatat laborum ea irure enim sit Lorem consectetur incididunt. Nisi magna voluptate do ipsum elit nulla deserunt enim officia amet. Nulla ipsum deserunt labore incididunt est.\r\nMinim irure sunt nulla cupidatat. Aliquip eu minim labore cupidatat Lorem consectetur ad eu aliquip. Veniam fugiat ad pariatur ipsum ut. Ex dolor incididunt quis consectetur reprehenderit nisi culpa sit pariatur labore. Irure Lorem minim eiusmod ipsum deserunt irure magna aliqua eiusmod laboris minim occaecat ullamco. Occaecat aliqua voluptate sit ullamco veniam non proident.\r\nLorem consequat exercitation sunt deserunt enim eiusmod aliquip sit. Commodo voluptate fugiat culpa anim ex incididunt sunt amet nostrud. Ea id sit laborum qui consectetur consectetur irure cillum voluptate adipisicing Lorem magna sit ea. Irure eiusmod et cupidatat consectetur adipisicing id fugiat dolore aliquip est velit.\r\nDo pariatur ex labore ea ex consectetur adipisicing aliquip enim incididunt et enim laboris. Minim adipisicing veniam Lorem eu ea elit ipsum proident nostrud culpa eu. Labore cupidatat in laborum pariatur esse officia officia ea commodo adipisicing in do dolor. Veniam labore sit dolore nisi non sunt ullamco. Minim tempor ea velit nisi occaecat enim irure ex. Fugiat deserunt exercitation nisi laboris non id proident. Aute qui sit veniam et quis ea minim quis.\r\nEx nulla tempor aute dolore amet excepteur cupidatat et laborum reprehenderit duis. Anim id magna consectetur minim anim anim esse duis eu adipisicing. Aliquip est aute aliqua in. Eu dolor est ut proident esse id fugiat ullamco sint minim fugiat pariatur cillum magna. Aliqua et aute est nostrud. Tempor proident do dolore eu dolor culpa et sit occaecat.\r\n",
            "html": "<p>Aliqua nisi incididunt minim officia adipisicing nulla in irure quis cupidatat irure tempor ut. Id voluptate quis sit est cupidatat ex excepteur fugiat. Tempor nostrud do ipsum anim id laboris ut aliquip fugiat ea. Sit do magna ea et amet labore aliquip nostrud. Cupidatat nostrud quis excepteur consectetur qui culpa consequat sint enim mollit ipsum labore. Occaecat do fugiat qui consequat aliquip. Voluptate fugiat est veniam proident incididunt cillum do commodo.\r\nProident eiusmod qui incididunt excepteur aliqua enim voluptate veniam et dolore nisi est magna proident. Nostrud veniam officia cillum reprehenderit exercitation culpa anim aute laboris non sit sunt. Culpa anim cupidatat aute occaecat qui minim nisi duis non ipsum mollit. Excepteur quis sunt dolore minim excepteur dolor officia magna sit ipsum deserunt irure. Ex ipsum cillum ipsum consectetur sint.\r\nPariatur sint laboris excepteur duis. Occaecat aliqua dolor occaecat sit ullamco incididunt dolore nisi consequat ut eu. Exercitation fugiat ex eu esse ullamco non ex occaecat dolor in cupidatat anim dolor.\r\nMollit minim non in ut qui non sunt. Fugiat sit do nisi excepteur tempor occaecat esse ipsum consectetur. Qui laboris et enim est.\r\nCupidatat laborum ea irure enim sit Lorem consectetur incididunt. Nisi magna voluptate do ipsum elit nulla deserunt enim officia amet. Nulla ipsum deserunt labore incididunt est.\r\nMinim irure sunt nulla cupidatat. Aliquip eu minim labore cupidatat Lorem consectetur ad eu aliquip. Veniam fugiat ad pariatur ipsum ut. Ex dolor incididunt quis consectetur reprehenderit nisi culpa sit pariatur labore. Irure Lorem minim eiusmod ipsum deserunt irure magna aliqua eiusmod laboris minim occaecat ullamco. Occaecat aliqua voluptate sit ullamco veniam non proident.\r\nLorem consequat exercitation sunt deserunt enim eiusmod aliquip sit. Commodo voluptate fugiat culpa anim ex incididunt sunt amet nostrud. Ea id sit laborum qui consectetur consectetur irure cillum voluptate adipisicing Lorem magna sit ea. Irure eiusmod et cupidatat consectetur adipisicing id fugiat dolore aliquip est velit.\r\nDo pariatur ex labore ea ex consectetur adipisicing aliquip enim incididunt et enim laboris. Minim adipisicing veniam Lorem eu ea elit ipsum proident nostrud culpa eu. Labore cupidatat in laborum pariatur esse officia officia ea commodo adipisicing in do dolor. Veniam labore sit dolore nisi non sunt ullamco. Minim tempor ea velit nisi occaecat enim irure ex. Fugiat deserunt exercitation nisi laboris non id proident. Aute qui sit veniam et quis ea minim quis.\r\nEx nulla tempor aute dolore amet excepteur cupidatat et laborum reprehenderit duis. Anim id magna consectetur minim anim anim esse duis eu adipisicing. Aliquip est aute aliqua in. Eu dolor est ut proident esse id fugiat ullamco sint minim fugiat pariatur cillum magna. Aliqua et aute est nostrud. Tempor proident do dolore eu dolor culpa et sit occaecat.\r\n</p>",
            "image": null,
            "featured": 1,
            "page": 9,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 9,
                "uuid": "3b16d93e-ba5a-406c-a2d6-542deacd9d6c",
                "name": "Hartman Miranda",
                "slug": "hartman-miranda",
                "email": "hartmanmiranda@sustenza.com",
                "bio": "",
                "website": "",
                "location": "occaecat eu adipisicing",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-12-13T16:05:45.874 +05:00",
                "updated_at": "2012-12-18T04:04:24.957 +05:00"
            },
            "created_at": "2014-01-19T17:46:51.743 +05:00",
            "created_by": {
                "id": 2,
                "uuid": "4ce8194c-c024-4057-86f3-21758405d2b8",
                "name": "Alford Melton",
                "slug": "alford-melton",
                "email": "alfordmelton@sustenza.com",
                "bio": "",
                "website": "",
                "location": "proident",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-01-17T16:08:57.734 +05:00",
                "updated_at": "2012-04-23T09:54:33.325 +04:00"
            },
            "updated_at": "2013-12-03T18:49:05.470 +05:00",
            "updated_by": {
                "id": 7,
                "uuid": "65159ba6-2b30-4519-b6d8-f499ee3a5170",
                "name": "Cooley Arnold",
                "slug": "cooley-arnold",
                "email": "cooleyarnold@sustenza.com",
                "bio": "",
                "website": "",
                "location": "exercitation est dolore",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-02-23T10:35:45.198 +05:00",
                "updated_at": "2012-02-15T06:48:31.850 +05:00"
            },
            "published_at": "2013-12-28T01:25:37.823 +05:00",
            "published_by": {
                "id": 9,
                "uuid": "e28c5aca-b19e-456b-983d-ff67d192da4d",
                "name": "Essie Tran",
                "slug": "essie-tran",
                "email": "essietran@sustenza.com",
                "bio": "",
                "website": "",
                "location": "qui",
                "status": "active",
                "language": "en_US",
                "created_at": "2014-02-26T08:20:21.972 +05:00",
                "updated_at": "2012-10-29T15:08:32.879 +04:00"
            },
            "tags": []
        },
        {
            "id": 22,
            "uuid": "e514d769-39c0-4dee-b378-f0e8c85382fb",
            "status": "draft",
            "title": "culpa magna aute exercitation deserunt",
            "slug": "culpa-magna-aute-exercitation-deserunt",
            "markdown": "Aliquip cupidatat est cillum cillum ex sint officia dolore cillum dolor consequat. Minim cupidatat est consectetur do culpa irure nisi. Eu amet mollit incididunt veniam ad aliquip officia. Elit reprehenderit id eiusmod aliqua dolore incididunt sunt. Sunt esse irure voluptate aliquip qui reprehenderit esse anim non. Cupidatat esse sit dolore aute est velit dolor duis nisi ad. Proident velit dolore voluptate deserunt culpa.\r\nLaboris aliqua nisi culpa elit commodo duis duis. Laborum dolore aute ullamco adipisicing laboris esse officia fugiat et. Aliquip dolor enim sunt commodo nostrud ad magna sunt laboris laboris reprehenderit culpa minim. In sit velit ad in. Cupidatat eiusmod consectetur aliqua esse officia est non.\r\nEt officia ad non et. Minim reprehenderit amet enim laborum id eiusmod non qui. Velit veniam Lorem id qui sint est eiusmod. In anim sit ex laborum nostrud veniam commodo cillum ad excepteur. Officia magna aute pariatur nisi aliquip voluptate mollit veniam officia. Ullamco magna excepteur non cupidatat eu aute anim culpa quis culpa aute fugiat laboris et. Labore ea velit cillum quis enim consectetur.\r\nAliqua ut ea aute non in aliquip. Fugiat quis ea ad duis amet voluptate proident. Commodo cupidatat aliquip sit mollit deserunt sit cupidatat nisi eiusmod dolore labore.\r\nEu quis ea consequat ullamco. Quis nulla sunt voluptate cillum ad. Exercitation quis dolore duis laboris sit voluptate quis dolor officia voluptate consectetur ad.\r\nElit qui in ad deserunt mollit culpa ut dolore qui aliquip elit laborum aute. Adipisicing eiusmod est fugiat nulla non minim ex sit consectetur aliqua. Id minim laboris ullamco sit laborum eu consectetur veniam ut culpa sit aliquip fugiat magna. Magna minim quis eiusmod laborum reprehenderit aliquip. Qui exercitation non do aliqua consectetur deserunt ut aliquip id Lorem fugiat sit ad officia.\r\nAmet dolore eu veniam ullamco sit labore nulla. In cillum sit enim amet Lorem culpa ipsum excepteur. Id consequat irure esse exercitation nulla magna aliqua voluptate. Est tempor aliqua quis velit adipisicing ipsum aliquip. Velit nulla culpa in exercitation aliquip cillum tempor nisi. Est ipsum Lorem commodo nisi.\r\nId Lorem velit aliquip aute excepteur. Cillum laborum tempor aliqua est deserunt excepteur enim aliquip culpa commodo eu. Non culpa ad dolor esse Lorem esse cillum deserunt. Exercitation quis ex fugiat incididunt nostrud deserunt irure cupidatat ut sint. Elit mollit eiusmod irure anim pariatur pariatur velit non. Amet do eiusmod nostrud laborum aute.\r\nSit aliqua eu dolore sit deserunt voluptate magna. Fugiat consectetur cillum et amet ea amet eiusmod ut. Irure consectetur fugiat qui eiusmod. Ex cupidatat pariatur ullamco cillum ut ipsum do sunt laborum sit eu id non et.\r\nProident incididunt fugiat ea commodo est mollit nisi aute mollit tempor eiusmod proident esse nisi. Laborum eu pariatur dolore culpa do anim qui do reprehenderit dolor. Aute sint et tempor aute in do quis magna adipisicing aliqua proident sunt. Sint deserunt aliqua ad veniam dolor tempor proident sunt ea magna. Ullamco velit culpa dolor est elit pariatur ad duis amet reprehenderit.\r\n",
            "html": "<p>Aliquip cupidatat est cillum cillum ex sint officia dolore cillum dolor consequat. Minim cupidatat est consectetur do culpa irure nisi. Eu amet mollit incididunt veniam ad aliquip officia. Elit reprehenderit id eiusmod aliqua dolore incididunt sunt. Sunt esse irure voluptate aliquip qui reprehenderit esse anim non. Cupidatat esse sit dolore aute est velit dolor duis nisi ad. Proident velit dolore voluptate deserunt culpa.\r\nLaboris aliqua nisi culpa elit commodo duis duis. Laborum dolore aute ullamco adipisicing laboris esse officia fugiat et. Aliquip dolor enim sunt commodo nostrud ad magna sunt laboris laboris reprehenderit culpa minim. In sit velit ad in. Cupidatat eiusmod consectetur aliqua esse officia est non.\r\nEt officia ad non et. Minim reprehenderit amet enim laborum id eiusmod non qui. Velit veniam Lorem id qui sint est eiusmod. In anim sit ex laborum nostrud veniam commodo cillum ad excepteur. Officia magna aute pariatur nisi aliquip voluptate mollit veniam officia. Ullamco magna excepteur non cupidatat eu aute anim culpa quis culpa aute fugiat laboris et. Labore ea velit cillum quis enim consectetur.\r\nAliqua ut ea aute non in aliquip. Fugiat quis ea ad duis amet voluptate proident. Commodo cupidatat aliquip sit mollit deserunt sit cupidatat nisi eiusmod dolore labore.\r\nEu quis ea consequat ullamco. Quis nulla sunt voluptate cillum ad. Exercitation quis dolore duis laboris sit voluptate quis dolor officia voluptate consectetur ad.\r\nElit qui in ad deserunt mollit culpa ut dolore qui aliquip elit laborum aute. Adipisicing eiusmod est fugiat nulla non minim ex sit consectetur aliqua. Id minim laboris ullamco sit laborum eu consectetur veniam ut culpa sit aliquip fugiat magna. Magna minim quis eiusmod laborum reprehenderit aliquip. Qui exercitation non do aliqua consectetur deserunt ut aliquip id Lorem fugiat sit ad officia.\r\nAmet dolore eu veniam ullamco sit labore nulla. In cillum sit enim amet Lorem culpa ipsum excepteur. Id consequat irure esse exercitation nulla magna aliqua voluptate. Est tempor aliqua quis velit adipisicing ipsum aliquip. Velit nulla culpa in exercitation aliquip cillum tempor nisi. Est ipsum Lorem commodo nisi.\r\nId Lorem velit aliquip aute excepteur. Cillum laborum tempor aliqua est deserunt excepteur enim aliquip culpa commodo eu. Non culpa ad dolor esse Lorem esse cillum deserunt. Exercitation quis ex fugiat incididunt nostrud deserunt irure cupidatat ut sint. Elit mollit eiusmod irure anim pariatur pariatur velit non. Amet do eiusmod nostrud laborum aute.\r\nSit aliqua eu dolore sit deserunt voluptate magna. Fugiat consectetur cillum et amet ea amet eiusmod ut. Irure consectetur fugiat qui eiusmod. Ex cupidatat pariatur ullamco cillum ut ipsum do sunt laborum sit eu id non et.\r\nProident incididunt fugiat ea commodo est mollit nisi aute mollit tempor eiusmod proident esse nisi. Laborum eu pariatur dolore culpa do anim qui do reprehenderit dolor. Aute sint et tempor aute in do quis magna adipisicing aliqua proident sunt. Sint deserunt aliqua ad veniam dolor tempor proident sunt ea magna. Ullamco velit culpa dolor est elit pariatur ad duis amet reprehenderit.\r\n</p>",
            "image": null,
            "featured": 0,
            "page": 6,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 6,
                "uuid": "e5813e4f-3707-497d-bd26-4640fb444894",
                "name": "Tara Rojas",
                "slug": "tara-rojas",
                "email": "tararojas@sustenza.com",
                "bio": "",
                "website": "",
                "location": "quis anim",
                "status": "active",
                "language": "en_US",
                "created_at": "2014-01-18T21:00:12.870 +05:00",
                "updated_at": "2013-10-09T17:58:44.125 +04:00"
            },
            "created_at": "2012-09-21T02:15:22.740 +04:00",
            "created_by": {
                "id": 1,
                "uuid": "7cc56c1c-8ce2-40c9-b893-7a176892b8e2",
                "name": "Abbott Sanchez",
                "slug": "abbott-sanchez",
                "email": "abbottsanchez@sustenza.com",
                "bio": "",
                "website": "",
                "location": "adipisicing minim",
                "status": "active",
                "language": "en_US",
                "created_at": "2014-03-28T19:08:21.026 +04:00",
                "updated_at": "2013-03-09T18:15:35.231 +05:00"
            },
            "updated_at": "2012-07-25T20:09:58.992 +04:00",
            "updated_by": {
                "id": 2,
                "uuid": "03159fb8-5a7a-4662-88d9-4a6b64f8ad39",
                "name": "Heath Stephens",
                "slug": "heath-stephens",
                "email": "heathstephens@sustenza.com",
                "bio": "",
                "website": "",
                "location": "nulla ullamco",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-04-21T10:27:25.315 +04:00",
                "updated_at": "2013-12-31T10:07:16.970 +05:00"
            },
            "published_at": "2012-09-12T06:13:40.037 +04:00",
            "published_by": {
                "id": 9,
                "uuid": "9241e20f-53e8-4f65-8bf2-de37956f1a4a",
                "name": "Marlene Barnett",
                "slug": "marlene-barnett",
                "email": "marlenebarnett@sustenza.com",
                "bio": "",
                "website": "",
                "location": "id",
                "status": "active",
                "language": "en_US",
                "created_at": "2014-04-30T20:48:07.807 +04:00",
                "updated_at": "2012-08-11T06:48:42.454 +04:00"
            },
            "tags": [
                {
                    "id": 91,
                    "uuid": "7d9a06cd-292f-4aad-a7b2-f6207b2ee804",
                    "name": "exercitation",
                    "slug": "exercitation",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-02-23T07:01:37.317 +05:00",
                    "created_by": 3,
                    "updated_at": "2012-02-11T12:35:05.146 +05:00",
                    "updated_by": 1
                },
                {
                    "id": 13,
                    "uuid": "01da54e6-70b7-45b3-9544-6b7bd11e9aac",
                    "name": "sunt pariatur",
                    "slug": "sunt-pariatur",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-01-08T14:33:25.368 +05:00",
                    "created_by": 9,
                    "updated_at": "2013-09-02T13:38:31.183 +04:00",
                    "updated_by": 2
                }
            ]
        },
        {
            "id": 23,
            "uuid": "3ee82124-0f14-4047-b962-e98b6356dbaf",
            "status": "draft",
            "title": "qui enim cillum",
            "slug": "qui-enim-cillum",
            "markdown": "Occaecat et laborum id Lorem excepteur dolore. Nisi quis adipisicing ad et. Eiusmod irure deserunt ea eiusmod consectetur minim nulla exercitation consectetur mollit pariatur. Elit non culpa nostrud adipisicing officia eiusmod eu ex minim ea. Elit ea nostrud laboris minim laboris nostrud incididunt adipisicing mollit et. Qui ullamco aute consequat sunt nulla aliquip.\r\nFugiat excepteur pariatur duis est aute. Consequat in ad commodo duis in reprehenderit sit minim aliquip fugiat. Dolore qui minim sit anim veniam sunt anim nostrud occaecat labore cupidatat. Ullamco quis irure tempor pariatur pariatur ad aliqua do tempor magna eu. Occaecat dolor officia id officia nostrud cupidatat consequat pariatur ea proident.\r\n",
            "html": "<p>Occaecat et laborum id Lorem excepteur dolore. Nisi quis adipisicing ad et. Eiusmod irure deserunt ea eiusmod consectetur minim nulla exercitation consectetur mollit pariatur. Elit non culpa nostrud adipisicing officia eiusmod eu ex minim ea. Elit ea nostrud laboris minim laboris nostrud incididunt adipisicing mollit et. Qui ullamco aute consequat sunt nulla aliquip.\r\nFugiat excepteur pariatur duis est aute. Consequat in ad commodo duis in reprehenderit sit minim aliquip fugiat. Dolore qui minim sit anim veniam sunt anim nostrud occaecat labore cupidatat. Ullamco quis irure tempor pariatur pariatur ad aliqua do tempor magna eu. Occaecat dolor officia id officia nostrud cupidatat consequat pariatur ea proident.\r\n</p>",
            "image": null,
            "featured": 1,
            "page": 7,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 8,
                "uuid": "53ee8c08-ad76-4e5b-9de1-efadba24eb6a",
                "name": "Atkins Berger",
                "slug": "atkins-berger",
                "email": "atkinsberger@sustenza.com",
                "bio": "",
                "website": "",
                "location": "eu est",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-02-22T18:06:44.097 +05:00",
                "updated_at": "2013-07-27T04:23:41.730 +04:00"
            },
            "created_at": "2014-01-22T23:07:40.231 +05:00",
            "created_by": {
                "id": 6,
                "uuid": "0ba73efc-bdf4-4e7c-9c19-b2505bc9871e",
                "name": "Bryant Wilcox",
                "slug": "bryant-wilcox",
                "email": "bryantwilcox@sustenza.com",
                "bio": "",
                "website": "",
                "location": "occaecat fugiat",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-01-04T07:47:10.259 +05:00",
                "updated_at": "2013-08-02T16:40:06.966 +04:00"
            },
            "updated_at": "2013-10-14T12:08:27.554 +04:00",
            "updated_by": {
                "id": 2,
                "uuid": "3615056f-a630-428c-976f-2d7fa879389e",
                "name": "Walter Mosley",
                "slug": "walter-mosley",
                "email": "waltermosley@sustenza.com",
                "bio": "",
                "website": "",
                "location": "voluptate",
                "status": "active",
                "language": "en_US",
                "created_at": "2014-02-15T01:55:35.230 +05:00",
                "updated_at": "2012-05-25T11:31:36.904 +04:00"
            },
            "published_at": "2012-08-23T17:21:03.414 +04:00",
            "published_by": {
                "id": 0,
                "uuid": "7e12f1de-7dde-40c6-9a0d-734ca8064fd4",
                "name": "Marilyn Nelson",
                "slug": "marilyn-nelson",
                "email": "marilynnelson@sustenza.com",
                "bio": "",
                "website": "",
                "location": "qui anim do",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-05-27T14:13:02.168 +04:00",
                "updated_at": "2014-04-21T07:02:03.796 +04:00"
            },
            "tags": [
                {
                    "id": 33,
                    "uuid": "b11d0e98-0ad0-4b13-a4f3-c0f10389cbfd",
                    "name": "minim consequat",
                    "slug": "minim-consequat",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-07-05T08:13:20.733 +04:00",
                    "created_by": 4,
                    "updated_at": "2013-06-10T10:39:25.003 +04:00",
                    "updated_by": 0
                },
                {
                    "id": 100,
                    "uuid": "6bf68cbf-ab34-4f86-bd4c-01e8057d94dd",
                    "name": "do",
                    "slug": "do",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-03-22T21:33:49.053 +04:00",
                    "created_by": 0,
                    "updated_at": "2012-07-25T04:33:11.983 +04:00",
                    "updated_by": 2
                },
                {
                    "id": 46,
                    "uuid": "4d6dd936-38f6-43cd-a426-901be698bdf6",
                    "name": "anim mollit magna",
                    "slug": "anim-mollit-magna",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-09-26T22:35:28.040 +04:00",
                    "created_by": 4,
                    "updated_at": "2013-11-04T10:37:07.479 +05:00",
                    "updated_by": 1
                },
                {
                    "id": 45,
                    "uuid": "d2e26ce2-7d9e-4c31-9756-a3880e256735",
                    "name": "exercitation",
                    "slug": "exercitation",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-05-07T16:45:13.579 +04:00",
                    "created_by": 0,
                    "updated_at": "2012-06-04T22:20:36.192 +04:00",
                    "updated_by": 7
                },
                {
                    "id": 2,
                    "uuid": "7795e06e-7e35-4403-9d29-9bd5245c8785",
                    "name": "laboris",
                    "slug": "laboris",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-02-07T19:35:46.919 +05:00",
                    "created_by": 1,
                    "updated_at": "2012-01-13T09:58:53.351 +05:00",
                    "updated_by": 2
                },
                {
                    "id": 76,
                    "uuid": "fd70b42b-ced8-40a5-9f13-b97f74ba1253",
                    "name": "magna",
                    "slug": "magna",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-01-02T20:08:26.653 +05:00",
                    "created_by": 6,
                    "updated_at": "2012-02-28T07:54:33.198 +05:00",
                    "updated_by": 9
                },
                {
                    "id": 99,
                    "uuid": "4e115a2e-9cbb-48ce-9f13-af908c0a4ef1",
                    "name": "aute",
                    "slug": "aute",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-07-21T15:34:03.282 +04:00",
                    "created_by": 4,
                    "updated_at": "2013-01-30T05:55:36.538 +05:00",
                    "updated_by": 9
                },
                {
                    "id": 55,
                    "uuid": "f23f2ba9-85d4-4db9-95b5-067149273216",
                    "name": "consequat voluptate",
                    "slug": "consequat-voluptate",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-03-06T14:49:10.680 +05:00",
                    "created_by": 6,
                    "updated_at": "2013-11-28T13:44:31.306 +05:00",
                    "updated_by": 4
                },
                {
                    "id": 94,
                    "uuid": "bb2c3028-42db-46f5-b61c-c58558327030",
                    "name": "in Lorem exercitation",
                    "slug": "in-lorem-exercitation",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-05-13T23:02:38.316 +04:00",
                    "created_by": 8,
                    "updated_at": "2013-07-28T01:01:32.667 +04:00",
                    "updated_by": 0
                }
            ]
        },
        {
            "id": 24,
            "uuid": "17ec32e6-31d0-48af-a1a8-566d41e8e504",
            "status": "draft",
            "title": "incididunt excepteur",
            "slug": "incididunt-excepteur",
            "markdown": "Qui fugiat adipisicing minim culpa esse culpa. Dolor id adipisicing est ea tempor eu in sit ad. Incididunt pariatur Lorem est ullamco mollit aute ullamco. Adipisicing aliquip et labore aliquip dolore et amet ea. Esse consectetur sint sint incididunt nostrud id mollit. Qui excepteur ullamco aute tempor. Non minim fugiat adipisicing non ad velit proident enim mollit.\r\nEx pariatur officia ut eiusmod consectetur adipisicing labore adipisicing magna non adipisicing nisi cillum. Ea consectetur officia commodo cupidatat amet ex amet minim dolor. Aute consectetur aute enim quis aliqua proident. Sint sint qui est minim anim ea enim.\r\nDo quis deserunt deserunt et cillum eu dolor sunt anim voluptate proident. Mollit ullamco non incididunt consequat. Culpa cillum consequat qui aute dolore. Voluptate sit reprehenderit velit do cupidatat non amet anim sit irure magna. Ipsum ad velit do laborum dolore est adipisicing. Eu eu Lorem nulla aliquip anim adipisicing occaecat reprehenderit fugiat dolor enim.\r\nSunt sunt cillum ullamco magna aliquip sit officia officia cupidatat. Consectetur minim enim sit non. Anim reprehenderit ad eiusmod voluptate in velit consequat sunt tempor commodo commodo incididunt pariatur.\r\nVeniam consectetur ad incididunt magna aliquip pariatur consequat cupidatat. Laborum velit minim eiusmod ea commodo sunt aute occaecat ad et dolor esse. Est irure aliqua veniam ullamco. Sit excepteur enim do aliquip ullamco aute cupidatat id. Quis labore culpa cupidatat non. Non incididunt nisi irure consectetur elit commodo labore culpa proident enim in. Ex pariatur dolor in exercitation tempor adipisicing.\r\nConsectetur velit nulla fugiat dolor cupidatat in ut ea. Tempor adipisicing nulla elit cillum nisi commodo. Fugiat reprehenderit dolor est laborum irure do dolor mollit consectetur voluptate dolor cillum nostrud in. Pariatur ad in irure enim ad eiusmod proident anim dolore ipsum sint quis quis. Ad ipsum sunt magna aute proident laboris.\r\n",
            "html": "<p>Qui fugiat adipisicing minim culpa esse culpa. Dolor id adipisicing est ea tempor eu in sit ad. Incididunt pariatur Lorem est ullamco mollit aute ullamco. Adipisicing aliquip et labore aliquip dolore et amet ea. Esse consectetur sint sint incididunt nostrud id mollit. Qui excepteur ullamco aute tempor. Non minim fugiat adipisicing non ad velit proident enim mollit.\r\nEx pariatur officia ut eiusmod consectetur adipisicing labore adipisicing magna non adipisicing nisi cillum. Ea consectetur officia commodo cupidatat amet ex amet minim dolor. Aute consectetur aute enim quis aliqua proident. Sint sint qui est minim anim ea enim.\r\nDo quis deserunt deserunt et cillum eu dolor sunt anim voluptate proident. Mollit ullamco non incididunt consequat. Culpa cillum consequat qui aute dolore. Voluptate sit reprehenderit velit do cupidatat non amet anim sit irure magna. Ipsum ad velit do laborum dolore est adipisicing. Eu eu Lorem nulla aliquip anim adipisicing occaecat reprehenderit fugiat dolor enim.\r\nSunt sunt cillum ullamco magna aliquip sit officia officia cupidatat. Consectetur minim enim sit non. Anim reprehenderit ad eiusmod voluptate in velit consequat sunt tempor commodo commodo incididunt pariatur.\r\nVeniam consectetur ad incididunt magna aliquip pariatur consequat cupidatat. Laborum velit minim eiusmod ea commodo sunt aute occaecat ad et dolor esse. Est irure aliqua veniam ullamco. Sit excepteur enim do aliquip ullamco aute cupidatat id. Quis labore culpa cupidatat non. Non incididunt nisi irure consectetur elit commodo labore culpa proident enim in. Ex pariatur dolor in exercitation tempor adipisicing.\r\nConsectetur velit nulla fugiat dolor cupidatat in ut ea. Tempor adipisicing nulla elit cillum nisi commodo. Fugiat reprehenderit dolor est laborum irure do dolor mollit consectetur voluptate dolor cillum nostrud in. Pariatur ad in irure enim ad eiusmod proident anim dolore ipsum sint quis quis. Ad ipsum sunt magna aute proident laboris.\r\n</p>",
            "image": null,
            "featured": 0,
            "page": 5,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 4,
                "uuid": "a04ff15c-dca3-4a15-bdee-fd05bd9b7907",
                "name": "Fischer Greene",
                "slug": "fischer-greene",
                "email": "fischergreene@sustenza.com",
                "bio": "",
                "website": "",
                "location": "anim",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-03-11T01:19:14.027 +05:00",
                "updated_at": "2013-01-08T08:58:28.436 +05:00"
            },
            "created_at": "2013-11-22T00:26:27.136 +05:00",
            "created_by": {
                "id": 2,
                "uuid": "f5ce58ca-0b76-4782-b493-7365e488b7ab",
                "name": "Hawkins Calderon",
                "slug": "hawkins-calderon",
                "email": "hawkinscalderon@sustenza.com",
                "bio": "",
                "website": "",
                "location": "magna",
                "status": "active",
                "language": "en_US",
                "created_at": "2014-04-25T00:02:47.748 +04:00",
                "updated_at": "2013-07-27T05:59:44.522 +04:00"
            },
            "updated_at": "2012-12-16T01:20:11.644 +05:00",
            "updated_by": {
                "id": 0,
                "uuid": "0534779d-15f8-4387-a388-b973e5bd389d",
                "name": "Tate Valdez",
                "slug": "tate-valdez",
                "email": "tatevaldez@sustenza.com",
                "bio": "",
                "website": "",
                "location": "deserunt",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-03-30T22:36:22.928 +04:00",
                "updated_at": "2013-03-03T09:20:40.137 +05:00"
            },
            "published_at": "2012-02-16T06:30:12.927 +05:00",
            "published_by": {
                "id": 9,
                "uuid": "7461790e-b082-454d-a12f-6e9510376390",
                "name": "Vazquez Rocha",
                "slug": "vazquez-rocha",
                "email": "vazquezrocha@sustenza.com",
                "bio": "",
                "website": "",
                "location": "labore nostrud exercitation",
                "status": "active",
                "language": "en_US",
                "created_at": "2014-04-21T12:18:02.341 +04:00",
                "updated_at": "2013-09-20T00:50:08.877 +04:00"
            },
            "tags": [
                {
                    "id": 73,
                    "uuid": "220ad8c6-d864-4e70-9d93-36f1009c32f2",
                    "name": "ipsum",
                    "slug": "ipsum",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-01-18T04:51:51.157 +05:00",
                    "created_by": 1,
                    "updated_at": "2013-03-17T21:23:25.552 +04:00",
                    "updated_by": 8
                },
                {
                    "id": 79,
                    "uuid": "118c594e-41bd-4b88-af21-2fd7bc96e5af",
                    "name": "ea",
                    "slug": "ea",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-01-18T12:34:57.130 +05:00",
                    "created_by": 3,
                    "updated_at": "2014-01-09T15:31:16.248 +05:00",
                    "updated_by": 0
                },
                {
                    "id": 71,
                    "uuid": "9679722f-bb17-4ce8-b740-b536e393445f",
                    "name": "Lorem nulla duis",
                    "slug": "lorem-nulla-duis",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-12-17T20:59:21.509 +05:00",
                    "created_by": 9,
                    "updated_at": "2012-01-21T06:34:13.449 +05:00",
                    "updated_by": 2
                },
                {
                    "id": 1,
                    "uuid": "520a549f-2e2e-4af3-bb21-81201cd9fa84",
                    "name": "nulla minim",
                    "slug": "nulla-minim",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-02-14T01:13:09.355 +05:00",
                    "created_by": 1,
                    "updated_at": "2012-06-27T01:56:22.252 +04:00",
                    "updated_by": 9
                },
                {
                    "id": 72,
                    "uuid": "56127e1c-1d0e-4844-b606-d31166b6f396",
                    "name": "aliqua laboris",
                    "slug": "aliqua-laboris",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-04-17T03:47:08.064 +04:00",
                    "created_by": 2,
                    "updated_at": "2014-03-09T06:52:52.350 +04:00",
                    "updated_by": 3
                },
                {
                    "id": 14,
                    "uuid": "44d01fca-c9b7-4127-8797-2da2a1530223",
                    "name": "quis fugiat nisi",
                    "slug": "quis-fugiat-nisi",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-05-14T11:29:49.817 +04:00",
                    "created_by": 0,
                    "updated_at": "2013-10-22T03:59:34.584 +04:00",
                    "updated_by": 6
                },
                {
                    "id": 30,
                    "uuid": "a4038887-f33e-415c-92d0-e2ccabc0268b",
                    "name": "aliqua",
                    "slug": "aliqua",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-08-13T08:10:30.250 +04:00",
                    "created_by": 7,
                    "updated_at": "2013-12-09T04:44:54.064 +05:00",
                    "updated_by": 7
                },
                {
                    "id": 35,
                    "uuid": "ba6a7189-1f74-4f06-9512-bbfb7a8c8e09",
                    "name": "occaecat",
                    "slug": "occaecat",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-07-14T03:26:42.593 +04:00",
                    "created_by": 2,
                    "updated_at": "2013-11-12T20:38:10.316 +05:00",
                    "updated_by": 8
                },
                {
                    "id": 97,
                    "uuid": "497e2276-e12e-4666-a16a-92284e18ddff",
                    "name": "duis deserunt",
                    "slug": "duis-deserunt",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-11-13T06:44:37.981 +05:00",
                    "created_by": 7,
                    "updated_at": "2014-05-01T15:04:48.981 +04:00",
                    "updated_by": 5
                }
            ]
        },
        {
            "id": 25,
            "uuid": "064d86e6-95ae-4da1-822c-47c8c92f1505",
            "status": "draft",
            "title": "veniam deserunt amet eu consectetur duis id",
            "slug": "veniam-deserunt-amet-eu-consectetur-duis-id",
            "markdown": "Elit Lorem consectetur officia proident non aliquip dolore adipisicing consectetur Lorem Lorem est. Esse esse laboris labore officia. Irure nostrud incididunt consectetur velit nulla id adipisicing aliqua reprehenderit. Laborum est ipsum pariatur occaecat labore est enim commodo reprehenderit est est enim proident nulla. Id do est proident eiusmod nisi officia qui incididunt laboris qui pariatur. Non commodo aliquip consequat incididunt aliquip officia commodo eiusmod eiusmod mollit sunt commodo. Minim deserunt eu magna minim adipisicing reprehenderit adipisicing nostrud fugiat.\r\nAute culpa culpa sunt tempor laboris nulla dolore esse officia est. Culpa aliquip deserunt sint culpa ex. Lorem consectetur laboris et deserunt anim sunt ad veniam nostrud dolor aute anim exercitation voluptate. Dolor consequat duis pariatur fugiat dolore irure. Proident ea adipisicing aliquip commodo reprehenderit elit id culpa sint do deserunt enim. Quis id duis tempor ullamco commodo incididunt ipsum.\r\nMagna est commodo consequat occaecat. Magna laborum laboris ullamco commodo est. Velit nisi laboris exercitation anim aliqua minim nisi nulla fugiat do.\r\nIn veniam occaecat ad irure enim id laboris enim nulla amet anim aute nostrud nulla. Labore incididunt velit esse ut consequat sit quis adipisicing pariatur nisi. Sint voluptate fugiat occaecat sit. Anim sint exercitation culpa fugiat fugiat anim exercitation minim ea incididunt sint. Excepteur anim magna culpa officia. Sunt laborum consectetur cupidatat eiusmod adipisicing dolore incididunt commodo. Sit occaecat laboris fugiat ex Lorem exercitation mollit officia dolore in esse cillum eu.\r\nTempor dolore id tempor cillum velit reprehenderit esse. Cupidatat enim aute tempor eu deserunt cillum deserunt aliqua ut enim in. Esse dolor minim sit velit do. Aliquip occaecat aliquip labore consectetur enim reprehenderit do esse commodo.\r\nEiusmod laborum irure est duis est laboris irure commodo est do commodo exercitation. Pariatur adipisicing quis et non ex anim eiusmod excepteur officia ullamco magna eiusmod. Duis do ipsum ex est culpa officia ipsum occaecat aliqua minim minim fugiat laboris. Duis do nulla nisi nulla. Voluptate adipisicing tempor dolor commodo occaecat sunt laboris. Minim nisi velit nostrud quis proident excepteur.\r\nId nisi reprehenderit sint amet commodo cillum incididunt laborum eu. Incididunt proident commodo duis cillum voluptate occaecat irure pariatur do id. Veniam nulla sint aute veniam Lorem quis. Tempor aliquip elit irure est ex mollit cupidatat laborum quis qui. Esse amet amet nulla do velit excepteur sit quis.\r\nAd in sit deserunt id duis. Esse culpa officia fugiat cupidatat pariatur veniam laboris reprehenderit excepteur laborum. Ex eu elit eu deserunt in laborum et. Eu sint ea pariatur cillum consectetur in sint elit ullamco irure quis. Dolore proident irure ex pariatur magna esse minim excepteur cupidatat dolore adipisicing est. Qui pariatur dolor consectetur anim deserunt deserunt laborum commodo aute proident nostrud.\r\nEa Lorem et in aliqua proident ipsum sit exercitation irure occaecat eiusmod consectetur exercitation. Labore eiusmod reprehenderit ex veniam nisi cupidatat excepteur deserunt nostrud elit ipsum nostrud aute magna. In dolor amet exercitation reprehenderit cupidatat cupidatat. Sint incididunt amet ea nulla cillum laborum enim aliquip ipsum quis quis dolore.\r\nFugiat nisi eu non consectetur eiusmod voluptate nulla nisi elit laboris ad. Pariatur dolor pariatur non laborum pariatur laboris incididunt. Enim consectetur laborum aliqua eiusmod irure.\r\n",
            "html": "<p>Elit Lorem consectetur officia proident non aliquip dolore adipisicing consectetur Lorem Lorem est. Esse esse laboris labore officia. Irure nostrud incididunt consectetur velit nulla id adipisicing aliqua reprehenderit. Laborum est ipsum pariatur occaecat labore est enim commodo reprehenderit est est enim proident nulla. Id do est proident eiusmod nisi officia qui incididunt laboris qui pariatur. Non commodo aliquip consequat incididunt aliquip officia commodo eiusmod eiusmod mollit sunt commodo. Minim deserunt eu magna minim adipisicing reprehenderit adipisicing nostrud fugiat.\r\nAute culpa culpa sunt tempor laboris nulla dolore esse officia est. Culpa aliquip deserunt sint culpa ex. Lorem consectetur laboris et deserunt anim sunt ad veniam nostrud dolor aute anim exercitation voluptate. Dolor consequat duis pariatur fugiat dolore irure. Proident ea adipisicing aliquip commodo reprehenderit elit id culpa sint do deserunt enim. Quis id duis tempor ullamco commodo incididunt ipsum.\r\nMagna est commodo consequat occaecat. Magna laborum laboris ullamco commodo est. Velit nisi laboris exercitation anim aliqua minim nisi nulla fugiat do.\r\nIn veniam occaecat ad irure enim id laboris enim nulla amet anim aute nostrud nulla. Labore incididunt velit esse ut consequat sit quis adipisicing pariatur nisi. Sint voluptate fugiat occaecat sit. Anim sint exercitation culpa fugiat fugiat anim exercitation minim ea incididunt sint. Excepteur anim magna culpa officia. Sunt laborum consectetur cupidatat eiusmod adipisicing dolore incididunt commodo. Sit occaecat laboris fugiat ex Lorem exercitation mollit officia dolore in esse cillum eu.\r\nTempor dolore id tempor cillum velit reprehenderit esse. Cupidatat enim aute tempor eu deserunt cillum deserunt aliqua ut enim in. Esse dolor minim sit velit do. Aliquip occaecat aliquip labore consectetur enim reprehenderit do esse commodo.\r\nEiusmod laborum irure est duis est laboris irure commodo est do commodo exercitation. Pariatur adipisicing quis et non ex anim eiusmod excepteur officia ullamco magna eiusmod. Duis do ipsum ex est culpa officia ipsum occaecat aliqua minim minim fugiat laboris. Duis do nulla nisi nulla. Voluptate adipisicing tempor dolor commodo occaecat sunt laboris. Minim nisi velit nostrud quis proident excepteur.\r\nId nisi reprehenderit sint amet commodo cillum incididunt laborum eu. Incididunt proident commodo duis cillum voluptate occaecat irure pariatur do id. Veniam nulla sint aute veniam Lorem quis. Tempor aliquip elit irure est ex mollit cupidatat laborum quis qui. Esse amet amet nulla do velit excepteur sit quis.\r\nAd in sit deserunt id duis. Esse culpa officia fugiat cupidatat pariatur veniam laboris reprehenderit excepteur laborum. Ex eu elit eu deserunt in laborum et. Eu sint ea pariatur cillum consectetur in sint elit ullamco irure quis. Dolore proident irure ex pariatur magna esse minim excepteur cupidatat dolore adipisicing est. Qui pariatur dolor consectetur anim deserunt deserunt laborum commodo aute proident nostrud.\r\nEa Lorem et in aliqua proident ipsum sit exercitation irure occaecat eiusmod consectetur exercitation. Labore eiusmod reprehenderit ex veniam nisi cupidatat excepteur deserunt nostrud elit ipsum nostrud aute magna. In dolor amet exercitation reprehenderit cupidatat cupidatat. Sint incididunt amet ea nulla cillum laborum enim aliquip ipsum quis quis dolore.\r\nFugiat nisi eu non consectetur eiusmod voluptate nulla nisi elit laboris ad. Pariatur dolor pariatur non laborum pariatur laboris incididunt. Enim consectetur laborum aliqua eiusmod irure.\r\n</p>",
            "image": null,
            "featured": 1,
            "page": 9,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 4,
                "uuid": "8a19b7f3-a7b6-49bc-8969-2397851f8e88",
                "name": "Lester Barlow",
                "slug": "lester-barlow",
                "email": "lesterbarlow@sustenza.com",
                "bio": "",
                "website": "",
                "location": "nostrud id consequat",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-10-24T01:02:44.846 +04:00",
                "updated_at": "2013-02-09T17:05:21.342 +05:00"
            },
            "created_at": "2012-06-03T17:18:29.087 +04:00",
            "created_by": {
                "id": 1,
                "uuid": "61a75d4f-dfcb-4f18-9cf7-80538ad6abc4",
                "name": "Rhea Mills",
                "slug": "rhea-mills",
                "email": "rheamills@sustenza.com",
                "bio": "",
                "website": "",
                "location": "exercitation esse",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-11-16T11:27:12.398 +05:00",
                "updated_at": "2012-10-17T13:41:57.316 +04:00"
            },
            "updated_at": "2014-02-13T07:01:02.833 +05:00",
            "updated_by": {
                "id": 0,
                "uuid": "f2a7f058-c7fa-4cca-b1cb-e2188a1e1dfb",
                "name": "Lisa Kirkland",
                "slug": "lisa-kirkland",
                "email": "lisakirkland@sustenza.com",
                "bio": "",
                "website": "",
                "location": "nulla",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-03-09T04:19:41.206 +05:00",
                "updated_at": "2013-10-02T12:02:36.399 +04:00"
            },
            "published_at": "2012-05-31T03:22:36.497 +04:00",
            "published_by": {
                "id": 4,
                "uuid": "4fa75b7c-62c0-4038-8da1-2be68ba86d86",
                "name": "Lane Rodriguez",
                "slug": "lane-rodriguez",
                "email": "lanerodriguez@sustenza.com",
                "bio": "",
                "website": "",
                "location": "consectetur",
                "status": "active",
                "language": "en_US",
                "created_at": "2014-02-11T19:30:32.515 +05:00",
                "updated_at": "2013-11-11T08:56:00.510 +05:00"
            },
            "tags": [
                {
                    "id": 19,
                    "uuid": "20618bf1-fb07-4397-bd2d-b1b0104c9d1e",
                    "name": "aliqua",
                    "slug": "aliqua",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-06-13T06:25:13.676 +04:00",
                    "created_by": 8,
                    "updated_at": "2012-01-28T01:54:39.777 +05:00",
                    "updated_by": 6
                },
                {
                    "id": 34,
                    "uuid": "96d26710-ee16-4806-8da7-787cf48ffddc",
                    "name": "voluptate",
                    "slug": "voluptate",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-05-10T00:31:32.130 +04:00",
                    "created_by": 6,
                    "updated_at": "2014-03-03T18:41:10.818 +05:00",
                    "updated_by": 4
                },
                {
                    "id": 91,
                    "uuid": "137b29cd-03a7-44a8-9b07-10d3b7c5530b",
                    "name": "ad proident",
                    "slug": "ad-proident",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-01-28T08:48:09.216 +05:00",
                    "created_by": 8,
                    "updated_at": "2013-11-22T16:02:38.013 +05:00",
                    "updated_by": 10
                },
                {
                    "id": 5,
                    "uuid": "2e29ef8b-072e-4e8a-b34a-dcd26ad14a1d",
                    "name": "quis excepteur exercitation",
                    "slug": "quis-excepteur-exercitation",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-04-30T08:33:46.772 +04:00",
                    "created_by": 2,
                    "updated_at": "2012-03-22T09:23:47.150 +04:00",
                    "updated_by": 2
                },
                {
                    "id": 15,
                    "uuid": "42abbdd4-45ad-4725-bb4d-a20607bebe70",
                    "name": "culpa",
                    "slug": "culpa",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-01-25T00:52:48.829 +05:00",
                    "created_by": 6,
                    "updated_at": "2012-12-21T06:45:28.832 +05:00",
                    "updated_by": 10
                }
            ]
        },
        {
            "id": 26,
            "uuid": "76cc7cb4-b340-400d-9122-b82d984b09b3",
            "status": "draft",
            "title": "aute exercitation do occaecat velit esse tempor ut aliqua",
            "slug": "aute-exercitation-do-occaecat-velit-esse-tempor-ut-aliqua",
            "markdown": "Est ipsum ut ipsum ipsum. Incididunt mollit occaecat cupidatat adipisicing Lorem laboris ut. Irure consequat minim ex pariatur laborum pariatur eiusmod tempor. Ad exercitation exercitation incididunt id.\r\nMollit fugiat fugiat eiusmod velit pariatur excepteur minim in culpa anim ea Lorem. Cupidatat nisi ut culpa ea adipisicing proident non tempor incididunt. Lorem sint consequat tempor culpa velit aliqua ipsum ipsum ut. Adipisicing elit in incididunt nostrud consectetur commodo eu mollit dolor nostrud deserunt esse ea enim.\r\nEa sint do in dolor est aute qui. Excepteur cillum irure dolor exercitation commodo dolor incididunt labore adipisicing officia mollit eiusmod. Culpa nisi veniam occaecat culpa duis esse Lorem est ea sint minim laboris. Lorem pariatur elit qui excepteur dolore aliqua irure adipisicing ut non. Sint aliqua aute excepteur ipsum. Minim dolore laboris aliquip excepteur minim mollit magna ut pariatur nisi. Consectetur magna consequat aliquip laborum veniam cillum ipsum ex.\r\n",
            "html": "<p>Est ipsum ut ipsum ipsum. Incididunt mollit occaecat cupidatat adipisicing Lorem laboris ut. Irure consequat minim ex pariatur laborum pariatur eiusmod tempor. Ad exercitation exercitation incididunt id.\r\nMollit fugiat fugiat eiusmod velit pariatur excepteur minim in culpa anim ea Lorem. Cupidatat nisi ut culpa ea adipisicing proident non tempor incididunt. Lorem sint consequat tempor culpa velit aliqua ipsum ipsum ut. Adipisicing elit in incididunt nostrud consectetur commodo eu mollit dolor nostrud deserunt esse ea enim.\r\nEa sint do in dolor est aute qui. Excepteur cillum irure dolor exercitation commodo dolor incididunt labore adipisicing officia mollit eiusmod. Culpa nisi veniam occaecat culpa duis esse Lorem est ea sint minim laboris. Lorem pariatur elit qui excepteur dolore aliqua irure adipisicing ut non. Sint aliqua aute excepteur ipsum. Minim dolore laboris aliquip excepteur minim mollit magna ut pariatur nisi. Consectetur magna consequat aliquip laborum veniam cillum ipsum ex.\r\n</p>",
            "image": null,
            "featured": 1,
            "page": 1,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 4,
                "uuid": "53087c64-54da-4494-9772-54126b34916e",
                "name": "Bertha Moore",
                "slug": "bertha-moore",
                "email": "berthamoore@sustenza.com",
                "bio": "",
                "website": "",
                "location": "commodo Lorem laboris",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-02-07T22:39:03.687 +05:00",
                "updated_at": "2012-04-21T00:36:54.943 +04:00"
            },
            "created_at": "2014-04-05T11:34:32.194 +04:00",
            "created_by": {
                "id": 5,
                "uuid": "3d9d1ad0-854f-4e8b-82ba-0696c3a32252",
                "name": "Nanette Leon",
                "slug": "nanette-leon",
                "email": "nanetteleon@sustenza.com",
                "bio": "",
                "website": "",
                "location": "et",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-06-19T18:20:46.834 +04:00",
                "updated_at": "2013-05-24T02:33:59.402 +04:00"
            },
            "updated_at": "2014-04-15T11:08:29.927 +04:00",
            "updated_by": {
                "id": 5,
                "uuid": "13aa4deb-aa85-4977-9081-b605d0d72ce0",
                "name": "Trudy Lane",
                "slug": "trudy-lane",
                "email": "trudylane@sustenza.com",
                "bio": "",
                "website": "",
                "location": "exercitation nostrud",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-05-11T20:50:06.503 +04:00",
                "updated_at": "2012-11-07T10:15:24.976 +05:00"
            },
            "published_at": "2012-05-24T17:02:10.887 +04:00",
            "published_by": {
                "id": 7,
                "uuid": "e045215d-154c-4310-b022-10a0020641c5",
                "name": "Lee Larson",
                "slug": "lee-larson",
                "email": "leelarson@sustenza.com",
                "bio": "",
                "website": "",
                "location": "fugiat",
                "status": "active",
                "language": "en_US",
                "created_at": "2014-05-02T01:44:45.989 +04:00",
                "updated_at": "2014-02-20T00:05:09.799 +05:00"
            },
            "tags": [
                {
                    "id": 69,
                    "uuid": "320e2b2d-2bbe-4c05-a568-c859ecf425c2",
                    "name": "ipsum commodo velit",
                    "slug": "ipsum-commodo-velit",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-10-22T09:33:10.094 +04:00",
                    "created_by": 4,
                    "updated_at": "2014-03-02T13:09:39.165 +05:00",
                    "updated_by": 5
                },
                {
                    "id": 41,
                    "uuid": "1962cc7c-f19f-44b3-b368-1a7defe02124",
                    "name": "esse",
                    "slug": "esse",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-04-15T15:00:40.653 +04:00",
                    "created_by": 4,
                    "updated_at": "2012-03-17T04:16:21.639 +04:00",
                    "updated_by": 6
                },
                {
                    "id": 60,
                    "uuid": "716e0578-3973-4a3b-81da-5f19a996f1f7",
                    "name": "ipsum",
                    "slug": "ipsum",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-04-11T08:59:01.976 +04:00",
                    "created_by": 3,
                    "updated_at": "2013-02-13T14:05:21.434 +05:00",
                    "updated_by": 3
                },
                {
                    "id": 8,
                    "uuid": "9482680f-ea60-4318-97c7-9461c5ae40dd",
                    "name": "labore tempor",
                    "slug": "labore-tempor",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-04-21T03:43:45.209 +04:00",
                    "created_by": 10,
                    "updated_at": "2013-10-04T16:51:59.316 +04:00",
                    "updated_by": 2
                },
                {
                    "id": 47,
                    "uuid": "de0b4888-017e-41af-a972-f7854abd9468",
                    "name": "esse Lorem",
                    "slug": "esse-lorem",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-05-26T16:33:12.021 +04:00",
                    "created_by": 0,
                    "updated_at": "2013-12-10T07:04:22.721 +05:00",
                    "updated_by": 10
                },
                {
                    "id": 4,
                    "uuid": "8fdc1217-83a0-4cf2-aeef-422e9652bfbd",
                    "name": "non",
                    "slug": "non",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-01-09T21:00:33.477 +05:00",
                    "created_by": 10,
                    "updated_at": "2014-01-04T20:09:49.141 +05:00",
                    "updated_by": 2
                },
                {
                    "id": 23,
                    "uuid": "c3368cf2-5b95-4330-9f08-b9b9df36ea5b",
                    "name": "amet ut",
                    "slug": "amet-ut",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-01-14T21:40:38.040 +05:00",
                    "created_by": 2,
                    "updated_at": "2012-02-18T03:38:17.299 +05:00",
                    "updated_by": 7
                },
                {
                    "id": 59,
                    "uuid": "aaa363cf-1862-4e86-ba91-b7b6904460f9",
                    "name": "aliquip velit tempor",
                    "slug": "aliquip-velit-tempor",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-05-28T07:33:26.049 +04:00",
                    "created_by": 7,
                    "updated_at": "2013-09-20T13:14:10.137 +04:00",
                    "updated_by": 9
                }
            ]
        },
        {
            "id": 27,
            "uuid": "b9cbc08f-906d-479a-aeda-7c11f7d61001",
            "status": "published ",
            "title": "aliqua excepteur cupidatat",
            "slug": "aliqua-excepteur-cupidatat",
            "markdown": "Officia ex ea dolor irure et. Id ut pariatur esse do. Duis sint exercitation et velit dolor ipsum dolore cillum. Magna dolor consectetur mollit non voluptate incididunt dolore ullamco nulla sint. Aliquip exercitation aute excepteur esse Lorem excepteur mollit nostrud tempor. Pariatur culpa esse duis ea magna ullamco eiusmod ut nostrud elit qui dolor sit ex. Adipisicing culpa excepteur occaecat ex do.\r\nAdipisicing anim enim amet adipisicing cillum amet. Aliquip sunt dolor nostrud deserunt aliquip incididunt velit mollit eu. Commodo consequat occaecat elit pariatur. Eu ut ex laboris consequat do.\r\nMagna elit minim sit ea do voluptate veniam aliquip labore nisi consequat. Minim anim enim aute ut eu elit reprehenderit officia enim cupidatat. Adipisicing ea quis in pariatur veniam aliquip. Eu irure mollit veniam velit. Nisi consequat enim aliqua aliqua. Incididunt aute elit incididunt cillum proident anim nisi consequat occaecat dolore aliqua tempor. Reprehenderit commodo pariatur pariatur labore amet enim adipisicing sint ex in.\r\n",
            "html": "<p>Officia ex ea dolor irure et. Id ut pariatur esse do. Duis sint exercitation et velit dolor ipsum dolore cillum. Magna dolor consectetur mollit non voluptate incididunt dolore ullamco nulla sint. Aliquip exercitation aute excepteur esse Lorem excepteur mollit nostrud tempor. Pariatur culpa esse duis ea magna ullamco eiusmod ut nostrud elit qui dolor sit ex. Adipisicing culpa excepteur occaecat ex do.\r\nAdipisicing anim enim amet adipisicing cillum amet. Aliquip sunt dolor nostrud deserunt aliquip incididunt velit mollit eu. Commodo consequat occaecat elit pariatur. Eu ut ex laboris consequat do.\r\nMagna elit minim sit ea do voluptate veniam aliquip labore nisi consequat. Minim anim enim aute ut eu elit reprehenderit officia enim cupidatat. Adipisicing ea quis in pariatur veniam aliquip. Eu irure mollit veniam velit. Nisi consequat enim aliqua aliqua. Incididunt aute elit incididunt cillum proident anim nisi consequat occaecat dolore aliqua tempor. Reprehenderit commodo pariatur pariatur labore amet enim adipisicing sint ex in.\r\n</p>",
            "image": null,
            "featured": 1,
            "page": 7,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 9,
                "uuid": "632d782f-0a16-412d-a8fb-46be63e1bfbf",
                "name": "Myers Dickson",
                "slug": "myers-dickson",
                "email": "myersdickson@sustenza.com",
                "bio": "",
                "website": "",
                "location": "quis",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-07-23T09:48:13.279 +04:00",
                "updated_at": "2014-03-25T13:09:12.562 +04:00"
            },
            "created_at": "2013-07-03T21:05:39.223 +04:00",
            "created_by": {
                "id": 4,
                "uuid": "fd084f40-188b-4633-a91a-c84f686eabae",
                "name": "Hammond Mccoy",
                "slug": "hammond-mccoy",
                "email": "hammondmccoy@sustenza.com",
                "bio": "",
                "website": "",
                "location": "do laborum velit",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-10-30T03:51:38.164 +04:00",
                "updated_at": "2012-10-25T23:33:28.975 +04:00"
            },
            "updated_at": "2013-01-30T05:48:55.616 +05:00",
            "updated_by": {
                "id": 9,
                "uuid": "5e8015c4-fc48-452d-aca1-19df4a05e0b6",
                "name": "Wendi Swanson",
                "slug": "wendi-swanson",
                "email": "wendiswanson@sustenza.com",
                "bio": "",
                "website": "",
                "location": "dolor ipsum sit",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-03-31T00:38:58.266 +04:00",
                "updated_at": "2013-06-27T22:50:32.800 +04:00"
            },
            "published_at": "2012-11-27T10:04:58.486 +05:00",
            "published_by": {
                "id": 7,
                "uuid": "f7d6cc60-0d8d-405f-bd8d-5fa6f295294b",
                "name": "Liza Raymond",
                "slug": "liza-raymond",
                "email": "lizaraymond@sustenza.com",
                "bio": "",
                "website": "",
                "location": "amet",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-11-27T07:25:52.804 +05:00",
                "updated_at": "2013-01-27T12:03:05.054 +05:00"
            },
            "tags": [
                {
                    "id": 14,
                    "uuid": "b5379d85-f380-429d-bbcc-6da6d0a6ba8b",
                    "name": "ea",
                    "slug": "ea",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-04-02T01:49:48.060 +04:00",
                    "created_by": 10,
                    "updated_at": "2013-05-23T07:33:56.115 +04:00",
                    "updated_by": 5
                },
                {
                    "id": 33,
                    "uuid": "dbcd74de-76c8-4d31-ac94-4b391b9b198a",
                    "name": "Lorem aliquip ad",
                    "slug": "lorem-aliquip-ad",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-06-08T22:24:30.866 +04:00",
                    "created_by": 9,
                    "updated_at": "2012-02-13T04:05:05.966 +05:00",
                    "updated_by": 2
                },
                {
                    "id": 14,
                    "uuid": "674137a4-ef0b-47c7-868c-cc7529251d1d",
                    "name": "irure magna",
                    "slug": "irure-magna",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-05-05T19:47:11.986 +04:00",
                    "created_by": 2,
                    "updated_at": "2013-05-11T23:31:17.046 +04:00",
                    "updated_by": 9
                },
                {
                    "id": 53,
                    "uuid": "d0180d37-7162-42a9-a57b-78f6b95db4d7",
                    "name": "nostrud culpa",
                    "slug": "nostrud-culpa",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-07-03T23:48:32.711 +04:00",
                    "created_by": 7,
                    "updated_at": "2013-11-19T06:19:14.775 +05:00",
                    "updated_by": 7
                },
                {
                    "id": 58,
                    "uuid": "88eb1098-18d5-4371-9349-c21b471871a8",
                    "name": "dolor nostrud",
                    "slug": "dolor-nostrud",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-04-19T04:13:19.768 +04:00",
                    "created_by": 9,
                    "updated_at": "2013-02-17T09:18:21.722 +05:00",
                    "updated_by": 0
                },
                {
                    "id": 75,
                    "uuid": "1e6d4985-8bd7-4cf9-810a-a1c9161de06c",
                    "name": "eiusmod",
                    "slug": "eiusmod",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-01-05T04:44:29.550 +05:00",
                    "created_by": 6,
                    "updated_at": "2013-04-28T17:52:51.038 +04:00",
                    "updated_by": 10
                },
                {
                    "id": 92,
                    "uuid": "a525d584-3c81-4457-b5ce-07e4a265bb95",
                    "name": "voluptate",
                    "slug": "voluptate",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-02-19T17:51:27.679 +05:00",
                    "created_by": 6,
                    "updated_at": "2014-04-29T23:26:15.802 +04:00",
                    "updated_by": 3
                },
                {
                    "id": 42,
                    "uuid": "0b2d6f1a-5935-4062-b997-9764146beac3",
                    "name": "esse",
                    "slug": "esse",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-02-22T22:55:05.595 +05:00",
                    "created_by": 8,
                    "updated_at": "2012-07-03T16:22:25.789 +04:00",
                    "updated_by": 10
                },
                {
                    "id": 94,
                    "uuid": "6559335c-384a-417b-acb0-1016a095f746",
                    "name": "velit",
                    "slug": "velit",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-05-10T02:03:38.930 +04:00",
                    "created_by": 7,
                    "updated_at": "2012-04-14T20:06:49.552 +04:00",
                    "updated_by": 8
                },
                {
                    "id": 34,
                    "uuid": "14d0c094-594a-481d-a178-bdf5b29c9ac0",
                    "name": "aliquip aliqua",
                    "slug": "aliquip-aliqua",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-10-02T12:44:28.540 +04:00",
                    "created_by": 6,
                    "updated_at": "2013-10-23T09:40:41.405 +04:00",
                    "updated_by": 10
                }
            ]
        },
        {
            "id": 28,
            "uuid": "d993e327-20f9-4687-893f-5ee2694aa899",
            "status": "draft",
            "title": "nostrud nisi in quis deserunt sit commodo labore fugiat",
            "slug": "nostrud-nisi-in-quis-deserunt-sit-commodo-labore-fugiat",
            "markdown": "Ullamco sit fugiat cillum officia fugiat quis enim Lorem excepteur incididunt do. Duis ipsum sit adipisicing anim. Mollit labore ut dolore ex et eu cupidatat irure ea esse.\r\nSunt tempor officia culpa veniam nisi sunt fugiat reprehenderit cillum et amet ad excepteur laborum. Do proident aliquip sunt nisi consequat commodo veniam est eu magna. Duis ea est irure eu exercitation fugiat Lorem. Ut ad nulla nostrud elit voluptate deserunt minim ipsum duis aliquip nisi aliqua proident. Occaecat aliqua in amet aliqua eiusmod et pariatur aliquip. Est eiusmod anim sit reprehenderit. Nisi amet commodo nisi laborum sunt id ex quis voluptate.\r\nConsequat consectetur velit quis ad aliqua veniam exercitation Lorem. Nisi incididunt consectetur duis irure consectetur sunt minim. Proident velit sit eiusmod fugiat consectetur aliqua minim proident deserunt duis fugiat. Magna ipsum laborum do nisi enim occaecat nisi pariatur occaecat nostrud pariatur nulla enim. Velit proident anim proident adipisicing incididunt officia sint adipisicing nostrud exercitation ex voluptate.\r\nAnim ea consequat do laboris. Sunt duis fugiat ex veniam amet adipisicing culpa laboris consequat sit elit. Voluptate cillum non nostrud nostrud. Ipsum laborum consectetur culpa dolore cillum officia excepteur. Nisi commodo id voluptate ipsum dolore consectetur.\r\nEst sint ipsum quis incididunt incididunt pariatur irure irure. Nisi sit velit duis fugiat enim sint aliqua sunt culpa amet voluptate reprehenderit eiusmod tempor. Pariatur pariatur et consectetur sint reprehenderit eu pariatur voluptate magna. Consectetur incididunt ut et occaecat labore velit aliquip aliqua commodo est aute mollit non velit. Quis qui in aliqua consectetur et. Nisi velit sit labore laborum fugiat nisi.\r\nAmet culpa commodo non veniam deserunt sint. Deserunt duis voluptate magna pariatur sunt. Ea laborum labore fugiat in elit aliqua. Aute reprehenderit anim eu occaecat ipsum ex reprehenderit ullamco.\r\nReprehenderit excepteur fugiat minim mollit nostrud minim elit et aliqua quis fugiat id voluptate. Proident incididunt labore ipsum eiusmod incididunt enim laboris ad. Ipsum laborum do exercitation aliquip consectetur ullamco.\r\nPariatur anim exercitation ullamco consequat tempor amet. Irure reprehenderit esse non fugiat incididunt pariatur consectetur. Aliqua consequat mollit aute officia duis fugiat et reprehenderit irure.\r\nFugiat ipsum pariatur dolore minim sit anim minim mollit proident veniam anim consequat consequat ut. Officia quis excepteur culpa amet do esse excepteur ad est aliqua dolore consectetur. Veniam qui enim magna proident exercitation amet nostrud cillum dolore labore magna. Culpa dolore deserunt laborum aliqua elit voluptate ullamco aliqua voluptate cillum deserunt exercitation cupidatat est. Consectetur ipsum Lorem sunt incididunt voluptate commodo cillum sunt enim Lorem velit ut anim. Dolor proident et amet eiusmod esse. Eu id nisi sint eiusmod sunt amet veniam amet magna eu id.\r\nMagna excepteur sit enim ut commodo id do irure nostrud ut. Ad proident exercitation non in ipsum dolore non labore. Minim ea ex ut cupidatat ea sunt sint. Sint adipisicing qui tempor id. Eu est occaecat dolore culpa.\r\n",
            "html": "<p>Ullamco sit fugiat cillum officia fugiat quis enim Lorem excepteur incididunt do. Duis ipsum sit adipisicing anim. Mollit labore ut dolore ex et eu cupidatat irure ea esse.\r\nSunt tempor officia culpa veniam nisi sunt fugiat reprehenderit cillum et amet ad excepteur laborum. Do proident aliquip sunt nisi consequat commodo veniam est eu magna. Duis ea est irure eu exercitation fugiat Lorem. Ut ad nulla nostrud elit voluptate deserunt minim ipsum duis aliquip nisi aliqua proident. Occaecat aliqua in amet aliqua eiusmod et pariatur aliquip. Est eiusmod anim sit reprehenderit. Nisi amet commodo nisi laborum sunt id ex quis voluptate.\r\nConsequat consectetur velit quis ad aliqua veniam exercitation Lorem. Nisi incididunt consectetur duis irure consectetur sunt minim. Proident velit sit eiusmod fugiat consectetur aliqua minim proident deserunt duis fugiat. Magna ipsum laborum do nisi enim occaecat nisi pariatur occaecat nostrud pariatur nulla enim. Velit proident anim proident adipisicing incididunt officia sint adipisicing nostrud exercitation ex voluptate.\r\nAnim ea consequat do laboris. Sunt duis fugiat ex veniam amet adipisicing culpa laboris consequat sit elit. Voluptate cillum non nostrud nostrud. Ipsum laborum consectetur culpa dolore cillum officia excepteur. Nisi commodo id voluptate ipsum dolore consectetur.\r\nEst sint ipsum quis incididunt incididunt pariatur irure irure. Nisi sit velit duis fugiat enim sint aliqua sunt culpa amet voluptate reprehenderit eiusmod tempor. Pariatur pariatur et consectetur sint reprehenderit eu pariatur voluptate magna. Consectetur incididunt ut et occaecat labore velit aliquip aliqua commodo est aute mollit non velit. Quis qui in aliqua consectetur et. Nisi velit sit labore laborum fugiat nisi.\r\nAmet culpa commodo non veniam deserunt sint. Deserunt duis voluptate magna pariatur sunt. Ea laborum labore fugiat in elit aliqua. Aute reprehenderit anim eu occaecat ipsum ex reprehenderit ullamco.\r\nReprehenderit excepteur fugiat minim mollit nostrud minim elit et aliqua quis fugiat id voluptate. Proident incididunt labore ipsum eiusmod incididunt enim laboris ad. Ipsum laborum do exercitation aliquip consectetur ullamco.\r\nPariatur anim exercitation ullamco consequat tempor amet. Irure reprehenderit esse non fugiat incididunt pariatur consectetur. Aliqua consequat mollit aute officia duis fugiat et reprehenderit irure.\r\nFugiat ipsum pariatur dolore minim sit anim minim mollit proident veniam anim consequat consequat ut. Officia quis excepteur culpa amet do esse excepteur ad est aliqua dolore consectetur. Veniam qui enim magna proident exercitation amet nostrud cillum dolore labore magna. Culpa dolore deserunt laborum aliqua elit voluptate ullamco aliqua voluptate cillum deserunt exercitation cupidatat est. Consectetur ipsum Lorem sunt incididunt voluptate commodo cillum sunt enim Lorem velit ut anim. Dolor proident et amet eiusmod esse. Eu id nisi sint eiusmod sunt amet veniam amet magna eu id.\r\nMagna excepteur sit enim ut commodo id do irure nostrud ut. Ad proident exercitation non in ipsum dolore non labore. Minim ea ex ut cupidatat ea sunt sint. Sint adipisicing qui tempor id. Eu est occaecat dolore culpa.\r\n</p>",
            "image": null,
            "featured": 1,
            "page": 5,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 3,
                "uuid": "ac52c9c2-7d23-4d67-868c-f2c54a82254c",
                "name": "Johanna Wiggins",
                "slug": "johanna-wiggins",
                "email": "johannawiggins@sustenza.com",
                "bio": "",
                "website": "",
                "location": "id voluptate deserunt",
                "status": "active",
                "language": "en_US",
                "created_at": "2014-03-25T14:12:31.451 +04:00",
                "updated_at": "2012-10-28T06:59:39.878 +04:00"
            },
            "created_at": "2013-05-13T23:16:23.352 +04:00",
            "created_by": {
                "id": 0,
                "uuid": "bf687df0-043d-4b3f-bb3e-46932b22ce04",
                "name": "Angel Vincent",
                "slug": "angel-vincent",
                "email": "angelvincent@sustenza.com",
                "bio": "",
                "website": "",
                "location": "magna pariatur",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-10-06T13:56:59.730 +04:00",
                "updated_at": "2014-02-28T07:46:40.244 +05:00"
            },
            "updated_at": "2012-02-03T20:52:02.283 +05:00",
            "updated_by": {
                "id": 8,
                "uuid": "bb202a03-dd5a-41c0-8c42-4f7addc52e24",
                "name": "Michael Hammond",
                "slug": "michael-hammond",
                "email": "michaelhammond@sustenza.com",
                "bio": "",
                "website": "",
                "location": "ex aliquip",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-09-12T01:38:13.045 +04:00",
                "updated_at": "2013-05-28T07:47:49.071 +04:00"
            },
            "published_at": "2013-06-16T07:01:40.438 +04:00",
            "published_by": {
                "id": 2,
                "uuid": "f6373a3b-bf9f-4c97-8071-ad4959d61419",
                "name": "Jeanine Mercer",
                "slug": "jeanine-mercer",
                "email": "jeaninemercer@sustenza.com",
                "bio": "",
                "website": "",
                "location": "duis aliqua",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-08-22T04:53:25.724 +04:00",
                "updated_at": "2013-07-17T01:33:32.765 +04:00"
            },
            "tags": [
                {
                    "id": 31,
                    "uuid": "6039bccc-b06a-40e8-86db-bbb17d298b97",
                    "name": "quis mollit nisi",
                    "slug": "quis-mollit-nisi",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-07-19T20:11:58.463 +04:00",
                    "created_by": 9,
                    "updated_at": "2013-07-18T18:28:35.984 +04:00",
                    "updated_by": 5
                }
            ]
        },
        {
            "id": 29,
            "uuid": "94f84c1e-5153-42d8-8978-fd37bbe3376c",
            "status": "published ",
            "title": "enim velit voluptate qui nulla minim reprehenderit consectetur ex exercitation",
            "slug": "enim-velit-voluptate-qui-nulla-minim-reprehenderit-consectetur-ex-exercitation",
            "markdown": "Deserunt occaecat sint sunt ea minim. Commodo incididunt pariatur sit elit consequat aliqua non anim Lorem ex Lorem dolor. Officia in sunt minim magna minim quis pariatur officia deserunt sit amet exercitation ea. Duis sunt ex irure nostrud exercitation anim ex tempor.\r\nId ullamco sit id occaecat cupidatat nulla culpa in labore adipisicing ipsum cillum. Velit aute ex eu commodo commodo enim Lorem tempor officia culpa reprehenderit nulla duis eiusmod. Tempor elit excepteur labore officia. Mollit sint sint duis nostrud. Qui tempor reprehenderit nisi culpa fugiat sit in minim. Culpa duis deserunt eu nulla officia cillum ut sunt consectetur. Consectetur dolore laboris sint mollit quis minim reprehenderit.\r\nNisi cupidatat officia velit ipsum laborum. Cupidatat esse laboris elit aute labore Lorem laboris nisi occaecat eiusmod esse adipisicing sint. Velit cupidatat ea non eu ut et ea. Sit laborum minim aliqua quis sunt irure cillum reprehenderit nostrud velit cillum elit magna sit.\r\nReprehenderit excepteur sint irure Lorem ipsum adipisicing ex occaecat anim mollit. Amet eu duis duis eu. Labore commodo aliqua laboris ad ipsum consequat. Ipsum nisi sint exercitation irure enim pariatur voluptate qui ad sunt magna culpa.\r\nCommodo non ex est elit officia deserunt dolore. Aliqua cillum consequat pariatur enim duis sunt dolore qui qui non ut deserunt. Nisi culpa minim et dolor. Labore et nostrud cillum non et. Enim proident id laboris dolore ullamco ex excepteur nostrud ad adipisicing irure culpa voluptate Lorem.\r\nConsequat id esse anim non cillum veniam et consequat do voluptate esse esse labore aute. Consectetur sint non do sunt Lorem enim ex Lorem non. Sint sunt esse veniam officia reprehenderit magna ullamco reprehenderit ad elit nisi. Mollit nulla proident labore consectetur irure consequat ad esse sint labore in pariatur sint.\r\nIrure quis Lorem officia sunt. Exercitation commodo consequat pariatur ad et et eu. Minim mollit sunt aute anim consectetur anim excepteur laboris. Culpa eu do proident nisi exercitation ut velit enim proident nisi duis.\r\nVelit laborum ullamco elit labore ad deserunt cupidatat. Ea amet ea mollit ad. Duis amet ad adipisicing est ullamco enim excepteur. Elit ipsum eiusmod duis ullamco reprehenderit. Ullamco Lorem reprehenderit aute elit ut. Anim consectetur dolore id aliquip commodo.\r\nVoluptate ad elit amet officia consequat enim. Non cillum Lorem sint incididunt non sit incididunt dolor do mollit ipsum laborum. Non minim dolor et irure id qui adipisicing laborum exercitation minim esse. Proident id pariatur pariatur ut ut culpa. Id velit tempor nostrud ea exercitation nisi magna commodo nulla commodo excepteur.\r\nEnim velit esse voluptate proident aliqua cupidatat dolore ad id fugiat exercitation aute eiusmod officia. Elit ut commodo reprehenderit ut sint nisi do in adipisicing ut aute. Est culpa officia adipisicing veniam dolore fugiat ipsum exercitation laborum eu. Dolore sint nulla dolor dolor occaecat occaecat aliquip dolor ea magna minim nostrud anim ut. Consequat et Lorem ea dolor excepteur magna ea.\r\n",
            "html": "<p>Deserunt occaecat sint sunt ea minim. Commodo incididunt pariatur sit elit consequat aliqua non anim Lorem ex Lorem dolor. Officia in sunt minim magna minim quis pariatur officia deserunt sit amet exercitation ea. Duis sunt ex irure nostrud exercitation anim ex tempor.\r\nId ullamco sit id occaecat cupidatat nulla culpa in labore adipisicing ipsum cillum. Velit aute ex eu commodo commodo enim Lorem tempor officia culpa reprehenderit nulla duis eiusmod. Tempor elit excepteur labore officia. Mollit sint sint duis nostrud. Qui tempor reprehenderit nisi culpa fugiat sit in minim. Culpa duis deserunt eu nulla officia cillum ut sunt consectetur. Consectetur dolore laboris sint mollit quis minim reprehenderit.\r\nNisi cupidatat officia velit ipsum laborum. Cupidatat esse laboris elit aute labore Lorem laboris nisi occaecat eiusmod esse adipisicing sint. Velit cupidatat ea non eu ut et ea. Sit laborum minim aliqua quis sunt irure cillum reprehenderit nostrud velit cillum elit magna sit.\r\nReprehenderit excepteur sint irure Lorem ipsum adipisicing ex occaecat anim mollit. Amet eu duis duis eu. Labore commodo aliqua laboris ad ipsum consequat. Ipsum nisi sint exercitation irure enim pariatur voluptate qui ad sunt magna culpa.\r\nCommodo non ex est elit officia deserunt dolore. Aliqua cillum consequat pariatur enim duis sunt dolore qui qui non ut deserunt. Nisi culpa minim et dolor. Labore et nostrud cillum non et. Enim proident id laboris dolore ullamco ex excepteur nostrud ad adipisicing irure culpa voluptate Lorem.\r\nConsequat id esse anim non cillum veniam et consequat do voluptate esse esse labore aute. Consectetur sint non do sunt Lorem enim ex Lorem non. Sint sunt esse veniam officia reprehenderit magna ullamco reprehenderit ad elit nisi. Mollit nulla proident labore consectetur irure consequat ad esse sint labore in pariatur sint.\r\nIrure quis Lorem officia sunt. Exercitation commodo consequat pariatur ad et et eu. Minim mollit sunt aute anim consectetur anim excepteur laboris. Culpa eu do proident nisi exercitation ut velit enim proident nisi duis.\r\nVelit laborum ullamco elit labore ad deserunt cupidatat. Ea amet ea mollit ad. Duis amet ad adipisicing est ullamco enim excepteur. Elit ipsum eiusmod duis ullamco reprehenderit. Ullamco Lorem reprehenderit aute elit ut. Anim consectetur dolore id aliquip commodo.\r\nVoluptate ad elit amet officia consequat enim. Non cillum Lorem sint incididunt non sit incididunt dolor do mollit ipsum laborum. Non minim dolor et irure id qui adipisicing laborum exercitation minim esse. Proident id pariatur pariatur ut ut culpa. Id velit tempor nostrud ea exercitation nisi magna commodo nulla commodo excepteur.\r\nEnim velit esse voluptate proident aliqua cupidatat dolore ad id fugiat exercitation aute eiusmod officia. Elit ut commodo reprehenderit ut sint nisi do in adipisicing ut aute. Est culpa officia adipisicing veniam dolore fugiat ipsum exercitation laborum eu. Dolore sint nulla dolor dolor occaecat occaecat aliquip dolor ea magna minim nostrud anim ut. Consequat et Lorem ea dolor excepteur magna ea.\r\n</p>",
            "image": null,
            "featured": 0,
            "page": 10,
            "language": "en_US",
            "meta_title": null,
            "meta_description": null,
            "author": {
                "id": 1,
                "uuid": "40de7d35-8577-4d69-9580-00a7ea7b294f",
                "name": "Randall Stout",
                "slug": "randall-stout",
                "email": "randallstout@sustenza.com",
                "bio": "",
                "website": "",
                "location": "in excepteur voluptate",
                "status": "active",
                "language": "en_US",
                "created_at": "2014-01-09T06:11:00.999 +05:00",
                "updated_at": "2014-02-19T15:53:11.478 +05:00"
            },
            "created_at": "2013-01-16T16:57:07.458 +05:00",
            "created_by": {
                "id": 8,
                "uuid": "c699c383-6132-49a4-b7c6-f4fc665b5b8d",
                "name": "Andrews Langley",
                "slug": "andrews-langley",
                "email": "andrewslangley@sustenza.com",
                "bio": "",
                "website": "",
                "location": "et ullamco",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-12-24T05:41:51.573 +05:00",
                "updated_at": "2013-12-20T08:08:47.648 +05:00"
            },
            "updated_at": "2012-02-12T04:12:52.857 +05:00",
            "updated_by": {
                "id": 10,
                "uuid": "feca717d-937b-4277-b356-23eb1a8061d9",
                "name": "Ferguson Hill",
                "slug": "ferguson-hill",
                "email": "fergusonhill@sustenza.com",
                "bio": "",
                "website": "",
                "location": "incididunt",
                "status": "active",
                "language": "en_US",
                "created_at": "2013-09-07T22:30:10.311 +04:00",
                "updated_at": "2012-05-31T07:37:20.396 +04:00"
            },
            "published_at": "2012-01-17T21:25:12.142 +05:00",
            "published_by": {
                "id": 3,
                "uuid": "803a21d9-7f2c-4d44-b532-df03ca1984d8",
                "name": "Valenzuela Lopez",
                "slug": "valenzuela-lopez",
                "email": "valenzuelalopez@sustenza.com",
                "bio": "",
                "website": "",
                "location": "enim do",
                "status": "active",
                "language": "en_US",
                "created_at": "2012-02-13T00:00:17.707 +05:00",
                "updated_at": "2012-11-19T02:17:08.360 +05:00"
            },
            "tags": [
                {
                    "id": 14,
                    "uuid": "d97acf22-726d-4789-8ee3-84ce2e4f70d5",
                    "name": "excepteur excepteur",
                    "slug": "excepteur-excepteur",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-01-05T13:01:46.217 +05:00",
                    "created_by": 7,
                    "updated_at": "2012-08-24T06:24:55.281 +04:00",
                    "updated_by": 6
                },
                {
                    "id": 63,
                    "uuid": "4bfe4806-7358-4ded-960d-2f0963a377fd",
                    "name": "quis elit Lorem",
                    "slug": "quis-elit-lorem",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-11-06T21:24:38.892 +05:00",
                    "created_by": 1,
                    "updated_at": "2013-02-03T08:56:34.014 +05:00",
                    "updated_by": 3
                },
                {
                    "id": 82,
                    "uuid": "c137de85-aa15-4297-882c-88cd3395edb9",
                    "name": "aliquip sit Lorem",
                    "slug": "aliquip-sit-lorem",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-11-04T02:15:54.036 +05:00",
                    "created_by": 8,
                    "updated_at": "2013-05-24T00:40:15.402 +04:00",
                    "updated_by": 4
                },
                {
                    "id": 31,
                    "uuid": "5634173c-6b7e-4fea-b752-7a897dd7862c",
                    "name": "ad",
                    "slug": "ad",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2014-03-18T16:11:39.527 +04:00",
                    "created_by": 6,
                    "updated_at": "2013-08-28T12:23:49.733 +04:00",
                    "updated_by": 1
                },
                {
                    "id": 8,
                    "uuid": "73ea4114-7011-491f-90c5-08afec240cb9",
                    "name": "sunt commodo pariatur",
                    "slug": "sunt-commodo-pariatur",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-04-15T16:17:51.137 +04:00",
                    "created_by": 7,
                    "updated_at": "2013-11-05T02:57:10.939 +05:00",
                    "updated_by": 7
                },
                {
                    "id": 26,
                    "uuid": "dee1626f-f71f-4ee9-8749-07cb1b8f3772",
                    "name": "non anim esse",
                    "slug": "non-anim-esse",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2012-02-23T08:22:16.850 +05:00",
                    "created_by": 1,
                    "updated_at": "2012-08-16T23:05:50.224 +04:00",
                    "updated_by": 4
                },
                {
                    "id": 52,
                    "uuid": "ac43ef71-bc45-433d-b172-e7d4a6b90534",
                    "name": "consequat cupidatat laboris",
                    "slug": "consequat-cupidatat-laboris",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-06-22T00:12:29.974 +04:00",
                    "created_by": 5,
                    "updated_at": "2013-03-23T18:37:00.844 +04:00",
                    "updated_by": 8
                },
                {
                    "id": 34,
                    "uuid": "a26277ec-9b7a-4d58-8801-fcd4ebd8f114",
                    "name": "labore nostrud",
                    "slug": "labore-nostrud",
                    "description": null,
                    "parent_id": null,
                    "meta_title": null,
                    "meta_description": null,
                    "created_at": "2013-03-21T19:37:36.128 +04:00",
                    "created_by": 3,
                    "updated_at": "2012-05-24T00:01:24.726 +04:00",
                    "updated_by": 6
                }
            ]
        }
    ];
    
    __exports__["default"] = posts;
  });
define("ghost/fixtures/settings", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var settings = {
        "title": "Ghost",
        "description": "Just a blogging platform.",
        "email": "ghost@tryghost.org",
        "logo": "",
        "cover": "",
        "defaultLang": "en_US",
        "postsPerPage": "6",
        "forceI18n": "true",
        "permalinks": "/:slug/",
        "activeTheme": "casper",
        "activeApps": "[]",
        "installedApps": "[]",
        "availableThemes": [
            {
                "name": "casper",
                "package": false,
                "active": true
            }
        ],
        "availableApps": []
    };
    
    __exports__["default"] = settings;
  });
define("ghost/fixtures/users", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var users = [
        {
            "id": 1,
            "uuid": "ba9c67e4-8046-4b8c-9349-0eed3cca7529",
            "name": "some-user",
            "slug": "some-user",
            "email": "some@email.com",
            "image": undefined,
            "cover": undefined,
            "bio": "Example bio",
            "website": "",
            "location": "Imaginationland",
            "accessibility": undefined,
            "status": "active",
            "language": "en_US",
            "meta_title": undefined,
            "meta_description": undefined,
            "created_at": "2014-02-15T20:02:25.000Z",
            "updated_at": "2014-03-11T14:06:43.000Z"
        }
    ];
    
    __exports__["default"] = users;
  });
define("ghost/helpers/count-words", 
  ["ghost/utils/word-count","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var count = __dependency1__["default"];

    
    var countWords = Ember.Handlebars.makeBoundHelper(function (markdown) {
        return count(markdown || '');
    });
    
    __exports__["default"] = countWords;
  });
define("ghost/helpers/format-markdown", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /* global Showdown, Handlebars */
    var showdown = new Showdown.converter();
    
    var formatMarkdown = Ember.Handlebars.makeBoundHelper(function (markdown) {
        return new Handlebars.SafeString(showdown.makeHtml(markdown || ''));
    });
    
    __exports__["default"] = formatMarkdown;
  });
define("ghost/helpers/format-timeago", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /* global moment */
    var formatTimeago = Ember.Handlebars.makeBoundHelper(function (timeago) {
        return moment(timeago).fromNow();
        // stefanpenner says cool for small number of timeagos.
        // For large numbers moment sucks => single Ember.Object based clock better
        // https://github.com/manuelmitasch/ghost-admin-ember-demo/commit/fba3ab0a59238290c85d4fa0d7c6ed1be2a8a82e#commitcomment-5396524
    });
    
    __exports__["default"] = formatTimeago;
  });
define("ghost/initializers/csrf", 
  ["exports"],
  function(__exports__) {
    "use strict";
    __exports__["default"] = {
        name: 'csrf',
    
        initialize: function (container) {
            container.register('csrf:current', $('meta[name="csrf-param"]').attr('content'), { instantiate: false });
    
            container.injection('route', 'csrf', 'csrf:current');
            container.injection('controller', 'csrf', 'csrf:current');
        }
    };
  });
define("ghost/initializers/current-user", 
  ["ghost/models/user","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var User = __dependency1__["default"];

    
    __exports__["default"] = {
        name: 'currentUser',
    
        initialize: function (container, application) {
            var user = User.create(application.get('user') || {});
    
            container.register('user:current', user, { instantiate: false });
    
            container.injection('route', 'user', 'user:current');
            container.injection('controller', 'user', 'user:current');
        }
    };
  });
define("ghost/initializers/notifications", 
  ["ghost/utils/notifications","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Notifications = __dependency1__["default"];

    
    var registerNotifications = {
        name: 'registerNotifications',
    
        initialize: function (container, application) {
            application.register('notifications:main', Notifications);
        }
    };
    
    var injectNotifications = {
        name: 'injectNotifications',
    
        initialize: function (container, application) {
            application.inject('controller', 'notifications', 'notifications:main');
            application.inject('component', 'notifications', 'notifications:main');
            application.inject('route', 'notifications', 'notifications:main');
        }
    };
    
    __exports__.registerNotifications = registerNotifications;
    __exports__.injectNotifications = injectNotifications;
  });
define("ghost/initializers/trailing-history", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /*global Ember */
    
    var trailingHistory = Ember.HistoryLocation.extend({
        setURL: function (path) {
            var state = this.getState();
            path = this.formatURL(path);
            path = path.replace(/\/?$/, '/');
    
            if (state && state.path !== path) {
                this.pushState(path);
            }
        }
    });
    
    var registerTrailingLocationHistory = {
        name: 'registerTrailingLocationHistory',
    
        initialize: function (container, application) {
            application.register('location:trailing-history', trailingHistory);
        }
    };
    
    __exports__["default"] = registerTrailingLocationHistory;
  });
define("ghost/mixins/style-body", 
  ["exports"],
  function(__exports__) {
    "use strict";
    // mixin used for routes that need to set a css className on the body tag
    
    var styleBody = Ember.Mixin.create({
        activate: function () {
            var cssClasses = this.get('classNames');
    
            if (cssClasses) {
                Ember.run.schedule('afterRender', null, function () {
                    cssClasses.forEach(function (curClass) {
                        Ember.$('body').addClass(curClass);
                    });
                });
            }
        },
    
        deactivate: function () {
            var cssClasses = this.get('classNames');
    
            Ember.run.schedule('afterRender', null, function () {
                cssClasses.forEach(function (curClass) {
                    Ember.$('body').removeClass(curClass);
                });
            });
        }
    });
    
    __exports__["default"] = styleBody;
  });
define("ghost/models/base", 
  ["exports"],
  function(__exports__) {
    "use strict";
    
    function ghostPaths() {
        var path = window.location.pathname,
            subdir = path.substr(0, path.search('/ghost/'));
    
        return {
            subdir: subdir,
            adminRoot: subdir + '/ghost',
            apiRoot: subdir + '/ghost/api/v0.1'
        };
    }
    
    var BaseModel = Ember.Object.extend({
    
        fetch: function () {
            return ic.ajax.request(this.url, {
                type: 'GET'
            });
        },
    
        save: function () {
            return ic.ajax.request(this.url, {
                type: 'PUT',
                dataType: 'json',
                // @TODO: This is passing _oldWillDestory and _willDestroy and should not.
                data: JSON.stringify(this.getProperties(Ember.keys(this)))
            });
        }
    });
    
    BaseModel.apiRoot = ghostPaths().apiRoot;
    BaseModel.subdir = ghostPaths().subdir;
    BaseModel.adminRoot = ghostPaths().adminRoot;
    
    __exports__["default"] = BaseModel;
  });
define("ghost/models/post", 
  ["ghost/models/base","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var BaseModel = __dependency1__["default"];

    
    var PostModel = BaseModel.extend({
        url: BaseModel.apiRoot + '/posts/',
    
        generateSlug: function () {
            // @TODO Make this request use this.get('title') once we're an actual user
            var url = this.get('url') + 'slug/' + encodeURIComponent('test title') + '/';
            return ic.ajax.request(url, {
                type: 'GET'
            });
        },
    
        save: function (properties) {
            var url = this.url,
                self = this,
                type,
                validationErrors = this.validate();
    
            if (validationErrors.length) {
                return Ember.RSVP.Promise(function (resolve, reject) {
                    return reject(validationErrors);
                });
            }
    
            //If specific properties are being saved,
            //this is an edit. Otherwise, it's an add.
            if (properties && properties.length > 0) {
                type = 'PUT';
                url += this.get('id');
            } else {
                type = 'POST';
                properties = Ember.keys(this);
            }
    
            return ic.ajax.request(url, {
                type: type,
                data: this.getProperties(properties)
            }).then(function (model) {
                return self.setProperties(model);
            });
        },
        validate: function () {
            var validationErrors = [];
    
            if (!(this.get('title') && this.get('title').length)) {
                validationErrors.push({
                    message: "You must specify a title for the post."
                });
            }
    
            return validationErrors;
        }
    });
    
    __exports__["default"] = PostModel;
  });
define("ghost/models/settings", 
  ["ghost/models/base","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var validator = window.validator;
    
    var BaseModel = __dependency1__["default"];

    
    var SettingsModel = BaseModel.extend({
        url: BaseModel.apiRoot + '/settings/?type=blog,theme,app',
    
        title: null,
        description: null,
        email: null,
        logo: null,
        cover: null,
        defaultLang: null,
        postsPerPage: null,
        forceI18n: null,
        permalinks: null,
        activeTheme: null,
        activeApps: null,
        installedApps: null,
        availableThemes: null,
        availableApps: null,
    
        validate: function () {
            var validationErrors = [],
                postsPerPage;
    
            if (!validator.isLength(this.get('title'), 0, 150)) {
                validationErrors.push({message: "Title is too long", el: 'title'});
            }
    
            if (!validator.isLength(this.get('description'), 0, 200)) {
                validationErrors.push({message: "Description is too long", el: 'description'});
            }
    
            if (!validator.isEmail(this.get('email')) || !validator.isLength(this.get('email'), 0, 254)) {
                validationErrors.push({message: "Please supply a valid email address", el: 'email'});
            }
    
            postsPerPage = this.get('postsPerPage');
            if (!validator.isInt(postsPerPage) || postsPerPage > 1000) {
                validationErrors.push({message: "Please use a number less than 1000", el: 'postsPerPage'});
            }
    
            if (!validator.isInt(postsPerPage) || postsPerPage < 0) {
                validationErrors.push({message: "Please use a number greater than 0", el: 'postsPerPage'});
            }
    
            return validationErrors;
        },
        exportPath: BaseModel.adminRoot + '/export/',
        importFrom: function (file) {
            var formData = new FormData();
            formData.append('importfile', file);
            return ic.ajax.request(BaseModel.apiRoot + '/db/', {
                headers: {
                    'X-CSRF-Token': $('meta[name="csrf-param"]').attr('content')
                },
                type: 'POST',
                data: formData,
                dataType: 'json',
                cache: false,
                contentType: false,
                processData: false
            });
        },
        sendTestEmail: function () {
            return ic.ajax.request(BaseModel.apiRoot + '/mail/test/', {
                type: 'POST',
                headers: {
                    'X-CSRF-Token': $('meta[name="csrf-param"]').attr('content')
                }
            });
        }
    });
    
    __exports__["default"] = SettingsModel;
  });
define("ghost/models/user", 
  ["ghost/models/base","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var BaseModel = __dependency1__["default"];

    
    var UserModel = BaseModel.extend({
        id: null,
        name: null,
        image: null,
    
        isSignedIn: Ember.computed.bool('id'),
    
        url: BaseModel.apiRoot + '/users/me/',
        forgottenUrl: BaseModel.apiRoot + '/forgotten/',
        resetUrl: BaseModel.apiRoot + '/reset/',
    
        save: function () {
            return ic.ajax.request(this.url, {
                type: 'POST',
                data: this.getProperties(Ember.keys(this))
            });
        },
    
        validate: function () {
            var validationErrors = [];
    
            if (!validator.isLength(this.get('name'), 0, 150)) {
                validationErrors.push({message: "Name is too long"});
            }
    
            if (!validator.isLength(this.get('bio'), 0, 200)) {
                validationErrors.push({message: "Bio is too long"});
            }
    
            if (!validator.isEmail(this.get('email'))) {
                validationErrors.push({message: "Please supply a valid email address"});
            }
    
            if (!validator.isLength(this.get('location'), 0, 150)) {
                validationErrors.push({message: "Location is too long"});
            }
    
            if (this.get('website').length) {
                if (!validator.isURL(this.get('website'), { protocols: ['http', 'https'], require_protocol: true }) ||
                    !validator.isLength(this.get('website'), 0, 2000)) {
                    validationErrors.push({message: "Please use a valid url"});
                }
            }
    
            if (validationErrors.length > 0) {
                this.set('isValid', false);
            } else {
                this.set('isValid', true);
            }
    
            this.set('errors', validationErrors);
    
            return this;
        },
    
        saveNewPassword: function (password) {
            return ic.ajax.request(BaseModel.subdir + '/ghost/changepw/', {
                type: 'POST',
                data: password
            });
        },
    
        validatePassword: function (password) {
            var validationErrors = [];
    
            if (!validator.equals(password.newPassword, password.ne2Password)) {
                validationErrors.push("Your new passwords do not match");
            }
    
            if (!validator.isLength(password.newPassword, 8)) {
                validationErrors.push("Your password is not long enough. It must be at least 8 characters long.");
            }
    
            if (validationErrors.length > 0) {
                this.set('passwordIsValid', false);
            } else {
                this.set('passwordIsValid', true);
            }
    
            this.set('passwordErrors', validationErrors);
    
            return this;
        },
    
        fetchForgottenPasswordFor: function (email) {
            var self = this;
            return new Ember.RSVP.Promise(function (resolve, reject) {
                if (!validator.isEmail(email)) {
                    reject(new Error('Please enter a correct email address.'));
                } else {
                    resolve(ic.ajax.request(self.forgottenUrl, {
                        type: 'POST',
                        headers: {
                            // @TODO Find a more proper way to do this.
                            'X-CSRF-Token': $('meta[name="csrf-param"]').attr('content')
                        },
                        data: {
                            email: email
                        }
                    }));
                }
            });
        },
    
        resetPassword: function (passwords, token) {
            var self = this;
            return new Ember.RSVP.Promise(function (resolve, reject) {
                if (!self.validatePassword(passwords).get('passwordIsValid')) {
                    reject(new Error('Errors found! ' + JSON.stringify(self.get('passwordErrors'))));
                } else {
                    resolve(ic.ajax.request(self.resetUrl, {
                        type: 'POST',
                        headers: {
                            // @TODO: find a more proper way to do this.
                            'X-CSRF-Token': $('meta[name="csrf-param"]').attr('content')
                        },
                        data: {
                            newpassword: passwords.newPassword,
                            ne2password: passwords.ne2Password,
                            token: token
                        }
                    }));
                }
            });
        }
    });
    
    __exports__["default"] = UserModel;
  });
define("ghost/router", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /*global Ember */
    
    // ensure we don't share routes between all Router instances
    var Router = Ember.Router.extend();
    
    Router.reopen({
        location: 'trailing-history', // use HTML5 History API instead of hash-tag based URLs
        rootURL: '/ghost/ember/' // admin interface lives under sub-directory /ghost
    });
    
    Router.map(function () {
        this.route('signin');
        this.route('signup');
        this.route('forgotten');
        this.route('reset', { path: '/reset/:token' });
        this.resource('posts', { path: '/' }, function () {
            this.route('post', { path: ':post_id' });
        });
        this.resource('editor', { path: '/editor/:post_id' });
        this.route('new', { path: '/editor' });
        this.resource('settings', function () {
            this.route('general');
            this.route('user');
            this.route('apps');
        });
        this.route('debug');
        //Redirect legacy content to posts
        this.route('content');
    });
    
    __exports__["default"] = Router;
  });
define("ghost/routes/application", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var ApplicationRoute = Ember.Route.extend({
        actions: {
            signedIn: function (user) {
                this.container.lookup('user:current').setProperties(user);
            },
    
            signedOut: function () {
                this.container.lookup('user:current').setProperties({
                    id: null,
                    name: null,
                    image: null
                });
            },
    
            openModal: function (modalName, model) {
                modalName = 'modals/' + modalName;
                // We don't always require a modal to have a controller
                // so we're skipping asserting if one exists
                if (this.controllerFor(modalName, true)) {
                    this.controllerFor(modalName).set('model', model);
                }
                return this.render(modalName, {
                    into: 'application',
                    outlet: 'modal'
                });
            },
    
            closeModal: function () {
                return this.disconnectOutlet({
                    outlet: 'modal',
                    parentView: 'application'
                });
            },
    
            handleErrors: function (errors) {
                this.notifications.clear();
                errors.forEach(function (errorObj) {
                    this.notifications.showError(errorObj.message || errorObj);
    
                    if (errorObj.hasOwnProperty('el')) {
                        errorObj.el.addClass('input-error');
                    }
                });
            }
        }
    });
    
    __exports__["default"] = ApplicationRoute;
  });
define("ghost/routes/authenticated", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var AuthenticatedRoute = Ember.Route.extend({
        beforeModel: function () {
            if (!this.get('user.isSignedIn')) {
                this.notifications.showError('Please sign in');
    
                this.transitionTo('signin');
            }
        },
    
        actions: {
            error: function (error) {
                if (error.jqXHR.status === 401) {
                    this.transitionTo('signin');
                }
            }
        }
    });
    
    __exports__["default"] = AuthenticatedRoute;
  });
define("ghost/routes/content", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var ContentRoute = Ember.Route.extend({
        beforeModel: function () {
            this.transitionTo('posts');
        }
    });
    
    __exports__["default"] = ContentRoute;
  });
define("ghost/routes/debug", 
  ["ghost/mixins/style-body","ghost/models/settings","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var styleBody = __dependency1__["default"];

    var SettingsModel = __dependency2__["default"];

    
    var settingsModel = SettingsModel.create();
    
    var DebugRoute = Ember.Route.extend(styleBody, {
        classNames: ['settings'],
        model: function () {
            return settingsModel;
        }
    });
    
    __exports__["default"] = DebugRoute;
  });
define("ghost/routes/editor", 
  ["ghost/utils/ajax","ghost/mixins/style-body","ghost/routes/authenticated","ghost/models/post","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    var ajax = __dependency1__["default"];

    var styleBody = __dependency2__["default"];

    var AuthenticatedRoute = __dependency3__["default"];

    var Post = __dependency4__["default"];

    var EditorRoute = AuthenticatedRoute.extend(styleBody, {
        classNames: ['editor'],
        controllerName: 'posts.post',
        model: function (params) {
            return ajax('/ghost/api/v0.1/posts/' + params.post_id).then(function (post) {
                return Post.create(post);
            });
        }
    });
    
    __exports__["default"] = EditorRoute;
  });
define("ghost/routes/forgotten", 
  ["ghost/mixins/style-body","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var styleBody = __dependency1__["default"];

    
    var ForgottenRoute = Ember.Route.extend(styleBody, {
        classNames: ['ghost-forgotten']
    });
    
    __exports__["default"] = ForgottenRoute;
  });
define("ghost/routes/new", 
  ["ghost/mixins/style-body","ghost/routes/authenticated","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var styleBody = __dependency1__["default"];

    var AuthenticatedRoute = __dependency2__["default"];

    
    var NewRoute = AuthenticatedRoute.extend(styleBody, {
        classNames: ['editor'],
    
        renderTemplate: function () {
            this.render('editor');
        }
    });
    
    __exports__["default"] = NewRoute;
  });
define("ghost/routes/posts", 
  ["ghost/utils/ajax","ghost/mixins/style-body","ghost/routes/authenticated","ghost/models/post","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    var ajax = __dependency1__["default"];

    var styleBody = __dependency2__["default"];

    var AuthenticatedRoute = __dependency3__["default"];

    var Post = __dependency4__["default"];

    
    var PostsRoute = AuthenticatedRoute.extend(styleBody, {
        classNames: ['manage'],
    
        model: function () {
            return ajax('/ghost/api/v0.1/posts').then(function (response) {
                return response.posts.map(function (post) {
                    return Post.create(post);
                });
            });
        },
    
        actions: {
            openEditor: function (post) {
                this.transitionTo('editor', post);
            }
        }
    });
    
    __exports__["default"] = PostsRoute;
  });
define("ghost/routes/posts/index", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var PostsIndexRoute = Ember.Route.extend({
        // redirect to first post subroute
        redirect: function () {
            var firstPost = (this.modelFor('posts') || []).get('firstObject');
    
            if (firstPost) {
                this.transitionTo('posts.post', firstPost);
            }
        }
    });
    
    __exports__["default"] = PostsIndexRoute;
  });
define("ghost/routes/posts/post", 
  ["ghost/models/post","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    /*global ajax */
    var Post = __dependency1__["default"];

    var PostsPostRoute = Ember.Route.extend({
        model: function (params) {
            return ajax('/ghost/api/v0.1/posts/' + params.post_id).then(function (post) {
                return Post.create(post);
            });
        }
    });
    
    __exports__["default"] = PostsPostRoute;
  });
define("ghost/routes/reset", 
  ["ghost/mixins/style-body","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var styleBody = __dependency1__["default"];

    
    var ResetRoute = Ember.Route.extend(styleBody, {
        classNames: ['ghost-reset'],
        setupController: function (controller, params) {
            controller.token = params.token;
        }
    });
    
    __exports__["default"] = ResetRoute;
  });
define("ghost/routes/settings", 
  ["ghost/mixins/style-body","ghost/routes/authenticated","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var styleBody = __dependency1__["default"];

    var AuthenticatedRoute = __dependency2__["default"];

    
    var SettingsRoute = AuthenticatedRoute.extend(styleBody, {
        classNames: ['settings']
    });
    
    __exports__["default"] = SettingsRoute;
  });
define("ghost/routes/settings/general", 
  ["ghost/utils/ajax","ghost/routes/authenticated","ghost/models/settings","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var ajax = __dependency1__["default"];

    var AuthenticatedRoute = __dependency2__["default"];

    var SettingsModel = __dependency3__["default"];

    
    var SettingsGeneralRoute = AuthenticatedRoute.extend({
        model: function () {
            return ajax('/ghost/api/v0.1/settings/?type=blog,theme,app').then(function (resp) {
                return SettingsModel.create(resp);
            });
        }
    });
    
    __exports__["default"] = SettingsGeneralRoute;
  });
define("ghost/routes/settings/index", 
  ["ghost/routes/authenticated","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var AuthenticatedRoute = __dependency1__["default"];

    
    var SettingsIndexRoute = AuthenticatedRoute.extend({
        // redirect to general tab
        redirect: function () {
            this.transitionTo('settings.general');
        }
    });
    
    __exports__["default"] = SettingsIndexRoute;
  });
define("ghost/routes/signin", 
  ["ghost/utils/ajax","ghost/mixins/style-body","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var ajax = __dependency1__["default"];

    var styleBody = __dependency2__["default"];

    
    var isEmpty = Ember.isEmpty;
    
    var SigninRoute = Ember.Route.extend(styleBody, {
        classNames: ['ghost-login'],
    
        actions: {
            login: function () {
                var self = this,
                    controller = this.get('controller'),
                    data = controller.getProperties('email', 'password');
    
                if (!isEmpty(data.email) && !isEmpty(data.password)) {
    
                    ajax({
                        url: '/ghost/signin/',
                        type: 'POST',
                        headers: {
                            "X-CSRF-Token": this.get('csrf')
                        },
                        data: data
                    }).then(
                        function (response) {
                            self.send('signedIn', response.userData);
    
                            self.notifications.clear();
    
                            self.transitionTo('posts');
                        }, function (resp) {
                            // This path is ridiculous, should be a helper in notifications; e.g. notifications.showAPIError
                            self.notifications.showAPIError(resp, 'There was a problem logging in, please try again.');
                        }
                    );
                } else {
                    this.notifications.clear();
    
                    this.notifications.showError('Must enter email + password');
                }
            }
        }
    });
    
    __exports__["default"] = SigninRoute;
  });
define("ghost/routes/signup", 
  ["ghost/mixins/style-body","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var styleBody = __dependency1__["default"];

    
    var SignupRoute = Ember.Route.extend(styleBody, {
        classNames: ['ghost-signup']
    });
    
    __exports__["default"] = SignupRoute;
  });
define("ghost/tpl/hbs-tpl", 
  [],
  function() {
    "use strict";
    this["JST"] = this["JST"] || {};
    
    this["JST"]["forgotten"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
      this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
      
    
    
      return "<form id=\"forgotten\" class=\"forgotten-form\" method=\"post\" novalidate=\"novalidate\">\n    <div class=\"email-wrap\">\n        <input class=\"email\" type=\"email\" placeholder=\"Email Address\" name=\"email\" autocapitalize=\"off\" autocorrect=\"off\">\n    </div>\n    <button class=\"button-save\" type=\"submit\">Send new password</button>\n</form>\n";
      });
    
    this["JST"]["list-item"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
      this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
      var buffer = "", stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, self=this, functionType="function";
    
    function program1(depth0,data) {
      
      
      return " featured";
      }
    
    function program3(depth0,data) {
      
      
      return " page";
      }
    
    function program5(depth0,data) {
      
      var buffer = "", stack1;
      buffer += "\n            ";
      stack1 = helpers['if'].call(depth0, (depth0 && depth0.page), {hash:{},inverse:self.program(8, program8, data),fn:self.program(6, program6, data),data:data});
      if(stack1 || stack1 === 0) { buffer += stack1; }
      buffer += "\n        ";
      return buffer;
      }
    function program6(depth0,data) {
      
      
      return "\n                    <span class=\"page\">Page</span>\n            ";
      }
    
    function program8(depth0,data) {
      
      var buffer = "", stack1, options;
      buffer += "\n                <time datetime=\"";
      options = {hash:{
        'format': ("YYYY-MM-DD hh:mm")
      },data:data};
      buffer += escapeExpression(((stack1 = helpers.date || (depth0 && depth0.date)),stack1 ? stack1.call(depth0, (depth0 && depth0.published_at), options) : helperMissing.call(depth0, "date", (depth0 && depth0.published_at), options)))
        + "\" class=\"date published\">\n                    Published ";
      options = {hash:{
        'timeago': ("True")
      },data:data};
      buffer += escapeExpression(((stack1 = helpers.date || (depth0 && depth0.date)),stack1 ? stack1.call(depth0, (depth0 && depth0.published_at), options) : helperMissing.call(depth0, "date", (depth0 && depth0.published_at), options)))
        + "\n                </time>\n            ";
      return buffer;
      }
    
    function program10(depth0,data) {
      
      
      return "\n            <span class=\"draft\">Draft</span>\n        ";
      }
    
      buffer += "<a class=\"permalink";
      stack1 = helpers['if'].call(depth0, (depth0 && depth0.featured), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
      if(stack1 || stack1 === 0) { buffer += stack1; }
      stack1 = helpers['if'].call(depth0, (depth0 && depth0.page), {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
      if(stack1 || stack1 === 0) { buffer += stack1; }
      buffer += "\" href=\"#\" title=\"Edit this post\">\n    <h3 class=\"entry-title\">";
      if (stack1 = helpers.title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
      else { stack1 = (depth0 && depth0.title); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
      if(stack1 || stack1 === 0) { buffer += stack1; }
      buffer += "</h3>\n    <section class=\"entry-meta\">\n        <span class=\"status\">\n        ";
      stack1 = helpers['if'].call(depth0, (depth0 && depth0.published), {hash:{},inverse:self.program(10, program10, data),fn:self.program(5, program5, data),data:data});
      if(stack1 || stack1 === 0) { buffer += stack1; }
      buffer += "\n        </span>\n    </section>\n</a>\n";
      return buffer;
      });
    
    this["JST"]["login"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
      this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
      var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;
    
    
      buffer += "<form id=\"login\" class=\"login-form\" method=\"post\" novalidate=\"novalidate\">\n    <div class=\"email-wrap\">\n        <input class=\"email\" type=\"email\" placeholder=\"Email Address\" name=\"email\" autocapitalize=\"off\" autocorrect=\"off\">\n    </div>\n    <div class=\"password-wrap\">\n        <input class=\"password\" type=\"password\" placeholder=\"Password\" name=\"password\">\n    </div>\n    <button class=\"button-save\" type=\"submit\">Log in</button>\n    <section class=\"meta\">\n        <a class=\"forgotten-password\" href=\"";
      if (stack1 = helpers.admin_url) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
      else { stack1 = (depth0 && depth0.admin_url); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
      buffer += escapeExpression(stack1)
        + "/forgotten/\">Forgotten password?</a>\n    </section>\n</form>\n";
      return buffer;
      });
    
    this["JST"]["modal"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
      this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
      var buffer = "", stack1, stack2, functionType="function", escapeExpression=this.escapeExpression, self=this;
    
    function program1(depth0,data) {
      
      var buffer = "", stack1;
      buffer += "-"
        + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.options)),stack1 == null || stack1 === false ? stack1 : stack1.type)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1));
      return buffer;
      }
    
    function program3(depth0,data) {
      
      var stack1, stack2;
      stack2 = helpers.each.call(depth0, ((stack1 = (depth0 && depth0.options)),stack1 == null || stack1 === false ? stack1 : stack1.style), {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data});
      if(stack2 || stack2 === 0) { return stack2; }
      else { return ''; }
      }
    function program4(depth0,data) {
      
      var buffer = "";
      buffer += "modal-style-"
        + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
        + " ";
      return buffer;
      }
    
    function program6(depth0,data) {
      
      var buffer = "", stack1;
      buffer += "<header class=\"modal-header\"><h1>"
        + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.content)),stack1 == null || stack1 === false ? stack1 : stack1.title)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
        + "</h1></header>";
      return buffer;
      }
    
    function program8(depth0,data) {
      
      
      return "<a class=\"close\" href=\"#\" title=\"Close\"><span class=\"hidden\">Close</span></a>";
      }
    
    function program10(depth0,data) {
      
      var buffer = "", stack1, stack2;
      buffer += "\n        <footer class=\"modal-footer\">\n            <button class=\"js-button-accept ";
      stack2 = helpers['if'].call(depth0, ((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.options)),stack1 == null || stack1 === false ? stack1 : stack1.confirm)),stack1 == null || stack1 === false ? stack1 : stack1.accept)),stack1 == null || stack1 === false ? stack1 : stack1.buttonClass), {hash:{},inverse:self.program(13, program13, data),fn:self.program(11, program11, data),data:data});
      if(stack2 || stack2 === 0) { buffer += stack2; }
      buffer += "\">"
        + escapeExpression(((stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.options)),stack1 == null || stack1 === false ? stack1 : stack1.confirm)),stack1 == null || stack1 === false ? stack1 : stack1.accept)),stack1 == null || stack1 === false ? stack1 : stack1.text)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
        + "</button>\n            <button class=\"js-button-reject ";
      stack2 = helpers['if'].call(depth0, ((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.options)),stack1 == null || stack1 === false ? stack1 : stack1.confirm)),stack1 == null || stack1 === false ? stack1 : stack1.reject)),stack1 == null || stack1 === false ? stack1 : stack1.buttonClass), {hash:{},inverse:self.program(17, program17, data),fn:self.program(15, program15, data),data:data});
      if(stack2 || stack2 === 0) { buffer += stack2; }
      buffer += "\">"
        + escapeExpression(((stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.options)),stack1 == null || stack1 === false ? stack1 : stack1.confirm)),stack1 == null || stack1 === false ? stack1 : stack1.reject)),stack1 == null || stack1 === false ? stack1 : stack1.text)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
        + "</button>\n        </footer>\n        ";
      return buffer;
      }
    function program11(depth0,data) {
      
      var stack1;
      return escapeExpression(((stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.options)),stack1 == null || stack1 === false ? stack1 : stack1.confirm)),stack1 == null || stack1 === false ? stack1 : stack1.accept)),stack1 == null || stack1 === false ? stack1 : stack1.buttonClass)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1));
      }
    
    function program13(depth0,data) {
      
      
      return "button-add";
      }
    
    function program15(depth0,data) {
      
      var stack1;
      return escapeExpression(((stack1 = ((stack1 = ((stack1 = ((stack1 = (depth0 && depth0.options)),stack1 == null || stack1 === false ? stack1 : stack1.confirm)),stack1 == null || stack1 === false ? stack1 : stack1.reject)),stack1 == null || stack1 === false ? stack1 : stack1.buttonClass)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1));
      }
    
    function program17(depth0,data) {
      
      
      return "button-delete";
      }
    
      buffer += "<article class=\"modal";
      stack2 = helpers['if'].call(depth0, ((stack1 = (depth0 && depth0.options)),stack1 == null || stack1 === false ? stack1 : stack1.type), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
      if(stack2 || stack2 === 0) { buffer += stack2; }
      buffer += " ";
      stack2 = helpers['if'].call(depth0, ((stack1 = (depth0 && depth0.options)),stack1 == null || stack1 === false ? stack1 : stack1.style), {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
      if(stack2 || stack2 === 0) { buffer += stack2; }
      buffer += escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.options)),stack1 == null || stack1 === false ? stack1 : stack1.animation)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
        + " js-modal\">\n    <section class=\"modal-content\">\n        ";
      stack2 = helpers['if'].call(depth0, ((stack1 = (depth0 && depth0.content)),stack1 == null || stack1 === false ? stack1 : stack1.title), {hash:{},inverse:self.noop,fn:self.program(6, program6, data),data:data});
      if(stack2 || stack2 === 0) { buffer += stack2; }
      buffer += "\n        ";
      stack2 = helpers['if'].call(depth0, ((stack1 = (depth0 && depth0.options)),stack1 == null || stack1 === false ? stack1 : stack1.close), {hash:{},inverse:self.noop,fn:self.program(8, program8, data),data:data});
      if(stack2 || stack2 === 0) { buffer += stack2; }
      buffer += "\n        <section class=\"modal-body\">\n        </section>\n        ";
      stack2 = helpers['if'].call(depth0, ((stack1 = (depth0 && depth0.options)),stack1 == null || stack1 === false ? stack1 : stack1.confirm), {hash:{},inverse:self.noop,fn:self.program(10, program10, data),data:data});
      if(stack2 || stack2 === 0) { buffer += stack2; }
      buffer += "\n    </section>\n</article>";
      return buffer;
      });
    
    this["JST"]["modals/blank"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
      this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
      var stack1, stack2, functionType="function";
    
    
      stack2 = ((stack1 = ((stack1 = (depth0 && depth0.content)),stack1 == null || stack1 === false ? stack1 : stack1.text)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1);
      if(stack2 || stack2 === 0) { return stack2; }
      else { return ''; }
      });
    
    this["JST"]["modals/copyToHTML"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
      this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
      
    
    
      return "Press Ctrl / Cmd + C to copy the following HTML.\n<pre>\n<code class=\"modal-copyToHTML-content\"></code>\n</pre>";
      });
    
    this["JST"]["modals/markdown"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
      this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
      
    
    
      return "<section class=\"markdown-help-container\">\n    <table class=\"modal-markdown-help-table\">\n        <thead>\n            <tr>\n                <th>Result</th>\n                <th>Markdown</th>\n                <th>Shortcut</th>\n            </tr>\n        </thead>\n        <tbody>\n            <tr>\n                <td><strong>Bold</strong></td>\n                <td>**text**</td>\n                <td>Ctrl / Cmd + B</td>\n            </tr>\n            <tr>\n                <td><em>Emphasize</em></td>\n                <td>*text*</td>\n                <td>Ctrl / Cmd + I</td>\n            </tr>\n            <tr>\n                <td>Strike-through</td>\n                <td>~~text~~</td>\n                <td>Ctrl + Alt + U</td>\n            </tr>\n            <tr>\n                <td><a href=\"#\">Link</a></td>\n                <td>[title](http://)</td>\n                <td>Ctrl + Shift + L</td>\n            </tr>\n            <tr>\n                <td>Image</td>\n                <td>![alt](http://)</td>\n                <td>Ctrl + Shift + I</td>\n            </tr>\n            <tr>\n                <td>List</td>\n                <td>* item</td>\n                <td>Ctrl + L</td>\n            </tr>\n            <tr>\n                <td>Blockquote</td>\n                <td>> quote</td>\n                <td>Ctrl + Q</td>\n            </tr>\n            <tr>\n                <td>H1</td>\n                <td># Heading</td>\n                <td>Ctrl + Alt + 1</td>\n            </tr>\n            <tr>\n                <td>H2</td>\n                <td>## Heading</td>\n                <td>Ctrl + Alt + 2</td>\n            </tr>\n            <tr>\n                <td>H3</td>\n                <td>### Heading</td>\n                <td>Ctrl + Alt + 3</td>\n            </tr>\n            <tr>\n                <td><code>Inline Code</code></td>\n                <td>`code`</td>\n                <td>Cmd + K / Ctrl + Shift + K</td>\n            </tr>\n        </tbody>\n    </table>\n    For further Markdown syntax reference: <a href=\"http://daringfireball.net/projects/markdown/syntax\" target=\"_blank\">Markdown Documentation</a>\n</section>\n";
      });
    
    this["JST"]["modals/uploadImage"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
      this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
      var buffer = "", stack1, stack2, functionType="function", escapeExpression=this.escapeExpression, self=this;
    
    function program1(depth0,data) {
      
      
      return " style=\"display: none\"";
      }
    
    function program3(depth0,data) {
      
      var buffer = "", stack1;
      buffer += "accept=\""
        + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.options)),stack1 == null || stack1 === false ? stack1 : stack1.acceptEncoding)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
        + "\"";
      return buffer;
      }
    
      buffer += "<section class=\"js-drop-zone\">\n    <img class=\"js-upload-target\" src=\""
        + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.options)),stack1 == null || stack1 === false ? stack1 : stack1.src)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
        + "\"";
      stack2 = helpers.unless.call(depth0, ((stack1 = (depth0 && depth0.options)),stack1 == null || stack1 === false ? stack1 : stack1.src), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
      if(stack2 || stack2 === 0) { buffer += stack2; }
      buffer += " alt=\"logo\">\n    <input data-url=\"upload\" class=\"js-fileupload main\" type=\"file\" name=\"uploadimage\" ";
      stack2 = helpers['if'].call(depth0, ((stack1 = (depth0 && depth0.options)),stack1 == null || stack1 === false ? stack1 : stack1.acceptEncoding), {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
      if(stack2 || stack2 === 0) { buffer += stack2; }
      buffer += ">\n</section>\n";
      return buffer;
      });
    
    this["JST"]["notification"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
      this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
      var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;
    
    function program1(depth0,data) {
      
      var buffer = "", stack1;
      buffer += "-";
      if (stack1 = helpers.type) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
      else { stack1 = (depth0 && depth0.type); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
      buffer += escapeExpression(stack1);
      return buffer;
      }
    
      buffer += "<section class=\"notification";
      stack1 = helpers['if'].call(depth0, (depth0 && depth0.type), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
      if(stack1 || stack1 === 0) { buffer += stack1; }
      buffer += " notification-";
      if (stack1 = helpers.status) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
      else { stack1 = (depth0 && depth0.status); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
      buffer += escapeExpression(stack1)
        + " js-notification\">\n    ";
      if (stack1 = helpers.message) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
      else { stack1 = (depth0 && depth0.message); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
      if(stack1 || stack1 === 0) { buffer += stack1; }
      buffer += "\n    <a class=\"close\" href=\"#\"><span class=\"hidden\">Close</span></a>\n</section>\n";
      return buffer;
      });
    
    this["JST"]["preview"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
      this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
      var buffer = "", stack1, stack2, functionType="function", escapeExpression=this.escapeExpression, self=this;
    
    function program1(depth0,data) {
      
      
      return "featured";
      }
    
    function program3(depth0,data) {
      
      
      return "unfeatured";
      }
    
    function program5(depth0,data) {
      
      
      return "Unfeature";
      }
    
    function program7(depth0,data) {
      
      
      return "Feature";
      }
    
    function program9(depth0,data) {
      
      
      return "Published";
      }
    
    function program11(depth0,data) {
      
      
      return "Written";
      }
    
    function program13(depth0,data) {
      
      var stack1;
      return escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.author)),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1));
      }
    
    function program15(depth0,data) {
      
      var stack1;
      return escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.author)),stack1 == null || stack1 === false ? stack1 : stack1.email)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1));
      }
    
    function program17(depth0,data) {
      
      var buffer = "", stack1;
      buffer += "\n    <div class=\"no-posts-box\">\n        <div class=\"no-posts\">\n            <h3>You Haven't Written Any Posts Yet!</h3>\n            <form action=\"";
      if (stack1 = helpers.admin_url) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
      else { stack1 = (depth0 && depth0.admin_url); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
      buffer += escapeExpression(stack1)
        + "/editor/\"><button class=\"button-add large\" title=\"New Post\">Write a new Post</button></form>\n        </div>\n    </div>\n";
      return buffer;
      }
    
      buffer += "<header class=\"floatingheader\">\n    <button class=\"button-back\" href=\"#\">Back</button>\n    <a class=\"";
      stack1 = helpers['if'].call(depth0, (depth0 && depth0.featured), {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),data:data});
      if(stack1 || stack1 === 0) { buffer += stack1; }
      buffer += "\" href=\"#\" title=\"";
      stack1 = helpers['if'].call(depth0, (depth0 && depth0.featured), {hash:{},inverse:self.program(7, program7, data),fn:self.program(5, program5, data),data:data});
      if(stack1 || stack1 === 0) { buffer += stack1; }
      buffer += " this post\">\n        <span class=\"hidden\">Star</span>\n    </a>\n    <small>\n        <span class=\"status\">";
      stack1 = helpers['if'].call(depth0, (depth0 && depth0.published), {hash:{},inverse:self.program(11, program11, data),fn:self.program(9, program9, data),data:data});
      if(stack1 || stack1 === 0) { buffer += stack1; }
      buffer += "</span>\n        <span class=\"normal\">by</span>\n        <span class=\"author\">";
      stack2 = helpers['if'].call(depth0, ((stack1 = (depth0 && depth0.author)),stack1 == null || stack1 === false ? stack1 : stack1.name), {hash:{},inverse:self.program(15, program15, data),fn:self.program(13, program13, data),data:data});
      if(stack2 || stack2 === 0) { buffer += stack2; }
      buffer += "</span>\n    </small>\n    <section class=\"post-controls\">\n        <a class=\"post-edit\" href=\"#\" title=\"Edit Post\"><span class=\"hidden\">Edit Post</span></a>\n        <a class=\"post-settings\" href=\"#\" data-toggle=\".post-settings-menu\" title=\"Post Settings\"><span class=\"hidden\">Post Settings</span></a>\n        <div class=\"post-settings-menu menu-drop-right overlay\">\n            <form>\n                <table class=\"plain\">\n                    <tr class=\"post-setting\">\n                        <td class=\"post-setting-label\">\n                            <label for=\"url\">URL</label>\n                        </td>\n                        <td class=\"post-setting-field\">\n                            <input id=\"url\" class=\"post-setting-slug\" type=\"text\" value=\"\" />\n                        </td>\n                    </tr>\n                    <tr class=\"post-setting\">\n                        <td class=\"post-setting-label\">\n                            <label for=\"pub-date\">Pub Date</label>\n                        </td>\n                        <td class=\"post-setting-field\">\n                            <input id=\"pub-date\" class=\"post-setting-date\" type=\"text\" value=\"\"><!--<span class=\"post-setting-calendar\"></span>-->\n                        </td>\n                    </tr>\n                    <tr class=\"post-setting\">\n                        <td class=\"post-setting-label\">\n                            <span class=\"label\">Static Page</span>\n                        </td>\n                        <td class=\"post-setting-item\">\n                            <input id=\"static-page\" class=\"post-setting-static-page\" type=\"checkbox\" value=\"\">\n                            <label class=\"checkbox\" for=\"static-page\"></label>\n                        </td>\n                    </tr>\n                </table>\n            </form>\n            <a class=\"delete\" href=\"#\">Delete This Post</a>\n        </div>\n    </section>\n</header>\n<section class=\"content-preview-content\">\n    <div class=\"wrapper\"><h1>";
      if (stack2 = helpers.title) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
      else { stack2 = (depth0 && depth0.title); stack2 = typeof stack2 === functionType ? stack2.call(depth0, {hash:{},data:data}) : stack2; }
      if(stack2 || stack2 === 0) { buffer += stack2; }
      buffer += "</h1>";
      if (stack2 = helpers.html) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
      else { stack2 = (depth0 && depth0.html); stack2 = typeof stack2 === functionType ? stack2.call(depth0, {hash:{},data:data}) : stack2; }
      if(stack2 || stack2 === 0) { buffer += stack2; }
      buffer += "</div>\n</section>\n";
      stack2 = helpers.unless.call(depth0, (depth0 && depth0.title), {hash:{},inverse:self.noop,fn:self.program(17, program17, data),data:data});
      if(stack2 || stack2 === 0) { buffer += stack2; }
      buffer += "\n";
      return buffer;
      });
    
    this["JST"]["reset"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
      this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
      
    
    
      return "<form id=\"reset\" class=\"reset-form\" method=\"post\" novalidate=\"novalidate\">\n    <div class=\"password-wrap\">\n        <input class=\"password\" type=\"password\" placeholder=\"Password\" name=\"newpassword\" />\n    </div>\n    <div class=\"password-wrap\">\n        <input class=\"password\" type=\"password\" placeholder=\"Confirm Password\" name=\"ne2password\" />\n    </div>\n    <button class=\"button-save\" type=\"submit\">Reset Password</button>\n</form>\n";
      });
    
    this["JST"]["settings/apps"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
      this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
      var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;
    
    function program1(depth0,data) {
      
      var buffer = "", stack1;
      buffer += "\n        <li>\n            ";
      stack1 = helpers['if'].call(depth0, (depth0 && depth0['package']), {hash:{},inverse:self.program(4, program4, data),fn:self.program(2, program2, data),data:data});
      if(stack1 || stack1 === 0) { buffer += stack1; }
      buffer += "\n            <button data-app=\"";
      if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
      else { stack1 = (depth0 && depth0.name); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
      buffer += escapeExpression(stack1)
        + "\" class=\"";
      stack1 = helpers['if'].call(depth0, (depth0 && depth0.active), {hash:{},inverse:self.program(8, program8, data),fn:self.program(6, program6, data),data:data});
      if(stack1 || stack1 === 0) { buffer += stack1; }
      buffer += "</button>\n        </li>\n        ";
      return buffer;
      }
    function program2(depth0,data) {
      
      var buffer = "", stack1;
      buffer += escapeExpression(((stack1 = ((stack1 = (depth0 && depth0['package'])),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
        + " - "
        + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0['package'])),stack1 == null || stack1 === false ? stack1 : stack1.version)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1));
      return buffer;
      }
    
    function program4(depth0,data) {
      
      var buffer = "", stack1;
      if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
      else { stack1 = (depth0 && depth0.name); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
      buffer += escapeExpression(stack1)
        + " - package.json missing :(";
      return buffer;
      }
    
    function program6(depth0,data) {
      
      
      return "button-delete js-button-deactivate js-button-active\">Deactivate";
      }
    
    function program8(depth0,data) {
      
      
      return "button-add js-button-activate\">Activate";
      }
    
      buffer += "<header>\n    <button class=\"button-back\">Back</button>\n    <h2 class=\"title\">Apps</h2>\n</header>\n\n<section class=\"content\">\n    <ul class=\"js-apps\">\n        ";
      stack1 = helpers.each.call(depth0, (depth0 && depth0.availableApps), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
      if(stack1 || stack1 === 0) { buffer += stack1; }
      buffer += "\n    </ul>\n</section>";
      return buffer;
      });
    
    this["JST"]["settings/general"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
      this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
      var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;
    
    function program1(depth0,data) {
      
      var buffer = "", stack1;
      buffer += "\n                    <a class=\"js-modal-logo\" href=\"#\"><img id=\"blog-logo\" src=\"";
      if (stack1 = helpers.logo) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
      else { stack1 = (depth0 && depth0.logo); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
      buffer += escapeExpression(stack1)
        + "\" alt=\"logo\"></a>\n                ";
      return buffer;
      }
    
    function program3(depth0,data) {
      
      
      return "\n                    <a class=\"button-add js-modal-logo\" >Upload Image</a>\n                ";
      }
    
    function program5(depth0,data) {
      
      var buffer = "", stack1;
      buffer += "\n                    <a class=\"js-modal-cover\" href=\"#\"><img id=\"blog-cover\" src=\"";
      if (stack1 = helpers.cover) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
      else { stack1 = (depth0 && depth0.cover); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
      buffer += escapeExpression(stack1)
        + "\" alt=\"cover photo\"></a>\n                ";
      return buffer;
      }
    
    function program7(depth0,data) {
      
      
      return "\n                    <a class=\"button-add js-modal-cover\">Upload Image</a>\n                ";
      }
    
    function program9(depth0,data) {
      
      var buffer = "", stack1;
      buffer += "\n                        <option value=\"";
      if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
      else { stack1 = (depth0 && depth0.name); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
      buffer += escapeExpression(stack1)
        + "\" ";
      stack1 = helpers['if'].call(depth0, (depth0 && depth0.active), {hash:{},inverse:self.noop,fn:self.program(10, program10, data),data:data});
      if(stack1 || stack1 === 0) { buffer += stack1; }
      buffer += ">";
      stack1 = helpers['if'].call(depth0, (depth0 && depth0['package']), {hash:{},inverse:self.program(14, program14, data),fn:self.program(12, program12, data),data:data});
      if(stack1 || stack1 === 0) { buffer += stack1; }
      buffer += "</option>\n                        ";
      stack1 = helpers.unless.call(depth0, (depth0 && depth0['package']), {hash:{},inverse:self.noop,fn:self.program(16, program16, data),data:data});
      if(stack1 || stack1 === 0) { buffer += stack1; }
      buffer += "\n                    ";
      return buffer;
      }
    function program10(depth0,data) {
      
      
      return "selected";
      }
    
    function program12(depth0,data) {
      
      var buffer = "", stack1;
      buffer += escapeExpression(((stack1 = ((stack1 = (depth0 && depth0['package'])),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
        + " - "
        + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0['package'])),stack1 == null || stack1 === false ? stack1 : stack1.version)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1));
      return buffer;
      }
    
    function program14(depth0,data) {
      
      var stack1;
      if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
      else { stack1 = (depth0 && depth0.name); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
      return escapeExpression(stack1);
      }
    
    function program16(depth0,data) {
      
      var buffer = "", stack1;
      buffer += "<script>console.log('Hi! The theme named \"";
      if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
      else { stack1 = (depth0 && depth0.name); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
      buffer += escapeExpression(stack1)
        + "\" does not have a package.json file or it\\'s malformed. This will be required in the future. For more info, see http://docs.ghost.org/themes/.');</script>";
      return buffer;
      }
    
      buffer += "<header>\n    <button class=\"button-back\">Back</button>\n    <h2 class=\"title\">General</h2>\n    <section class=\"page-actions\">\n        <button class=\"button-save\">Save</button>\n    </section>\n</header>\n\n<section class=\"content\">\n    <form id=\"settings-general\" novalidate=\"novalidate\">\n        <fieldset>\n\n            <div class=\"form-group\">\n                <label for=\"blog-title\">Blog Title</label>\n                <input id=\"blog-title\" name=\"general[title]\" type=\"text\" value=\"";
      if (stack1 = helpers.title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
      else { stack1 = (depth0 && depth0.title); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
      buffer += escapeExpression(stack1)
        + "\" />\n                <p>The name of your blog</p>\n            </div>\n\n            <div class=\"form-group description-container\">\n                <label for=\"blog-description\">Blog Description</label>\n                <textarea id=\"blog-description\">";
      if (stack1 = helpers.description) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
      else { stack1 = (depth0 && depth0.description); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
      buffer += escapeExpression(stack1)
        + "</textarea>\n                <p>\n                    Describe what your blog is about\n                    <span class=\"word-count\">0</span>\n                </p>\n\n            </div>\n        </fieldset>\n            <div class=\"form-group\">\n                <label for=\"blog-logo\">Blog Logo</label>\n                ";
      stack1 = helpers['if'].call(depth0, (depth0 && depth0.logo), {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),data:data});
      if(stack1 || stack1 === 0) { buffer += stack1; }
      buffer += "\n                <p>Display a sexy logo for your publication</p>\n            </div>\n\n            <div class=\"form-group\">\n                <label for=\"blog-cover\">Blog Cover</label>\n                ";
      stack1 = helpers['if'].call(depth0, (depth0 && depth0.cover), {hash:{},inverse:self.program(7, program7, data),fn:self.program(5, program5, data),data:data});
      if(stack1 || stack1 === 0) { buffer += stack1; }
      buffer += "\n                <p>Display a cover image on your site</p>\n            </div>\n        <fieldset>\n            <div class=\"form-group\">\n                <label for=\"email-address\">Email Address</label>\n                <input id=\"email-address\" name=\"general[email-address]\" type=\"email\" value=\"";
      if (stack1 = helpers.email) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
      else { stack1 = (depth0 && depth0.email); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
      buffer += escapeExpression(stack1)
        + "\" autocapitalize=\"off\" autocorrect=\"off\" />\n                <p>Address to use for admin notifications</p>\n            </div>\n\n            <div class=\"form-group\">\n                <label for=\"postsPerPage\">Posts per page</label>\n                <input id=\"postsPerPage\" name=\"general[postsPerPage]\" type=\"number\" value=\"";
      if (stack1 = helpers.postsPerPage) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
      else { stack1 = (depth0 && depth0.postsPerPage); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
      buffer += escapeExpression(stack1)
        + "\" />\n                <p>How many posts should be displayed on each page</p>\n            </div>\n\n            <div class=\"form-group\">\n                <label for=\"permalinks\">Dated Permalinks</label>\n                <input id=\"permalinks\" name=\"general[permalinks]\" type=\"checkbox\" value='permalink'/>\n                <label class=\"checkbox\" for=\"permalinks\"></label>\n                <p>Include the date in your post URLs</p>\n            </div>\n\n            <div class=\"form-group\">\n                <label for=\"activeTheme\">Theme</label>\n                <select id=\"activeTheme\" name=\"general[activeTheme]\">\n                    ";
      stack1 = helpers.each.call(depth0, (depth0 && depth0.availableThemes), {hash:{},inverse:self.noop,fn:self.program(9, program9, data),data:data});
      if(stack1 || stack1 === 0) { buffer += stack1; }
      buffer += "\n                </select>\n                <p>Select a theme for your blog</p>\n            </div>\n\n        </fieldset>\n    </form>\n</section>\n";
      return buffer;
      });
    
    this["JST"]["settings/sidebar"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
      this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
      
    
    
      return "<header>\n    <h1 class=\"title\">Settings</h1>\n</header>\n<nav class=\"settings-menu\">\n    <ul>\n        <li class=\"general\"><a href=\"#general\">General</a></li>\n        <li class=\"users\"><a href=\"#user\">User</a></li>\n        <li class=\"apps\"><a href=\"#apps\">Apps</a></li>\n    </ul>\n</nav>";
      });
    
    this["JST"]["settings/user-profile"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
      this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
      var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, self=this;
    
    function program1(depth0,data) {
      
      var stack1;
      if (stack1 = helpers.cover) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
      else { stack1 = (depth0 && depth0.cover); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
      return escapeExpression(stack1);
      }
    
    function program3(depth0,data) {
      
      var stack1, options;
      options = {hash:{},data:data};
      return escapeExpression(((stack1 = helpers.asset || (depth0 && depth0.asset)),stack1 ? stack1.call(depth0, "shared/img/user-cover.png", options) : helperMissing.call(depth0, "asset", "shared/img/user-cover.png", options)));
      }
    
    function program5(depth0,data) {
      
      var stack1;
      if (stack1 = helpers.image) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
      else { stack1 = (depth0 && depth0.image); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
      return escapeExpression(stack1);
      }
    
    function program7(depth0,data) {
      
      var stack1, options;
      options = {hash:{},data:data};
      return escapeExpression(((stack1 = helpers.asset || (depth0 && depth0.asset)),stack1 ? stack1.call(depth0, "shared/img/user-image.png", options) : helperMissing.call(depth0, "asset", "shared/img/user-image.png", options)));
      }
    
      buffer += "<header>\n    <button class=\"button-back\">Back</button>\n    <h2 class=\"title\">Your Profile</h2>\n    <section class=\"page-actions\">\n        <button class=\"button-save\">Save</button>\n    </section>\n</header>\n\n<section class=\"content no-padding\">\n\n    <header class=\"user-profile-header\">\n        <img id=\"user-cover\" class=\"cover-image\" src=\"";
      stack1 = helpers['if'].call(depth0, (depth0 && depth0.cover), {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),data:data});
      if(stack1 || stack1 === 0) { buffer += stack1; }
      buffer += "\" title=\"";
      if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
      else { stack1 = (depth0 && depth0.name); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
      buffer += escapeExpression(stack1)
        + "'s Cover Image\"/>\n\n        <a class=\"edit-cover-image js-modal-cover button\" href=\"#\">Change Cover</a>\n    </header>\n\n    <form class=\"user-profile\" novalidate=\"novalidate\">\n\n        <fieldset class=\"user-details-top\">\n\n            <figure class=\"user-image\">\n                <div id=\"user-image\" class=\"img\" style=\"background-image: url(";
      stack1 = helpers['if'].call(depth0, (depth0 && depth0.image), {hash:{},inverse:self.program(7, program7, data),fn:self.program(5, program5, data),data:data});
      if(stack1 || stack1 === 0) { buffer += stack1; }
      buffer += ");\" href=\"#\"><span class=\"hidden\">";
      if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
      else { stack1 = (depth0 && depth0.name); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
      buffer += escapeExpression(stack1)
        + "'s Picture</span></div>\n                <a href=\"#\" class=\"edit-user-image js-modal-image\">Edit Picture</a>\n            </figure>\n\n            <div class=\"form-group\">\n                <label for=\"user-name\" class=\"hidden\">Full Name</label>\n                <input type=\"text\" value=\"";
      if (stack1 = helpers.name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
      else { stack1 = (depth0 && depth0.name); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
      buffer += escapeExpression(stack1)
        + "\" id=\"user-name\" placeholder=\"Full Name\" autocorrect=\"off\" />\n                <p>Use your real name so people can recognise you</p>\n            </div>\n\n        </fieldset>\n\n        <fieldset class=\"user-details-bottom\">\n\n            <div class=\"form-group\">\n                <label for\"user-email\">Email</label>\n                <input type=\"email\" value=\"";
      if (stack1 = helpers.email) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
      else { stack1 = (depth0 && depth0.email); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
      buffer += escapeExpression(stack1)
        + "\" id=\"user-email\" placeholder=\"Email Address\" autocapitalize=\"off\" autocorrect=\"off\" />\n                <p>Used for notifications</p>\n            </div>\n\n            <div class=\"form-group\">\n                <label for=\"user-location\">Location</label>\n                <input type=\"text\" value=\"";
      if (stack1 = helpers.location) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
      else { stack1 = (depth0 && depth0.location); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
      buffer += escapeExpression(stack1)
        + "\" id=\"user-location\" />\n                <p>Where in the world do you live?</p>\n            </div>\n\n            <div class=\"form-group\">\n                <label for=\"user-website\">Website</label>\n                <input type=\"url\" value=\"";
      if (stack1 = helpers.website) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
      else { stack1 = (depth0 && depth0.website); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
      buffer += escapeExpression(stack1)
        + "\" id=\"user-website\" autocapitalize=\"off\" autocorrect=\"off\" />\n                <p>Have a website or blog other than this one? Link it!</p>\n            </div>\n\n            <div class=\"form-group bio-container\">\n                <label for=\"user-bio\">Bio</label>\n                <textarea id=\"user-bio\">";
      if (stack1 = helpers.bio) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
      else { stack1 = (depth0 && depth0.bio); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
      buffer += escapeExpression(stack1)
        + "</textarea>\n                <p>\n                    Write about you, in 200 characters or less.\n                    <span class=\"word-count\">0</span>\n                </p>\n            </div>\n\n            <hr />\n\n        </fieldset>\n\n        <fieldset>\n\n            <div class=\"form-group\">\n                <label for=\"user-password-old\">Old Password</label>\n                <input type=\"password\" id=\"user-password-old\" />\n            </div>\n\n            <div class=\"form-group\">\n                <label for=\"user-password-new\">New Password</label>\n                <input type=\"password\" id=\"user-password-new\" />\n            </div>\n\n            <div class=\"form-group\">\n                <label for=\"user-new-password-verification\">Verify Password</label>\n                <input type=\"password\" id=\"user-new-password-verification\" />\n            </div>\n            <div class=\"form-group\">\n                <button type=\"button\" class=\"button-delete button-change-password\">Change Password</button>\n            </div>\n\n        </fieldset>\n\n    </form>\n</section>\n";
      return buffer;
      });
    
    this["JST"]["signup"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
      this.compilerInfo = [4,'>= 1.0.0'];
    helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
      
    
    
      return "<form id=\"signup\" class=\"signup-form\" method=\"post\" novalidate=\"novalidate\">\n    <div class=\"name-wrap\">\n        <input class=\"name\" type=\"text\" placeholder=\"Full Name\" name=\"name\" autocorrect=\"off\" />\n    </div>\n    <div class=\"email-wrap\">\n        <input class=\"email\" type=\"email\" placeholder=\"Email Address\" name=\"email\" autocapitalize=\"off\" autocorrect=\"off\" />\n    </div>\n    <div class=\"password-wrap\">\n        <input class=\"password\" type=\"password\" placeholder=\"Password\" name=\"password\" />\n    </div>\n    <button class=\"button-save\" type=\"submit\">Sign Up</button>\n</form>\n";
      });
  });
define("ghost/utils/ajax", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /* global ic */
    __exports__["default"] = window.ajax = function () {
        return ic.ajax.request.apply(null, arguments);
    };
  });
define("ghost/utils/date-formatting", 
  ["exports"],
  function(__exports__) {
    "use strict";
    /* global moment */
    var parseDateFormats = ["DD MMM YY HH:mm",
                            "DD MMM YYYY HH:mm",
                            "DD/MM/YY HH:mm",
                            "DD/MM/YYYY HH:mm",
                            "DD-MM-YY HH:mm",
                            "DD-MM-YYYY HH:mm",
                            "YYYY-MM-DD HH:mm"],
        displayDateFormat = 'DD MMM YY @ HH:mm';
    
    //Parses a string to a Moment
    var parseDateString = function (value) {
        return value ? moment(value, parseDateFormats) : '';
    };
    
    //Formats a Date or Moment
    var formatDate = function (value) {
        return value ? moment(value).format(displayDateFormat) : '';
    };
    
    __exports__.parseDateString = parseDateString;
    __exports__.formatDate = formatDate;
  });
define("ghost/utils/link-view", 
  [],
  function() {
    "use strict";
    Ember.LinkView.reopen({
        active: Ember.computed('resolvedParams', 'routeArgs', function () {
            var isActive = this._super();
    
            Ember.set(this, 'alternateActive', isActive);
    
            return isActive;
        })
    });
  });
define("ghost/utils/notifications", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var Notifications = Ember.ArrayProxy.extend({
        content: Ember.A(),
        timeout: 3000,
        pushObject: function (object) {
            object.typeClass = 'notification-' + object.type;
            // This should be somewhere else.
            if (object.type === 'success') {
                object.typeClass = object.typeClass + " notification-passive";
            }
            this._super(object);
        },
        showError: function (message) {
            this.pushObject({
                type: 'error',
                message: message
            });
        },
        showErrors: function (errors) {
            for (var i = 0; i < errors.length; i += 1) {
                this.showError(errors[i].message || errors[i]);
            }
        },
        showAPIError: function (resp, defaultErrorText) {
            defaultErrorText = defaultErrorText || 'There was a problem on the server, please try again.';
    
            if (resp && resp.jqXHR && resp.jqXHR.responseJSON && resp.jqXHR.responseJSON.error) {
                this.showError(resp.jqXHR.responseJSON.error);
            } else {
                this.showError(defaultErrorText);
            }
        },
        showInfo: function (message) {
            this.pushObject({
                type: 'info',
                message: message
            });
        },
        showSuccess: function (message) {
            this.pushObject({
                type: 'success',
                message: message
            });
        },
        showWarn: function (message) {
            this.pushObject({
                type: 'warn',
                message: message
            });
        }
    });
    
    __exports__["default"] = Notifications;
  });
define("ghost/utils/text-field", 
  [],
  function() {
    "use strict";
    Ember.TextField.reopen({
        attributeBindings: ['autofocus']
    });
  });
define("ghost/utils/word-count", 
  ["exports"],
  function(__exports__) {
    "use strict";
    __exports__["default"] = function (s) {
        s = s.replace(/(^\s*)|(\s*$)/gi, ""); // exclude  start and end white-space
        s = s.replace(/[ ]{2,}/gi, " "); // 2 or more space to 1
        s = s.replace(/\n /, "\n"); // exclude newline with a start spacing
        return s.split(' ').length;
    }
  });
define("ghost/views/editor", 
  ["exports"],
  function(__exports__) {
    "use strict";
    __exports__["default"] = Ember.View.extend({
        scrollPosition: 0  // percentage of scroll position
    });
  });
define("ghost/views/item-view", 
  ["exports"],
  function(__exports__) {
    "use strict";
    __exports__["default"] = Ember.View.extend({
        classNameBindings: ['active'],
    
        active: function () {
            return this.get('childViews.firstObject.active');
        }.property('childViews.firstObject.active')
    });
  });
define("ghost/views/post-item-view", 
  ["ghost/views/item-view","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var itemView = __dependency1__["default"];

    
    var PostItemView = itemView.extend({
        openEditor: function () {
            this.get('controller').send('openEditor', this.get('controller.model'));  // send action to handle transition to editor route
        }.on("doubleClick")
    });
    
    __exports__["default"] = PostItemView;
  });
define("ghost/views/post-settings-menu-view", 
  ["ghost/utils/date-formatting","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    /* global moment */
    var formatDate = __dependency1__.formatDate;

    
    var PostSettingsMenuView = Ember.View.extend({
        templateName: 'post-settings-menu',
        classNames: ['post-settings-menu', 'menu-drop-right', 'overlay'],
        classNameBindings: ['controller.isEditingSettings::hidden'],
        publishedAtBinding: Ember.Binding.oneWay('controller.publishedAt'),
        click: function (event) {
            //Stop click propagation to prevent window closing
            event.stopPropagation();
        },
        datePlaceholder: function () {
            return formatDate(moment());
        }.property('controller.publishedAt')
    });
    
    __exports__["default"] = PostSettingsMenuView;
  });
//# sourceMappingURL=ghost-dev-ember.js.map
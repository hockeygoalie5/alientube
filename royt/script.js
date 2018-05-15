"use strict";

/**
 * Namespace for All RoYT operations.
 * @namespace RoYT
 */
var RoYT;
(function(RoYT) {
    /**
        Application class for RoYT
        @class Application
    */

    var Application = (function() {
        function Application() {
            RoYT.Preferences.initialise();
            // Load language files.
            Application.localisationManager = new RoYT.LocalisationManager(function() {
                // Start observer to detect when a new video is loaded.
                var observer = new MutationObserver(this.youtubeMutationObserver);
                var config = {
                    attributes: true,
                    childList: true,
                    characterData: true,
                    subtree: true
                };
                observer.observe(Application.getYouTubeSection("page"), config);
                // Start a new comment section.
                this.currentVideoIdentifier = Application.getCurrentVideoId();
                if (RoYT.Utilities.isVideoPage) {
                    Application.commentSection = new RoYT.CommentSection(this.currentVideoIdentifier);
                }
            }.bind(this));
        }
        /**
         * Get requested section of a YouTube page, with consideration to the currently used layout.
         * @param section The section to retrieve.
         * @returns Element of requested section or null
         */
         Application.getYouTubeSection = function(section) {
            var selector;
            if(Utilities.useOldYouTubeLayout()) {
                switch(section) {
                    default:
                        return null;
                    case "page":
                        selector = "#content";
                        break;
                    case "commentsContainer":
                        selector = "#watch7-content";
                        break;
                    case "serviceCommentsContainer":
                        selector = "#watch-discussion";
                        break;
                    case "actionsContainer":
                        selector = "#watch7-user-header";
                        break;
                }
            } else {
                switch(section) {
                    default:
                        return null;
                    case "page":
                        selector = "ytd-app";
                        break;
                    case "commentsContainer":
                        selector = "ytd-comments#comments.style-scope.ytd-watch";
                        break;
                    case "serviceCommentsContainer":
                        selector = "ytd-item-section-renderer.style-scope.ytd-comments";
                        break;
                    case "actionsContainer":
                        selector = "div#owner-container.style-scope.ytd-video-owner-renderer";
                        break;
                }
            }
            return document.querySelector(selector);
         }

        /**
         * Mutation Observer for monitoring for whenver the user changes to a new "page" on YouTube
         * @param mutations A collection of mutation records
         * @private
         */
        Application.prototype.youtubeMutationObserver = function(mutations) {
            var reportedVideoId = Application.getCurrentVideoId();
            if (reportedVideoId !== this.currentVideoIdentifier || !document.getElementById("royt")) {
                this.currentVideoIdentifier = reportedVideoId;
                if (RoYT.Utilities.isVideoPage) {
                    Application.commentSection = new RoYT.CommentSection(this.currentVideoIdentifier);
                }
            }
        };
        /**
         * Get the current video identifier of the window.
         * @returns video identifier.
         */
        Application.getCurrentVideoId = function() {
            if (window.location.search.length > 0) {
                var s = window.location.search.substring(1);
                var requestObjects = s.split('&');
                for (var i = 0, len = requestObjects.length; i < len; i += 1) {
                    var obj = requestObjects[i].split('=');
                    if (obj[0] === "v") {
                        return obj[1];
                    }
                }
            }
            return null;
        };
        /**
         * Get a Reddit-style "x time ago" Timestamp from a unix epoch time.
         * @param epochTime Epoch timestamp to calculate from.
         * @returns A string with a human readable time.
         */
        Application.getHumanReadableTimestamp = function(epochTime, localisationString) {
            if (localisationString === void 0) {
                localisationString = "timestamp_format";
            }
            var secs = Math.floor(((new Date()).getTime() / 1000) - epochTime);
            secs = Math.abs(secs);
            var timeUnits = {
                Year: Math.floor(secs / 60 / 60 / 24 / 365.27),
                Month: Math.floor(secs / 60 / 60 / 24 / 30),
                Day: Math.floor(secs / 60 / 60 / 24),
                Hour: Math.floor(secs / 60 / 60),
                Minute: Math.floor(secs / 60),
                Second: secs,
            };
            /* Retrieve the most relevant number by retrieving the first one that is "1" or more.
            Decide if it is plural and retrieve the correct localisation */
            for (var timeUnit in timeUnits) {
                if (timeUnits.hasOwnProperty(timeUnit) && timeUnits[timeUnit] >= 1) {
                    return Application.localisationManager.get(localisationString, [
                        timeUnits[timeUnit],
                        Application.localisationManager.getWithLocalisedPluralisation("timestamp_format_" + timeUnit.toLowerCase(), timeUnits[timeUnit])
                    ]);
                }
            }
            return Application.localisationManager.get(localisationString, [
                "0",
                Application.localisationManager.getWithLocalisedPluralisation('timestamp_format_second', 0)
            ]);
        };
        /**
         * Get the path to a ressource in the RoYT folder.
         * @param path Filename to the ressource.
         * @returns Ressource path (moz-extension://)
         */
        Application.getExtensionRessourcePath = function(path) {
            return browser.extension.getURL(path);
        };
        /**
         * Get the HTML templates for the extension
         * @param callback A callback to be called when the extension templates has been loaded.
         */
        Application.getExtensionTemplates = function(callback) {
            var xobj = new XMLHttpRequest();
            xobj.overrideMimeType("text/html");
            xobj.open("GET", Application.getExtensionRessourcePath("/royt/templates.html"), true);
            xobj.onreadystatechange = function() {
                if (xobj.readyState == 4 && xobj.status == "200") {
                    var template = document.createElement("div");
                    var handlebarHTML = Handlebars.compile(xobj.responseText);
                    // I have no idea why, but parseHTML returns empty if I don't prepend and empty div.
                    template.appendChild(RoYT.Utilities.parseHTML("<div></div>" + handlebarHTML()));
                    if (callback) {
                        callback(template);
                    }
                }
            };
            xobj.send(null);
        };
        /**
         * Get the current version of the extension.
         * @public
         */
        Application.version = function() {
            var version = browser.runtime.getManifest().version;
            return version;
        };
        /**
         * Get an element from the template collection.
         * @param templateCollection The template collection to use.
         * @param id The id of the element you want to retreive.
         * @returns DOM node of a template section.
         */
        Application.getExtensionTemplateItem = function(templateCollection, id) {
            return templateCollection.querySelector("#" + id).content.cloneNode(true);
        };
        return Application;
    })();
    RoYT.Application = Application;

    /**
     * HttpRequest interface across Browsers.
     * @class HttpRequest
     * @param url URL to make the request to.
     * @param type Type of request to make (GET or POST)
     * @param callback Callback handler for the event when loaded.
     * @param [postdata] Key-Value object containing POST data.
     */
    var HttpRequest = (function() {
        function HttpRequest(url, type, callback, postData, errorHandler) {
            var xhr = new XMLHttpRequest();
            xhr.open(RequestType[type], url, true);
            xhr.withCredentials = true;
            if (type === RequestType.POST) {
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            }
            xhr.onerror = function(e) {
                if (errorHandler)
                    errorHandler(xhr.status);
            }.bind(this);
            xhr.onload = function() {
                if (HttpRequest.acceptableResponseTypes.indexOf(xhr.status) !== -1) {
                    /* This is an acceptable response, we can now call the callback and end successfuly. */
                    if (callback) {
                        callback(xhr.responseText);
                    }
                } else {
                    /* There was an error */
                    if (errorHandler)
                        errorHandler(xhr.status);
                }
            }.bind(this);
            /* Convert the post data array to a query string. */
            if (type === RequestType.POST) {
                var query = [];
                for (var key in postData) {
                    query.push(encodeURIComponent(key) + '=' + encodeURIComponent(postData[key]));
                }
                xhr.send(query.join('&'));
            } else {
                xhr.send();
            }
        }
        /**
         * Generate a UUID 4 sequence.
         * @returns A UUID 4 sequence as string.
         * @private
         */
        HttpRequest.generateUUID = function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0,
                    v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };
        HttpRequest.acceptableResponseTypes = [200, 201, 202, 301, 302, 303, 0];
        return HttpRequest;
    })();
    RoYT.HttpRequest = HttpRequest;
    (function(RequestType) {
        RequestType[RequestType["GET"] = 0] = "GET";
        RequestType[RequestType["POST"] = 1] = "POST";
    })(RoYT.RequestType || (RoYT.RequestType = {}));
    var RequestType = RoYT.RequestType;

    var Utilities = (function() {
        function Utilities() {}
        /**
         * Determine a reddit post is more than 6 months old, and thereby in preserved status.
         * @param this The unix epoch time of the post.
         * @returns Boolean saying whether the post is preserved or not.
         */
        Utilities.isRedditPreservedPost = function(post) {
            if (!post) {
                return false;
            }
            var currentEpochTime = ((new Date()).getTime() / 1000);
            return ((currentEpochTime - post.created_utc) >= 15552000);
        };
        /**
            Determine whether the current url of the tab is a YouTube video page.
        */
        Utilities.isVideoPage = function() {
            return (window.location.pathname === "/watch" || document.querySelector("meta[og:type]").getAttribute("content") === "video");
        };

        /**
            Determine whether the user is using the old youtube layout.
        */
        Utilities.useOldYouTubeLayout = function() {
            return !!(document.getElementById("watch7-content"));
        }

        /**
         * parseHTML Parses a string of HTML into a DOM element and removes body, style, script, head, title, and iframe tags.
         * @param aString The HTML string to parse.
         * @returns div Element containing nodes parsed from aString
         */
        Utilities.parseHTML = function(aString) {
            var parser = new DOMParser();
            var element = parser.parseFromString(aString, "text/html").body;

            var div = document.createElement("div");
            while (element.firstChild) {
                div.appendChild(element.firstChild);
            }

            var bodies = div.getElementsByTagName('body');
            for (var i = 0, ii = bodies.length; i < ii; i++) {
                bodies[i].parentNode.removeChild(bodies[i]);
            }

            var styles = div.getElementsByTagName('style');
            for (var i = 0, ii = bodies.length; i < ii; i++) {
                styles[i].parentNode.removeChild(styles[i]);
            }

            var heads = element.getElementsByTagName('head');
            for (var i = 0, ii = bodies.length; i < ii; i++) {
                heads[i].parentNode.removeChild(heads[i]);
            }

            var scripts = div.getElementsByTagName('script');
            for (var i = 0, ii = bodies.length; i < ii; i++) {
                scripts[i].parentNode.removeChild(scripts[i]);
            }

            var titles = div.getElementsByTagName('title');
            for (var i = 0, ii = bodies.length; i < ii; i++) {
                titles[i].parentNode.removeChild(titles[i]);
            }

            var iframes = div.getElementsByTagName('iframe');
            for (var i = 0, ii = bodies.length; i < ii; i++) {
                iframes[i].parentNode.removeChild(iframes[i]);
            }

            return div;
        };

        return Utilities;
    })();
    RoYT.Utilities = Utilities;

    /**
     * Manages the Preferences across browsers.
     * @class Preferences
     */

    var Preferences = (function() {
        function Preferences() {}
        /**
         * Load the preferences from the browser.
         * @param [callback] Callback for when the preferences has been loaded.
         * @constructor
         */
        Preferences.initialise = function() {
            Preferences.preferenceCache = {
                "hiddenPostScoreThreshold": -1,
                "hiddenCommentScoreThreshold": -1,
                "defaultDisplayAction": "royt",
                "channelDisplayActions": {},
                "showGooglePlusWhenNoPosts": false,
                "showGooglePlusButton": false,
                "excludedSubredditsSelectedByUser": [],
                "threadSortType": "confidence",
                "redditUserIdentifierHash": ""
            };

            function onError(error) {
                console.error('${error}');
            }

            function loadCache(result) {
                Preferences.preferenceCache["hiddenPostScoreThreshold"] = result.hiddenPostScoreThreshold || -1;
                Preferences.preferenceCache["hiddenCommentScoreThreshold"] = result.hiddenCommentScoreThreshold || -1;

                Preferences.preferenceCache["defaultDisplayAction"] = result.defaultDisplayAction || "royt";
                Preferences.preferenceCache["channelDisplayActions"] = result.channelDisplayActions || "{}";

                Preferences.preferenceCache["showGooglePlusWhenNoPosts"] = result.showGooglePlusWhenNoPosts || false;
                Preferences.preferenceCache["showGooglePlusButton"] = result.showGooglePlusButton || false;

                Preferences.preferenceCache["excludedSubredditsSelectedByUser"] = result.excludedSubreddits || "[]";

                Preferences.preferenceCache["threadSortType"] = result.threadSortType || "confidence";

                Preferences.preferenceCache["redditUserIdentifierHash"] = result.redditUserIdentifierHash || "";
            }

            var getting = browser.storage.sync.get(null);
            getting.then(loadCache, onError);
        };
        /**
         * Retrieve a value from preferences, or the default value for that key.
         * @private
         * @warning Should not be used on its own, use getString, getNumber, etc, some browsers will not give the value in the correct type.
         * @param key The key of the preference item.
         * @returns An object for the key as stored by the browser.
         */
        Preferences.get = function(key) {
            return Preferences.preferenceCache[key];
        };
        /**
         * Insert or edit an item into preferences.
         * @param key The key of the preference item you wish to add or edit.
         * @param value The value you wish to insert.
         */
        Preferences.set = function(key, value) {
            Preferences.preferenceCache[key] = value;
            browser.storage.sync.set({
                key: value
            });
        };
        return Preferences;
    })();
    RoYT.Preferences = Preferences;

    /**
     * Starts a new instance of the RoYT comment section and adds it to DOM.
     * @class CommentSection
     * @param currentVideoIdentifier YouTube Video query identifier.
     */

    var CommentSection = (function() {
        function CommentSection(currentVideoIdentifier) {
            this.threadCollection = new Array();
            this.storedTabCollection = new Array();
            // Make sure video identifier is not null. If it is null we are not on a video page so we will just time out.
            if (currentVideoIdentifier) {
                // Load the html5 template file from disk and wait for it to load.
                var templateLink = document.createElement("link");
                templateLink.id = "roytTemplate";
                RoYT.Application.getExtensionTemplates(function(templateContainer) {
                    this.template = templateContainer;
                    // Set Loading Screen
                    var loadingScreen = new RoYT.LoadingScreen(this, RoYT.LoadingState.LOADING, RoYT.Application.localisationManager.get("loading_search_message"));
                    this.set(loadingScreen.HTMLElement);
                    // Open a search request to Reddit for the video identfiier
                    var videoSearchString = this.getVideoSearchString(currentVideoIdentifier);
                    new RoYT.Reddit.Request("https://api.reddit.com/search.json?syntax=cloudsearch&q=" + videoSearchString, RoYT.RequestType.GET, function(results) {
                        // There are a number of ways the Reddit API can arbitrarily explode, here are some of them.
                        if (results === {} || results.kind !== 'Listing' || results.data.children.length === 0) {
                            this.returnNoResults();
                        } else {
                            var searchResults = results.data.children;
                            var finalResultCollection = [];
                            /* Filter out Reddit threads that do not lead to the video. Additionally, remove ones that have passed the 6
                            month threshold for Reddit posts and are in preserved mode, but does not have any comments. */
                            searchResults.forEach(function(result) {
                                if (CommentSection.validateItemFromResultSet(result.data, currentVideoIdentifier)) {
                                    finalResultCollection.push(result.data);
                                }
                            });
                            var preferredPost, preferredSubreddit;
                            if (finalResultCollection.length > 0) {
                                // Sort threads into array groups by what subreddit they are in.
                                var getExcludedSubreddits = RoYT.Preferences.get("excludedSubredditsSelectedByUser");
                                var sortedResultCollection = {};
                                finalResultCollection.forEach(function(thread) {
                                    if (getExcludedSubreddits.indexOf(thread.subreddit.toLowerCase()) !== -1)
                                        return;
                                    if (thread.score < RoYT.Preferences.get("hiddenPostScoreThreshold"))
                                        return;
                                    if (!sortedResultCollection.hasOwnProperty(thread.subreddit))
                                        sortedResultCollection[thread.subreddit] = [];
                                    sortedResultCollection[thread.subreddit].push(thread);
                                });
                                // Sort posts into collections by what subreddit they appear in.
                                this.threadCollection = [];
                                for (var subreddit in sortedResultCollection) {
                                    if (sortedResultCollection.hasOwnProperty(subreddit)) {
                                        this.threadCollection.push(sortedResultCollection[subreddit].reduce(function(a, b) {
                                            return ((this.getConfidenceForRedditThread(b) - this.getConfidenceForRedditThread(a)) || b.id === preferredPost) ? a : b;
                                        }.bind(this)));
                                    }
                                }
                                if (this.threadCollection.length > 0) {
                                    // Sort subreddits so there is only one post per subreddit, and that any subreddit or post that is linked to in the description appears first.
                                    this.threadCollection.sort(function(a, b) {
                                        return b.score > a.score;
                                    }.bind(this));
                                    for (var i = 0, len = this.threadCollection.length; i < len; i += 1) {
                                        if (this.threadCollection[i].subreddit === preferredSubreddit) {
                                            var threadDataForFirstTab = this.threadCollection[i];
                                            this.threadCollection.splice(i, 1);
                                            this.threadCollection.splice(0, 0, threadDataForFirstTab);
                                            break;
                                        }
                                    }
                                    // Generate tabs.
                                    var tabContainerTemplate = RoYT.Application.getExtensionTemplateItem(this.template, "tabcontainer");
                                    var tabContainer = tabContainerTemplate.querySelector("#royt_tabcontainer");
                                    this.insertTabsIntoDocument(tabContainer, 0);
                                    window.addEventListener("resize", this.updateTabsToFitToBoundingContainer.bind(this), false);
                                    var ApplicationContainer = this.set(tabContainer);
                                    ApplicationContainer.appendChild(tabContainerTemplate.querySelector("#royt_comments"));
                                    // If the selected post is prioritised, marked it as such
                                    if (this.threadCollection[0].id === preferredPost || this.threadCollection[0].subreddit === preferredSubreddit) {
                                        this.threadCollection[0].official = true;
                                    }
                                    // Load the first tab.
                                    this.downloadThread(this.threadCollection[0]);
                                    return;
                                }
                            }
                            this.returnNoResults();
                        }
                    }.bind(this), null, loadingScreen);
                }.bind(this));
            }
        }
        /**
         * Display a tab in the comment section, if it is locally cached, use that, if not, download it.
         * @param threadData Data about the thread to download from a Reddit search page.
         * @private
         */
        CommentSection.prototype.showTab = function(threadData) {
            var getTabById = this.storedTabCollection.filter(function(x) {
                return x[0].data.children[0].data.name === threadData.name;
            });
            if (getTabById.length > 0) {
                new RoYT.CommentThread(getTabById[0], this);
            } else {
                this.downloadThread(threadData);
            }
        };
        /**
         * Download a thread from Reddit.
         * @param threadData Data about the thread to download from a Reddit search page.
         */
        CommentSection.prototype.downloadThread = function(threadData) {
            var loadingScreen = new RoYT.LoadingScreen(this, RoYT.LoadingState.LOADING, RoYT.Application.localisationManager.get("loading_post_message"));
            var roytCommentContainer = document.getElementById("royt_comments");
            while (roytCommentContainer.firstChild) {
                roytCommentContainer.removeChild(roytCommentContainer.firstChild);
            }
            roytCommentContainer.appendChild(loadingScreen.HTMLElement);
            var requestUrl = "https://api.reddit.com/r/" + threadData.subreddit + "/comments/" + threadData.id + ".json?sort=" + RoYT.Preferences.get("threadSortType");
            new RoYT.Reddit.Request(requestUrl, RoYT.RequestType.GET, function(responseObject) {
                // Remove previous tab from memory if preference is unchecked; will require a download on tab switch.
                responseObject[0].data.children[0].data.official = threadData.official;
                new RoYT.CommentThread(responseObject, this);
                this.storedTabCollection.push(responseObject);
            }.bind(this), null, loadingScreen);
        };
        /**
         * Sets the contents of the comment section.
         * @param contents HTML DOM node or element to use.
         */
        CommentSection.prototype.set = function(contents) {
            var redditContainer = document.createElement("section");
            redditContainer.id = "royt";
            var commentsContainer = Application.getYouTubeSection("commentsContainer");
            var serviceCommentsContainer = Application.getYouTubeSection("serviceCommentsContainer");

            var previousRedditInstance = document.getElementById("royt");
            if (previousRedditInstance) {
                commentsContainer.removeChild(previousRedditInstance);
            }

            if (serviceCommentsContainer) {
                /* Add the "switch to Reddit" button in the google+ comment section */
                var redditButton = document.getElementById("royt_switchtoreddit");
                if (!redditButton) {
                    var redditButtonTemplate = RoYT.Application.getExtensionTemplateItem(this.template, "switchtoreddit");
                    redditButton = redditButtonTemplate.querySelector("#royt_switchtoreddit");
                    redditButton.addEventListener("click", this.onRedditClick, true);
                    serviceCommentsContainer.parentNode.insertBefore(redditButton, serviceCommentsContainer);
                }
                if (this.getDisplayActionForCurrentChannel() === "gplus") {
                    redditContainer.style.display = "none";
                    redditButton.style.display = "block";
                } else {
                    serviceCommentsContainer.style.display = "none";
                }
            }
            /* Set the setting for whether or not RoYT should show itself on this YouTube channel */
            var allowOnChannelContainer = document.getElementById("allowOnChannelContainer");
            if (!allowOnChannelContainer) {
                var actionsContainer = Application.getYouTubeSection("actionsContainer");

                var allowOnChannel = RoYT.Application.getExtensionTemplateItem(this.template, "allowonchannel");
                allowOnChannel.children[0].appendChild(document.createTextNode(RoYT.Application.localisationManager.get("options_label_showReddit")));
                var allowOnChannelCheckbox = allowOnChannel.querySelector("#allowonchannel");
                if(this.getDisplayActionForCurrentChannel() === "royt") {
                    allowOnChannelCheckbox.checked = true;
                }
                allowOnChannelCheckbox.addEventListener("change", this.allowOnChannelChange, false);
                actionsContainer.appendChild(allowOnChannel);
            }
            /* Apply style adjustments for new layout */
            if(!Utilities.useOldYouTubeLayout()) {
                redditContainer.classList.add("new-layout");
                allowOnChannelContainer.classList.add("new-layout");
            }
            /* Add RoYT contents */
            redditContainer.appendChild(contents);
            commentsContainer.appendChild(redditContainer);
            return redditContainer;
        };
        /**
            * Validate a Reddit search result set and ensure the link urls go to the correct address.
            * This is done due to the Reddit search result being extremely unrealiable, and providing mismatches.

            * Additionally, remove ones that have passed the 6 month threshold for Reddit posts and are in preserved mode,
            * but does not have any comments.

            * @param itemFromResultSet An object from the reddit search result array.
            * @param currentVideoIdentifier A YouTube video identifier to compare to.
            * @returns A boolean indicating whether the item is actually for the current video.
            * @private
        */
        CommentSection.validateItemFromResultSet = function(itemFromResultSet, currentVideoIdentifier) {
            if (RoYT.Utilities.isRedditPreservedPost(itemFromResultSet) && itemFromResultSet.num_comments < 1) {
                return false;
            }
            if (itemFromResultSet.domain === "youtube.com") {
                // For urls based on the full youtube.com domain, retrieve the value of the "v" query parameter and compare it.
                var urlSearch = itemFromResultSet.url.substring(itemFromResultSet.url.indexOf("?") + 1);
                var requestItems = urlSearch.split('&');
                for (var i = 0, len = requestItems.length; i < len; i += 1) {
                    var requestPair = requestItems[i].split("=");
                    if (requestPair[0] === "v" && requestPair[1] === currentVideoIdentifier) {
                        return true;
                    }
                    if (requestPair[0] === "amp;u") {
                        var component = decodeURIComponent(requestPair[1]);
                        component = component.replace("/watch?", "");
                        var shareRequestItems = component.split('&');
                        for (var j = 0, slen = shareRequestItems.length; j < slen; j += 1) {
                            var shareRequestPair = shareRequestItems[j].split("=");
                            if (shareRequestPair[0] === "v" && shareRequestPair[1] === currentVideoIdentifier) {
                                return true;
                            }
                        }
                    }
                }
            } else if (itemFromResultSet.domain === "youtu.be") {
                // For urls based on the shortened youtu.be domain, retrieve everything the path after the domain and compare it.
                var urlSearch = itemFromResultSet.url.substring(itemFromResultSet.url.lastIndexOf("/") + 1);
                var obj = urlSearch.split('?');
                if (obj[0] === currentVideoIdentifier) {
                    return true;
                }
            }
            return false;
        };
        /**
            * Insert tabs to the document calculating the width of tabs and determine how many you can fit without breaking the
            * bounds of the comment section.

            * @param tabContainer The tab container to operate on.
            * @param [selectTabAtIndex] The tab to be in active / selected status.
        */
        CommentSection.prototype.insertTabsIntoDocument = function(tabContainer, selectTabAtIndex) {
            var overflowContainer = tabContainer.querySelector("#royt_overflow");
            var len = this.threadCollection.length;
            var maxWidth = Application.getYouTubeSection("commentsContainer").offsetWidth - 80;

            var width = (21 + this.threadCollection[0].subreddit.length * 7);
            var i = 0;
            /* Calculate the width of tabs and determine how many you can fit without breaking the bounds of the comment section. */
            if (len > 0) {
                for (i = 0; i < len; i += 1) {
                    width = width + (21 + (this.threadCollection[i].subreddit.length * 7));
                    if (width >= maxWidth) {
                        break;
                    }
                    var tab = document.createElement("button");
                    tab.className = "royt_tab";
                    tab.setAttribute("data-value", this.threadCollection[i].subreddit);
                    var tabLink = document.createElement("a");
                    tabLink.textContent = this.threadCollection[i].subreddit;
                    tabLink.setAttribute("href", "http://reddit.com/r/" + this.threadCollection[i].subreddit);
                    tabLink.setAttribute("target", "_blank");
                    tab.addEventListener("click", this.onSubredditTabClick.bind(this), false);
                    tab.appendChild(tabLink);
                    tabContainer.insertBefore(tab, overflowContainer);
                }
                // We can't fit any more tabs. We will now start populating the overflow menu.
                if (i < len) {
                    overflowContainer.style.display = "block";
                    /* Click handler for the overflow menu button, displays the overflow menu. */
                    overflowContainer.addEventListener("click", function() {
                        var overflowContainerMenu = overflowContainer.querySelector("ul");
                        overflowContainer.classList.add("show");
                    }, false);
                    /* Document body click handler that closes the overflow menu when the user clicks outside of it.
                    by defining event bubbling in the third argument we are preventing clicks on the menu from triggering this event */
                    document.body.addEventListener("click", function() {
                        var overflowContainerMenu = overflowContainer.querySelector("ul");
                        overflowContainer.classList.remove("show");
                    }, true);
                    /* Continue iterating through the items we couldn't fit into tabs and populate the overflow menu. */
                    for (i = i; i < len; i += 1) {
                        var menuItem = document.createElement("li");
                        menuItem.setAttribute("data-value", this.threadCollection[i].subreddit);
                        menuItem.addEventListener("click", this.onSubredditOverflowItemClick.bind(this), false);
                        var itemName = document.createTextNode(this.threadCollection[i].subreddit);
                        menuItem.appendChild(itemName);
                        overflowContainer.children[1].appendChild(menuItem);
                    }
                } else {
                    /* If we didn't need the overflow menu there is no reason to show it. */
                    overflowContainer.style.display = "none";
                }
            } else {
                overflowContainer.style.display = "none";
            }
            // If there is only one thread available the container should be displayed differently.
            if (this.threadCollection[0].subreddit.length === 1) {
                tabContainer.classList.add("single");
            } else {
                tabContainer.classList.remove("single");
            }
            // Set the active tab if provided
            if (selectTabAtIndex != null) {
                var selectedTab = tabContainer.children[selectTabAtIndex];
                selectedTab.classList.add("active");
            }
        };
        /**
         * Set the comment section to the "No Results" page.
         * @private
         */
        CommentSection.prototype.returnNoResults = function() {
            var template = RoYT.Application.getExtensionTemplateItem(this.template, "noposts");
            var message = template.querySelector(".single_line");
            message.textContent = RoYT.Application.localisationManager.get("post_label_noresults");
            /* Set the icon, text, and event listener for the button to switch to the Google+ comments. */
            var googlePlusButton = template.querySelector("#royt_switchtogplus");
            googlePlusButton.addEventListener("click", this.onGooglePlusClick, false);
            var googlePlusContainer = Application.getYouTubeSection("serviceCommentsContainer");
            if (RoYT.Preferences.get("showGooglePlusButton") === false || googlePlusContainer === null) {
                googlePlusButton.style.display = "none";
            }
            this.set(template);
            if (RoYT.Preferences.get("showGooglePlusWhenNoPosts") && googlePlusContainer) {
                googlePlusContainer.style.display = "block";
                document.getElementById("royt").style.display = "none";
                var redditButton = document.getElementById("royt_switchtoreddit");
                if (redditButton) {
                    redditButton.classList.add("noresults");
                }
            }
        };
        /**
         * Switch to the Reddit comment section
         * @param eventObject The event object of the click of the Reddit button.
         * @private
         */
        CommentSection.prototype.onRedditClick = function(eventObject) {
            var googlePlusContainer = Application.getYouTubeSection("serviceCommentsContainer");
            googlePlusContainer.style.display = "none";
            var roytContainer = document.getElementById("royt");
            roytContainer.style.display = "block";
            var redditButton = document.getElementById("royt_switchtoreddit");
            redditButton.style.display = "none";
        };
        /**
         * Switch to the Google+ comment section.
         * @param eventObject The event object of the click of the Google+ button.
         * @private
         */
        CommentSection.prototype.onGooglePlusClick = function(eventObject) {
            var roytContainer = document.getElementById("royt");
            roytContainer.style.display = "none";
            var googlePlusContainer = Application.getYouTubeSection("serviceCommentsContainer");
            googlePlusContainer.style.display = "block";
            var redditButton = document.getElementById("royt_switchtoreddit");
            redditButton.style.display = "block";
        };
        /**
         * Update the tabs to fit the new size of the document
         * @private
         */
        CommentSection.prototype.updateTabsToFitToBoundingContainer = function() {
            /* Only perform the resize operation when we have a new frame to work on by the browser, any animation beyond this will not
            be rendered and is pointless. */
            window.requestAnimationFrame(function() {
                var tabContainer = document.getElementById("royt_tabcontainer");
                if (!tabContainer) {
                    return;
                }
                var overflowContainer = tabContainer.querySelector("#royt_overflow");
                /* Iterate over the tabs until we find the one that is currently selected, and store its value. */
                for (var i = 0, len = tabContainer.children.length; i < len; i += 1) {
                    var tabElement = tabContainer.children[i];
                    if (tabElement.classList.contains("active")) {
                        var currentActiveTabIndex = i;
                        /* Remove all tabs and overflow ites, then render them over again using new size dimensions. */
                        this.clearTabsFromTabContainer();
                        this.insertTabsIntoDocument(tabContainer, currentActiveTabIndex);
                        break;
                    }
                }
            }.bind(this));
        };
        /**
         * Remove all tabs and overflow items from the DOM.
         */
        CommentSection.prototype.clearTabsFromTabContainer = function() {
            var tabContainer = document.getElementById("royt_tabcontainer");
            var overflowContainer = tabContainer.querySelector("#royt_overflow");
            /* Iterate over the tab elements and remove them all. Stopping short off the overflow button. */
            while (tabContainer.firstElementChild) {
                var childElement = tabContainer.firstElementChild;
                if (childElement.classList.contains("royt_tab")) {
                    tabContainer.removeChild(tabContainer.firstElementChild);
                } else {
                    break;
                }
            }
            /* Iterate over the overflow items, removing them all. */
            var overflowListElement = overflowContainer.querySelector("ul");
            while (overflowListElement.firstElementChild) {
                overflowListElement.removeChild(overflowListElement.firstElementChild);
            }
        };
        /**
         * Select the new tab on click and load comment section.
         * @param eventObject the event object of the subreddit tab click.
         * @private
         */
        CommentSection.prototype.onSubredditTabClick = function(eventObject) {
            var tabElementClickedByUser = eventObject.target;
            /* Only continue if the user did not click a tab that is already selected. */
            if (!tabElementClickedByUser.classList.contains("active") && tabElementClickedByUser.tagName === "BUTTON") {
                var tabContainer = document.getElementById("royt_tabcontainer");
                var currentIndexOfNewTab = 0;
                /* Iterate over the tabs to find the currently selected one and remove its selected status */
                for (var i = 0, len = tabContainer.children.length; i < len; i += 1) {
                    var tabElement = tabContainer.children[i];
                    if (tabElement === tabElementClickedByUser)
                        currentIndexOfNewTab = i;
                    tabElement.classList.remove("active");
                }
                /* Mark the new tab as selected and start downloading it. */
                tabElementClickedByUser.classList.add("active");
                this.showTab(this.threadCollection[currentIndexOfNewTab]);
            }
        };
        /**
         * Create a new tab and select it when an overflow menu item is clicked, load the comment section for it as well.
         * @param eventObject the event object of the subreddit menu item click.
         * @private
         */
        CommentSection.prototype.onSubredditOverflowItemClick = function(eventObject) {
            var tabContainer = document.getElementById("royt_tabcontainer");
            var overflowItemClickedByUser = eventObject.target;
            var currentIndexOfNewTab = 0;
            /* Iterate over the current overflow items to find the index of the one that was just clicked. */
            var listOfExistingOverflowItems = overflowItemClickedByUser.parentNode;
            for (var i = 0, len = listOfExistingOverflowItems.children.length; i < len; i += 1) {
                var overflowElement = listOfExistingOverflowItems.children[i];
                if (overflowElement === overflowItemClickedByUser)
                    currentIndexOfNewTab = i;
            }
            /* Derive the total index of the item in the subreddit list from the number we just calculated added
             with the total length of the visible non overflow tabs */
            currentIndexOfNewTab = (tabContainer.children.length) + currentIndexOfNewTab - 1;
            var threadDataForNewTab = this.threadCollection[currentIndexOfNewTab];
            /* Move the new item frontmost in the array so it will be the first tab, and force a re-render of the tab control. */
            this.threadCollection.splice(currentIndexOfNewTab, 1);
            this.threadCollection.splice(0, 0, threadDataForNewTab);
            this.clearTabsFromTabContainer();
            this.insertTabsIntoDocument(tabContainer, 0);
            /* Start downloading the new tab. */
            this.showTab(this.threadCollection[0]);
            eventObject.stopPropagation();
        };
        /**
         * Triggered when the user has changed the value of the "Allow on this channel" checkbox.
         * @param eventObject the event object of the checkbox value change.
         * @private
         */
        CommentSection.prototype.allowOnChannelChange = function(eventObject) {
            var allowedOnChannel = eventObject.target.checked;
            var channelId = Application.getYouTubeSection("actionsContainer").firstChild.innerText;
            var channelDisplayActions = RoYT.Preferences.get("channelDisplayActions");
            channelDisplayActions[channelId] = allowedOnChannel ? "royt" : "gplus";
            RoYT.Preferences.set("channelDisplayActions", channelDisplayActions);
        };
        /**
         * Get the display action of the current channel.
         * @private
         */
        CommentSection.prototype.getDisplayActionForCurrentChannel = function() {
            var channelId = Application.getYouTubeSection("actionsContainer").firstChild.innerText;

            var displayActionByUser = RoYT.Preferences.get("channelDisplayActions")[channelId];
            if (displayActionByUser) {
                return displayActionByUser;
            }
            return RoYT.Preferences.get("defaultDisplayAction");
        };
        /**
         * Get the confidence vote of a thread using Reddit's 'hot' sorting algorithm.
         * @param thread An object from the Reddit API containing thread information.
         * @private
         */
        CommentSection.prototype.getConfidenceForRedditThread = function(thread) {
            var order = Math.log(Math.max(Math.abs(thread.score), 1));
            var sign;
            if (thread.score > 0) {
                sign = 1;
            } else if (thread.score < 0) {
                sign = -1;
            } else {
                sign = 0;
            }
            var seconds = Math.floor(((new Date()).getTime() / 1000) - thread.created_utc) - 1134028003;
            return Math.round((order + sign * seconds / 4500) * 10000000) / 10000000;
        };
        /**
         * Get the Reddit search string to perform.
         * @param videoID The YouTube video id to make a search for.
         * @returns Search string to find video
         * @private
         */
        CommentSection.prototype.getVideoSearchString = function(videoID) {
            return encodeURI("(url:" + videoID + ") AND (site:youtube.com OR site:youtu.be)");
        };
        return CommentSection;
    })();
    RoYT.CommentSection = CommentSection;

    /**
     * Creates a new instance of a Comment Thread and adds it to DOM.
     * @class CommentThread
     * @param threadData JavaScript object containing all information about the Reddit thread.
     * @param commentSection The comment section object the thread exists within.
     */
    var CommentThread = (function() {
        function CommentThread(threadData, commentSection) {
            this.sortingTypes = [
                "confidence",
                "top",
                "new",
                "controversial",
                "old",
                "qa"
            ];
            this.children = new Array();
            this.commentSection = commentSection;
            this.threadInformation = threadData[0].data.children[0].data;
            this.commentData = threadData[1].data.children;
            RoYT.Preferences.set("redditUserIdentifierHash", threadData[0].data.modhash);
            this.postIsInPreservedMode = RoYT.Utilities.isRedditPreservedPost(this.threadInformation);
            var template = RoYT.Application.getExtensionTemplateItem(this.commentSection.template, "threadcontainer");
            this.threadContainer = template.querySelector("#royt_comments");
            if (threadData[0].data.modhash.length > 0) {
                this.commentSection.userIsSignedIn = true;
                if (!threadData[0].data.modhash || !RoYT.Preferences.get("username")) {
                    new RoYT.Reddit.RetreiveUsernameRequest();
                }
            } else {
                this.commentSection.userIsSignedIn = false;
                RoYT.Preferences.set("username", "");
                this.threadContainer.classList.add("signedout");
            }
            var title = this.threadContainer.querySelector(".title");
            title.textContent = this.threadInformation.title;
            title.setAttribute("href", "http://reddit.com" + this.threadInformation.permalink);
            /* Set the username of the author and link to them */
            var username = this.threadContainer.querySelector(".royt_author");
            username.textContent = this.threadInformation.author;
            username.setAttribute("href", "http://www.reddit.com/u/" + this.threadInformation.author);
            username.setAttribute("data-username", this.threadInformation.author);
            if (this.threadInformation.distinguished === "admin") {
                username.setAttribute("data-reddit-admin", "true");
            } else if (this.threadInformation.distinguished === "moderator") {
                username.setAttribute("data-reddit-mod", "true");
            }
            /* Add flair to the user */
            var flair = this.threadContainer.querySelector(".royt_flair");
            if (this.threadInformation.author_flair_text) {
                flair.textContent = this.threadInformation.author_flair_text;
            } else {
                flair.style.display = "none";
            }
            /* Set the NSFW label on the post if applicable */
            if (this.threadInformation.over_18) {
                var optionsElement = this.threadContainer.querySelector(".options");
                var nsfwElement = document.createElement("acronym");
                nsfwElement.classList.add("nsfw");
                nsfwElement.setAttribute("title", RoYT.Application.localisationManager.get("post_badge_NSFW_message"));
                nsfwElement.textContent = RoYT.Application.localisationManager.get("post_badge_NSFW");
                optionsElement.insertBefore(nsfwElement, optionsElement.firstChild);
            }
            /* Set the gild (how many times the user has been given gold for this post) if any */
            if (this.threadInformation.gilded) {
                var gildCountElement = this.threadContainer.querySelector(".royt_gilded");
                gildCountElement.setAttribute("data-count", this.threadInformation.gilded);
            }
            /* Set the the thread posted time */
            var timestamp = this.threadContainer.querySelector(".royt_timestamp");
            timestamp.textContent = RoYT.Application.getHumanReadableTimestamp(this.threadInformation.created_utc);
            timestamp.setAttribute("timestamp", new Date(this.threadInformation.created_utc).toISOString());
            /* Set the localised text for "by {username}" */
            var submittedByUsernameText = this.threadContainer.querySelector(".templateSubmittedByUsernameText");
            submittedByUsernameText.textContent = RoYT.Application.localisationManager.get("post_submitted_preposition");
            /* Set the text for the comments button  */
            var openNewCommentBox = this.threadContainer.querySelector(".commentTo");
            openNewCommentBox.textContent = this.threadInformation.num_comments + " " + RoYT.Application.localisationManager.get("post_button_comments").toLowerCase();
            openNewCommentBox.addEventListener("click", this.onCommentButtonClick.bind(this), false);
            /* Set the button text and the event handler for the "save" button */
            var saveItemToRedditList = this.threadContainer.querySelector(".save");
            if (this.threadInformation.saved) {
                saveItemToRedditList.textContent = RoYT.Application.localisationManager.get("post_button_unsave");
                saveItemToRedditList.setAttribute("saved", "true");
            } else {
                saveItemToRedditList.textContent = RoYT.Application.localisationManager.get("post_button_save");
            }
            saveItemToRedditList.addEventListener("click", this.onSaveButtonClick.bind(this), false);
            /* Set the button text and the event handler for the "refresh" button */
            var refreshCommentThread = this.threadContainer.querySelector(".refresh");
            refreshCommentThread.addEventListener("click", function() {
                this.commentSection.threadCollection.forEach(function(item) {
                    if (item.id === this.threadInformation.id) {
                        this.commentSection.downloadThread(item);
                    }
                });
            }, false);
            refreshCommentThread.textContent = RoYT.Application.localisationManager.get("post_button_refresh");
            /* Set the button text and the link for the "give gold" button */
            var giveGoldToUser = this.threadContainer.querySelector(".giveGold");
            giveGoldToUser.setAttribute("href", "http://www.reddit.com/gold?goldtype=gift&months=1&thing=" + this.threadInformation.name);
            giveGoldToUser.textContent = RoYT.Application.localisationManager.get("post_button_gold");
            /* Set the button text and the event handler for the "report post" button */
            var reportToAdministrators = this.threadContainer.querySelector(".report");
            reportToAdministrators.textContent = RoYT.Application.localisationManager.get("post_button_report");
            reportToAdministrators.addEventListener("click", this.onReportButtonClicked.bind(this), false);
            /* Set the button text and event handler for the sort selector. */
            var sortController = this.threadContainer.querySelector(".sort");
            for (var sortIndex = 0, sortLength = this.sortingTypes.length; sortIndex < sortLength; sortIndex += 1) {
                sortController.children[sortIndex].textContent = RoYT.Application.localisationManager.get("post_sort_" + this.sortingTypes[sortIndex]);
            }
            sortController.selectedIndex = this.sortingTypes.indexOf(RoYT.Preferences.get("threadSortType"));
            sortController.addEventListener("change", function() {
                RoYT.Preferences.set("threadSortType", sortController.children[sortController.selectedIndex].getAttribute("value"));
                this.commentSection.threadCollection.forEach(function(item) {
                    if (item.id === this.threadInformation.id) {
                        this.commentSection.downloadThread(item);
                    }
                });
            }, false);
            /* Set the state of the voting buttons */
            var voteController = this.threadContainer.querySelector(".vote");
            voteController.querySelector(".score").textContent = this.threadInformation.score;
            voteController.querySelector(".arrow.up").addEventListener("click", this.onUpvoteControllerClick.bind(this), false);
            voteController.querySelector(".arrow.down").addEventListener("click", this.onDownvoteControllerClick.bind(this), false);
            if (this.threadInformation.likes === true) {
                voteController.classList.add("liked");
            } else if (this.threadInformation.likes === false) {
                voteController.classList.add("disliked");
            }
            /* Set the icon, text, and event listener for the button to switch to the Google+ comments. */
            var googlePlusButton = this.threadContainer.querySelector("#royt_switchtogplus");
            googlePlusButton.addEventListener("click", this.onGooglePlusClick, false);
            var googlePlusContainer = Application.getYouTubeSection("serviceCommentsContainer");
            if (RoYT.Preferences.get("showGooglePlusButton") === false || googlePlusContainer === null) {
                googlePlusButton.style.display = "none";
            }
            /* Mark the post as preserved if applicable */
            if (this.postIsInPreservedMode) {
                this.threadContainer.classList.add("preserved");
            } else {
                if (this.commentSection.userIsSignedIn) {
                    new RoYT.CommentField(this);
                }
            }
            /* If this post is prioritised (official) mark it as such in the header */
            if (this.threadInformation.official) {
                var officialLabel = this.threadContainer.querySelector(".royt_official");
                officialLabel.textContent = RoYT.Application.localisationManager.get("post_message_official");
                officialLabel.style.display = "inline-block";
            }
            /* Start iterating the top level comments in the comment section */
            this.commentData.forEach(function(commentObject) {
                if (commentObject.kind === "more") {
                    var readmore = new RoYT.LoadMore(commentObject.data, this, this);
                    this.children.push(readmore);
                    this.threadContainer.appendChild(readmore.representedHTMLElement);
                } else {
                    var comment = new RoYT.Comment(commentObject.data, this);
                    this.children.push(comment);
                    this.threadContainer.appendChild(comment.representedHTMLElement);
                }
            }.bind(this));
            this.set(this.threadContainer);
        }
        /**
         * Sets the contents of the comment thread.
         * @param contents HTML DOM node or element to use.
         */
        CommentThread.prototype.set = function(contents) {
            var oldThread = document.getElementById("royt_comments");
            var royt = document.getElementById("royt");
            if (royt && oldThread) {
                royt.removeChild(oldThread);
            }
            royt.appendChild(contents);
        };
        /**
         * Either save a post or unsave an already saved post.
         * @param eventObject The event object for the click of the save button.
         * @private
         */
        CommentThread.prototype.onSaveButtonClick = function(eventObject) {
            var saveButton = eventObject.target;
            var savedType = saveButton.getAttribute("saved") ? RoYT.Reddit.SaveType.UNSAVE : RoYT.Reddit.SaveType.SAVE;
            new RoYT.Reddit.SaveRequest(this.threadInformation.name, savedType, function() {
                if (savedType === RoYT.Reddit.SaveType.SAVE) {
                    saveButton.setAttribute("saved", "true");
                    saveButton.textContent = RoYT.Application.localisationManager.get("post_button_unsave");
                } else {
                    saveButton.removeAttribute("saved");
                    saveButton.textContent = RoYT.Application.localisationManager.get("post_button_save");
                }
            });
        };
        /**
         * Show the report post form.
         * @param eventObject The event object for the click of the report button.
         * @private
         */
        CommentThread.prototype.onReportButtonClicked = function(eventObject) {
            new RoYT.Reddit.Report(this.threadInformation.name, this, true);
        };
        /**
         * Handle the click of the Google+ Button to change to the Google+ comments.
         * @private
         */
        CommentThread.prototype.onGooglePlusClick = function(eventObject) {
            var roytContainer = document.getElementById("royt");
            roytContainer.style.display = "none";
            var googlePlusContainer = Application.getYouTubeSection("serviceCommentsContainer");
            googlePlusContainer.style.display = "block";
            var redditButton = document.getElementById("royt_switchtoreddit");
            redditButton.style.display = "block";
            /* Terrible hack to force Google+ to reload the comments by making it think the user has resized the window.
               Having to do this makes me sad.  */
            document.body.style.width = document.body.offsetWidth + "px";
            window.getComputedStyle(document.body, null);
            document.body.style.width = "auto";
            window.getComputedStyle(document.body, null);
        };
        /**
         * Upvote a post or remove an existing upvote.
         * @param eventObject The event object for the click of the upvote button.
         * @private
         */
        CommentThread.prototype.onUpvoteControllerClick = function(eventObject) {
            var upvoteController = eventObject.target;
            var voteController = upvoteController.parentNode;
            var scoreValue = voteController.querySelector(".score");
            if (this.threadInformation.likes === true) {
                /* The user already likes this post, so they wish to remove their current like. */
                voteController.classList.remove("liked");
                this.threadInformation.likes = null;
                this.threadInformation.score = this.threadInformation.score - 1;
                scoreValue.textContent = this.threadInformation.score;
                new RoYT.Reddit.VoteRequest(this.threadInformation.name, RoYT.Reddit.Vote.REMOVE);
            } else {
                /* The user wishes to like this post */
                if (this.threadInformation.likes === false) {
                    /* The user has previously disliked this post, we need to remove that status and add 2 to the score instead of 1*/
                    voteController.classList.remove("disliked");
                    this.threadInformation.score = this.threadInformation.score + 2;
                } else {
                    this.threadInformation.score = this.threadInformation.score + 1;
                }
                voteController.classList.add("liked");
                this.threadInformation.likes = true;
                scoreValue.textContent = this.threadInformation.score;
                new RoYT.Reddit.VoteRequest(this.threadInformation.name, RoYT.Reddit.Vote.UPVOTE);
            }
        };
        /**
         * Downvote a comment or remove an existing downvote
         * @param eventObject The event object for the click of the downvote button.
         * @private
         */
        CommentThread.prototype.onDownvoteControllerClick = function(eventObject) {
            var downvoteController = eventObject.target;
            var voteController = downvoteController.parentNode;
            var scoreValue = voteController.querySelector(".score");
            if (this.threadInformation.likes === false) {
                /* The user already dislikes this post, so they wish to remove their current dislike */
                voteController.classList.remove("disliked");
                this.threadInformation.likes = null;
                this.threadInformation.score = this.threadInformation.score + 1;
                scoreValue.textContent = this.threadInformation.score;
                new RoYT.Reddit.VoteRequest(this.threadInformation.name, RoYT.Reddit.Vote.REMOVE);
            } else {
                /* The user wishes to dislike this post */
                if (this.threadInformation.likes === true) {
                    /* The user has previously liked this post, we need to remove that status and subtract 2 from the score instead of 1*/
                    voteController.classList.remove("liked");
                    this.threadInformation.score = this.threadInformation.score - 2;
                } else {
                    this.threadInformation.score = this.threadInformation.score - 1;
                }
                voteController.classList.add("disliked");
                this.threadInformation.likes = false;
                scoreValue.textContent = this.threadInformation.score;
                new RoYT.Reddit.VoteRequest(this.threadInformation.name, RoYT.Reddit.Vote.DOWNVOTE);
            }
        };
        /**
         * Handle the click of the "comment" button, to show or hide the post comment box.
         * @private
         */
        CommentThread.prototype.onCommentButtonClick = function() {
            var header = document.querySelector(".royt_thread");
            var previousCommentBox = header.querySelector(".royt_commentfield");
            if (previousCommentBox) {
                previousCommentBox.parentNode.removeChild(previousCommentBox);
            }
            new RoYT.CommentField(this);
        };
        return CommentThread;
    })();
    RoYT.CommentThread = CommentThread;

    /**
     * The representation and management of an RoYT loading screen.
     * @class CommentField
     * @param commentSection The active CommentSection to retrieve data from.
     * @param insertionPoint The DOM element in which the loading screen should be appended to as a child.
     * @param [initialState] An optional initial state for the loading screen, the default is "Loading"
     */

    var CommentField = (function() {
        function CommentField(parent, initialText, edit) {
            /* Check if the paramter is a Coment Thread and assign the correct parent HTML element .*/
            if (parent instanceof RoYT.CommentThread) {
                this.parentClass = parent;
                this.commentThread = this.parentClass;
                this.parentHTMLElement = this.parentClass.threadContainer.querySelector(".options");
            } else if (parent instanceof RoYT.Comment) {
                this.parentClass = parent;
                this.commentThread = this.parentClass.commentThread;
                this.parentHTMLElement = this.parentClass.representedHTMLElement.querySelector(".options");
            } else {
                new TypeError("parent needs to be type CommentThread or Type Comment");
            }
            this.edit = edit;
            var template = RoYT.Application.getExtensionTemplateItem(this.commentThread.commentSection.template, "commentfield");
            this.representedHTMLElement = template.querySelector(".royt_commentfield");
            /* Set the "You are now commenting as" text under the comment field. */
            var authorName = this.representedHTMLElement.querySelector(".royt_writingauthor");
            authorName.textContent = RoYT.Application.localisationManager.get("commentfield_label_author", [RoYT.Preferences.get("username")]);
            /* Set the button text and event listener for the submit button */
            var submitButton = this.representedHTMLElement.querySelector(".royt_submit");
            submitButton.textContent = RoYT.Application.localisationManager.get("commentfield_button_submit");
            submitButton.addEventListener("click", this.onSubmitButtonClick.bind(this), false);
            /* Set the button text and event listener for the cancel button */
            var cancelButton = this.representedHTMLElement.querySelector(".royt_cancel");
            cancelButton.textContent = RoYT.Application.localisationManager.get("commentfield_button_cancel");
            cancelButton.addEventListener("click", this.onCancelButtonClick.bind(this), false);
            /* Set the text for the markdown preview header */
            var previewHeader = this.representedHTMLElement.querySelector(".royt_preview_header");
            previewHeader.textContent = RoYT.Application.localisationManager.get("commentfield_label_preview");
            /* Check if we were initialised with some text (most likely from the show source button) and add event listener for input
            change */
            var inputField = this.representedHTMLElement.querySelector(".royt_textarea");
            if (initialText) {
                inputField.value = initialText;
            }
            inputField.addEventListener("input", this.onInputFieldChange.bind(this), false);
            this.previewElement = this.representedHTMLElement.querySelector(".royt_comment_preview");
            this.parentHTMLElement.appendChild(this.representedHTMLElement);
        }
        Object.defineProperty(CommentField.prototype, "HTMLElement", {
            /**
             * Get the HTML element of the comment field.
             */
            get: function() {
                return this.representedHTMLElement;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Handle the click of the submit button of the comment field.
         * @param eventObject The event object of the click of the submit button.
         * @private
         */
        CommentField.prototype.onSubmitButtonClick = function(eventObject) {
            /* Disable the button on click so the user does not accidentally press it multiple times */
            var submitButton = eventObject.target;
            submitButton.disabled = true;
            var inputField = this.representedHTMLElement.querySelector(".royt_textarea");
            var thing_id = (this.parentClass instanceof RoYT.CommentThread) ?
                this.parentClass.threadInformation.name : this.parentClass.commentObject.name;
            if (this.edit) {
                /* Send the edit comment request to reddit */
                new RoYT.Reddit.EditCommentRequest(thing_id, inputField.value, function(responseText) {
                    this.parentClass.commentObject.body = inputField.value;
                    var editedCommentBody = this.parentClass.representedHTMLElement.querySelector(".royt_commentcontent");
                    editedCommentBody.textContent = SnuOwnd.getParser().render(inputField.value);
                    this.parentClass.representedHTMLElement.classList.add("edited");
                    /* The comment box is no longer needed, remove it and clear outselves out of memory */
                    this.representedHTMLElement.parentNode.removeChild(this.representedHTMLElement);
                });
            } else {
                /* Send the comment to Reddit */
                new RoYT.Reddit.CommentRequest(thing_id, inputField.value, function(responseText) {
                    var responseObject = JSON.parse(responseText);
                    var comment = new RoYT.Comment(responseObject.json.data.things[0].data, this.commentThread);
                    this.parentClass.children.push(comment);
                    /* Find the correct insert location and append the new comment to DOM */
                    if (this.parentClass instanceof RoYT.CommentThread) {
                        this.parentClass.threadContainer.appendChild(comment.representedHTMLElement);
                        new CommentField(this.parentClass);
                    } else {
                        this.parentClass.representedHTMLElement.querySelector(".royt_replies").appendChild(comment.representedHTMLElement);
                    }
                    this.parentClass.children.push(comment);
                    /* Scroll the new comment in to view */
                    comment.representedHTMLElement.scrollIntoView(false);
                    /* The comment box is no longer needed, remove it and clear outselves out of memory */
                    this.representedHTMLElement.parentNode.removeChild(this.representedHTMLElement);
                });
            }
            // refresh the comments
            this.commentThread.commentSection.threadCollection.forEach(function(item) {
                if (item.id === this.threadInformation.id) {
                    this.commentThread.commentSection.downloadThread(item);
                }
            });
        };
        /**
         * Cancel / Remove the comment field.
         * @private
         */
        CommentField.prototype.onCancelButtonClick = function() {
            this.representedHTMLElement.parentNode.removeChild(this.representedHTMLElement);
        };
        /**
         * Handle the contents of the comment field changing.
         * @param eventObject The event object of the input field change.
         * @private
         */
        CommentField.prototype.onInputFieldChange = function(eventObject) {
            var inputField = eventObject.target;
            /* If there is any contents of the input box, display the markdown preview and populate it. */
            if (inputField.value.length > 0) {
                this.previewElement.style.display = "block";
                var previewContents = this.previewElement.querySelector(".royt_preview_contents");
                while (previewContents.firstChild) {
                    previewContents.removeChild(previewContents.firstChild);
                }
                previewContents.appendChild(RoYT.Utilities.parseHTML(SnuOwnd.getParser().render(inputField.value)));
            } else {
                this.previewElement.style.display = "none";
            }
        };
        return CommentField;
    })();
    RoYT.CommentField = CommentField;

    /**
     * A class representation and container of a single Reddit comment.
     * @class Comment
     * @param commentData Object containing the comment data from the Reddit API.
     * @param commentThread CommentThread object representing the container of the comment.
     */
    var Comment = (function() {
        function Comment(commentData, commentThread) {
            this.children = new Array();
            this.commentObject = commentData;
            this.commentThread = commentThread;
            var template = RoYT.Application.getExtensionTemplateItem(this.commentThread.commentSection.template, "comment");
            this.representedHTMLElement = template.querySelector(".royt_comment");
            /* Set the id for the comment in question so it can be correlated with the Comment Object */
            this.representedHTMLElement.setAttribute("data-reddit-id", commentData.id);
            /* Show / collapse function for the comment */
            var toggleHide = this.representedHTMLElement.querySelector(".royt_togglehide");
            toggleHide.addEventListener("click", function() {
                if (this.representedHTMLElement.classList.contains("hidden")) {
                    this.representedHTMLElement.classList.remove("hidden");
                } else {
                    this.representedHTMLElement.classList.add("hidden");
                }
            }.bind(this), false);
            /* Hide comments with a score less than the threshold set by the user  */
            if (this.commentObject.score < RoYT.Preferences.get("hiddenCommentScoreThreshold")) {
                this.representedHTMLElement.classList.add("hidden");
            }
            /* Set the link and name of author, as well as whether they are the OP or not. */
            var author = this.representedHTMLElement.querySelector(".royt_author");
            author.textContent = this.commentObject.author;
            author.setAttribute("href", "http://reddit.com/u/" + this.commentObject.author);
            author.setAttribute("data-username", this.commentObject.author);
            if (commentData.distinguished === "admin") {
                author.setAttribute("data-reddit-admin", "true");
            } else if (commentData.distinguished === "moderator") {
                author.setAttribute("data-reddit-mod", "true");
            } else if (commentData.author === commentThread.threadInformation.author) {
                author.setAttribute("data-reddit-op", "true");
            }
            /* Set the gild (how many times the user has been given gold for this post) if any */
            if (this.commentObject.gilded) {
                this.representedHTMLElement.querySelector(".royt_gilded").setAttribute("data-count", this.commentObject.gilded);
            }
            /* Add flair to the user */
            var flair = this.representedHTMLElement.querySelector(".royt_flair");
            if (this.commentObject.author_flair_text) {
                flair.textContent = this.commentObject.author_flair_text;
            } else {
                flair.style.display = "none";
            }
            /* Set the score of the comment next to the user tag */
            var score = this.representedHTMLElement.querySelector(".royt_score");
            var scorePointsText = this.commentObject.score === 1 ? RoYT.Application.localisationManager.get("post_current_score") : RoYT.Application.localisationManager.get("post_current_score_plural");
            score.textContent = (this.commentObject.score + scorePointsText);
            /* Set the timestamp of the comment */
            var timestamp = this.representedHTMLElement.querySelector(".royt_timestamp");
            timestamp.textContent = RoYT.Application.getHumanReadableTimestamp(this.commentObject.created_utc);
            timestamp.setAttribute("timestamp", new Date(this.commentObject.created_utc).toISOString());
            /* If the post has been edited, display the edit time next to the timestamp. */
            if (this.commentObject.edited) {
                timestamp.classList.add("edited");
                timestamp.title = "" + RoYT.Application.getHumanReadableTimestamp(this.commentObject.edited, "edited_timestamp_format");
            }
            /* Render the markdown and set the actual comement messsage of the comment */
            var contentTextOfComment = this.representedHTMLElement.querySelector(".royt_commentcontent");
            var contentTextHolder = document.createElement("span");
            var textParsingElement = document.createElement("span");
            textParsingElement.appendChild(RoYT.Utilities.parseHTML(this.commentObject.body));
            /* Set the comment text */
            contentTextHolder.appendChild(RoYT.Utilities.parseHTML(SnuOwnd.getParser().render(textParsingElement.textContent)));
            contentTextOfComment.appendChild(contentTextHolder);
            if (this.commentObject.body === "[deleted]") {
                this.representedHTMLElement.classList.add("deleted");
            }
            /* Set the button text and event handler for the reply button. */
            var replyToComment = this.representedHTMLElement.querySelector(".royt_reply");
            replyToComment.textContent = RoYT.Application.localisationManager.get("post_button_reply");
            replyToComment.addEventListener("click", this.onCommentButtonClick.bind(this), false);
            /* Set the button text and link for the "permalink" button */
            var permalinkElement = this.representedHTMLElement.querySelector(".royt_permalink");
            permalinkElement.textContent = RoYT.Application.localisationManager.get("post_button_permalink");
            permalinkElement.setAttribute("href", "http://www.reddit.com" + commentThread.threadInformation.permalink + this.commentObject.id);
            /* Set the button text and link for the "parent" link button */
            var parentLinkElement = this.representedHTMLElement.querySelector(".royt_parentlink");
            parentLinkElement.textContent = RoYT.Application.localisationManager.get("post_button_parent");
            parentLinkElement.setAttribute("href", "http://www.reddit.com" + commentThread.threadInformation.permalink + "#" + this.commentObject.parent_id.substring(3));
            /* Set the button text and the event handler for the "show source" button */
            var displaySourceForComment = this.representedHTMLElement.querySelector(".royt_displaysource");
            displaySourceForComment.textContent = RoYT.Application.localisationManager.get("post_button_source");
            displaySourceForComment.addEventListener("click", this.onSourceButtonClick.bind(this), false);
            /* Set the button text and the event handler for the "save comment" button */
            var saveItemToRedditList = this.representedHTMLElement.querySelector(".save");
            if (this.commentObject.saved) {
                saveItemToRedditList.textContent = RoYT.Application.localisationManager.get("post_button_unsave");
                saveItemToRedditList.setAttribute("saved", "true");
            } else {
                saveItemToRedditList.textContent = RoYT.Application.localisationManager.get("post_button_save");
            }
            saveItemToRedditList.addEventListener("click", this.onSaveButtonClick.bind(this), false);
            /* Set the button text and the link for the "give gold" button */
            var giveGoldToUser = this.representedHTMLElement.querySelector(".giveGold");
            giveGoldToUser.setAttribute("href", "http://www.reddit.com/gold?goldtype=gift&months=1&thing=" + this.commentObject.name);
            giveGoldToUser.textContent = RoYT.Application.localisationManager.get("post_button_gold");
            var reportToAdministrators = this.representedHTMLElement.querySelector(".report");
            var editPost = this.representedHTMLElement.querySelector(".royt_edit");
            var deletePost = this.representedHTMLElement.querySelector(".royt_delete");
            if (this.commentObject.author === RoYT.Preferences.get("username")) {
                /* Report button does not make sense on our own post, so let's get rid of it */
                reportToAdministrators.parentNode.removeChild(reportToAdministrators);
                /* Set the button text and the event handler for the "edit post" button */
                editPost.textContent = RoYT.Application.localisationManager.get("post_button_edit");
                editPost.addEventListener("click", this.onEditPostButtonClick.bind(this), false);
                /* Set the button text and the event handler for the "delete post" button */
                deletePost.textContent = RoYT.Application.localisationManager.get("post_button_delete");
                deletePost.addEventListener("click", this.onDeletePostButtonClick.bind(this), false);
            } else {
                /* Delete and edit buttons does not make sense if the post is not ours, so let's get rid of them. */
                editPost.parentNode.removeChild(editPost);
                deletePost.parentNode.removeChild(deletePost);
                /* Set the button text and the event handler for the "report comment" button */
                reportToAdministrators.textContent = RoYT.Application.localisationManager.get("post_button_report");
                reportToAdministrators.addEventListener("click", this.onReportButtonClicked.bind(this), false);
            }
            /* Set the state of the voting buttons */
            var voteController = this.representedHTMLElement.querySelector(".vote");
            voteController.querySelector(".arrow.up").addEventListener("click", this.onUpvoteControllerClick.bind(this), false);
            voteController.querySelector(".arrow.down").addEventListener("click", this.onDownvoteControllerClick.bind(this), false);
            if (this.commentObject.likes === true) {
                voteController.classList.add("liked");
            } else if (this.commentObject.likes === false) {
                voteController.classList.add("disliked");
            }
            /* Continue traversing down and populate the replies to this comment. */
            if (this.commentObject.replies) {
                var replyContainer = this.representedHTMLElement.querySelector(".royt_replies");
                this.commentObject.replies.data.children.forEach(function(commentObject) {
                    if (commentObject.kind === "more") {
                        var readmore = new RoYT.LoadMore(commentObject.data, this, commentThread);
                        this.children.push(readmore);
                        replyContainer.appendChild(readmore.representedHTMLElement);
                    } else {
                        var comment = new Comment(commentObject.data, commentThread);
                        this.children.push(comment);
                        replyContainer.appendChild(comment.representedHTMLElement);
                    }
                }.bind(this));
            }
        }
        /**
         * Either save a comment or unsave an already saved comment.
         * @param eventObject The event object for the click of the save button.
         * @private
         */
        Comment.prototype.onSaveButtonClick = function(eventObject) {
            var saveButton = eventObject.target;
            var savedType = saveButton.getAttribute("saved") ? RoYT.Reddit.SaveType.UNSAVE : RoYT.Reddit.SaveType.SAVE;
            new RoYT.Reddit.SaveRequest(this.commentObject.name, savedType, function() {
                if (savedType === RoYT.Reddit.SaveType.SAVE) {
                    saveButton.setAttribute("saved", "true");
                    saveButton.textContent = RoYT.Application.localisationManager.get("post_button_unsave");
                } else {
                    saveButton.removeAttribute("saved");
                    saveButton.textContent = RoYT.Application.localisationManager.get("post_button_save");
                }
            });
        };
        /**
         * Show the report comment form.
         * @param eventObject The event object for the click of the report button.
         * @private
         */
        Comment.prototype.onReportButtonClicked = function(eventObject) {
            new RoYT.Reddit.Report(this.commentObject.name, this.commentThread, false);
        };
        /**
         * Upvote a comment or remove an existing upvote.
         * @param eventObject The event object for the click of the upvote button.
         * @private
         */
        Comment.prototype.onUpvoteControllerClick = function(eventObject) {
            var upvoteController = eventObject.target;
            var voteController = upvoteController.parentNode;
            var parentNode = voteController.parentNode;
            var scoreValue = parentNode.querySelector(".royt_score");
            if (this.commentObject.likes === true) {
                /* The user already likes this post, so they wish to remove their current like. */
                voteController.classList.remove("liked");
                this.commentObject.likes = null;
                this.commentObject.score = this.commentObject.score - 1;
                var scorePointsText = this.commentObject.score === 1 ? RoYT.Application.localisationManager.get("post_current_score") : RoYT.Application.localisationManager.get("post_current_score_plural");
                scoreValue.textContent = this.commentObject.score + scorePointsText;
                new RoYT.Reddit.VoteRequest(this.commentObject.name, RoYT.Reddit.Vote.REMOVE);
            } else {
                /* The user wishes to like this post */
                if (this.commentObject.likes === false) {
                    /* The user has previously disliked this post, we need to remove that status and add 2 to the score instead of 1*/
                    voteController.classList.remove("disliked");
                    this.commentObject.score = this.commentObject.score + 2;
                } else {
                    this.commentObject.score = this.commentObject.score + 1;
                }
                voteController.classList.add("liked");
                this.commentObject.likes = true;
                var scorePointsText = this.commentObject.score === 1 ? RoYT.Application.localisationManager.get("post_current_score") : RoYT.Application.localisationManager.get("post_current_score_plural");
                scoreValue.textContent = this.commentObject.score + scorePointsText;
                new RoYT.Reddit.VoteRequest(this.commentObject.name, RoYT.Reddit.Vote.UPVOTE);
            }
        };
        /**
         * Downvote a comment or remove an existing downvote
         * @param eventObject The event object for the click of the downvote button.
         * @private
         */
        Comment.prototype.onDownvoteControllerClick = function(eventObject) {
            var downvoteController = eventObject.target;
            var voteController = downvoteController.parentNode;
            var parentNode = voteController.parentNode;
            var scoreValue = parentNode.querySelector(".royt_score");
            if (this.commentObject.likes === false) {
                /* The user already dislikes this post, so they wish to remove their current dislike */
                voteController.classList.remove("disliked");
                this.commentObject.likes = null;
                this.commentObject.score = this.commentObject.score + 1;
                var scorePointsText = this.commentObject.score === 1 ? RoYT.Application.localisationManager.get("post_current_score") : RoYT.Application.localisationManager.get("post_current_score_plural");
                scoreValue.textContent = this.commentObject.score + scorePointsText;
                new RoYT.Reddit.VoteRequest(this.commentObject.name, RoYT.Reddit.Vote.REMOVE);
            } else {
                /* The user wishes to dislike this post */
                if (this.commentObject.likes === true) {
                    /* The user has previously liked this post, we need to remove that status and subtract 2 from the score instead of 1*/
                    voteController.classList.remove("liked");
                    this.commentObject.score = this.commentObject.score - 2;
                } else {
                    this.commentObject.score = this.commentObject.score - 1;
                }
                voteController.classList.add("disliked");
                this.commentObject.likes = false;
                var scorePointsText = this.commentObject.score === 1 ? RoYT.Application.localisationManager.get("post_current_score") : RoYT.Application.localisationManager.get("post_current_score_plural");
                scoreValue.textContent = this.commentObject.score + scorePointsText;
                new RoYT.Reddit.VoteRequest(this.commentObject.name, RoYT.Reddit.Vote.DOWNVOTE);
            }
        };
        /**
         * Show or hide the comment/reply box.
         * @private
         */
        Comment.prototype.onCommentButtonClick = function() {
            var previousCommentBox = this.representedHTMLElement.querySelector(".royt_commentfield");
            if (previousCommentBox) {
                previousCommentBox.parentNode.removeChild(previousCommentBox);
            }
            new RoYT.CommentField(this);
        };
        /**
         * Show the source of the comment.
         * @private
         */
        Comment.prototype.onSourceButtonClick = function() {
            var previousCommentBox = this.representedHTMLElement.querySelector(".royt_commentfield");
            if (previousCommentBox) {
                previousCommentBox.parentNode.removeChild(previousCommentBox);
            }
            new RoYT.CommentField(this, this.commentObject.body);
        };
        /**
         * Edit a comment.
         * @private
         */
        Comment.prototype.onEditPostButtonClick = function() {
            var previousCommentBox = this.representedHTMLElement.querySelector(".royt_commentfield");
            if (previousCommentBox) {
                previousCommentBox.parentNode.removeChild(previousCommentBox);
            }
            new RoYT.CommentField(this, this.commentObject.body, true);
        };
        /**
         * Delete a comment.
         * @private
         */
        Comment.prototype.onDeletePostButtonClick = function() {
            var confirmation = window.confirm(RoYT.Application.localisationManager.get("post_delete_confirm"));
            if (confirmation) {
                var url = "https://api.reddit.com/api/del";
                new RoYT.HttpRequest(url, RoYT.RequestType.POST, function() {
                    this.representedHTMLElement.parentNode.removeChild(this.representedHTMLElement);
                    var getIndexInParentList = this.commentThread.children.indexOf(this);
                    if (getIndexInParentList !== -1) {
                        this.commentThread.children.splice(getIndexInParentList, 1);
                    }
                }, {
                    "uh": RoYT.Preferences.get("redditUserIdentifierHash"),
                    "id": this.commentObject.name,
                });
            }
        };
        return Comment;
    })();
    RoYT.Comment = Comment;

    /**
     * A class representation and container of a single Reddit comment.
     * @class ReadMore
     * @param data Object containing the "load more comments" links.
     * @param commentThread CommentThread object representing the container of the load more link.
     */

    var LoadMore = (function() {
        function LoadMore(data, referenceParent, commentThread) {
            this.data = data;
            this.commentThread = commentThread;
            this.referenceParent = referenceParent;
            this.representedHTMLElement = RoYT.Application.getExtensionTemplateItem(commentThread.commentSection.template, "loadmore");
            /* Display the amount of replies available to load */
            var replyCount = this.representedHTMLElement.querySelector(".royt_replycount");
            var replyCountText = data.count > 1 ? RoYT.Application.localisationManager.get("post_label_reply_plural") : RoYT.Application.localisationManager.get("post_label_reply");
            replyCount.textContent = "(" + data.count + " " + replyCountText + ")";
            /* Set the localisation for the "load more" button, and the event listener. */
            var loadMoreText = this.representedHTMLElement.querySelector(".royt_load");
            loadMoreText.textContent = RoYT.Application.localisationManager.get("post_button_load_more");
            loadMoreText.addEventListener("click", this.onLoadMoreClick.bind(this), false);
        }
        /**
         * Handle a click on the "load more" button.
         * @param eventObject The event object of the load more button click.
         * @private
         */
        LoadMore.prototype.onLoadMoreClick = function(eventObject) {
            /* Display "loading comments" text */
            var loadingText = eventObject.target;
            loadingText.classList.add("loading");
            loadingText.textContent = RoYT.Application.localisationManager.get("loading_generic_message");
            var getParentNode = loadingText.parentNode.parentNode;
            var that = this;
            this.data.children.forEach(function(id) {
                var generateRequestUrl = "https://api.reddit.com/r/" + that.commentThread.threadInformation.subreddit + "/comments/" + that.commentThread.threadInformation.id + "/z/" + id + ".json";
                new RoYT.HttpRequest(generateRequestUrl, RoYT.RequestType.GET, function(responseData) {
                    /* Remove "loading comments" text */
                    if (loadingText) {
                        getParentNode.removeChild(loadingText.parentNode);
                        loadingText = null;
                    }
                    /* Traverse the retrieved comments and append them to the comment section */
                    var commentItems = JSON.parse(responseData)[1].data.children;
                    if (commentItems.length > 0) {
                        commentItems.forEach(function(commentObject) {
                            var readmore, comment;
                            if (commentObject.kind === "more") {
                                readmore = new LoadMore(commentObject.data, that.referenceParent, that.commentThread);
                                that.referenceParent.children.push(readmore);
                                getParentNode.appendChild(readmore.representedHTMLElement);
                            } else {
                                comment = new RoYT.Comment(commentObject.data, that.commentThread);
                                that.referenceParent.children.push(comment);
                                getParentNode.appendChild(comment.representedHTMLElement);
                            }
                        });
                    }
                });
            });
        };
        return LoadMore;
    })();
    RoYT.LoadMore = LoadMore;

    /**
     * Starts a new instance of the Localisation Manager, for handling language.
     * @class LocalisationManager
     * @param [callback] a callback method to be called after the localisation files has been loaded.
     */
    var LocalisationManager = (function() {
        function LocalisationManager(callback) {
            if (callback) {
                requestAnimationFrame(callback);
            }
        }
        /**
         * Retrieve a localised string by key
         * @param key The key in the localisation file representing a language string.
         * @param [placeholders] An array of values for the placeholders in the string.
         * @returns The requested language string.
         */
        LocalisationManager.prototype.get = function(key, placeholders) {
            if (placeholders) {
                return browser.i18n.getMessage(key, placeholders);
            } else {
                return browser.i18n.getMessage(key);
            }
        };
        /**
         * Retreive a localised string related to a number of items, localising plurality by language.
         * @param key The key for the non-plural version of the string.
         * @param value The number to localise by.
         * @returns The requested language string.
         */
        LocalisationManager.prototype.getWithLocalisedPluralisation = function(key, value) {
            if (value > 1 || value === 0) {
                return this.get(key + "_plural");
            } else {
                return this.get(key);
            }
        };
        return LocalisationManager;
    })();
    RoYT.LocalisationManager = LocalisationManager;

    /**
     * The representation and management of an RoYT loading screen.
     * @class LoadingScreen
     * @param commentSection The active CommentSection to retrieve data from.
     * @param insertionPoint The DOM element in which the loading screen should be appended to as a child.
     * @param [initialState] An optional initial state for the loading screen, the default is "Loading"
     */
    var LoadingScreen = (function() {
        function LoadingScreen(commentSection, initialState, alternativeText) {
            var loadingState = initialState || LoadingState.LOADING;
            this.representedHTMLElement = RoYT.Application.getExtensionTemplateItem(commentSection.template, "loading");
            this.updateProgress(loadingState, alternativeText);
        }
        Object.defineProperty(LoadingScreen.prototype, "HTMLElement", {
            /**
             * Get the HTML element of the loading screen container.
             */
            get: function() {
                return this.representedHTMLElement;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Update the current progress of the loading screen.
         * @param state The new state of the loading screen.
         * @param [alternativeText] A custom message to put on the loading screen for the user.
         */
        LoadingScreen.prototype.updateProgress = function(state, alternativeText) {
            this.currentProgressState = state;
            var loadingText = this.representedHTMLElement.querySelector("#royt_loadingtext");
            var loadingHeader = this.representedHTMLElement.querySelector("#royt_loadingheader");
            switch (this.currentProgressState) {
                case LoadingState.LOADING:
                    this.loadingAttempts = 1;
                    loadingHeader.textContent = alternativeText || RoYT.Application.localisationManager.get("loading_generic_message");
                    loadingText.textContent = RoYT.Application.localisationManager.get("loading_generic_text") || "";
                    break;
                case LoadingState.RETRY:
                    this.loadingAttempts += 1;
                    loadingText.textContent = RoYT.Application.localisationManager.get("loading_retry_message", [
                        this.loadingAttempts.toString(),
                        "3"
                    ]);
                    break;
                case LoadingState.ERROR:
                case LoadingState.COMPLETE:
                    var parentNode = this.representedHTMLElement.parentNode;
                    if (parentNode) {
                        this.representedHTMLElement.parentNode.removeChild(this.representedHTMLElement);
                    }
                    delete this;
                    break;
            }
        };
        return LoadingScreen;
    })();
    RoYT.LoadingScreen = LoadingScreen;
    (function(LoadingState) {
        LoadingState[LoadingState["LOADING"] = 0] = "LOADING";
        LoadingState[LoadingState["RETRY"] = 1] = "RETRY";
        LoadingState[LoadingState["ERROR"] = 2] = "ERROR";
        LoadingState[LoadingState["COMPLETE"] = 3] = "COMPLETE";
    })(RoYT.LoadingState || (RoYT.LoadingState = {}));
    var LoadingState = RoYT.LoadingState;

    /**
     * The representation and management of an RoYT loading screen.
     * @class ErrorScreen
     * @param commentSection The active CommentSection to retrieve data from.
     * @param errorState The error state of the error screen, defines what visuals and titles will be displayed.
     * @param [message] Optional message to be displayed if the error state is set to regular "ERROR"
     */

    var ErrorScreen = (function() {
        function ErrorScreen(commentSection, errorState, message) {
            this.representedHTMLElement = RoYT.Application.getExtensionTemplateItem(commentSection.template, "error");
            var errorImage = this.representedHTMLElement.querySelector("img");
            var errorHeader = this.representedHTMLElement.querySelector("#royt_errorheader");
            var errorText = this.representedHTMLElement.querySelector("#royt_errortext");
            /* Set the icon, text, and event listener for the button to switch to the Google+ comments. */
            var googlePlusButton = this.representedHTMLElement.querySelector("#royt_switchtogplus");
            googlePlusButton.addEventListener("click", this.onGooglePlusClick, false);
            var googlePlusContainer = Application.getYouTubeSection("serviceCommentsContainer");
            if (RoYT.Preferences.get("showGooglePlusButton") === false || googlePlusContainer === null) {
                googlePlusButton.style.display = "none";
            }
            switch (errorState) {
                case ErrorState.NOT_FOUND:
                    /* Reddit.com uses 5 different randomly selected visuals for their 404 graphic, their path consists of a letter from
                    "a" to "e" just like Reddit we are randomly choosing one of these letters and retrieving the image. */
                    var getRandom404Id = String.fromCharCode(97 + Math.floor(Math.random() * 5));
                    errorImage.setAttribute("src", "https://www.redditstatic.com/reddit404" + getRandom404Id + ".png");
                    /* Set page not found localisation text */
                    errorHeader.textContent = RoYT.Application.localisationManager.get("error_header_not_found");
                    errorText.textContent = RoYT.Application.localisationManager.get("error_message_not_found");
                    break;
                case ErrorState.OVERLOAD:
                    /* Retrieve the Reddit overloaded svg graphic from the ressource directory. */
                    errorImage.setAttribute("src", Application.getExtensionRessourcePath("redditoverload.svg"));
                    /* Set reddit overloaded localisation text */
                    errorHeader.textContent = RoYT.Application.localisationManager.get("error_header_overloaded");
                    errorText.textContent = RoYT.Application.localisationManager.get("error_message_overloaded");
                    break;
                case ErrorState.ERROR:
                case ErrorState.REDDITERROR:
                    /* Retrieve the generic "Reddit is broken" svg graphic from the ressource directory */
                    errorImage.setAttribute("src", Application.getExtensionRessourcePath("redditbroken.svg"));
                    /* Set "you broke reddit" localisation text, and a custom message if provided */
                    errorHeader.textContent = RoYT.Application.localisationManager.get("error_header_generic");
                    if (message) {
                        errorText.textContent = message;
                    }
                    break;
                case ErrorState.CONNECTERROR:
                    /* Retrieve the generic "Reddit is broken" svg graphic from the ressource directory */
                    errorImage.setAttribute("src", Application.getExtensionRessourcePath("redditbroken.svg"));
                    /* Set "connection timed out" localisation text */
                    errorHeader.textContent = RoYT.Application.localisationManager.get("error_header_timeout");
                    errorText.textContent = RoYT.Application.localisationManager.get("error_message_timeout");
                    break;
                case ErrorState.BLOCKED:
                    /* Retrieve the reddit blocked svg graphic from the ressource directory */
                    errorImage.setAttribute("src", Application.getExtensionRessourcePath("redditblocked.svg"));
                    /* Set "connection is being interrupted" localisation text */
                    errorHeader.textContent = RoYT.Application.localisationManager.get("error_header_interrupted");
                    errorText.textContent = RoYT.Application.localisationManager.get("error_message_interrupted");
                    break;
            }
            /* Provide a retry button which reloads RoYT completely and tries again. */
            var retryButton = this.representedHTMLElement.querySelector(".royt_retry");
            retryButton.textContent = RoYT.Application.localisationManager.get("error_button_retry");
            retryButton.addEventListener("click", this.reload, false);
            commentSection.set(this.representedHTMLElement);
        }
        /**
         * Reload the comment section.
         * @private
         */
        ErrorScreen.prototype.reload = function() {
            RoYT.Application.commentSection = new RoYT.CommentSection(RoYT.Application.getCurrentVideoId());
        };
        /**
         * Handle the click of the Google+ Button to change to the Google+ comments.
         * @private
         */
        ErrorScreen.prototype.onGooglePlusClick = function(eventObject) {
            var roytContainer = document.getElementById("royt");
            roytContainer.style.display = "none";
            var googlePlusContainer = Application.getYouTubeSection("serviceCommentsContainer");
            googlePlusContainer.style.display = "block";
            var redditButton = document.getElementById("royt_switchtoreddit");
            redditButton.style.display = "block";
        };
        return ErrorScreen;
    })();
    RoYT.ErrorScreen = ErrorScreen;
    (function(ErrorState) {
        ErrorState[ErrorState["NOT_FOUND"] = 0] = "NOT_FOUND";
        ErrorState[ErrorState["OVERLOAD"] = 1] = "OVERLOAD";
        ErrorState[ErrorState["REDDITERROR"] = 2] = "REDDITERROR";
        ErrorState[ErrorState["CONNECTERROR"] = 3] = "CONNECTERROR";
        ErrorState[ErrorState["BLOCKED"] = 4] = "BLOCKED";
        ErrorState[ErrorState["ERROR"] = 5] = "ERROR";
    })(RoYT.ErrorState || (RoYT.ErrorState = {}));
    var ErrorState = RoYT.ErrorState;

    /**
        Class for managing API keys to third party APIs. This is seperated to easily exclude them in source control.
        @class APIKeys
    */
    var APIKeys = (function() {
        function APIKeys() {}
        APIKeys.youtubeAPIKey = "";
        return APIKeys;
    })();
    RoYT.APIKeys = APIKeys;

    /**
     * Namespace for requests to the Reddit API operations.
     * @namespace RoYT.Reddit
     */
    var Reddit;
    (function(Reddit) {
        /**
            Perform a request to Reddit with embedded error handling.
            * @class Request
            * @param url The Reddit URL to make the request to.
            * @param type The type of request (POST or GET).
            * @param callback A callback handler for when the request is completed.
            * @param [postData] Eventual HTTP POST data to send with the request.
            * @param [loadingScreen] A LoadingScreen object to use for updating the progress of the request.
        */
        var Request = (function() {
            function Request(url, type, callback, postData, loadingScreen) {
                this.loadTimer = 0;
                this.timeoutTimer = 0;
                /* Move the request parameters so they are accessible from anywhere within the class. */
                this.requestUrl = url;
                this.requestType = type;
                this.finalCallback = callback;
                this.postData = postData;
                this.loadingScreen = loadingScreen;
                this.attempts = 0;
                /* Perform the request. */
                this.performRequest();
            }
            /**
             * Attempt to perform the request to the Reddit API.
             */
            Request.prototype.performRequest = function() {
                this.attempts += 1;
                /* Kick of a 3 second timer that will confirm to the user that the loading process is taking unusually long, unless cancelled
                by a successful load (or an error) */
                this.loadTimer = setTimeout(function() {
                    var loadingText = document.getElementById("royt_loadingtext");
                    loadingText.textContent = RoYT.Application.localisationManager.get("loading_slow_message");
                }, 3000);
                /* Kick of a 30 second timer that will cancel the connection attempt and display an error to the user letting them know
                something is probably blocking the connection. */
                this.timeoutTimer = setTimeout(function() {
                    new RoYT.ErrorScreen(RoYT.Application.commentSection, RoYT.ErrorState.CONNECTERROR);
                }, 30000);
                /* Perform the reddit api request */
                new RoYT.HttpRequest(this.requestUrl, this.requestType, this.onSuccess.bind(this), this.postData, this.onRequestError.bind(this));
            };
            /**
             * Called when a successful request has been made.
             * @param responseText the response from the Reddit API.
             */
            Request.prototype.onSuccess = function(responseText) {
                /* Cancel the slow load timer */
                clearTimeout(this.loadTimer);
                /* Cancel the unsuccessful load timer */
                clearTimeout(this.timeoutTimer);
                /* Dismiss the loading screen, perform the callback and clear ourselves out of memory. */
                this.loadingScreen.updateProgress(RoYT.LoadingState.COMPLETE);
                try {
                    var responseObject = JSON.parse(responseText);
                    this.finalCallback(responseObject);
                } catch (e) {
                    if (e.toString().indexOf("SyntaxError: Unexpected end of input") !== -1) {
                        new RoYT.ErrorScreen(RoYT.Application.commentSection, RoYT.ErrorState.CONNECTERROR);
                    } else {
                        new RoYT.ErrorScreen(RoYT.Application.commentSection, RoYT.ErrorState.ERROR, e.stack);
                    }
                }
            };
            /**
             * Called when a request was unsuccessful.
             * @param xhr the javascript XHR object of the request.
             * @param [response] An optional error message.
             */
            Request.prototype.onRequestError = function(status, response) {
                /* Cancel the slow load timer */
                clearTimeout(this.loadTimer);
                clearTimeout(this.timeoutTimer);
                if (this.attempts <= 3 && status !== 404) {
                    /* Up to 3 attempts, retry the loading process automatically. */
                    this.loadingScreen.updateProgress(RoYT.LoadingState.RETRY);
                    this.performRequest();
                } else {
                    /* We have tried too many times without success, give up and display an error to the user. */
                    this.loadingScreen.updateProgress(RoYT.LoadingState.ERROR);
                    switch (status) {
                        case 0:
                            new RoYT.ErrorScreen(RoYT.Application.commentSection, RoYT.ErrorState.BLOCKED);
                            break;
                        case 404:
                            new RoYT.ErrorScreen(RoYT.Application.commentSection, RoYT.ErrorState.NOT_FOUND);
                            break;
                        case 503:
                        case 504:
                        case 520:
                        case 521:
                            new RoYT.ErrorScreen(RoYT.Application.commentSection, RoYT.ErrorState.OVERLOAD);
                            break;
                        default:
                            new RoYT.ErrorScreen(RoYT.Application.commentSection, RoYT.ErrorState.REDDITERROR, response);
                    }
                }
            };
            return Request;
        })();
        Reddit.Request = Request;

        /**
         * Perform a request to Reddit to submit a comment.
         * @class CommentRequest
         * @param thing The Reddit ID of the item the user wants to comment on.
         * @param comment A markdown string containing the user's comment
         * @param callback Callback handler for the event when loaded.
         */
        var CommentRequest = (function() {
            function CommentRequest(thing, comment, callback) {
                var url = "https://api.reddit.com/api/comment";
                new RoYT.HttpRequest(url, RoYT.RequestType.POST, callback, {
                    "uh": RoYT.Preferences.get("redditUserIdentifierHash"),
                    "thing_id": thing,
                    "text": comment,
                    "api_type": "json"
                });
            }
            return CommentRequest;
        })();
        Reddit.CommentRequest = CommentRequest;

        /**
            Perform a request to Reddit to edit an existing comment.
            @class EditCommentRequest
            @param thing The Reddit ID of the item the user wants edit.
            @param comment A markdown string containing the user's new comment
            @param callback Callback handler for the event when loaded.
        */
        var EditCommentRequest = (function() {
            function EditCommentRequest(thing, comment, callback) {
                var url = "https://api.reddit.com/api/editusertext";
                new RoYT.HttpRequest(url, RoYT.RequestType.POST, callback, {
                    "uh": RoYT.Preferences.get("redditUserIdentifierHash"),
                    "thing_id": thing,
                    "text": comment,
                    "api_type": "json"
                });
            }
            return EditCommentRequest;
        })();
        Reddit.EditCommentRequest = EditCommentRequest;

        /**
            Perform a request to Reddit to either save or unsave an item.
            @class RedditVoteRequest
            @param thing The Reddit ID of the item the user wants to vote on
            @param type Whether the user wants to upvote, downvote, or remove their vote.
            @param callback Callback handler for the event when loaded.
        */
        var VoteRequest = (function() {
            function VoteRequest(thing, type, callback) {
                var url = "https://api.reddit.com/api/vote";
                new RoYT.HttpRequest(url, RoYT.RequestType.POST, callback, {
                    "uh": RoYT.Preferences.get("redditUserIdentifierHash"),
                    "id": thing,
                    "dir": type
                });
            }
            return VoteRequest;
        })();
        Reddit.VoteRequest = VoteRequest;
        (function(Vote) {
            Vote[Vote["UPVOTE"] = 1] = "UPVOTE";
            Vote[Vote["DOWNVOTE"] = -1] = "DOWNVOTE";
            Vote[Vote["REMOVE"] = 0] = "REMOVE";
        })(Reddit.Vote || (Reddit.Vote = {}));
        var Vote = Reddit.Vote;

        /**
            Report a post or comment to moderators.
            @class RedditReport
            @param thing The Reddit ID of the item you wish to report.
            @param commentThread CommentThread object representing the container of the comment.
            @param isThread Whether the thing being reported is an entire thread.
        */

        var Report = (function() {
            function Report(thing, commentThread, isThread) {
                var reportTemplate = RoYT.Application.getExtensionTemplateItem(commentThread.commentSection.template, "report");
                this.reportContainer = reportTemplate.querySelector(".royt_report");
                /* Set localisation text for the various report reasons */
                var report_options = [
                    "spam",
                    "vote_manipulation",
                    "personal_information",
                    "sexualising_minors",
                    "breaking_reddit",
                    "other"
                ];
                report_options.forEach(function(reportOption) {
                    document.querySelector("label[for='report_" + reportOption + "']").textContent = RoYT.Application.localisationManager.get("report_dialog_" + reportOption);
                });
                /* Set localisation text for the submit button */
                var submitButton = this.reportContainer.querySelector(".royt_report_submit");
                submitButton.appendChild(document.createTextNode(RoYT.Application.localisationManager.get("report_dialog_button_submit")));
                /* Set localisation text for the cancel button */
                var cancelButton = this.reportContainer.querySelector(".royt_report_cancel");
                cancelButton.appendChild(document.createTextNode(RoYT.Application.localisationManager.get("report_dialog_button_cancel")));
                /* Assign an event listener to all the buttons, checking if the one that is being selected is the "other" button.
                If so, re-enable the "other reason" text field, if not, disable it. */
                var reportOtherButton = this.reportContainer.querySelector("#report_other");
                var reportOtherField = this.reportContainer.querySelector("#report_otherfield");
                var radioButtonControllers = this.reportContainer.querySelectorAll("input[type=radio]");
                for (var i = 0, len = radioButtonControllers.length; i < len; i += 1) {
                    radioButtonControllers[i].addEventListener("change", function() {
                        if (reportOtherButton.checked) {
                            reportOtherField.disabled = false;
                        } else {
                            reportOtherField.disabled = true;
                        }
                    }, false);
                }
                /* Submit button click event. Check if the currently selected radio button is the "other" button, if so retrieve it's text
                field value. If not, use the value from whatever radio button is selected.  */
                submitButton.addEventListener("click", function() {
                    var activeRadioButton = this.getCurrentSelectedRadioButton();
                    var reportReason = "";
                    var otherReason = "";
                    if (activeRadioButton) {
                        if (activeRadioButton === reportOtherButton) {
                            reportReason = "other";
                            otherReason = reportOtherField.value;
                        } else {
                            reportReason = activeRadioButton.firstChild.innerHTML;
                        }
                    }
                    /* Send the report to Reddit*/
                    new RoYT.HttpRequest("https://api.reddit.com/api/report", RoYT.RequestType.POST, function() {
                        var threadCollection, i, len, tabContainer, comment;
                        if (isThread) {
                            /* If the "thing" that was reported was a thread, we will iterate through the thread collection to find it, and
                            delete it, effectively hiding it. We will then force a redraw of the tab container, selecting the first tab in
                            the list.  */
                            threadCollection = commentThread.commentSection.threadCollection;
                            for (i = 0, len = threadCollection.length; i < len; i += 1) {
                                if (threadCollection[i].name === commentThread.threadInformation.name) {
                                    threadCollection.splice(i, 1);
                                    commentThread.commentSection.clearTabsFromTabContainer();
                                    tabContainer = document.getElementById("royt_tabcontainer");
                                    commentThread.commentSection.insertTabsIntoDocument(tabContainer, 0);
                                    commentThread.commentSection.downloadThread(threadCollection[0]);
                                    break;
                                }
                            }
                        } else {
                            /* If the "thing" that was reported was a comment, we will locate it on the page and delete it from DOM,
                            effectively hiding it. */
                            comment = document.querySelector("article[data-reddit-id='" + thing.substring(3) + "']");
                            if (comment) {
                                comment.parentNode.removeChild(comment);
                            }
                        }
                    }, {
                        "api_type": "json",
                        "reason": reportReason,
                        "other_reason": otherReason,
                        "thing_id": thing,
                        "uh": RoYT.Preferences.get("redditUserIdentifierHash")
                    });
                }, false);
                /* Cancel event listener, will merely just get rid of the report screen. */
                cancelButton.addEventListener("click", function() {
                    this.reportContainer.parentNode.removeChild(this.reportContainer);
                }, false);
                /* Append the report screen to the appropriate location. */
                if (isThread) {
                    var parentContainer = document.querySelector("header .info");
                    parentContainer.appendChild(this.reportContainer);
                } else {
                    var commentApplication = document.querySelector("article[data-reddit-id='" + thing.substring(3) + "'] .royt_commentApplication");
                    commentApplication.appendChild(this.reportContainer);
                }
            }
            /* Method to iterate through the radio buttons and get the one with a selected (checked) status. */
            Report.prototype.getCurrentSelectedRadioButton = function() {
                var radioButtonControllers = this.reportContainer.querySelectorAll("input[type=radio]");
                for (var i = 0, len = radioButtonControllers.length; i < len; i += 1) {
                    if (radioButtonControllers[i].checked) {
                        return radioButtonControllers[i];
                    }
                }
                return null;
            };
            return Report;
        })();
        Reddit.Report = Report;

        /**
            Perform a request to Reddit to either save or unsave an item.
            @class RedditSaveRequest
            @param thing The Reddit ID of the item to either save or unsave
            @param type Whether to save or unsave
            @param callback Callback handler for the event when loaded.
        */

        var SaveRequest = (function() {
            function SaveRequest(thing, type, callback) {
                var url = "https://api.reddit.com/api/" + SaveType[type].toLowerCase();
                new RoYT.HttpRequest(url, RoYT.RequestType.POST, callback, {
                    "uh": RoYT.Preferences.get("redditUserIdentifierHash"),
                    "id": thing
                });
            }
            return SaveRequest;
        })();
        Reddit.SaveRequest = SaveRequest;
        (function(SaveType) {
            SaveType[SaveType["SAVE"] = 0] = "SAVE";
            SaveType[SaveType["UNSAVE"] = 1] = "UNSAVE";
        })(Reddit.SaveType || (Reddit.SaveType = {}));
        var SaveType = Reddit.SaveType;

        /**
            Perform a request to Reddit asking for the user's username so we can save and display it.
            @class RetreiveUsernameRequest
        */

        var RetreiveUsernameRequest = (function() {
            function RetreiveUsernameRequest() {
                var url = "https://api.reddit.com/api/me.json";
                new RoYT.HttpRequest(url, RoYT.RequestType.GET, function(responseText) {
                    var responseData = JSON.parse(responseText);
                    RoYT.Preferences.set("username", responseData.data.name);
                    /* If possible we should set the username retroactively so the user doesn't need to reload the page */
                    var usernameField = document.querySelector(".royt_writingauthor");
                    if (usernameField) {
                        usernameField.textContent = RoYT.Application.localisationManager.get("commentfield_label_author", [RoYT.Preferences.getString("username")]);
                    }
                });
            }
            return RetreiveUsernameRequest;
        })();
        Reddit.RetreiveUsernameRequest = RetreiveUsernameRequest;
    })(Reddit = RoYT.Reddit || (RoYT.Reddit = {}));
})(RoYT || (RoYT = {}));

function royt_initialise() {
    if (window.top === window) {
        new RoYT.Application();
    }
}
if (document.readyState === "complete" || document.readyState === "interactive") {
    royt_initialise();
} else {
    document.addEventListener("DOMContentLoaded", royt_initialise, false);
}
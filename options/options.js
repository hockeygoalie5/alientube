var excludedSubreddits = [];

function saveOptions(e) {
  e.preventDefault();
  browser.storage.sync.set({
    hiddenPostScoreThreshold: document.getElementById("hiddenPostScoreThreshold").value,
    hiddenCommentScoreThreshold: document.getElementById("hiddenCommentScoreThreshold").value,
    defaultDisplayAction: document.getElementById("defaultDisplayAction").value,
    showGooglePlusWhenNoPosts: document.getElementById("showGooglePlusWhenNoPosts").checked,
    showGooglePlusButton: document.getElementById("showGooglePlusButton").checked,
    excludedSubredditsSelectedByUser: excludedSubreddits
  });
}

function restoreOptions() {

  function setCurrentChoice(result) {
    document.getElementById("hiddenPostScoreThreshold").value = result.hiddenPostScoreThreshold || -1;
    document.getElementById("hiddenCommentScoreThreshold").value = result.hiddenCommentScoreThreshold || -1;

    if(!result.defaultDisplayAction || result.defaultDisplayAction === "royt") {
      document.querySelector("option[value='royt']").selected = true;
    } else {
      document.querySelector("option[value='gplus']").selected = true;
    }

    if(result.showGooglePlusWhenNoPosts) {
      document.getElementById("showGooglePlusWhenNoPosts").checked = true;
    }
    if(result.showGooglePlusButton) {
      document.getElementById("showGooglePlusButton").checked = true;
    }

    var excludedSubredditsNode = document.getElementById("excludedSubreddits");
    while(excludedSubredditsNode.firstChild) {
      excludedSubredditsNode.removeChild(excludedSubredditsNode.firstChild);
    }
    excludedSubreddits = [];
    if(result.excludedSubredditsSelectedByUser) {
      for(var excludedSubreddit of result.excludedSubredditsSelectedByUser) {
        addExcludedSubreddit(excludedSubreddit);
      }
    }
  }

  function onError(error) {
    console.error('${error}');
  }

  var getting = browser.storage.sync.get(null);
  getting.then(setCurrentChoice, onError);
}

function submitAddExcludedSubreddit() {
  addExcludedSubreddit(document.getElementById("addSubredditsForExclusion").value);
}

function addExcludedSubreddit(excludedSubreddit) {
  excludedSubreddit = excludedSubreddit.toLowerCase();
  var excludedSubredditsNode = document.getElementById("excludedSubreddits");
  if(excludedSubreddits.indexOf(excludedSubreddit) < 0) {
    excludedSubreddits.push(excludedSubreddit);
    var excludedSubredditNode = document.createElement("li");
    excludedSubredditNode.innerText = excludedSubreddit;

    var removalLink = document.createElement("a");
    removalLink.href = "#";
    removalLink.innerText = " X";
    removalLink.subreddit = excludedSubreddit;
    removalLink.addEventListener("click", removeExcludedSubreddit);
    excludedSubredditNode.appendChild(removalLink);

    excludedSubredditsNode.appendChild(excludedSubredditNode);
  }
}

function removeExcludedSubreddit() {
  var excludedSubredditIndex = excludedSubreddits.indexOf(this.subreddit);
  if(excludedSubredditIndex >= 0) {
    excludedSubreddits.splice(excludedSubredditIndex, 1);
    this.parentNode.parentNode.removeChild(this.parentNode);
  }
}

function buildPage() {
  document.getElementById("versiontext").innerText = browser.i18n.getMessage("options_label_title") + ",";
  document.getElementById("version").innerText = browser.i18n.getMessage("options_label_version") + " " + browser.runtime.getManifest().version;

  document.querySelector("label[for='hiddenPostScoreThreshold']").innerText = browser.i18n.getMessage("options_label_hiddenPostScoreThreshold");
  document.querySelector("label[for='hiddenCommentScoreThreshold']").innerText = browser.i18n.getMessage("options_label_hiddenCommentScoreThreshold");

  document.querySelector("label[for='defaultDisplayAction']").innerText = browser.i18n.getMessage("options_label_defaultDisplayAction");
  document.querySelector("option[value='royt']").innerText = browser.i18n.getMessage("options_label_royt");
  document.querySelector("option[value='gplus']").innerText = browser.i18n.getMessage("options_label_gplus");

  document.querySelector("label[for='showGooglePlusWhenNoPosts']").innerText = browser.i18n.getMessage("options_label_showGooglePlusWhenNoPosts");
  document.querySelector("label[for='showGooglePlusButton']").innerText = browser.i18n.getMessage("options_label_showGooglePlusButton");

  document.querySelector("label[for='addSubredditForExclusion']").innerText = browser.i18n.getMessage("options_label_hide_following");
  document.getElementById("addSubredditToList").innerText = browser.i18n.getMessage("options_button_add");

  document.getElementById("submit").innerText = browser.i18n.getMessage("post_button_save");
  document.getElementById("reset").innerText = browser.i18n.getMessage("options_label_reset");

  restoreOptions();
}

document.addEventListener("DOMContentLoaded", buildPage);
document.getElementById("submit").addEventListener("click", saveOptions);
document.getElementById("reset").addEventListener("click", restoreOptions);
document.getElementById("addSubredditToList").addEventListener("click", submitAddExcludedSubreddit);

"use strict";

const overlayStyle = `.overlay {
  position: fixed; /* Sit on top of the page content */
  display: none; /* Hidden by default */
  width: 100%; /* Full width (cover the whole page) */
  height: 100%; /* Full height (cover the whole page) */
  top: 0; 
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5); /* Black background with opacity */
  z-index: 2; /* Specify a stack order in case you're using a different order for other elements */
  cursor: pointer; /* Add a pointer on hover */
}`;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // listen for messages sent from background.js
  if (request.message === "hello!") {
    const videoId = getUrlVars(request.url)["v"];
    console.log(videoId);
    getVideoCategory(videoId).then(
      function(response) {
        console.log("Success!", response);
        chrome.storage.sync.get("categories", function(data) {
          if (data.categories.includes(response)) {
            const player = document.getElementById("player");
            stopVideo(player);
            var sheet = window.document.styleSheets[0];
            sheet.insertRule(overlayStyle, sheet.cssRules.length);
            player.className += player.className ? " overlay" : "overlay";
            console.log('I tried')
          }
        });
      },
      function(error) {
        console.error("Failed!", error);
      }
    );
  }
});

var stopVideo = function(element) {
  var iframe = element.querySelector("iframe");
  var video = element.querySelector("video");
  if (iframe) {
    var iframeSrc = iframe.src;
    iframe.src = iframeSrc;
  }
  if (video) {
    video.pause();
  }
};

function buildUrl(url, parameters) {
  var qs = "";
  for (var key in parameters) {
    var value = parameters[key];
    qs += encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&";
  }
  if (qs.length > 0) {
    qs = qs.substring(0, qs.length - 1); //chop off last "&"
    url = url + "?" + qs;
  }
  return url;
}

function getUrlVars(url) {
  var vars = {};
  var parts = url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
    vars[key] = value;
  });
  return vars;
}

function getVideoCategory(videoId) {
  // Return a new promise.
  return new Promise(function(resolve, reject) {
    // Do the usual XHR stuff
    var req = new XMLHttpRequest();

    const parameters = {
      part: "snippet",
      id: videoId,
      key: "AIzaSyCVY2qLQSlhuWdEdrxG3YCECIg0OUQj2z8"
    };

    const url = "https://www.googleapis.com/youtube/v3/videos";
    const fullUrl = buildUrl(url, parameters);

    req.open("GET", fullUrl);

    req.onload = function() {
      // This is called even on 404 etc
      // so check the status
      if (req.status == 200) {
        // Resolve the promise with the response text
        const obj = req.responseText;
        const json = JSON.parse(obj);
        resolve(json.items[0].snippet.categoryId);
      } else {
        // Otherwise reject with the status text
        // which will hopefully be a meaningful error
        reject(Error(req.statusText));
      }
    };

    // Handle network errors
    req.onerror = function() {
      reject(Error("Network Error"));
    };

    // Make the request
    req.send();
  });
}

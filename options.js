// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

"use strict";

let checkPage = document.getElementById("buttonDiv");
let chosenCategories = [];

getCategories().then(
  function(response) {
    constructChecks(response);
    console.log("Success!", response);
  },
  function(error) {
    console.error("Failed!", error);
  }
);

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

function getCategories() {
  // Return a new promise.
  return new Promise(function(resolve, reject) {
    // Do the usual XHR stuff
    var req = new XMLHttpRequest();

    const parameters = {
      part: "snippet",
      regionCode: "US",
      key: "AIzaSyCVY2qLQSlhuWdEdrxG3YCECIg0OUQj2z8"
    };

    const url = "https://www.googleapis.com/youtube/v3/videoCategories";
    const fullUrl = buildUrl(url, parameters);

    req.open("GET", fullUrl);

    req.onload = function() {
      // This is called even on 404 etc
      // so check the status
      if (req.status == 200) {
        // Resolve the promise with the response text
        const categories = [];
        const obj = req.responseText;
        const json = JSON.parse(obj);

        json.items.forEach(element => {
          categories.push(element);
        });

        resolve(categories);
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

function setAttributes(elem, obj) {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      elem[prop] = obj[prop];
    }
  }
}

function constructChecks(categories) {
  var ul = document.createElement("ul");

  checkPage.appendChild(ul);

  const checkbox = [];

  categories.forEach(element => {
    const newCheckbox = document.createElement("input");
    setAttributes(newCheckbox, {
      type: "checkbox",
      name: element.snippet.title,
      value: element.snippet.title,
      id: element.id
    });

    chrome.storage.sync.get("categories", function(data) {
      if (data.categories) {
        if (data.categories.includes(element.id)) {
          newCheckbox.checked = true;
        }
      }
    });

    const label = document.createElement("label");
    label.htmlFor = "id";
    label.appendChild(document.createTextNode(element.snippet.title));

    const li = document.createElement("li");
    li.appendChild(newCheckbox);
    li.appendChild(label);

    ul.style.listStyle = "none";
    ul.appendChild(li);

    checkbox.push(newCheckbox);
  });

  for (var i = 0; i < checkbox.length; i++) {
    checkbox[i].addEventListener(
      "click",
      function(event) {
        if (event.target.checked == true) {
          chosenCategories.push(event.target.id);
          chrome.storage.sync.set({ categories: chosenCategories }, function() {
            console.log("the categories are " + chosenCategories.toString());
          });
        } else {
          if (chosenCategories.includes(event.target.id)) {
            chosenCategories.splice(chosenCategories.indexOf(event.target.id), 1);
            chrome.storage.sync.set(
              { categories: chosenCategories },
              function() {
                console.log(
                  "the categories are " + chosenCategories.toString()
                );
              }
            );
          }
        }
      },
      true
    );
  }
}

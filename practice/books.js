"use strict";

(() => {
  const entry = new URLSearchParams(location.hash.slice(1));
  const returnPages = new Map([
    ["lecture", ["lecture.html", "地图讲堂"]],
    ["timeline", ["kaoyan-review.html", "时间轴"]],
    ["meetings", ["meetings.html", "会议对比"]]
  ]);
  const source = entry.get("from");
  const [returnPage, returnLabel] = returnPages.get(source) || returnPages.get("lecture");
  const returnLink = document.getElementById("practice-return");
  const returnHash = new URLSearchParams(returnPages.has(source) ? entry.get("resume") : "");
  if (returnPage === "lecture.html" && !returnHash.has("node")) {
    try {
      const last = JSON.parse(sessionStorage.getItem("kaoyan.study.return.v7"));
      if (/^s\d{2}$/.test(last?.id)) {
        returnHash.set("node", last.id);
        if (Number(last.time) > 0) returnHash.set("t", Number(last.time).toFixed(2));
      }
    } catch {
      // Keep the map link available when the browser blocks local storage.
    }
  }
  returnLink.href = "../" + returnPage + (returnHash.size ? "#" + returnHash : "");
  returnLink.textContent = "返回" + returnLabel;
  for (const book of document.querySelectorAll(".practice-book")) {
    const bookURL = new URL(book.href);
    bookURL.hash = location.hash;
    book.href = bookURL.href;
  }
})();

import axios from 'axios'
import('../scss/styles.scss');

const urlsElement = document.getElementById("urls") as HTMLDivElement;
const searchBar = document.getElementById("search-bar") as HTMLInputElement;

interface CrawledData {
    url: string;
    title: string;
    description: string;
}

let baseURL = "/api";
if (Number(window.location.port) == 8080) baseURL = "http://192.168.50.120:3000/api";

searchBar.addEventListener("input", () => {
    let searchQuery = searchBar.value.toLowerCase();
    if (searchQuery.length == 0) return
    let crawled_data: CrawledData[];
    axios
    .get(baseURL + `/search/${encodeURIComponent(searchQuery)}`)
    .then((response) => {
        crawled_data = response.data;
        renderUrls(crawled_data);
    })
    .catch((error) => {
        console.error("Error fetching data:", error);
    });
});

function renderUrls(data: CrawledData[]) {
    urlsElement.innerHTML = "";
    data.forEach((item) => {
        let link = document.createElement("a");
        link.href = item.url;
        link.innerHTML = item.title;
        link.classList.add("list-group-item", "list-group-item-action");
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
        let listItem = document.createElement("p");
        listItem.innerHTML = item.description;
        listItem.style.fontSize = "12px";
        link.appendChild(listItem);
        urlsElement.appendChild(link);
    });
}
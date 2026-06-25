const bridgeUrl = "http://127.0.0.1:17383";
const categorySelect = document.querySelector("#categorySelect");
const saveButton = document.querySelector("#saveButton");
const statusText = document.querySelector("#statusText");

loadCategories();
saveButton.addEventListener("click", saveCurrentWindow);

async function loadCategories() {
  try {
    const response = await fetch(`${bridgeUrl}/categories`);
    const payload = await response.json();
    categorySelect.replaceChildren(
      ...payload.categories.map((category) => {
        const option = document.createElement("option");
        option.value = category.id;
        option.textContent = category.name;
        return option;
      })
    );
    statusText.textContent = "Ready.";
  } catch {
    statusText.textContent = "DeskPilot is not reachable.";
  }
}

async function saveCurrentWindow() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const response = await fetch(`${bridgeUrl}/capture`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      categoryId: categorySelect.value,
      tabs: tabs.map((tab) => ({
        title: tab.title || tab.url,
        url: tab.url
      }))
    })
  });
  const payload = await response.json();
  statusText.textContent = `Saved ${payload.savedCount} tabs.`;
}

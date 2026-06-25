const bridgeUrl = "http://127.0.0.1:17383";
const categorySelect = document.querySelector("#categorySelect");
const closeAfterSave = document.querySelector("#closeAfterSave");
const saveButton = document.querySelector("#saveButton");
const statusText = document.querySelector("#statusText");

loadCategories();
saveButton.addEventListener("click", saveCurrentWindow);

async function loadCategories() {
  saveButton.disabled = true;
  statusText.textContent = "Connecting to DeskPilot.";

  try {
    const response = await fetch(`${bridgeUrl}/categories`);
    const payload = await response.json();
    const categories = Array.isArray(payload.categories) ? payload.categories : [];

    if (!response.ok) {
      throw new Error(payload.error || "DeskPilot rejected the request.");
    }

    categorySelect.replaceChildren(
      ...categories.map((category) => {
        const option = document.createElement("option");
        option.value = category.id;
        option.textContent = category.name;
        return option;
      })
    );

    saveButton.disabled = categories.length === 0;
    statusText.textContent = categories.length > 0 ? "Ready." : "No DeskPilot categories found.";
  } catch (error) {
    statusText.textContent = error instanceof Error ? error.message : "DeskPilot is not reachable.";
  }
}

async function saveCurrentWindow() {
  saveButton.disabled = true;
  statusText.textContent = "Saving current window.";

  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const saveableTabs = tabs.filter((tab) => tab.url && /^https?:\/\//.test(tab.url));

    if (saveableTabs.length === 0) {
      statusText.textContent = "No http or https tabs to save.";
      return;
    }

    const response = await fetch(`${bridgeUrl}/capture`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        categoryId: categorySelect.value,
        tabs: saveableTabs.map((tab) => ({
          title: tab.title || tab.url,
          url: tab.url
        }))
      })
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "DeskPilot could not save this window.");
    }

    if (closeAfterSave.checked) {
      const tabIds = saveableTabs.map((tab) => tab.id).filter((id) => typeof id === "number");
      await chrome.tabs.remove(tabIds);
    }

    statusText.textContent = closeAfterSave.checked
      ? `Saved and closed ${payload.savedCount} tabs.`
      : `Saved ${payload.savedCount} tabs.`;
  } catch (error) {
    statusText.textContent = error instanceof Error ? error.message : "Could not save this browser window.";
  } finally {
    saveButton.disabled = categorySelect.options.length === 0;
  }
}

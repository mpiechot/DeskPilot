const bridgeUrl = "http://127.0.0.1:17383";
const categorySelect = document.querySelector("#categorySelect");
const closeAfterSave = document.querySelector("#closeAfterSave");
const captureModeInputs = document.querySelectorAll("input[name='captureMode']");
const saveCurrentTabButton = document.querySelector("#saveCurrentTabButton");
const saveCurrentWindowButton = document.querySelector("#saveCurrentWindowButton");
const openDeskPilotButton = document.querySelector("#openDeskPilotButton");
const retryButton = document.querySelector("#retryButton");
const statusText = document.querySelector("#statusText");

loadCategories();
saveCurrentTabButton.addEventListener("click", saveCurrentTab);
saveCurrentWindowButton.addEventListener("click", saveCurrentWindow);
openDeskPilotButton.addEventListener("click", openDeskPilot);
retryButton.addEventListener("click", loadCategories);

async function loadCategories() {
  setSaveActionsDisabled(true);
  openDeskPilotButton.disabled = true;
  statusText.textContent = "Connecting to DeskPilot.";

  try {
    const response = await fetch(`${bridgeUrl}/categories`);
    const payload = await response.json();
    const categories = Array.isArray(payload.categories) ? payload.categories : [];

    if (!response.ok) {
      throw new Error(payload.error || "DeskPilot rejected the request.");
    }

    if (categories.length === 0) {
      categorySelect.replaceChildren();
      setSaveActionsDisabled(true);
      openDeskPilotButton.disabled = false;
      statusText.textContent = "No DeskPilot categories found.";
      return;
    }

    categorySelect.replaceChildren(
      ...categories.map((category) => {
        const option = document.createElement("option");
        option.value = category.id;
        option.textContent = category.name;
        return option;
      })
    );

    if (typeof payload.activeCategoryId === "string" && categories.some((category) => category.id === payload.activeCategoryId)) {
      categorySelect.value = payload.activeCategoryId;
    }

    setSaveActionsDisabled(false);
    openDeskPilotButton.disabled = false;
    statusText.textContent = "";
  } catch (error) {
    setSaveActionsDisabled(true);
    statusText.textContent = error instanceof Error ? error.message : "DeskPilot is not reachable.";
  }
}

async function saveCurrentTab() {
  if (!categorySelect.value) {
    statusText.textContent = "No DeskPilot categories found.";
    return;
  }

  setSaveActionsDisabled(true);
  statusText.textContent = "Saving current tab.";

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];

    if (!tab?.url || !isSaveableUrl(tab.url)) {
      statusText.textContent = "This browser page cannot be saved.";
      return;
    }

    const payload = await postCurrentTab(tab, false);

    if (payload.confirmationRequired) {
      const confirmed = window.confirm(crossCategoryPrompt(payload));

      if (!confirmed) {
        statusText.textContent = "Not saved.";
        return;
      }

      statusText.textContent = describeCurrentTabResult(await postCurrentTab(tab, true));
      return;
    }

    statusText.textContent = describeCurrentTabResult(payload);
  } catch (error) {
    statusText.textContent = error instanceof Error ? error.message : "Could not save this browser tab.";
  } finally {
    setSaveActionsDisabled(categorySelect.options.length === 0);
  }
}

async function saveCurrentWindow() {
  if (!categorySelect.value) {
    statusText.textContent = "No DeskPilot categories found.";
    return;
  }

  setSaveActionsDisabled(true);
  statusText.textContent = "Saving current window.";

  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const saveableTabs = tabs.filter((tab) => tab.url && /^https?:\/\//.test(tab.url));

    if (tabs.length === 0) {
      statusText.textContent = "This browser window has no tabs.";
      return;
    }

    let payload = await postCurrentWindow(tabs, undefined);

    if (payload.confirmationRequired) {
      const confirmed = window.confirm(crossCategoryPrompt(payload));
      payload = await postCurrentWindow(tabs, confirmed);
    }

    if (closeAfterSave.checked) {
      const savedUrls = new Set(Array.isArray(payload.savedUrls) ? payload.savedUrls : []);
      const tabIds = saveableTabs
        .filter((tab) => tab.url && savedUrls.has(tab.url))
        .map((tab) => tab.id)
        .filter((id) => typeof id === "number");
      if (tabIds.length > 0) {
        await chrome.tabs.remove(tabIds);
      }
    }

    statusText.textContent = describeWindowResult(payload, closeAfterSave.checked);
  } catch (error) {
    statusText.textContent = error instanceof Error ? error.message : "Could not save this browser window.";
  } finally {
    setSaveActionsDisabled(categorySelect.options.length === 0);
  }
}

async function postCurrentTab(tab, allowCrossCategoryDuplicate) {
  return postJson("/tabs/current/save", {
    categoryId: categorySelect.value,
    allowCrossCategoryDuplicate,
    tab: {
      title: tab.title || tab.url,
      url: tab.url
    }
  });
}

async function postCurrentWindow(tabs, allowCrossCategoryDuplicates) {
  return postJson("/windows/current/save", {
    categoryId: categorySelect.value,
    allowCrossCategoryDuplicates,
    mode: selectedCaptureMode(),
    tabs: tabs.map((tab) => ({
      title: tab.title || tab.url,
      url: tab.url
    }))
  });
}

async function postJson(path, body) {
  const response = await fetch(`${bridgeUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const payload = await response.json();

  if (!response.ok && response.status !== 409) {
    throw new Error(payload.error || "DeskPilot rejected the request.");
  }

  return payload;
}

async function openDeskPilot() {
  openDeskPilotButton.disabled = true;

  try {
    await postJson("/app/show", {});
    statusText.textContent = "DeskPilot opened.";
  } catch (error) {
    statusText.textContent = error instanceof Error ? error.message : "DeskPilot is not reachable.";
  } finally {
    openDeskPilotButton.disabled = false;
  }
}

function selectedCaptureMode() {
  const checkedInput = Array.from(captureModeInputs).find((input) => input.checked);
  return checkedInput?.value === "replace" ? "replace" : "append";
}

function setSaveActionsDisabled(disabled) {
  saveCurrentTabButton.disabled = disabled;
  saveCurrentWindowButton.disabled = disabled;
}

function isSaveableUrl(url) {
  return /^https?:\/\//i.test(url);
}

function selectedCategoryName() {
  return categorySelect.selectedOptions[0]?.textContent || "DeskPilot";
}

function crossCategoryPrompt(payload) {
  const names = Array.isArray(payload.duplicateCategoryNames) ? payload.duplicateCategoryNames.join(", ") : "another category";
  return `Already saved in ${names}. Save to ${selectedCategoryName()} too?`;
}

function describeCurrentTabResult(payload) {
  if (payload.skippedSameCategoryDuplicateCount > 0) {
    return `Already saved in ${selectedCategoryName()}.`;
  }

  if (payload.restoredCount > 0) {
    return `Restored in ${selectedCategoryName()}.`;
  }

  if (payload.savedCount > 0) {
    return `Saved to ${selectedCategoryName()}.`;
  }

  return "No tab saved.";
}

function describeWindowResult(payload, closedSavedTabs) {
  const parts = [];
  const savedCount = Number(payload.savedCount || 0);
  const skippedSame = Number(payload.skippedSameCategoryDuplicateCount || 0);
  const skippedCross = Number(payload.skippedCrossCategoryDuplicateCount || 0);
  const skippedUnsupported = Number(payload.skippedUnsupportedCount || 0);

  parts.push(savedCount > 0 ? `Saved ${savedCount}` : "No new tabs saved");

  if (skippedSame > 0) {
    parts.push(`Skipped ${skippedSame} duplicate${skippedSame === 1 ? "" : "s"}`);
  }

  if (skippedCross > 0) {
    parts.push(`Skipped ${skippedCross} saved elsewhere`);
  }

  if (skippedUnsupported > 0) {
    parts.push(`Skipped ${skippedUnsupported} browser page${skippedUnsupported === 1 ? "" : "s"}`);
  }

  if (closedSavedTabs && savedCount > 0) {
    parts.push("Closed saved tabs");
  }

  return `${parts.join(". ")}.`;
}

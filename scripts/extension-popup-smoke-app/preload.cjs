globalThis.__deskPilotSmokeRequests = [];

globalThis.fetch = async (input, init = {}) => {
  const url = String(input);
  globalThis.__deskPilotSmokeRequests.push({
    url,
    method: init.method || "GET",
    body: init.body || null
  });

  if (url === "http://127.0.0.1:17383/categories") {
    return jsonResponse(200, {
      categories: [{ id: "work", name: "Work" }],
      activeCategoryId: "work",
      dataProfile: { id: "productive", label: "Productive" }
    });
  }

  if (url === "http://127.0.0.1:17383/tabs/current/save") {
    return jsonResponse(200, {
      savedCount: 1,
      restoredCount: 0,
      skippedSameCategoryDuplicateCount: 0,
      skippedCrossCategoryDuplicateCount: 0,
      skippedUnsupportedCount: 0,
      confirmationRequired: false,
      duplicateCategoryNames: [],
      savedUrls: ["https://example.com/productive-trial"]
    });
  }

  throw new Error(`Unexpected DeskPilot extension request: ${url}`);
};

globalThis.chrome = {
  tabs: {
    query: async () => [
      {
        id: 42,
        title: "Productive trial",
        url: "https://example.com/productive-trial"
      }
    ],
    remove: async () => undefined
  }
};

globalThis.confirm = () => true;

function jsonResponse(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload
  };
}

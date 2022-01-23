function waitSelector(selector) {
  return new Promise((resolve) => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            const element = node.querySelector(selector);
            if (element) {
              observer.disconnect();
              resolve(element);
              return;
            }
          }
        }
      }
    });
    observer.observe(document, {
      subtree: true,
      childList: true,
    });
  });
}

function waitAttributeChanged(element, attribute) {
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      observer.disconnect();
      resolve();
    });
    observer.observe(element, {
      attributeFilter: [attribute],
    });
  });
}

class GoogleMeetTools {
  meetingStarted = false;

  start() {
    // Confirm before leaving the meeting
    (async () => {
      const leaveButton = await waitSelector('[aria-label="Leave call"]');

      // Update meeting state
      this.meetingStarted = true;
      chrome.runtime.sendMessage({ type: "meeting_started" });

      leaveButton.addEventListener("click", (e) => {
        if (!e.isTrusted) {
          // Ignore programmatic clicks (from other extensions)
          return;
        }

        const confirmed = confirm(
          "Are you sure you want to leave the meeting?"
        );
        if (!confirmed) {
          // Block button press
          e.stopImmediatePropagation();
        }
      });
    })();

    // Confirm window close
    window.addEventListener("beforeunload", (e) => {
      // Don't confirm if the meeting hasn't been joined yet
      if (!this.meetingStarted) {
        return;
      }

      // Block Google Meet's own beforeunload handler
      e.stopImmediatePropagation();

      // https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload
      e.returnValue = "";
    });

    // Mute microphone
    (async () => {
      const muteButton = await waitSelector(
        '[aria-label^="Turn off microphone"],[aria-label^="Turn on microphone"]'
      );

      // Wait until ready
      await waitAttributeChanged(muteButton, "data-is-muted");

      // Skip if already muted
      if (muteButton.getAttribute("data-is-muted") !== "false") {
        return;
      }

      muteButton.click();
    })();

    // Turn off camera
    (async () => {
      const cameraButton = await waitSelector(
        '[aria-label^="Turn off camera"]'
      );

      // Wait until ready
      await waitAttributeChanged(cameraButton, "data-is-muted");

      cameraButton.click();
    })();

    // Turn on captions
    (async () => {
      const captionsButton = await waitSelector(
        '[aria-label^="Turn on captions"]'
      );

      // Click immediately, don't need to wait
      captionsButton.click();
    })();
  }
}

const tools = new GoogleMeetTools();
tools.start();

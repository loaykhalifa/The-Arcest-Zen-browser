// close-tab-on-empty-back.uc.js - Simple and reliable Mac trackpad fix
(function() {
    "use strict";

    if (window.backbuttonCloseTab) return;
    window.backbuttonCloseTab = true;

    let isRemovingTab = false;
    let isNavigating = false;
    
    // Simple approach: just use a longer cooldown
    let lastActionTime = 0;
    const SIMPLE_COOLDOWN = 2000; // 2 seconds between ANY trackpad actions

    function shouldCloseTab() {
        if (gBrowser.selectedTab.pinned || isRemovingTab) {
            return false;
        }
        
        let browser = gBrowser.selectedBrowser;
        let webNav = browser.webNavigation;
        
        return !webNav.canGoBack;
    }

    function closeTabIfNoHistory() {
        if (shouldCloseTab()) {
            isRemovingTab = true;
            gBrowser.removeCurrentTab();
            setTimeout(() => {
                isRemovingTab = false;
            }, 500);
            return true;
        }
        return false;
    }

    // Keyboard shortcut works fine - no changes needed
    window.addEventListener("keydown", (event) => {
        if (event.altKey && event.key === "ArrowLeft") {
            if (shouldCloseTab()) {
                closeTabIfNoHistory();
                event.preventDefault();
                event.stopPropagation();
            }
        }
    }, true);

    // Back button clicks work fine - no changes needed
    function attachBackButtonListener() {
        const backButton = document.getElementById("back-button");
        if (backButton) {
            backButton.addEventListener("click", (event) => {
                if (shouldCloseTab()) {
                    closeTabIfNoHistory();
                    event.preventDefault();
                    event.stopPropagation();
                }
            }, true);
        } else {
            const altBackButton = document.querySelector("toolbarbutton[command='Browser:Back']");
            if (altBackButton) {
                altBackButton.addEventListener("click", (event) => {
                    if (shouldCloseTab()) {
                        closeTabIfNoHistory();
                        event.preventDefault();
                        event.stopPropagation();
                    }
                }, true);
            }
        }
    }

    // Super simple trackpad: only act once every 2 seconds
    window.addEventListener("wheel", (event) => {
        const target = event.target;
        const appContentWrapper = document.getElementById("zen-appcontent-wrapper");
        
        // Only process in the content area
        if (!appContentWrapper || !appContentWrapper.contains(target)) {
            return;
        }
        
        // Only care about left swipes
        if (event.deltaX < -200) {
            const now = Date.now();
            
            // Simple check: has it been 2 seconds since last action?
            if (now - lastActionTime < SIMPLE_COOLDOWN) {
                // Too soon - block it
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            
            // OK to act - update timestamp
            lastActionTime = now;
            
            if (shouldCloseTab()) {
                closeTabIfNoHistory();
                event.preventDefault();
                event.stopPropagation();
            } else {
                // Go back just once
                let browser = gBrowser.selectedBrowser;
                if (browser.webNavigation.canGoBack) {
                    isNavigating = true;
                    browser.webNavigation.goBack();
                    
                    setTimeout(() => {
                        isNavigating = false;
                    }, 500);
                    
                    event.preventDefault();
                    event.stopPropagation();
                }
            }
        }
    }, true);

    // Alternative back command listener
    window.addEventListener("command", (event) => {
        if (event.target && event.target.id === "Browser:Back") {
            if (shouldCloseTab()) {
                closeTabIfNoHistory();
                event.preventDefault();
                event.stopPropagation();
            }
        }
    }, true);

    // Initialize
    if (document.readyState === "complete") {
        attachBackButtonListener();
    } else {
        window.addEventListener("load", attachBackButtonListener, false);
    }

    console.log("BackButton CloseTab script loaded - Simple 2-second cooldown for trackpad");
})();
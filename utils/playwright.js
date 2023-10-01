import playwright from 'playwright';

const getBrowser = async () => {
    const browser = await playwright.chromium.launch();
    return browser;
}

const getBrowserPage = async (browser) => {
    const page = await browser.newPage();
    return page;
};

const closeBrowser = async (browser) => {
    await browser.close();
}

const closePage = async (page) => {
    await page.close();
}

const closeAll = async (browser, page) => {
    await closePage(page);
    await closeBrowser(browser);
}

export { 
    getBrowser, 
    getBrowserPage, 
    closeBrowser, 
    closePage, 
    closeAll
}

import { normalizeDate } from '../date-time.js';
import { readExcelFromFile } from '../excel-reader.js';
import { closeAll, getBrowser, getBrowserPage } from '../playwright.js';
import { emitEnrichmentAutomationFillLogBookError, emitEnrichmentAutomationFillLogBookStatus, emitEnrichmentAutomationFillLogBookSuccess } from '../socket.js';

const enrichment_web =
  'https://enrichment.apps.binus.ac.id/Login/Student/Login';
const emailInputPlaceholder = 'Email, phone, or Skype';
const passwordInputPlaceholder = 'Password';

const loginEnrichmentPage = async (page, email, password) => {
  await page.goto(enrichment_web);
  await page.click('#btnLogin');
  await page.getByPlaceholder(emailInputPlaceholder).fill(email);
  await page.click('input[type=submit]');
  await page.getByPlaceholder(passwordInputPlaceholder).fill(password);
  await page.click('input[type=submit]');
  await page.click('input[type=submit]');
};

const navigateToEnrichmentLandingPage = async (page) => {
  await page.waitForURL('https://enrichment.apps.binus.ac.id/Dashboard');
  await page.waitForLoadState('networkidle');
};

const changeEnrichmentTerm = async (page, periodSemester) => {
  const selectTerms = page.locator('select');
  const selectTermsOptions = selectTerms.locator('option');
  const selectTermsOptionsCount = await selectTermsOptions.count();
  // await selectTerms.selectOption({
  //   index: selectTermsOptionsCount - 1 //select latest term
  // });
  await selectTerms.selectOption({
    value: `${periodSemester}` //select to selected term
  });
};

const navigateToLogBookPage = async (page) => {
  await page.getByText('Go to Activity Enrichment Apps').click();

  //Activity Enrichment Page
  await page.waitForURL(
    'https://activity-enrichment.apps.binus.ac.id/LearningPlan/StudentIndex'
  );
  await page.click('#btnLogBook');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000)
};

const fillSingleEntry = async ({ socket = undefined, page, dataEntries, dataEntryIndex, data, header }) => {
  const dataEntry = dataEntries.nth(dataEntryIndex);
  const dataEntryColumns = dataEntry.locator('td');
  const action = await dataEntryColumns.nth(6).innerText();
  if (action.toLocaleLowerCase() === 'entry') {
    const dateString = await dataEntryColumns.nth(0).innerText();
    emitEnrichmentAutomationFillLogBookStatus(socket, `Filling entry for ${dateString}`);
    const dateObj = new Date(dateString);
    normalizeDate(dateObj);
    const matchData = data.filter((d) => {
      return d[header[1]] / 1 === dateObj / 1;
    })[0];

    await dataEntry.getByRole('button', { name: 'ENTRY' }).click();

    if (matchData) {
      const clockInDate = matchData['Clock In'];
      await page.click('#editClockIn'); //trigger time picker popup to open
      const selectHourPicker = page.locator('.ui_tpicker_hour_slider > select');

      await selectHourPicker.selectOption('0'); //reset picker

      await selectHourPicker.selectOption(`${clockInDate.getHours()}`);
      const selectMinutePicker = page.locator(
        '.ui_tpicker_minute_slider > select'
      );
      await selectMinutePicker.selectOption(`${clockInDate.getMinutes()}`);
      const datePickerButtonPaneLocator = page.locator(
        '#ui-datepicker-div > .ui-datepicker-buttonpane'
      );
      await datePickerButtonPaneLocator
        .getByRole('button', { name: 'Done' })
        .click();

      const clockOutDate = matchData['Clock Out'];
      await page.click('#editClockOut');

      await selectHourPicker.selectOption('0'); //reset picker

      await selectHourPicker.selectOption(`${clockOutDate.getHours()}`);
      await selectMinutePicker.selectOption(`${clockOutDate.getMinutes()}`);
      await datePickerButtonPaneLocator
        .getByRole('button', { name: 'Done' })
        .click();

      const activity = matchData[header[4]]
      await page.fill('#editActivity', activity);

      const getNote = (note) => {
        if (note) {
          return `\n${note}`;
        }
        return '';
      };
      const description =
        (matchData[header[5]] || '') + getNote(matchData[header[6]]);
      await page.fill('#editDescription', description.length > 0 ? description : activity);
      await page.locator('#logBookEditPopup').getByText('Submit').click();
    } else {
      await page.locator('#logBookEditPopup').getByText('Off').click();
      await page.locator('#logBookEditPopup').getByText('Submit').click();
    }
  }
};

const fillLogBookByMonth = async ({ socket = undefined, page, month, data, header }) => {
  const monthTabs = page.locator('#monthTab > li')
  const monthTabsCount = await monthTabs.count()
  let monthTabAnchor;
  let validMonth = false;
  for (let m = 0; m < monthTabsCount; m++) {
    const monthTab = monthTabs.nth(m)
    const monthTabText = await monthTab.innerText()
    if (monthTabText.toLowerCase().includes(month.toLowerCase())) {
      monthTabAnchor = monthTab.locator('a')
      validMonth = true;
      break
    }
  }
  if (validMonth && monthTabAnchor) {
    await monthTabAnchor.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000)

    const dataEntries = page.locator('#logBookTable > tbody > tr');
    const dataEntriesCount = await dataEntries.count();
    emitEnrichmentAutomationFillLogBookStatus(socket, `Filling ${month} logbook`);
    for (let i = 0; i < dataEntriesCount; i++) {
      await fillSingleEntry({
        socket: socket,
        page: page,
        dataEntries: dataEntries,
        dataEntryIndex: i,
        data: data,
        header: header
      })
    }
    emitEnrichmentAutomationFillLogBookStatus(socket, `${month} logbook filled`);
  } else {
    emitEnrichmentAutomationFillLogBookStatus(socket, `${month} logbook isn't available in current term`);
  }
};

const fillLogBook = async ({ socket = undefined, fileBuffer, email, password, months, periodSemester }) => {
  const browser = await getBrowser();
  const page = await getBrowserPage(browser);

  try {
    emitEnrichmentAutomationFillLogBookStatus(socket, 'Starting logbook automation');
    const { data, header } = readExcelFromFile(fileBuffer);
    
    emitEnrichmentAutomationFillLogBookStatus(socket, 'Logging in...');
    await loginEnrichmentPage(page, email, password);
    emitEnrichmentAutomationFillLogBookStatus(socket, 'Logged in');
    emitEnrichmentAutomationFillLogBookStatus(socket, 'Navigating to enrichment landing page');
    await navigateToEnrichmentLandingPage(page);
    emitEnrichmentAutomationFillLogBookStatus(socket, 'Landed to enrichment landing page');
    emitEnrichmentAutomationFillLogBookStatus(socket, 'Updating enrichment term');
    await changeEnrichmentTerm(page, periodSemester);
    emitEnrichmentAutomationFillLogBookStatus(socket, 'Enrichment term updated');
    emitEnrichmentAutomationFillLogBookStatus(socket, 'Navigating to logbook page');
    await navigateToLogBookPage(page);
    emitEnrichmentAutomationFillLogBookStatus(socket, 'Landed on logbook page');
    for (let i = 0; i < months.length; i++) {
      const month = months[i]
      await fillLogBookByMonth({
        socket: socket,
        page: page,
        month: month,
        data: data,
        header: header
      });
    }
    emitEnrichmentAutomationFillLogBookStatus(socket, 'Task done.');
    emitEnrichmentAutomationFillLogBookSuccess(socket)
  } catch (error) {
    console.log(error)
    emitEnrichmentAutomationFillLogBookError(socket)
  } finally {
    await closeAll(browser, page);
  }
};

export { fillLogBook };

import { readExcelFromFile } from "../excel-reader.js";
import { closeAll, getBrowser, getBrowserPage } from "../playwright.js";

const fillLogBook = async (filePath, email, password) => {
  const { data, header } = readExcelFromFile(filePath);
  const browser = await getBrowser();
  const page = await getBrowserPage(browser);

  const enrichment_web =
    'https://enrichment.apps.binus.ac.id/Login/Student/Login';
  const emailInputPlaceholder = 'Email, phone, or Skype';
  const passwordInputPlaceholder = 'Password';
  const selectedTerm = '2310';
  const desiredMonth = 'September';

  //Login
  await page.goto(enrichment_web);
  await page.click('#btnLogin');
  await page.getByPlaceholder(emailInputPlaceholder).fill(email);
  await page.click('input[type=submit]');
  await page.getByPlaceholder(passwordInputPlaceholder).fill(password);
  await page.click('input[type=submit]');
  await page.click('input[type=submit]');

  //Landing Enrichment Page
  //Select Term Odd Semester 2023/2024
  await page.waitForURL('https://enrichment.apps.binus.ac.id/Dashboard');
  await page.waitForLoadState('networkidle');

  //Select to Desired Term
  const selectTerms = page.locator('select');
  await selectTerms.selectOption(selectedTerm);
  await page.getByText('Go to Activity Enrichment Apps').click();

  //Activity Enrichment Page
  await page.waitForURL(
    'https://activity-enrichment.apps.binus.ac.id/LearningPlan/StudentIndex'
  );
  await page.click('#btnLogBook');

  //LogBook Page
  await page.getByRole('link', { name: desiredMonth }).click();
  const data_entries = page.locator('#logBookTable > tbody > tr');
  const data_entries_count = await data_entries.count();
  for (let i = 0; i < data_entries_count; i++) {
    const data_entry = data_entries.nth(i);
    const data_entry_columns = data_entry.locator('td');
    const action = await data_entry_columns.nth(6).innerText();

    if (action.toLocaleLowerCase() === 'entry') {
      const dateString = await data_entry_columns.nth(0).innerText();
      const dateObj = new Date(dateString);
      normalizeDate(dateObj);
      const match_data = data.filter((d) => {
        return d[header[1]] / 1 === dateObj / 1;
      })[0];

      await data_entry.getByRole('button', { name: 'ENTRY' }).click();

      if (match_data) {
        const clockInDate = match_data['Clock In'];
        await page.click('#editClockIn'); //trigger time picker popup to open
        const selectHourPicker = page.locator(
          '.ui_tpicker_hour_slider > select'
        );

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

        const clockOutDate = match_data['Clock Out'];
        await page.click('#editClockOut');

        await selectHourPicker.selectOption('0'); //reset picker

        await selectHourPicker.selectOption(`${clockOutDate.getHours()}`);
        await selectMinutePicker.selectOption(`${clockOutDate.getMinutes()}`);
        await datePickerButtonPaneLocator
          .getByRole('button', { name: 'Done' })
          .click();

        await page.fill('#editActivity', match_data[header[4]]);

        const getNote = (note) => {
          if (note) {
            return `\n${note}`;
          }
          return '';
        };
        const description =
          match_data[header[5]] ?? '' + getNote(match_data[header[6]]);
        await page.fill('#editDescription', description);
        await page.locator('#logBookEditPopup').getByText('Submit').click();
      } else {
        await page.locator('#logBookEditPopup').getByText('Off').click();
        await page.locator('#logBookEditPopup').getByText('Submit').click();
      }
    }
  }

  await closeAll(browser, page);
};

export { fillLogBook }
import os
import csv
import re
import time
import traceback
from datetime import datetime, timedelta

import pandas as pd
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from webdriver_manager.chrome import ChromeDriverManager

# Columns to keep (after normalizing headers). "From Date"/"Date" maps to "Timestamp", others match by prefix.
WANTED_COLUMNS = ["Timestamp", "PM2.5", "PM10", "NO2", "NH3", "SO2", "CO", "Ozone"]


def normalize_header(raw_header):
    """Strip unit postfixes and sort icons, map date columns -> 'Timestamp'. Returns None if column should be dropped."""
    # Strip sort indicator characters (⇅, ↑, ↓, etc.) and surrounding whitespace
    h = raw_header.strip()
    h = re.sub(r'[\u21c5\u2191\u2193\u21d5]+', '', h).strip()
    h_lower = h.lower()

    # Drop 'Date To' column (website uses "Date To", not "To Date")
    if "date to" in h_lower or "to date" in h_lower:
        return None

    # Any remaining date-like header becomes 'Timestamp' (e.g. "Date From", "From Date", "Timestamp")
    if "date" in h_lower or h_lower == "timestamp":
        return "Timestamp"

    # Strip anything in parentheses e.g. "PM2.5 (µg/m³)" -> "PM2.5"
    clean = re.sub(r'\s*\(.*?\)', '', h).strip()
    # Match against wanted column prefixes (skip Timestamp since we handle it above)
    for col in WANTED_COLUMNS:
        if col == "Timestamp":
            continue
        if clean.startswith(col):
            return col
    return None  # not a column we want



def get_last_recorded_date(filepath):
    """Return the last date in an existing CSV as a date object, or None."""
    try:
        df = pd.read_csv(filepath)
        if "Timestamp" in df.columns and len(df) > 0:
            last_date = pd.to_datetime(df["Timestamp"], format="%Y-%m-%d").max()
            return last_date.date()
    except Exception as e:
        print(f"  Could not read existing file: {e}")
    return None


def scrape_table_page(driver):
    """
    Scrape the current page of the table.
    Returns (headers_map, rows) where:
      - headers_map: dict of col_index -> normalized_col_name (only wanted ones)
      - rows: list of dicts {col_name: value}
    """
    table_xpath = "/html/body/app-root/app-continuous-station-status/div/div/app-advance-search/div[2]/div[3]/app-dynamic-table-view/div/div[1]/table"
    try:
        table = driver.find_element(By.XPATH, table_xpath)
    except Exception:
        print("  Table not found on page.")
        return {}, []

    # Parse headers
    headers_map = {}  # index -> normalized name
    try:
        header_cells = table.find_elements(By.XPATH, ".//thead/tr/th")
        for idx, th in enumerate(header_cells):
            raw = th.text.strip()
            normalized = normalize_header(raw)
            if normalized:
                headers_map[idx] = normalized
    except Exception as e:
        print(f"  Error reading headers: {e}")
        return {}, []

    if not headers_map:
        # Print raw headers for debugging
        try:
            header_cells = table.find_elements(By.XPATH, ".//thead/tr/th")
            raw_headers = [th.text.strip() for th in header_cells]
            print(f"  DEBUG - Raw headers found: {raw_headers}")
        except Exception:
            pass
        print("  No usable headers found.")
        return {}, []

    # Debug: print which columns were mapped
    print(f"  Headers mapped: { {v: k for k, v in headers_map.items()} }")
    rows = []
    try:
        body_rows = table.find_elements(By.XPATH, ".//tbody/tr")
        for tr in body_rows:
            cells = tr.find_elements(By.XPATH, "./td")
            row_data = {}
            for idx, col_name in headers_map.items():
                if idx < len(cells):
                    row_data[col_name] = cells[idx].text.strip()
            if row_data:
                rows.append(row_data)
    except Exception as e:
        print(f"  Error reading rows: {e}")

    return headers_map, rows


def has_next_page(driver):
    """Return True if the Next page button exists and is NOT disabled."""
    try:
        next_btn = driver.find_element(By.XPATH, "//button[@title='Next page']")
        return next_btn.is_enabled() and not next_btn.get_attribute("disabled")
    except Exception:
        return False


def click_next_page(driver, wait):
    """Click the Next page button and wait for table to refresh."""
    next_btn = driver.find_element(By.XPATH, "//button[@title='Next page']")
    driver.execute_script("arguments[0].click();", next_btn)
    time.sleep(2)  # Let the table re-render


def select_from_ng_select(driver, wait, ng_select_xpath, search_text):
    print(f"\n--- Selecting '{search_text}' ---")
    print(f"Locating ng-select at {ng_select_xpath}...")

    try:
        ng_select_el = driver.find_element(By.XPATH, ng_select_xpath)
    except:
        print("Could not find ng-select with absolute xpath. Falling back to tag name...")
        ng_select_els = driver.find_elements(By.TAG_NAME, "ng-select")
        if ng_select_els:
            ng_select_el = ng_select_els[0]
        else:
            raise Exception("No ng-select found!")

    print("Clicking the first div inside the ng-select...")
    ng_select_inner_el = ng_select_el.find_element(By.XPATH, "./div[1]")

    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", ng_select_inner_el)
    time.sleep(1)

    try:
        ActionChains(driver).move_to_element(ng_select_inner_el).click().perform()
    except:
        driver.execute_script("arguments[0].click();", ng_select_inner_el)

    time.sleep(2)

    print("Retrieving the ID of the ng-dropdown-panel element...")
    try:
        ng_dropdown_panel_el = ng_select_el.find_element(By.TAG_NAME, "ng-dropdown-panel")
        retrieved_id = ng_dropdown_panel_el.get_attribute("id")
    except Exception as e:
        print("Failed to find ng-dropdown-panel inside ng-select. Trying globally...")
        try:
            ng_dropdown_panel_el = driver.find_element(By.TAG_NAME, "ng-dropdown-panel")
            retrieved_id = ng_dropdown_panel_el.get_attribute("id")
        except Exception as ex:
            print(f"Failed to find ng-dropdown-panel: {ex}")
            retrieved_id = None

    if retrieved_id:
        print(f"Retrieved ID: {retrieved_id}")
        input_xpath = f"//*[@id='{retrieved_id}']/div[1]/input"
        print(f"Clicking input field with xpath: {input_xpath}")

        try:
            input_el = wait.until(EC.presence_of_element_located((By.XPATH, input_xpath)))
        except:
            print("Exact input xpath failed, falling back to finding any input inside the retrieved ID...")
            input_xpath_fallback = f"//*[@id='{retrieved_id}']//input"
            input_el = wait.until(EC.presence_of_element_located((By.XPATH, input_xpath_fallback)))

        try:
            ActionChains(driver).move_to_element(input_el).click().perform()
        except:
            driver.execute_script("arguments[0].click();", input_el)

        time.sleep(1)

        print(f"Typing '{search_text}'...")
        input_el.send_keys(search_text)
        time.sleep(2)

        print("Pressing DOWN and ENTER...")
        input_el.send_keys(Keys.ARROW_DOWN)
        time.sleep(0.5)
        input_el.send_keys(Keys.ENTER)
        print(f"'{search_text}' selected successfully.")
        time.sleep(1)
    else:
        raise Exception("Could not retrieve a valid ID from the ng-dropdown-panel.")

def set_date_range(driver, wait, start_date, end_date):
    """Open the date picker and set start_date -> end_date."""
    print(f"Setting date range: {start_date} -> {end_date}")

    # Click the date range input to open the picker
    date_input_xpath = "/html/body/app-root/app-continuous-station-status/div/div/app-advance-search/div[1]/div/div[2]/div[1]/input"
    date_input = wait.until(EC.element_to_be_clickable((By.XPATH, date_input_xpath)))
    driver.execute_script("arguments[0].click();", date_input)
    time.sleep(1)

    # Left calendar: set start month and click start day
    left_month_select_xpath = "/html/body/ngx-daterangepicker-bootstrap/div/div/calendar/div[1]/table/thead/tr[1]/th[2]/div[1]/select"
    left_month_dropdown = wait.until(EC.presence_of_element_located((By.XPATH, left_month_select_xpath)))
    Select(left_month_dropdown).select_by_visible_text(start_date.strftime("%b"))
    time.sleep(1)

    start_day_str = str(start_date.day)
    left_calendar_body_xpath = "/html/body/ngx-daterangepicker-bootstrap/div/div/calendar/div[1]/table/tbody"
    left_days = driver.find_elements(By.XPATH, f"{left_calendar_body_xpath}//td[not(contains(@class, 'off'))]/span")
    clicked_start = False
    for day in left_days:
        if day.text.strip() == start_day_str:
            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", day)
            driver.execute_script("arguments[0].click();", day)
            clicked_start = True
            break
    if not clicked_start:
        print(f"  Warning: Could not find start day {start_day_str} in left calendar.")
    time.sleep(1)

    # Right calendar: set end month and click end day
    right_month_select_xpath = "/html/body/ngx-daterangepicker-bootstrap/div/div/calendar/div[2]/table/thead/tr[1]/th[2]/div[1]/select"
    right_month_dropdown = wait.until(EC.presence_of_element_located((By.XPATH, right_month_select_xpath)))
    Select(right_month_dropdown).select_by_visible_text(end_date.strftime("%b"))
    time.sleep(1)

    end_day_str = str(end_date.day)
    right_calendar_body_xpath = "/html/body/ngx-daterangepicker-bootstrap/div/div/calendar/div[2]/table/tbody"
    right_days = driver.find_elements(By.XPATH, f"{right_calendar_body_xpath}//td[not(contains(@class, 'off'))]/span")
    clicked_end = False
    for day in right_days:
        if day.text.strip() == end_day_str:
            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", day)
            driver.execute_script("arguments[0].click();", day)
            clicked_end = True
            break
    if not clicked_end:
        print(f"  Warning: Could not find end day {end_day_str} in right calendar.")

    # Click Apply
    apply_btn_xpath = "/html/body/ngx-daterangepicker-bootstrap/div/actions/div/button"
    apply_btn = wait.until(EC.element_to_be_clickable((By.XPATH, apply_btn_xpath)))
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", apply_btn)
    time.sleep(1)
    driver.execute_script("arguments[0].click();", apply_btn)
    print("Date range set.")


def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))

    output_dir = os.path.join(base_dir, "downloaded_data")
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    print("Initializing Chrome WebDriver...")
    chrome_options = Options()
    chrome_options.add_argument("--start-maximized")

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)

    wait = WebDriverWait(driver, 20)

    try:
        # 1. Open the advanced search URL
        url = "https://airquality.cpcb.gov.in/ccr/#/continuous-stations/advance-search"
        print(f"Opening URL: {url}")
        driver.get(url)

        # 3. Wait for captcha
        print("\n[CAPTCHA WAITING] Please solve the captcha in the browser, then press ENTER here to continue automation...")
        input("Press ENTER when ready...")

        # 4. Select State: Maharashtra (once)
        print("\nSelecting State (Maharashtra)...")
        state_ng_select_xpath = "/html/body/app-root/app-continuous-station-status/div/div/app-advance-search/div[1]/div/div[2]/div[2]/app-dynamic-form/form/div/div[1]/div/ng-select"
        select_from_ng_select(driver, wait, state_ng_select_xpath, "maharashtra")

        # 5. Loop over cities and stations
        yesterday = (datetime.now() - timedelta(days=1)).date()
        csv_file = os.path.join(base_dir, "cpcb_city_station.csv")
        current_city = None
        first_time = True

        print("\nReading cities and stations from CSV...")
        with open(csv_file, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)

            for row in reader:
                city = row["City"]
                station = row["Station"]

                safe_city = "".join([c if c.isalnum() else "_" for c in city])
                safe_station = "".join([c if c.isalnum() else "_" for c in station])
                output_file = os.path.join(output_dir, f"{safe_city}_{safe_station}_2026.csv")

                print(f"\n=========================================")
                print(f"Processing City: {city}, Station: {station}")
                print(f"=========================================")

                # Check existing file & determine start date
                last_recorded_date = get_last_recorded_date(output_file)
                if last_recorded_date:
                    start_date = last_recorded_date + timedelta(days=1)
                    print(f"  Existing file found. Last recorded date: {last_recorded_date}. Resuming from {start_date}.")
                    if start_date > yesterday:
                        print(f"  Already up to date. Skipping.")
                        continue
                else:
                    start_date = datetime(2026, 1, 1).date()
                    print(f"  No existing file. Starting from Jan 1 2026.")

                # Set date range for this station
                set_date_range(driver, wait, start_date, yesterday)


                # City Selection
                city_xpath = "/html/body/app-root/app-continuous-station-status/div/div/app-advance-search/div[1]/div/div[2]/div[2]/app-dynamic-form/form/div/div[2]/div[1]/ng-select"
                if city != current_city:
                    print(f"City changed: {current_city} -> {city}. Selecting city...")
                    select_from_ng_select(driver, wait, city_xpath, city)
                    current_city = city
                else:
                    print(f"Same city ({city}), skipping city selection.")

                # Station Selection
                station_xpath = "/html/body/app-root/app-continuous-station-status/div/div/app-advance-search/div[1]/div/div[2]/div[2]/app-dynamic-form/form/div/div[3]/div/ng-select"
                select_from_ng_select(driver, wait, station_xpath, station)

                if first_time:
                    print("Clicking the specific parameter span (first time only)...")
                    span_xpath = "/html/body/app-root/app-continuous-station-status/div/div/app-advance-search/div[1]/div/div[2]/div[3]/div/span[6]"
                    span_el = wait.until(EC.element_to_be_clickable((By.XPATH, span_xpath)))
                    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", span_el)
                    time.sleep(1)
                    driver.execute_script("arguments[0].click();", span_el)

                # Submit search
                print("Clicking the submit/search button...")
                submit_btn_xpath = "/html/body/app-root/app-continuous-station-status/div/div/app-advance-search/div[1]/div/div[3]/button"
                submit_btn = wait.until(EC.element_to_be_clickable((By.XPATH, submit_btn_xpath)))
                driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", submit_btn)
                time.sleep(1)
                driver.execute_script("arguments[0].click();", submit_btn)
                time.sleep(3)

                if first_time:
                    print("Clicking the special one-time button...")
                    try:
                        one_time_btn_xpath = "/html/body/app-root/app-continuous-station-status/div/div/app-advance-search/div[2]/div[1]/div/button[1]"
                        one_time_btn = wait.until(EC.element_to_be_clickable((By.XPATH, one_time_btn_xpath)))
                        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", one_time_btn)
                        time.sleep(1)
                        driver.execute_script("arguments[0].click();", one_time_btn)
                        time.sleep(1)
                    except Exception as e:
                        print(f"Error clicking the special one-time button: {e}")

                    print("Setting page size to 100...")
                    try:
                        page_size_select_xpath = "/html/body/app-root/app-continuous-station-status/div/div/app-advance-search/div[2]/div[3]/app-dynamic-table-view/div/div[2]/div[2]/div[1]/select"
                        page_size_dropdown = wait.until(EC.presence_of_element_located((By.XPATH, page_size_select_xpath)))
                        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", page_size_dropdown)
                        Select(page_size_dropdown).select_by_visible_text("100")
                        time.sleep(2)
                    except Exception as e:
                        print(f"Error setting page size to 100: {e}")

                    first_time = False

                # Check if "No Response" panel is shown
                time.sleep(2)  # Give it a moment to load either table or no-response
                try:
                    no_response = driver.find_elements(By.XPATH, "//div[contains(text(), 'No Record Found')] | //*[@id='no-response-panel']")
                    if no_response and any(el.is_displayed() for el in no_response):
                        print("  No Response / No Record Found for this date range. Skipping.")
                        continue
                except:
                    pass

                # Always set page size to 100 after results load
                print("Setting page size to 100...")
                try:
                    page_size_select_xpath = "/html/body/app-root/app-continuous-station-status/div/div/app-advance-search/div[2]/div[3]/app-dynamic-table-view/div/div[2]/div[2]/div[1]/select"
                    page_size_dropdown = wait.until(EC.presence_of_element_located((By.XPATH, page_size_select_xpath)))
                    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", page_size_dropdown)
                    Select(page_size_dropdown).select_by_visible_text("100")
                    time.sleep(2)
                except Exception as e:
                    print(f"  Error setting page size to 100 (table might be missing): {e}")
                    # If we can't set page size, table is likely missing
                    print("  Skipping station due to missing table.")
                    continue

                # Scrape all pages for this station
                all_new_rows = []
                page_num = 1
                stop_early = False

                while True:
                    print(f"  Scraping page {page_num}...")
                    _, rows = scrape_table_page(driver)
                    print(f"  Found {len(rows)} rows on page {page_num}.")

                    for r in rows:
                        raw_date_str = r.get("Timestamp", "").strip()
                        if not raw_date_str:
                            continue
                        try:
                            # Website uses DD-MM-YYYY format (e.g. "08-01-2026 00:00")
                            row_date = pd.to_datetime(raw_date_str, dayfirst=True).date()
                            # Normalize date string to YYYY-MM-DD
                            r["Timestamp"] = row_date.strftime("%Y-%m-%d")
                        except Exception:
                            # Keep raw if parsing fails
                            row_date = None

                        if last_recorded_date and row_date and row_date <= last_recorded_date:
                            continue  # Skip already recorded rows

                        all_new_rows.append(r)

                    # Check if next page exists
                    if has_next_page(driver) and not stop_early:
                        click_next_page(driver, wait)
                        page_num += 1
                    else:
                        break

                print(f"  Total new rows collected for {city}/{station}: {len(all_new_rows)}")

                if all_new_rows:
                    new_df = pd.DataFrame(all_new_rows, columns=WANTED_COLUMNS)
                    # Convert Timestamp to datetime for proper sorting
                    new_df["Timestamp"] = pd.to_datetime(new_df["Timestamp"], format="%Y-%m-%d")
                    new_df = new_df.sort_values("Timestamp")
                    new_df["Timestamp"] = new_df["Timestamp"].dt.strftime("%Y-%m-%d")

                    if os.path.exists(output_file):
                        # Append to existing file
                        new_df.to_csv(output_file, mode="a", header=False, index=False)
                        print(f"  Appended {len(new_df)} rows to {output_file}")
                    else:
                        # Create new file with header
                        new_df.to_csv(output_file, index=False)
                        print(f"  Created new file with {len(new_df)} rows: {output_file}")
                else:
                    print(f"  No new rows to append.")

    except Exception as e:
        print(f"\nAn error occurred during automation: {e}")
        traceback.print_exc()

    input("\n[DONE] Automation complete. Press ENTER to close the browser...")
    driver.quit()


if __name__ == "__main__":
    main()

import csv
import os
import shutil
import time
import traceback
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

def get_existing_files(download_dir):
    """Return a set of filenames currently in the download directory."""
    if not os.path.exists(download_dir):
        return set()
    return set(os.listdir(download_dir))

def wait_for_new_download(download_dir, files_before, timeout=120):
    """Wait for a new file to appear that wasn't in files_before."""
    seconds = 0
    while seconds < timeout:
        time.sleep(1)
        if not os.path.exists(download_dir):
            seconds += 1
            continue
            
        current_files = set(os.listdir(download_dir))
        new_files = current_files - files_before
        
        # Skip partial/temp downloads
        complete_new = [f for f in new_files if not (f.endswith('.crdownload') or f.endswith('.tmp'))]
        in_progress = [f for f in new_files if f.endswith('.crdownload') or f.endswith('.tmp')]
        
        if in_progress:
            # Still downloading, keep waiting
            seconds += 1
            continue
        
        if complete_new:
            latest_file = max([os.path.join(download_dir, f) for f in complete_new], key=os.path.getctime)
            if os.path.getsize(latest_file) > 0:
                return latest_file
        seconds += 1
    raise Exception("Download timed out")

def select_from_ng_select(driver, wait, ng_select_xpath, search_text):
    print(f"\n--- Selecting '{search_text}' ---")
    print(f"Locating ng-select at {ng_select_xpath}...")
    
    try:
        ng_select_el = driver.find_element(By.XPATH, ng_select_xpath)
    except:
        print("Could not find ng-select with absolute xpath. Falling back to tag name...")
        ng_select_els = driver.find_elements(By.TAG_NAME, "ng-select")
        if ng_select_els:
            # We just take the first one if fallback is needed, though this is risky if there are multiple.
            # Hopefully the absolute XPath works.
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
        # ng-dropdown-panel is usually a child of the ng-select when it opens
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
        time.sleep(1) # wait a moment before moving to the next dropdown
    else:
        raise Exception("Could not retrieve a valid ID from the ng-dropdown-panel.")

def main():
    # Keep downloads in a final output folder
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "downloaded_data")
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    chrome_options = Options()
    chrome_options.add_argument("--start-maximized")
    
    prefs = {
        "download.default_directory": output_dir,
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
        "safebrowsing.enabled": True,
        "profile.default_content_setting_values.automatic_downloads": 1
    }
    chrome_options.add_experimental_option("prefs", prefs)
    
    print("Initializing Chrome WebDriver...")
    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=chrome_options
    )
    
    url = "https://airquality.cpcb.gov.in/ccr/#/repository/data"
    print(f"Opening URL: {url}")
    driver.get(url)

    input("\n[CAPTCHA WAITING] Please solve the captcha in the browser, then press ENTER here to continue automation...")

    wait = WebDriverWait(driver, 15)

    try:
        print("Waiting for DOM to load...")
        time.sleep(3) 
        
        # 1. Select State: Maharashtra
        state_xpath = "/html/body/app-root/app-data-aqi-repository/div[1]/div/div[2]/app-dynamic-form/form/div/div[1]/div/ng-select"
        select_from_ng_select(driver, wait, state_xpath, "maharashtra")
        
        # 4. Click the span element (only once, sets the date range for all)
        print("\n--- Clicking the specified span (once) ---")
        span_xpath = "/html/body/app-root/app-data-aqi-repository/div[1]/div/div[3]/div/span[4]"
        span_el = wait.until(EC.element_to_be_clickable((By.XPATH, span_xpath)))
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", span_el)
        time.sleep(1)
        try:
            ActionChains(driver).move_to_element(span_el).click().perform()
        except:
            driver.execute_script("arguments[0].click();", span_el)
        time.sleep(1)
        
        csv_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cpcb_city_station.csv")
        current_city = None  # Track the current city to avoid re-selecting it
        with open(csv_file, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                city = row["City"]
                station = row["Station"]
                
                safe_city = "".join([c if c.isalnum() else "_" for c in city])
                safe_station = "".join([c if c.isalnum() else "_" for c in station])
                
                # Check if files already exist (resume support)
                existing_files = os.listdir(output_dir)
                already_has_2024 = any(f.startswith(f"{safe_city}_{safe_station}_2024") for f in existing_files)
                already_has_2025 = any(f.startswith(f"{safe_city}_{safe_station}_2025") for f in existing_files)
                
                if already_has_2024 and already_has_2025:
                    print(f"\n[SKIP] Both 2024 & 2025 files already exist for: {city} / {station}")
                    continue
                
                print(f"\n=========================================")
                print(f"Processing City: {city}, Station: {station}")
                if already_has_2024:
                    print(f"  [NOTE] 2024 already downloaded, will only fetch 2025")
                if already_has_2025:
                    print(f"  [NOTE] 2025 already downloaded, will only fetch 2024")
                print(f"=========================================")
                
                # 2. Select City (only if it changed)
                city_xpath = "/html/body/app-root/app-data-aqi-repository/div[1]/div/div[2]/app-dynamic-form/form/div/div[2]/div[1]/ng-select"
                if city != current_city:
                    print(f"City changed: {current_city} -> {city}. Selecting city...")
                    select_from_ng_select(driver, wait, city_xpath, city)
                    current_city = city
                else:
                    print(f"Same city ({city}), skipping city selection.")
                
                # 3. Select Station
                station_xpath = "/html/body/app-root/app-data-aqi-repository/div[1]/div/div[2]/app-dynamic-form/form/div/div[3]/div[1]/ng-select"
                select_from_ng_select(driver, wait, station_xpath, station)
                
                # 5. Click the button
                print("\n--- Clicking the final button ---")
                button_xpath = "/html/body/app-root/app-data-aqi-repository/div[1]/div/div[4]/button"
                button_el = wait.until(EC.element_to_be_clickable((By.XPATH, button_xpath)))
                driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", button_el)
                time.sleep(1)
                try:
                    ActionChains(driver).move_to_element(button_el).click().perform()
                except:
                    driver.execute_script("arguments[0].click();", button_el)
                    
                print(f"Submit clicked. Waiting for the table to appear...")
                time.sleep(3) # Wait a little bit for the table to render

                try:
                    # Download 2024 data — skip gracefully if button not found (some stations have no 2024 data)
                    if already_has_2024:
                        print("Skipping 2024 download (already exists).")
                    else:
                        print("Downloading 2024 data...")
                        try:
                            short_wait = WebDriverWait(driver, 5)
                            files_before_2024 = get_existing_files(output_dir)
                            button_2024_xpath = "/html/body/app-root/app-data-aqi-repository/div[2]/app-dynamic-table-view/div/div/table/tbody/tr[2]/td[6]/button"
                            btn_2024 = short_wait.until(EC.element_to_be_clickable((By.XPATH, button_2024_xpath)))
                            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", btn_2024)
                            time.sleep(1)
                            driver.execute_script("arguments[0].click();", btn_2024)
                            
                            file_2024 = wait_for_new_download(output_dir, files_before_2024)
                            print(f"2024 data downloaded: {file_2024}")
                            final_2024 = os.path.join(output_dir, f"{safe_city}_{safe_station}_2024" + os.path.splitext(file_2024)[1])
                            shutil.move(file_2024, final_2024)
                        except Exception:
                            print(f"[INFO] No 2024 data available for {station}, skipping.")

                    # Download 2025 data (skip if already exists)
                    if already_has_2025:
                        print("Skipping 2025 download (already exists).")
                    else:
                        print("Downloading 2025 data...")
                        files_before_2025 = get_existing_files(output_dir)
                        button_2025_xpath = "/html/body/app-root/app-data-aqi-repository/div[2]/app-dynamic-table-view/div/div/table/tbody/tr[1]/td[6]/button"
                        btn_2025 = wait.until(EC.element_to_be_clickable((By.XPATH, button_2025_xpath)))
                        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", btn_2025)
                        time.sleep(1)
                        driver.execute_script("arguments[0].click();", btn_2025)
                        
                        file_2025 = wait_for_new_download(output_dir, files_before_2025)
                        print(f"2025 data downloaded: {file_2025}")
                        final_2025 = os.path.join(output_dir, f"{safe_city}_{safe_station}_2025" + os.path.splitext(file_2025)[1])
                        shutil.move(file_2025, final_2025)

                except Exception as ex:
                    print(f"Error while processing table data for {station}: {ex}")
                    traceback.print_exc()

            
    except Exception as e:
        print(f"\nAn error occurred during automation: {e}")
        traceback.print_exc()
    
    input("\n[DONE] Automation complete. Press ENTER to confirm and close the browser...")
    driver.quit()

if __name__ == "__main__":
    main()
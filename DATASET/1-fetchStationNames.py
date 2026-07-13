import time
import pandas as pd

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# ================= SETUP =================
options = Options()
options.add_argument("--start-maximized")

driver = webdriver.Chrome(options=options)
wait = WebDriverWait(driver, 30)

driver.get("https://airquality.cpcb.gov.in/ccr/#/caaqm-dashboard-all/caaqm-landing/aqi-repository")
time.sleep(6)


# ================= HELPERS =================
def click(xpath):
    el = wait.until(EC.element_to_be_clickable((By.XPATH, xpath)))
    driver.execute_script("arguments[0].scrollIntoView(true);", el)
    driver.execute_script("arguments[0].click();", el)


def get_all_texts(ul_xpath):
    ul = wait.until(EC.presence_of_element_located((By.XPATH, ul_xpath)))

    last_count = 0
    while True:
        items = ul.find_elements(By.TAG_NAME, "li")
        driver.execute_script("arguments[0].scrollTop = arguments[0].scrollHeight", ul)
        time.sleep(1.5)

        new_count = len(ul.find_elements(By.TAG_NAME, "li"))

        if new_count == last_count:
            break

        last_count = new_count

    return [i.text.strip() for i in ul.find_elements(By.TAG_NAME, "li")]


def select_by_text(dropdown_xpath, ul_xpath, text):
    click(dropdown_xpath)
    time.sleep(2)

    ul = wait.until(EC.presence_of_element_located((By.XPATH, ul_xpath)))
    items = ul.find_elements(By.TAG_NAME, "li")

    for item in items:
        if item.text.strip() == text:
            driver.execute_script("arguments[0].click();", item)
            return True

    return False


# ================= INITIAL FILTERS =================
click("/html/body/app-root/app-caaqm-dashboard/div[1]/div/main/section/app-aqi-repository/div[2]/div[1]/div[2]/ng-select/div/div/div[2]")
click("/html/body/app-root/app-caaqm-dashboard/div[1]/div/main/section/app-aqi-repository/div[2]/div[1]/div[2]/ng-select/select-dropdown/div/div[2]/ul/li[2]")

click("/html/body/app-root/app-caaqm-dashboard/div[1]/div/main/section/app-aqi-repository/div[2]/div[2]/div[2]/ng-select/div/div/div[2]")
click("/html/body/app-root/app-caaqm-dashboard/div[1]/div/main/section/app-aqi-repository/div[2]/div[2]/div[2]/ng-select/select-dropdown/div/div[2]/ul/li[1]")

click("/html/body/app-root/app-caaqm-dashboard/div[1]/div/main/section/app-aqi-repository/div[2]/div[3]/div[2]/ng-select/div/div/div[2]")
click("/html/body/app-root/app-caaqm-dashboard/div[1]/div/main/section/app-aqi-repository/div[2]/div[3]/div[2]/ng-select/select-dropdown/div/div[2]/ul/li[17]")


# ================= PATHS =================
city_dropdown = "/html/body/app-root/app-caaqm-dashboard/div[1]/div/main/section/app-aqi-repository/div[2]/div[4]/div[2]/ng-select/div/div/div[2]"
city_ul = "/html/body/app-root/app-caaqm-dashboard/div[1]/div/main/section/app-aqi-repository/div[2]/div[4]/div[2]/ng-select/select-dropdown/div/div[2]/ul"

station_dropdown = "/html/body/app-root/app-caaqm-dashboard/div[1]/div/main/section/app-aqi-repository/div[2]/div[5]/div[2]/ng-select/div/div/div[2]"
station_ul = "/html/body/app-root/app-caaqm-dashboard/div[1]/div/main/section/app-aqi-repository/div[2]/div[5]/div[2]/ng-select/select-dropdown/div/div[2]/ul"

data = []

# ================= GET CITY NAMES (TEXT ONLY) =================
click(city_dropdown)
time.sleep(2)

city_names = get_all_texts(city_ul)

print("Total Cities:", len(city_names))


# ================= MAIN LOOP =================
for city in city_names:
    try:
        print("\nCity:", city)

        # select city fresh every time
        select_by_text(city_dropdown, city_ul, city)
        time.sleep(3)

        # get stations
        click(station_dropdown)
        time.sleep(2)

        station_names = get_all_texts(station_ul)

        print(f"Stations ({len(station_names)}):")

        for station in station_names:
            print("  -", station)

            data.append({
                "City": city,
                "Station": station
            })

    except Exception as e:
        print("City error:", e)
        continue


# ================= SAVE =================
df = pd.DataFrame(data)
df.to_csv("cpcb_city_station.csv", index=False)

print("\nSaved to cpcb_city_station.csv")

driver.quit()
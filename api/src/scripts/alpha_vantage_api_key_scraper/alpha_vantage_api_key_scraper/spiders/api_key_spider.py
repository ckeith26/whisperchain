# Cameron Keith
# September 24, 2023
# Single Threaded Version completed on October 23, 2023
# Multi Threaded Version completed on October __, 2023
# Econ 26 Group Project

import scrapy
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import logging
# from roi_project.items import ROIProjectItem
import pandas as pd
import time
import multiprocessing
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings
from items import AlphaVantageApiKeyScraperItem


def run_spider(colleges_subset):
    try:
        process = CrawlerProcess(get_project_settings())
        process.crawl(ROISpider, colleges=colleges_subset)
        process.start()
    except Exception as e:
        logging.error(f'Spider process failed: {str(e)}')

if __name__ == '__main__':
    # Create a list of processes
    processes = []

    # Create 10 separate processes to run the Spider concurrently, each with its subset of colleges
    for subset in college_groups:
        process = multiprocessing.Process(target=run_spider, args=(subset,))
        processes.append(process)
        process.start()

    # Wait for all processes to finish
    for process in processes:
        process.join()

class ROISpider(scrapy.Spider):
    name = 'roi_spider'
    start_urls = ['https://linkedin.com/login']

    # colleges_df = pd.read_csv('list_of_colleges.csv')

    # colleges = colleges_df.loc[:, 'institution name']
    # print(colleges.head())
    def __init__(self, colleges=None):
        self.driver = webdriver.Chrome()  # Replace with the actual path to your chromedriver executable
        self.colleges = colleges

    def login_to_linkedin(self):
        try:
            # Wait for the username field to become available
            username_field = WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.NAME, 'session_key'))
            )

            # Find the password field
            password_field = WebDriverWait(self.driver, 10).until(EC.presence_of_element_located((By.NAME, 'session_password')))

            # Enter your LinkedIn login credentials
            username_field.send_keys('silts.flex0q@icloud.com')
            password_field.send_keys('Golf#1')

            # Submit the form (e.g., press Enter)
            password_field.send_keys(Keys.RETURN)

            # Wait for the login to complete (customize the wait time as needed)
            WebDriverWait(self.driver, 100).until(
                EC.url_contains('linkedin.com/feed/')
            )

            # Check if the login was successful by inspecting the current URL or page content
            if "My Network" in self.driver.page_source:
                self.logger.info('Logged in successfully!')

        except Exception as e:
            self.logger.error(f'Login failed: {str(e)}')

    def search_for_college(self, college_name):
        try:
            # Locate the search bar element
            search_bar = WebDriverWait(self.driver, 10).until(EC.presence_of_element_located((By.CLASS_NAME, 'search-global-typeahead__input')))

            # Clear the search bar in case there is any previous text
            search_bar.clear()

            # Enter the college name in the search bar
            search_bar.send_keys(college_name)

            # Submit the search
            search_bar.send_keys(Keys.RETURN)

            # Wait for the search results to load (you can adjust the wait time)
            WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.CLASS_NAME, 'search-results-container'))
            )

        except Exception as e:
            self.logger.error(f'Search for college failed: {str(e)}')

    def click_first_college(self, college):
        try:
            link_text = college
            link = WebDriverWait(self.driver, 10).until(EC.presence_of_element_located((By.LINK_TEXT, link_text)))

            # Click the link
            link.click()
            return True
        except Exception as e:
            self.logger.error(f'Error while clicking the first college element: {str(e)}')

    def click_alumni_link(self):
        try:
            link_text = "Alumni"
            link = WebDriverWait(self.driver, 10).until(EC.element_to_be_clickable((By.LINK_TEXT, link_text)))

            # Click the link
            link.click()
            return True

        except Exception as e:
            self.logger.error(f'Error while clicking the Alumni link: {str(e)}')

    def input_year_and_search(self, year):
        try:
            search_year_field = WebDriverWait(self.driver, 5).until(EC.presence_of_element_located((By.ID, 'people-search-keywords')))
            search_year_field.send_keys(year)
            search_year_field.send_keys(Keys.RETURN)

        except Exception as e:
            self.logger.error(f'Error inputting year and searching: {str(e)}')
            self.driver.refresh()
            self.clear_search()
            self.show_more()
            self.scroll_right()
            self.scroll_right()
            self.input_year_and_search(year)

    def clear_search(self):
        try:
            clear_all_button = WebDriverWait(self.driver, 10).until(EC.element_to_be_clickable((By.XPATH, "//button[text()='Clear all']")))

            # Click the button
            clear_all_button.click()

        except Exception as e:
            self.logger.error(f"Year input and search failed: {str(e)}")

    def show_more(self):
        try:
            # Find the "Show more" button by its attributes
            show_more_button = WebDriverWait(self.driver, 10).until(EC.element_to_be_clickable((By.XPATH, "//button[text()='Show more']")))

            # Click the button
            show_more_button.click()

        except Exception as e:
            self.logger.error(f"Show more button failed: {str(e)}")

    def search_for_column_items(self, pos):
        try:
            columns = WebDriverWait(self.driver, 10).until(EC.presence_of_all_elements_located((By.CLASS_NAME, 'insight-container')))

            item_column = columns[pos]
            try:
                items = WebDriverWait(item_column, 10).until(EC.presence_of_all_elements_located((By.TAG_NAME, 'button')))
            except Exception as e:
                items = []

            return items

        except Exception as e:
            self.logger.error(f"Failed to find all columns: {str(e)}")
            # time.sleep(0.5)
            # self.driver.refresh()
            # self.show_more()
            # self.scroll_right()
            # self.scroll_right()
            # self.search_for_column_items(pos)

    def scroll_right(self):
        try:
            right_button = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.XPATH, '//button[@aria-label="Next"]'))
            )
            right_button.click()
        except Exception as e:
            self.logger.error(f"Scroll right failed: {str(e)}")
            # time.sleep(0.5)
            # self.driver.refresh()
            # self.show_more()
            # self.scroll_right()
    def get_company(self, company, item):
        try:
            company_list = self.search_for_column_items(0)[1:]
            comp = WebDriverWait(self.driver, 10).until(EC.element_to_be_clickable(company_list[company]))
            company_name = WebDriverWait(comp, 10).until(EC.element_to_be_clickable((By.CLASS_NAME, 'org-people-bar-graph-element__category'))).text
            company_alums = WebDriverWait(comp, 10).until(EC.element_to_be_clickable((By.TAG_NAME, 'strong'))).text
            item['company'] = [company_name, company_alums]

            comp.click()

        except Exception as e:
            self.logger.error(f"get company degree Failed: {str(e)}")
            # time.sleep(0.5)
            # self.driver.refresh()
            # self.show_more()
            # self.scroll_right()
            # self.scroll_right()
            # self.get_company(company, item)
    def get_location(self, item):
        try: 
            locations = self.search_for_column_items(0)[1:]
            list_loc = []
            list_loc_weights = []
            time.sleep(1)
            for location in locations:
                location_element = WebDriverWait(location, 10).until(EC.element_to_be_clickable((By.CLASS_NAME, 'org-people-bar-graph-element__category')))
                loc = location_element.text
                list_loc.append(loc)
                weight_element = WebDriverWait(location, 10).until(EC.element_to_be_clickable((By.TAG_NAME, 'strong')))
                loc_weight = weight_element.text
                list_loc_weights.append(loc_weight)

            item['location'] = [list_loc, list_loc_weights]

        except Exception as e:
            self.logger.error(f"Location Failed: {str(e)}")
            # time.sleep(0.5)
            # self.driver.refresh()
            # self.show_more()
            # self.scroll_right()
            # self.scroll_right()
            # self.get_location(item)

    def get_job(self, item):
        try:
            job_positions = self.search_for_column_items(1)
            list_jobs = []
            list_job_weights = []
            time.sleep(1)
            for job in job_positions:
                job_element = WebDriverWait(job, 10).until(EC.element_to_be_clickable((By.CLASS_NAME, 'org-people-bar-graph-element__category')))
                j = job_element.text
                list_jobs.append(j)
                weight_element = WebDriverWait(job, 10).until(EC.element_to_be_clickable((By.TAG_NAME, 'strong')))
                job_weight = weight_element.text
                list_job_weights.append(job_weight)

            item['job_title'] = [list_jobs, list_job_weights]
        except Exception as e:
            self.logger.error(f"Job position Failed: {str(e)}")
            time.sleep(0.5)
            self.driver.refresh()
            self.show_more()
            self.scroll_right()
            self.scroll_right()
            self.get_job(item)

    def get_skill(self, item):
        try:
            skills = self.search_for_column_items(2)[1:]
            list_skills = []
            list_skill_weights = []
            time.sleep(1)
            for skill in skills:
                skill_element = WebDriverWait(skill, 10).until(EC.element_to_be_clickable((By.CLASS_NAME, 'org-people-bar-graph-element__category')))
                sk = skill_element.text
                list_skills.append(sk)
                weight_element = WebDriverWait(skill, 10).until(EC.element_to_be_clickable((By.TAG_NAME, 'strong')))
                skill_weight = weight_element.text
                list_skill_weights.append(skill_weight)

            item['skills'] = [list_skills, list_skill_weights]

        except Exception as e:
            self.logger.error(f"Skills Failed: {str(e)}")
            # time.sleep(0.5)
            # self.driver.refresh()
            # self.show_more()
            # self.scroll_right()
            # self.scroll_right()
            # self.get_skill(item)

    def parse(self, response):
        selenium_logger = logging.getLogger('selenium.webdriver.remote.remote_connection')
        selenium_logger.setLevel(logging.CRITICAL)

        self.driver.get('https://linkedin.com/login')

        self.login_to_linkedin()

        # colleges_df = pd.read_csv('list_of_colleges.csv')
        # colleges = colleges_df.loc[:, 'institution name']   

        for college in self.colleges:

            self.search_for_college(college)
            if not self.click_first_college(college):
                continue
            if not self.click_alumni_link():
                continue

            self.show_more()

            for year in range(2000, 2023):
                item = ROIProjectItem()
                item['college'] = college
                item['gradyear'] = year
                item['YOE'] = abs(2023 - year)

                self.input_year_and_search(str(year))
                self.scroll_right()
                self.scroll_right()
                self.scroll_right()
                degrees = self.search_for_column_items(2)[1:]
                if degrees == []:
                    continue

                for degree in range(len(degrees)):
                    self.clear_search()

                    self.input_year_and_search(str(year))

                    self.scroll_right()
                    self.scroll_right()
                    self.scroll_right()

                    degrees_new = self.search_for_column_items(2)[1:]

                    deg = WebDriverWait(self.driver, 10).until(EC.element_to_be_clickable(degrees_new[degree]))
                    major_element = WebDriverWait(deg, 10).until(
                        EC.presence_of_element_located((By.CLASS_NAME, 'org-people-bar-graph-element__category'))
                    )
                    major = major_element.text
                    number_alumni = WebDriverWait(deg, 10).until(EC.presence_of_element_located((By.TAG_NAME, 'strong'))).text
                    deg.click()
                    
                    item['degree'] = [major, number_alumni]

                    companies = self.search_for_column_items(0)[1:]
                    for company in range(len(companies)):
                        
                        self.get_company(company, item)

                        self.scroll_right()
                        self.scroll_right()

                        self.get_location(item)
                        self.get_job(item)
                        self.get_skill(item)

                        yield item
                        self.driver.back()
                    self.driver.back()

    def closed(self, reason):
        self.driver.quit()
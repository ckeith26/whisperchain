import scrapy
import random
import string

class ApiKeySpider(scrapy.Spider):
    name = "api_key_spider"
    start_urls = ['https://www.alphavantage.co/support/#api-key']

    def __init__(self):
        self.keys = []

    def parse(self, response):
        # for _ in range(500):
        form_data = {
            'occupation': random.choice([
                'Investor', 'Software Developer', 'Educator', 'Student', 'Other'
            ]),
            'organization': self.random_organization(),
            'email': self.random_email()
        }

        yield scrapy.FormRequest.from_response(
            response,
            formdata=form_data,
            callback=self.after_submit
        )

    def after_submit(self, response):
        self.log('test', response)
        api_key = response.xpath('//p[@id="talk"]/text()').re_first(r'Your API key is: (\\w+)')

        if api_key:
            self.keys.append(api_key)
            print(f"API Key: {api_key}")
            with open("keys.txt", "a") as file:
                file.write(f"{api_key}\\n")
        else:
            self.log("Failed to retrieve API key.")

    def random_organization(self):
        return ''.join(random.choices(string.ascii_uppercase + string.ascii_lowercase, k=10)) + " Inc."

    def random_email(self):
        domains = ["example.com", "test.com", "email.com"]
        username = ''.join(random.choices(string.ascii_lowercase, k=8))
        domain = random.choice(domains)
        return f"{username}@{domain}"

package com.hui.rest.webservices.restfulwebservices.news;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import java.io.IOException;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;

//Controller to handle the financial news related queries
@RestController
public class FinancialNewsResource {

    //Process the GET method to retrieve news from the API
    @GetMapping("/financial-news")
    public List<FinancialNews> retrieveAllNews() {
        //Declare a list to store the news
        List<FinancialNews> news = new ArrayList<>();

        //Declare a REST template to make an HTTP request
        RestTemplate restTemplate = new RestTemplate();

        //Declare the resource URL
        String fooResourceUrl = "https://mboum-finance.p.rapidapi.com/ne/news";

        //Declare the new Headers for the HTTP request and add the required API keys
        HttpHeaders headers = new HttpHeaders();
        headers.add("X-RapidAPI-Key", "03939cc397msh8dcd64407a76398p17c483jsncfe1fcb69495");
        headers.add("X-X-RapidAPI-Host-Key", "mboum-finance.p.rapidapi.com");

        //Declare the new entity with the created headers
        HttpEntity entity = new HttpEntity<>(headers);

        try {
            //Build a URI object by parse the URL in string type
            URI uri = UriComponentsBuilder.fromUriString(fooResourceUrl)
                    .build()
                    .toUri();

            //Use REST template to make an HTTP GET request to the built URI for a string type response
            ResponseEntity<String> responseEntity = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);

            // Check if the response status is OK
            if (responseEntity.getStatusCode().is2xxSuccessful()) {

                //Declare a string type variable to store the response body
                String responseBody = responseEntity.getBody();

                //Create a new ObjectMapper object and extract the data from the response body to a JSON node object
                ObjectMapper objectMapper = new ObjectMapper();
                JsonNode jsonNode = objectMapper.readTree(responseBody);

                //Declare a JSON node variable to store the body of the JSON node
                JsonNode dataArray = jsonNode.get("body");

                //Check if the JSON node is an array
                if (dataArray.isArray()) {

                    //Initialize a variable to count the number of news
                    int count = 0;

                    //Iterate the JSON node array to retrieve all news and store them into the list
                    for (JsonNode articleNode : dataArray) {

                        //Set the amount of the news to be 8 to showcase on the frontend
                        if (count < 8) {
                            //Declare variables to extract and store the titles and URLs in each loop
                            String headline = articleNode.path("title").asText();
                            String url = articleNode.path("link").asText();

                            //Declare a financial news object
                            FinancialNews financialNews = new FinancialNews();

                            //Set the title and URL in the financial news object
                            financialNews.setHeadline(headline);
                            financialNews.setUrl(url);

                            //Append each financial news in the list
                            news.add(financialNews);

                            //Log the headlines and URLs on the console
                            System.out.println("title：" + headline);
                            System.out.println("URL：" + url);

                            count++;
                        }
                    }
                }


            } else {
                // Handle failed response
                System.out.println("Error: " + responseEntity.getStatusCodeValue());
            }

        } catch (RestClientException | IOException e) {
            // Handle exception cases
            e.printStackTrace();
        }
        return news;
    }
}

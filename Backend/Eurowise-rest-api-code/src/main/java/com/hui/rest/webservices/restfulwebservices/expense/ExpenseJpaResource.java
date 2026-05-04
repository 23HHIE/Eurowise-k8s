package com.hui.rest.webservices.restfulwebservices.expense;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hui.rest.webservices.restfulwebservices.expense.repository.ExpenseRepository;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import java.io.IOException;
import java.net.URI;
import java.util.List;

//Controller class to handle HTTP requests and return response objects
@RestController
public class ExpenseJpaResource {

    //Dependency injection
    private ExpenditureListService expenseService;

    //Dependency injection
    private ExpenseRepository expenseRepository;

    //Constructor dependency injection
    public ExpenseJpaResource(ExpenditureListService expenseService, ExpenseRepository expenseRepository) {
        this.expenseService = expenseService;
        this.expenseRepository = expenseRepository;
    }

    //Process the GET method to handle requests for retrieving expenses by given type
    @GetMapping("/{type}/expenses")
    public List<ExpenditureList> retrieveExpense(@PathVariable String type) {
        return expenseService.findByType(type);
    }

    //Process the GET method to handle requests by given username, currency, and type which is an optional parameter
    @GetMapping("/{username}/expenses/{currency}")
    public List<ExpenditureList> retrieveExpenses(@PathVariable String username,
                                                  @PathVariable String currency,
                                                  @RequestParam(required = false) String type) {
        //Initialize the result list
        List<ExpenditureList> expenditures = null;

        //Retrieve expenses based on the given username and the optional parameter type
        //Filter the expenses by given type if the type is provided
        if (type != null && !type.isEmpty()) {
            expenditures = expenseRepository.findByUsernameAndTypeContains(username, type);
        } else {
            //Retrieve all expenses if the type value is empty or not provided
            expenditures = expenseRepository.findByUsername(username);
        }

        //Iterate through the retrieved expenses to exchange the currency using the external resource
        for (ExpenditureList exp : expenditures) {

            //Create a new REST template for the request
            RestTemplate restTemplate = new RestTemplate();

            //Define the source URL from the external resource
            String fooResourceUrl = "https://currency-converter-by-api-ninjas.p.rapidapi.com/v1/convertcurrency";

            //Create a new headers for the request
            HttpHeaders headers = new HttpHeaders();

            //Add required API keys to the headers
            headers.add("X-RapidAPI-Key", "03939cc397msh8dcd64407a76398p17c483jsncfe1fcb69495");
            headers.add("X-X-RapidAPI-Host-Key", "currency-converter-by-api-ninjas.p.rapidapi.com");

            //Create a new entity object with the created headers
            HttpEntity entity = new HttpEntity<>(headers);

            try {
                // Build the URI to communicate with the external resource by providing query parameters
                URI uri = UriComponentsBuilder.fromUriString(fooResourceUrl)
                        .queryParam("have", "EUR")
                        .queryParam("amount", String.valueOf(exp.getFee()))
                        .queryParam("want", currency)
                        .queryParam("type", type)
                        .build()
                        .toUri();

                //Use REST template to make a HTTP GET request to the built URI for a string type response
                ResponseEntity<String> responseEntity = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);

                //Store the value of exchanged fee amount if the status of response is OK
                if (responseEntity.getStatusCode().is2xxSuccessful()) {
                    //Parse the JSON response body to string type and store the result
                    String responseBody = responseEntity.getBody();

                    //Create a new ObjectMapper object
                    ObjectMapper objectMapper = new ObjectMapper();

                    //Create a JSON node object to store the data which is extracted from the response body
                    JsonNode jsonNode = objectMapper.readTree(responseBody);

                    //Create a double variable to store the value extracted from the JSON node object
                    double result = jsonNode.get("new_amount").asDouble();

                    //Update the fee amount of the expenses with the exchanged result
                    exp.setFee(result);
                } else {
                    // Handle failed response
                    System.out.println("Error: " + responseEntity.getStatusCodeValue());
                }
            } catch (RestClientException | IOException e) {
                // Handle RestClientException
                e.printStackTrace();
            }
        }
        return expenditures;
    }

    //Process the GET method to handle a request for retrieving a targeted expense by given id
    @GetMapping("/users/{username}/expenses/{id}")
    public ExpenditureList retrieveExpenses(@PathVariable String username, @PathVariable int id) {
        return expenseRepository.findById(id).orElse(new ExpenditureList());
    }

    //Process the DELETE method to handle a request for deleting a targeted expense
    @DeleteMapping("/users/{username}/expenses/{id}")
    public ResponseEntity<Void> deleteExpenses(@PathVariable String username, @PathVariable int id) {
        //Delete the data through the repository
        expenseRepository.deleteById(id);

        //Return a response with no content after deletion
        return ResponseEntity.noContent().build();

    }

    //Process the PUT method to handle a request for modifying a targeted expense
    @PutMapping("/users/{username}/expenses/{id}")
    public ExpenditureList updateExpenses(@PathVariable String username,
                                          @PathVariable int id,
                                          @RequestBody ExpenditureList expense) {
        //Store the modified expense to the repository
        expenseRepository.save(expense);
        return expense;
    }

    //Process the POST method to handle a request for creating a new expense
    @PostMapping("/users/{id}/expense")
    public ExpenditureList createExpenses(@PathVariable String username,
                                          @RequestBody ExpenditureList expense) {

        //Set the username for the new expense and map the data relationship with the user repository
        expense.setUsername(username);

        //Set the id to null so that the primary key can generated automatically and be unique
        expense.setId(null);

        //Store the expense in the repository and return the list
        return expenseRepository.save(expense);
    }

}

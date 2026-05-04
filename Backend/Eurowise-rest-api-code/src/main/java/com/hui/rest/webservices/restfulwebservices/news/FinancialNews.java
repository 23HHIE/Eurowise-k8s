package com.hui.rest.webservices.restfulwebservices.news;


import jakarta.persistence.GeneratedValue;
import lombok.Data;

//Define a class to describe financial news
@Data
public class FinancialNews {

    //Properties of the financial news
    @GeneratedValue
    private String id;
    private String headline;
    private String url;

}

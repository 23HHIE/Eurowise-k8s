package com.hui.rest.webservices.restfulwebservices.security;

import lombok.Data;

//Define a response object
@Data
public class Response<T> {
    //The status of the response
    private int status;

    //The message content of the response
    private String message;

    //The generic data of the response
    private T data;

    //The total pages of the response
    private int totalPages;

    //The total elements of the response
    private Long totalElements;

    //The number of the page of the response
    private int page;

    //Constructor with basic information for the response
    private Response(int status, String message, T data){
        this.status = status;
        this.message = message;
        this.data = data;
    }
    //Constructor with default status and message for the response
    private Response(T data, int totalPages, Long totalElements, int page){
        this.status = 200;
        this.message = "success";
        this.data = data;
        this.totalPages = totalPages;
        this.totalElements = totalElements;
        this.page = page;
    }

    //Define a successful response with the parameter data
    public static<T> Response<T> success(T data){
        return new Response(200, "success", data);
    }

    //Define a successful response with extended parameters
    public static<T> Response<T> success(T data, int totalPages, Long totalElements, int page){
        return new Response(data, totalPages, totalElements, page);
    }
}
